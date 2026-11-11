import type { ExportAdapter } from '../types.ts';
import { csvAdapter } from './csv.ts';
import { geojsonAdapter } from './geojson.ts';
import { jsonAdapter, ndjsonAdapter } from './json.ts';
import { postgresAdapter } from './postgres.ts';
import { sqliteAdapter } from './sqlite.ts';

/** A static registry keeps format dependencies separate from selection and identity rules. */
export function getBuiltinAdapters(): ExportAdapter[] {
  return [jsonAdapter, ndjsonAdapter, csvAdapter, postgresAdapter, sqliteAdapter, geojsonAdapter];
}
