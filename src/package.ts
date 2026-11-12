import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createGunzip } from 'node:zlib';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { fileDigest, packageFile } from './files.ts';
import { canonicalJson, validateEntity, validateMetadata } from './validation.ts';
import { validateGraph } from './graph.ts';
import type { ExportManifest, Entity } from './types.ts';

export async function verifyPackage(directory:string):Promise<ExportManifest> {
  const manifestPath=await packageFile(directory,'manifest.json');
  if ((await stat(manifestPath)).size>1024*1024) throw new Error('Manifest exceeds 1 MiB limit');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8')) as ExportManifest;
  if(manifest.geographicCoverage!==undefined&&!['partial','complete'].includes(manifest.geographicCoverage))throw new Error('Invalid geographic coverage');
  validateMetadata({contractVersion:manifest.contractVersion,datasetVersion:manifest.datasetVersion,sources:manifest.sources});
  if (!manifest.request || !manifest.counts || !Number.isSafeInteger(manifest.count) || manifest.count<0 || !/^[a-f0-9]{64}$/.test(manifest.contentId) || !Array.isArray(manifest.files) || !manifest.files.length || manifest.files.length>10000 || !Array.isArray(manifest.externalReferences) || !Array.isArray(manifest.contextIds)) throw new Error('Invalid package manifest');
  const seen=new Set<string>();
  for (const item of manifest.files) {
    if(item.role!==undefined&&!['data','metadata'].includes(item.role))throw new Error('Invalid manifest file role');
    if (!item || seen.has(item.path) || item.path==='manifest.json' || !/^[a-f0-9]{64}$/.test(item.sha256) || !Number.isSafeInteger(item.bytes) || item.bytes<0) throw new Error('Invalid manifest file entry');
    seen.add(item.path);
    const digest=await fileDigest(await packageFile(directory,item.path));
    if (digest.bytes!==item.bytes||digest.sha256!==item.sha256) throw new Error(`Package integrity/checksum mismatch: ${item.path}`);
  }
  return manifest;
}
const MAX_IMPORT_BYTES=128*1024*1024;
export async function boundedText(path:string,maxBytes=MAX_IMPORT_BYTES):Promise<string> {
  const input=createReadStream(path);const stream=path.endsWith('.gz')?input.pipe(createGunzip()):input;
  const chunks:Buffer[]=[];let size=0;
  try {
    for await (const chunk of stream) {
      size+=chunk.length;
      if (size>maxBytes) throw new Error('Import exceeds 128 MiB uncompressed limit; split the package');
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally { input.destroy();stream.destroy(); }
}
function flatten(nodes:unknown[],entities:unknown[]):void {
  for (const node of nodes) {
    if (!node || typeof node!=='object' || Array.isArray(node)) throw new Error('Invalid hierarchical entity');
    const {children,...entity}=node as Record<string,unknown>;
    entities.push(entity);
    if (children!==undefined) { if(!Array.isArray(children)) throw new Error('Invalid children');flatten(children,entities); }
  }
}
export async function readPackage(directory:string):Promise<{manifest:ExportManifest;entities:Entity[]}> {
  const manifest=await verifyPackage(directory);
  if (manifest.request.spreadsheetSafe) throw new Error('Spreadsheet consultation profiles cannot be imported');
  if (manifest.files.some(file=>file.path.endsWith('.zip'))) throw new Error('Extract package.zip into a new directory before importing');
  const format=manifest.request.format;
  if (!['json','ndjson','csv'].includes(format)) throw new Error('Seeding requires a JSON, NDJSON or normalized CSV package');
  const dataFiles=manifest.files.filter(file=>file.role!=='metadata');
  if (dataFiles.length!==1) throw new Error('V1 import expects one data file per package');
  const text=await boundedText(await packageFile(directory,dataFiles[0]!.path));
  let raw:unknown[];
  if (format==='json') {
    const document=JSON.parse(text) as {entities?:unknown[]};
    if (!Array.isArray(document.entities)) throw new Error('Invalid JSON entities array');
    raw=[];flatten(document.entities,raw);
  } else if(format==='ndjson') raw=text.split(/\r?\n/).filter(line=>line.length>0).map(line=>JSON.parse(line));
  else {
    const rows=parse(text,{columns:true,skip_empty_lines:true,max_record_size:8*1024*1024,bom:true}) as Record<string,string>[];
    const jsonFields=new Set(['parentId','codes','names','level','coordinates','boundary']);
    raw=rows.map(row=>{
      const result:Record<string,unknown>={};
      for(const [key,value] of Object.entries(row)) {
        if(key==='kind'&&value==='') continue;
        if (jsonFields.has(key)) { if(value!=='') result[key]=JSON.parse(value); }
        else result[key]=value;
      }
      return result;
    });
  }
  if(raw.length!==manifest.count || raw.length>500000) throw new Error('Package entity count mismatch or import limit exceeded');
  const entities:Entity[]=[];const seen=new Set<string>();const counts={country:0,subdivision:0,locality:0};const required=new Set<string>();
  for(const row of raw) {
    validateEntity(row);
    if(seen.has(row.id)) throw new Error(`Duplicate entity ID: ${row.id}`);
    if((row.coordinates!==undefined&&!manifest.request.coordinates)||(row.boundary!==undefined&&!manifest.request.boundaries)) throw new Error('Unexpected field outside manifest projection');
    seen.add(row.id);entities.push(row);counts[row.entityType]++;
    if(row.parentId) required.add(row.parentId);required.add(row.countryId);
  }
  for(const key of ['country','subdivision','locality'] as const) if(counts[key]!==manifest.counts[key]) throw new Error('Manifest counts do not match data');
  const external=[...required].filter(id=>!seen.has(id)).sort();
  if(JSON.stringify(external)!==JSON.stringify([...manifest.externalReferences].sort())) throw new Error('Unresolved references differ from manifest');
  validateGraph(entities);
  const identity=createHash('sha256').update(canonicalJson({metadata:{contractVersion:manifest.contractVersion,datasetVersion:manifest.datasetVersion,sources:manifest.sources},request:manifest.request}));
  for(const entity of [...entities].sort((a,b)=>Buffer.compare(Buffer.from(a.id),Buffer.from(b.id)))) identity.update('\n'+canonicalJson(entity));
  if(identity.digest('hex')!==manifest.contentId) throw new Error('Package contentId identity does not match metadata and data');
  return {manifest,entities};
}
