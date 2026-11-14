import { Suspense } from "react";
import { overview } from "@/lib/catalog";
import { Explorer } from "@/components/explorer";
import { text, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return pageMetadata(
    locale,
    "/explore",
    text(locale, "Rechercher un lieu au Congo", "Find a place in the Congo"),
    text(
      locale,
      "Recherchez et filtrez les lieux de la République du Congo par catégorie et par territoire.",
      "Search and filter places of the Republic of the Congo by category and territory.",
    ),
    false,
  );
}
export default async function ExplorePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params,
    { departments } = await overview();
  return (
    <section className="container explorer-page">
      <div className="page-head">
        <h1>{text(locale, "Trouvez votre lieu.", "Find your place.")}</h1>
        <p>
          {text(
            locale,
            "Des lieux, avec leur contexte.",
            "Places, with their context.",
          )}
        </p>
      </div>
      <Suspense>
        <Explorer locale={locale} departments={[...departments]} />
      </Suspense>
    </section>
  );
}
