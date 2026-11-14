import Link from "next/link";
import { CityImage } from "@/components/city-image";
import { catalog } from "@/lib/catalog";
import { text, type Locale } from "@/lib/i18n";
import { Database, Globe, Code } from "lucide-react";
import { imageCredits, photoLicense } from "@/lib/image-credits";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return pageMetadata(
    locale,
    "/project",
    text(
      locale,
      "Le projet, les sources et la couverture",
      "The project, sources and coverage",
    ),
    text(
      locale,
      "Comprenez le projet 242Places, ses sources administratives, sa couverture partielle et les possibilités de contribution et de réutilisation des données du Congo.",
      "Learn about 242Places, its administrative sources, partial coverage, contribution options and ways to reuse the Republic of the Congo data.",
    ),
  );
}
export default async function Project({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params,
    c = await catalog();
  return (
    <article className="container editorial">
      <nav
        className="breadcrumbs"
        aria-label={text(locale, "Fil d’Ariane", "Breadcrumb")}
      >
        <Link href={"/" + locale}>{text(locale, "Accueil", "Home")}</Link>
        <span aria-current="page">
          {text(locale, "Le projet", "The project")}
        </span>
      </nav>
      <header className="editorial-split page-head">
        <div>
          <p className="eyebrow">
            {text(locale, "Pourquoi 242Places ?", "Why 242Places?")}
          </p>
          <h1>
            {text(
              locale,
              "Rendre les lieux du Congo plus faciles à retrouver.",
              "Making the places of the Congo easier to find.",
            )}
          </h1>
          <p>
            {text(
              locale,
              "242Places rassemble les noms des lieux et leurs rattachements pour les rendre accessibles à tous.",
              "242Places brings together place names and their administrative relationships to make them accessible to everyone.",
            )}
          </p>
        </div>
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
      </header>
      <section className="editorial-split" data-reveal>
        <h2>
          {text(
            locale,
            "Des noms. Des liens. Des sources.",
            "Names. Relationships. Sources.",
          )}
        </h2>
        <div>
          <p>
            {text(
              locale,
              "Les lieux sont reliés à leur territoire : département, commune, arrondissement, quartier ou village.",
              "Places are linked to their territory: department, commune, arrondissement, neighborhood or village.",
            )}
          </p>
          <p>
            {text(
              locale,
              "Le référentiel combine des documents administratifs et des sources publiques, avec des dates et des limites documentées.",
              "The reference combines administrative documents and public sources, with documented dates and limitations.",
            )}
          </p>
        </div>
      </section>
      <section className="coverage-panel" id="sources" data-reveal>
        <h2>
          {text(
            locale,
            "Ce que couvre le référentiel",
            "What the reference covers",
          )}
        </h2>
        <div className="coverage-counts">
          <span>
            <strong>
              {Object.values(c.coverage.counts)
                .reduce((a, b) => a + b, 0)
                .toLocaleString(locale)}
            </strong>
            {text(locale, "lieux répertoriés", "recorded places")}
          </span>
          <span>
            <strong>{c.coverage.counts.neighborhoods}</strong>
            {text(locale, "quartiers", "neighborhoods")}
          </span>
          <span>
            <strong>{c.coverage.counts.villages.toLocaleString(locale)}</strong>
            {text(locale, "villages", "villages")}
          </span>
        </div>
        <p>
          {text(
            locale,
            "Couverture partielle. Une absence dans les données ne prouve pas l’absence d’un lieu. Les dates des sources varient ; la réception d’un document ne signifie pas que ses observations sont actuelles.",
            "Partial coverage. An absence from the data does not prove the absence of a place. Source dates vary; receiving a document does not mean its observations are current.",
          )}
        </p>
        <p className="dataset-version">{c.metadata.datasetVersion}</p>
        <details className="source-details">
          <summary>
            {text(
              locale,
              "Consulter les sources utilisées",
              "View source documents",
            )}{" "}
            ({c.metadata.sources.length})
          </summary>
          <ul className="source-list">
            {c.metadata.sources.map((s) => (
              <li key={s.name}>
                {/^https?:\/\//.test(s.url) ? (
                  <a href={s.url}>{s.name} </a>
                ) : (
                  <span>{s.name}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
        <a href={"/docs/" + locale + "/reference"}>
          {text(
            locale,
            "Détail des sources et de la couverture",
            "Detailed sources and coverage",
          )}{" "}
        </a>
      </section>
      <section data-reveal>
        <div className="section-title">
          <h2>
            {text(
              locale,
              "À chacun sa façon d’explorer.",
              "A way to explore for everyone.",
            )}
          </h2>
          <a href={"/docs/" + locale + "/introduction"}>
            {text(locale, "Voir la documentation", "Read the documentation")}
          </a>
        </div>
        <div className="usage-columns">
          {[
            [
              Globe,
              text(locale, "Sur le site", "On the website"),
              text(
                locale,
                "Retrouver un lieu et comprendre son rattachement.",
                "Find a place and understand its relationships.",
              ),
              "explore",
            ],
            [
              Database,
              text(locale, "En fichiers", "As files"),
              text(
                locale,
                "Récupérer les données en JSON, CSV, Excel ou SQL.",
                "Get data as JSON, CSV, Excel or SQL.",
              ),
              "exports",
            ],
            [
              Code,
              text(locale, "Dans un projet", "In your project"),
              text(
                locale,
                "Utiliser l’API, la CLI ou le SDK optionnel.",
                "Use the API, CLI or optional SDK.",
              ),
              "introduction",
            ],
          ].map(([Icon, title, body, slug]) => {
            const Symbol = Icon as typeof Globe;
            return (
              <div key={String(title)}>
                <Symbol aria-hidden="true" />
                <h3>{String(title)}</h3>
                <p>{String(body)}</p>
                <Link
                  href={
                    slug === "explore"
                      ? "/" + locale + "/explore"
                      : "/docs/" + locale + "/" + slug
                  }
                >
                  {text(locale, "Découvrir", "Discover")}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
      <section id="images" className="image-credits" data-reveal>
        <h2>{text(locale, "Crédits des images", "Image credits")}</h2>
        <p>
          {text(
            locale,
            "Photographies redimensionnées et compressées en WebP ; leur cadrage s’adapte à l’écran.",
            "Photographs resized and compressed as WebP; display framing adapts to the screen.",
          )}
        </p>
        <ul>
          {imageCredits.map((image) => (
            <li key={image.url}>
              <a href={image.url}>{image.title}</a> — {image.author} ·{" "}
              <a href={photoLicense}>CC BY-SA 4.0</a>
            </li>
          ))}
        </ul>
        <p>
          {text(
            locale,
            "La carte décorative, le panorama de Brazzaville dans le footer et ses ciels sont des illustrations. Ils ne représentent pas des limites géographiques mesurées.",
            "The decorative map, footer panorama of Brazzaville and its skies are illustrations. They do not depict surveyed geographic boundaries.",
          )}
        </p>
      </section>
      <section className="contribution" data-reveal>
        <div>
          <h2>
            {text(
              locale,
              "Un projet ouvert à la contribution.",
              "A project open to contributions.",
            )}
          </h2>
          <p>
            {text(
              locale,
              "Une correction ou une source à proposer ? Retrouvez le projet sur GitHub.",
              "Have a correction or a source to suggest? Find the project on GitHub.",
            )}
          </p>
        </div>
        <a
          className="docs-link"
          href="https://github.com/Osiris-Balonga/242places"
        >
          {text(locale, "Contribuer sur GitHub", "Contribute on GitHub")}
        </a>
        <small>
          {text(
            locale,
            "Code sous licence MIT. Les conditions de réutilisation des données dépendent de leurs sources.",
            "Code under the MIT license. Data reuse conditions depend on their sources.",
          )}
        </small>
      </section>
    </article>
  );
}
