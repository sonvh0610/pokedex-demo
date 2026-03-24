import { NextResponse } from "next/server";
import { logger } from "../../lib/logger";
import { NamedAPIResource, TypesApiResponse } from "@/types/pokemon";

/**
 * GET /api/pokemon-types
 * Returns all Pokemon types from the PokeAPI
 */
export async function GET(): Promise<
  NextResponse<TypesApiResponse | { error: string }>
> {
  try {
    const res = await fetch("https://pokeapi.co/api/v2/type", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`PokeAPI responded with ${res.status}`);
    }
    const data = await res.json();
    const results: NamedAPIResource[] = data.results;

    return NextResponse.json({ results });
  } catch (error) {
    logger.error("GET /api/pokemon-types failed", error);
    return NextResponse.json(
      { error: "Failed to fetch types" },
      { status: 500 },
    );
  }
}
