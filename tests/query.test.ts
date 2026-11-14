import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CongoReference } from '../src/congo.ts';
import type { Entity, GeographicKind } from '../src/types.ts';
import { createCatalog, loadCatalog } from '../src/domain/catalog.ts';
import { CatalogQueryError, getResource, queryRelated, queryResources } from '../src/domain/query.ts';

const id = (number: number) => `00000000-0000-4000-8000-${number.toString().padStart(12, '0')}`;
const entity = (number: number, kind: GeographicKind, name: string, parent: number | null): Entity => ({
  id: id(number), name, kind, countryId: id(1), parentId: parent === null ? null : id(parent),
  entityType: kind === 'country' ? 'country' : ['neighborhood', 'village'].includes(kind) ? 'locality' : 'subdivision',
  ...(kind === 'country' ? { codes: { iso2: 'CG', iso3: 'COG' } } : {}),
});

function fixture() {
  const reference: CongoReference = {
    metadata: { contractVersion: '1.0', datasetVersion: 'synthetic-test-1', sources: [{
      name: 'Synthetic fixture', url: 'https://example.com/fixture', license: 'MIT', attribution: 'Test fixture', revision: '1',
    }] },
    entities: [
      entity(7, 'neighborhood', 'Direct', 3), entity(1, 'country', 'Fixture country', null),
      entity(2, 'department', 'Fixture department', 1), entity(3, 'commune', 'Bêta', 2),
      entity(4, 'commune', 'Alpha', 2), entity(5, 'arrondissement', 'Central', 3),
      entity(6, 'neighborhood', 'École', 5), entity(8, 'neighborhood', 'Alpha', 4),
      entity(9, 'district', 'Fixture district', 2), entity(10, 'urban-community', 'Fixture urban', 9),
      entity(11, 'rural-community', 'Fixture rural', 9), entity(12, 'village', 'Fixture rural village', 11),
      entity(13, 'village', 'Fixture urban village', 10), entity(14, 'neighborhood', 'Fixture urban quarter', 10),
      entity(15, 'commune', 'Zéro', 2), entity(16, 'arrondissement', 'central', 4),
      entity(17, 'neighborhood', 'ecole', 16),
    ],
    coverage: { status: 'partial', completeGeographicInventory: false }, provenance: {}, issues: {},
  };
  return createCatalog(reference);
}

function expectCode(code: 'INVALID_QUERY' | 'NOT_FOUND') {
  return (error: unknown) => error instanceof CatalogQueryError && error.code === code;
}

test('search ignores case and accents, with stable UUID ordering for equivalent names', () => {
  const catalog = fixture();
  const result = queryResources(catalog, 'neighborhoods', { q: '  ECOLE  ' });
  assert.deepEqual(result.data.map(row => row.id), [id(6), id(17)]);
  assert.equal(result.total, 2);
  assert.equal(result.limit, 50);
  assert.equal(result.offset, 0);
});

test('pagination sorts before slicing and keeps the matching total', () => {
  const catalog = fixture();
  const result = queryResources(catalog, 'communes', { limit: 2, offset: 1 });
  assert.deepEqual(result.data.map(row => row.name), ['Bêta', 'Zéro']);
  assert.equal(result.total, 3);
  assert.equal(result.limit, 2);
  assert.equal(result.offset, 1);
  assert.deepEqual(queryResources(catalog, 'communes', { offset: 50 }).data, []);
});

test('typed UUID lookup distinguishes malformed, missing and wrong-category resources', () => {
  const catalog = fixture();
  assert.equal(getResource(catalog, 'communes', id(3)).departmentId, id(2));
  assert.throws(() => getResource(catalog, 'communes', 'not-a-uuid'), expectCode('INVALID_QUERY'));
  assert.throws(() => getResource(catalog, 'communes', id(999)), expectCode('NOT_FOUND'));
  assert.throws(() => getResource(catalog, 'communes', id(2)), expectCode('NOT_FOUND'));
  assert.throws(() => getResource(catalog, '__proto__' as never, id(2)), expectCode('INVALID_QUERY'));
});

test('direct parent filters select stored relationships without rewriting descendants', () => {
  const catalog = fixture();
  const result = queryResources(catalog, 'neighborhoods', { filters: { communeId: id(3) } });
  assert.deepEqual(result.data.map(row => row.id), [id(7)]);
  assert.deepEqual(queryResources(catalog, 'arrondissements', { filters: { communeId: id(3) } }).data.map(row => row.id), [id(5)]);
  assert.throws(() => queryResources(catalog, 'communes', { filters: { arrondissementId: id(5) } }), expectCode('INVALID_QUERY'));
  assert.throws(() => queryResources(catalog, 'communes', { filters: { departmentId: id(3) } }), expectCode('NOT_FOUND'));
  assert.throws(() => queryResources(catalog, 'communes', { filters: { departmentId: id(999) } }), expectCode('NOT_FOUND'));
});

