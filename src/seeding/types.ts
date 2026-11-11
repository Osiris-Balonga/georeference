import type { Entity, ExportManifest } from '../types.ts';

export interface QueryClient {
  /** Use a dedicated connection, not a pool: transactions and advisory locks are session-bound. */
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}
export interface SeedMapping {
  schema?: string;
  table?: string;
  columns?: Partial<Record<keyof Entity, string>>;
  /** Existing serial/identity primary key; references are resolved to these local keys. */
  localIdColumn?: string;
}
export interface SeedOptions {
  dryRun?: boolean;
  createSchema?: boolean;
  mode?: 'insert-only' | 'upsert';
  batchSize?: number;
  /** Monotonic import revision, independent of the opaque dataset version label. */
  revision?: number;
  allowDowngrade?: boolean;
  mapping?: SeedMapping;
  signal?: AbortSignal;
}
export interface SeedInput { manifest: ExportManifest; entities: Entity[] }
export interface SeedReport {
  dryRun: boolean;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  conflicts: string[];
  resumedBatches: number;
  completedBatches: number;
  total: number;
  revision: number;
}
