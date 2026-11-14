import assert from 'node:assert/strict';import {test} from 'node:test';
import {toResourceTables,validateResourceTables} from '../src/domain/model.ts';
import type {Entity} from '../src/types.ts';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const records:Entity[]=[
 {id:id(1),entityType:'country',kind:'country',name:'Synthetic country',countryId:id(1),parentId:null,codes:{iso2:'CG',iso3:'COG'}},
 {id:id(2),entityType:'subdivision',kind:'department',name:'Synthetic department',countryId:id(1),parentId:id(1)},
 {id:id(3),entityType:'subdivision',kind:'commune',name:'Synthetic commune',countryId:id(1),parentId:id(2)},
 {id:id(4),entityType:'subdivision',kind:'arrondissement',name:'Synthetic arrondissement',countryId:id(1),parentId:id(3),codes:{municipalNumber:'6'}},
 {id:id(5),entityType:'locality',kind:'neighborhood',name:'Synthetic quarter',countryId:id(1),parentId:id(4)},
 {id:id(6),entityType:'locality',kind:'neighborhood',name:'Direct quarter',countryId:id(1),parentId:id(3)},
];
export {records,id};
test('domain resources have UUID keys and named foreign keys without generic entity fields',()=>{
 const tables=toResourceTables(records);assert.equal(tables.countries.length,1);assert.equal(tables.neighborhoods.length,2);
 assert.deepEqual(tables.neighborhoods[0],{id:id(5),name:'Synthetic quarter',communeId:null,arrondissementId:id(4),urbanCommunityId:null,ruralCommunityId:null});
 assert.equal(tables.neighborhoods[1]?.communeId,id(3));assert.equal(tables.arrondissements[0]?.number,6);
 const invalid=structuredClone(tables);invalid.neighborhoods[0]!.communeId=undefined;
 assert.throws(()=>validateResourceTables(invalid),/explicit|parent|reference/i);
 for(const rows of Object.values(tables))for(const row of rows)for(const key of ['kind','parentId','countryId','entityType','codes'])if(key!=='countryId'||!tables.departments.includes(row))assert.ok(!(key in row));
 assert.throws(()=>toResourceTables(records.map(e=>e.id===id(5)?{...e,parentId:id(1)}:e)),/parent/);
 assert.throws(()=>toResourceTables(records.map(e=>e.id===id(5)?{...e,id:'bad'}:e)),/UUID/);
});
