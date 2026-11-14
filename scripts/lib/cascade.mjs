import {randomUUID} from 'node:crypto';

const fold=value=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const districtAliases={bokosongho:'bokosongo',vindza:'vinza',bouanela:'bouaniela',ongogni:'ongoni',makotimpoko:'makotipoko'};

function classify(row){
 const code=String(row.code),label=row.label.trim();let kind,name=label,number;
 if(!/^\d+$/.test(code))return null;
 if(code.length===2)kind='department';
 if(code.length===4){kind=Number(code.slice(2))<21?'commune':'district';name=name.replace(/\s*\((Commune|District|CU)\)$/i,'').trim();}
 if(code.length===6){kind=/\(CU\)$/i.test(label)?'urban-community':/\(CR\)$/i.test(label)?'rural-community':/arrondissement/i.test(label)?'arrondissement':null;number=Number(code.slice(-2));name=name.replace(/^Arrondissement\s+\d+\s*:\s*/i,'').replace(/\s*\((CU|CR|Arrondissement)\)$/i,'').trim();}
 if(code.length===9){kind=/^Village\s*:/i.test(label)?'village':/^CQ\d+\s*:/i.test(label)?'neighborhood':null;name=name.replace(/^(Village|CQ\d+)\s*:\s*/i,'').trim();}
 return kind?{...row,code,label,kind,name,number}:null;
}

function oldQuarterNumber(entity,parent){
 const raw=entity.codes?.sourceQuarterCode;
 if(!raw||!/^\d+$/.test(raw))return null;
 const n=Number(raw);if(n>=100)return n;
 if(parent.kind==='commune')return 100+n;
 const a=Number(parent.codes?.municipalNumber);
 return a*100+(n>=10&&Math.floor(n/10)===a?n%10:n);
}

