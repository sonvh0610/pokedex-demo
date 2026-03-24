import { getTypes, getPokemons } from "./services/pokemon.service";
import { HomeView } from "./components/HomeView";

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * Container component for the home page.
 * Resolves search params, delegates all data fetching to the service layer,
 * and passes the result directly to the HomeView presenter.
 * @param {Object} props - Next.js page props.
 * @param {SearchParams} props.searchParams - Async search params from the App Router.
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
