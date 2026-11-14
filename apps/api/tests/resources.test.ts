import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';

const brazzaville = 'be83c679-2667-4935-9dad-0f63456298ad';
const brazzavilleDepartment = 'bf82f843-df29-444b-ba2d-fc9df50f220f';
const missing = '00000000-0000-4000-8000-000000000000';

test('nine business collections expose known counts and explicit partial coverage', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const expected = { countries: 1, departments: 15, communes: 16, districts: 92,
    arrondissements: 23, 'urban-communities': 47, 'rural-communities': 92, neighborhoods: 782, villages: 3285 };
  for (const [resource, total] of Object.entries(expected)) {
    const response = await app.inject(`/v1/${resource}?limit=100`);
    assert.equal(response.statusCode, 200, resource);
    const body = response.json();
    assert.deepEqual(body.meta, { total, limit: 100, offset: 0,
      datasetVersion: 'cg-reference-2026-11-14.1', coverageStatus: 'partial' });
    assert.equal(body.data.length, Math.min(total, 100));
    for (const item of body.data) {
      assert.equal(typeof item.name, 'string');
      assert.match(item.id, /^[a-f\d-]{36}$/);
      assert.equal(Object.hasOwn(item, 'kind'), false);
      assert.equal(Object.hasOwn(item, 'entityType'), false);
    }
  }
});

test('search, direct-parent filtering and pagination preserve the same stable business resource', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const response = await app.inject(`/v1/communes?q=BRAZZAVILLE&departmentId=${brazzavilleDepartment}&limit=1`);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().data, [{ id: brazzaville, name: 'Brazzaville', departmentId: brazzavilleDepartment }]);
  const accented = await app.inject('/v1/communes?q=KINTELE');
  assert.equal(accented.json().data[0].name, 'Kintélé');
  const padded = await app.inject(`/v1/communes?q=${'%20'.repeat(101)}Brazzaville%20`);
  assert.equal(padded.statusCode, 200);
  assert.equal(padded.json().data[0].id, brazzaville);
  const next = await app.inject(`/v1/communes?q=Brazzaville&offset=1&limit=1`);
  assert.equal(next.json().meta.total, 1);
  assert.deepEqual(next.json().data, []);
});

test('detail is a named resource, and same-name department remains a distinct identity', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const commune = await app.inject(`/v1/communes/${brazzaville}`);
  const department = await app.inject(`/v1/departments/${brazzavilleDepartment}`);
  assert.equal(commune.statusCode, 200);
  assert.equal(department.statusCode, 200);
  assert.equal(commune.json().data.name, department.json().data.name);
  assert.notEqual(commune.json().data.id, department.json().data.id);
  assert.equal(commune.json().meta.coverageStatus, 'partial');
});

test('invalid query input is rejected instead of silently dropping parameters', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  for (const path of [
    '/v1/communes?unknown=value', '/v1/communes?kind=country', '/v1/communes?limit=101',
    '/v1/communes?limit=0', '/v1/communes?offset=-1', '/v1/communes?offset=1.5',
    '/v1/communes?limit=1&limit=2', '/v1/communes?q=a&q=b', '/v1/communes?countryId=bad',
    '/v1/communes/not-a-uuid', `/v1/communes/${brazzaville}?ignored=yes`,
  ]) {
    const response = await app.inject(path);
    assert.equal(response.statusCode, 400, path);
    assert.equal(response.json().error.code, 'INVALID_QUERY');
    assert.equal(typeof response.json().error.requestId, 'string');
    assert.equal(response.headers['cache-control'], 'no-store');
  }
  const absent = await app.inject(`/v1/communes/${missing}`);
  assert.equal(absent.statusCode, 404);
  assert.equal(absent.json().error.code, 'NOT_FOUND');
});
