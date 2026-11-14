import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { details } from "@/lib/catalog";
import { text, label, type Locale } from "@/lib/i18n";
import { Explorer } from "@/components/explorer";
import { ShareLink } from "@/components/share-link";
import { describePlace } from "@/lib/place-description";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  try {
    const { id, locale } = await params,
      place = await details(id);
    return { title: place.name, description: describePlace(place, locale) };
  } catch {
    return { title: "242Places" };
  }
}
export default async function PlacePage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  let place;
  try {
    place = await details(id);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      ["NOT_FOUND", "INVALID_QUERY"].includes(String(error.code))
    )
      notFound();
    throw error;
  }
  return (
    <section className="container place-page">
      <nav
        className="breadcrumbs"
        aria-label={text(locale, "Fil d’Ariane", "Breadcrumb")}
      >
        <Link href={"/" + locale}>{text(locale, "Accueil", "Home")}</Link>
        {place.ancestors
          .filter((p) => p.resource !== "countries")
          .map((p) => (
            <Link href={"/" + locale + "/places/" + p.id} key={p.id}>
              {p.name} <small>({label(p.resource, locale)})</small>
            </Link>
          ))}
        <span aria-current="page">{place.name}</span>
      </nav>
      <div className="page-head">
        <span className="kind-label">{label(place.resource, locale)}</span>
        <h1>{place.name}</h1>
        <p className="place-description">{describePlace(place, locale)}</p>
      </div>
      <div className="place-detail-grid">
        <div>
          <h2>
            {text(
              locale,
              "Les lieux rattachés",
              "Places within this territory",
            )}
          </h2>
          <p>
            {place.children.total}{" "}
            {text(
              locale,
              "lieux directement rattachés répertoriés.",
              "recorded places directly attached.",
            )}
          </p>
          <Suspense>
            <Explorer locale={locale} parent={id} direct />
          </Suspense>
        </div>
        <aside className="place-sidebar">
          <h2>
            {text(
              locale,
              "Où se situe ce lieu ?",
              "Where does this place belong?",
            )}
          </h2>
          <ol className="ancestry">
            {place.ancestors.map((p) => (
              <li key={p.id}>
                <Link href={"/" + locale + "/places/" + p.id}>{p.name}</Link>
                <small>{label(p.resource, locale)}</small>
              </li>
            ))}
            <li>
              <strong>{place.name}</strong>
              <small>{label(place.resource, locale)}</small>
            </li>
          </ol>
          <div className="coverage-panel">
            <h3>{text(locale, "Couverture partielle", "Partial coverage")}</h3>
            <p>
              {text(
                locale,
                "Les listes suivent les sources disponibles. Les limites géographiques ne sont pas encore disponibles.",
                "Lists follow available sources. Geographic boundaries are not yet available.",
              )}
            </p>
            <Link href={"/" + locale + "/project#sources"}>
              {text(locale, "Consulter les sources", "View sources")} →
            </Link>
          </div>
          <Link href={"/" + locale + "/explore?parent=" + id}>
            {text(
              locale,
              "Explorer tous les descendants",
              "Explore all descendants",
            )}{" "}
            →
          </Link>
          <ShareLink locale={locale} />
        </aside>
      </div>
    </section>
  );
}
