import {RESOURCE_NAMES} from './model.ts';
import type {ResourceTables,ResourceName,ResourceRow} from './model.ts';
import {column,identifier,fieldsFor,geometryFields,insertStatement,resolveSqlNames,schemaStatements,tableSql,validateSqlTables} from './sql.ts';
import type {SqlNames,ResolvedSqlNames} from './sql.ts';
import type {ExportManifest} from '../types.ts';
import type {QueryClient} from '../seeding/types.ts';
import {canonicalJson} from '../validation.ts';
export interface ResourceSeedOptions {dryRun?:boolean;createSchema?:boolean;mode?:'upsert'|'insert-only';sqlNames?:SqlNames;signal?:AbortSignal}
export interface ResourceSeedReport {dryRun:boolean;inserted:number;updated:number;unchanged:number;skipped:number;datasetVersion:string;tables:Record<ResourceName,number>}
const changed=(before:Record<string,unknown>,row:ResourceRow)=>Object.entries(row).some(([field,value])=>canonicalJson(before[column(field)]??null)!==canonicalJson(value));
async function existingRows(client:QueryClient,names:ResolvedSqlNames,name:ResourceName,rows:ResourceRow[],createSchema:boolean):Promise<Map<string,Record<string,unknown>>>{
 const exists=(await client.query('SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema=$1 AND table_name=$2) AS present',[names.schema,names.tables[name]])).rows[0]?.present===true;
 if(!exists){if(!createSchema)throw new Error(`Missing business table ${names.tables[name]}; create a compatible schema or use createSchema`);return new Map();}
 if(!rows.length)return new Map();
 const fields=[...fieldsFor(name),...geometryFields];const values=await client.query(`SELECT ${fields.map(field=>identifier(column(field))).join(',')} FROM ${tableSql(names,name)} WHERE "id" = ANY($1::uuid[])`,[rows.map(row=>row.id)]);
 return new Map(values.rows.map(row=>[String(row.id),row]));
}
/** All business-table writes commit together. Preview never creates objects or rows. */
export async function seedResources(client:QueryClient,input:{manifest:ExportManifest;tables:ResourceTables},options:ResourceSeedOptions={}):Promise<ResourceSeedReport> {
 const allowed=new Set(['dryRun','createSchema','mode','sqlNames','signal']);for(const key of Object.keys(options))if(!allowed.has(key))throw new Error('Unsupported business seeder option: '+key);
 if(options.mode!==undefined&&!['upsert','insert-only'].includes(options.mode))throw new Error('Invalid business seeder mode');
 for(const key of ['dryRun','createSchema'] as const)if(options[key]!==undefined&&typeof options[key]!=='boolean')throw new Error('Invalid business seeder boolean: '+key);
 options.signal?.throwIfAborted();validateSqlTables(input.tables);const names=resolveSqlNames(options.sqlNames),dryRun=options.dryRun??true;
 if(!input.manifest?.datasetVersion||!/^[0-9a-f]{64}$/.test(input.manifest.contentId))throw new Error('Verified resource package metadata is required');
 const report:ResourceSeedReport={dryRun,inserted:0,updated:0,unchanged:0,skipped:0,datasetVersion:input.manifest.datasetVersion,tables:Object.fromEntries(RESOURCE_NAMES.map(name=>[name,input.tables[name].length])) as Record<ResourceName,number>};
 const lockKey=canonicalJson(names);let locked=false,transaction=false;
 try{
  if(!dryRun){
   const acquired=(await client.query('SELECT pg_try_advisory_lock(hashtext($1)) AS acquired',['georeference-business:'+lockKey])).rows[0]?.acquired;
   if(acquired!==true)throw new Error('Another business import holds the target lock; use a dedicated connection');locked=true;
   await client.query('BEGIN');transaction=true;
  }
  const existing=new Map<ResourceName,Map<string,Record<string,unknown>>>();
  for(const name of RESOURCE_NAMES){options.signal?.throwIfAborted();existing.set(name,await existingRows(client,names,name,input.tables[name],options.createSchema??false));}
  if(!dryRun&&options.createSchema)for(const statement of schemaStatements(names))await client.query(statement);
  for(const name of RESOURCE_NAMES)for(const row of input.tables[name]){
   options.signal?.throwIfAborted();const before=existing.get(name)!.get(row.id);
   if(!before)report.inserted++;else if(!changed(before,row))report.unchanged++;else if(options.mode==='insert-only')report.skipped++;else report.updated++;
   if(!dryRun){const statement=insertStatement(names,name,row,options.mode,true);await client.query(statement.sql,statement.values);}
  }
  if(!dryRun){await client.query('COMMIT');transaction=false;}return report;
 }catch(error){if(transaction)await client.query('ROLLBACK');throw error;}
 finally{if(locked)await client.query('SELECT pg_advisory_unlock(hashtext($1))',['georeference-business:'+lockKey]);}
}
