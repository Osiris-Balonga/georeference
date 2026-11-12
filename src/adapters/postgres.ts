import type { Entity, ExportAdapter } from '../types.ts';
import { project, validateOptions, writeChunks } from './common.ts';

export const POSTGRES_SCHEMA = `CREATE TABLE IF NOT EXISTS "georeference_entities" (
  "id" TEXT PRIMARY KEY,
  "entity_type" TEXT NOT NULL,
  "kind" TEXT,
  "name" TEXT NOT NULL,
  "country_id" TEXT NOT NULL,
  "parent_id" TEXT REFERENCES "georeference_entities"("id") DEFERRABLE INITIALLY DEFERRED,
  "codes" JSONB NOT NULL DEFAULT '{}',
  "names" JSONB NOT NULL DEFAULT '{}',
  "level" INTEGER,
  "coordinates" JSONB,
  "boundary" JSONB
);
CREATE INDEX IF NOT EXISTS "georeference_entities_parent_idx" ON "georeference_entities" ("parent_id");
`;

function literal(value: string | number | null, json = false): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (value.includes('\0')) throw new Error('PostgreSQL text cannot contain NUL characters');
  return `'${value.replaceAll("'", "''")}'${json ? '::jsonb' : ''}`;
}

function values(entity: Entity): [string, string][] {
  const result: [string, string][] = [
    ['id', literal(entity.id)], ['entity_type', literal(entity.entityType)], ['name', literal(entity.name)],
    ['country_id', literal(entity.countryId)], ['parent_id', literal(entity.parentId)],
  ];
  for (const key of ['codes', 'names', 'coordinates', 'boundary'] as const) {
    if (Object.hasOwn(entity, key)) result.push([key, entity[key] === null ? 'NULL' : literal(JSON.stringify(entity[key]), true)]);
  }
  if (Object.hasOwn(entity, 'level')) result.push(['level', literal(entity.level ?? null)]);
  if (entity.kind!==undefined) result.push(['kind',literal(entity.kind)]);
  return result;
}

export const postgresAdapter: ExportAdapter = {
  format: 'sql-postgres', version: '1.1.0', validate: validateOptions,
  async write(context) {
    await writeChunks(context, 'entities.sql', (function* () {
      yield '-- GeoReference PostgreSQL export. data-only requires a compatible existing schema.\n';
      yield 'BEGIN;\nSET LOCAL standard_conforming_strings = on;\n';
      if (context.plan.request.schemaMode !== 'data-only') yield POSTGRES_SCHEMA;
      for (const original of context.plan.entities()) {
        const row = values(project(original, context.plan.request));
        const columns = row.map(([key]) => `"${key}"`).join(', ');
        const mutable = row.filter(([key]) => key !== 'id');
        const conflict = context.plan.request.sqlMode === 'insert-only' ? 'DO NOTHING'
          : `DO UPDATE SET ${mutable.map(([key]) => `"${key}" = EXCLUDED."${key}"`).join(', ')} WHERE ${mutable.map(([key]) => `"georeference_entities"."${key}" IS DISTINCT FROM EXCLUDED."${key}"`).join(' OR ')}`;
        yield `INSERT INTO "georeference_entities" (${columns}) VALUES (${row.map(([, value]) => value).join(', ')}) ON CONFLICT ("id") ${conflict};\n`;
      }
      yield 'COMMIT;\n';
    })());
    return ['entities.sql'];
  },
};
