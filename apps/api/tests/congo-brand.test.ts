import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "../src/app.ts";
test("documentation presents Congo first with shared branding and compatible country routes", async (t) => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const page = await app.inject("/docs/fr/congo/list");
  assert.equal(page.statusCode, 200);
  assert.match(page.body, /data-brand-pin/);
  assert.match(page.body, /href="\/fr"/);
  assert.doesNotMatch(page.body, /<h2>Pays<\/h2>/);
  assert.doesNotMatch(page.body, /href="\/docs\/fr\/departments\/by-countries"/);
  const spec = (await app.inject("/openapi.json")).json();
  assert.equal(spec.paths["/v1/countries"].get.deprecated, true);
  assert.equal((await app.inject("/docs/en/discovery/list")).statusCode, 200);
  assert.equal((await app.inject("/v1/countries")).statusCode, 200);
});
