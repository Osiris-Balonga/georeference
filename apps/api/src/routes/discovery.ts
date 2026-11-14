import type { FastifyInstance } from "fastify";
import { Type } from "typebox";
import {
  RESOURCE_NAMES,
  discoverPlaces,
  placeSummary,
  placeAncestors,
  type GeographicCatalog,
  type DiscoveryQuery,
} from "242places";
import {
  errorResponses,
  idParams,
  listMetadata,
  metadata,
  noQuery,
  paginationProperties,
  uuid,
} from "../schemas/common.ts";
import { resourceSchemas } from "../schemas/resources.ts";
import { meta } from "./resources.ts";
const place = Type.Object({
  id: uuid,
  name: Type.String(),
  resource: Type.String(),
  parentId: Type.Union([uuid, Type.Null()]),
});
const result = Type.Object({
  ...place.properties,
  ancestors: Type.Array(place),
});
export function registerDiscoveryRoutes(
  app: FastifyInstance,
  catalog: GeographicCatalog,
) {
  app.get(
    "/v1/congo",
    {
      schema: {
        tags: ["congo"],
        summary: "Read the Republic of the Congo",
        querystring: noQuery,
        response: {
          200: Type.Object({ data: resourceSchemas.countries, meta: metadata }),
          ...errorResponses,
        },
      },
    },
    () => ({ data: catalog.resources.countries[0], meta: meta(catalog) }),
  );
  app.get<{ Querystring: DiscoveryQuery }>(
    "/v1/search",
    {
      schema: {
        tags: ["discovery"],
        summary: "Search Congo places and their administrative context",
        querystring: Type.Object(
          {
            ...paginationProperties,
            resource: Type.Optional(
              Type.Union(
                RESOURCE_NAMES.filter((x) => x !== "countries").map((x) =>
                  Type.Literal(x),
                ),
              ),
            ),
            parent: Type.Optional(uuid),
            direct: Type.Optional(Type.Boolean()),
          },
          { additionalProperties: false },
        ),
        response: {
          200: Type.Object({ data: Type.Array(result), meta: listMetadata }),
          ...errorResponses,
        },
      },
    },
    (request) => {
      const found = discoverPlaces(catalog, request.query);
      return {
        data: found.data,
        meta: {
          ...meta(catalog),
          total: found.total,
          limit: found.limit,
          offset: found.offset,
        },
      };
    },
  );
  app.get<{ Params: { id: string } }>(
    "/v1/places/:id",
    {
      schema: {
        tags: ["discovery"],
        summary: "Read a Congo place and its ancestors",
        params: idParams,
        querystring: noQuery,
        response: {
          200: Type.Object({ data: result, meta: metadata }),
          ...errorResponses,
        },
      },
    },
    (request) => ({
      data: {
        ...placeSummary(catalog, request.params.id),
        ancestors: placeAncestors(catalog, request.params.id),
      },
      meta: meta(catalog),
    }),
  );
}
