import { NextRequest, NextResponse } from 'next/server';

const LIMIT = 20;

const getGifUrl = (id: string) => 
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;

interface PokeApiResult {
  name: string;
  url: string;
}

const mapPokemonData = (pokemon: PokeApiResult) => {
  const segments = pokemon.url.split('/').filter(Boolean);
  const id = segments[segments.length - 1];
  return {
    id: parseInt(id, 10),
    name: pokemon.name,
    image: getGifUrl(id),
  };
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const type = searchParams.get('type');
  const offset = (page - 1) * LIMIT;

  try {
    let results = [];
    let count = 0;
    let next = null;
    let previous = null;

    if (type) {
      // Fetch type-specific pokemon (no native pokeapi pagination)
      const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
      if (!res.ok) {
        return NextResponse.json({ error: 'Type not found' }, { status: 404 });
      }
      const data = await res.json();
      const allPokemonsOfType = data.pokemon.map((p: any) => p.pokemon);
      
      count = allPokemonsOfType.length;
      const paginatedSlice = allPokemonsOfType.slice(offset, offset + LIMIT);
      results = paginatedSlice.map(mapPokemonData);
      
      if (offset + LIMIT < count) next = `/?type=${type}&page=${page + 1}`;
      if (page > 1) previous = `/?type=${type}&page=${page - 1}`;
      
    } else {
      // Standard paginated fetch
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${LIMIT}`);
      const data = await res.json();
      
      count = data.count;
      results = data.results.map(mapPokemonData);
      
      if (data.next) next = `/?page=${page + 1}`;
      if (data.previous) previous = `/?page=${page - 1}`;
    }

    return NextResponse.json({
      results,
      count,
      next,
      previous,
      currentPage: page,
      totalPages: Math.ceil(count / LIMIT)
    });

  } catch (error) {
    console.error('Failed to fetch pokemon:', error);
    return NextResponse.json({ error: 'Failed to fetch pokemon' }, { status: 500 });
  }
}