test('related quarters include direct and arrondissement descendants while retaining real parents', () => {
  const catalog = fixture();
  const result = queryRelated(catalog, 'communes', id(3), 'neighborhoods');
  assert.deepEqual(result.data.map(row => row.id), [id(7), id(6)]);
  const arrondissementQuarter = result.data.find(row => row.id === id(6))!;
  assert.equal(arrondissementQuarter.arrondissementId, id(5));
  assert.equal(arrondissementQuarter.communeId, null);
  assert.deepEqual(queryRelated(catalog, 'arrondissements', id(5), 'neighborhoods').data.map(row => row.id), [id(6)]);
  assert.equal(queryRelated(catalog, 'communes', id(3), 'neighborhoods', { q: 'ecole' }).total, 1);
});

test('district village navigation includes rural and urban community descendants', () => {
  const catalog = fixture();
  assert.deepEqual(queryRelated(catalog, 'districts', id(9), 'villages').data.map(row => row.id), [id(12), id(13)]);
  assert.deepEqual(queryRelated(catalog, 'ruralCommunities', id(11), 'villages').data.map(row => row.id), [id(12)]);
  assert.deepEqual(queryRelated(catalog, 'urbanCommunities', id(10), 'neighborhoods').data.map(row => row.id), [id(14)]);
});

test('known empty scope is partial data, while invalid or nonexistent scopes fail', () => {
  const catalog = fixture();
  assert.equal(queryRelated(catalog, 'communes', id(15), 'neighborhoods').total, 0);
  assert.equal(catalog.coverage.status, 'partial');
  assert.throws(() => queryRelated(catalog, 'communes', id(999), 'neighborhoods'), expectCode('NOT_FOUND'));
  assert.throws(() => queryRelated(catalog, 'communes', id(2), 'neighborhoods'), expectCode('NOT_FOUND'));
  assert.throws(() => queryRelated(catalog, 'neighborhoods', id(6), 'communes'), expectCode('INVALID_QUERY'));
  assert.throws(() => queryRelated(catalog, 'communes', id(3), 'communes'), expectCode('INVALID_QUERY'));
});

test('queries reject unbounded, malformed and unknown inputs instead of silently coercing them', () => {
  const catalog = fixture();
  for (const options of [
    { limit: 0 }, { limit: 101 }, { limit: 1.5 }, { limit: Number.NaN },
    { offset: -1 }, { offset: Number.POSITIVE_INFINITY }, { offset: Number.MAX_SAFE_INTEGER + 1 },
    { q: 'x'.repeat(101) }, { q: 123 }, { limit: '2' }, { offset: null },
    { sort: 'name' }, { filters: [] }, { filters: null }, { filters: { mysteryId: id(1) } },
    { filters: { departmentId: 'not-a-uuid' } },
  ]) assert.throws(() => queryResources(catalog, 'communes', options as never), expectCode('INVALID_QUERY'));
  assert.throws(() => queryResources(catalog, 'unknown' as never), expectCode('INVALID_QUERY'));
  assert.throws(() => queryResources(catalog, 'communes', null as never), expectCode('INVALID_QUERY'));
  assert.throws(() => queryRelated(catalog, 'communes', id(3), 'neighborhoods', { filters: { communeId: id(3) } }), expectCode('INVALID_QUERY'));
});

test('real Congo navigation preserves distinct Brazzaville identities and known quarter totals', async () => {
  const catalog = await loadCatalog();
  const communes = queryResources(catalog, 'communes', { q: 'brazzaville' });
  assert.equal(communes.total, 1);
  const commune = communes.data[0]!;
  assert.equal(commune.id, 'be83c679-2667-4935-9dad-0f63456298ad');
  assert.notEqual(queryResources(catalog, 'departments', { q: 'brazzaville' }).data[0]!.id, commune.id);
  const arrondissements = queryRelated(catalog, 'communes', commune.id, 'arrondissements');
  assert.equal(arrondissements.total, 9);
  assert.equal(queryRelated(catalog, 'communes', commune.id, 'neighborhoods', { limit: 100 }).total, 88);
  const talangai = arrondissements.data.find(row => row.name === 'Talangaï')!;
  const mpila = queryRelated(catalog, 'arrondissements', talangai.id, 'neighborhoods', { q: 'mpila' });
  assert.equal(mpila.data[0]!.id, '952458ea-c0ea-4ba8-9569-096d48c88048');
});
