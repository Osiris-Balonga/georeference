import type { QueryClient, SeedInput, SeedOptions } from './types.ts';
import { identifier, schemaSql } from './mapping.ts';
import type { ResolvedMapping } from './mapping.ts';

export interface ImportState { importKey: string; revision: number; offset: number }

export async function assertCanStart(client: QueryClient, mapping: ResolvedMapping, importKey: string): Promise<void> {
  const exists = (await client.query('SELECT to_regclass($1) AS relation', [mapping.ledgerSql])).rows[0]?.relation != null;
  if (!exists) return;
  const active = (await client.query(`SELECT import_key FROM ${mapping.ledgerSql} WHERE target_key=$1 AND status='in-progress' AND import_key<>$2 LIMIT 1`, [mapping.targetKey, importKey])).rows[0];
  if (active) throw new Error('An unfinished import must resume with the same package, mapping, mode and batchSize before another import can start');
}

export async function revisionFor(client: QueryClient, mapping: ResolvedMapping, input: SeedInput, options: SeedOptions): Promise<number> {
  const exists = (await client.query('SELECT to_regclass($1) AS relation', [mapping.ledgerSql])).rows[0]?.relation != null;
  if (!exists) return options.revision ?? 0;
  const latest = (await client.query(`SELECT package_id, revision FROM ${mapping.ledgerSql} WHERE target_key=$1 ORDER BY revision DESC LIMIT 1`, [mapping.targetKey])).rows[0];
  const same = latest?.package_id === input.manifest.contentId;
  const revision = options.revision ?? (same ? Number(latest?.revision) : 0);
  if (latest && !options.allowDowngrade && (!same && revision <= Number(latest.revision) || same && revision < Number(latest.revision))) {
    throw new Error(`Import revision must exceed ${String(latest.revision)} for changed content; datasetVersion labels are not ordered`);
  }
  return revision;
}

export async function setup(client: QueryClient, mapping: ResolvedMapping, targetExists: boolean): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${identifier(mapping.schema)}`);
    if (!targetExists) {
      await client.query(schemaSql(mapping));
      await client.query(`CREATE INDEX ON ${mapping.tableSql} (${identifier(mapping.columns.parentId)})`);
    }
    await client.query(`CREATE TABLE IF NOT EXISTS ${mapping.ledgerSql} (
      target_key TEXT NOT NULL, import_key TEXT NOT NULL, mapping_id TEXT NOT NULL,
      package_id TEXT NOT NULL, dataset_version TEXT NOT NULL, revision BIGINT NOT NULL,
      next_offset INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'in-progress',
      PRIMARY KEY(target_key, import_key)
    )`);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}

export async function beginImport(client: QueryClient, mapping: ResolvedMapping, input: SeedInput, importKey: string, revision: number): Promise<ImportState> {
  const previous = (await client.query(`SELECT next_offset,status FROM ${mapping.ledgerSql} WHERE target_key=$1 AND import_key=$2`, [mapping.targetKey, importKey])).rows[0];
  const offset = previous?.status === 'in-progress' ? Number(previous.next_offset) : 0;
  await client.query(`INSERT INTO ${mapping.ledgerSql} (target_key,import_key,mapping_id,package_id,dataset_version,revision,next_offset,status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'in-progress')
    ON CONFLICT (target_key,import_key) DO UPDATE SET next_offset=EXCLUDED.next_offset,status='in-progress',revision=EXCLUDED.revision`,
  [mapping.targetKey, importKey, mapping.mappingId, input.manifest.contentId, input.manifest.datasetVersion, revision, offset]);
  return { importKey, revision, offset };
}

export async function checkpoint(client: QueryClient, mapping: ResolvedMapping, state: ImportState, offset: number, complete: boolean) {
  await client.query(`UPDATE ${mapping.ledgerSql} SET next_offset=$1,status=$2 WHERE target_key=$3 AND import_key=$4`, [offset, complete ? 'complete' : 'in-progress', mapping.targetKey, state.importKey]);
}
