#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { Snapshot, createSnapshot } from './snapshot.ts';
import { verifyPackage } from './package.ts';
import { generateFiles } from './generate.ts';
import { assertCongoEntities,loadCongoReference } from './congo.ts';
import { toResourceTables } from './domain/model.ts';
import type { Entity, ExportRequest, SnapshotMetadata,GeographicKind } from './types.ts';

const HELP=`242Places — Republic of Congo geographic files in your project

Quick start (no permanent project dependency):
  npx 242places
  npx 242places neighborhoods --city Brazzaville --arrondissement 6
  npx 242places departments --format csv --output ./data/departments

Without a command, generate separate category JSON files in ./data/242places.
No download is required. Coverage is PARTIAL and dated: see README.txt.
Use --audit to include detailed coverage.json and provenance.json.
Output is a NEW directory; existing destinations are never overwritten.

Commands:
  countries [--source-file FILE | --snapshot FILE] [export options]
  departments | communes | cities | districts | arrondissements | neighborhoods | villages
  generate  [--source-file FILE | --snapshot FILE] [export options]
  snapshot --output SNAPSHOT.sqlite [--input FILE --metadata FILE]
  inspect  --snapshot FILE
  export   --snapshot FILE --output DIRECTORY --format FORMAT [options]
  verify   --package DIRECTORY
  seed     --package DIRECTORY [--apply] [--create-schema] [--sql-config FILE]

Formats: xlsx, json, ndjson, csv, sql-postgres, sqlite, geojson
Human files: --language fr|en --include-ids; CSV files and Excel sheets by category
SQL: --sql-config FILE (schema and table names); schema.sql and data.sql
Export: --country CG|COG --city NAME_OR_ID --arrondissement NAME_OR_ID
        (numeric arrondissement requires --city)
        --subdivision IDS --types country,subdivision,locality --kinds KINDS
        --coordinates --boundaries
        --compression none|gzip|zip --schema-mode schema-and-data|data-only
        --sql-mode upsert|insert-only
Seed:   --mode upsert|insert-only; DATABASE_URL in environment
Seeding is a read-only preview unless --apply is supplied.
See README.md / README.fr.md for data licensing and full guides.
`;
const stringOptions=['input','metadata','output','source-file','countries','admin1','admin2','places','version','snapshot','format','country','subdivision','types','kinds','city','arrondissement','layout','compression','schema-mode','sql-mode','package','mode','batch-size','revision','schema','table','mapping','language','sql-config'];
const booleanOptions=['help','coordinates','boundaries','no-ancestors','spreadsheet-safe','apply','create-schema','allow-downgrade','include-ids','audit'];
const supported:Record<string,string[]>={
  snapshot:['input','metadata','output'],inspect:['snapshot'],verify:['package'],
  export:['snapshot','output','format','country','subdivision','types','kinds','city','arrondissement','coordinates','boundaries','no-ancestors','layout','compression','schema-mode','sql-mode','spreadsheet-safe'],
  seed:['package','apply','create-schema','mode','sql-config']
};
supported.export!.push('language','include-ids','audit','sql-config');
supported.generate=[...supported.export!,'source-file'];
supported.countries=supported.generate.filter(key=>key!=='types'&&key!=='subdivision');
const kindCommands:Record<string,GeographicKind>={departments:'department',communes:'commune',cities:'commune',districts:'district',arrondissements:'arrondissement',neighborhoods:'neighborhood',villages:'village'};
for(const command of Object.keys(kindCommands))supported[command]=supported.generate.filter(key=>key!=='kinds'&&key!=='types');
async function* inputEntities(path:string,signal:AbortSignal):AsyncIterable<Entity> {
  if(path.endsWith('.json')) {
    const parsed=JSON.parse(await readFile(path,'utf8')) as unknown;
    const entities=Array.isArray(parsed)?parsed:(parsed as {entities?:unknown[]})?.entities;
    if(!Array.isArray(entities)) throw new Error('JSON input requires an entities array');
    for(const entity of entities) {signal.throwIfAborted();yield entity as Entity;}
  } else {
    const stream=createReadStream(path,{encoding:'utf8'});
    const lines=createInterface({input:stream,crlfDelay:Infinity});
    try {for await(const line of lines) {signal.throwIfAborted();if(line.trim()) yield JSON.parse(line) as Entity;}}
    finally {lines.close();stream.destroy();}
  }
}
async function main():Promise<void> {
  const args=process.argv.slice(2);
  if(args[0]==='--help'||args[0]==='help') {console.log(HELP);return;}
  const command=!args.length||args[0]!.startsWith('-')?'generate':args.shift()!;
  if(!supported[command]) throw new Error(`Unknown command: ${command}`);
  const options:Record<string,{type:'string'|'boolean'}>={};
  for(const key of stringOptions) options[key]={type:'string'};
  for(const key of booleanOptions) options[key]={type:'boolean'};
  const {values}=parseArgs({args,options,strict:true});
  if(values.help) {console.log(HELP);return;}
  for(const key of Object.keys(values)) if(!supported[command]!.includes(key)) throw new Error(`Option --${key} is not supported by ${command}`);
  const string=(key:string,required=false):string|undefined=>{
    const value=values[key];
    if(required&&(typeof value!=='string'||!value.trim())) throw new Error(`${command} requires --${key}`);
    return typeof value==='string'?value:undefined;
  };
  const list=(key:string)=>string(key)?.split(',').map(item=>item.trim()).filter(Boolean);
  const sqlNames=async()=>string('sql-config')?JSON.parse(await readFile(string('sql-config')!,'utf8')):undefined;
  const exportRequest=(format:string):ExportRequest=>{
    const request:ExportRequest={format};
    for(const [flag,key] of [['country','countries'],['subdivision','subdivisions'],['types','entityTypes'],['kinds','kinds']] as const) if(string(flag)!==undefined) (request as unknown as Record<string,unknown>)[key]=list(flag);
    for(const [flag,key] of [['layout','layout'],['compression','compression'],['schema-mode','schemaMode'],['sql-mode','sqlMode']] as const) if(string(flag)!==undefined) (request as unknown as Record<string,unknown>)[key]=string(flag);
    if(values.coordinates)request.coordinates=true;if(values.boundaries)request.boundaries=true;if(values['no-ancestors'])request.includeAncestors=false;if(values['spreadsheet-safe'])request.spreadsheetSafe=true;
    if(string('language'))request.language=string('language') as 'fr'|'en';if(values['include-ids'])request.includeIds=true;if(values.audit)request.audit=true;
    return request;
  };
  const controller=new AbortController();const abort=()=>controller.abort();process.once('SIGINT',abort);
  try {
    let result:unknown;
    if(command==='countries'||command==='generate'||kindCommands[command]) {
      const request=exportRequest(string('format')??'json');
      if(string('sql-config'))request.sqlNames=await sqlNames();
      if(command==='countries') request.entityTypes=['country'];
      if(kindCommands[command])request.kinds=[kindCommands[command]!];
      result=await generateFiles({output:string('output')??'data/242places',request,
        ...(string('city')?{city:string('city')!}:{}),...(string('arrondissement')?{arrondissement:string('arrondissement')!}:{}),
        ...(string('snapshot')?{snapshot:string('snapshot')!}:{}),...(string('source-file')?{sourceFile:string('source-file')!}:{}),signal:controller.signal});
    } else if(command==='snapshot') {
      let metadata:SnapshotMetadata,entities:Entity[];
      if(string('input')||string('metadata')) {
        metadata=JSON.parse(await readFile(string('metadata',true)!,'utf8')) as SnapshotMetadata;
        entities=[];for await(const entity of inputEntities(string('input',true)!,controller.signal))entities.push(entity);
      } else {const reference=await loadCongoReference();metadata=reference.metadata;entities=reference.entities;}
      assertCongoEntities(entities);
      toResourceTables(entities);
      const output=string('output',true)!;
      await createSnapshot(output,metadata,entities);
      const snapshot=Snapshot.open(output);try{result={path:output,count:snapshot.count,datasetVersion:snapshot.metadata.datasetVersion};}finally{snapshot.close();}
    } else if(command==='export'||command==='inspect') {
      const snapshot=Snapshot.open(string('snapshot',true)!);
      try {
        assertCongoEntities(snapshot.entities());
        toResourceTables(snapshot.entities());
        if(command==='inspect') {
          const counts={country:0,subdivision:0,locality:0};for(const entity of snapshot.entities())counts[entity.entityType]++;
          result={metadata:snapshot.metadata,count:snapshot.count,counts};
        } else {
          const request=exportRequest(string('format',true)!);
          if(string('sql-config'))request.sqlNames=await sqlNames();
          result=await generateFiles({snapshot:string('snapshot',true)!,output:string('output',true)!,request,
            ...(string('city')?{city:string('city')!}:{}),...(string('arrondissement')?{arrondissement:string('arrondissement')!}:{}),signal:controller.signal});
        }
      } finally{snapshot.close();}
    } else if(command==='verify') result=await verifyPackage(string('package',true)!);
    else if(command==='seed') {
      const packageDirectory=string('package',true)!;
      // Reject corrupted or unsupported packages before connecting to the database.
      const {readResourcePackage}=await import('./domain/package.ts');const input=await readResourcePackage(packageDirectory);
      const connectionString=process.env.DATABASE_URL;if(!connectionString) throw new Error('DATABASE_URL is required for seed');
      const {Client}=await import('pg');const {seedResources}=await import('./domain/seed.ts');
      const client=new Client({connectionString});
      try {
        await client.connect();
        const seedOptions:import('./domain/seed.ts').ResourceSeedOptions={dryRun:!values.apply,createSchema:Boolean(values['create-schema']),signal:controller.signal};
        if(string('sql-config'))seedOptions.sqlNames=await sqlNames();
        if(string('mode'))seedOptions.mode=string('mode') as 'upsert'|'insert-only';
        result=await seedResources(client,input,seedOptions);
      } finally {await client.end();}
    }
    console.log(JSON.stringify(result,null,2));
  } finally {process.removeListener('SIGINT',abort);}
}
main().catch((error:unknown)=>{console.error('Error: '+(error instanceof Error?error.message:String(error)));process.exitCode=error instanceof Error&&error.name==='AbortError'?130:1;});
