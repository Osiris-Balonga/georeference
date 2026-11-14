export type CityKey = "brazzaville" | "pointe-noire" | "dolisie";
export type FeaturedPlace = {
  key: CityKey;
  id: string;
  name: string;
  department: string;
  arrondissements: number;
  neighborhoods: number;
};
// Coarse discovery anchors from Wikidata P625, not catalog geometry or a city-boundary test.
export const cityAnchors = [
  {
    key: "brazzaville",
    latitude: -4.269444,
    longitude: 15.271111,
    source: "https://www.wikidata.org/wiki/Q3844",
  },
  {
    key: "pointe-noire",
    latitude: -4.7975,
    longitude: 11.850278,
    source: "https://www.wikidata.org/wiki/Q223920",
  },
  {
    key: "dolisie",
    latitude: -4.200556,
    longitude: 12.679167,
    source: "https://www.wikidata.org/wiki/Q246554",
  },
] as const;
export function nearbyCity(coords: {
  latitude: number;
  longitude: number;
  accuracy: number;
}): CityKey | undefined {
  if (
    !Object.values(coords).every(Number.isFinite) ||
    coords.accuracy < 0 ||
    coords.accuracy > 20000 ||
    Math.abs(coords.latitude) > 90 ||
    Math.abs(coords.longitude) > 180
  )
    return;
  const rad = (n: number) => (n * Math.PI) / 180;
  const distances = cityAnchors
    .map((city) => {
      const dLat = rad(city.latitude - coords.latitude),
        dLon = rad(city.longitude - coords.longitude);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(coords.latitude)) *
          Math.cos(rad(city.latitude)) *
          Math.sin(dLon / 2) ** 2;
      return {
        key: city.key,
        distance: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  return distances[0].distance <= 30 ? distances[0].key : undefined;
}
