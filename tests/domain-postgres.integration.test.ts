import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import pg from 'pg';
import {emptyResourceTables} from '../src/domain/model.ts';
import {writeDomainSql,identifier} from '../src/domain/sql.ts';
import {seedResources} from '../src/domain/seed.ts';
import type {ExportManifest} from '../src/types.ts';

test('PostgreSQL transport executes domain SQL and seeds stable UUIDs with atomic rollback', {skip:!process.env.DATABASE_URL},async()=>{
 const client=new pg.Client({connectionString:process.env.DATABASE_URL});
 const prefix='test_domain_'+randomUUID().replaceAll('-','');
 const exportSchema=prefix+'_export',seedSchema=prefix+'_seed',rollbackSchema=prefix+'_rollback';
 const directory=await mkdtemp(join(tmpdir(),'georeference-domain-pg-'));
 const ids={country:randomUUID(),department:randomUUID(),commune:randomUUID(),arrondissement:randomUUID(),neighborhood:randomUUID()};
 const tables=emptyResourceTables();
 tables.countries.push({id:ids.country,name:'Synthetic test country',iso2:'CG',iso3:'COG'});
 tables.departments.push({id:ids.department,name:'Synthetic department',countryId:ids.country});
 tables.communes.push({id:ids.commune,name:'Synthetic commune',departmentId:ids.department});
 tables.arrondissements.push({id:ids.arrondissement,name:'Synthetic arrondissement',communeId:ids.commune,number:1});
 tables.neighborhoods.push({id:ids.neighborhood,name:"Synthetic d'Été; SELECT 1; --",communeId:null,arrondissementId:ids.arrondissement,urbanCommunityId:null});
 const manifest:ExportManifest={contractVersion:'1.0',generatorVersion:'1.1.0',adapterVersion:'1.0.0',datasetVersion:'synthetic-domain-pg-1',contentId:'a'.repeat(64),request:{format:'json'},sources:[],count:5,counts:{country:1,subdivision:3,locality:1},contextIds:[],externalReferences:[],geometry:{coordinates:{requested:false,missing:0},boundaries:{requested:false,missing:0},crs:'OGC:CRS84'},scope:{kind:'full',complete:true},files:[]};
 await client.connect();
 try{
  await writeDomainSql(tables,directory,{sqlNames:{schema:exportSchema,tables:{communes:'cities',neighborhoods:'quarters'}}});
  await client.query(await readFile(join(directory,'schema.sql'),'utf8'));
  await client.query(await readFile(join(directory,'data.sql'),'utf8'));
  const quarters=identifier(exportSchema)+'.quarters';
  assert.deepEqual((await client.query(`SELECT name,arrondissement_id,pg_typeof(id)::text AS id_type FROM ${quarters} WHERE id=$1`,[ids.neighborhood])).rows,[{name:tables.neighborhoods[0]!.name,arrondissement_id:ids.arrondissement,id_type:'uuid'}]);
  const before=(await client.query(`SELECT id,xmin::text revision FROM ${quarters}`)).rows;
  await client.query(await readFile(join(directory,'data.sql'),'utf8'));
  assert.deepEqual((await client.query(`SELECT id,xmin::text revision FROM ${quarters}`)).rows,before);
  const input={manifest,tables};const options={sqlNames:{schema:seedSchema,tables:{communes:'cities',neighborhoods:'quarters'}}};
  const preview=await seedResources(client,input,{...options,createSchema:true});assert.equal(preview.inserted,5);assert.equal(preview.dryRun,true);
  assert.equal((await client.query('SELECT count(*)::int n FROM information_schema.schemata WHERE schema_name=$1',[seedSchema])).rows[0]?.n,0);
  assert.equal((await seedResources(client,input,{...options,createSchema:true,dryRun:false})).inserted,5);
  const repeated=await seedResources(client,input,{...options,dryRun:false});assert.equal(repeated.updated,0);assert.equal(repeated.unchanged,5);
  tables.neighborhoods[0]!.name='Changed synthetic neighborhood';
  assert.equal((await seedResources(client,input,{...options,dryRun:false})).updated,1);
  assert.equal((await client.query(`SELECT name FROM ${identifier(seedSchema)}.quarters WHERE id=$1`,[ids.neighborhood])).rows[0]?.name,'Changed synthetic neighborhood');
  await client.query(`CREATE SCHEMA ${identifier(rollbackSchema)}; CREATE TABLE ${identifier(rollbackSchema)}.neighborhoods (id UUID PRIMARY KEY,name TEXT NOT NULL,commune_id UUID,arrondissement_id UUID,urban_community_id UUID,coordinates JSONB,boundary JSONB,business_required TEXT NOT NULL)`);
  await assert.rejects(seedResources(client,input,{sqlNames:{schema:rollbackSchema},createSchema:true,dryRun:false}),/business_required|not-null/);
  assert.equal((await client.query('SELECT count(*)::int n FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2',[rollbackSchema,'countries'])).rows[0]?.n,0);
  assert.equal((await client.query(`SELECT count(*)::int n FROM ${identifier(rollbackSchema)}.neighborhoods`)).rows[0]?.n,0);
 }finally{
  try{
   await client.query('ROLLBACK');
   for(const schema of [exportSchema,seedSchema,rollbackSchema])await client.query(`DROP SCHEMA IF EXISTS ${identifier(schema)} CASCADE`);
  }finally{await client.end();await rm(directory,{recursive:true,force:true});}
 }
});
