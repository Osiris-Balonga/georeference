import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowUpRight, ArrowRight } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { overview } from "@/lib/catalog";
import { cityId, text, type Locale } from "@/lib/i18n";
export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params,
    { coverage } = await overview();
  if (locale !== "fr" && locale !== "en") notFound();
  return (
    <>
      <section className="home-hero">
        <div className="hero-intro container">
          <p className="eyebrow">
            <MapPin size={15} />
            {text(locale, "Les lieux du Congo", "The places of the Congo")}
          </p>
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
          <Link
            href={"/" + locale + "/places/" + cityId}
            className="place-preview"
          >
            <img
              src="/images/riverfront.webp"
              alt={text(
                locale,
                "Évocation illustrée de Brazzaville",
                "Illustrative view of Brazzaville",
              )}
              width="360"
              height="220"
              fetchPriority="high"
            />
            <div>
              <small>{text(locale, "Commune", "Commune")}</small>
              <h2>Brazzaville</h2>
              <p>
                {text(
                  locale,
                  "Département de Brazzaville",
                  "Department of Brazzaville",
                )}
              </p>
              <span>
                {
                  coverage.communes.find((x) => x.id === cityId)
                    ?.arrondissements
                }{" "}
                {text(
                  locale,
                  "arrondissements répertoriés",
                  "recorded arrondissements",
                )}{" "}
                <ArrowRight size={17} />
              </span>
            </div>
          </Link>
          <span className="map-place-name" aria-hidden="true">
            Brazzaville
          </span>
          <p className="map-disclaimer">
            {text(
              locale,
              "Carte et visuel illustratifs · géométries non disponibles",
              "Illustrative map and image · geographic boundaries unavailable",
            )}
          </p>
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
          <span>↳ Brazzaville</span>
          <span>↳ Bacongo</span>
          <Link href={"/" + locale + "/congo"}>
            {text(
              locale,
              "Comprendre les liens",
              "Understand the relationships",
            )}{" "}
            →
          </Link>
        </div>
        <Link
          href={"/" + locale + "/places/" + cityId}
          className="destination-preview"
        >
          <img
            src="/images/riverfront.webp"
            width="420"
            height="240"
            alt=""
            loading="lazy"
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
