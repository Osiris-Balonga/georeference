import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { parse } from 'csv-parse/sync';
import { PGlite } from '@electric-sql/pglite';
import { getBuiltinAdapters } from '../src/adapters/index.ts';
import type { Entity, ExportFormat, ExportPlan, ExportRequest } from '../src/types.ts';

const records: Entity[] = [
  { id: 'country:001', entityType: 'country', name: 'Synthetic Republic', countryId: 'country:001', parentId: null, codes: { iso: 'ZZ' } },
  { id: 'sub:001', entityType: 'subdivision', name: "North, O'Vale\nDistrict", countryId: 'country:001', parentId: 'country:001', level: 1,
    coordinates: { longitude: 12.25, latitude: -3.5 }, boundary: { type: 'Polygon', coordinates: [[[12,-4],[13,-4],[13,-3],[12,-4]]] } },
  { id: 'place:0001', entityType: 'locality', name: '=SYNTHETIC()', countryId: 'country:001', parentId: 'sub:001', names: { fr: 'Étoile "Bleue"' }, coordinates: null },
];

function plan(format: ExportFormat, options: Partial<ExportRequest> = {}, entities = records): ExportPlan {
  return {
    request: { format, ...options },
    metadata: { contractVersion: '1.0', datasetVersion: 'synthetic-1', sources: [{ name: 'Synthetic fixture', url: 'https://example.invalid/data', license: 'MIT', attribution: 'Synthetic test data', revision: '1' }] },
    count: entities.length, contextIds: [], externalReferences: [], entities: () => entities.values(),
  };
}

