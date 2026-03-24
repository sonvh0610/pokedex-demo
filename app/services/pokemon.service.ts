import { NamedAPIResource, PokemonPageResponse } from "@/types/pokemon";
import { logger } from "@/app/lib/logger";
import { fetchPokemons, fetchTypes } from "@/app/lib/pokeapi";

/**
 * Fetches the available Pokemon types from the PokeAPI.
 * Calls the logic directly to avoid unneeded internal HTTP requests during SSR/SSG.
 * @returns Array of valid Pokemon types.
 */
export async function getTypes(): Promise<NamedAPIResource[]> {
  try {
    return await fetchTypes();
  } catch (error) {
    logger.error("getTypes failed", error);
    return [];
  }
}

/**
 * Fetches a paginated and optionally type-filtered list of Pokemon from PokeAPI.
 * @param page - The current page number (1-indexed).
 * @param selectedTypes - Type names to filter by (intersection).
 * @returns Full page response including prevUrl/nextUrl.
 */
export async function getPokemons(
  page: number,
  selectedTypes: string[],
): Promise<PokemonPageResponse> {
  const fallback: PokemonPageResponse = {
    results: [],
    count: 0,
    currentPage: page,
    totalPages: 0,
    prevUrl: null,
    nextUrl: null,
  };

  try {
    return await fetchPokemons(page, selectedTypes);
  } catch (error) {
    logger.error("getPokemons failed", error);
    return fallback;
  }
}
