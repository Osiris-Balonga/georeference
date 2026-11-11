import type { QueryClient, SeedInput, SeedOptions, SeedReport } from './types.ts';
import { hash, resolveMapping } from './mapping.ts';
import { existingRows, localIds, summarize, targetExists, validateInput, validateReferences } from './preflight.ts';
import { assertCanStart, beginImport, checkpoint, revisionFor, setup } from './ledger.ts';
import { writeEntity } from './write.ts';
import { validateRetainedChildren } from './retained.ts';

export type { QueryClient, SeedInput, SeedMapping, SeedOptions, SeedReport } from './types.ts';

/** Verify a package before importing. The client must be one dedicated PostgreSQL session. */
export async function seedPostgres(client: QueryClient, packageDirectory: string, options: SeedOptions = {}): Promise<SeedReport> {
  const { readPackage } = await import('../package.ts');
  return seedEntities(client, await readPackage(packageDirectory), options);
}

/** Low-level entry point for already verified canonical packages. No deletion mode is supported. */
export async function seedEntities(client: QueryClient, input: SeedInput, options: SeedOptions = {}): Promise<SeedReport> {
  options.signal?.throwIfAborted();
  const entities = validateInput(input, options);
  const mapping = resolveMapping(options.mapping);
  const dryRun = options.dryRun ?? true;
  let locked = false;
  try {
    if (!dryRun) {
      const acquired = (await client.query('SELECT pg_try_advisory_lock(hashtext($1)) AS acquired', [`georeference:${mapping.targetKey}`])).rows[0]?.acquired;
      if (acquired !== true) throw new Error('Another import holds the target lock; use a dedicated client connection');
      locked = true;
    }
    const exists = await targetExists(client, mapping);
    if (!exists && (!options.createSchema || mapping.localIdColumn)) throw new Error('Target table is missing; use createSchema for standard tables or create a compatible mapped table first');
    const existing = await existingRows(client, mapping, entities, input, exists);
    validateReferences(entities, existing, options);
    await validateRetainedChildren(client, mapping, entities, existing, options);
    const batchSize = options.batchSize ?? 500;
    const importKey = hash({ contentId: input.manifest.contentId, mappingId: mapping.mappingId, batchSize, mode: options.mode ?? 'upsert' });
    await assertCanStart(client, mapping, importKey);
    const revision = await revisionFor(client, mapping, input, options);
    const report = summarize(input, entities, existing, mapping, { ...options, revision });
    if (dryRun) return report;
    await setup(client, mapping, exists);
    const state = await beginImport(client, mapping, input, importKey, revision);
    if (state.offset > entities.length || state.offset % batchSize !== 0 && state.offset !== entities.length) throw new Error('Invalid import checkpoint');
    report.resumedBatches = Math.ceil(state.offset / batchSize);
    const ids = localIds(existing);
    if (entities.length === 0) {
      await client.query('BEGIN');
      try { await checkpoint(client, mapping, state, 0, true); await client.query('COMMIT'); }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    }
    for (let offset = state.offset; offset < entities.length; offset += batchSize) {
      options.signal?.throwIfAborted();
      const end = Math.min(offset + batchSize, entities.length);
      await client.query('BEGIN');
      try {
        for (const entity of entities.slice(offset, end)) {
          options.signal?.throwIfAborted();
          await writeEntity(client, mapping, entity, input, options, existing, ids);
        }
        await checkpoint(client, mapping, state, end, end === entities.length);
        await client.query('COMMIT');
        report.completedBatches++;
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
    return report;
  } finally {
    if (locked) await client.query('SELECT pg_advisory_unlock(hashtext($1))', [`georeference:${mapping.targetKey}`]);
  }
}
