import { assertCongoEntities, loadCongoReference, type CongoReference } from '../congo.ts';
import { validateMetadata } from '../validation.ts';
import { definitions, RESOURCE_NAMES, toResourceTables, type ResourceName } from './model.ts';
import type { CatalogCoverage, CatalogMetadata, CatalogResources, DeepReadonly, ResourceTypes } from './types.ts';

function freeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

function dates(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((date): date is string =>
    typeof date === 'string' && /^\d{4}-\d{2}(?:-\d{2})?$/.test(date)))].sort();
}

type IndexedResource = { resource: ResourceName; row: DeepReadonly<ResourceTypes[ResourceName]> };

export class GeographicCatalog {
  readonly metadata: CatalogMetadata;
  readonly coverage: CatalogCoverage;
  readonly resources: CatalogResources;
  readonly #byId = new Map<string, IndexedResource>();
  readonly #ancestors = new Map<string, ReadonlySet<string>>();

  constructor(reference: CongoReference) {
    validateMetadata(reference.metadata);
    assertCongoEntities(reference.entities);
    if (reference.coverage.status !== 'partial' || reference.coverage.completeGeographicInventory !== false) {
      throw new Error('The Congo catalog requires explicit partial coverage');
    }
    this.metadata = freeze(structuredClone(reference.metadata));
    this.resources = freeze(structuredClone(toResourceTables(reference.entities))) as CatalogResources;
    for (const resource of RESOURCE_NAMES) {
      for (const row of this.resources[resource]) this.#byId.set(row.id, { resource, row });
    }
    for (const [id, entry] of this.#byId) {
      const ancestors = new Set<string>();
      let current = entry;
      while (current.resource !== 'countries') {
        const parentField = definitions[current.resource].parentFields.find(field => current.row[field] !== null)!;
        const parentId = current.row[parentField] as string;
        ancestors.add(parentId);
        current = this.#byId.get(parentId)!;
      }
      this.#ancestors.set(id, ancestors);
    }
    const summaries = Array.isArray(reference.coverage.communes) ? reference.coverage.communes : [];
    this.coverage = freeze({
      status: 'partial' as const,
      completeGeographicInventory: false as const,
      reviewedAt: typeof reference.coverage.reviewedAt === 'string' ? reference.coverage.reviewedAt : null,
      sourceDates: dates(reference.coverage.sourceDates),
      counts: Object.fromEntries(RESOURCE_NAMES.map(resource => [resource, this.resources[resource].length])) as Record<ResourceName, number>,
      communes: this.resources.communes.map(commune => {
        const summary = summaries.find((value: unknown) => value !== null && typeof value === 'object' &&
          'id' in value && value.id === commune.id) as Record<string, unknown> | undefined;
        return {
          id: commune.id, name: commune.name, status: 'partial' as const,
          namedNeighborhoods: this.resources.neighborhoods.filter(row => this.hasAncestor(row.id, commune.id)).length,
          arrondissements: this.resources.arrondissements.filter(row => row.communeId === commune.id).length,
          observationDates: dates(summary?.observationDates),
        };
      }),
    });
    Object.freeze(this);
  }

  /** Read-only lookup; query functions validate the requested resource and UUID. */
  find<R extends ResourceName>(resource: R, id: string): DeepReadonly<ResourceTypes[R]> | undefined {
    const entry = this.#byId.get(id);
    return entry?.resource === resource ? entry.row as DeepReadonly<ResourceTypes[R]> : undefined;
  }

  /** Actual ancestry, excluding the resource itself. */
  hasAncestor(id: string, ancestorId: string): boolean {
    return this.#ancestors.get(id)?.has(ancestorId) ?? false;
  }
}

export function createCatalog(reference: CongoReference): GeographicCatalog {
  return new GeographicCatalog(reference);
}

export async function loadCatalog(): Promise<GeographicCatalog> {
  return createCatalog(await loadCongoReference());
}
