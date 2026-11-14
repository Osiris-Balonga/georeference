import Link from "next/link";
import { FeaturedPlaces } from "@/components/featured-places";
import { CityImage } from "@/components/city-image";
import { notFound } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { overview } from "@/lib/catalog";
import { cityId, text, type Locale } from "@/lib/i18n";
import { pageMetadata, siteOrigin, jsonLd } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return pageMetadata(
    locale,
    "",
    text(
      locale,
      "Lieux du Congo : villes, quartiers et villages",
      "Explore the Republic of the Congo",
    ),
    text(
      locale,
      "Découvrez les lieux de la République du Congo : départements, communes, arrondissements, quartiers et villages, avec leurs rattachements et leurs sources.",
      "Discover the places of the Republic of the Congo: departments, communes, arrondissements, neighborhoods and villages, with their relationships and sources.",
    ),
  );
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params,
    { coverage, featured } = await overview();
  if (locale !== "fr" && locale !== "en") notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": siteOrigin + "/#website",
            name: "242Places",
            url: siteOrigin + "/",
            inLanguage: ["fr", "en"],
          }),
        }}
      />
      <section className="home-hero">
        <div className="hero-intro container">
          <h1>
            {text(locale, "Un pays à découvrir.", "A country to discover.")}
            <br />
            {text(locale, "Des lieux à comprendre.", "Places to understand.")}
          </h1>
          <p>
            {text(
              locale,
              "Villes, arrondissements, quartiers et villages.",
              "Cities, arrondissements, neighborhoods and villages.",
            )}
            <br />
            {text(
              locale,
              "Explorez leurs liens, simplement.",
              "Explore how they connect, simply.",
            )}
          </p>
          <SearchForm locale={locale} />
        </div>
        <div className="map-scene">
          <img
            className="map-art"
            src="/images/map.webp"
            alt=""
            fetchPriority="high"
            width="1536"
            height="1024"
          />
          <FeaturedPlaces locale={locale} cities={featured} />
        </div>
      </section>
      <section className="container stats" data-reveal>
        <div>
          <strong>
            {new Intl.NumberFormat(locale).format(
              Object.values(coverage.counts).reduce((a, b) => a + b, 0),
            )}
          </strong>
          <span>{text(locale, "lieux répertoriés", "recorded places")}</span>
        </div>
        <div>
          <strong>{coverage.counts.departments}</strong>
          <span>
            {text(locale, "départements répertoriés", "recorded departments")}
          </span>
        </div>
        <div>
          <strong>{coverage.counts.neighborhoods}</strong>
          <span>
            {text(locale, "quartiers répertoriés", "recorded neighborhoods")}
          </span>
        </div>
        <Link href={"/" + locale + "/project#sources"}>
          {text(locale, "Voir les sources", "View sources")}{" "}
          <ArrowUpRight size={14} />
        </Link>
      </section>
      <section className="container understand" data-reveal>
        <div>
          <p className="eyebrow">
            {text(
              locale,
              "Comprendre les territoires",
              "Understand the territories",
            )}
          </p>
          <h2>
            {text(
              locale,
              "Chaque lieu a son histoire. Et son territoire.",
              "Every place has a story. And a territory.",
            )}
          </h2>
          <p>
            {text(
              locale,
              "Retrouvez les rattachements et les lieux répertoriés.",
              "Discover administrative relationships and recorded places.",
            )}
          </p>
        </div>
        <div className="hierarchy-preview">
          <span>République du Congo</span>
          <span> Brazzaville</span>
          <span> Bacongo</span>
          <Link href={"/" + locale + "/congo"}>
            {text(
              locale,
              "Comprendre les liens",
              "Understand the relationships",
            )}{" "}
          </Link>
        </div>
        <Link
          href={"/" + locale + "/places/" + cityId}
          className="destination-preview"
        >
          <CityImage
            city="brazzaville"
            sizes="(max-width:700px) calc(100vw - 40px), 400px"
          />
          <span>
            {text(
              locale,
              "Commencer par Brazzaville",
              "Start with Brazzaville",
            )}{" "}
            <ArrowRight size={18} />
          </span>
        </Link>
      </section>
    </>
  );
}
