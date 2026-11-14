import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serviceVersion } from '../routes/reference.ts';

export async function registerOpenApi(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: 'GeoReference API', version: serviceVersion,
        description: 'Read-only Republic of Congo geographic reference. Coverage is dated and partial; counts describe known records.' },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs', staticCSP: true, uiConfig: { deepLinking: true },
  });
  app.get('/openapi.json', { schema: { hide: true } }, () => app.swagger());
}
