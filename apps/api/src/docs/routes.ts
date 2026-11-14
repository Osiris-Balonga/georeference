import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { GeographicCatalog } from 'georeference';
import { renderReference } from './reference.ts';
import { referenceStyles, referenceClient } from './reference-assets.ts';
import { referenceOperations, operationSpecification, operationAddress, type ReferenceOperation } from './operations.ts';
import { chapters, type Locale } from './content.ts';
import { shellStyles } from './styles.ts';
import { shellClient } from './client.ts';
import { renderChapter } from './render.ts';
import { chapterSpecification } from './specification.ts';

function html(reply: FastifyReply, render: (nonce: string) => string) {
  const nonce = randomBytes(18).toString('base64');
  reply.header('Content-Security-Policy', [
    "default-src 'self'", `script-src 'self' 'nonce-${nonce}'`, "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:", "font-src 'self'", "connect-src 'self'", "worker-src 'self' blob:",
    "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'",
  ].join('; '));
  return reply.header('Cache-Control', 'no-store').type('text/html').send(render(nonce));
}
const isLocale = (locale: string): locale is Locale => locale === 'fr' || locale === 'en';
type OperationParams = { locale: string; page: string; operation: string };

export function registerDocs(app: FastifyInstance, catalog: GeographicCatalog): void {
  const hidden = { schema: { hide: true } };
  const indexes = new Map<Locale, ReferenceOperation[]>();
  const operationsFor = (locale: Locale) => {
    if (!indexes.has(locale)) indexes.set(locale, referenceOperations(app.swagger(), locale));
    return indexes.get(locale)!;
  };
  app.get('/docs/assets/shell.css', hidden, (_request, reply) => reply.type('text/css').send(shellStyles));
  app.get('/docs/assets/shell.js', hidden, (_request, reply) => reply.type('application/javascript').send(shellClient));
  app.get('/docs/assets/reference.css', hidden, (_request, reply) => reply.type('text/css').send(referenceStyles));
  app.get('/docs/assets/reference.js', hidden, (_request, reply) => reply.type('application/javascript').send(referenceClient));
  app.get<{ Params: OperationParams }>('/docs/:locale/:page/:operation/openapi.json', hidden, (request, reply) => {
    const { locale, page, operation } = request.params;
    if (!isLocale(locale)) return reply.callNotFound();
    const document = app.swagger();
    const selected = operationsFor(locale).find(item => item.group === page && item.slug === operation);
    return selected ? operationSpecification(document, locale, selected, catalog) : reply.callNotFound();
  });
  app.get<{ Params: OperationParams }>('/docs/:locale/:page/:operation', hidden, (request, reply) => {
    const { locale, page, operation } = request.params;
    if (!isLocale(locale)) return reply.callNotFound();
    const operations = operationsFor(locale);
    const selected = operations.find(item => item.group === page && item.slug === operation);
    if (!selected) return reply.callNotFound();
    return html(reply, nonce => renderReference(locale, selected, operations, nonce));
  });
  app.get<{ Params: { locale: string; page: string } }>('/docs/:locale/:page', hidden, (request, reply) => {
    const { locale, page } = request.params;
    if (!isLocale(locale)) return reply.callNotFound();
    const chapter = chapters(locale).find(item => item.slug === page);
    if (!chapter) return reply.callNotFound();
    if (chapter.api) {
      const first = operationsFor(locale).find(item => item.group === page);
      return first ? reply.redirect(operationAddress(locale, first)) : reply.callNotFound();
    }
    return html(reply, nonce => renderChapter(locale, chapter, operationsFor(locale), nonce));
  });
  app.get<{ Params: { locale: string; page: string } }>('/docs/:locale/spec/:page.json', hidden, (request, reply) => {
    const { locale, page } = request.params;
    if (!isLocale(locale) || !chapters(locale).some(item => item.api && item.slug === page)) return reply.callNotFound();
    return chapterSpecification(app.swagger(), locale, page);
  });
}
