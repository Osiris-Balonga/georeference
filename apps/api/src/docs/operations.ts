import { getResource, queryRelated, queryResources, type GeographicCatalog, type ResourceName } from '242places';
import { resourcePaths } from '../schemas/resources.ts';
import { meta } from '../routes/resources.ts';
import { coverageResponse, datasetResponse } from '../routes/reference.ts';
import { chapters, resources, type Locale } from './content.ts';
import { chapterSpecification } from './specification.ts';

export interface ReferenceOperation {
  group: string;
  slug: string;
  path: string;
  title: string;
  navigationLabel: string;
}

const singular: Record<string, [string, string]> = {
  countries: ['un pays', 'a country'], departments: ['un département', 'a department'],
  communes: ['une commune', 'a commune'], districts: ['un district', 'a district'],
  arrondissements: ['un arrondissement', 'an arrondissement'],
  'urban-communities': ['une communauté urbaine', 'an urban community'],
  'rural-communities': ['une communauté rurale', 'a rural community'],
  neighborhoods: ['un quartier', 'a neighborhood'], villages: ['un village', 'a village'],
};

/** Derive the documentation index from registered routes, including relationship routes. */
export function referenceOperations(document: unknown, locale: Locale): ReferenceOperation[] {
  const operations: ReferenceOperation[] = [];
  const fr = locale === 'fr';
  for (const [group, french, english] of resources) {
    const spec = chapterSpecification(document, locale, group);
    const label = (fr ? french : english).toLocaleLowerCase(locale);
    const entries = Object.entries(spec.paths).sort(([a], [b]) => a.split('/').length - b.split('/').length || a.localeCompare(b, 'en'));
    for (const [path, methods] of entries) {
      if (!methods.get) continue;
      const parts = path.split('/').filter(Boolean);
      const detail = parts.at(-1) === '{id}';
      const relation = path.includes('{id}') && !detail;
      const parent = parts[1]!;
      const slug = detail ? 'get' : relation ? `by-${parent}` : singular[group] ? 'list' : parts.at(-1)!;
      const title = detail ? (fr ? `Consulter ${singular[group]![0]}` : `Get ${singular[group]![1]}`)
        : relation ? (fr ? `Lister les ${label} d’${singular[parent]![0]}` : `List ${label} in ${singular[parent]![1]}`)
          : singular[group] ? (fr ? `Lister les ${label}` : `List ${label}`) : methods.get.summary!;
      const navigationLabel = detail ? (fr ? 'Consulter par UUID' : 'Get by UUID')
        : relation ? (fr ? `Par ${singular[parent]![0].replace(/^une? /, '')}` : `By ${singular[parent]![1].replace(/^an? /, '')}`) : title;
      operations.push({ group, slug, path, title, navigationLabel });
    }
  }
  return operations;
}

export function operationAddress(locale: Locale, operation: ReferenceOperation): string {
  return `/docs/${locale}/${operation.group}/${operation.slug}`;
}

const resourceForPath = (path: string) => Object.entries(resourcePaths).find(([, value]) => value === path)?.[0] as ResourceName | undefined;

/** Examples use the same queries/response builders as HTTP routes, never invented records. */
function operationExample(catalog: GeographicCatalog, operation: ReferenceOperation): { response: unknown; id?: string | undefined } {
  if (operation.group === 'health') return { response: { status: 'ok' } };
  if (operation.path === '/v1/dataset') return { response: datasetResponse(catalog) };
  if (operation.path === '/v1/coverage') return { response: coverageResponse(catalog) };
  const parts = operation.path.split('/').filter(Boolean);
  const resource = resourceForPath(operation.slug.startsWith('by-') ? parts.at(-1)! : parts[1]!)!;
  if (operation.slug === 'get') {
    const row = queryResources(catalog, resource).data[0];
    return row ? { id: row.id, response: { data: getResource(catalog, resource, row.id), meta: meta(catalog) } } : { response: undefined };
  }
  const parent = operation.slug.startsWith('by-') ? resourceForPath(parts[1]!) : undefined;
  const parentRows = parent ? catalog.resources[parent] : [];
  const selected = parent ? parentRows.find(row => queryRelated(catalog, parent, row.id, resource, { limit: 1 }).total > 0) ?? parentRows[0] : undefined;
  if (parent && !selected) return { response: undefined };
  const result = parent && selected ? queryRelated(catalog, parent, selected.id, resource) : queryResources(catalog, resource);
  return { id: selected?.id, response: { data: [...result.data], meta: {
    ...meta(catalog), total: result.total, limit: result.limit, offset: result.offset,
  } } };
}

export function operationSpecification(document: unknown, locale: Locale, operation: ReferenceOperation,
  catalog: GeographicCatalog): ReturnType<typeof chapterSpecification> {
  const spec = chapterSpecification(document, locale, operation.group);
  const get = spec.paths[operation.path]!.get!;
  spec.paths = { [operation.path]: { get } };
  spec.info.title = operation.title;
  get.summary = operation.title;
  if (operation.slug === 'list') {
    get.description = chapters(locale).find(chapter => chapter.slug === operation.group)!.sections[0]!.html.replace(/<\/?p>/g, '');
  }
  const example = operationExample(catalog, operation);
  const pagination = (example.response as { meta?: { limit?: number; offset?: number } } | undefined)?.meta;
  for (const parameter of get.parameters ?? []) {
    if (parameter.name === 'limit' || parameter.name === 'offset') {
      const value = pagination?.[parameter.name];
      if (value !== undefined) Object.assign(parameter, { example: value });
    }
  }
  if (example.id) {
    const parameter = get.parameters?.find(item => item.name === 'id');
    if (parameter) Object.assign(parameter, { example: example.id });
  }
  const success = get.responses?.['200'] as { content: Record<string, { example?: unknown }> };
  if (example.response !== undefined) success.content['application/json']!.example = example.response;
  return spec;
}
