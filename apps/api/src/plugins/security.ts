import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { errorBody } from './errors.ts';

export async function registerSecurity(app: FastifyInstance, max: number): Promise<void> {
  app.addHook('onRequest', async (request, reply) => {
    if (['GET', 'HEAD'].includes(request.method) &&
      (Number(request.headers['content-length'] ?? 0) > 0 || request.headers['transfer-encoding'] !== undefined)) {
      return reply.code(400).header('Cache-Control', 'no-store')
        .send(errorBody(request, 'UNEXPECTED_BODY', 'Request body is not supported'));
    }
  });
  await app.register(cors, {
    origin: '*', methods: ['GET', 'HEAD'], credentials: false,
    allowedHeaders: ['If-None-Match'],
    exposedHeaders: ['ETag', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
  });
  await app.register(rateLimit, {
    max, timeWindow: '1 minute',
    errorResponseBuilder: request => ({ statusCode: 429,
      ...errorBody(request, 'RATE_LIMITED', 'Too many requests; try again later') }),
  });
}
