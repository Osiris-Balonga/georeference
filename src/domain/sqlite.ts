import {DatabaseSync} from 'node:sqlite';
import {access,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {RESOURCE_NAMES} from './model.ts';
import type {ResourceTables} from './model.ts';
import {column,identifier,resolveSqlNames,rowFields,schemaStatements,tableSql,validateSqlTables,geometryFields} from './sql.ts';
import type {SqlNames} from './sql.ts';
export async function writeDomainSqlite(tables:ResourceTables,directory:string,request:{sqlNames?:SqlNames}={},signal?:AbortSignal):Promise<string[]> {
 signal?.throwIfAborted();validateSqlTables(tables);const names=resolveSqlNames(request.sqlNames);
 if(names.schema!=='public')throw new Error('SQLite does not support a custom SQL schema');
 const path=join(directory,'congo.sqlite');try{await access(path);throw new Error('SQLite export already exists');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const db=new DatabaseSync(path);let success=false;
 try{
  db.exec('PRAGMA foreign_keys=ON; BEGIN;');for(const statement of schemaStatements(names,true))db.exec(statement);
  for(const name of RESOURCE_NAMES)for(const row of [...tables[name]].sort((a,b)=>a.id.localeCompare(b.id))){
   signal?.throwIfAborted();const fields=rowFields(name,row);
   const values=fields.map(field=>geometryFields.includes(field as never)&&row[field]!==null?JSON.stringify(row[field]):row[field] as string|number|null);
   db.prepare(`INSERT INTO ${tableSql(names,name,true)} (${fields.map(field=>identifier(column(field))).join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...values);
  }
  if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('SQLite parent verification failed');db.exec('COMMIT;');success=true;
 }finally{db.close();if(!success)await unlink(path);}
 return ['congo.sqlite'];
}
