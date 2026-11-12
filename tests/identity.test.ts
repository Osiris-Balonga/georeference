import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadCongoReference,validateCongoReference} from '../src/congo.ts';
import {readFile} from 'node:fs/promises';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
test('bundled identities are UUIDs, stable across load and display-name changes',async()=>{
 const a=await loadCongoReference(),b=await loadCongoReference();
 assert.ok(a.entities.every(e=>uuid.test(e.id)),'Every public catalog ID must be a UUIDv4');
 assert.deepEqual(a.entities.map(e=>e.id),b.entities.map(e=>e.id));
 const input=JSON.parse(await readFile('reference/congo.json','utf8'));
 const target=input.entries.find(e=>e.entity.name==='Mpila');const before=target.entity.id;target.entity.name='Renamed test label';
 assert.equal(validateCongoReference(input).entities.find(e=>e.name==='Renamed test label')?.id,before);
 const registry=JSON.parse(await readFile('reference/identities.json','utf8'));
 assert.equal(registry.ids['cg:neighborhood:brazzaville:6:601'],before);
 assert.equal(new Set(Object.values(registry.ids)).size,a.entities.length);
});
