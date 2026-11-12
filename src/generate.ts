import type { Entity,ExportManifest,ExportRequest,ExportPlan } from './types.ts';
import { createHash } from 'node:crypto';
import { lstat,mkdtemp,readFile,rm,stat,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Snapshot,createSnapshot } from './snapshot.ts';
import { exportSnapshot } from './export.ts';
import { importGeoNames } from './sources/geonames.ts';
import { getBuiltinAdapters } from './adapters/index.ts';
import { assertCongoEntities,loadCongoReference } from './congo.ts';
import type { CongoReference } from './congo.ts';
import { canonicalJson } from './validation.ts';

export interface GenerateOptions {output:string;request:ExportRequest;snapshot?:string;sourceFile?:string;city?:string;arrondissement?:string;signal?:AbortSignal}
const MAX_SOURCE_BYTES=2*1024*1024;
const fold=(text:string)=>text.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
function scopedRequest(entities:Entity[],options:GenerateOptions):ExportRequest {
  const countryId=assertCongoEntities(entities),request=structuredClone(options.request);
  if(request.countries?.some(code=>![countryId,'CG','COG'].some(allowed=>allowed.toUpperCase()===code.toUpperCase())))throw new Error('Only Republic of Congo (CG/COG) can be selected');
  const byId=new Map(entities.map(entity=>[entity.id,entity]));
  const descendant=(entity:Entity,parentId:string):boolean=>{
    const seen=new Set<string>();let current:Entity|undefined=entity;
    while(current&&!seen.has(current.id)){if(current.id===parentId)return true;seen.add(current.id);current=byId.get(current.parentId!);}return false;
  };
  const find=(value:string,kind:'commune'|'arrondissement',parent?:Entity):Entity=>{
    const matches=entities.filter(e=>e.kind===kind&&(!parent||descendant(e,parent.id))&&(e.id===value||fold(e.name)===fold(value)||kind==='arrondissement'&&parent&&e.codes?.municipalNumber===value));
    if(matches.length!==1)throw new Error(`Unknown or ambiguous ${kind}: ${value}`);return matches[0]!;
  };
  let root=options.city?find(options.city,'commune'):undefined;
  if(options.arrondissement){if(/^\d+$/.test(options.arrondissement)&&!root)throw new Error('A numeric --arrondissement requires --city');root=find(options.arrondissement,'arrondissement',root);}
  if(root) {
    if(request.subdivisions?.some(id=>!byId.has(id)||!descendant(byId.get(id)!,root.id)))throw new Error('Subdivision is outside the selected city/arrondissement');
    if(!request.subdivisions?.length)request.subdivisions=[root.id];
  }
  // Country and subtree options describe one scope; do not widen a subtree to the whole country.
  if(request.subdivisions?.length)delete request.countries;else if(request.countries)request.countries=[countryId];
  return request;
}
function sidecars(reference:CongoReference|undefined,snapshot:Snapshot):(plan:ExportPlan)=>Record<string,unknown> {
  return plan=>{
    const selected=[...plan.entities()],counts:Record<string,number>={};
    for(const entity of selected)counts[entity.kind??entity.entityType]=(counts[entity.kind??entity.entityType]??0)+1;
    const sourceCounts:Record<string,number>={};for(const entity of snapshot.entities())sourceCounts[entity.kind??entity.entityType]=(sourceCounts[entity.kind??entity.entityType]??0)+1;
    return {
      'coverage.json':{...(reference?.coverage??{status:'unverified',completeGeographicInventory:false,referenceCounts:sourceCounts,limitations:['User-supplied data; geographic accuracy and completeness have not been independently verified.']}),datasetVersion:snapshot.metadata.datasetVersion,selection:{count:plan.count,counts,contextIds:plan.contextIds,externalReferences:plan.externalReferences}},
      'provenance.json':{datasetVersion:snapshot.metadata.datasetVersion,status:reference?'source-backed':'unverified',sources:snapshot.metadata.sources,entities:Object.fromEntries(selected.map(entity=>[entity.id,{evidence:reference?.provenance[entity.id]??[],issues:reference?.issues[entity.id]??[]}]))}
    };
  };
}
/** Generate standalone Congo files without network access or project dependency changes. */
export async function generateFiles(options:GenerateOptions):Promise<ExportManifest> {
  options.signal?.throwIfAborted();
  if(options.snapshot&&options.sourceFile)throw new Error('--snapshot and --source-file cannot be combined');
  const adapter=getBuiltinAdapters().find(item=>item.format===options.request.format);
  if(!adapter)throw new Error(`Unsupported export format: ${options.request.format}`);adapter.validate(options.request);
  try {await lstat(options.output);throw new Error('Export destination already exists');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const reference=await loadCongoReference();
  const temporary=await mkdtemp(join(tmpdir(),'georeference-generate-'));
  let snapshot:Snapshot|undefined;
  try {
    let trusted:CongoReference|undefined;
    if(options.snapshot) {
      snapshot=Snapshot.open(options.snapshot);
      // A dataset label alone is not evidence; require the exact validated catalog content.
      if(canonicalJson(snapshot.metadata)===canonicalJson(reference.metadata)&&canonicalJson([...snapshot.entities()].sort((a,b)=>a.id.localeCompare(b.id)))===canonicalJson([...reference.entities].sort((a,b)=>a.id.localeCompare(b.id))))trusted=reference;
    } else {
      let metadata=reference.metadata,entities=reference.entities;trusted=reference;
      if(options.sourceFile) {
        if((await stat(options.sourceFile)).size>MAX_SOURCE_BYTES)throw new Error('Country source exceeds 2 MiB limit');
        const bytes=await readFile(options.sourceFile);if(bytes.length>MAX_SOURCE_BYTES)throw new Error('Country source exceeds 2 MiB limit');
        const source=join(temporary,'countryInfo.txt');await writeFile(source,bytes);
        const revision=createHash('sha256').update(bytes).digest('hex');
        const imported=await importGeoNames({countryInfo:source},{datasetVersion:'geonames-countryInfo-sha256:'+revision});
        metadata=imported.metadata;entities=imported.entities.filter(entity=>entity.entityType==='country'&&entity.codes?.iso2==='CG');trusted=undefined;
      }
      assertCongoEntities(entities);
      const path=join(temporary,'snapshot.sqlite');await createSnapshot(path,metadata,entities);snapshot=Snapshot.open(path);
    }
    const request=scopedRequest([...snapshot.entities()],options);
    return await exportSnapshot(snapshot,options.output,request,{...(options.signal?{signal:options.signal}:{}),geographicCoverage:'partial',sidecars:sidecars(trusted,snapshot)});
  } finally {snapshot?.close();await rm(temporary,{recursive:true,force:true});}
}
