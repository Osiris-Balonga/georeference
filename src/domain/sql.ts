import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {RESOURCE_NAMES,definitions,validateResourceTables} from './model.ts';
import type {ResourceName,ResourceRow,ResourceTables} from './model.ts';

export interface SqlNames {schema?:string;tables?:Partial<Record<ResourceName,string>>}
export interface DomainSqlRequest {schemaMode?:'schema-and-data'|'data-only';sqlMode?:'upsert'|'insert-only';sqlNames?:SqlNames}
export interface ResolvedSqlNames {schema:string;tables:Record<ResourceName,string>}
export const geometryFields=['coordinates','boundary'] as const;
const object=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function identifier(value:string):string {
 if(typeof value!=='string'||!/^[_a-zA-Z][_a-zA-Z0-9]{0,62}$/.test(value))throw new Error('SQL identifier must contain 1–63 ASCII letters, digits or underscores, starting with a letter or underscore');
 return '"'+value+'"';
}
export const column=(field:string)=>field.replace(/[A-Z]/g,letter=>'_'+letter.toLowerCase());
export function resolveSqlNames(value:SqlNames={}):ResolvedSqlNames {
 if(!object(value)||Object.keys(value).some(key=>!['schema','tables'].includes(key)))throw new Error('Unknown SQL configuration field');
 const config=value as SqlNames;
 if(config.schema!==undefined&&typeof config.schema!=='string')throw new Error('Invalid SQL schema identifier');
 const schema=config.schema??'public';identifier(schema);
 if(config.tables!==undefined&&!object(config.tables))throw new Error('Invalid SQL table configuration');
 for(const [key,table] of Object.entries(config.tables??{})){if(!RESOURCE_NAMES.includes(key as ResourceName))throw new Error('Unknown SQL table resource: '+key);identifier(table);}
 const tables={} as Record<ResourceName,string>,seen=new Set<string>();
 for(const name of RESOURCE_NAMES){const table=config.tables?.[name]??definitions[name].table;identifier(table);const key=table.toLowerCase();if(seen.has(key))throw new Error('Duplicate SQL table name: '+table);seen.add(key);tables[name]=table;}
 return {schema,tables};
}
export function tableSql(names:ResolvedSqlNames,name:ResourceName,sqlite=false):string {return (sqlite?'':identifier(names.schema)+'.')+identifier(names.tables[name]);}
export function fieldsFor(name:ResourceName):string[]{return [...new Set(['id','name',...definitions[name].fields])];}
export const validateSqlTables:typeof validateResourceTables=validateResourceTables;
export function schemaStatements(names:ResolvedSqlNames,sqlite=false):string[] {
 const result=sqlite?[]:[`CREATE SCHEMA IF NOT EXISTS ${identifier(names.schema)};`];
 for(const name of RESOURCE_NAMES){
  const definition=definitions[name];
  const columns=fieldsFor(name).map(field=>{
   const q=identifier(column(field));
   if(field==='id')return `${q} ${sqlite?'TEXT':'UUID'} PRIMARY KEY${sqlite?' NOT NULL':''}`;
   const target=definition.references[field];
   if(target)return `${q} ${sqlite?'TEXT':'UUID'}${definition.parentFields.length===1?' NOT NULL':''} REFERENCES ${tableSql(names,target,sqlite)}("id") DEFERRABLE INITIALLY DEFERRED`;
   if(field==='number')return `${q} INTEGER CHECK (${q} IS NULL OR ${q}>0)`;
   return `${q} TEXT${field==='name'?' NOT NULL':''}`;
  });
  for(const field of geometryFields)columns.push(`${identifier(field)} ${sqlite?'TEXT':'JSONB'}`);
  if(definition.parentFields.length>1){const expression=definition.parentFields.map(field=>`CASE WHEN ${identifier(column(field))} IS NOT NULL THEN 1 ELSE 0 END`).join(' + ');columns.push(`CHECK ((${expression}) = 1)`);}
  result.push(`CREATE TABLE IF NOT EXISTS ${tableSql(names,name,sqlite)} (\n  ${columns.join(',\n  ')}\n);`);
  // Table names may be long; a deterministic short index avoids PostgreSQL truncation collisions.
  for(const field of Object.keys(definition.references)){const hash=createHash('sha256').update(names.tables[name]+':'+field).digest('hex').slice(0,16);result.push(`CREATE INDEX IF NOT EXISTS ${identifier('parent_'+hash+'_idx')} ON ${tableSql(names,name,sqlite)} (${identifier(column(field))});`);}
 }
 return result;
}
export function rowFields(name:ResourceName,row:ResourceRow):string[]{return [...fieldsFor(name),...geometryFields].filter(field=>Object.hasOwn(row,field));}
export function insertStatement(names:ResolvedSqlNames,name:ResourceName,row:ResourceRow,mode:'upsert'|'insert-only'='upsert',parameterized=false):{sql:string;values:unknown[]} {
 const fields=rowFields(name,row),mutable=fields.filter(field=>field!=='id'),target=tableSql(names,name);
 const values=fields.map(field=>geometryFields.includes(field as never)&&row[field]!==null?JSON.stringify(row[field]):row[field]);
 const encoded=values.map((value,index)=>parameterized?'$'+(index+1):literal(value,geometryFields.includes(fields[index] as never)));
 const changed=mutable.map(field=>`${identifier(names.tables[name])}.${identifier(column(field))} IS DISTINCT FROM EXCLUDED.${identifier(column(field))}`).join(' OR ');
 const conflict=mode==='insert-only'?'DO NOTHING':`DO UPDATE SET ${mutable.map(field=>`${identifier(column(field))}=EXCLUDED.${identifier(column(field))}`).join(', ')} WHERE ${changed}`;
 return {sql:`INSERT INTO ${target} (${fields.map(field=>identifier(column(field))).join(', ')}) VALUES (${encoded.join(', ')}) ON CONFLICT ("id") ${conflict}`,values};
}
function literal(value:unknown,json=false):string {
 if(value===null)return 'NULL';if(typeof value==='number'&&Number.isFinite(value))return String(value);
 if(typeof value!=='string'||value.includes('\0'))throw new Error('Invalid SQL data value');return "'"+value.replaceAll("'","''")+"'"+(json?'::jsonb':'');
}
export async function writeDomainSql(tables:ResourceTables,directory:string,request:DomainSqlRequest={},signal?:AbortSignal):Promise<string[]> {
 signal?.throwIfAborted();validateSqlTables(tables);const names=resolveSqlNames(request.sqlNames);
 if(request.schemaMode!==undefined&&!['schema-and-data','data-only'].includes(request.schemaMode)||request.sqlMode!==undefined&&!['upsert','insert-only'].includes(request.sqlMode))throw new Error('Invalid SQL export mode');
 const paths:string[]=[];
 if(request.schemaMode!=='data-only'){await writeFile(join(directory,'schema.sql'),'-- PostgreSQL domain schema. Existing tables must already be compatible.\nBEGIN;\n'+schemaStatements(names).join('\n')+'\nCOMMIT;\n',{flag:'wx',signal});paths.push('schema.sql');}
 const statements=['-- PostgreSQL domain data. Run schema.sql first when creating tables.','BEGIN;','SET LOCAL standard_conforming_strings = on;'];
 for(const name of RESOURCE_NAMES)for(const row of [...tables[name]].sort((a,b)=>a.id.localeCompare(b.id))){signal?.throwIfAborted();statements.push(insertStatement(names,name,row,request.sqlMode).sql+';');}
 statements.push('COMMIT;');await writeFile(join(directory,'data.sql'),statements.join('\n')+'\n',{flag:'wx',signal});paths.push('data.sql');return paths;
}
