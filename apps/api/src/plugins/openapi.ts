import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import { randomBytes } from 'node:crypto';
import { serviceVersion } from '../routes/reference.ts';

export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: 'GeoReference API', version: serviceVersion,
        description: 'Read-only Republic of Congo geographic reference. Coverage is dated and partial; counts describe known records.' },
      servers: [{ url: '/', description: 'Current GeoReference API origin' }],
    },
  });
  // Scalar renders its configured nonce into the HTML; replace it per response.
  const nonceMarker = 'GEOREFERENCE_SCALAR_NONCE';
  app.addHook('onSend', async (request, reply, payload) => {
    const pathname = request.url.split('?')[0]?.replace(/\/$/, '');
    if (pathname !== '/docs' || reply.statusCode !== 200 || typeof payload !== 'string') return payload;
    const nonce = randomBytes(18).toString('base64');
    reply.header('Content-Security-Policy', [
      "default-src 'self'", `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self'",
      "connect-src 'self'", "worker-src 'self' blob:", "object-src 'none'",
      "base-uri 'self'", "frame-ancestors 'none'",
    ].join('; '));
    reply.header('Cache-Control', 'no-store');
    return payload.replaceAll(nonceMarker, nonce);
  });
  await app.register(scalar, {
    routePrefix: '/docs',
    configuration: {
      title: 'GeoReference API', url: '/openapi.json', nonce: nonceMarker,
      withDefaultFonts: false, telemetry: false, agent: { disabled: true }, proxyUrl: '',
      showDeveloperTools: 'never',
    },
  });
  app.get('/openapi.json', { schema: { hide: true } }, () => app.swagger());
}
