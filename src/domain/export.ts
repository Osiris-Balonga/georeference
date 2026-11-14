import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {exportSnapshot} from '../export.ts';
import type {ExportOptions} from '../export.ts';
import type {Snapshot} from '../snapshot.ts';
import type {ExportRequest,ExportManifest,ExportAdapter,AdapterContext} from '../types.ts';
import type {ResourceTables} from './model.ts';
import {RESOURCE_NAMES,toResourceTables,createResourceIdentity} from './model.ts';
import {writeHumanCsv,writeWorkbook,resourceLabel} from './human.ts';

const formats=['json','ndjson','csv','xlsx','sql-postgres','sqlite','geojson'];
export interface ResourceAdapter {format:string;version:string;validate?:(request:ExportRequest)=>void;write:(tables:ResourceTables,context:AdapterContext)=>Promise<string[]>}
const extensions=new Map<string,ResourceAdapter>();
export function registerResourceAdapter(adapter:ResourceAdapter):void {
 if(!adapter?.format||!adapter.version||typeof adapter.write!=='function'||formats.includes(adapter.format)||extensions.has(adapter.format))throw new Error('Resource adapter format must be unique and not reserved');
 extensions.set(adapter.format,adapter);
}
export function validateResourceRequest(request:ExportRequest):void{
 if(!formats.includes(request.format)&&!extensions.has(request.format))throw new Error(`Unsupported export format: ${request.format}`);
 if(request.layout&&request.layout!=='flat')throw new Error('Resource exports use separate category files; hierarchical layout is not supported');
 if(request.includeAncestors===false)throw new Error('Resource exports require ancestor context for complete relationships');
 if(request.language!==undefined&&!['fr','en'].includes(request.language))throw new Error('Language must be fr or en');
 for(const key of ['includeIds','audit'] as const)if(request[key]!==undefined&&typeof request[key]!=='boolean')throw new Error(`Invalid ${key}`);
 if(request.includeIds!==undefined&&!['csv','xlsx'].includes(request.format))throw new Error('includeIds is only supported by human CSV/Excel exports');
 if(request.sqlNames!==undefined&&!['sql-postgres','sqlite'].includes(request.format))throw new Error('SQL names require a SQL or SQLite export');
 if((request.schemaMode!==undefined||request.sqlMode!==undefined)&&request.format!=='sql-postgres')throw new Error('SQL options require sql-postgres');
 if(request.format==='geojson'&&!request.coordinates&&!request.boundaries)throw new Error('GeoJSON requires coordinates and/or boundaries');
 extensions.get(request.format)?.validate?.(request);
}
/** Public delivery coordinator: domain resources, distinct human representations and reusable adapters. */
export async function exportResources(snapshot:Snapshot,directory:string,request:ExportRequest,options:ExportOptions={}):Promise<ExportManifest>{
 validateResourceRequest(request);
 const extension=extensions.get(request.format);
 const adapter:ExportAdapter={format:request.format,version:extension?.version??'2.0.0',validate:validateResourceRequest,async write(context){
  const tables=toResourceTables(context.plan.entities());const count=Object.values(tables).reduce((n,rows)=>n+rows.length,0);
  if(count>500000)throw new Error('Resource export exceeds 500,000 rows; split by geographic area');
  if(context.plan.externalReferences.length)throw new Error('Resource exports require closed parent relationships');
  if(extension)return extension.write(tables,context);
  if(request.format==='csv')return writeHumanCsv(tables,context.directory,request,context.signal);
  if(request.format==='xlsx')return writeWorkbook(tables,context.directory,request,context.signal);
  if(request.format==='sql-postgres'){const {writeDomainSql}=await import('./sql.ts');return writeDomainSql(tables,context.directory,{...request,...(request.sqlNames?{sqlNames:request.sqlNames}:{})},context.signal);}
  if(request.format==='sqlite'){const {writeDomainSqlite}=await import('./sqlite.ts');return writeDomainSqlite(tables,context.directory,request,context.signal);}
  if(request.format==='geojson'){
   const paths:string[]=[];
   for(const layer of ['points','boundaries'] as const){if(layer==='points'?!request.coordinates:!request.boundaries)continue;
    const features=RESOURCE_NAMES.flatMap(resource=>tables[resource].map(row=>{const {coordinates,boundary,...properties}=row;const point=coordinates as {longitude:number;latitude:number}|null;return {type:'Feature',id:row.id,properties:{...properties,resource},geometry:layer==='points'?point?{type:'Point',coordinates:[point.longitude,point.latitude]}:null:boundary??null};}));
    const path=layer+'.geojson';await writeFile(join(context.directory,path),JSON.stringify({type:'FeatureCollection',features},null,2)+'\n',{flag:'wx'});paths.push(path);
   }return paths;
  }
  const paths:string[]=[];
  for(const resource of RESOURCE_NAMES){context.signal?.throwIfAborted();const path=resource+'.'+request.format;const rows=tables[resource];await writeFile(join(context.directory,path),request.format==='json'?JSON.stringify(rows,null,2)+'\n':rows.map(row=>JSON.stringify(row)+'\n').join(''),{flag:'wx'});paths.push(path);}return paths;
 }};
 return exportSnapshot(snapshot,directory,request,{...options,adapter,dataModel:'resources-v1',contentIdentity:plan=>createResourceIdentity(plan.metadata,plan.request,toResourceTables(plan.entities())),sidecars:plan=>{
  const fr=request.language!=='en';const tables=toResourceTables(plan.entities());
  const sourceDates=[...new Set(plan.metadata.sources.map(s=>(s as unknown as {date?:string}).date).filter(Boolean))].sort().join(', ');
  const lines=fr?['Référentiel géographique — République du Congo','',`Révision : ${plan.metadata.datasetVersion}`,`Entités exportées : ${plan.count}`,'Couverture géographique : partielle, non exhaustive.','Les dates documentaires et les réceptions de sources sont distinctes ; voir les preuves pour les dates d’observation disponibles.','Une catégorie vide signale un manque dans cet export, pas une absence sur le terrain.','Les noms et rattachements documentés sont conservés. Aucun point ni frontière manquants ne sont inventés.','',`Dates des sources de cet export (textes de référence inclus) : ${sourceDates||'voir les révisions sources ci-dessous'}`]:['Geographic reference — Republic of Congo','',`Revision: ${plan.metadata.datasetVersion}`,`Exported records: ${plan.count}`,'Geographic coverage: partial, not exhaustive.','Document dates and source receipt dates are distinct; consult evidence for known observation dates.','An empty category is an export data gap, not proof that places do not exist.','Documented names and parents are preserved. Missing geometry is never invented.','',`Source dates in this export (including reference texts): ${sourceDates||'see source revisions below'}`];
  lines.push('',...RESOURCE_NAMES.map(name=>`${resourceLabel(name,request.language)}: ${tables[name].length}`),'',fr?'Sources et conditions :':'Sources and terms:',...plan.metadata.sources.map(source=>`${source.name}\n${source.url}\n${source.license}\n${source.attribution}\n${source.revision}\n`));
  const extra=options.sidecars?.(plan)??{};return {...extra,'README.txt':lines.join('\n')+'\n'};
 }});
}
