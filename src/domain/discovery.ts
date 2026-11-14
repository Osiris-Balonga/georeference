import {
  definitions,
  RESOURCE_NAMES,
  UUID_PATTERN,
  type ResourceName,
} from "./model.ts";
import type { GeographicCatalog } from "./catalog.ts";
import { CatalogQueryError } from "./query.ts";
export interface PlaceSummary {
  id: string;
  name: string;
  resource: ResourceName;
  parentId: string | null;
}
export interface DiscoveryQuery {
  q?: string;
  resource?: ResourceName;
  parent?: string;
  direct?: boolean;
  limit?: number;
  offset?: number;
}
export function placeSummary(
  catalog: GeographicCatalog,
  id: string,
): PlaceSummary {
  if (!UUID_PATTERN.test(id))
    throw new CatalogQueryError("INVALID_QUERY", "Expected a stable UUID");
  for (const resource of RESOURCE_NAMES) {
    const row = catalog.find(resource, id);
    if (row)
      return {
        id: row.id,
        name: row.name,
        resource,
        parentId:
          (definitions[resource].parentFields
            .map((field) => row[field])
            .find((value) => typeof value === "string") as string) ?? null,
      };
  }
  throw new CatalogQueryError("NOT_FOUND", "Place not found");
}
export function placeAncestors(
  catalog: GeographicCatalog,
  id: string,
): PlaceSummary[] {
  const parents: PlaceSummary[] = [];
  let current = placeSummary(catalog, id);
  while (current.parentId) {
    current = placeSummary(catalog, current.parentId);
    parents.unshift(current);
  }
  return parents;
}
export function discoverPlaces(
  catalog: GeographicCatalog,
  options: DiscoveryQuery = {},
) {
  const {
    q = "",
    resource,
    parent,
    direct = false,
    limit = 20,
    offset = 0,
  } = options;
  if (
    typeof q !== "string" ||
    q.trim().length > 100 ||
    (resource && !RESOURCE_NAMES.includes(resource)) ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(offset) ||
    offset < 0
  )
    throw new CatalogQueryError("INVALID_QUERY", "Invalid discovery query");
  if (parent) placeSummary(catalog, parent);
  const normalize = (text: string) =>
    text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");
  const query = normalize(q.trim()),
    collator = new Intl.Collator("fr", { sensitivity: "base" });
  const matches = RESOURCE_NAMES.filter(
    (key) => key !== "countries" && (!resource || key === resource),
  )
    .flatMap((key) =>
      catalog.resources[key].map((row) => placeSummary(catalog, row.id)),
    )
    .filter(
      (row) =>
        (!query || normalize(row.name).includes(query)) &&
        (!parent ||
          (direct
            ? row.parentId === parent
            : catalog.hasAncestor(row.id, parent))),
    )
    .sort(
      (a, b) =>
        collator.compare(a.name, b.name) ||
        a.resource.localeCompare(b.resource) ||
        a.id.localeCompare(b.id),
    );
  return {
    data: matches
      .slice(offset, offset + limit)
      .map((row) => ({ ...row, ancestors: placeAncestors(catalog, row.id) })),
    total: matches.length,
    limit,
    offset,
  };
}
