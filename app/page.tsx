import { getTypes, getPokemons } from "./services/pokemon.service";
import { HomeView } from "./components/HomeView";

type SearchParams = { [key: string]: string | string[] | undefined };

/** Parses page and type filter from URL search params. */
function parseSearchParams(searchParams: SearchParams) {
  const page = Math.max(
    1,
    parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10),
  );
  const typeParam =
    typeof searchParams.type === "string"
      ? searchParams.type
      : Array.isArray(searchParams.type)
        ? searchParams.type[0]
        : undefined;
  const selectedTypes = typeParam ? typeParam.split(",").filter(Boolean) : [];
  return { page, selectedTypes };
}

/**
 * Container component for the home page.
 * Resolves search params, delegates all data fetching to the service layer,
 * and passes the result directly to the HomeView presenter.
 */
export default async function Home(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const { page, selectedTypes } = parseSearchParams(searchParams);

  const [types, pokemonPage] = await Promise.all([
    getTypes(),
    getPokemons(page, selectedTypes),
  ]);

  return (
    <HomeView
      count={pokemonPage.count}
      results={pokemonPage.results}
      types={types}
      selectedTypes={selectedTypes}
      prevUrl={pokemonPage.prevUrl}
      nextUrl={pokemonPage.nextUrl}
    />
  );
}
