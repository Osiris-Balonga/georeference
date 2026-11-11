import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { AdapterContext, Entity, ExportRequest } from '../types.ts';

export function validateOptions(request: ExportRequest, hierarchical = false): void {
  if (request.layout === 'hierarchical' && !hierarchical) throw new Error(`${request.format} does not support hierarchical layout`);
  if (request.format !== 'sql-postgres' && (request.schemaMode !== undefined || request.sqlMode !== undefined)) {
    throw new Error('SQL options are only supported by sql-postgres');
  }
  if (request.format !== 'csv' && request.spreadsheetSafe !== undefined) throw new Error('spreadsheetSafe is only supported by CSV');
}

export function project(entity: Entity, request: ExportRequest): Entity {
  const result = { ...entity };
  if (!request.coordinates) delete result.coordinates;
  if (!request.boundaries) delete result.boundary;
  return result;
}

export async function writeChunks(context: AdapterContext, filename: string, chunks: Iterable<string> | AsyncIterable<string>): Promise<void> {
  context.signal?.throwIfAborted();
  await pipeline(Readable.from(chunks), createWriteStream(join(context.directory, filename), { flags: 'wx' }), context.signal ? { signal: context.signal } : {});
}

export function* jsonArray(values: Iterable<unknown>): Generator<string> {
  yield '[';
  let first = true;
  for (const value of values) {
    if (!first) yield ',';
    yield JSON.stringify(value);
    first = false;
  }
  yield ']';
}
