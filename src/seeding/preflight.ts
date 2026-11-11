import type { Entity } from '../types.ts';
import type { QueryClient, SeedInput, SeedOptions, SeedReport } from './types.ts';
import { entityFields, fields, identifier, stable } from './mapping.ts';
import type { ResolvedMapping } from './mapping.ts';

export async function targetExists(client: QueryClient, mapping: ResolvedMapping): Promise<boolean> {
  const result = await client.query('SELECT to_regclass($1) AS relation', [mapping.tableSql]);
  return result.rows[0]?.relation != null;
}

export function validateInput(input: SeedInput, options: SeedOptions): Entity[] {
  if (input.manifest.contractVersion !== '1.0') throw new Error('Unsupported package contract version');
  if (input.manifest.request.spreadsheetSafe) throw new Error('Spreadsheet-safe CSV cannot be used for database seeding');
  if (!input.manifest.datasetVersion || !input.manifest.contentId) throw new Error('Package version and content ID are required');
  if (input.entities.length !== input.manifest.count) throw new Error('Package entity count does not match the manifest');
  if (!Number.isSafeInteger(options.batchSize ?? 500) || (options.batchSize ?? 500) < 1 || (options.batchSize ?? 500) > 10000) throw new Error('batchSize must be an integer from 1 to 10000');
  if (!Number.isSafeInteger(options.revision ?? 0) || (options.revision ?? 0) < 0) throw new Error('revision must be a nonnegative safe integer');
  if (options.mode !== undefined && !['upsert', 'insert-only'].includes(options.mode)) throw new Error('Unsupported seeding mode');
  const byId = new Map<string, Entity>();
  for (const entity of input.entities) {
    if (!entity.id || !entity.name || !entity.countryId || !['country', 'subdivision', 'locality'].includes(entity.entityType)) throw new Error('Invalid canonical entity');
    if (byId.has(entity.id)) throw new Error(`Duplicate stable identifier: ${entity.id}`);
    if (entity.entityType === 'country' && (entity.parentId !== null || entity.countryId !== entity.id)) throw new Error(`Invalid country relationships: ${entity.id}`);
    if (entity.parentId === entity.id) throw new Error(`Entity is its own parent: ${entity.id}`);
    byId.set(entity.id, entity);
  }
  const ordered: Entity[] = [];
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (entity: Entity) => {
    if (done.has(entity.id)) return;
    if (visiting.has(entity.id)) throw new Error(`Cycle in parent references: ${entity.id}`);
    visiting.add(entity.id);
    if (entity.countryId !== entity.id && byId.has(entity.countryId)) visit(byId.get(entity.countryId)!);
    if (entity.parentId && byId.has(entity.parentId)) {
      const parent = byId.get(entity.parentId)!;
      if (parent.countryId !== entity.countryId) throw new Error(`Parent country mismatch: ${entity.id}`);
      visit(parent);
    }
    visiting.delete(entity.id);
    done.add(entity.id);
    ordered.push(entity);
  };
  for (const entity of [...byId.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) visit(entity);
  return ordered;
}

export async function existingRows(client: QueryClient, mapping: ResolvedMapping, entities: Entity[], input: SeedInput, exists: boolean) {
  const result = new Map<string, Record<string, unknown>>();
  if (!exists) return result;
  const available = new Set((await client.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2', [mapping.schema, mapping.table])).rows.map(row => row.column_name));
  const needed = new Set<keyof Entity>(['id', 'entityType', 'name', 'countryId', 'parentId']);
  for (const entity of entities) for (const field of entityFields(entity, input.manifest.request.coordinates ?? false, input.manifest.request.boundaries ?? false)) needed.add(field);
  for (const field of needed) if (!available.has(mapping.columns[field])) throw new Error(`Missing target column: ${mapping.columns[field]}`);
  if (mapping.localIdColumn && !available.has(mapping.localIdColumn)) throw new Error(`Missing local key column: ${mapping.localIdColumn}`);
  const selects = fields.filter(field => needed.has(field)).map(field => `${identifier(mapping.columns[field])} AS ${identifier(field)}`);
  if (mapping.localIdColumn) selects.push(`${identifier(mapping.localIdColumn)} AS "_localId"`);
  const ids = [...new Set(entities.flatMap(entity => [entity.id, entity.countryId, ...(entity.parentId ? [entity.parentId] : [])]))];
  for (let offset = 0; offset < ids.length; offset += 1000) {
    const loaded = await client.query(`SELECT ${selects.join(',')} FROM ${mapping.tableSql} WHERE ${identifier(mapping.columns.id)} = ANY($1::text[])`, [ids.slice(offset, offset + 1000)]);
    for (const row of loaded.rows) result.set(String(row.id), row);
  }
  return result;
}

export function validateReferences(entities: Entity[], existing: Map<string, Record<string, unknown>>) {
  const byId = new Map(entities.map(entity => [entity.id, entity]));
  for (const entity of entities) {
    for (const id of [entity.countryId, ...(entity.parentId ? [entity.parentId] : [])]) {
      if (!byId.has(id) && !existing.has(id)) throw new Error(`Unresolved reference ${id} from ${entity.id}`);
    }
    const country = byId.get(entity.countryId) ?? existing.get(entity.countryId);
    if (country?.entityType !== 'country') throw new Error(`Country reference is not a country: ${entity.countryId}`);
    const parent = entity.parentId ? byId.get(entity.parentId) ?? existing.get(entity.parentId) : undefined;
    if (parent) {
      const expectedCountry = '_localId' in parent ? existing.get(entity.countryId)?._localId : entity.countryId;
      if (expectedCountry == null || stable(parent.countryId) !== stable(expectedCountry)) throw new Error(`Parent country mismatch: ${entity.id}`);
    }
  }
}

export function localIds(existing: Map<string, Record<string, unknown>>): Map<string, unknown> {
  return new Map([...existing].map(([id, row]) => [id, row._localId]));
}

export function valuesFor(entity: Entity, fields: (keyof Entity)[], mapping: ResolvedMapping, ids: Map<string, unknown>): unknown[] {
  return fields.map(field => {
    const value = entity[field];
    if (mapping.localIdColumn && (field === 'countryId' || field === 'parentId') && value !== null) return ids.get(String(value)) ?? { unresolvedReference: String(value) };
    return value ?? null;
  });
}

export function summarize(input: SeedInput, entities: Entity[], existing: Map<string, Record<string, unknown>>, mapping: ResolvedMapping, options: SeedOptions): SeedReport {
  const report: SeedReport = { dryRun: options.dryRun ?? true, inserted: 0, updated: 0, unchanged: 0, skipped: 0, conflicts: [], resumedBatches: 0, completedBatches: 0, total: entities.length, revision: options.revision ?? 0 };
  const ids = localIds(existing);
  for (const entity of entities) {
    const current = existing.get(entity.id);
    if (!current) { report.inserted++; continue; }
    const selected = entityFields(entity, input.manifest.request.coordinates ?? false, input.manifest.request.boundaries ?? false);
    const incoming = valuesFor(entity, selected, mapping, ids);
    const changed = selected.some((field, index) => stable(current[field]) !== stable(incoming[index]));
    if (!changed) report.unchanged++;
    else if (options.mode === 'insert-only') { report.skipped++; report.conflicts.push(entity.id); }
    else report.updated++;
  }
  return report;
}
