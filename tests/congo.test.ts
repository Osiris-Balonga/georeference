import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadCongoReference,validateCongoReference } from '../src/congo.ts';
test('Congo reference contains real dated administrative relationships and no other country',async()=>{
  const reference=await loadCongoReference();const byId=new Map(reference.entities.map(e=>[e.id,e]));
  const country=reference.entities.filter(e=>e.kind==='country');assert.equal(country.length,1);assert.equal(country[0]?.codes?.iso2,'CG');assert.equal(country[0]?.codes?.iso3,'COG');
  assert.equal(country[0]?.id,'geonames:2260494');
  assert.equal(reference.entities.filter(e=>e.kind==='department').length,15);
  const kintele=reference.entities.find(e=>e.kind==='commune'&&e.name==='Kintélé');assert.ok(kintele);
  assert.equal(byId.get(kintele.parentId!)?.name,'Brazzaville');assert.equal(byId.get(kintele.parentId!)?.kind,'department');
  const bouemba=reference.entities.find(e=>e.kind==='district'&&e.name==='Bouemba');assert.ok(bouemba);assert.equal(byId.get(bouemba.parentId!)?.name,'Plateaux');
  const mpila=reference.entities.find(e=>e.kind==='neighborhood'&&e.name==='Mpila');assert.ok(mpila);
  const talangai=byId.get(mpila.parentId!);assert.equal(talangai?.name,'Talangaï');assert.equal(talangai?.kind,'arrondissement');
  const city=byId.get(talangai!.parentId!);assert.equal(city?.name,'Brazzaville');assert.equal(city?.kind,'commune');
  const makengue=reference.entities.find(e=>e.kind==='neighborhood'&&e.name==='MAKENGUE');assert.ok(makengue);assert.equal(byId.get(makengue.parentId!)?.codes?.municipalNumber,'1');
  assert.equal(reference.coverage.status,'partial');assert.equal(reference.coverage.completeGeographicInventory,false);
  for(const entity of reference.entities){assert.equal(entity.countryId,country[0]!.id);assert.ok(reference.provenance[entity.id]?.length);assert.equal(entity.coordinates,undefined);assert.equal(entity.boundary,undefined);}
});
test('catalog rejects foreign-country substitutions, invented hierarchy and missing evidence',async()=>{
  const read=async()=>JSON.parse(await readFile('reference/congo.json','utf8'));
  const foreign=await read();foreign.entries.find(e=>e.entity.kind==='country').entity.codes.iso2='CD';assert.throws(()=>validateCongoReference(foreign),/Congo|CG/);
  const wrongParent=await read();wrongParent.entries.find(e=>e.entity.kind==='neighborhood').entity.parentId='geonames:2260494';assert.throws(()=>validateCongoReference(wrongParent),/parent|hierarchy/);
  const noEvidence=await read();noEvidence.entries[0].evidence=[];assert.throws(()=>validateCongoReference(noEvidence),/evidence|source/);
});
