import assert from "node:assert/strict";
import { test } from "node:test";
import { nearbyCity } from "../src/lib/discovery-cities.ts";
test("coarse curated discovery anchors choose a nearby city, never a distant default", () => {
  assert.equal(
    nearbyCity({ latitude: -4.27, longitude: 15.28, accuracy: 100 }),
    "brazzaville",
  );
  assert.equal(
    nearbyCity({ latitude: -4.8, longitude: 11.85, accuracy: 100 }),
    "pointe-noire",
  );
  assert.equal(
    nearbyCity({ latitude: -4.2, longitude: 12.68, accuracy: 200 }),
    "dolisie",
  );
  assert.equal(
    nearbyCity({ latitude: 48.85, longitude: 2.35, accuracy: 100 }),
    undefined,
  );
  assert.equal(
    nearbyCity({ latitude: -4.27, longitude: 15.28, accuracy: 90000 }),
    undefined,
  );
  assert.equal(
    nearbyCity({ latitude: NaN, longitude: 15, accuracy: 20 }),
    undefined,
  );
});

test("unused nullable GPS fields do not reject a valid location", () => {
  const coords = {latitude: -4.27, longitude: 15.28, accuracy: 100, altitude: null, heading: null};
  assert.equal(nearbyCity(coords), "brazzaville");
});
