import type {Entity,ExportRequest,SnapshotMetadata} from '../types.ts';
import {createHash} from 'node:crypto';
import {validateEntity,canonicalJson} from '../validation.ts';
export const RESOURCE_NAMES=['countries','departments','communes','districts','arrondissements','urbanCommunities','ruralCommunities','neighborhoods','villages'] as const;
export type ResourceName=typeof RESOURCE_NAMES[number];
export interface ResourceRow {id:string;name:string;[key:string]:unknown}
export type ResourceTables=Record<ResourceName,ResourceRow[]>;
interface Definition {table:string;fields:string[];references:Partial<Record<string,ResourceName>>;parentFields:string[]}
export const definitions:Record<ResourceName,Definition>={
 countries:{table:'countries',fields:['id','name','iso2','iso3'],references:{},parentFields:[]},
 departments:{table:'departments',fields:['id','name','countryId'],references:{countryId:'countries'},parentFields:['countryId']},
 communes:{table:'communes',fields:['id','name','departmentId'],references:{departmentId:'departments'},parentFields:['departmentId']},
 districts:{table:'districts',fields:['id','name','departmentId'],references:{departmentId:'departments'},parentFields:['departmentId']},
 arrondissements:{table:'arrondissements',fields:['id','name','communeId','number'],references:{communeId:'communes'},parentFields:['communeId']},
 urbanCommunities:{table:'urban_communities',fields:['id','name','districtId'],references:{districtId:'districts'},parentFields:['districtId']},
 ruralCommunities:{table:'rural_communities',fields:['id','name','districtId'],references:{districtId:'districts'},parentFields:['districtId']},
 neighborhoods:{table:'neighborhoods',fields:['id','name','communeId','arrondissementId','urbanCommunityId'],references:{communeId:'communes',arrondissementId:'arrondissements',urbanCommunityId:'urbanCommunities'},parentFields:['communeId','arrondissementId','urbanCommunityId']},
 villages:{table:'villages',fields:['id','name','districtId','ruralCommunityId','urbanCommunityId'],references:{districtId:'districts',ruralCommunityId:'ruralCommunities',urbanCommunityId:'urbanCommunities'},parentFields:['districtId','ruralCommunityId','urbanCommunityId']}
};
export const kindResources:Record<string,ResourceName>={country:'countries',department:'departments',commune:'communes',district:'districts',arrondissement:'arrondissements','urban-community':'urbanCommunities','rural-community':'ruralCommunities',neighborhood:'neighborhoods',village:'villages'};
export const UUID_PATTERN=/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;
export const emptyResourceTables=():ResourceTables=>({countries:[],departments:[],communes:[],districts:[],arrondissements:[],urbanCommunities:[],ruralCommunities:[],neighborhoods:[],villages:[]});
export function toResourceTables(entities:Iterable<Entity>):ResourceTables {
 const list=[...entities],byId=new Map(list.map(e=>[e.id,e])),tables=emptyResourceTables();
 for(const entity of list){
  validateEntity(entity);
  if(!UUID_PATTERN.test(entity.id))throw new Error('Domain resources require stable UUID identifiers');
  const resource=kindResources[entity.kind??''];if(!resource)throw new Error(`A verified geographic kind is required: ${entity.id}`);
  const definition=definitions[resource];const row:ResourceRow={id:entity.id,name:entity.name};
  if(resource==='countries'){row.iso2=entity.codes?.iso2??null;row.iso3=entity.codes?.iso3??null;}
  else {
   const parent=byId.get(entity.parentId!);const parentResource=parent&&kindResources[parent.kind??''];
   const field=definition.parentFields.find(key=>definition.references[key]===parentResource);
   if(!parent||!field||parent.countryId!==entity.countryId)throw new Error(`Invalid or missing domain parent for ${entity.id}`);
   for(const key of definition.parentFields)row[key]=key===field?entity.parentId:null;
  }
  if(resource==='arrondissements'){const number=entity.codes?.municipalNumber;row.number=number===undefined?null:Number(number);}
  for(const field of ['coordinates','boundary'] as const)if(Object.hasOwn(entity,field))row[field]=entity[field];
  tables[resource].push(row);
 }
 validateResourceTables(tables);return tables;
}
/** Validate the public contract independently of its serialization. */
export function validateResourceTables(input:unknown):asserts input is ResourceTables {
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid resource tables');
 const tables=input as ResourceTables;for(const key of Object.keys(tables))if(!RESOURCE_NAMES.includes(key as ResourceName))throw new Error('Unknown resource category');
 const index=new Map<string,{resource:ResourceName;row:ResourceRow}>();
 for(const resource of RESOURCE_NAMES){
  if(!Array.isArray(tables[resource]))throw new Error(`Missing resource array: ${resource}`);
  const definition=definitions[resource];
  for(const row of tables[resource]){
   if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!UUID_PATTERN.test(row.id)||typeof row.name!=='string'||!row.name.trim()||row.name.includes('\0')||index.has(row.id))throw new Error('Invalid resource UUID/name or duplicate identity');
   for(const key of Object.keys(row))if(![...definition.fields,'coordinates','boundary'].includes(key))throw new Error(`Unknown ${resource} field: ${key}`);
   for(const key of definition.fields)if(!Object.hasOwn(row,key))throw new Error(`Missing ${resource} field: ${key}`);
   if(resource==='countries'&&(typeof row.iso2!=='string'||!/^[A-Z]{2}$/.test(row.iso2)||typeof row.iso3!=='string'||!/^[A-Z]{3}$/.test(row.iso3)))throw new Error('Invalid country ISO codes');
   if(resource==='arrondissements'&&row.number!==null&&(!Number.isSafeInteger(row.number)||(row.number as number)<1))throw new Error('Invalid arrondissement number');
   if(definition.parentFields.length&&definition.parentFields.filter(key=>row[key]!==null).length!==1)throw new Error('Exactly one domain parent is required');
   index.set(row.id,{resource,row});
  }
 }
 for(const {resource,row} of index.values())for(const key of definitions[resource].parentFields){if(row[key]===null)continue;const parent=index.get(row[key] as string);if(!parent||parent.resource!==definitions[resource].references[key])throw new Error('Invalid or missing resource parent');}
 // Geometry uses the same validated longitude/latitude and polygon contract as snapshots.
 for(const {resource,row} of index.values()){
  let current={resource,row};const seen=new Set<string>();
  while(current.resource!=='countries'){if(seen.has(current.row.id))throw new Error('Cyclic resource hierarchy');seen.add(current.row.id);const key=definitions[current.resource].parentFields.find(key=>current.row[key]!==null)!;current=index.get(current.row[key] as string)!;}
  const kind=Object.keys(kindResources).find(key=>kindResources[key]===resource)!;
  const entity:Entity={id:row.id,name:row.name,entityType:resource==='countries'?'country':['neighborhoods','villages'].includes(resource)?'locality':'subdivision',countryId:current.row.id,parentId:resource==='countries'?null:row[definitions[resource].parentFields.find(key=>row[key]!==null)!] as string,kind:kind as Entity['kind']&{}};
  for(const field of ['coordinates','boundary'] as const)if(Object.hasOwn(row,field))(entity as unknown as Record<string,unknown>)[field]=row[field];validateEntity(entity);
 }
}
export function createResourceIdentity(metadata:SnapshotMetadata,request:ExportRequest,tables:ResourceTables):string {
 const ordered=Object.fromEntries(RESOURCE_NAMES.map(name=>[name,[...tables[name]].sort((a,b)=>a.id.localeCompare(b.id,'en'))]));
 return createHash('sha256').update(canonicalJson({metadata,request,tables:ordered})).digest('hex');
}
