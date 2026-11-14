import { readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { RESOURCE_NAMES, type GeographicCatalog } from 'georeference';
import { errorResponses, metadata, noQuery, uuid } from '../schemas/common.ts';
import { meta } from './resources.ts';

export const serviceVersion: string = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
const source = Type.Object({ name: Type.String(), url: Type.String(), license: Type.String(),
  attribution: Type.String(), revision: Type.String() });
const dataset = Type.Object({
  apiVersion: Type.Literal('v1'), serviceVersion: Type.String(), contractVersion: Type.Literal('1.0'),
  datasetVersion: Type.String(), country: Type.Object({ iso2: Type.Literal('CG'), iso3: Type.Literal('COG') }),
  reviewedAt: Type.Union([Type.String(), Type.Null()]), sources: Type.Array(source),
});
const coverage = Type.Object({
  status: Type.Literal('partial'), completeGeographicInventory: Type.Literal(false),
  reviewedAt: Type.Union([Type.String(), Type.Null()]), sourceDates: Type.Array(Type.String()),
  counts: Type.Object(Object.fromEntries(RESOURCE_NAMES.map(name => [name, Type.Integer({ minimum: 0 })]))),
  communes: Type.Array(Type.Object({ id: uuid, name: Type.String(), status: Type.Literal('partial'),
    namedNeighborhoods: Type.Integer({ minimum: 0 }), arrondissements: Type.Integer({ minimum: 0 }),
    observationDates: Type.Array(Type.String()),
  })),
});

export function registerReferenceRoutes(app: FastifyInstance, catalog: GeographicCatalog): void {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();
  typedApp.get('/v1/dataset', { schema: {
    tags: ['reference'], summary: 'Describe the deployed Congo reference and its sources', querystring: noQuery,
    response: { 200: Type.Object({ data: dataset, meta: metadata }), ...errorResponses },
  } }, () => datasetResponse(catalog));
  typedApp.get('/v1/coverage', { schema: {
    tags: ['reference'], summary: 'Describe known counts and dated partial geographic coverage', querystring: noQuery,
    response: { 200: Type.Object({ data: coverage, meta: metadata }), ...errorResponses },
  } }, () => coverageResponse(catalog));
}

export function datasetResponse(catalog: GeographicCatalog) {
  return { data: {
    apiVersion: 'v1' as const, serviceVersion, contractVersion: catalog.metadata.contractVersion,
    datasetVersion: catalog.metadata.datasetVersion, country: { iso2: 'CG' as const, iso3: 'COG' as const },
    reviewedAt: catalog.coverage.reviewedAt,
    sources: catalog.metadata.sources.map(({ name, url, license, attribution, revision }) => ({ name, url, license, attribution, revision })),
  }, meta: meta(catalog) };
}

export function coverageResponse(catalog: GeographicCatalog) {
  return { data: {
    ...catalog.coverage, sourceDates: [...catalog.coverage.sourceDates],
    communes: catalog.coverage.communes.map(commune => ({ ...commune, observationDates: [...commune.observationDates] })),
  }, meta: meta(catalog) };
}
