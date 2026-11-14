import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';
import { loadCatalog } from 'georeference';

test('every public GET has a bilingual isolated native reference page and an executable example', async t => {
  const app = await buildApp({ rateLimitMax: 10000 });
  t.after(() => app.close());
  const canonical = (await app.inject('/openapi.json')).json();
  const catalog = await loadCatalog();
  let count = 0;
  for (const [path, entry] of Object.entries(canonical.paths) as [string, any][]) {
    if (!entry.get) continue;
    count++;
    const group = entry.get.tags[0];
    const parts = path.split('/');
    const action = parts.at(-1) === '{id}' ? 'get' : path.includes('{id}') ? `by-${parts[2]}`
      : ['reference', 'health'].includes(group) ? parts.at(-1) : 'list';
    for (const locale of ['fr', 'en']) {
      const address = `/docs/${locale}/${group}/${action}`;
      const page = await app.inject(address);
      assert.equal(page.statusCode, 200, address);
      assert.match(page.body, /"layout":"modern"/);
      assert.match(page.body, /"theme":"default"/);
      assert.match(page.body, new RegExp(`/docs/${locale === 'fr' ? 'en' : 'fr'}/${group}/${action}`));
      assert.doesNotMatch(page.body, /\/docs\/assets\/docs.css|class="toc"/);
      const specResponse = await app.inject(`${address}/openapi.json`);
      assert.equal(specResponse.statusCode, 200, address);
      const spec = specResponse.json();
      assert.deepEqual(Object.keys(spec.paths), [path]);
      const operation = spec.paths[path].get;
      assert.ok(operation.summary);
      for (const [status, response] of Object.entries(operation.responses) as [string, any][]) {
        assert.deepEqual(response.content?.['application/json']?.schema,
          entry.get.responses[status].content?.['application/json']?.schema, path);
      }
      assert.deepEqual(operation.parameters?.map((p: any) => p.schema), entry.get.parameters?.map((p: any) => p.schema));
      const exampleId = operation.parameters?.find((p: any) => p.name === 'id')?.example;
      if (path.includes('{id}') && exampleId === undefined) {
        // A partial catalog may have no record in this category; never invent an ID/example.
        const category = path.split('/')[2]!.replace(/-([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
        assert.equal(catalog.resources[category as keyof typeof catalog.resources].length, 0, path);
        assert.equal(operation.responses['200'].content['application/json'].example, undefined);
        continue;
      }
      if (path.includes('{id}')) assert.match(exampleId, /^[0-9a-f-]{36}$/, path);
      const actual = await app.inject(path.replace('{id}', exampleId));
      assert.equal(actual.statusCode, 200, path);
      assert.deepEqual(operation.responses['200'].content['application/json'].example, actual.json(), path);
    }
  }
  assert.ok(count >= 34);
  assert.equal((await app.inject('/docs/de/communes/list')).statusCode, 404);
  assert.equal((await app.inject('/docs/fr/communes/no-such-operation')).statusCode, 404);
});

test('category bookmarks redirect to their first operation and navigation includes all operations', async t => {
  const app = await buildApp({ rateLimitMax: 10000 });
  t.after(() => app.close());
  const bookmark = await app.inject('/docs/fr/communes');
  assert.equal(bookmark.statusCode, 302);
  assert.equal(bookmark.headers.location, '/docs/fr/communes/list');
  const page = await app.inject('/docs/fr/communes/list');
  assert.match(page.body, /href="\/docs\/fr\/communes\/get"/);
  assert.match(page.body, /href="\/docs\/fr\/arrondissements\/by-communes"/);
  assert.match(page.body, /href="\/docs\/fr\/health\/ready"/);
  assert.match(page.body, /href="\/docs\/fr\/districts\/list"/);
  assert.match(page.body, /href="\/docs\/fr\/rural-communities\/list"/);
});

test('request-client pagination examples match the API defaults instead of starting invalid', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const actual = (await app.inject('/v1/communes')).json();
  const spec = (await app.inject('/docs/fr/communes/list/openapi.json')).json();
  const parameters = spec.paths['/v1/communes'].get.parameters;
  assert.equal(parameters.find((item: { name: string }) => item.name === 'limit').example, actual.meta.limit);
  assert.equal(parameters.find((item: { name: string }) => item.name === 'offset').example, actual.meta.offset);
});
