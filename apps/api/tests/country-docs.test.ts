import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';

test('country list serves native Scalar separately from guide styles', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const response = await app.inject('/docs/fr/countries/list');
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Lister les pays/);
  assert.match(response.body, /\/docs\/en\/countries\/list/);
  assert.doesNotMatch(response.body, /\/docs\/assets\/docs.css/);
  assert.match(response.body, /"layout":"modern"/);
  assert.match(response.body, /"theme":"default"/);
  assert.match(response.body, /role="status"/);
  const old = await app.inject('/docs/fr/countries');
  assert.equal(old.statusCode, 302);
  assert.equal(old.headers.location, '/docs/fr/countries/list');
});

test('country list pilot projects only GET countries with its real response and unchanged schemas', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const response = await app.inject('/docs/fr/countries/list/openapi.json');
  assert.equal(response.statusCode, 200);
  const spec = response.json();
  assert.deepEqual(Object.keys(spec.paths), ['/v1/countries']);
  assert.deepEqual(Object.keys(spec.paths['/v1/countries']), ['get']);
  const operation = spec.paths['/v1/countries'].get;
  const original = (await app.inject('/openapi.json')).json().paths['/v1/countries'].get;
  assert.deepEqual(operation.responses['200'].content['application/json'].schema, original.responses['200'].content['application/json'].schema);
  const example = operation.responses['200'].content['application/json'].example;
  assert.deepEqual(example, (await app.inject('/v1/countries')).json());
  assert.equal(example.data[0].iso2, 'CG');
  assert.equal((await app.inject('/docs/de/countries/list')).statusCode, 404);
  assert.equal((await app.inject('/docs/en/countries/list')).statusCode, 200);
});
