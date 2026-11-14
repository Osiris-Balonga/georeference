import { Type } from 'typebox';

export const uuid = Type.String({ pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' });
export const idParams = Type.Object({ id: uuid }, { additionalProperties: false });
export const noQuery = Type.Object({}, { additionalProperties: false });
export const paginationProperties = {
  q: Type.Optional(Type.String({ maxLength: 100 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER })),
};
export const paginationQuery = Type.Object(paginationProperties, { additionalProperties: false });
export const metadata = Type.Object({ datasetVersion: Type.String(), coverageStatus: Type.Literal('partial') });
export const listMetadata = Type.Object({ ...metadata.properties,
  total: Type.Integer({ minimum: 0 }), limit: Type.Integer({ minimum: 1, maximum: 100 }),
  offset: Type.Integer({ minimum: 0 }),
});
export const errorResponse = Type.Object({ error: Type.Object({
  code: Type.String(), message: Type.String(), requestId: Type.String(),
}) });
export const errorResponses = { 400: errorResponse, 404: errorResponse, 405: errorResponse,
  413: errorResponse, 429: errorResponse, 500: errorResponse };
