/**
 * Represents a generic named resource endpoint in PokeAPI.
 */
export interface NamedAPIResource {
  name: string;
  url: string;
}

/**
 * Standard data model for a mapped Pokemon to be displayed on the UI.
 */
export interface PokeApiModel {
  id: number;
  name: string;
  image: string;
}

/**
 * Basic Pokemon metadata obtained from listing endpoints.
 */
export interface PokemonListItem {
  name: string;
  url: string;
}

/**
 * Response structure for fetching a list of Pokemon types.
 */
export interface TypeListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

/**
 * Response structure for fetching a list of generic Pokemons.
 */
export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

/**
 * Response structure for a specific Pokemon Type endpoint, identifying associated Pokemons.
 */
export interface PokemonTypeResponse {
  id: number;
  name: string;
  pokemon: Array<{
    pokemon: NamedAPIResource;
    slot: number;
  }>;
}

/**
 * General response representing either a filtered or all-encompassing Pokemon fetch.
 */
export interface GetPokemonsResult {
  results: PokeApiModel[];
  count: number;
}
