import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';

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
