import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { buildApp } from '../src/app.ts';
import { shellClient } from '../src/docs/client.ts';

test('the site root opens docs and the docs entry respects a saved language then the primary system language', async t => {
  const app = await buildApp({ rateLimitMax: 1000 });
  t.after(() => app.close());
  const root = await app.inject('/');
  assert.equal(root.statusCode, 302);
  assert.equal(root.headers.location, '/docs');
  for (const [language, cookie, expected] of [
    ['', '', 'en'], ['fr-CG,fr;q=0.9,en;q=0.8', '', 'fr'], ['en-US,fr;q=0.8', '', 'en'],
    ['de-DE,fr;q=0.8', '', 'en'], ['en;q=0.5,fr;q=0.9', '', 'fr'], ['fr;q=0,en;q=1', '', 'en'],
    ['en', '242places-locale=fr', 'fr'], ['fr', '242places-locale=en', 'en'],
    ['en', '242places-locale=xx', 'en'],
  ]) {
    for (const path of ['/docs', '/docs/']) {
      const response = await app.inject({ url: path, headers: { 'accept-language': language, cookie } });
      assert.equal(response.statusCode, 302);
      assert.equal(response.headers.location, `/docs/${expected}/introduction`);
      assert.equal(response.headers['cache-control'], 'no-store');
    }
  }
  const explicit = await app.inject({ url: '/docs/fr/quickstart', headers: { 'accept-language': 'en' } });
  assert.equal(explicit.statusCode, 200);
  assert.match(explicit.body, /<html lang="fr"/);
  assert.equal((await app.inject('/v1/countries')).statusCode, 200);
});

test('theme is resolved before styles: explicit choice, system light/dark, then dark fallback', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const page = (await app.inject('/docs/en/introduction')).body;
  const script = page.match(/<script data-preferences nonce="[^"]+">([\s\S]*?)<\/script>/);
  assert.ok(script, 'a pre-paint preference script must run before styles');
  assert.ok(page.indexOf(script[0]) < page.indexOf('rel="stylesheet"'));
  for (const [stored, system, expected] of [
    [null, 'light', 'light'], [null, 'dark', 'dark'], [null, null, 'dark'],
    ['light', 'dark', 'light'], ['dark', 'light', 'dark'], ['invalid', 'light', 'light'],
  ]) {
    const root = { dataset: {} as Record<string, string> };
    runInNewContext(script[1]!, {
      document: { documentElement: root },
      localStorage: { getItem: () => stored },
      window: { matchMedia: (query: string) => ({ matches: query === `(prefers-color-scheme: ${system})` }) },
    });
    assert.equal(root.dataset.theme, expected);
  }
  const root = { dataset: {} as Record<string, string> };
  runInNewContext(script[1]!, {
    document: { documentElement: root }, localStorage: { getItem: () => { throw new Error('blocked'); } },
    window: { matchMedia: () => { throw new Error('unavailable'); } },
  });
  assert.equal(root.dataset.theme, 'dark');
});

test('manual theme and language choices persist, while an unchosen theme follows system changes', () => {
  const events = () => ({ handlers: {} as Record<string, (event?: unknown) => void>,
    addEventListener(name: string, handler: (event?: unknown) => void) { this.handlers[name] = handler; },
    setAttribute() {}, classList: { toggle() {} }, dataset: {} as Record<string, string>,
  });
  const theme = events();
  const french = { ...events(), dataset: { locale: 'fr' } };
  const storage = new Map<string, string>();
  let systemChange: (event: { matches: boolean }) => void = () => {};
  const root = { lang: 'en', dataset: { theme: 'light' } };
  const document = {
    documentElement: root, body: events(), cookie: '', addEventListener() {},
    querySelector(selector: string) {
      if (selector === '.docs-theme') return theme;
      if (selector === '.docs-navigation') return { querySelector: () => null };
      return events();
    },
    querySelectorAll(selector: string) { return selector === '[data-locale]' ? [french] : []; },
  };
  runInNewContext(shellClient, {
    document, localStorage: { getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key, value) },
    window: { matchMedia: () => ({ addEventListener: (_: string, handler: typeof systemChange) => { systemChange = handler; } }), dispatchEvent() {} },
    CustomEvent: class {}, location: { protocol: 'https:' },
  });
  systemChange({ matches: false });
  assert.equal(root.dataset.theme, 'dark');
  theme.handlers.click!();
  assert.equal(root.dataset.theme, 'light');
  assert.equal(storage.get('242places-theme'), 'light');
  systemChange({ matches: false });
  assert.equal(root.dataset.theme, 'light', 'a later system change must not override a manual choice');
  french.handlers.click!();
  assert.match(document.cookie, /^242places-locale=fr; Path=\/;/);
  assert.match(document.cookie, /SameSite=Lax; Secure$/);
});
