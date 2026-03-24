import Link from "next/link";
import { NamedAPIResource, PokeApiModel } from "@/types/pokemon";
import { PokemonImage } from "./PokemonImage";

export interface HomeViewProps {
  /** Total number of pokemon matching the current filter. */
  count: number;
  /** Current page's pokemon results. */
  results: PokeApiModel[];
  /** All available filter types. */
  types: NamedAPIResource[];
  /** Currently active type filters. */
  selectedTypes: string[];
  /** URL for the previous page, or null if on the first page. */
  prevUrl: string | null;
  /** URL for the next page, or null if on the last page. */
  nextUrl: string | null;
}

/**
 * Pure presenter component for the Pokemon home page.
 * Renders the type filter, pokemon grid, and pagination controls.
 * Contains zero data-fetching logic — all data is received via props.
 */
export function HomeView({
  count,
  results,
  types,
  selectedTypes,
  prevUrl,
  nextUrl,
}: HomeViewProps) {
  return (
    <section className="flex flex-col gap-4 px-10">
      <p className="py-4 text-center">Welcome to Pokemon world</p>
      <p>Total: {count}</p>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span>Types:</span>
        {types.map((t) => {
          const isSelected = selectedTypes.includes(t.name);
          const newSelected = isSelected
            ? selectedTypes.filter((st) => st !== t.name)
            : [...selectedTypes, t.name];

          const query = new URLSearchParams();
          if (newSelected.length > 0) query.set("type", newSelected.join(","));
          // When changing types, always reset to page 1 (omit ?page)

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
              width={35}
              height={53}
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
