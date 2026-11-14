import assert from "node:assert/strict";
import { test } from "node:test";
import {
  describePlace,
  type PlaceContext,
} from "../src/lib/place-description.ts";
const country = { name: "République du Congo", resource: "countries" };
test("neighborhood copy follows its real immediate parent without inventing children", () => {
  const p: PlaceContext = {
    name: "Les Manguiers",
    resource: "neighborhoods",
    ancestors: [
      country,
      { name: "Nord", resource: "departments" },
      { name: "Ville A", resource: "communes" },
      { name: "Centre", resource: "arrondissements" },
    ],
    descendantCounts: {},
  };
  assert.equal(
    describePlace(p, "fr"),
    "Les Manguiers est un quartier de l’arrondissement de Centre, dans la commune de Ville A, en République du Congo.",
  );
  assert.equal(
    describePlace({ ...p, ancestors: p.ancestors.slice(0, 3) }, "fr"),
    "Les Manguiers est un quartier de la commune de Ville A, en République du Congo.",
  );
});
test("arrondissement and commune descriptions count recorded descendants and localize plurals", () => {
  const a: PlaceContext = {
    name: "Centre",
    resource: "arrondissements",
    ancestors: [country, { name: "Ville A", resource: "communes" }],
    descendantCounts: { neighborhoods: 1 },
  };
  assert.match(describePlace(a, "fr"), /Le référentiel y recense 1 quartier\./);
  assert.match(
    describePlace({ ...a, descendantCounts: { neighborhoods: 9 } }, "en"),
    /9 recorded neighborhoods\./,
  );
  assert.match(
    describePlace(
      {
        name: "Ville A",
        resource: "communes",
        ancestors: [country, { name: "Nord", resource: "departments" }],
        descendantCounts: { arrondissements: 3, neighborhoods: 12 },
      },
      "fr",
    ),
    /3 arrondissements et 12 quartiers/,
  );
});
test("zero counts never claim a place has no children; descriptions stay deterministic", () => {
  const p = {
    name: "Village A",
    resource: "villages",
    ancestors: [country, { name: "District A", resource: "districts" }],
    descendantCounts: { villages: 0 },
  };
  assert.equal(
    describePlace(p, "fr"),
    "Village A est un village du district de District A, en République du Congo.",
  );
  assert.equal(describePlace(p, "fr"), describePlace(p, "fr"));
});
