import type { FastifyInstance, FastifyRequest } from 'fastify';
import { CatalogQueryError } from '242places';

export function errorBody(request: FastifyRequest, code: string, message: string) {
  return { error: { code, message, requestId: request.id } };
}

export function registerErrors(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    reply.header('Cache-Control', 'no-store');
    if (error instanceof CatalogQueryError) {
      return reply.code(error.code === 'NOT_FOUND' ? 404 : 400)
        .send(errorBody(request, error.code, error.message));
    }
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    if ((error as { validation?: unknown }).validation || status === 400) {
      return reply.code(400).send(errorBody(request, 'INVALID_QUERY', 'Invalid request parameters'));
    }
    if (status === 429) return reply.code(429).send(errorBody(request, 'RATE_LIMITED', 'Too many requests; try again later'));
    if (status === 413) return reply.code(413).send(errorBody(request, 'REQUEST_TOO_LARGE', 'Request body is too large'));
    if (status >= 400 && status < 500) {
      return reply.code(status).send(errorBody(request, 'REQUEST_REJECTED', 'Request rejected'));
    }
    request.log.error({ err: error }, 'API request failed');
    return reply.code(500).send(errorBody(request, 'INTERNAL_ERROR', 'Unable to process request'));
  });
  app.setNotFoundHandler((request, reply) => {
    reply.header('Cache-Control', 'no-store');
    const path = request.url.split('?')[0]!;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      (app.hasRoute({ method: 'GET', url: path }) || app.findRoute({ method: 'GET', url: path }))) {
      return reply.code(405).header('Allow', 'GET, HEAD, OPTIONS')
        .send(errorBody(request, 'METHOD_NOT_ALLOWED', 'Method not allowed'));
    }
    return reply.code(404).send(errorBody(request, 'NOT_FOUND', 'Resource or route not found'));
  });
}
