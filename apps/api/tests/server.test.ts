import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { test } from 'node:test';
import { installShutdown } from '../src/shutdown.ts';
import { buildApp } from '../src/app.ts';

test('SIGTERM drains once and removes shutdown listeners', async () => {
  const app = await buildApp();
  const runtime = Object.assign(new EventEmitter(), { exitCode: undefined as number | undefined,
    exit(code: number) { this.exitCode = code; } });
  let closes = 0;
  installShutdown({ log: app.log, close: async () => { closes++; } }, runtime);
  runtime.emit('SIGTERM');
  runtime.emit('SIGTERM');
  await nextTurn();
  assert.equal(closes, 1);
  assert.equal(runtime.exitCode, 0);
  assert.equal(runtime.listenerCount('SIGTERM'), 0);
  assert.equal(runtime.listenerCount('SIGINT'), 0);
  await app.close();
});

test('a running HTTP server answers probes and closes its socket', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const address = await app.listen({ host: '127.0.0.1', port: 0 });
  const response = await fetch(`${address}/health/ready`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  await app.close();
  assert.equal(app.server.listening, false);
});
