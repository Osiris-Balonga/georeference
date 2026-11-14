import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {PGlite} from '@electric-sql/pglite';
import {writeDomainSql} from '../src/domain/sql.ts';
import {writeDomainSqlite} from '../src/domain/sqlite.ts';
import {seedResources} from '../src/domain/seed.ts';
const ids={country:'10000000-0000-4000-8000-000000000001',department:'10000000-0000-4000-8000-000000000002',commune:'10000000-0000-4000-8000-000000000003',arrondissement:'10000000-0000-4000-8000-000000000004',quarter:'10000000-0000-4000-8000-000000000005',direct:'10000000-0000-4000-8000-000000000006'};
const fixture=()=>({countries:[{id:ids.country,name:'Synthetic Congo',iso2:'CG',iso3:'COG'}],departments:[{id:ids.department,name:'Synthetic department',countryId:ids.country}],communes:[{id:ids.commune,name:'Synthetic commune',departmentId:ids.department}],districts:[],arrondissements:[{id:ids.arrondissement,name:'Synthetic arrondissement',communeId:ids.commune,number:1}],urbanCommunities:[],ruralCommunities:[],neighborhoods:[{id:ids.quarter,name:"Synthetic d'Été; DROP TABLE communes; --",communeId:null,arrondissementId:ids.arrondissement,urbanCommunityId:null},{id:ids.direct,name:'Synthetic direct neighborhood',communeId:ids.commune,arrondissementId:null,urbanCommunityId:null}],villages:[]});
const manifest={datasetVersion:'synthetic-business-1',contentId:'a'.repeat(64)} as any;
async function folder(t:any){const dir=await mkdtemp(join(tmpdir(),'georeference-domain-sql-'));t.after(()=>rm(dir,{recursive:true,force:true}));return dir;}
test('business SQL creates configurable domain tables with UUID relationships and replays without updates',async t=>{
 const dir=await folder(t),tables=fixture(),db=new PGlite();t.after(()=>db.close());
 const files=await writeDomainSql(tables,dir,{sqlNames:{schema:'places',tables:{communes:'cities',neighborhoods:'quarters'}}});
 assert.deepEqual(files,['schema.sql','data.sql']);
 const schema=await readFile(join(dir,'schema.sql'),'utf8'),data=await readFile(join(dir,'data.sql'),'utf8');
 assert.ok(!schema.includes('georeference_entities'));assert.ok(!schema.includes('DROP TABLE'));assert.match(schema,/UUID/);
 await db.exec(schema);await db.exec(data);
 assert.deepEqual((await db.query('SELECT name,arrondissement_id,commune_id FROM places.quarters WHERE id=$1',[ids.quarter])).rows,[{name:tables.neighborhoods[0].name,arrondissement_id:ids.arrondissement,commune_id:null}]);
 const before=(await db.query('SELECT id,xmin::text revision FROM places.quarters ORDER BY id')).rows;await db.exec(data);
 assert.deepEqual((await db.query('SELECT id,xmin::text revision FROM places.quarters ORDER BY id')).rows,before);
 await assert.rejects(db.query('INSERT INTO places.quarters(id,name,commune_id,arrondissement_id) VALUES($1,$2,$3,$4)',['20000000-0000-4000-8000-000000000001','Invalid two parents',ids.commune,ids.arrondissement]),/constraint|check/);
});
test('data-only and insert-only preserve existing values and absent geometry',async t=>{
 const dir=await folder(t),tables=fixture(),db=new PGlite();t.after(()=>db.close());
 await writeDomainSql(tables,dir,{});await db.exec(await readFile(join(dir,'schema.sql'),'utf8'));await db.exec(await readFile(join(dir,'data.sql'),'utf8'));
 await db.query('UPDATE neighborhoods SET coordinates=$1 WHERE id=$2',[{latitude:1,longitude:2},ids.quarter]);
 const next=join(dir,'next');await import('node:fs/promises').then(fs=>fs.mkdir(next));tables.neighborhoods[0].name='Changed';
 assert.deepEqual(await writeDomainSql(tables,next,{schemaMode:'data-only',sqlMode:'insert-only'}),['data.sql']);await db.exec(await readFile(join(next,'data.sql'),'utf8'));
 assert.notEqual((await db.query('SELECT name FROM neighborhoods WHERE id=$1',[ids.quarter])).rows[0]?.name,'Changed');
 const update=join(dir,'update');await import('node:fs/promises').then(fs=>fs.mkdir(update));await writeDomainSql(tables,update,{schemaMode:'data-only'});await db.exec(await readFile(join(update,'data.sql'),'utf8'));
 assert.deepEqual((await db.query('SELECT coordinates FROM neighborhoods WHERE id=$1',[ids.quarter])).rows[0]?.coordinates,{latitude:1,longitude:2});
});
test('SQLite is queryable with domain names and enforceable actual parent constraints',async t=>{
 const dir=await folder(t);assert.deepEqual(await writeDomainSqlite(fixture(),dir,{sqlNames:{tables:{neighborhoods:'quarters'}}}),['congo.sqlite']);
 const db=new DatabaseSync(join(dir,'congo.sqlite'));try{
  db.exec('PRAGMA foreign_keys=ON');assert.equal(db.prepare('SELECT count(*) n FROM quarters').get()?.n,2);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.throws(()=>db.prepare('INSERT INTO quarters(id,name,commune_id) VALUES(?,?,?)').run('20000000-0000-4000-8000-000000000001','Orphan','30000000-0000-4000-8000-000000000001'),/FOREIGN KEY/);
 }finally{db.close();}
});
test('SQL configuration refuses injection, name collisions, unsupported names and cancellation before writing',async t=>{
 const dir=await folder(t);
 for(const sqlNames of [{schema:'public; DROP SCHEMA public'},{tables:{communes:'cities',districts:'cities'}},{tables:{neighborhoods:'quarters.bad'}},{tables:{invented:'foo'}},{schema:null},{tables:{communes:null}}])await assert.rejects(writeDomainSql(fixture(),dir,{sqlNames} as any),/identifier|duplicate|table|config/i);
 const c=new AbortController();c.abort();await assert.rejects(writeDomainSql(fixture(),dir,{},c.signal),{name:'AbortError'});assert.deepEqual(await readdir(dir),[]);
});
test('business seed failures roll back newly created tables and prior inserts together',async t=>{
 const db=new PGlite();t.after(()=>db.close());
 await db.exec('CREATE TABLE neighborhoods (id UUID PRIMARY KEY,name TEXT NOT NULL,commune_id UUID,arrondissement_id UUID,urban_community_id UUID,rural_community_id UUID,coordinates JSONB,boundary JSONB,business_required TEXT NOT NULL)');
 await assert.rejects(seedResources(db,{manifest,tables:fixture()},{createSchema:true,dryRun:false}),/business_required|not-null/);
 assert.equal((await db.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public' AND table_name='countries'")).rows[0]?.n,0);
 assert.equal((await db.query('SELECT count(*)::int n FROM neighborhoods')).rows[0]?.n,0);
 await assert.rejects(seedResources(db,{manifest,tables:fixture()},{batchSize:1} as any),/Unsupported/);
});
test('business seeder previews without writes, applies atomically and reports unchanged replay',async t=>{
 const db=new PGlite();t.after(()=>db.close());const input={manifest,tables:fixture()};
 const preview=await seedResources(db,input,{createSchema:true});assert.equal(preview.dryRun,true);assert.equal(preview.inserted,6);
 assert.equal((await db.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='public'")).rows[0]?.n,0);
 const first=await seedResources(db,input,{createSchema:true,dryRun:false});assert.equal(first.inserted,6);
 const before=(await db.query('SELECT id,xmin::text revision FROM neighborhoods ORDER BY id')).rows;
 const second=await seedResources(db,input,{dryRun:false});assert.equal(second.updated,0);assert.equal(second.unchanged,6);
 assert.deepEqual((await db.query('SELECT id,xmin::text revision FROM neighborhoods ORDER BY id')).rows,before);
});
