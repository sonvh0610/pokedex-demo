/**
 * Generic named resource from PokeAPI (name + url).
 * Matches: /api/v2/type results, /api/v2/pokemon results, etc.
 */
export interface NamedAPIResource {
  name: string;
  url: string;
}

/**
 * UI model for Pokemon display (derived from NamedAPIResource).
 */
export interface PokeApiModel {
  id: number;
  name: string;
  image: string;
}

/**
 * One entry in /api/v2/type/{id} pokemon array.
 * Matches PokeAPI: { pokemon: { name, url }, slot }.
 */
export interface TypePokemonEntry {
  pokemon: NamedAPIResource;
  slot: number;
}

/**
 * Response from /api/v2/type/{id} (single type detail).
 */
export interface TypeDetailResponse {
  id: number;
  name: string;
  pokemon: TypePokemonEntry[];
}

/**
 * Response shape returned by our internal /api/pokemon route.
 * Includes server-computed pagination navigation URLs.
 */
export interface PokemonPageResponse {
  results: PokeApiModel[];
  count: number;
  currentPage: number;
  totalPages: number;
  prevUrl: string | null;
  nextUrl: string | null;
}

/**
 * Response from /api/v2/type (type list) and our /api/pokemon-types.
 * Matches PokeAPI: { results: [{ name, url }, ...] }.
 */
export interface TypesApiResponse {
  results: NamedAPIResource[];
}
