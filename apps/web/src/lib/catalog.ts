import "server-only";
import { createRequire } from "node:module";
import { join } from "node:path";
// Load the local Node SDK natively: its file-relative catalog paths must not be rewritten by the web bundler.
const { loadCatalog, placeSummary, placeAncestors, discoverPlaces } =
  createRequire(join(process.cwd(), "package.json"))(
    "242places",
  ) as typeof import("242places");
let pending: ReturnType<typeof loadCatalog> | undefined;
export const catalog = () => (pending ??= loadCatalog());
export async function overview() {
  const c = await catalog();
  return {
    departments: c.resources.departments,
    coverage: c.coverage,
    version: c.metadata.datasetVersion,
    featured: (["brazzaville", "pointe-noire", "dolisie"] as const).map(
      (key, index) => {
        const name = ["Brazzaville", "Pointe-Noire", "Dolisie"][index];
        const city = c.resources.communes.find((row) => row.name === name)!;
        const coverage = c.coverage.communes.find((row) => row.id === city.id)!;
        return {
          key,
          id: city.id,
          name: city.name,
          department: c.resources.departments.find(
            (row) => row.id === city.departmentId,
          )!.name,
          arrondissements: coverage.arrondissements,
          neighborhoods: coverage.namedNeighborhoods,
        };
      },
    ),
  };
}
export async function details(id: string) {
  const c = await catalog();
  return {
    ...placeSummary(c, id),
    ancestors: placeAncestors(c, id),
    children: discoverPlaces(c, { parent: id, direct: true, limit: 20 }),
    descendantCounts: Object.fromEntries(
      Object.entries(c.resources).map(([key, rows]) => [
        key,
        rows.filter((row) => c.hasAncestor(row.id, id)).length,
      ]),
    ),
  };
}
