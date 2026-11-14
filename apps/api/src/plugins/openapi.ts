import type { FastifyInstance } from 'fastify';
import type { GeographicCatalog } from '242places';
import swagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import { registerDocs } from '../docs/routes.ts';
import { serviceVersion } from '../routes/reference.ts';
import { preferredLocale } from '../docs/preferences.ts';

export async function registerOpenApi(app: FastifyInstance, catalog: GeographicCatalog): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: '242Places API', version: serviceVersion,
        description: 'Read-only Republic of Congo geographic reference. Coverage is dated and partial; counts describe known records.' },
      servers: [{ url: '/', description: 'Current 242Places API origin' }],
    },
  });
  await app.register(scalar, {
    routePrefix: '/docs',
    hooks: { preHandler: async (request, reply) => {
      if (request.url.split('?')[0]?.replace(/\/$/, '') === '/docs') {
        const locale = preferredLocale(request.headers['accept-language'], request.headers.cookie);
        return reply.header('Cache-Control', 'no-store').header('Vary', 'Accept-Language, Cookie').redirect(`/docs/${locale}/introduction`, 302);
      }
    } },
    configuration: {
      title: '242Places API', url: '/openapi.json',
      withDefaultFonts: false, telemetry: false, agent: { disabled: true }, proxyUrl: '',
      showDeveloperTools: 'never',
    },
  });
  app.get('/openapi.json', { schema: { hide: true } }, () => app.swagger());
  app.get('/', { schema: { hide: true } }, (_request, reply) => reply.header('Cache-Control', 'no-store').redirect('/docs', 302));
  registerDocs(app, catalog);
}