/** Reconcile one immutable source edition; UUID allocation is persisted by the caller. */
export function mergeCascade(input,identities,source){
 if(!source.id||!/^\d{4}-\d{2}-\d{2}$/.test(source.receivedAt)||!source.sha256||!Array.isArray(source.rows))throw new Error('Invalid cascade source');
 const catalog=structuredClone(input),registry=structuredClone(identities);
 registry.cascadeRecords??={};
 registry.cascadeCodes??={};
 const entries=catalog.entries,byId=new Map(entries.map(e=>[e.entity.id,e]));
 const resolved=new Map(),seenRows=new Map(),claimed=new Set(),audit={sourceId:source.id,rows:[],renames:[],codeConflicts:[]};
 const rawByCode=Object.groupBy(source.rows,r=>String(r.code));
 for(const [code,rows] of Object.entries(rawByCode))if(new Set(rows.map(r=>r.label.trim())).size>1)audit.codeConflicts.push({code,rows:rows.map(r=>r.row),labels:rows.map(r=>r.label)});
 const rows=[...source.rows].sort((a,b)=>String(a.code).length-String(b.code).length||a.row-b.row);
 for(const raw of rows){
  const row=classify(raw),key=source.sha256+':'+raw.row;
  const disposition={row:raw.row,code:String(raw.code),label:raw.label};
  const unresolved=reason=>audit.rows.push({...disposition,status:'unresolved',reason});
  if(!row){unresolved('unclassified-label');continue;}
  if(!row.name||/^CQ\d+$/i.test(row.name)){unresolved('missing-place-name');continue;}
  const parentLength={4:2,6:4,9:6}[row.code.length];
  const parentId=parentLength?resolved.get(row.code.slice(0,parentLength)):catalog.countryId;
  if(!parentId){unresolved('missing-parent');continue;}
  const parent=byId.get(parentId).entity;
  // A same-name singleton arrondissement is a collection tier, not evidence of legal subdivision.
  if(row.kind==='arrondissement'&&fold(row.name)===fold(parent.name)){
   resolved.set(row.code,parentId);audit.rows.push({...disposition,status:'collection-tier',entityId:parentId});continue;
  }
  const repeatedKey=row.code+'|'+row.kind+'|'+fold(row.name);
  if(seenRows.has(repeatedKey)){
   const id=seenRows.get(repeatedKey);registry.cascadeRecords[key]=id;resolved.set(row.code,id);
   audit.rows.push({...disposition,status:'duplicate',entityId:id});continue;
  }
  let entry=byId.get(registry.cascadeRecords[key]);
  const available=entries.filter(e=>e.entity.kind===row.kind&&e.entity.parentId===parentId&&!claimed.has(e.entity.id));
  if(!entry){
   const names=available.filter(e=>fold(e.entity.name)===fold(row.name)||(row.kind==='district'&&fold(e.entity.name)===districtAliases[fold(row.name)]));
   if(names.length===1)entry=names[0];
  }
  const codeKey=row.kind+':'+row.code,knownCodeIds=registry.cascadeCodes[codeKey]??[];
  if(!entry&&knownCodeIds.length===1)entry=available.find(e=>e.entity.id===knownCodeIds[0]);
  if(!entry&&row.kind==='arrondissement')entry=available.find(e=>Number(e.entity.codes?.municipalNumber)===row.number);
  if(!entry&&row.kind==='neighborhood'){
   const localCode=Number(/^CQ(\d+)/i.exec(row.label)?.[1]);
   const candidates=available.filter(e=>oldQuarterNumber(e.entity,parent)===localCode);
   if(candidates.length===1)entry=candidates[0];
  }
  if(!entry){
   const identityKey='cg:cascade:'+source.sha256+':'+row.row;
   const id=registry.cascadeRecords[key]??registry.ids[identityKey]??randomUUID();registry.ids[identityKey]=id;
   const entity={id,kind:row.kind,entityType:['neighborhood','village'].includes(row.kind)?'locality':'subdivision',name:row.name,countryId:catalog.countryId,parentId};
   if(row.kind==='arrondissement')entity.codes={municipalNumber:String(row.number)};
   entry={entity,evidence:[],issues:[]};entries.push(entry);byId.set(id,entry);
  }
  const entity=entry.entity;
  if(fold(entity.name)!==fold(row.name)){audit.renames.push({id:entity.id,before:entity.name,after:row.name,row:row.row});entity.names={...entity.names,previous:entity.names?.previous??entity.name};entity.name=row.name;}
  const proof={sourceId:source.id,observedAt:null,receivedAt:source.receivedAt,locator:'Cascade!A'+row.row+':B'+row.row,rawLabel:row.label,sourceCode:row.code};
  if(!entry.evidence.some(e=>e.sourceId===proof.sourceId&&e.locator===proof.locator))entry.evidence.push(proof);
  if(audit.codeConflicts.some(c=>c.code===row.code)&&!entry.issues.some(i=>i.classification==='source-code-collision'&&i.sourceId===source.id))entry.issues.push({classification:'source-code-collision',sourceId:source.id,sourceCode:row.code});
  claimed.add(entity.id);registry.cascadeRecords[key]=entity.id;resolved.set(row.code,entity.id);seenRows.set(repeatedKey,entity.id);
  registry.cascadeCodes[codeKey]??=[];
  if(!registry.cascadeCodes[codeKey].includes(entity.id))registry.cascadeCodes[codeKey].push(entity.id);
  audit.rows.push({...disposition,status:'imported',entityId:entity.id});
 }
 audit.rows.sort((a,b)=>a.row-b.row);
 // Report renames from the first application on replay as well, using retained aliases.
 audit.renames=audit.rows.filter(r=>r.status==='imported').flatMap(r=>{const e=byId.get(r.entityId).entity;return e.names?.previous&&e.names.previous!==e.name?[{id:e.id,before:e.names.previous,after:e.name,row:r.row}]:[];});
 const counts={};for(const {entity} of entries)counts[entity.kind]=(counts[entity.kind]??0)+1;
 catalog.datasetVersion='cg-reference-'+source.receivedAt+'.1';
 catalog.coverage={...catalog.coverage,reviewedAt:source.receivedAt,referenceCounts:counts,
  cascade:{sourceId:source.id,receivedAt:source.receivedAt,inputRows:source.rows.length,importedRows:audit.rows.filter(r=>r.status==='imported').length,duplicateRows:audit.rows.filter(r=>r.status==='duplicate').length,collectionTiers:audit.rows.filter(r=>r.status==='collection-tier').length,unresolvedRows:audit.rows.filter(r=>r.status==='unresolved'),codeConflicts:audit.codeConflicts}};
 return {catalog,registry,audit};
}
