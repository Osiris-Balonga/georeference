export type Locale = "fr" | "en";
export const text = (locale: Locale, fr: string, en: string) =>
  locale === "fr" ? fr : en;
export const labels: Record<string, [string, string]> = {
  countries: ["Pays", "Country"],
  departments: ["Département", "Department"],
  communes: ["Commune", "Commune"],
  districts: ["District", "District"],
  arrondissements: ["Arrondissement", "Arrondissement"],
  urbanCommunities: ["Communauté urbaine", "Urban community"],
  ruralCommunities: ["Communauté rurale", "Rural community"],
  neighborhoods: ["Quartier", "Neighborhood"],
  villages: ["Village", "Village"],
};
export const label = (key: string, locale: Locale) =>
  labels[key]?.[locale === "fr" ? 0 : 1] ?? key;
export const cityId = "be83c679-2667-4935-9dad-0f63456298ad";
export const bacongoId = "05d80510-ca0a-4fee-ae4f-44f17e3a8173";
