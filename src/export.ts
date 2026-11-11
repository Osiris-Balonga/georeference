import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, mkdtemp, rename, rm, writeFile, unlink } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import yazl from 'yazl';
import { canonicalJson } from './validation.ts';
import { fileDigest, packageFile } from './files.ts';
import type { ExportAdapter, ExportManifest, ExportRequest } from './types.ts';
import type { Snapshot } from './snapshot.ts';

const extensions=new Map<string,ExportAdapter>();
const builtins=['json','ndjson','csv','sql-postgres','sqlite','geojson'];
async function writeManifest(directory:string,manifest:ExportManifest):Promise<void> {
  const text=JSON.stringify(manifest,null,2)+'\n';
  if(Buffer.byteLength(text)>1024*1024) throw new Error('Manifest exceeds 1 MiB limit; split the export scope');
  await writeFile(join(directory,'manifest.json'),text);
}
export function registerExportAdapter(adapter:ExportAdapter):void {
  if (!adapter.format || !adapter.version || builtins.includes(adapter.format) || extensions.has(adapter.format)) throw new Error('Adapter format must be unique and versioned');
  extensions.set(adapter.format,adapter);
}
function normalize(request:ExportRequest):ExportRequest {
  const allowed=new Set(['format','layout','compression','countries','subdivisions','entityTypes','includeAncestors','coordinates','boundaries','schemaMode','sqlMode','spreadsheetSafe']);
  for (const key of Object.keys(request)) if (!allowed.has(key)) throw new Error(`Unknown export option: ${key}`);
  if (!['none','gzip','zip'].includes(request.compression??'none')) throw new Error('Unsupported compression');
  for(const [key,allowedValues] of Object.entries({layout:['flat','hierarchical'],schemaMode:['schema-and-data','data-only'],sqlMode:['upsert','insert-only']})) {
    const value=(request as unknown as Record<string,unknown>)[key];
    if(value!==undefined&&!allowedValues.includes(value as string)) throw new Error(`Invalid ${key}`);
  }
  for (const key of ['includeAncestors','coordinates','boundaries','spreadsheetSafe'] as const) if (request[key]!==undefined && typeof request[key]!=='boolean') throw new Error(`Invalid boolean option: ${key}`);
  const result:ExportRequest={...request,layout:request.layout??'flat',compression:request.compression??'none',includeAncestors:request.includeAncestors??true,coordinates:request.coordinates??false,boundaries:request.boundaries??false};
  for (const key of ['countries','subdivisions','entityTypes'] as const) {
    if (request[key]!==undefined) {
      if (!Array.isArray(request[key]) || request[key]!.some(value=>typeof value!=='string'||!value)) throw new Error(`Invalid ${key}`);
      (result as unknown as Record<string,unknown>)[key]=[...new Set(request[key])].sort();
    }
  }
  return result;
}
export async function exportSnapshot(snapshot:Snapshot,directory:string,request:ExportRequest,options:{signal?:AbortSignal}={}):Promise<ExportManifest> {
  options.signal?.throwIfAborted();
  const normalized=normalize(request);
  const adapters=await import('./adapters/index.ts');
  const adapter=extensions.get(normalized.format)??adapters.getBuiltinAdapters().find(item=>item.format===normalized.format);
  if (!adapter) throw new Error(`Unsupported export format: ${normalized.format}`);
  adapter.validate(normalized);
  await mkdir(dirname(directory),{recursive:true});
  try { await access(directory); throw new Error('Export destination already exists'); } catch(error) { if ((error as NodeJS.ErrnoException).code!=='ENOENT') throw error; }
  const temporary=await mkdtemp(join(dirname(directory),'.'+basename(directory)+'-'));
  let disposePlan:(()=>void)|undefined;
  try {
    const plan=snapshot.select(normalized);disposePlan=plan.dispose;
    const hash=createHash('sha256').update(canonicalJson({metadata:plan.metadata,request:normalized}));
    const counts={country:0,subdivision:0,locality:0}; let missingCoordinates=0,missingBoundaries=0;
    for (const entity of (plan.identityEntities?.()??plan.entities())) {
      options.signal?.throwIfAborted(); hash.update('\n'+canonicalJson(entity));counts[entity.entityType]++;
      if (normalized.coordinates && !entity.coordinates) missingCoordinates++;
      if (normalized.boundaries && !entity.boundary) missingBoundaries++;
    }
    let paths=await adapter.write({plan,directory:temporary,...(options.signal?{signal:options.signal}:{})});
    if (!paths.length || new Set(paths).size!==paths.length || paths.includes('manifest.json')) throw new Error('Adapter returned invalid file list');
    for (const path of paths) await packageFile(temporary,path);
    if (normalized.compression==='gzip') {
      const compressed:string[]=[];
      for (const path of paths) {
        await pipeline(createReadStream(join(temporary,path)),createGzip(),createWriteStream(join(temporary,path+'.gz'),{flags:'wx'}),{signal:options.signal});
        await unlink(join(temporary,path));compressed.push(path+'.gz');
      }
      paths=compressed;
    }
    const manifest:ExportManifest={contractVersion:'1.0',generatorVersion:'1.0.0',adapterVersion:adapter.version,datasetVersion:plan.metadata.datasetVersion,
      contentId:hash.digest('hex'),request:normalized,sources:plan.metadata.sources,count:plan.count,counts,contextIds:plan.contextIds,externalReferences:plan.externalReferences,
      geometry:{coordinates:{requested:normalized.coordinates!,missing:missingCoordinates},boundaries:{requested:normalized.boundaries!,missing:missingBoundaries},crs:'OGC:CRS84'},
      scope:{kind:'full',complete:plan.count===snapshot.count&&normalized.includeAncestors!==false},files:[]};
    for (const path of paths.sort()) manifest.files.push({path,...await fileDigest(join(temporary,path))});
    await writeManifest(temporary,manifest);
    if (normalized.compression==='zip') {
      const zip=new yazl.ZipFile();
      for (const path of [...paths,'manifest.json']) zip.addFile(join(temporary,path),path,{mtime:new Date('1980-01-01T00:00:00Z')});
      const finish=pipeline(zip.outputStream,createWriteStream(join(temporary,'package.zip'),{flags:'wx'}),{signal:options.signal});
      zip.end();await finish;
      for (const path of paths) await unlink(join(temporary,path));
      manifest.files=[{path:'package.zip',...await fileDigest(join(temporary,'package.zip'))}];
      await writeManifest(temporary,manifest);
    }
    options.signal?.throwIfAborted();
    await rename(temporary,directory);
    return manifest;
  } catch(error) {
    await rm(temporary,{recursive:true,force:true}); throw error;
  } finally {disposePlan?.();}
}
