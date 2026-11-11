import type { Entity } from '../types.ts';
import { entityFields, identifier, stable } from './mapping.ts';
import type { ResolvedMapping } from './mapping.ts';
import { valuesFor } from './preflight.ts';
import type { QueryClient, SeedInput, SeedOptions } from './types.ts';

export async function writeEntity(client: QueryClient, mapping: ResolvedMapping, entity: Entity, input: SeedInput, options: SeedOptions, existing: Map<string, Record<string, unknown>>, ids: Map<string, unknown>) {
  const current = existing.get(entity.id);
  const fields = entityFields(entity, input.manifest.request.coordinates ?? false, input.manifest.request.boundaries ?? false);
  if (!current && mapping.localIdColumn) {
    const reserved = (await client.query('SELECT nextval(pg_get_serial_sequence($1,$2)) AS local_id', [mapping.tableSql, mapping.localIdColumn])).rows[0]?.local_id;
    if (reserved == null) throw new Error('Local primary key mapping requires a serial/identity sequence');
    ids.set(entity.id, reserved);
  }
  const values = valuesFor(entity, fields, mapping, ids);
  if (mapping.localIdColumn && [entity.countryId, entity.parentId].some(id => id !== null && ids.get(id) == null)) throw new Error(`Unresolved local reference for ${entity.id}`);
  if (current) {
    if (options.mode === 'insert-only' || fields.every((field, index) => stable(current[field]) === stable(values[index]))) return;
    const changes = fields.filter(field => field !== 'id');
    const updateValues = changes.map(field => values[fields.indexOf(field)]);
    await client.query(`UPDATE ${mapping.tableSql} SET ${changes.map((field, index) => `${identifier(mapping.columns[field])}=$${index + 1}`).join(',')} WHERE ${identifier(mapping.columns.id)}=$${updateValues.length + 1}`, [...updateValues, entity.id]);
    return;
  }
  const columns = fields.map(field => identifier(mapping.columns[field]));
  if (mapping.localIdColumn) { columns.push(identifier(mapping.localIdColumn)); values.push(ids.get(entity.id)); }
  const override = mapping.localIdColumn ? ' OVERRIDING SYSTEM VALUE' : '';
  await client.query(`INSERT INTO ${mapping.tableSql} (${columns.join(',')})${override} VALUES (${values.map((_, index) => `$${index + 1}`).join(',')})`, values);
}
