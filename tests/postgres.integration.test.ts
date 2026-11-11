import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import pg from 'pg';
import { seedEntities } from '../src/seeding/index.ts';
import type { SeedInput } from '../src/seeding/index.ts';

test('PostgreSQL transport applies idempotently and excludes concurrent sessions', { skip: !process.env.DATABASE_URL }, async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const concurrent = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const schema = `test_georeference_${randomUUID().replaceAll('-', '')}`;
  const input: SeedInput = {
    manifest: {
      contractVersion: '1.0', generatorVersion: '1.0.0', adapterVersion: '1.0.0', datasetVersion: 'synthetic-transport-one', contentId: 'a'.repeat(64),
      request: { format: 'ndjson' }, sources: [], count: 2, counts: { country: 1, subdivision: 0, locality: 1 }, contextIds: [], externalReferences: [],
      geometry: { coordinates: { requested: false, missing: 0 }, boundaries: { requested: false, missing: 0 }, crs: 'OGC:CRS84' },
      scope: { kind: 'full', complete: true }, files: [],
    },
    entities: [
      { id: 'example:country', entityType: 'country', name: 'Synthetic country', countryId: 'example:country', parentId: null },
      { id: 'example:city', entityType: 'locality', name: "Test's city", countryId: 'example:country', parentId: 'example:country' },
    ],
  };
  await client.connect();
  await concurrent.connect();
  try {
    let announceLocked!: () => void;
    let resume!: () => void;
    const locked = new Promise<void>(resolve => { announceLocked = resolve; });
    const barrier = new Promise<void>(resolve => { resume = resolve; });
    const paused = { query: async (text: string, values?: unknown[]) => {
      const result = await client.query(text, values);
      if (text.startsWith('SELECT pg_try_advisory_lock')) { announceLocked(); await barrier; }
      return result;
    } };
    const active = seedEntities(paused, input, { createSchema: true, dryRun: false, mapping: { schema }, batchSize: 1 });
    await locked;
    try {
      await assert.rejects(seedEntities(concurrent, input, { createSchema: true, dryRun: false, mapping: { schema } }), /lock/);
    } finally { resume(); }
    assert.equal((await active).inserted, 2);
    const report = await seedEntities(client, input, { dryRun: false, mapping: { schema } });
    assert.equal(report.unchanged, 2);
    assert.equal(report.updated, 0);
    assert.equal((await client.query(`SELECT parent_id FROM "${schema}".georeference_entities WHERE id=$1`, ['example:city'])).rows[0]?.parent_id, 'example:country');
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await client.end();
    await concurrent.end();
  }
});
