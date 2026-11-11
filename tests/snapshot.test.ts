import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSnapshot, Snapshot } from '../src/snapshot.ts';
import type { Entity, SnapshotMetadata } from '../src/types.ts';

export const metadata: SnapshotMetadata = { contractVersion: '1.0', datasetVersion: 'test-v1', sources: [{ name: 'Synthetic', url: 'https://example.org/fixture', license: 'MIT', attribution: 'Synthetic test data', revision: '1' }] };
export const records: Entity[] = [
  { id:'country-a', entityType:'country', countryId:'country-a', parentId:null, name:'Example A', codes:{iso2:'XA'} },
  { id:'region-a', entityType:'subdivision', countryId:'country-a', parentId:'country-a', name:'Region A', level:1 },
  { id:'city-a', entityType:'locality', countryId:'country-a', parentId:'region-a', name:'City A', coordinates:{longitude:12.5,latitude:-4.2} },
  { id:'country-b', entityType:'country', countryId:'country-b', parentId:null, name:'Example B', codes:{iso2:'XB'} },
  { id:'city-b', entityType:'locality', countryId:'country-b', parentId:'country-b', name:'City B' },
];
async function workspace(t: { after(fn: () => Promise<void>):void }) { const path = await mkdtemp(join(tmpdir(),'georeference-test-')); t.after(()=>rm(path,{recursive:true,force:true})); return path; }

test('snapshot selects descendants and closes ancestor references without mutating data', async t=>{
  const path=join(await workspace(t),'data.sqlite');
  await createSnapshot(path,metadata,[...records].reverse());
  const db=Snapshot.open(path);
  const plan=db.select({subdivisions:['region-a'],entityTypes:['locality']});
  assert.deepEqual([...plan.entities()].map(e=>e.id),['country-a','region-a','city-a']);
  assert.deepEqual(plan.contextIds,['country-a','region-a']);
  assert.equal([...plan.entities()][2]?.coordinates,undefined);
  assert.deepEqual(db.get('city-a')?.coordinates,{longitude:12.5,latitude:-4.2});
  assert.equal(db.count,5);
  db.close();
});
test('snapshot resolves country codes and declares excluded ancestors', async t=>{
  const path=join(await workspace(t),'data.sqlite'); await createSnapshot(path,metadata,records);
  const db=Snapshot.open(path);
  const plan=db.select({countries:['XA'],entityTypes:['locality'],includeAncestors:false,coordinates:true});
  assert.deepEqual([...plan.entities()].map(e=>e.id),['city-a']);
  assert.deepEqual(plan.externalReferences,['country-a','region-a']);
  assert.equal([...plan.entities()][0]?.coordinates?.longitude,12.5);
  assert.throws(()=>db.select({countries:['UNKNOWN']}),/Unknown country/);
  db.close();
});
test('snapshot rejects orphans, cycles and cross-country parentage before publishing', async t=>{
  const folder=await workspace(t);
  await assert.rejects(createSnapshot(join(folder,'orphan.sqlite'),metadata,[...records,{...records[2]!,id:'bad',parentId:'missing'}]),/reference|parent/i);
  await assert.rejects(createSnapshot(join(folder,'cycle.sqlite'),metadata,[records[0]!,{...records[1]!,parentId:'loop'},{...records[1]!,id:'loop',parentId:'region-a'}]),/cycle|unreachable/i);
  await assert.rejects(createSnapshot(join(folder,'cross.sqlite'),metadata,[...records,{...records[2]!,id:'cross',parentId:'country-b'}]),/country/i);
});
test('snapshot protects existing files and rejects malformed coordinates and boundaries', async t=>{
  const path=join(await workspace(t),'data.sqlite'); await createSnapshot(path,metadata,records);
  const original=await readFile(path);
  await assert.rejects(createSnapshot(path,metadata,records),/exist/i);
  assert.deepEqual(await readFile(path),original);
  await assert.rejects(createSnapshot(path+'-bad',metadata,[{...records[0]!,coordinates:{longitude:181,latitude:0}}]),/coordinate|longitude/i);
  await assert.rejects(createSnapshot(path+'-ring',metadata,[{...records[0]!,boundary:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1]]]}}]),/ring|closed/i);
});
