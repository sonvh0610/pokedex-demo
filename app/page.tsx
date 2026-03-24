import Link from 'next/link';

const LIMIT = 20;

const getGifUrl = (id: string) => 
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;

interface PokeApiModel {
  id: number;
  name: string;
  image: string;
}

const mapPokemonData = (pokemon: { name: string; url: string }): PokeApiModel => {
  const segments = pokemon.url.split('/').filter(Boolean);
  const id = segments[segments.length - 1];
  return {
    id: parseInt(id, 10),
    name: pokemon.name,
    image: getGifUrl(id),
  };
};

async function getTypes() {
  const res = await fetch('https://pokeapi.co/api/v2/type', { next: { revalidate: 3600 } });
  const data = await res.json();
  return data.results.filter((t: { name: string; url: string }) => !['unknown', 'shadow'].includes(t.name));
}

async function getPokemons(page: number, selectedTypes: string[]) {
  const offset = (page - 1) * LIMIT;
  let results: PokeApiModel[] = [];
  let count = 0;

  if (selectedTypes.length > 0) {
    const responses = await Promise.all(
      selectedTypes.map((type) => fetch(`https://pokeapi.co/api/v2/type/${type}`).then(res => res.ok ? res.json() : null))
    );
    
    let allPokemonRaw: { name: string; url: string }[] = [];
    
    responses.forEach((data, index) => {
      if (!data) return;
      const typePokemon = data.pokemon.map((p: { pokemon: { name: string; url: string } }) => p.pokemon);
      if (index === 0) {
         allPokemonRaw = typePokemon;
      } else {
         allPokemonRaw = allPokemonRaw.filter(p1 => typePokemon.some((p2: { name: string; url: string }) => p2.name === p1.name));
      }
    });

    count = allPokemonRaw.length;
    results = allPokemonRaw.slice(offset, offset + LIMIT).map(mapPokemonData);
  } else {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${LIMIT}`);
    if (!res.ok) return { results: [], count: 0 };
    const data = await res.json();
    count = data.count;
    results = data.results.map(mapPokemonData);
  }

  return { results, count };
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  
  const pageParam = typeof searchParams.page === 'string' ? searchParams.page : '1';
  const typeParam = searchParams.type;
  
  const selectedTypes: string[] = Array.isArray(typeParam) 
    ? typeParam 
    : (typeof typeParam === 'string' ? [typeParam] : []);
    
  const page = parseInt(pageParam, 10);

  const types = await getTypes();
  const { results, count } = await getPokemons(page, selectedTypes);

  const totalPages = Math.ceil(count / LIMIT);

  const prevQuery = new URLSearchParams();
  selectedTypes.forEach(t => prevQuery.append('type', t));
  prevQuery.set('page', (page - 1).toString());
  const prevUrl = page > 1 ? `/?${prevQuery.toString()}` : null;

  const nextQuery = new URLSearchParams();
  selectedTypes.forEach(t => nextQuery.append('type', t));
  nextQuery.set('page', (page + 1).toString());
  const nextUrl = page < totalPages ? `/?${nextQuery.toString()}` : null;

  return (
    <section className="flex flex-col gap-4 px-10">
      <p className="py-4 text-center">Welcome to Pokemon world</p>
      <p>Total: {count}</p>
      
      <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span>Types:</span>
        <Link 
          className={`border p-4 ${selectedTypes.length === 0 ? "bg-blue-500 text-white" : ""}`} 
          href="/"
        >
          All
        </Link>
        {types.map((t: { name: string; url: string }) => {
          const isSelected = selectedTypes.includes(t.name);
          const newSelected = isSelected 
            ? selectedTypes.filter(st => st !== t.name)
            : [...selectedTypes, t.name];
          
          const query = new URLSearchParams();
          newSelected.forEach(st => query.append('type', st));
          // Note: when changing types, always reset to page 1 implicitly by omitted ?page=
          
          return (
            <Link 
              key={t.name} 
              className={`border p-4 ${isSelected ? "bg-blue-500 text-white" : ""}`} 
              href={newSelected.length > 0 ? `/?${query.toString()}` : "/"}
            >
              {t.name}
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-6 gap-x-16 gap-y-6">
        {results.map((pokemon) => (
          <div key={pokemon.id} className="flex flex-col items-center justify-between border p-4">
            <h3>{pokemon.name}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              alt={pokemon.name} 
              loading="lazy" 
              width="35" 
              height="53" 
              className="w-20" 
              src={pokemon.image} 
            />
            <p>Number: {pokemon.id}</p>
          </div>
        ))}
      </section>

      <div className="flex justify-center gap-4 py-4">
        {prevUrl && (
          <Link className="rounded bg-blue-500 px-4 py-2 text-white" href={prevUrl}>
            Prev
          </Link>
        )}
        {nextUrl && (
          <Link className="rounded bg-blue-500 px-4 py-2 text-white" href={nextUrl}>
            Next
          </Link>
        )}
      </div>
    </section>
  );
}
