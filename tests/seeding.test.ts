import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import type { Entity, ExportManifest } from '../src/types.ts';
import { seedEntities } from '../src/seeding/index.ts';

const rows: Entity[] = [
  { id: 'demo:country', entityType: 'country', name: 'Example Land', countryId: 'demo:country', parentId: null, codes: { iso: 'XX' } },
  { id: 'demo:region', entityType: 'subdivision', name: 'North', countryId: 'demo:country', parentId: 'demo:country', level: 1 },
  { id: 'demo:city', entityType: 'locality', name: "O'Example", countryId: 'demo:country', parentId: 'demo:region', coordinates: { longitude: 12.25, latitude: -1.5 } },
];

function manifest(contentId = 'a'.repeat(64), datasetVersion = 'release-one'): ExportManifest {
  return {
    contractVersion: '1.0', generatorVersion: '1.0.0', adapterVersion: '1.0.0', datasetVersion, contentId,
    request: { format: 'ndjson', coordinates: true, boundaries: false }, sources: [], count: 3,
    counts: { country: 1, subdivision: 1, locality: 1 }, contextIds: [], externalReferences: [],
    geometry: { coordinates: { requested: true, missing: 2 }, boundaries: { requested: false, missing: 0 }, crs: 'OGC:CRS84' },
    scope: { kind: 'full', complete: true }, files: [],
  };
}
const input = (entities = rows, contentId?: string, datasetVersion?: string) => ({ entities, manifest: manifest(contentId, datasetVersion) });

