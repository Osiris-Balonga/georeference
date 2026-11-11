import type { AdapterContext, ExportAdapter } from '../types.ts';
import { jsonArray, project, validateOptions, writeChunks } from './common.ts';

function* collection(context: AdapterContext, layer: 'points' | 'boundaries'): Generator<string> {
  yield '{"type":"FeatureCollection","features":';
  yield* jsonArray((function* () {
    for (const original of context.plan.entities()) {
      const entity = project(original, context.plan.request);
      const { coordinates, boundary, ...properties } = entity;
      const geometry = layer === 'points'
        ? coordinates ? { type: 'Point', coordinates: [coordinates.longitude, coordinates.latitude] } : null
        : boundary ?? null;
      yield { type: 'Feature', id: entity.id, properties, geometry };
    }
  })());
  yield '}\n';
}

export const geojsonAdapter: ExportAdapter = {
  format: 'geojson', version: '1.0.0',
  validate(request) {
    validateOptions(request);
    if (!request.coordinates && !request.boundaries) throw new Error('GeoJSON requires coordinates and/or boundaries');
  },
  async write(context) {
    const files: string[] = [];
    if (context.plan.request.coordinates) {
      await writeChunks(context, 'points.geojson', collection(context, 'points'));
      files.push('points.geojson');
    }
    if (context.plan.request.boundaries) {
      await writeChunks(context, 'boundaries.geojson', collection(context, 'boundaries'));
      files.push('boundaries.geojson');
    }
    return files;
  },
};
