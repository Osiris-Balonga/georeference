import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import { FeaturedPlaces } from "../src/components/featured-places.tsx";
import type { FeaturedPlace } from "../src/lib/discovery-cities.ts";
const cities: FeaturedPlace[] = [
  {
    key: "brazzaville",
    id: "a",
    name: "Brazzaville",
    department: "Brazzaville",
    arrondissements: 9,
    neighborhoods: 88,
  },
  {
    key: "pointe-noire",
    id: "b",
    name: "Pointe-Noire",
    department: "Pointe-Noire",
    arrondissements: 6,
    neighborhoods: 20,
  },
  {
    key: "dolisie",
    id: "c",
    name: "Dolisie",
    department: "Niari",
    arrondissements: 2,
    neighborhoods: 10,
  },
];

afterEach(cleanup);
function locationMock(
  permission: string,
  coords = { latitude: -4.8, longitude: 11.85, accuracy: 100 },
) {
  let calls = 0;
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: { query: async () => ({ state: permission }) },
  });
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (success: PositionCallback) => {
        calls++;
        success({ coords } as GeolocationPosition);
      },
    },
  });
  return () => calls;
}
test("discovery always shows three cards without tabs, buttons or an automatic permission prompt", async () => {
  for (const permission of ["prompt", "denied"]) {
    const calls = locationMock(permission);
    render(<FeaturedPlaces cities={cities} locale="fr" />);
    await act(async () => {});
    assert.deepEqual(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
      ["Brazzaville", "Pointe-Noire", "Dolisie"],
    );
    assert.equal(screen.queryAllByRole("button").length, 0);
    assert.equal(screen.queryAllByRole("tab").length, 0);
    assert.equal(calls(), 0);
    cleanup();
  }
});
test("an existing location grant reorders the three cards without hiding any city", async () => {
  const calls = locationMock("granted");
  render(<FeaturedPlaces cities={cities} locale="en" />);
  await waitFor(() =>
    assert.deepEqual(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
      ["Pointe-Noire", "Brazzaville", "Dolisie"],
    ),
  );
  assert.equal(calls(), 1);
  assert.equal(screen.getAllByRole("link").length, 3);
});
test("a distant or inaccurate location preserves all three default cards", async () => {
  locationMock("granted", { latitude: 48.85, longitude: 2.35, accuracy: 100 });
  render(<FeaturedPlaces cities={cities} locale="fr" />);
  await act(async () => {});
  assert.deepEqual(
    screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ["Brazzaville", "Pointe-Noire", "Dolisie"],
  );
});
