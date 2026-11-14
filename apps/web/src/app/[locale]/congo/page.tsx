import Link from "next/link";
import { overview } from "@/lib/catalog";
import { cityId, bacongoId, text, type Locale } from "@/lib/i18n";
export const metadata = { title: "Le Congo · The Congo" };
export default async function Congo({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params,
    { departments } = await overview();
  return (
    <div className="container editorial">
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
          <img
            src="/images/riverfront.webp"
            width="768"
            height="512"
            alt={text(
              locale,
              "Évocation de Brazzaville au bord du fleuve",
              "An evocation of Brazzaville by the river",
            )}
          />
          <figcaption>
            {text(
              locale,
              "Vue illustrative de Brazzaville",
              "Illustrative view of Brazzaville",
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
                        "Communes → arrondissements, quartiers",
                        "Communes → arrondissements, neighborhoods",
                      )}
                    </li>
                    <li>
                      {text(
                        locale,
                        "Districts → communautés, villages",
                        "Districts → communities, villages",
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
        <ul className="department-list">
          {departments.map((d) => (
            <li key={d.id}>
              <Link href={"/" + locale + "/places/" + d.id}>
                {d.name}
                <span aria-hidden="true">→</span>
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
          <span>→</span>
          <Link href={"/" + locale + "/places/" + bacongoId}>
            Bacongo <small>(Arrondissement)</small>
          </Link>
          <span>→</span>
          <Link
            href={"/" + locale + "/places/e2917417-ab73-4f0a-9345-50d1039702ae"}
          >
            La Glacière{" "}
            <small>({text(locale, "Quartier", "Neighborhood")})</small>
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
