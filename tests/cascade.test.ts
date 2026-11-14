import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mergeCascade} from '../scripts/lib/cascade.mjs';
import {readFile} from 'node:fs/promises';
import {validateCongoReference} from '../src/congo.ts';
import {toResourceTables} from '../src/domain/model.ts';
const country='00000000-0000-4000-8000-000000000001';
const dept='00000000-0000-4000-8000-000000000002';
const city='00000000-0000-4000-8000-000000000003';
const quarter='00000000-0000-4000-8000-000000000004';
function fixture(extra=[]){
 const entries=[{id:country,kind:'country',entityType:'country',countryId:country,parentId:null,name:'Synthetic Congo',codes:{iso2:'CG',iso3:'COG'}},{id:dept,kind:'department',entityType:'subdivision',countryId:country,parentId:country,name:'Synthetic department'},{id:city,kind:'commune',entityType:'subdivision',countryId:country,parentId:dept,name:'Synthetic city'},{id:quarter,kind:'neighborhood',entityType:'locality',countryId:country,parentId:city,name:'Old quarter',codes:{sourceQuarterCode:'101'}}].map(entity=>({entity,evidence:[],issues:[]}));
 return {catalog:{schemaVersion:'1.0',datasetVersion:'old',countryId:country,sources:[],entries,coverage:{status:'partial',completeGeographicInventory:false}},registry:{version:1,ids:{country,dept,city,quarter}},source:{id:'synthetic-cascade',receivedAt:'2026-11-14',sha256:'a'.repeat(64),rows:[{row:2,code:'01',label:'Synthetic department'},{row:3,code:'0101',label:'Synthetic city (Commune)'},{row:4,code:'010101',label:'Synthetic city (Arrondissement)'},{row:5,code:'010101101',label:'CQ101 : New quarter'},...extra]}};
}
test('cascade updates a source-coded place without changing its UUID or inventing a city arrondissement',()=>{
 const f=fixture(),result=mergeCascade(f.catalog,f.registry,f.source);
 assert.equal(result.catalog.entries.find(e=>e.entity.id===quarter).entity.name,'New quarter');
 assert.equal(result.catalog.entries.filter(e=>e.entity.kind==='arrondissement').length,0);
 assert.equal(result.catalog.entries.find(e=>e.entity.id===quarter).entity.parentId,city);
 assert.equal(f.catalog.entries[3].entity.name,'Old quarter','caller input is preserved');
 const proof=result.catalog.entries.find(e=>e.entity.id===quarter).evidence[0];
 assert.equal(proof.observedAt,null);assert.equal(proof.receivedAt,'2026-11-14');
});
test('conflicting source codes preserve both villages while identical duplicate rows share one UUID',()=>{
 const f=fixture([{row:6,code:'0121',label:'Synthetic district'},{row:7,code:'012121',label:'Synthetic district (CR)'},{row:8,code:'012121001',label:'Village : Alpha'},{row:9,code:'012121001',label:'Village : Beta'},{row:10,code:'012121001',label:'Village : Beta'}]);
 const a=mergeCascade(f.catalog,f.registry,f.source),villages=a.catalog.entries.filter(e=>e.entity.kind==='village');
 assert.deepEqual(villages.map(e=>e.entity.name),['Alpha','Beta']);
 assert.notEqual(villages[0].entity.id,villages[1].entity.id);
 assert.equal(a.audit.rows.filter(r=>r.status==='duplicate').length,1);
 const b=mergeCascade(a.catalog,a.registry,f.source);
 assert.deepEqual(b,a,'replaying the same source must preserve bytes, evidence and identities');
 const rebuilt=mergeCascade(f.catalog,a.registry,f.source);
 assert.deepEqual(rebuilt.catalog,a.catalog,'persisted identities also reproduce a build from the original baseline');
});
test('unresolved parents, unnamed quarters and untyped centers remain accounted for outside public entities',()=>{
 const f=fixture([{row:6,code:'999921001',label:'Village : Lost'},{row:7,code:'010101306',label:'CQ306 : CQ306'},{row:8,code:'010101307',label:'Some centre'}]);
 const r=mergeCascade(f.catalog,f.registry,f.source);
 assert.deepEqual(r.audit.rows.filter(x=>x.status==='unresolved').map(x=>x.reason).sort(),['missing-parent','missing-place-name','unclassified-label']);
 assert.equal(r.audit.rows.length,f.source.rows.length,'every original input row must have a disposition');
 assert.ok(!r.catalog.entries.some(e=>['Lost','CQ306','Some centre'].includes(e.entity.name)));
});
test('an existing direct neighborhood can match a numbered source observation on rename',()=>{
 const f=fixture();f.catalog.entries[3].entity.codes={sourceQuarterCode:'1'};
 const r=mergeCascade(f.catalog,f.registry,f.source);
 assert.equal(r.catalog.entries.find(e=>e.entity.id===quarter).entity.name,'New quarter');
 assert.equal(r.catalog.entries.filter(e=>e.entity.kind==='neighborhood').length,1);
});
test('receipt of administrative data is distinguished from an unknown observation date',async()=>{
 const raw=JSON.parse(await readFile('reference/congo.json','utf8'));
 const proof=raw.entries[0].evidence[0];proof.observedAt=null;proof.receivedAt='2026-11-14';
 assert.doesNotThrow(()=>validateCongoReference(raw));
 delete proof.receivedAt;assert.throws(()=>validateCongoReference(raw),/evidence/);
});
test('administrative rural-community quarters retain their real parent in public resources',()=>{
 const f=fixture([{row:6,code:'0121',label:'Synthetic district'},{row:7,code:'012121',label:'Synthetic district (CR)'},{row:8,code:'012121001',label:'CQ01 : Rural quarter'}]);
 const r=mergeCascade(f.catalog,f.registry,f.source);
 const tables=toResourceTables(r.catalog.entries.map(e=>e.entity));
 const q=tables.neighborhoods.find(e=>e.name==='Rural quarter');
 assert.equal(q.ruralCommunityId,tables.ruralCommunities[0].id);
 assert.equal(q.communeId,null);assert.equal(q.arrondissementId,null);
});
test('the supplied cascade accounts for every row and preserves all legacy UUIDs',async()=>{
 const ref=JSON.parse(await readFile('reference/congo.json','utf8'));
 const ids=JSON.parse(await readFile('reference/identities.json','utf8'));
 const audit=JSON.parse(await readFile('reference/cascade-audit.json','utf8'));
 assert.equal(audit.rows.length,4385);assert.equal(new Set(audit.rows.map(r=>r.row)).size,4385);
 const current=new Set(ref.entries.map(e=>e.entity.id));
 const legacy=Object.entries(ids.ids).filter(([key])=>!key.startsWith('cg:cascade:'));
 assert.equal(legacy.length,398);assert.ok(legacy.every(([,id])=>current.has(id)));
 assert.equal(audit.rows.filter(r=>r.status==='unresolved').length,37);
 assert.equal(audit.codeConflicts.length,35);
 assert.equal(ref.entries.filter(e=>e.entity.kind==='village').length,3285);
});
test('a unique source code preserves a newly allocated UUID across later source-name corrections',()=>{
 const f=fixture([{row:6,code:'0121',label:'Synthetic district'},{row:7,code:'012121',label:'Synthetic district (CR)'},{row:8,code:'012121001',label:'Village : Alpha'}]);
 const a=mergeCascade(f.catalog,f.registry,f.source);
 const original=a.catalog.entries.find(e=>e.entity.name==='Alpha').entity.id;
 const next=structuredClone(f.source);next.sha256='b'.repeat(64);next.rows[6].label='Village : Renamed';
 const b=mergeCascade(a.catalog,a.registry,next);
 assert.equal(b.catalog.entries.find(e=>e.entity.name==='Renamed').entity.id,original);
});
