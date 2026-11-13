import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { getResource, queryRelated, queryResources, type GeographicCatalog,
  type ParentField, type ResourceName, type ResourceQuery } from 'georeference';
import { errorResponses, idParams, listMetadata, metadata, noQuery,
  paginationProperties, paginationQuery, uuid } from '../schemas/common.ts';
import { parentFields, resourcePaths, resourceSchemas } from '../schemas/resources.ts';

export const meta = (catalog: GeographicCatalog) => ({
  datasetVersion: catalog.metadata.datasetVersion, coverageStatus: catalog.coverage.status,
});

function queryOptions(query: Record<string, unknown>): ResourceQuery {
  const options: ResourceQuery = {};
  if (query.q !== undefined) options.q = query.q as string;
  if (query.limit !== undefined) options.limit = query.limit as number;
  if (query.offset !== undefined) options.offset = query.offset as number;
  const filters = Object.fromEntries(Object.entries(query).filter(([key]) => !['q', 'limit', 'offset'].includes(key)));
  if (Object.keys(filters).length) options.filters = filters as Partial<Record<ParentField, string>>;
  return options;
}

export function registerResourceRoutes(app: FastifyInstance, catalog: GeographicCatalog, resource: ResourceName): void {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();
  const path = `/v1/${resourcePaths[resource]}`;
  const query = Type.Object({ ...paginationProperties,
    ...Object.fromEntries(parentFields[resource].map(field => [field, Type.Optional(uuid)])),
  }, { additionalProperties: false });
  typedApp.get(path, { schema: {
    tags: [resourcePaths[resource]], summary: `List ${resourcePaths[resource]}`,
    querystring: query,
    response: { 200: Type.Object({ data: Type.Array(resourceSchemas[resource]), meta: listMetadata }), ...errorResponses },
  } }, request => {
    const result = queryResources(catalog, resource, queryOptions(request.query));
    return { data: [...result.data], meta: { ...meta(catalog), total: result.total, limit: result.limit, offset: result.offset } };
  });
  typedApp.get(`${path}/:id`, { schema: {
    tags: [resourcePaths[resource]], summary: `Get one ${resourcePaths[resource]} resource`,
    params: idParams, querystring: noQuery,
    response: { 200: Type.Object({ data: resourceSchemas[resource], meta: metadata }), ...errorResponses },
  } }, request => ({ data: getResource(catalog, resource, request.params.id), meta: meta(catalog) }));
}

export function registerRelationshipRoute(app: FastifyInstance, catalog: GeographicCatalog,
  parent: ResourceName, child: ResourceName): void {
  app.withTypeProvider<TypeBoxTypeProvider>().get(`/v1/${resourcePaths[parent]}/:id/${resourcePaths[child]}`, {
    schema: {
      tags: [resourcePaths[child]], summary: `List ${resourcePaths[child]} within one ${resourcePaths[parent]} resource`,
      description: 'Includes documented descendants, preserving each resource’s real direct parent fields.',
      params: idParams, querystring: paginationQuery,
      response: { 200: Type.Object({ data: Type.Array(resourceSchemas[child]), meta: listMetadata }), ...errorResponses },
    },
  }, request => {
    const result = queryRelated(catalog, parent, request.params.id, child, queryOptions(request.query));
    return { data: [...result.data], meta: { ...meta(catalog), total: result.total, limit: result.limit, offset: result.offset } };
  });
}
