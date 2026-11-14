import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readServerConfig } from '../src/config.ts';

test('configuration defaults bind locally and trust no forwarded IP', () => {
  assert.deepEqual(readServerConfig({}), {
    host: '127.0.0.1', port: 3000, rateLimitMax: 60, trustedProxies: false,
  });
});

test('configuration accepts explicit port, host, rate limit and trusted proxy ranges', () => {
  assert.deepEqual(readServerConfig({ API_HOST: '0.0.0.0', PORT: '4210', API_RATE_LIMIT_MAX: '120',
    TRUSTED_PROXIES: '127.0.0.1, 10.0.0.0/24, ::1' }), {
    host: '0.0.0.0', port: 4210, rateLimitMax: 120,
    trustedProxies: ['127.0.0.1', '10.0.0.0/24', '::1'],
  });
});

test('configuration rejects invalid numeric bounds and ambiguous proxy trust', () => {
  for (const env of [
    { PORT: '0' }, { PORT: '65536' }, { PORT: '1.5' }, { PORT: '1e3' }, { PORT: '' },
    { API_RATE_LIMIT_MAX: '0' }, { API_RATE_LIMIT_MAX: '2.5' }, { API_RATE_LIMIT_MAX: 'Infinity' },
    { TRUSTED_PROXIES: 'true' }, { TRUSTED_PROXIES: '*' }, { TRUSTED_PROXIES: '0.0.0.0/0' },
    { TRUSTED_PROXIES: '::/0' }, { TRUSTED_PROXIES: '10.0.0.1/33' },
    { TRUSTED_PROXIES: '127.0.0.1,' }, { API_HOST: '' },
  ]) assert.throws(() => readServerConfig(env));
});
