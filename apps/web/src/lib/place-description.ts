import type { Locale } from "./i18n.ts";
export type PlaceContext = {
  name: string;
  resource: string;
  ancestors: { name: string; resource: string }[];
  descendantCounts: Record<string, number>;
};
const words: Record<
  string,
  { fr: string; relation: string; en: string; plural: [string, string] }
> = {
  countries: {
    fr: "un pays",
    relation: "du pays",
    en: "a country",
    plural: ["pays", "countries"],
  },
  departments: {
    fr: "un département",
    relation: "du département de",
    en: "a department",
    plural: ["départements", "departments"],
  },
  communes: {
    fr: "une commune",
    relation: "de la commune de",
    en: "a commune",
    plural: ["communes", "communes"],
  },
  districts: {
    fr: "un district",
    relation: "du district de",
    en: "a district",
    plural: ["districts", "districts"],
  },
  arrondissements: {
    fr: "un arrondissement",
    relation: "de l’arrondissement de",
    en: "an arrondissement",
    plural: ["arrondissements", "arrondissements"],
  },
  urbanCommunities: {
    fr: "une communauté urbaine",
    relation: "de la communauté urbaine de",
    en: "an urban community",
    plural: ["communautés urbaines", "urban communities"],
  },
  ruralCommunities: {
    fr: "une communauté rurale",
    relation: "de la communauté rurale de",
    en: "a rural community",
    plural: ["communautés rurales", "rural communities"],
  },
  neighborhoods: {
    fr: "un quartier",
    relation: "du quartier de",
    en: "a neighborhood",
    plural: ["quartiers", "neighborhoods"],
  },
  villages: {
    fr: "un village",
    relation: "du village de",
    en: "a village",
    plural: ["villages", "villages"],
  },
};
const countTypes: Record<string, string[]> = {
  countries: ["departments"],
  departments: ["communes", "districts"],
  communes: ["arrondissements", "neighborhoods"],
  arrondissements: ["neighborhoods"],
  districts: ["urbanCommunities", "ruralCommunities", "villages"],
  urbanCommunities: ["neighborhoods", "villages"],
  ruralCommunities: ["neighborhoods", "villages"],
};
export function describePlace(place: PlaceContext, locale: Locale): string {
  const fr = locale === "fr",
    kind = words[place.resource];
  if (!kind) return "";
  const parent = place.ancestors
    .filter((a) => a.resource !== "countries")
    .at(-1);
  let description =
    place.resource === "countries"
      ? fr
        ? "La République du Congo est le pays couvert par ce référentiel."
        : "The Republic of the Congo is the country covered by this reference."
      : place.name + (fr ? " est " + kind.fr : " is " + kind.en);
  if (place.resource !== "countries") {
    if (parent) {
      const type = words[parent.resource];
      if (type)
        description += fr
          ? " " + type.relation + " " + parent.name
          : " in the " +
            type.en.replace(/^(an?|the) /, "") +
            " of " +
            parent.name;
    }
    const commune = place.ancestors.find((a) => a.resource === "communes");
    if (
      place.resource === "neighborhoods" &&
      parent?.resource === "arrondissements" &&
      commune
    )
      description += fr
        ? ", dans la commune de " + commune.name
        : ", in the commune of " + commune.name;
    description += fr
      ? ", en République du Congo."
      : ", in the Republic of the Congo.";
  }
  const counts = (countTypes[place.resource] ?? [])
    .filter((key) => (place.descendantCounts[key] ?? 0) > 0)
    .map((key) => {
      const n = place.descendantCounts[key],
        w = words[key];
      const noun =
        n === 1
          ? fr
            ? w.fr.replace(/^(un|une) /, "")
            : w.en.replace(/^(a|an) /, "")
          : w.plural[fr ? 0 : 1];
      return (
        new Intl.NumberFormat(locale).format(n) +
        (fr ? " " : " recorded ") +
        noun
      );
    });
  if (counts.length)
    description +=
      " " +
      (fr ? "Le référentiel y recense " : "The reference lists ") +
      new Intl.ListFormat(locale, {
        style: "long",
        type: "conjunction",
      }).format(counts) +
      ".";
  return description;
}
