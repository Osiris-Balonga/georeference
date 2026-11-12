import { stringify } from 'csv-stringify/sync';
import type { ExportAdapter } from '../types.ts';
import { project, validateOptions, writeChunks } from './common.ts';

function spreadsheetCell(value: string, enabled: boolean | undefined): string {
  return enabled && /^[\s]*[=+\-@\t\r\n]/u.test(value) ? `'${value}` : value;
}

export const csvAdapter: ExportAdapter = {
  format: 'csv', version: '1.1.0',
  validate: validateOptions,
  async write(context) {
    const { request } = context.plan;
    const columns = ['id', 'entityType', 'kind', 'name', 'countryId', 'parentId', 'codes', 'names', 'level'];
    if (request.coordinates) columns.push('coordinates');
    if (request.boundaries) columns.push('boundary');
    await writeChunks(context, 'entities.csv', (function* () {
      yield stringify([columns], { record_delimiter: '\r\n' });
      for (const original of context.plan.entities()) {
        const entity = project(original, request);
        const cells: Record<string, string> = {
          id: spreadsheetCell(entity.id, request.spreadsheetSafe), entityType: entity.entityType, kind:entity.kind??'',
          name: spreadsheetCell(entity.name, request.spreadsheetSafe), countryId: spreadsheetCell(entity.countryId, request.spreadsheetSafe),
          parentId: JSON.stringify(entity.parentId), codes: JSON.stringify(entity.codes) ?? '', names: JSON.stringify(entity.names) ?? '',
          level: JSON.stringify(entity.level) ?? '', coordinates: JSON.stringify(entity.coordinates) ?? '', boundary: JSON.stringify(entity.boundary) ?? '',
        };
        yield stringify([columns.map(column => cells[column]!)], { record_delimiter: '\r\n' });
      }
    })());
    return ['entities.csv'];
  },
};