async function write(format: ExportFormat, options: Partial<ExportRequest> = {}, entities = records) {
  const directory = await mkdtemp(join(tmpdir(), 'georeference-adapters-'));
  const adapter = getBuiltinAdapters().find(item => item.format === format);
  assert.ok(adapter, `Missing ${format} adapter`);
  const exportPlan = plan(format, options, entities);
  adapter.validate(exportPlan.request);
  try {
    const files = await adapter.write({ directory, plan: exportPlan });
    return { directory, files, read: (filename: string) => readFile(join(directory, filename), 'utf8'), cleanup: () => rm(directory, { recursive: true, force: true }) };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

test('flat JSON preserves opaque IDs, Unicode and explicit null without exporting unrequested geometry', async () => {
  const output = await write('json');
  try {
    const decoded = JSON.parse(await output.read(output.files[0]!));
    assert.equal(decoded.metadata.datasetVersion, 'synthetic-1');
    assert.equal(decoded.entities[2].id, 'place:0001');
    assert.equal(decoded.entities[2].names.fr, 'Étoile "Bleue"');
    assert.equal(decoded.entities[0].parentId, null);
    assert.equal(Object.hasOwn(decoded.entities[1], 'coordinates'), false);
    assert.equal(Object.hasOwn(decoded.entities[1], 'boundary'), false);
  } finally { await output.cleanup(); }
});

test('hierarchical JSON places a locality beneath its subdivision without changing its identifier', async () => {
  const output = await write('json', { layout: 'hierarchical', coordinates: true });
  try {
    const decoded = JSON.parse(await output.read(output.files[0]!));
    assert.equal(decoded.entities.length, 1);
    assert.equal(decoded.entities[0].children[0].children[0].id, 'place:0001');
    assert.deepEqual(decoded.entities[0].children[0].coordinates, { longitude: 12.25, latitude: -3.5 });
  } finally { await output.cleanup(); }
});

test('NDJSON emits one complete JSON entity per physical line even when names contain newlines', async () => {
  const output = await write('ndjson', { coordinates: true, boundaries: true });
  try {
    const text = await output.read(output.files[0]!);
    const decoded = text.trimEnd().split('\n').map(line => JSON.parse(line));
    assert.equal(decoded.length, 3);
    assert.equal(decoded[1].name, "North, O'Vale\nDistrict");
    assert.equal(decoded[2].coordinates, null);
    assert.equal(decoded[1].boundary.type, 'Polygon');
  } finally { await output.cleanup(); }
});

test('CSV round-trips quoted names, leading-zero IDs and JSON nulls through an independent parser', async () => {
  const output = await write('csv', { coordinates: true });
  try {
    const decoded = parse(await output.read(output.files[0]!), { columns: true });
    assert.equal(decoded[1].name, "North, O'Vale\nDistrict");
    assert.equal(decoded[2].id, 'place:0001');
    assert.equal(JSON.parse(decoded[0].parentId), null);
    assert.equal(JSON.parse(decoded[2].names).fr, 'Étoile "Bleue"');
    assert.equal(JSON.parse(decoded[2].coordinates), null);
    assert.equal(decoded[0].coordinates, '', 'absent coordinates must not become an explicit clearing null');
    assert.equal(decoded[1].codes, '', 'absent codes must not become an empty replacement object');
    assert.equal(Object.hasOwn(decoded[0], 'boundary'), false);
    assert.equal(decoded[2].name, '=SYNTHETIC()');
  } finally { await output.cleanup(); }
});

test('spreadsheet CSV is explicit and protects formula-like names without changing machine CSV', async () => {
  const output = await write('csv', { spreadsheetSafe: true });
  try {
    const decoded = parse(await output.read(output.files[0]!), { columns: true });
    assert.equal(decoded[2].name, "'=SYNTHETIC()");
  } finally { await output.cleanup(); }
});

test('SQLite is immediately queryable with retained IDs and enforceable parent relationships', async () => {
  const output = await write('sqlite', { coordinates: true, boundaries: true });
  try {
    const database = new DatabaseSync(join(output.directory, output.files[0]!), { readOnly: true });
    try {
      assert.equal(database.prepare('SELECT count(*) AS total FROM georeference_entities').get()!.total, 3);
      const row = database.prepare('SELECT id,name,parent_id,coordinates,boundary FROM georeference_entities WHERE id = ?').get('sub:001')!;
      assert.equal(row.name, "North, O'Vale\nDistrict");
      assert.equal(row.parent_id, 'country:001');
      assert.deepEqual(JSON.parse(String(row.coordinates)), { longitude: 12.25, latitude: -3.5 });
      assert.equal(JSON.parse(String(row.boundary)).type, 'Polygon');
      assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
      assert.equal(database.prepare('PRAGMA integrity_check').get()!.integrity_check, 'ok');
    } finally { database.close(); }
  } finally { await output.cleanup(); }
});

test('GeoJSON writes independent point and boundary layers in longitude/latitude order', async () => {
  const output = await write('geojson', { coordinates: true, boundaries: true });
  try {
    assert.equal(output.files.length, 2);
    const collections = await Promise.all(output.files.map(async file => JSON.parse(await output.read(file))));
    const points = collections.find(collection => collection.features.some((feature: any) => feature.geometry?.type === 'Point'));
    const boundaries = collections.find(collection => collection.features.some((feature: any) => feature.geometry?.type === 'Polygon'));
    assert.deepEqual(points.features[1].geometry.coordinates, [12.25, -3.5]);
    assert.equal(points.features[1].id, 'sub:001');
    assert.equal(points.features[2].geometry, null);
    assert.equal(boundaries.features[1].id, 'sub:001');
    assert.equal(boundaries.features[0].geometry, null);
    assert.equal(Object.hasOwn(points.features[1].properties, 'boundary'), false);
  } finally { await output.cleanup(); }
});

test('PostgreSQL data-only excludes DDL and geometry updates when geometry was not requested', async () => {
  const output = await write('sql-postgres', { schemaMode: 'data-only' });
  try {
    const text = await output.read(output.files[0]!);
    assert.doesNotMatch(text, /CREATE TABLE/);
    assert.match(text, /North, O''Vale/);
    assert.match(text, /ON CONFLICT \("id"\) DO UPDATE/);
    assert.doesNotMatch(text, /"coordinates"/);
    assert.doesNotMatch(text, /"boundary"/);
  } finally { await output.cleanup(); }
});

test('PostgreSQL schema mode includes constraints and insert-only ignores stable-ID conflicts', async () => {
  const output = await write('sql-postgres', { sqlMode: 'insert-only' });
  try {
    const text = await output.read(output.files[0]!);
    assert.match(text, /CREATE TABLE/);
    assert.match(text, /DEFERRABLE INITIALLY DEFERRED/);
    assert.match(text, /DO NOTHING/);
    assert.doesNotMatch(text, /DO UPDATE/);
  } finally { await output.cleanup(); }
});

test('PostgreSQL scripts execute safely and identical replay does not fire update triggers', async () => {
  const malicious = records.map(entity => ({ ...entity }));
  malicious[1]!.name = "Synthetic '); DROP TABLE georeference_entities; -- \\ test";
  const output = await write('sql-postgres', { coordinates: true }, malicious);
  const database = new PGlite();
  try {
    const sql = await output.read(output.files[0]!);
    await database.exec(sql);
    const row = await database.query('SELECT name, coordinates FROM georeference_entities WHERE id=$1', ['sub:001']);
    assert.equal(row.rows[0]!.name, malicious[1]!.name);
    assert.deepEqual(row.rows[0]!.coordinates, { longitude: 12.25, latitude: -3.5 });
    await database.exec(`CREATE TABLE synthetic_update_audit (id TEXT);
      CREATE FUNCTION synthetic_track_update() RETURNS TRIGGER AS $$
      BEGIN INSERT INTO synthetic_update_audit VALUES (NEW.id); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
      CREATE TRIGGER synthetic_update AFTER UPDATE ON georeference_entities FOR EACH ROW EXECUTE FUNCTION synthetic_track_update();`);
    await database.exec(sql);
    assert.equal((await database.query('SELECT count(*)::int AS total FROM synthetic_update_audit')).rows[0]!.total, 0);
    assert.equal((await database.query('SELECT count(*)::int AS total FROM georeference_entities')).rows[0]!.total, 3);
  } finally { await database.close(); await output.cleanup(); }
});

test('a data-only update preserves geometry and application fields excluded from the export', async () => {
  const original = await write('sql-postgres', { coordinates: true, boundaries: true });
  const changed = records.map(entity => ({ ...entity, name: entity.id === 'sub:001' ? 'New Synthetic Name' : entity.name }));
  const update = await write('sql-postgres', { schemaMode: 'data-only' }, changed);
  const database = new PGlite();
  try {
    await database.exec(await original.read(original.files[0]!));
    await database.exec("ALTER TABLE georeference_entities ADD COLUMN application_memo TEXT DEFAULT 'local business value'");
    await database.exec(await update.read(update.files[0]!));
    const { rows } = await database.query('SELECT name,coordinates,boundary,application_memo FROM georeference_entities WHERE id=$1', ['sub:001']);
    assert.equal(rows[0]!.name, 'New Synthetic Name');
    assert.equal(rows[0]!.application_memo, 'local business value');
    assert.deepEqual(rows[0]!.coordinates, { longitude: 12.25, latitude: -3.5 });
    assert.equal((rows[0]!.boundary as { type: string }).type, 'Polygon');
  } finally { await database.close(); await original.cleanup(); await update.cleanup(); }
});

test('adapters reject impossible combinations before generating any files', () => {
  for (const format of ['ndjson', 'csv', 'sql-postgres', 'sqlite', 'geojson'] as ExportFormat[]) {
    const adapter = getBuiltinAdapters().find(item => item.format === format)!;
    assert.throws(() => adapter.validate({ format, layout: 'hierarchical' }), /hierarchical/i);
  }
  const geographic = getBuiltinAdapters().find(item => item.format === 'geojson')!;
  assert.throws(() => geographic.validate({ format: 'geojson' }), /coordinates|boundaries/i);
});
