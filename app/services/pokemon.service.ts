import { NamedAPIResource, PokemonPageResponse, TypesApiResponse } from "@/types/pokemon";
import { logger } from "@/app/lib/logger";

/**
 * Resolves the absolute base URL for internal API calls.
 * Required for server-side fetch calls in Next.js which need a full URL,
 * not a relative path.
 */
const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * Fetches the available Pokemon types from our internal API.
 * @returns {Promise<NamedAPIResource[]>} Array of valid Pokemon types.
 */
export async function getTypes(): Promise<NamedAPIResource[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/pokemon-types`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`/api/pokemon-types responded with ${res.status}`);
    }
    const data: TypesApiResponse = await res.json();
    return data.results;
  } catch (error) {
    logger.error("getTypes failed", error);
    return [];
  }
}

/**
 * Fetches a paginated and optionally type-filtered list of Pokemon
 * from our internal API. The API handles all pagination URL computation.
 * @param {number} page - The current page number (1-indexed).
 * @param {string[]} selectedTypes - Type names to filter by (intersection).
 * @returns {Promise<PokemonPageResponse>} Full page response including prevUrl/nextUrl.
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
    const query = new URLSearchParams();
    query.set("page", page.toString());
    if (selectedTypes.length > 0) query.set("type", selectedTypes.join(","));

    const res = await fetch(`${getBaseUrl()}/api/pokemon?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`/api/pokemon responded with ${res.status}`);
    }
    return (await res.json()) as PokemonPageResponse;
  } catch (error) {
    logger.error("getPokemons failed", error);
    return fallback;
  }
}
