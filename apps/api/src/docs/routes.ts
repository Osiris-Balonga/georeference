import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { chapters, type Locale } from './content.ts';
import { docsStyles } from './styles.ts';
import { docsClient } from './client.ts';
import { renderChapter } from './render.ts';
import { chapterSpecification } from './specification.ts';

export function registerDocs(app: FastifyInstance): void {
  const hidden = { schema: { hide: true } };
  app.get('/docs/assets/docs.css', hidden, (_request, reply) => reply.type('text/css').send(docsStyles));
  app.get('/docs/assets/client.js', hidden, (_request, reply) => reply.type('application/javascript').send(docsClient));
  app.get<{ Params: { locale: string; page: string } }>('/docs/:locale/:page', hidden, (request, reply) => {
    const { locale, page } = request.params;
    if (locale !== 'fr' && locale !== 'en') return reply.callNotFound();
    const chapter = chapters(locale).find(item => item.slug === page);
    if (!chapter) return reply.callNotFound();
    const nonce = randomBytes(18).toString('base64');
    reply.header('Content-Security-Policy', [
      "default-src 'self'", `script-src 'self' 'nonce-${nonce}'`, "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:", "font-src 'self'", "connect-src 'self'", "worker-src 'self' blob:",
      "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'",
    ].join('; '));
    return reply.header('Cache-Control', 'no-store').type('text/html').send(renderChapter(locale, chapter, nonce));
  });
  app.get<{ Params: { locale: string; page: string } }>('/docs/:locale/spec/:page.json', hidden, (request, reply) => {
    const { locale, page } = request.params;
    if (!['fr', 'en'].includes(locale) || !chapters(locale as Locale).some(item => item.api && item.slug === page)) return reply.callNotFound();
    return chapterSpecification(app.swagger(), locale as Locale, page);
  });
}
