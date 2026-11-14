import type { GeographicCatalog } from './catalog.ts';
import { definitions, RESOURCE_NAMES, UUID_PATTERN, type ResourceName } from './model.ts';
import type { DeepReadonly, ResourceQuery, ResourceQueryResult, ResourceTypes } from './types.ts';

export class CatalogQueryError extends Error {
  readonly code: 'INVALID_QUERY' | 'NOT_FOUND';
  constructor(code: 'INVALID_QUERY' | 'NOT_FOUND', message: string) {
    super(message);
    this.name = 'CatalogQueryError';
    this.code = code;
  }
}

function invalid(message: string): never {
  throw new CatalogQueryError('INVALID_QUERY', message);
}

function validateResource(resource: ResourceName): void {
  if (!RESOURCE_NAMES.includes(resource)) invalid('Unknown resource category');
}

export function getResource<R extends ResourceName>(catalog: GeographicCatalog, resource: R, id: string): DeepReadonly<ResourceTypes[R]> {
  validateResource(resource);
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) invalid('Expected a stable UUID');
  const row = catalog.find(resource, id);
  if (!row) throw new CatalogQueryError('NOT_FOUND', 'Resource not found');
  return row;
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalized(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr');
}

const byName = new Intl.Collator('fr', { sensitivity: 'base' });

function validateQuery(catalog: GeographicCatalog, resource: ResourceName, options: ResourceQuery, related: boolean) {
  if (!object(options)) invalid('Expected query options');
  const permitted = related ? ['q', 'limit', 'offset'] : ['q', 'limit', 'offset', 'filters'];
  for (const key of Object.keys(options)) if (!permitted.includes(key)) invalid(`Unknown query option: ${key}`);
  if (options.q !== undefined && (typeof options.q !== 'string' || options.q.trim().length > 100)) {
    invalid('Search must be text with at most 100 characters');
  }
  const limit = options.limit === undefined ? 50 : options.limit;
  const offset = options.offset === undefined ? 0 : options.offset;
  if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) invalid('Limit must be an integer from 1 to 100');
  if (typeof offset !== 'number' || !Number.isSafeInteger(offset) || offset < 0) invalid('Offset must be a nonnegative safe integer');
  const filters: [string, string][] = [];
  if (options.filters !== undefined) {
    if (!object(options.filters)) invalid('Expected parent filters');
    for (const [field, value] of Object.entries(options.filters)) {
      const definition = definitions[resource];
      if (!Object.hasOwn(definition.references, field)) invalid(`Unsupported parent filter: ${field}`);
      const parentResource = definition.references[field]!;
      if (typeof value !== 'string') invalid('Parent filters require a stable UUID');
      getResource(catalog, parentResource, value);
      filters.push([field, value]);
    }
  }
  return { q: normalized(options.q?.trim() ?? ''), limit, offset, filters };
}

function select<R extends ResourceName>(catalog: GeographicCatalog, resource: R, options: ResourceQuery, ancestorId?: string): ResourceQueryResult<R> {
  validateResource(resource);
  const { q, limit, offset, filters } = validateQuery(catalog, resource, options, ancestorId !== undefined);
  const matching = (catalog.resources[resource] as readonly DeepReadonly<ResourceTypes[R]>[])
    .filter(row => (!q || normalized(row.name).includes(q)) &&
      filters.every(([field, value]) => row[field] === value) &&
      (ancestorId === undefined || catalog.hasAncestor(row.id, ancestorId)))
    .sort((left, right) => byName.compare(left.name, right.name) || left.id.localeCompare(right.id, 'en'));
  return { data: matching.slice(offset, offset + limit), total: matching.length, limit, offset };
}

export function queryResources<R extends ResourceName>(catalog: GeographicCatalog, resource: R, options: ResourceQuery = {}): ResourceQueryResult<R> {
  return select(catalog, resource, options);
}

function supportsAncestor(resource: ResourceName, ancestor: ResourceName): boolean {
  return Object.values(definitions[resource].references).some(parent =>
    parent !== undefined && (parent === ancestor || supportsAncestor(parent, ancestor)));
}

export function queryRelated<R extends ResourceName>(catalog: GeographicCatalog, parentResource: ResourceName, parentId: string, resource: R, options: ResourceQuery = {}): ResourceQueryResult<R> {
  validateResource(parentResource);
  validateResource(resource);
  if (!supportsAncestor(resource, parentResource)) invalid('Unsupported geographic relationship');
  getResource(catalog, parentResource, parentId);
  return select(catalog, resource, options, parentId);
}
