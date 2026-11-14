import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';

export function registerHealthRoutes(app: FastifyInstance): void {
  for (const path of ['/health/live', '/health/ready']) {
    app.get(path, {
      config: { rateLimit: false },
      schema: { tags: ['health'], response: { 200: Type.Object({ status: Type.Literal('ok') }) } },
    }, (_request, reply) => {
      reply.header('Cache-Control', 'no-store');
      return { status: 'ok' };
    });
  }
}
