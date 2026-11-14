import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';

test('documentation has addressable bilingual chapters and a page-local table of contents', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const root = await app.inject('/docs/');
  assert.equal(root.statusCode, 302);
  assert.equal(root.headers.location, '/docs/en/introduction');
  const fr = await app.inject('/docs/fr/introduction');
  assert.equal(fr.statusCode, 200);
  assert.match(fr.body, /<html lang="fr"/);
  assert.match(fr.body, /Sur cette page/);
  assert.match(fr.body, /href="\/docs\/en\/introduction"/);
  assert.doesNotMatch(fr.body, /id="scalar-reference"/);
  const en = await app.inject('/docs/en/quickstart');
  assert.match(en.body, /<html lang="en"/);
  assert.match(en.body, /Your first request/);
  assert.equal((await app.inject('/docs/de/introduction')).statusCode, 404);
  assert.equal((await app.inject('/docs/fr/does-not-exist')).statusCode, 404);
});

test('each API chapter loads only its own localized contract without changing the public OpenAPI', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const fr = await app.inject('/docs/fr/spec/communes.json');
  assert.equal(fr.statusCode, 200);
  const spec = fr.json();
  assert.ok(spec.paths['/v1/communes']);
  assert.equal(spec.paths['/v1/villages'], undefined);
  assert.match(spec.paths['/v1/communes'].get.summary, /Lister les communes/);
  assert.ok(spec.paths['/v1/communes'].get.responses['200']);
  const en = (await app.inject('/docs/en/spec/communes.json')).json();
  assert.match(en.paths['/v1/communes'].get.summary, /List communes/);
  const original = (await app.inject('/openapi.json')).json();
  assert.ok(original.paths['/v1/villages']);
  assert.equal(original.paths['/docs/fr/introduction'], undefined);
  for (const [path, methods] of Object.entries(spec.paths) as [string, { get: { responses: Record<string, { content?: unknown }>; parameters: { schema?: unknown }[] } }][]) {
    for (const [status, response] of Object.entries(methods.get.responses)) {
      assert.deepEqual(response.content, original.paths[path].get.responses[status].content);
    }
    assert.deepEqual(methods.get.parameters.map(p => p.schema), original.paths[path].get.parameters.map((p: { schema?: unknown }) => p.schema));
  }
  const page = await app.inject('/docs/fr/communes/list');
  assert.match(page.body, /id="operation-reference"/);
  assert.match(page.body, /"locale":"fr"/);
  assert.match(page.body, /"showSidebar":false/);
  assert.match(page.body, /\/docs\/fr\/communes\/list\/openapi.json/);
});

test('localized service chapters describe service state rather than geographic places', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const health = (await app.inject('/docs/fr/spec/health.json')).json();
  assert.doesNotMatch(health.paths['/health/live'].get.description, /lieux|UUID/);
  assert.match(health.servers[0].description, /serveur/);
});
