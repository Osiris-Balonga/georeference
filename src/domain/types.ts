import type { Boundary, Coordinates, SnapshotMetadata } from '../types.ts';
import type { ResourceName, ResourceRow } from './model.ts';

interface BaseResource extends ResourceRow {
  coordinates?: Coordinates | null;
  boundary?: Boundary | null;
}

export interface Country extends BaseResource { iso2: string; iso3: string }
export interface Department extends BaseResource { countryId: string }
export interface Commune extends BaseResource { departmentId: string }
export interface District extends BaseResource { departmentId: string }
export interface Arrondissement extends BaseResource { communeId: string; number: number | null }
export interface UrbanCommunity extends BaseResource { districtId: string }
export interface RuralCommunity extends BaseResource { districtId: string }
export interface Neighborhood extends BaseResource {
  communeId: string | null;
  arrondissementId: string | null;
  urbanCommunityId: string | null;
}
export interface Village extends BaseResource {
  districtId: string | null;
  ruralCommunityId: string | null;
  urbanCommunityId: string | null;
}

export interface ResourceTypes {
  countries: Country;
  departments: Department;
  communes: Commune;
  districts: District;
  arrondissements: Arrondissement;
  urbanCommunities: UrbanCommunity;
  ruralCommunities: RuralCommunity;
  neighborhoods: Neighborhood;
  villages: Village;
}

export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
export type CatalogResources = { readonly [R in ResourceName]: readonly DeepReadonly<ResourceTypes[R]>[] };
export type CatalogMetadata = DeepReadonly<SnapshotMetadata>;
export type ParentField = 'countryId' | 'departmentId' | 'communeId' | 'districtId' |
  'arrondissementId' | 'urbanCommunityId' | 'ruralCommunityId';

export interface CommuneCoverage {
  readonly id: string;
  readonly name: string;
  readonly status: 'partial';
  readonly namedNeighborhoods: number;
  readonly arrondissements: number;
  readonly observationDates: readonly string[];
}

export interface CatalogCoverage {
  readonly status: 'partial';
  readonly completeGeographicInventory: false;
  readonly reviewedAt: string | null;
  readonly sourceDates: readonly string[];
  readonly counts: Readonly<Record<ResourceName, number>>;
  readonly communes: readonly CommuneCoverage[];
}

export interface ResourceQuery {
  q?: string;
  limit?: number;
  offset?: number;
  filters?: Partial<Record<ParentField, string>>;
}

export interface ResourceQueryResult<R extends ResourceName = ResourceName> {
  data: readonly DeepReadonly<ResourceTypes[R]>[];
  total: number;
  limit: number;
  offset: number;
}
