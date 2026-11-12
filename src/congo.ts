import { readFile } from 'node:fs/promises';
import type { Entity,SnapshotMetadata,GeographicKind } from './types.ts';
import { validateEntity,validateMetadata,canonicalJson } from './validation.ts';
import { UUID_PATTERN } from './domain/model.ts';
export interface CongoEvidence {sourceId:string;observedAt:string;locator:string;pdfPage?:number|null;printedPage?:number|null;rawLabel:string}
export interface CongoReference {metadata:SnapshotMetadata;entities:Entity[];coverage:Record<string,unknown>;provenance:Record<string,CongoEvidence[]>;issues:Record<string,unknown[]>}
function object(input:unknown):input is Record<string,unknown> {return typeof input==='object'&&input!==null&&!Array.isArray(input);}
const parents:Partial<Record<GeographicKind,GeographicKind[]>>={department:['country'],commune:['department'],district:['department'],arrondissement:['commune'],'urban-community':['district'],'rural-community':['district'],neighborhood:['commune','arrondissement','urban-community'],village:['district','rural-community','urban-community']};
/** Validate factual catalog integrity; this does not certify geographic completeness. */
export function validateCongoReference(input:unknown):CongoReference {
  if(!object(input)||input.schemaVersion!=='1.0'||!Array.isArray(input.entries)||!Array.isArray(input.sources))throw new Error('Invalid Congo reference catalog');
  const metadata={contractVersion:'1.0',datasetVersion:input.datasetVersion,sources:input.sources};validateMetadata(metadata);
  const sourceIds=new Set<string>();
  for(const source of input.sources) {
    if(!object(source)||typeof source.id!=='string'||!source.id||sourceIds.has(source.id))throw new Error('Invalid or duplicate source ID');
    sourceIds.add(source.id);
  }
  const entities:Entity[]=[],provenance:Record<string,CongoEvidence[]>={},issues:Record<string,unknown[]>={};
  const byId=new Map<string,Entity>();const counts:Record<string,number>={};
  for(const entry of input.entries) {
    if(!object(entry))throw new Error('Invalid catalog entry');
    validateEntity(entry.entity);const entity=entry.entity;
    if(!entity.kind||byId.has(entity.id)||!UUID_PATTERN.test(entity.id))throw new Error('Missing kind, invalid UUID or duplicate entity ID');
    if(!Array.isArray(entry.evidence)||!entry.evidence.length)throw new Error('Every entity requires source evidence');
    for(const proof of entry.evidence) {
      if(!object(proof)||!sourceIds.has(proof.sourceId as string)||typeof proof.observedAt!=='string'||!/^\d{4}-\d{2}(?:-\d{2})?$/.test(proof.observedAt)||typeof proof.locator!=='string'||!proof.locator.trim()||typeof proof.rawLabel!=='string'||!proof.rawLabel.trim())throw new Error('Invalid source evidence');
      for(const key of ['pdfPage','printedPage'])if(proof[key]!==undefined&&proof[key]!==null&&(!Number.isSafeInteger(proof[key])||(proof[key] as number)<1))throw new Error('Invalid source page');
    }
    if(!Array.isArray(entry.issues))throw new Error('Invalid entity issues');
    entities.push(entity);byId.set(entity.id,entity);counts[entity.kind]=(counts[entity.kind]??0)+1;
    provenance[entity.id]=entry.evidence as CongoEvidence[];issues[entity.id]=entry.issues;
  }
  assertCongoEntities(entities);
  const country=entities.find(entity=>entity.entityType==='country')!;
  if(input.countryId!==country.id||country.codes?.iso2!=='CG'||country.codes?.iso3!=='COG')throw new Error('Congo catalog requires the CG/COG country identity');
  for(const entity of entities) {
    if(entity.kind==='country')continue;
    const parent=byId.get(entity.parentId!);
    if(!parent?.kind||!parents[entity.kind!]?.includes(parent.kind))throw new Error(`Invalid administrative parent hierarchy: ${entity.id}`);
  }
  if(!object(input.coverage)||input.coverage.status!=='partial'||input.coverage.completeGeographicInventory!==false||canonicalJson(input.coverage.referenceCounts)!==canonicalJson(counts))throw new Error('Invalid or misleading Congo coverage counts');
  return {metadata,entities,coverage:input.coverage,provenance,issues};
}
export async function loadCongoReference():Promise<CongoReference> {
  const reference=validateCongoReference(JSON.parse(await readFile(new URL('../reference/congo.json',import.meta.url),'utf8')));
  const registry=JSON.parse(await readFile(new URL('../reference/identities.json',import.meta.url),'utf8')) as {version:number;ids:Record<string,string>};
  const ids=Object.values(registry.ids),known=new Set(ids);
  if(registry.version!==1||ids.length!==known.size||reference.entities.some(e=>!known.has(e.id)))throw new Error('Catalog UUIDs must match the persistent identity registry');
  return reference;
}
/** Public CLI input guard; the underlying snapshot/adapter contracts remain reusable. */
export function assertCongoEntities(entities:Iterable<Entity>):string {
  const list=[...entities];const countries=list.filter(entity=>entity.entityType==='country');
  const country=countries[0];
  if(countries.length!==1||!country||(country.codes?.iso2!=='CG'&&country.codes?.iso3!=='COG')||(country.codes?.iso2!==undefined&&country.codes.iso2!=='CG')||(country.codes?.iso3!==undefined&&country.codes.iso3!=='COG'))throw new Error('Only Republic of Congo (CG/COG) data is supported');
  const byId=new Map(list.map(entity=>[entity.id,entity]));
  for(const entity of list) {
    validateEntity(entity);
    if(entity.countryId!==country.id||entity.parentId!==null&&!byId.has(entity.parentId))throw new Error('Congo data requires a closed parent hierarchy in one country');
  }
  return country.id;
}
