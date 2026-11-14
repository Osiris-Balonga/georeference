import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';
import { loadCatalog } from 'georeference';

test('health checks report readiness and remain uncached', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  for (const path of ['/health/live', '/health/ready']) {
    const response = await app.inject(path);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.deepEqual(response.json(), { status: 'ok' });
  }
});

test('public resources support conditional GET, weak validators and HEAD', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const response = await app.inject('/v1/communes?q=Brazzaville');
  assert.equal(response.statusCode, 200);
  const etag = response.headers.etag as string;
  assert.equal(typeof etag, 'string');
  assert.equal(response.headers['cache-control'], 'public, max-age=300, must-revalidate');
  for (const validator of [etag, `"other", W/${etag}`, '*']) {
    const unchanged = await app.inject({ url: '/v1/communes?q=Brazzaville', headers: { 'if-none-match': validator } });
    assert.equal(unchanged.statusCode, 304);
    assert.equal(unchanged.body, '');
  }
  const head = await app.inject({ method: 'HEAD', url: '/v1/communes?q=Brazzaville' });
  assert.equal(head.statusCode, 200);
  assert.equal(head.headers.etag, etag);
  assert.equal(head.body, '');
  const changed = await app.inject('/v1/communes?q=Impfondo');
  assert.notEqual(changed.headers.etag, etag);
});

test('browser clients can read cache and rate headers without credentials', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const response = await app.inject({ url: '/v1/communes', headers: { origin: 'https://example.com' } });
  assert.equal(response.headers['access-control-allow-origin'], '*');
  assert.equal(response.headers['access-control-allow-credentials'], undefined);
  assert.match(response.headers['access-control-expose-headers'] as string, /ETag/i);
  const preflight = await app.inject({ method: 'OPTIONS', url: '/v1/communes', headers: {
    origin: 'https://example.com', 'access-control-request-method': 'GET',
    'access-control-request-headers': 'If-None-Match',
  } });
  assert.equal(preflight.statusCode, 204);
});

test('rate limiting uses the direct client IP by default and leaves probes available', async t => {
  const app = await buildApp({ rateLimitMax: 1 });
  t.after(() => app.close());
  assert.equal((await app.inject('/v1/communes')).statusCode, 200);
  const limited = await app.inject({ url: '/v1/communes', headers: { 'x-forwarded-for': '203.0.113.42' } });
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.json().error.code, 'RATE_LIMITED');
  assert.equal(limited.headers['cache-control'], 'no-store');
  assert.ok(Number(limited.headers['retry-after']) > 0);
  assert.equal((await app.inject('/health/ready')).statusCode, 200);
});

test('unsupported writes and unexpected GET bodies are rejected with safe errors', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const write = await app.inject({ method: 'POST', url: '/v1/communes' });
  assert.equal(write.statusCode, 405);
  assert.equal(write.headers.allow, 'GET, HEAD, OPTIONS');
  const body = await app.inject({ method: 'GET', url: '/v1/communes', payload: 'x' });
  assert.equal(body.statusCode, 400);
  assert.equal(body.json().error.code, 'UNEXPECTED_BODY');
});

test('unexpected server errors omit internal details', async t => {
  const catalog = new Proxy(await loadCatalog(), { get(target, property, receiver) {
    if (property === 'resources') throw new Error('private filesystem path and secret');
    return Reflect.get(target, property, receiver);
  } });
  const app = await buildApp({ catalog });
  t.after(() => app.close());
  const response = await app.inject('/v1/communes');
  assert.equal(response.statusCode, 500);
  assert.equal(response.json().error.code, 'INTERNAL_ERROR');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.doesNotMatch(response.body, /filesystem|secret|stack/);
});

test('dataset and coverage endpoints expose concise source-backed summaries', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const dataset = await app.inject('/v1/dataset');
  assert.equal(dataset.statusCode, 200);
  assert.equal(dataset.json().data.apiVersion, 'v1');
  assert.equal(dataset.json().data.serviceVersion, '1.0.0');
  assert.equal(dataset.json().data.contractVersion, '1.0');
  assert.deepEqual(dataset.json().data.country, { iso2: 'CG', iso3: 'COG' });
  assert.ok(dataset.json().data.sources.every((source: {url:string;license:string}) => source.url && source.license));
  const coverage = await app.inject('/v1/coverage');
  assert.equal(coverage.statusCode, 200);
  assert.equal(coverage.json().data.completeGeographicInventory, false);
  assert.equal(coverage.json().data.counts.neighborhoods, 250);
  assert.equal(coverage.json().data.counts.villages, 0);
  assert.equal(coverage.json().data.communes.find((row: {name:string}) => row.name === 'Brazzaville').namedNeighborhoods, 74);
  assert.doesNotMatch(coverage.body, /nationalAnomalies|unresolvedJurisdictions|codeConflicts/);
  assert.equal((await app.inject('/v1/coverage?unknown=true')).statusCode, 400);
});

test('OpenAPI describes business routes and the interactive docs serve local assets', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const specification = await app.inject('/openapi.json');
  assert.equal(specification.statusCode, 200);
  const schema = specification.json();
  assert.ok(schema.paths['/v1/communes/{id}/neighborhoods']);
  assert.ok(schema.paths['/v1/villages']);
  assert.ok(schema.paths['/v1/communes'].get.parameters.some((parameter: {name:string}) => parameter.name === 'departmentId'));
  const docs = await app.inject('/docs/fr/communes');
  assert.equal(docs.statusCode, 200);
  assert.match(docs.body, /scalar-reference/);
  const bundle = await app.inject('/docs/js/scalar.js');
  assert.equal(bundle.statusCode, 200);
  assert.match(bundle.headers['content-type'] as string, /javascript/);
});
