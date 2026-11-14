import assert from "node:assert/strict";
import { test } from "node:test";
import {
  pageMetadata,
  placeSitemap,
  siteOrigin,
  jsonLd,
} from "../src/lib/seo.ts";
test("localized metadata has self-canonical links, reciprocal languages and absolute social images", () => {
  const fr = pageMetadata(
    "fr",
    "/places/test-id",
    "Bacongo",
    "Un arrondissement de Brazzaville.",
  );
  assert.equal(fr.alternates?.canonical, siteOrigin + "/fr/places/test-id");
  assert.equal(fr.alternates?.languages?.en, siteOrigin + "/en/places/test-id");
  assert.equal(fr.description, "Un arrondissement de Brazzaville.");
  assert.equal(fr.openGraph?.title, "Bacongo · 242Places");
  assert.equal(
    (fr.openGraph?.images as { url: string }[])[0].url,
    siteOrigin + "/fr/opengraph-image",
  );
  assert.equal((fr.twitter as { card: string }).card, "summary_large_image");
  const en = pageMetadata(
    "en",
    "/explore",
    "Find a place",
    "Search the Congo.",
    false,
  );
  assert.deepEqual(en.robots, { index: false, follow: true });
  assert.equal(en.alternates?.canonical, siteOrigin + "/en/explore");
});
test("sitemap contains each public place once per language, with no search combinations", () => {
  const items = placeSitemap([
    "11111111-1111-4111-8111-111111111111",
    "11111111-1111-4111-8111-111111111111",
  ]);
  assert.equal(items.length, 8);
  assert.ok(
    items.some(
      (e) =>
        e.url ===
        siteOrigin + "/fr/places/11111111-1111-4111-8111-111111111111",
    ),
  );
  assert.equal(
    items.filter((e) => e.url.includes("explore") || e.url.includes("?"))
      .length,
    0,
  );
  assert.ok(
    items.every(
      (e) => e.alternates?.languages?.fr && e.alternates?.languages?.en,
    ),
  );
});
test("structured data cannot terminate its enclosing script", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  const serialized = jsonLd(value);
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), value);
});
