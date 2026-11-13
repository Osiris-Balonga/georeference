import Fastify from 'fastify';
import { registerHealthRoutes } from './routes/health.ts';

export async function buildApp() {
  const app = Fastify({ logger: false });
  registerHealthRoutes(app);
  return app;
}
