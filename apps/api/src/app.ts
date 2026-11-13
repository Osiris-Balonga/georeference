import Fastify from 'fastify';
import { loadCatalog, type GeographicCatalog } from 'georeference';
import { registerErrors } from './plugins/errors.ts';
import { registerAdministrationRoutes } from './routes/administration.ts';
import { registerHealthRoutes } from './routes/health.ts';
import { registerPlacesRoutes } from './routes/places.ts';

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
  app.addHook('preValidation', async request => {
    const query = request.query as Record<string, unknown>;
    if (query && typeof query.q === 'string') query.q = query.q.trim();
  });
  registerErrors(app);
  registerHealthRoutes(app);
  registerAdministrationRoutes(app, catalog);
  registerPlacesRoutes(app, catalog);
  return app;
}
