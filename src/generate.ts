import type { ExportManifest, ExportRequest } from './types.ts';
import { createHash } from 'node:crypto';
import { lstat,mkdtemp,readFile,rm,stat,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Snapshot,createSnapshot } from './snapshot.ts';
import { exportSnapshot } from './export.ts';
import { importGeoNames } from './sources/geonames.ts';
import { getBuiltinAdapters } from './adapters/index.ts';
export interface GenerateOptions { output:string; request:ExportRequest; snapshot?:string; sourceFile?:string; signal?:AbortSignal }
const COUNTRY_SOURCE='https://download.geonames.org/export/dump/countryInfo.txt';
const MAX_SOURCE_BYTES=2*1024*1024;
async function downloadCountries(download:typeof fetch,signal:AbortSignal):Promise<Buffer> {
  let response:Response;
  try {response=await download(COUNTRY_SOURCE,{signal});}
  catch(error) {
    if(signal.aborted) throw signal.reason;
    throw new Error('Unable to download GeoNames; check your connection or use --source-file countryInfo.txt',{cause:error});
  }
  if(!response.ok) {await response.body?.cancel();throw new Error(`GeoNames download failed (HTTP ${response.status}); retry or use --source-file countryInfo.txt`);}
  if(!response.body) throw new Error('GeoNames returned an empty response');
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try {
    while(true) {
      signal.throwIfAborted();const chunk=await reader.read();if(chunk.done)break;
      size+=chunk.value.byteLength;
      if(size>MAX_SOURCE_BYTES) throw new Error('Country source exceeds 2 MiB limit');
      chunks.push(chunk.value);
    }
    return Buffer.concat(chunks);
  } finally {await reader.cancel();reader.releaseLock();}
}
/** Owns only temporary source/snapshot files and the new output directory. */
export async function generateFiles(options:GenerateOptions,download:typeof fetch=fetch):Promise<ExportManifest> {
  options.signal?.throwIfAborted();
  if(options.snapshot&&options.sourceFile) throw new Error('--snapshot and --source-file cannot be combined');
  const adapter=getBuiltinAdapters().find(item=>item.format===options.request.format);
  if(!adapter) throw new Error(`Unsupported export format: ${options.request.format}`);
  adapter.validate(options.request);
  try {await lstat(options.output);throw new Error('Export destination already exists');}
  catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT') throw error;}
  const exportOptions=options.signal?{signal:options.signal}:{};
  if(options.snapshot) {
    const snapshot=Snapshot.open(options.snapshot);
    try {return await exportSnapshot(snapshot,options.output,options.request,exportOptions);}
    finally {snapshot.close();}
  }
  const temporary=await mkdtemp(join(tmpdir(),'georeference-generate-'));
  try {
    if(options.sourceFile&&(await stat(options.sourceFile)).size>MAX_SOURCE_BYTES) throw new Error('Country source exceeds 2 MiB limit');
    const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(30_000)]):AbortSignal.timeout(30_000);
    const bytes=options.sourceFile?await readFile(options.sourceFile):await downloadCountries(download,signal);
    options.signal?.throwIfAborted();
    if(bytes.length>MAX_SOURCE_BYTES) throw new Error('Country source exceeds 2 MiB limit');
    const source=join(temporary,'countryInfo.txt');await writeFile(source,bytes);
    const revision=createHash('sha256').update(bytes).digest('hex');
    const imported=await importGeoNames({countryInfo:source},{datasetVersion:'geonames-countryInfo-sha256:'+revision});
    const path=join(temporary,'snapshot.sqlite');await createSnapshot(path,imported.metadata,imported.entities);
    const snapshot=Snapshot.open(path);
    try {return await exportSnapshot(snapshot,options.output,options.request,exportOptions);}
    finally {snapshot.close();}
  } finally {await rm(temporary,{recursive:true,force:true});}
}
