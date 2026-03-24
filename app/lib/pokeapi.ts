import {
  NamedAPIResource,
  PokeApiModel,
  PokemonPageResponse,
  TypeDetailResponse,
} from "@/types/pokemon";

const LIMIT = 24;
const POKEAPI_BASE = "https://pokeapi.co/api/v2";

const getGifUrl = (id: string): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;

const mapPokemonData = (pokemon: NamedAPIResource): PokeApiModel => {
  const segments = pokemon.url.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  return { id: parseInt(id, 10), name: pokemon.name, image: getGifUrl(id) };
};

const buildPaginationUrls = (
  page: number,
  totalPages: number,
  selectedTypes: string[],
): { prevUrl: string | null; nextUrl: string | null } => {
  const buildQuery = (targetPage: number): string => {
    const query = new URLSearchParams();
    if (selectedTypes.length > 0) query.set("type", selectedTypes.join(","));
    query.set("page", targetPage.toString());
    return query.toString();
  };

  return {
    prevUrl: page > 1 ? `/?${buildQuery(page - 1)}` : null,
    nextUrl: page < totalPages ? `/?${buildQuery(page + 1)}` : null,
  };
};

/** Fetches all Pokemon types from PokeAPI. */
export async function fetchTypes(): Promise<NamedAPIResource[]> {
  const res = await fetch(`${POKEAPI_BASE}/type`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`PokeAPI responded with ${res.status}`);
  const data = await res.json();
  return data.results;
}

/**
 * Fetches a paginated list of Pokemon from PokeAPI, optionally filtered by type.
 * Multi-type filter uses intersection logic (Pokemon must have all selected types).
 */
export async function fetchPokemons(
  page: number,
  selectedTypes: string[],
): Promise<PokemonPageResponse> {
  const offset = (page - 1) * LIMIT;

  let results: PokeApiModel[] = [];
  let count = 0;

  if (selectedTypes.length > 0) {
    const responses = await Promise.all(
      selectedTypes.map((type) =>
        fetch(`${POKEAPI_BASE}/type/${type}`).then((res) =>
          res.ok ? (res.json() as Promise<TypeDetailResponse>) : null,
        ),
      ),
    );

    const allPokemonRaw = responses.reduce<NamedAPIResource[]>(
      (acc, data, index) => {
        if (!data) return acc;
        const typePokemon = data.pokemon.map((p) => p.pokemon);
        return index === 0
          ? typePokemon
          : acc.filter((p1) => typePokemon.some((p2) => p2.name === p1.name));
      },
      [],
    );

    count = allPokemonRaw.length;
    results = allPokemonRaw.slice(offset, offset + LIMIT).map(mapPokemonData);
  } else {
    const res = await fetch(
      `${POKEAPI_BASE}/pokemon?offset=${offset}&limit=${LIMIT}`,
    );
    if (!res.ok) throw new Error(`PokeAPI responded with ${res.status}`);
    const data = await res.json();
    count = data.count;
    results = data.results.map(mapPokemonData);
  }

  const totalPages = Math.ceil(count / LIMIT);
  const { prevUrl, nextUrl } = buildPaginationUrls(
    page,
    totalPages,
    selectedTypes,
  );

  return {
    results,
    count,
    currentPage: page,
    totalPages,
    prevUrl,
    nextUrl,
  };
}
