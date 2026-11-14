import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CityImage } from "@/components/city-image";
import { SearchForm } from "@/components/search-form";
import { overview } from "@/lib/catalog";
import { cityId, bacongoId, text, type Locale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return pageMetadata(
    locale,
    "/congo",
    text(
      locale,
      "Comprendre les territoires du Congo",
      "Understand the Congo’s territories",
    ),
    text(
      locale,
      "Explorez les départements et les liens entre communes, arrondissements, quartiers et villages de la République du Congo.",
      "Explore the departments and relationships between communes, arrondissements, neighborhoods and villages of the Republic of the Congo.",
    ),
  );
}
export default async function Congo({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params,
    { departments } = await overview();
  return (
    <div className="container editorial">
      <nav
        className="breadcrumbs"
        aria-label={text(locale, "Fil d’Ariane", "Breadcrumb")}
      >
        <Link href={"/" + locale}>{text(locale, "Accueil", "Home")}</Link>
        <span aria-current="page">{text(locale, "Le Congo", "The Congo")}</span>
      </nav>
      <header className="page-head centered">
        <p className="eyebrow">République du Congo · CG / COG</p>
        <h1>
          {text(
            locale,
            "Comprendre les territoires.",
            "Understand the territories.",
          )}
          <br />
          {text(locale, "Choisir où explorer.", "Choose where to explore.")}
        </h1>
        <p>
          {text(
            locale,
            "Des départements aux quartiers, découvrez comment les lieux se relient.",
            "From departments to neighborhoods, discover how places connect.",
          )}
        </p>
      </header>
      <section className="editorial-split" data-reveal>
        <figure>
          <CityImage
            city="brazzaville"
            alt="Brazzaville — Quartier OCH"
            sizes="(max-width:700px) calc(100vw - 40px), 640px"
          />
          <figcaption>
            {text(
              locale,
              "Brazzaville — Quartier OCH",
              "Brazzaville — Quartier OCH",
            )}
          </figcaption>
        </figure>
        <div>
          <h2>
            {text(
              locale,
              "Un pays, plusieurs échelles.",
              "One country, several scales.",
            )}
          </h2>
          <ul className="territory-tree">
            <li>
              République du Congo
              <ul>
                <li>
                  {text(locale, "Départements", "Departments")}
                  <ul>
                    <li>
                      {text(
                        locale,
                        "Communes : arrondissements, quartiers",
                        "Communes : arrondissements, neighborhoods",
                      )}
                    </li>
                    <li>
                      {text(
                        locale,
                        "Districts : communautés, villages",
                        "Districts : communities, villages",
                      )}
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
          <p>
            {text(
              locale,
              "Les rattachements varient selon les territoires. Un quartier ne passe pas toujours par un arrondissement.",
              "Relationships vary between territories. A neighborhood does not always belong to an arrondissement.",
            )}
          </p>
        </div>
      </section>
      <section className="department-section" data-reveal>
        <div className="section-title">
          <h2>
            {text(
              locale,
              "Quel département souhaitez-vous explorer ?",
              "Which department would you like to explore?",
            )}
          </h2>
          <p>
            {departments.length}{" "}
            {text(locale, "départements répertoriés", "recorded departments")}
          </p>
        </div>
        <SearchForm locale={locale} scope="departments" />
        <ul className="department-list">
          {departments.map((d) => (
            <li key={d.id}>
              <Link href={"/" + locale + "/places/" + d.id}>
                {d.name}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="example-block" data-reveal>
        <h2>
          {text(
            locale,
            "Un exemple pour commencer.",
            "An example to start with.",
          )}
        </h2>
        <div>
          <Link href={"/" + locale + "/places/" + cityId}>
            Brazzaville <small>({text(locale, "Commune", "Commune")})</small>
          </Link>
          <ArrowRight size={18} aria-hidden="true" />
          <Link href={"/" + locale + "/places/" + bacongoId}>
            Bacongo <small>(Arrondissement)</small>
          </Link>
          <ArrowRight size={18} aria-hidden="true" />
          <Link
            href={"/" + locale + "/places/e2917417-ab73-4f0a-9345-50d1039702ae"}
          >
            La Glacière{" "}
            <small>({text(locale, "Quartier", "Neighborhood")})</small>
          </Link>
          <Link
            className="outline-link example-action"
            href={"/" + locale + "/places/" + cityId}
          >
            {text(locale, "Explorer Brazzaville", "Explore Brazzaville")}
          </Link>
        </div>
        <p>
          {text(
            locale,
            "La commune et le département de Brazzaville sont deux territoires distincts.",
            "The commune and the department of Brazzaville are two distinct territories.",
          )}
        </p>
      </section>
    </div>
  );
}
