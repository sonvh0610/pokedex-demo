import Link from "next/link";
import {
  PokeApiModel,
  NamedAPIResource,
  PokemonTypeResponse,
} from "../types/pokemon";
import { logger } from "./lib/logger";
import { PokemonImage } from "../components/PokemonImage";

const LIMIT = 24;

/**
 * Generates the animated GIF URL for a given Pokemon ID.
 * @param {string} id - The extracted Pokemon ID.
 * @returns {string} The full URL to the showdown sprite.
 */
const getGifUrl = (id: string): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;

/**
 * Maps raw API resource data to the model used in the application UI.
 * @param {NamedAPIResource} pokemon - The raw pokemon object containing name and url.
 * @returns {PokeApiModel} The parsed model populated with ID and image URL.
 */
const mapPokemonData = (pokemon: NamedAPIResource): PokeApiModel => {
  const segments = pokemon.url.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  return {
    id: parseInt(id, 10),
    name: pokemon.name,
    image: getGifUrl(id),
  };
};

/**
 * Fetches the available Pokemon types from the PokeAPI.
 * @returns {Promise<NamedAPIResource[]>} Array of available types, excluding 'unknown' and 'shadow'.
 */
async function getTypes(): Promise<NamedAPIResource[]> {
  try {
    const res = await fetch("https://pokeapi.co/api/v2/type", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch types: ${res.status}`);
    }
    const data = await res.json();
    return data.results.filter(
      (t: NamedAPIResource) => !["unknown", "shadow"].includes(t.name),
    );
  } catch (error) {
    logger.error("Error fetching types", error);
    return [];
  }
}

/**
 * Fetches a paginated list of Pokemons, optionally filtered by multiple types.
 * @param {number} page - The current page number.
 * @param {string[]} selectedTypes - The array of type names to filter by.
 * @returns {Promise<{ results: PokeApiModel[]; count: number }>} The populated array of models and the total count.
 */
async function getPokemons(
  page: number,
  selectedTypes: string[],
): Promise<{ results: PokeApiModel[]; count: number }> {
  try {
    const offset = (page - 1) * LIMIT;
    let results: PokeApiModel[] = [];
    let count = 0;

    if (selectedTypes.length > 0) {
      const responses = await Promise.all(
        selectedTypes.map((type) =>
          fetch(`https://pokeapi.co/api/v2/type/${type}`).then((res) =>
            res.ok ? res.json() : null,
          ),
        ),
      );

      let allPokemonRaw: NamedAPIResource[] = [];

      responses.forEach((data: PokemonTypeResponse | null, index: number) => {
        if (!data) return;
        const typePokemon = data.pokemon.map((p) => p.pokemon);
        if (index === 0) {
          allPokemonRaw = typePokemon;
        } else {
          allPokemonRaw = allPokemonRaw.filter((p1) =>
            typePokemon.some((p2) => p2.name === p1.name),
          );
        }
      });

      count = allPokemonRaw.length;
      results = allPokemonRaw.slice(offset, offset + LIMIT).map(mapPokemonData);
    } else {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${LIMIT}`,
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch generic pokemons: ${res.status}`);
      }
      const data = await res.json();
      count = data.count;
      results = data.results.map(mapPokemonData);
    }

    return { results, count };
  } catch (error) {
    logger.error("Error fetching pokemons", error);
    return { results: [], count: 0 };
  }
}

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * The main Home Page entry component for Next.js App Router.
 * Uses SSR to render the filtering interface and pokemon grid.
 * @param {Object} props - Component properties.
 * @param {SearchParams} props.searchParams - The dynamically parsed query string parameters.
 * @returns {Promise<JSX.Element>} The rendered UI for the page.
 */
export default async function Home(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;

  const pageParam =
    typeof searchParams.page === "string" ? searchParams.page : "1";
  const typeParam =
    typeof searchParams.type === "string"
      ? searchParams.type
      : Array.isArray(searchParams.type)
        ? searchParams.type[0]
        : undefined;

  const selectedTypes: string[] = typeParam ? typeParam.split(",") : [];

  const page = parseInt(pageParam, 10);

  const types = await getTypes();
  const { results, count } = await getPokemons(page, selectedTypes);

  const totalPages = Math.ceil(count / LIMIT);

  const prevQuery = new URLSearchParams();
  if (selectedTypes.length > 0) prevQuery.set("type", selectedTypes.join(","));
  prevQuery.set("page", (page - 1).toString());
  const prevUrl = page > 1 ? `/?${prevQuery.toString()}` : null;

  const nextQuery = new URLSearchParams();
  if (selectedTypes.length > 0) nextQuery.set("type", selectedTypes.join(","));
  nextQuery.set("page", (page + 1).toString());
  const nextUrl = page < totalPages ? `/?${nextQuery.toString()}` : null;

  return (
    <section className="flex flex-col gap-4 px-10">
      <p className="py-4 text-center">Welcome to Pokemon world</p>
      <p>Total: {count}</p>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span>Types:</span>
        {types.map((t: NamedAPIResource) => {
          const isSelected = selectedTypes.includes(t.name);
          const newSelected = isSelected
            ? selectedTypes.filter((st) => st !== t.name)
            : [...selectedTypes, t.name];

          const query = new URLSearchParams();
          if (newSelected.length > 0) {
            query.set("type", newSelected.join(","));
          }
          // Note: when changing types, always reset to page 1 implicitly by omitted ?page=

          return (
            <Link
              key={t.name}
              className={`border border-[#e5e7eb] p-4 ${isSelected ? "bg-blue-500 text-white" : ""}`}
              href={newSelected.length > 0 ? `/?${query.toString()}` : "/"}
            >
              {t.name}
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 md:gap-x-16 gap-y-6">
        {results.map((pokemon) => (
          <div
            key={pokemon.id}
            className="flex flex-col items-center justify-between border border-[#e5e7eb] p-4"
          >
            <h3>{pokemon.name}</h3>
            <PokemonImage
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
          <Link
            className="rounded bg-blue-500 px-4 py-2 text-white"
            href={prevUrl}
          >
            Prev
          </Link>
        )}
        {nextUrl && (
          <Link
            className="rounded bg-blue-500 px-4 py-2 text-white"
            href={nextUrl}
          >
            Next
          </Link>
        )}
      </div>
    </section>
  );
}
