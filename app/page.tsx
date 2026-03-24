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

async function getPokemons(page: number, type?: string) {
  const offset = (page - 1) * LIMIT;
  let results: PokeApiModel[] = [];
  let count = 0;

  if (type) {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    if (!res.ok) return { results: [], count: 0 };
    const data = await res.json();
    const all = data.pokemon.map((p: { pokemon: { name: string; url: string } }) => p.pokemon);
    count = all.length;
    results = all.slice(offset, offset + LIMIT).map(mapPokemonData);
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
  const typeParam = typeof searchParams.type === 'string' ? searchParams.type : undefined;
  
  const page = parseInt(pageParam, 10);

  const types = await getTypes();
  const { results, count } = await getPokemons(page, typeParam);

  const totalPages = Math.ceil(count / LIMIT);

  const prevQuery = new URLSearchParams();
  if (typeParam) prevQuery.set('type', typeParam);
  prevQuery.set('page', (page - 1).toString());
  const prevUrl = page > 1 ? `/?${prevQuery.toString()}` : null;

  const nextQuery = new URLSearchParams();
  if (typeParam) nextQuery.set('type', typeParam);
  nextQuery.set('page', (page + 1).toString());
  const nextUrl = page < totalPages ? `/?${nextQuery.toString()}` : null;

  return (
    <section className="flex flex-col gap-4 px-10">
      <p className="py-4 text-center">Welcome to Pokemon world</p>
      <p>Total: {count}</p>
      
      <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span>Types:</span>
        <Link className="border p-4" href="/">All</Link>
        {types.map((t: { name: string; url: string }) => (
          <Link key={t.name} className="border p-4" href={`/?type=${t.name}`}>
            {t.name}
          </Link>
        ))}
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
