export type * from './types.ts';
export { discoverPlaces, placeSummary, placeAncestors } from './domain/discovery.ts';
export type { PlaceSummary, DiscoveryQuery } from './domain/discovery.ts';
export {exportResources,registerResourceAdapter} from './domain/export.ts';
export type {ResourceAdapter} from './domain/export.ts';
export {toResourceTables,validateResourceTables,RESOURCE_NAMES} from './domain/model.ts';
export type {ResourceName,ResourceRow,ResourceTables} from './domain/model.ts';
export { GeographicCatalog, createCatalog, loadCatalog } from './domain/catalog.ts';
export { CatalogQueryError, getResource, queryResources, queryRelated } from './domain/query.ts';
export type {
  Country, Department, Commune, District, Arrondissement, UrbanCommunity, RuralCommunity,
  Neighborhood, Village, ResourceTypes, CatalogResources, CatalogMetadata, CatalogCoverage,
  CommuneCoverage, DeepReadonly, ParentField, ResourceQuery, ResourceQueryResult,
} from './domain/types.ts';
export {readResourcePackage} from './domain/package.ts';
export {seedResources} from './domain/seed.ts';
export type {SqlNames} from './domain/sql.ts';
export { GEOGRAPHIC_KINDS } from './types.ts';
export { loadCongoReference,validateCongoReference } from './congo.ts';
export type { CongoReference,CongoEvidence } from './congo.ts';
export { Snapshot, createSnapshot } from './snapshot.ts';
export { createClient } from './client.ts';
export { exportSnapshot, registerExportAdapter } from './export.ts';
export { verifyPackage, readPackage } from './package.ts';
export { importGeoNames } from './sources/geonames.ts';
export type { GeoNamesPaths } from './sources/geonames.ts';
