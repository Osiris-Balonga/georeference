import Fastify from 'fastify';
import { loadCatalog, type GeographicCatalog } from 'georeference';
import { registerErrors } from './plugins/errors.ts';
import { registerOpenApi } from './plugins/openapi.ts';
import { registerSecurity } from './plugins/security.ts';
import { registerCache } from './http/cache.ts';
import { registerAdministrationRoutes } from './routes/administration.ts';
import { registerHealthRoutes } from './routes/health.ts';
import { registerPlacesRoutes } from './routes/places.ts';
import { registerReferenceRoutes } from './routes/reference.ts';

export interface AppOptions {
  catalog?: GeographicCatalog;
  logger?: boolean;
  trustedProxies?: false | string[];
  rateLimitMax?: number;
}

export async function buildApp(options: AppOptions = {}) {
  const catalog = options.catalog ?? await loadCatalog();
  const app = Fastify({
    logger: options.logger ? { serializers: {
      req: request => ({ method: request.method }), res: response => ({ statusCode: response.statusCode }),
    } } : false,
    trustProxy: options.trustedProxies ?? false,
    bodyLimit: 1024,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: true } },
  });
  registerErrors(app);
  registerCache(app);
  await registerSecurity(app, options.rateLimitMax ?? 60);
  await registerOpenApi(app, catalog);
  app.addHook('preValidation', async request => {
    const query = request.query as Record<string, unknown>;
    if (query && typeof query.q === 'string') query.q = query.q.trim();
  });
  registerHealthRoutes(app);
  registerAdministrationRoutes(app, catalog);
  registerPlacesRoutes(app, catalog);
  registerReferenceRoutes(app, catalog);
  return app;
}
