import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "../src/app.ts";
const city = "be83c679-2667-4935-9dad-0f63456298ad";
const bacongo = "05d80510-ca0a-4fee-ae4f-44f17e3a8173";
test("Congo entry and discovery retain typed ancestry, scoped search and pagination", async (t) => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const congo = await app.inject("/v1/congo");
  assert.equal(congo.statusCode, 200);
  assert.equal(congo.json().data.iso2, "CG");
  const search = await app.inject(
    "/v1/search?q=BACONGO&resource=arrondissements",
  );
  assert.equal(search.statusCode, 200);
  assert.equal(search.json().meta.total, 1);
  assert.equal(search.json().data[0].id, bacongo);
  const detail = await app.inject("/v1/places/" + bacongo);
  assert.equal(detail.statusCode, 200);
  assert.deepEqual(
    detail.json().data.ancestors.map((x: any) => x.resource),
    ["countries", "departments", "communes"],
  );
  assert.equal(detail.json().data.ancestors.at(-1).id, city);
  const children = await app.inject(
    "/v1/search?parent=" + bacongo + "&resource=neighborhoods&limit=2",
  );
  assert.equal(children.json().meta.total, 9);
  assert.equal(children.json().data.length, 2);
  const page = await app.inject(
    "/v1/search?parent=" + bacongo + "&resource=neighborhoods&limit=2&offset=2",
  );
  assert.notEqual(page.json().data[0].id, children.json().data[0].id);
  assert.equal(
    (await app.inject("/v1/search?q=kInTeLe&resource=communes")).json().data[0]
      .name,
    "Kintélé",
  );
  for (const path of [
    "/v1/search?resource=unknown",
    "/v1/search?limit=101",
    "/v1/search?parent=invalid",
    "/v1/places/nope",
    "/v1/search?unexpected=1",
  ])
    assert.equal((await app.inject(path)).statusCode, 400, path);
  assert.equal(
    (await app.inject("/v1/places/00000000-0000-4000-8000-000000000000"))
      .statusCode,
    404,
  );
  assert.equal((await app.inject("/v1/countries")).json().data.length, 1);
});
