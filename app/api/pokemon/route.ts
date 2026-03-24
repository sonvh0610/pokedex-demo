import { NextRequest, NextResponse } from "next/server";
import { logger } from "../../lib/logger";
import {
  NamedAPIResource,
  PokeApiModel,
  PokemonTypeResponse,
  PokemonPageResponse,
} from "@/types/pokemon";

const LIMIT = 24;

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

/** Derives the animated showdown sprite URL from a pokemon ID. */
const getGifUrl = (id: string): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;

/** Maps a raw PokeAPI named resource to the UI model. */
const mapPokemonData = (pokemon: NamedAPIResource): PokeApiModel => {
  const segments = pokemon.url.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  return { id: parseInt(id, 10), name: pokemon.name, image: getGifUrl(id) };
};

/**
 * Builds prev/next navigation URLs for a given page context.
 * Centralises all pagination logic on the server side.
 */
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

/**
 * GET /api/pokemon
 * Returns a paginated list of Pokemon, optionally filtered by one or more
 * comma-separated types (intersection logic for multi-type filtering).
 * Query params:
 *   page  {number}  Current page, 1-indexed. Default: 1.
 *   type  {string}  Comma-separated list of type names to filter by.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<PokemonPageResponse | { error: string }>> {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const typeParam = searchParams.get("type");
  const selectedTypes = typeParam ? typeParam.split(",").filter(Boolean) : [];
  const offset = (page - 1) * LIMIT;

  try {
    let results: PokeApiModel[] = [];
    let count = 0;

    if (selectedTypes.length > 0) {
      const responses = await Promise.all(
        selectedTypes.map((type) =>
          fetch(`${POKEAPI_BASE}/type/${type}`).then((res) =>
            res.ok ? (res.json() as Promise<PokemonTypeResponse>) : null,
          ),
        ),
      );

      let allPokemonRaw: NamedAPIResource[] = [];
      responses.forEach((data, index) => {
        if (!data) return;
        const typePokemon = data.pokemon.map((p) => p.pokemon);
        // Intersection: first type seeds the list, subsequent types narrow it
        allPokemonRaw =
          index === 0
            ? typePokemon
            : allPokemonRaw.filter((p1) =>
                typePokemon.some((p2) => p2.name === p1.name),
              );
      });

      count = allPokemonRaw.length;
      results = allPokemonRaw.slice(offset, offset + LIMIT).map(mapPokemonData);
    } else {
      const res = await fetch(
        `${POKEAPI_BASE}/pokemon?offset=${offset}&limit=${LIMIT}`,
      );
      if (!res.ok) {
        throw new Error(`PokeAPI responded with ${res.status}`);
      }
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

    return NextResponse.json({
      results,
      count,
      currentPage: page,
      totalPages,
      prevUrl,
      nextUrl,
    });
  } catch (error) {
    logger.error("GET /api/pokemon failed", error);
    return NextResponse.json(
      { error: "Failed to fetch pokemon" },
      { status: 500 },
    );
  }
}
