import type { Boundary, Entity, SnapshotMetadata } from './types.ts';
import { GEOGRAPHIC_KINDS } from './types.ts';

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return '{' + Object.keys(object).filter(key => object[key] !== undefined).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(object[key])).join(',') + '}';
  }
  const result = JSON.stringify(value);
  if (result === undefined) throw new Error('Unsupported JSON value');
  return result;
}
function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function text(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.includes('\0')) throw new Error(`Invalid ${label}: expected nonempty text without NUL`);
}
export function validateMetadata(value: unknown): asserts value is SnapshotMetadata {
  if (!object(value) || value.contractVersion !== '1.0') throw new Error('Unsupported snapshot contractVersion');
  text(value.datasetVersion, 'datasetVersion');
  if (!Array.isArray(value.sources) || value.sources.length === 0) throw new Error('At least one attributed data source is required');
  for (const source of value.sources) {
    if (!object(source)) throw new Error('Invalid source');
    for (const key of ['name','url','license','attribution','revision']) text(source[key], `source.${key}`);
    if (!['http:','https:'].includes(new URL(source.url as string).protocol)) throw new Error('Source URL must be HTTP(S)');
  }
}
function validateBoundary(value: unknown): asserts value is Boundary {
  if (!object(value) || !['Polygon','MultiPolygon'].includes(value.type as string) || !Array.isArray(value.coordinates) || !value.coordinates.length) throw new Error('Invalid boundary geometry');
  const polygons = value.type === 'Polygon' ? [value.coordinates] : value.coordinates;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) throw new Error('Boundary polygon needs rings');
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error('Boundary ring requires at least four positions');
      for (const position of ring) {
        if (!Array.isArray(position) || position.length !== 2 || !Number.isFinite(position[0]) || !Number.isFinite(position[1]) || Math.abs(position[0]) > 180 || Math.abs(position[1]) > 90) throw new Error('Invalid boundary coordinate');
      }
      if (ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1]) throw new Error('Boundary ring must be closed');
    }
  }
}
export function validateEntity(value: unknown): asserts value is Entity {
  if (!object(value)) throw new Error('Entity must be an object');
  const fields = new Set(['id','entityType','kind','name','countryId','parentId','codes','names','level','coordinates','boundary']);
  for (const key of Object.keys(value)) if (!fields.has(key)) throw new Error(`Unknown entity field: ${key}`);
  for (const field of ['id','name','countryId']) text(value[field], field);
  if (!['country','subdivision','locality'].includes(value.entityType as string)) throw new Error('Invalid entityType');
  if(value.kind!==undefined) {
    if(!GEOGRAPHIC_KINDS.includes(value.kind as never)) throw new Error('Invalid geographic kind');
    const expected=value.kind==='country'?'country':['neighborhood','village'].includes(value.kind as string)?'locality':'subdivision';
    if(value.entityType!==expected) throw new Error('Geographic kind does not match entityType');
  }
  if (value.parentId !== null) text(value.parentId, 'parentId');
  if (value.entityType === 'country' && (value.countryId !== value.id || value.parentId !== null)) throw new Error('Country must reference itself and have no parent');
  if (value.entityType !== 'country' && value.parentId === null) throw new Error('Non-country entity requires a parent reference');
  for (const field of ['codes','names']) {
    if (value[field] === undefined) continue;
    if (!object(value[field])) throw new Error(`Invalid ${field}`);
    for (const [key, item] of Object.entries(value[field])) { text(key, field+' key'); text(item, field+' value'); }
  }
  if (value.level !== undefined && (!Number.isSafeInteger(value.level) || (value.level as number) < 1)) throw new Error('Invalid administrative level');
  if (value.coordinates !== undefined && value.coordinates !== null) {
    if (!object(value.coordinates)) throw new Error('Invalid coordinates');
    const {longitude,latitude} = value.coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number' || !Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude)>180 || Math.abs(latitude)>90) throw new Error('Invalid longitude/latitude coordinates');
  }
  if (value.boundary !== undefined && value.boundary !== null) validateBoundary(value.boundary);
}
