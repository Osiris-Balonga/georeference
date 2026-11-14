import { Type, type TSchema } from 'typebox';
import type { ParentField, ResourceName } from 'georeference';
import { uuid } from './common.ts';

const nullableUuid = Type.Union([uuid, Type.Null()]);
const base = { id: uuid, name: Type.String() };
const coordinates = Type.Object({ longitude: Type.Number({ minimum: -180, maximum: 180 }),
  latitude: Type.Number({ minimum: -90, maximum: 90 }) });
const point = Type.Array(Type.Number(), { minItems: 2, maxItems: 2 });
const ring = Type.Array(point, { minItems: 4 });
const polygon = Type.Array(ring, { minItems: 1 });
const geometry = {
  coordinates: Type.Optional(Type.Union([coordinates, Type.Null()])),
  boundary: Type.Optional(Type.Union([
    Type.Object({ type: Type.Literal('Polygon'), coordinates: polygon }),
    Type.Object({ type: Type.Literal('MultiPolygon'), coordinates: Type.Array(polygon, { minItems: 1 }) }),
    Type.Null(),
  ])),
};
const resource = (title: string, fields: Record<string, TSchema>) =>
  Type.Object({ ...base, ...fields, ...geometry }, { title, additionalProperties: false });

export const resourceSchemas: Record<ResourceName, TSchema> = {
  countries: resource('Country', { iso2: Type.String(), iso3: Type.String() }),
  departments: resource('Department', { countryId: uuid }),
  communes: resource('Commune', { departmentId: uuid }),
  districts: resource('District', { departmentId: uuid }),
  arrondissements: resource('Arrondissement', { communeId: uuid,
    number: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]) }),
  urbanCommunities: resource('UrbanCommunity', { districtId: uuid }),
  ruralCommunities: resource('RuralCommunity', { districtId: uuid }),
  neighborhoods: resource('Neighborhood', { communeId: nullableUuid,
    arrondissementId: nullableUuid, urbanCommunityId: nullableUuid, ruralCommunityId: Type.Optional(nullableUuid) }),
  villages: resource('Village', { districtId: nullableUuid,
    ruralCommunityId: nullableUuid, urbanCommunityId: nullableUuid }),
};

export const resourcePaths: Record<ResourceName, string> = {
  countries: 'countries', departments: 'departments', communes: 'communes', districts: 'districts',
  arrondissements: 'arrondissements', urbanCommunities: 'urban-communities',
  ruralCommunities: 'rural-communities', neighborhoods: 'neighborhoods', villages: 'villages',
};
export const parentFields: Record<ResourceName, readonly ParentField[]> = {
  countries: [], departments: ['countryId'], communes: ['departmentId'], districts: ['departmentId'],
  arrondissements: ['communeId'], urbanCommunities: ['districtId'], ruralCommunities: ['districtId'],
  neighborhoods: ['communeId', 'arrondissementId', 'urbanCommunityId', 'ruralCommunityId'],
  villages: ['districtId', 'ruralCommunityId', 'urbanCommunityId'],
};
