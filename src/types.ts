/** Public v1 contract. IDs are opaque strings and never derived from display names. */
export type EntityType = 'country' | 'subdivision' | 'locality';
export const GEOGRAPHIC_KINDS=['country','department','commune','district','arrondissement','urban-community','rural-community','neighborhood','village','administrative-unit'] as const;
export type GeographicKind=typeof GEOGRAPHIC_KINDS[number];
export interface Coordinates { longitude: number; latitude: number }
export interface Polygon { type: 'Polygon'; coordinates: number[][][] }
export interface MultiPolygon { type: 'MultiPolygon'; coordinates: number[][][][] }
export type Boundary = Polygon | MultiPolygon;
export interface Entity {
  id: string;
  entityType: EntityType;
  kind?: GeographicKind;
  name: string;
  countryId: string;
  parentId: string | null;
  codes?: Record<string, string>;
  names?: Record<string, string>;
  level?: number;
  coordinates?: Coordinates | null;
  boundary?: Boundary | null;
}
export interface DataSource {
  name: string;
  url: string;
  license: string;
  attribution: string;
  revision: string;
}
export interface SnapshotMetadata {
  contractVersion: '1.0';
  datasetVersion: string;
  sources: DataSource[];
}
export interface Selection {
  kinds?: GeographicKind[];
  countries?: string[];
  subdivisions?: string[];
  entityTypes?: EntityType[];
  includeAncestors?: boolean;
  coordinates?: boolean;
  boundaries?: boolean;
}
export type ExportFormat = 'json' | 'ndjson' | 'csv' | 'sql-postgres' | 'sqlite' | 'geojson' | (string & {});
export interface ExportRequest extends Selection {
  format: ExportFormat;
  layout?: 'flat' | 'hierarchical';
  compression?: 'none' | 'gzip' | 'zip';
  schemaMode?: 'schema-and-data' | 'data-only';
  sqlMode?: 'upsert' | 'insert-only';
  spreadsheetSafe?: boolean;
}
export interface ExportPlan {
  request: ExportRequest;
  metadata: SnapshotMetadata;
  count: number;
  contextIds: string[];
  externalReferences: string[];
  /** Repeatable iterator; each call starts at the beginning, in dependency order. */
  entities(): Iterable<Entity>;
  identityEntities?(): Iterable<Entity>;
  dispose?(): void;
}
export interface AdapterContext {
  plan: ExportPlan;
  directory: string;
  signal?: AbortSignal;
}
export interface ExportAdapter {
  format: ExportFormat;
  version: string;
  validate(request: ExportRequest): void;
  /** Return relative filenames, never absolute paths; close all file handles before resolving. */
  write(context: AdapterContext): Promise<string[]>;
}
export interface ManifestFile { path: string; bytes: number; sha256: string; role?:'data'|'metadata' }
export interface ExportManifest {
  geographicCoverage?:'partial'|'complete';
  contractVersion: '1.0';
  generatorVersion: string;
  adapterVersion: string;
  datasetVersion: string;
  contentId: string;
  request: ExportRequest;
  sources: DataSource[];
  count: number;
  counts: Record<EntityType, number>;
  contextIds: string[];
  externalReferences: string[];
  geometry: { coordinates: { requested: boolean; missing: number }; boundaries: { requested: boolean; missing: number }; crs: 'OGC:CRS84' };
  scope: { kind: 'full'; complete: boolean };
  files: ManifestFile[];
}
