import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

function matches(header: string | string[] | undefined, etag: string): boolean {
  const values = Array.isArray(header) ? header.join(',') : header;
  return Boolean(values?.split(',').some(value => {
    const candidate = value.trim().replace(/^W\//, '');
    return candidate === '*' || candidate === etag;
  }));
}

export function registerCache(app: FastifyInstance): void {
  app.addHook('onSend', async (request, reply, payload) => {
    if (reply.statusCode >= 400) {
      reply.header('Cache-Control', 'no-store').removeHeader('ETag');
      return payload;
    }
    if (reply.statusCode !== 200 || !['GET', 'HEAD'].includes(request.method) ||
      !request.url.startsWith('/v1/') || (typeof payload !== 'string' && !Buffer.isBuffer(payload))) return payload;
    const etag = `"${createHash('sha256').update(payload).digest('hex')}"`;
    reply.header('ETag', etag).header('Cache-Control', 'public, max-age=300, must-revalidate');
    if (matches(request.headers['if-none-match'], etag)) {
      reply.code(304);
      return '';
    }
    return payload;
  });
}
