import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadCongoReference } from '../src/congo.ts';
import { createCatalog, loadCatalog } from '../src/domain/catalog.ts';
import { RESOURCE_NAMES, toResourceTables } from '../src/domain/model.ts';

test('catalog preserves every bundled resource field and UUID used by exports', async () => {
  const reference = await loadCongoReference();
  const catalog = createCatalog(reference);
  assert.deepEqual(catalog.resources, toResourceTables(reference.entities));
  assert.equal(catalog.resources.communes.length, 16);
  assert.equal(catalog.resources.neighborhoods.length, 250);
  assert.equal(catalog.resources.villages.length, 0);
  assert.equal(catalog.metadata.datasetVersion, 'cg-reference-2026-11-12.2');
  assert.equal(catalog.coverage.counts.arrondissements, 23);
});

test('catalog owns deeply immutable copies without freezing caller data', async () => {
  const reference = await loadCongoReference();
  const catalog = createCatalog(reference);
  const originalName = reference.entities[0]!.name;
  const originalSource = reference.metadata.sources[0]!.name;
  reference.entities[0]!.name = 'Changed caller entity';
  reference.metadata.sources[0]!.name = 'Changed caller source';
  assert.equal(catalog.resources.arrondissements[0]!.name, originalName);
  assert.equal(catalog.metadata.sources[0]!.name, originalSource);
  assert.throws(() => { (catalog.resources.communes[0]! as { name: string }).name = 'Changed'; }, TypeError);
  assert.equal(Reflect.set(catalog.resources.communes[0]!, 'name', 'Changed'), false);
  assert.ok(Object.isFrozen(catalog.resources));
  assert.ok(Object.isFrozen(catalog.metadata.sources));
});

test('coverage summarizes known data without exposing raw audit anomalies', async () => {
  const catalog = await loadCatalog();
  assert.deepEqual(Object.keys(catalog.coverage).sort(), [
    'communes', 'completeGeographicInventory', 'counts', 'reviewedAt', 'sourceDates', 'status',
  ]);
  assert.equal(catalog.coverage.status, 'partial');
  assert.equal(catalog.coverage.completeGeographicInventory, false);
  assert.equal(catalog.coverage.reviewedAt, '2026-11-12');
  assert.equal(catalog.coverage.counts.ruralCommunities, 0);
  const brazzaville = catalog.coverage.communes.find(row => row.name === 'Brazzaville');
  assert.equal(brazzaville?.namedNeighborhoods, 74);
  assert.equal(brazzaville?.arrondissements, 9);
  assert.deepEqual(brazzaville?.observationDates, ['2022-07-14', '2024-01']);
  assert.equal(RESOURCE_NAMES.reduce((total, resource) => total + catalog.coverage.counts[resource], 0), 398);
});

test('invalid country scope, broken parents and misleading completeness fail before serving', async () => {
  const foreign = await loadCongoReference();
  foreign.entities.find(row => row.kind === 'country')!.codes!.iso2 = 'CD';
  assert.throws(() => createCatalog(foreign), /Congo|CG/);
  const orphan = await loadCongoReference();
  orphan.entities.find(row => row.kind === 'neighborhood')!.parentId = '00000000-0000-4000-8000-000000000000';
  assert.throws(() => createCatalog(orphan), /parent|hierarchy/);
  const misleading = await loadCongoReference();
  misleading.coverage.completeGeographicInventory = true;
  assert.throws(() => createCatalog(misleading), /coverage|complete/i);
});
