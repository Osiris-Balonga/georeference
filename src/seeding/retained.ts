import type { Entity } from '../types.ts';
import { identifier, stable } from './mapping.ts';
import type { ResolvedMapping } from './mapping.ts';
import type { QueryClient, SeedOptions } from './types.ts';

/** Partial updates must not invalidate descendants intentionally absent from the package. */
export async function validateRetainedChildren(client: QueryClient, mapping: ResolvedMapping, entities: Entity[], existing: Map<string, Record<string, unknown>>, options: SeedOptions): Promise<void> {
  if (options.mode === 'insert-only') return;
  const changed = new Map<string, { entity: Entity; country: unknown }>();
  for (const entity of entities) {
    const current = existing.get(entity.id);
    if (!current) continue;
    const country = mapping.localIdColumn ? existing.get(entity.countryId)?._localId : entity.countryId;
    if (current.entityType !== entity.entityType || stable(current.countryId) !== stable(country)) {
      changed.set(String(mapping.localIdColumn ? current._localId : entity.id), { entity, country });
    }
  }
  const ids = [...changed.keys()];
  if (ids.length === 0) return;
  const included = entities.map(entity => entity.id);
  const c = (field: keyof Entity) => identifier(mapping.columns[field]);
  for (let offset = 0; offset < ids.length; offset += 1000) {
    const children = (await client.query(`SELECT ${c('id')} AS id,${c('countryId')} AS country,${c('parentId')} AS parent
      FROM ${mapping.tableSql} WHERE ${c('parentId')}::text = ANY($1::text[]) AND ${c('id')} <> ALL($2::text[])`, [ids.slice(offset, offset + 1000), included])).rows;
    for (const child of children) {
      const parent = changed.get(String(child.parent))!;
      if (parent.entity.entityType === 'locality' || parent.country == null || stable(child.country) !== stable(parent.country)) {
        throw new Error(`Update would invalidate retained child ${String(child.id)}; include and update the affected subtree`);
      }
    }
  }
}
