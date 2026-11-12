import { createHash } from 'node:crypto';
import type { Entity } from '../types.ts';
import type { SeedMapping } from './types.ts';

export const fields = ['id', 'entityType', 'kind', 'name', 'countryId', 'parentId', 'codes', 'names', 'level', 'coordinates', 'boundary'] as const;
export const defaults: Record<keyof Entity, string> = {
  id: 'id', entityType: 'entity_type', kind:'kind', name: 'name', countryId: 'country_id', parentId: 'parent_id',
  codes: 'codes', names: 'names', level: 'level', coordinates: 'coordinates', boundary: 'boundary',
};
export function identifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) || Buffer.byteLength(value) > 63) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value}"`;
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export const hash = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex');

export function resolveMapping(mapping: SeedMapping = {}) {
  const schema = mapping.schema ?? 'public';
  const table = mapping.table ?? 'georeference_entities';
  const columns = { ...defaults, ...mapping.columns };
  const columnValues = Object.values(columns);
  if (new Set(columnValues).size !== columnValues.length) throw new Error('Mapping columns must be distinct');
  for (const name of [schema, table, ...columnValues, ...(mapping.localIdColumn ? [mapping.localIdColumn] : [])]) identifier(name);
  if (mapping.localIdColumn && columnValues.includes(mapping.localIdColumn)) throw new Error('Local primary key must be separate from the stable identifier and managed columns');
  if (table === '_georeference_imports') throw new Error('Target table cannot be the import ledger');
  return {
    schema, table, columns, localIdColumn: mapping.localIdColumn,
    tableSql: `${identifier(schema)}.${identifier(table)}`,
    ledgerSql: `${identifier(schema)}."_georeference_imports"`,
    targetKey: hash({ schema, table }),
    mappingId: hash({ schema, table, columns, localIdColumn: mapping.localIdColumn ?? null }),
  };
}
export type ResolvedMapping = ReturnType<typeof resolveMapping>;

export function entityFields(entity: Entity, coordinates: boolean, boundaries: boolean): (keyof Entity)[] {
  return fields.filter(field => field in entity && (field !== 'coordinates' || coordinates) && (field !== 'boundary' || boundaries));
}

export function schemaSql(mapping: ResolvedMapping): string {
  const c = (field: keyof Entity) => identifier(mapping.columns[field]);
  return `CREATE TABLE ${mapping.tableSql} (
    ${c('id')} TEXT PRIMARY KEY, ${c('entityType')} TEXT NOT NULL, ${c('kind')} TEXT,
    ${c('name')} TEXT NOT NULL, ${c('countryId')} TEXT NOT NULL,
    ${c('parentId')} TEXT REFERENCES ${mapping.tableSql}(${c('id')}) DEFERRABLE INITIALLY DEFERRED,
    ${c('codes')} JSONB NOT NULL DEFAULT '{}', ${c('names')} JSONB NOT NULL DEFAULT '{}',
    ${c('level')} INTEGER, ${c('coordinates')} JSONB, ${c('boundary')} JSONB
  )`;
}
