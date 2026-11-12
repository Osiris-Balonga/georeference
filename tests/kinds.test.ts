import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp,rm,readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PGlite } from '@electric-sql/pglite';
import { createSnapshot,Snapshot } from '../src/snapshot.ts';
import { exportSnapshot } from '../src/export.ts';
import { readPackage } from '../src/package.ts';
import { validateEntity } from '../src/validation.ts';
import { seedPostgres } from '../src/seeding/index.ts';
import { createClient } from '../src/client.ts';
import type { Entity } from '../src/types.ts';
const metadata={contractVersion:'1.0' as const,datasetVersion:'synthetic-kinds',sources:[{name:'Synthetic',url:'https://example.invalid',license:'MIT',attribution:'Synthetic unit fixture',revision:'1'}]};
const records:Entity[]=[
  {id:'c',entityType:'country',name:'Synthetic country',countryId:'c',parentId:null,kind:'country'} as Entity,
  {id:'m',entityType:'subdivision',name:'Synthetic municipality',countryId:'c',parentId:'c',kind:'commune'} as Entity,
  {id:'a',entityType:'subdivision',name:'Synthetic arrondissement',countryId:'c',parentId:'m',kind:'arrondissement'} as Entity,
  {id:'q',entityType:'locality',name:'Synthetic neighborhood',countryId:'c',parentId:'a',kind:'neighborhood'} as Entity,
];
test('administrative kinds survive snapshot, machine formats, SQLite and PostgreSQL seeding',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-kinds-'));const close:(()=>void|Promise<void>)[]=[];
  t.after(async()=>{for(const dispose of close)await dispose();await rm(folder,{recursive:true,force:true});});
  await createSnapshot(join(folder,'source.sqlite'),metadata,records);const snapshot=Snapshot.open(join(folder,'source.sqlite'));close.push(()=>snapshot.close());
  for(const format of ['json','ndjson','csv']) {
    const output=join(folder,format);await exportSnapshot(snapshot,output,{format});
    const loaded=await readPackage(output);assert.equal((loaded.entities.find(e=>e.id==='q') as Entity&{kind:string}).kind,'neighborhood');
    assert.equal(loaded.entities.find(e=>e.id==='q')?.parentId,'a');
  }
  await exportSnapshot(snapshot,join(folder,'sqlite'),{format:'sqlite'});
  const sqlite=new DatabaseSync(join(folder,'sqlite/entities.sqlite'),{readOnly:true});
  try {assert.equal(sqlite.prepare('SELECT kind FROM georeference_entities WHERE id=?').get('q')?.kind,'neighborhood');}finally{sqlite.close();}
  const pg=new PGlite();close.push(()=>pg.close());
  const report=await seedPostgres({query:async(text:string,values?:unknown[])=>pg.query(text,values)},join(folder,'json'),{createSchema:true,dryRun:false});
  assert.equal(report.inserted,4);
  assert.equal((await pg.query('SELECT kind FROM georeference_entities WHERE id=$1',['a'])).rows[0]?.kind,'arrondissement');
  await exportSnapshot(snapshot,join(folder,'sql'),{format:'sql-postgres'});
  await pg.exec(await readFile(join(folder,'sql/entities.sql'),'utf8'));
  assert.equal((await pg.query('SELECT kind FROM georeference_entities WHERE id=$1',['q'])).rows[0]?.kind,'neighborhood');
});
test('unknown kinds and incompatible administrative categories are rejected',()=>{
  assert.throws(()=>validateEntity({...records[0],kind:'invented'}),/kind/i);
  assert.throws(()=>validateEntity({...records[0],kind:'neighborhood'}),/kind/i);
  assert.throws(()=>validateEntity({...records[3],kind:'department'}),/kind/i);
});
test('kind filters and SDK distinguish communes, arrondissements and neighborhood descendants',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-kind-select-'));
  await createSnapshot(join(folder,'source.sqlite'),metadata,records);const snapshot=Snapshot.open(join(folder,'source.sqlite'));
  t.after(async()=>{snapshot.close();await rm(folder,{recursive:true,force:true});});
  const plan=snapshot.select({kinds:['neighborhood'],includeAncestors:false} as never);
  try {assert.deepEqual([...plan.entities()].map(e=>e.id),['q']);}finally{plan.dispose?.();}
  const client=createClient(snapshot);
  assert.deepEqual(client.listCommunes().map(e=>e.id),['m']);
  assert.deepEqual(client.listArrondissements('m').map(e=>e.id),['a']);
  assert.deepEqual(client.listNeighborhoods('m').map(e=>e.id),['q']);
  assert.deepEqual(client.listNeighborhoods('a').map(e=>e.id),['q']);
});
