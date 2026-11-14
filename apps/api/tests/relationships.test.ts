import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../src/app.ts';

const brazzaville = 'be83c679-2667-4935-9dad-0f63456298ad';
const talangai = '362c342f-6cc9-4976-afa9-cbea0bfd35cc';
const impfondo = '1035216a-3521-4110-90ba-5d90c940fb84';

test('rural-community neighborhoods are navigable without changing their source parent',async t=>{
 const app=await buildApp();t.after(()=>app.close());
 const rural=await app.inject('/v1/rural-communities?q=Kakamoeka');
 assert.equal(rural.statusCode,200);assert.equal(rural.json().data.length,1);
 const id=rural.json().data[0].id;
 const nested=await app.inject(`/v1/rural-communities/${id}/neighborhoods`);
 assert.equal(nested.statusCode,200);
 assert.ok(nested.json().data.some(row=>row.name==='Loulimba'));
 assert.ok(nested.json().data.every(row=>row.ruralCommunityId===id&&row.communeId===null));
 const filtered=await app.inject(`/v1/neighborhoods?ruralCommunityId=${id}`);
 assert.deepEqual(filtered.json().data,nested.json().data);
});

test('form navigation retrieves Brazzaville, Talangaï and the real Mpila neighborhood', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const arrondissements = await app.inject(`/v1/communes/${brazzaville}/arrondissements`);
  assert.equal(arrondissements.statusCode, 200);
  assert.equal(arrondissements.json().meta.total, 9);
  assert.ok(arrondissements.json().data.some((row: {id:string;name:string}) => row.id === talangai && row.name === 'Talangaï'));
  const neighborhoods = await app.inject(`/v1/arrondissements/${talangai}/neighborhoods`);
  assert.equal(neighborhoods.statusCode, 200);
  assert.ok(neighborhoods.json().data.some((row: {id:string;name:string}) =>
    row.id === '952458ea-c0ea-4ba8-9569-096d48c88048' && row.name === 'Mpila'));
  assert.ok(neighborhoods.json().data.every((row: {arrondissementId:string}) => row.arrondissementId === talangai));
  const commune = await app.inject(`/v1/communes/${brazzaville}/neighborhoods?limit=100`);
  assert.equal(commune.json().meta.total, 88);
  assert.ok(commune.json().data.some((row: {name:string}) => row.name === 'Mpila'));
});

test('a commune without documented arrondissements retains its direct neighborhoods', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const arrondissements = await app.inject(`/v1/communes/${impfondo}/arrondissements`);
  assert.equal(arrondissements.statusCode, 200);
  assert.deepEqual(arrondissements.json().data, []);
  assert.equal(arrondissements.json().meta.coverageStatus, 'partial');
  const neighborhoods = await app.inject(`/v1/communes/${impfondo}/neighborhoods`);
  assert.equal(neighborhoods.statusCode, 200);
  assert.equal(neighborhoods.json().meta.total, 8);
  assert.ok(neighborhoods.json().data.every((row: {communeId:string;arrondissementId:null}) =>
    row.communeId === impfondo && row.arrondissementId === null));
});

test('relationship queries validate parent identity and accept only pagination and search', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  for (const path of [
    '/v1/communes/invalid/arrondissements',
    `/v1/communes/${brazzaville}/neighborhoods?departmentId=${brazzaville}`,
  ]) assert.equal((await app.inject(path)).statusCode, 400);
  const missing = await app.inject('/v1/communes/00000000-0000-4000-8000-000000000000/neighborhoods');
  assert.equal(missing.statusCode, 404);
});