test('dry-run reports planned inserts without creating schema or data', async () => {
  const db = new PGlite();
  try {
    const report = await seedEntities(db, input(), { createSchema: true });
    assert.equal(report.dryRun, true);
    assert.equal(report.inserted, 3);
    assert.equal((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows.length, 0);
  } finally { await db.close(); }
});

test('apply preserves references and a second import performs no row updates', async () => {
  const db = new PGlite();
  try {
    const first = await seedEntities(db, input(), { createSchema: true, dryRun: false, batchSize: 1 });
    assert.equal(first.inserted, 3);
    const before = (await db.query('SELECT id, xmin::text AS revision FROM georeference_entities ORDER BY id')).rows;
    const second = await seedEntities(db, input(), { dryRun: false, batchSize: 1 });
    assert.equal(second.inserted, 0);
    assert.equal(second.updated, 0);
    assert.equal(second.unchanged, 3);
    assert.deepEqual((await db.query('SELECT id, xmin::text AS revision FROM georeference_entities ORDER BY id')).rows, before);
    assert.deepEqual((await db.query("SELECT name,parent_id,coordinates FROM georeference_entities WHERE id='demo:city'")).rows[0], {
      name: "O'Example", parent_id: 'demo:region', coordinates: { longitude: 12.25, latitude: -1.5 },
    });
  } finally { await db.close(); }
});

test('updates preserve fields excluded from projection and never delete absent entities', async () => {
  const db = new PGlite();
  try {
    await seedEntities(db, input(), { createSchema: true, dryRun: false });
    const changed = input(rows.map(({ coordinates: _coordinates, ...entity }) => ({ ...entity, name: entity.id === 'demo:city' ? 'Changed' : entity.name })), 'b'.repeat(64), 'release-two');
    changed.manifest.request.coordinates = false;
    changed.manifest.geometry.coordinates.requested = false;
    const report = await seedEntities(db, changed, { dryRun: false, revision: 1 });
    assert.equal(report.updated, 1);
    assert.equal(report.unchanged, 2);
    assert.deepEqual((await db.query("SELECT coordinates FROM georeference_entities WHERE id='demo:city'")).rows[0], { coordinates: { longitude: 12.25, latitude: -1.5 } });
    const partial = input([rows[0]!], 'c'.repeat(64), 'release-three');
    partial.manifest.count = 1;
    partial.manifest.counts = { country: 1, subdivision: 0, locality: 0 };
    partial.manifest.scope.complete = false;
    await seedEntities(db, partial, { dryRun: false, revision: 2 });
    assert.equal((await db.query('SELECT count(*)::int AS total FROM georeference_entities')).rows[0]?.total, 3);
  } finally { await db.close(); }
});

test('rejects non-monotonic updates rather than guessing opaque version ordering', async () => {
  const db = new PGlite();
  try {
    await seedEntities(db, input(), { createSchema: true, dryRun: false, revision: 5 });
    await assert.rejects(seedEntities(db, input(rows, 'b'.repeat(64), 'new-label'), { dryRun: false }), /revision/i);
    await assert.rejects(seedEntities(db, input(rows, 'b'.repeat(64), 'new-label'), { dryRun: false, revision: 4 }), /revision/i);
    assert.equal((await db.query('SELECT count(*)::int AS total FROM georeference_entities')).rows[0]?.total, 3);
  } finally { await db.close(); }
});

test('insert-only skips changed rows and reports conflicts without overwriting', async () => {
  const db = new PGlite();
  try {
    await seedEntities(db, input(), { createSchema: true, dryRun: false });
    const changed = input(rows.map(entity => ({ ...entity, name: 'Replacement' })), 'b'.repeat(64));
    const report = await seedEntities(db, changed, { dryRun: false, mode: 'insert-only', revision: 1 });
    assert.equal(report.skipped, 3);
    assert.equal(report.conflicts.length, 3);
    assert.equal((await db.query("SELECT name FROM georeference_entities WHERE id='demo:country'")).rows[0]?.name, 'Example Land');
  } finally { await db.close(); }
});

test('existing application keys and application columns survive mapped imports', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE places (
      local_id BIGSERIAL PRIMARY KEY, geo_id TEXT UNIQUE NOT NULL,
      entity_type TEXT NOT NULL, name TEXT NOT NULL, country_id BIGINT NOT NULL,
      parent_id BIGINT REFERENCES places(local_id) DEFERRABLE INITIALLY DEFERRED,
      codes JSONB DEFAULT '{}', names JSONB DEFAULT '{}', level INTEGER,
      coordinates JSONB, boundary JSONB, business_note TEXT DEFAULT 'keep me'
    )`);
    const mapping = { table: 'places', localIdColumn: 'local_id', columns: { id: 'geo_id' } };
    const report = await seedEntities(db, input(), { dryRun: false, mapping });
    assert.equal(report.inserted, 3);
    const country = (await db.query("SELECT local_id FROM places WHERE geo_id='demo:country'")).rows[0]!;
    const region = (await db.query("SELECT local_id,parent_id,country_id FROM places WHERE geo_id='demo:region'")).rows[0]!;
    assert.equal(region.parent_id, country.local_id);
    assert.equal(region.country_id, country.local_id);
    const cityBefore = (await db.query("SELECT local_id FROM places WHERE geo_id='demo:city'")).rows[0]!;
    await seedEntities(db, input(rows.map(entity => ({ ...entity, name: 'new' })), 'b'.repeat(64)), { dryRun: false, revision: 1, mapping });
    const cityAfter = (await db.query("SELECT local_id,business_note FROM places WHERE geo_id='demo:city'")).rows[0]!;
    assert.equal(cityAfter.local_id, cityBefore.local_id);
    assert.equal(cityAfter.business_note, 'keep me');
  } finally { await db.close(); }
});

test('recovery skips committed batches and rolls back the failing batch', async () => {
  const db = new PGlite();
  try {
    let insertCount = 0;
    const interrupted = { query: async (text: string, values?: unknown[]) => {
      if (text.startsWith('INSERT INTO "public"."georeference_entities"') && ++insertCount === 2) throw new Error('simulated disconnect');
      return db.query(text, values);
    } };
    await assert.rejects(seedEntities(interrupted, input(), { createSchema: true, dryRun: false, batchSize: 1 }), /simulated disconnect/);
    assert.equal((await db.query('SELECT count(*)::int AS total FROM georeference_entities')).rows[0]?.total, 1);
    const report = await seedEntities(db, input(), { dryRun: false, batchSize: 1 });
    assert.equal(report.resumedBatches, 1);
    assert.equal((await db.query('SELECT count(*)::int AS total FROM georeference_entities')).rows[0]?.total, 3);
    assert.equal((await db.query("SELECT status FROM _georeference_imports")).rows[0]?.status, 'complete');
  } finally { await db.close(); }
});

test('unresolved parents are rejected before any writes', async () => {
  const db = new PGlite();
  try {
    const orphan = input([{ ...rows[2]!, parentId: 'absent' }]);
    orphan.manifest.count = 1;
    orphan.manifest.externalReferences = ['absent', 'demo:country'];
    await assert.rejects(seedEntities(db, orphan, { createSchema: true, dryRun: false }), /reference|parent/i);
    assert.equal((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows.length, 0);
  } finally { await db.close(); }
});

test('opaque identifiers and names may start with pending without being treated as unresolved', async () => {
  const db = new PGlite();
  try {
    const entity: Entity = { id: 'pending:country', entityType: 'country', name: 'pending: display name', countryId: 'pending:country', parentId: null };
    const data = input([entity]);
    data.manifest.count = 1;
    await seedEntities(db, data, { createSchema: true, dryRun: false });
    assert.equal((await db.query('SELECT name FROM georeference_entities')).rows[0]?.name, 'pending: display name');
  } finally { await db.close(); }
});

test('mapped external parents cannot silently attach a child to a different country', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE places (local_id BIGSERIAL PRIMARY KEY,geo_id TEXT UNIQUE,entity_type TEXT,name TEXT,country_id BIGINT,parent_id BIGINT);
      INSERT INTO places VALUES (10,'geo:a','country','A',10,NULL),(20,'geo:b','country','B',20,NULL),(30,'geo:b-region','subdivision','B region',20,20)`);
    const data = input([{ id: 'geo:new', entityType: 'locality', name: 'New', countryId: 'geo:a', parentId: 'geo:b-region' }]);
    data.manifest.count = 1;
    await assert.rejects(seedEntities(db, data, { dryRun: false, mapping: { table: 'places', localIdColumn: 'local_id', columns: { id: 'geo_id' } } }), /country mismatch/i);
    assert.equal((await db.query('SELECT count(*)::int AS total FROM places')).rows[0]?.total, 3);
  } finally { await db.close(); }
});
