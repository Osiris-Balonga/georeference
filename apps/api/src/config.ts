import { isIP } from 'node:net';

export interface ServerConfig {
  host: string;
  port: number;
  rateLimitMax: number;
  trustedProxies: false | string[];
}

function positiveInteger(value: string | undefined, fallback: number, name: string, max = Number.MAX_SAFE_INTEGER): number {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) {
    throw new Error(`Invalid ${name}: expected an integer from 1 to ${max}`);
  }
  return Number(value);
}

function validProxy(value: string): boolean {
  const [address, prefix, extra] = value.split('/');
  if (!address || extra !== undefined) return false;
  const version = isIP(address);
  return Boolean(version) && (prefix === undefined || (/^[1-9]\d*$/.test(prefix) &&
    Number(prefix) <= (version === 4 ? 32 : 128)));
}

export function readServerConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const host = env.API_HOST ?? '127.0.0.1';
  if (!host.trim() || host.trim() !== host || /[\s/]/.test(host)) throw new Error('Invalid API_HOST');
  const trustedProxies = env.TRUSTED_PROXIES === undefined ? false : env.TRUSTED_PROXIES.split(',').map(value => value.trim());
  if (trustedProxies && (!trustedProxies.length || trustedProxies.some(value => !validProxy(value)))) {
    throw new Error('Invalid TRUSTED_PROXIES: use explicit IP addresses or non-global CIDR ranges');
  }
  return {
    host,
    port: positiveInteger(env.PORT, 3000, 'PORT', 65535),
    rateLimitMax: positiveInteger(env.API_RATE_LIMIT_MAX, 60, 'API_RATE_LIMIT_MAX'),
    trustedProxies,
  };
}
