import type { Metadata, MetadataRoute } from "next";
import type { Locale } from "./i18n.ts";
export const siteOrigin = (
  process.env.PUBLIC_SITE_URL ?? "https://two42places.onrender.com"
).replace(/\/$/, "");
function languages(path: string) {
  return {
    fr: siteOrigin + "/fr" + path,
    en: siteOrigin + "/en" + path,
    "x-default": siteOrigin + "/en" + path,
  };
}
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  index = true,
): Metadata {
  const url = siteOrigin + "/" + locale + path;
  const images = [
    {
      url: siteOrigin + "/" + locale + "/opengraph-image",
      width: 1200,
      height: 630,
      alt:
        "242Places — " +
        (locale === "fr"
          ? "Les lieux de la République du Congo"
          : "Places of the Republic of the Congo"),
    },
  ];
  return {
    title,
    description,
    alternates: { canonical: url, languages: languages(path) },
    robots: { index, follow: true },
    openGraph: {
      type: "website",
      siteName: "242Places",
      title: title + " · 242Places",
      description,
      url,
      locale: locale === "fr" ? "fr_CG" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_CG"],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: title + " · 242Places",
      description,
      images,
    },
  };
}
export function placeSitemap(ids: readonly string[]): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/congo",
    "/project",
    ...[...new Set(ids)].map((id) => "/places/" + encodeURIComponent(id)),
  ];
  return paths.flatMap((path) =>
    (["fr", "en"] as const).map((locale) => ({
      url: siteOrigin + "/" + locale + path,
      alternates: { languages: languages(path) },
    })),
  );
}
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
