#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { Snapshot, createSnapshot } from './snapshot.ts';
import { exportSnapshot } from './export.ts';
import { verifyPackage } from './package.ts';
import { importGeoNames } from './sources/geonames.ts';
import type { Entity, ExportRequest, SnapshotMetadata } from './types.ts';
import type { SeedMapping, SeedOptions } from './seeding/types.ts';

const HELP=`GeoReference 1.0 — geographic snapshots, exports and database seeding

Commands:
  snapshot --input FILE --metadata FILE --output SNAPSHOT.sqlite
  geonames --countries countryInfo.txt --version LABEL --output SNAPSHOT.sqlite
           [--admin1 FILE] [--admin2 FILE] [--places FILE]
  inspect  --snapshot FILE
  export   --snapshot FILE --output DIRECTORY --format FORMAT [options]
  verify   --package DIRECTORY
  seed     --package DIRECTORY [--apply] [--create-schema] [--revision N]

Formats: json, ndjson, csv, sql-postgres, sqlite, geojson
Export: --country IDS_OR_CODES --subdivision IDS --types country,subdivision,locality
        --coordinates --boundaries --no-ancestors --layout flat|hierarchical
        --compression none|gzip|zip --schema-mode schema-and-data|data-only
        --sql-mode upsert|insert-only --spreadsheet-safe
Seed:   --mode upsert|insert-only --batch-size N --schema NAME --table NAME
        --mapping FILE --allow-downgrade; DATABASE_URL in environment
Seeding is a read-only preview unless --apply is supplied.
See README.md / README.fr.md for data licensing and full guides.
`;
const stringOptions=['input','metadata','output','countries','admin1','admin2','places','version','snapshot','format','country','subdivision','types','layout','compression','schema-mode','sql-mode','package','mode','batch-size','revision','schema','table','mapping'];
const booleanOptions=['help','coordinates','boundaries','no-ancestors','spreadsheet-safe','apply','create-schema','allow-downgrade'];
const supported:Record<string,string[]>={
  snapshot:['input','metadata','output'],geonames:['countries','admin1','admin2','places','version','output'],inspect:['snapshot'],verify:['package'],
  export:['snapshot','output','format','country','subdivision','types','coordinates','boundaries','no-ancestors','layout','compression','schema-mode','sql-mode','spreadsheet-safe'],
  seed:['package','apply','create-schema','revision','mode','batch-size','schema','table','mapping','allow-downgrade']
};
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
  if(!args.length||args[0]==='--help'||args[0]==='help') {console.log(HELP);return;}
  const command=args.shift()!;
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
  const number=(key:string)=>{const value=string(key);if(value===undefined)return undefined;if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))) throw new Error(`--${key} requires a nonnegative integer`);return Number(value);};
  const controller=new AbortController();const abort=()=>controller.abort();process.once('SIGINT',abort);
  try {
    let result:unknown;
    if(command==='snapshot') {
      const metadata=JSON.parse(await readFile(string('metadata',true)!,'utf8')) as SnapshotMetadata;
      const output=string('output',true)!;
      await createSnapshot(output,metadata,inputEntities(string('input',true)!,controller.signal));
      const snapshot=Snapshot.open(output);try{result={path:output,count:snapshot.count,datasetVersion:snapshot.metadata.datasetVersion};}finally{snapshot.close();}
    } else if(command==='geonames') {
      const paths={countryInfo:string('countries',true)!,...(string('admin1')?{admin1:string('admin1')!}:{}),...(string('admin2')?{admin2:string('admin2')!}:{}),...(string('places')?{places:string('places')!}:{})};
      const imported=await importGeoNames(paths,{datasetVersion:string('version',true)!});
      await createSnapshot(string('output',true)!,imported.metadata,imported.entities);
      result={count:imported.entities.length,metadata:imported.metadata};
    } else if(command==='export'||command==='inspect') {
      const snapshot=Snapshot.open(string('snapshot',true)!);
      try {
        if(command==='inspect') {
          const counts={country:0,subdivision:0,locality:0};for(const entity of snapshot.entities())counts[entity.entityType]++;
          result={metadata:snapshot.metadata,count:snapshot.count,counts};
        } else {
          const request:ExportRequest={format:string('format',true)!};
          for(const [flag,key] of [['country','countries'],['subdivision','subdivisions'],['types','entityTypes']] as const) if(string(flag)!==undefined) (request as unknown as Record<string,unknown>)[key]=list(flag);
          for(const [flag,key] of [['layout','layout'],['compression','compression'],['schema-mode','schemaMode'],['sql-mode','sqlMode']] as const) if(string(flag)!==undefined) (request as unknown as Record<string,unknown>)[key]=string(flag);
          if(values.coordinates)request.coordinates=true;if(values.boundaries)request.boundaries=true;if(values['no-ancestors'])request.includeAncestors=false;if(values['spreadsheet-safe'])request.spreadsheetSafe=true;
          result=await exportSnapshot(snapshot,string('output',true)!,request,{signal:controller.signal});
        }
      } finally{snapshot.close();}
    } else if(command==='verify') result=await verifyPackage(string('package',true)!);
    else if(command==='seed') {
      const packageDirectory=string('package',true)!;
      // Reject corrupted or unsupported packages before connecting to the database.
      const {readPackage}=await import('./package.ts');const input=await readPackage(packageDirectory);
      const connectionString=process.env.DATABASE_URL;if(!connectionString) throw new Error('DATABASE_URL is required for seed');
      const {Client}=await import('pg');const {seedEntities}=await import('./seeding/index.ts');
      const client=new Client({connectionString});
      try {
        await client.connect();
        const mapping:SeedMapping=string('mapping')?JSON.parse(await readFile(string('mapping')!,'utf8')) as SeedMapping:{};
        if(string('schema'))mapping.schema=string('schema')!;if(string('table'))mapping.table=string('table')!;
        const seedOptions:SeedOptions={dryRun:!values.apply,createSchema:Boolean(values['create-schema']),allowDowngrade:Boolean(values['allow-downgrade']),mapping,signal:controller.signal};
        if(string('mode'))seedOptions.mode=string('mode') as 'upsert'|'insert-only';
        const batchSize=number('batch-size'),revision=number('revision');if(batchSize!==undefined)seedOptions.batchSize=batchSize;if(revision!==undefined)seedOptions.revision=revision;
        result=await seedEntities(client,input,seedOptions);
      } finally {await client.end();}
    }
    console.log(JSON.stringify(result,null,2));
  } finally {process.removeListener('SIGINT',abort);}
}
main().catch((error:unknown)=>{console.error('Error: '+(error instanceof Error?error.message:String(error)));process.exitCode=error instanceof Error&&error.name==='AbortError'?130:1;});
