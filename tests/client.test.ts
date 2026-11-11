import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Snapshot,createSnapshot } from '../src/snapshot.ts';
import { createClient } from '../src/client.ts';

test('SDK resolves countries by ISO code and keeps locality iteration isolated to its country',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-client-'));
  await createSnapshot(join(folder,'source.sqlite'),{contractVersion:'1.0',datasetVersion:'synthetic-1',sources:[{name:'Synthetic',url:'https://example.org',license:'MIT',attribution:'Synthetic',revision:'1'}]},[
    {id:'a',entityType:'country',name:'Country A',countryId:'a',parentId:null,codes:{iso2:'XA'}},
    {id:'b',entityType:'country',name:'Country B',countryId:'b',parentId:null},
    {id:'a1',entityType:'subdivision',name:'Region A',countryId:'a',parentId:'a'},
    {id:'a2',entityType:'locality',name:'City A',countryId:'a',parentId:'a1',coordinates:{longitude:1,latitude:2}},
    {id:'b1',entityType:'locality',name:'City B',countryId:'b',parentId:'b'},
  ]);
  const snapshot=Snapshot.open(join(folder,'source.sqlite'));
  t.after(async()=>{snapshot.close();await rm(folder,{recursive:true,force:true});});
  const client=createClient(snapshot);
  assert.equal(client.getCountry('xa')?.id,'a');
  assert.equal(client.getCountry('a2'),undefined);
  assert.equal(client.getCountry('missing'),undefined);
  assert.deepEqual(client.listCountries().map(entity=>entity.id),['a','b']);
  assert.deepEqual(client.listSubdivisions('a').map(entity=>entity.id),['a1']);
  assert.deepEqual([...client.iterateLocalities('a')].map(entity=>entity.id),['a2']);
  assert.deepEqual(client.getEntity('a2')?.coordinates,{longitude:1,latitude:2});
});
