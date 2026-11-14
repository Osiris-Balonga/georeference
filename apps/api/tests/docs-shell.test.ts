import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';

test('guides and operations share the same documentation shell and complete navigation in both languages', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  for (const locale of ['fr', 'en']) {
    const guide = await app.inject(`/docs/${locale}/quickstart`);
    const operation = await app.inject(`/docs/${locale}/communes/list`);
    for (const page of [guide, operation]) {
      assert.equal(page.statusCode, 200);
      assert.match(page.body, /class="docs-header"/);
      assert.match(page.body, /href="\/docs\/assets\/shell.css"/);
      assert.match(page.body, /src="\/docs\/assets\/shell.js"/);
      assert.doesNotMatch(page.body, /class="topbar"|\/docs\/assets\/docs.css|\/docs\/assets\/client.js/);
    }
    const navigationLinks = (html: string) => [...html.match(/<nav id="docs-navigation"[\s\S]*?<\/nav>/)![0]
      .matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(navigationLinks(guide.body), navigationLinks(operation.body));
    assert.ok(navigationLinks(guide.body).includes(`/docs/${locale}/neighborhoods/by-communes`));
    assert.match(guide.body, new RegExp(`href="/docs/${locale === 'fr' ? 'en' : 'fr'}/quickstart"`));
    assert.doesNotMatch(guide.body, /src="\/docs\/js\/scalar.js"/);
    assert.match(operation.body, /src="\/docs\/js\/scalar.js"/);
  }
});

test('every guide code block offers a localized copy control and guide headings remain addressable', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  for (const locale of ['fr', 'en']) {
    for (const guide of ['introduction', 'cli', 'exports', 'sql', 'seeding', 'sdk', 'quickstart', 'model', 'requests']) {
      const response = await app.inject(`/docs/${locale}/${guide}`);
      const blocks = [...response.body.matchAll(/<pre>/g)].length;
      const controls = [...response.body.matchAll(/data-copy-code/g)].length;
      assert.equal(controls, blocks, guide);
      assert.match(response.body, /<h1>/);
      assert.match(response.body, /data-guide-toc/);
      if (blocks) assert.ok(response.body.includes(locale === 'fr' ? 'Copier le code' : 'Copy code'));
    }
  }
  assert.equal((await app.inject('/docs/assets/docs.css')).statusCode, 404);
  assert.equal((await app.inject('/docs/assets/client.js')).statusCode, 404);
});
