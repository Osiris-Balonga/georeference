import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSearch, updateSearch } from "../src/lib/search-state.ts";
test("shared URLs retain context and reset pagination only when filters change", () => {
  const p = new URLSearchParams("q=Bacongo&resource=arrondissements&offset=40");
  assert.equal(
    updateSearch(p, { offset: 60 }),
    "q=Bacongo&resource=arrondissements&offset=60",
  );
  assert.equal(
    updateSearch(p, { q: "Mpila" }),
    "q=Mpila&resource=arrondissements",
  );
  assert.equal(p.get("q"), "Bacongo");
  assert.equal(updateSearch(p, { q: "", resource: "" }), "");
});
test("untrusted URL state is bounded without creating unsupported category filters", () => {
  assert.deepEqual(
    parseSearch(
      new URLSearchParams(
        "q=%20Bacongo%20&resource=banana&parent=bad&offset=-9",
      ),
    ),
    { q: "Bacongo", resource: "", parent: "", offset: 0 },
  );
});
