import {join} from 'node:path';
import {stringify} from 'csv-stringify/sync';
import {writeFile} from 'node:fs/promises';
import {writeXlsx} from './xlsx.ts';
import {RESOURCE_NAMES,definitions} from './model.ts';
import type {ResourceName,ResourceTables,ResourceRow} from './model.ts';
import type {ExportRequest} from '../types.ts';

const frNames=['Pays','Départements','Communes','Districts','Arrondissements','Communautés urbaines','Communautés rurales','Quartiers','Villages'];
const enNames=['Countries','Departments','Communes','Districts','Arrondissements','Urban communities','Rural communities','Neighborhoods','Villages'];
const frFiles=['pays','departements','communes','districts','arrondissements','communautes-urbaines','communautes-rurales','quartiers','villages'];
const singularFr=['Pays','Département','Commune','District','Arrondissement','Communauté urbaine','Communauté rurale','Quartier','Village'];
const singularEn=['Country','Department','Commune','District','Arrondissement','Urban community','Rural community','Neighborhood','Village'];
export const resourceLabel=(name:ResourceName,language:'fr'|'en'='fr'):string=>(language==='fr'?frNames:enNames)[RESOURCE_NAMES.indexOf(name)]!;
const ancestors:Record<ResourceName,ResourceName[]>={countries:[],departments:['countries'],communes:['departments','countries'],districts:['departments','countries'],arrondissements:['communes','departments','countries'],urbanCommunities:['districts','departments','countries'],ruralCommunities:['districts','departments','countries'],neighborhoods:['arrondissements','communes','urbanCommunities','departments','countries'],villages:['ruralCommunities','urbanCommunities','districts','departments','countries']};
function humanTable(tables:ResourceTables,resource:ResourceName,request:ExportRequest):{headers:string[];rows:string[][]}{
 const fr=request.language!=='en',singular=fr?singularFr:singularEn;
 const index=new Map(RESOURCE_NAMES.flatMap(name=>tables[name].map(row=>[row.id,{row,resource:name}] as const)));
 const headers=[singular[RESOURCE_NAMES.indexOf(resource)]!,...ancestors[resource].map(name=>singular[RESOURCE_NAMES.indexOf(name)]!)];
 if(resource==='countries')headers.push('ISO 2','ISO 3');
 if(request.includeIds)headers.push('ID');
 if(request.coordinates)headers.push('Longitude','Latitude');
 // Human cells stay scalar, including supplied boundaries represented as WKT-like JSON text only on explicit request.
 if(request.boundaries)headers.push(fr?'Frontière (GeoJSON)':'Boundary (GeoJSON)');
 const rows=[...tables[resource]].sort((a,b)=>a.name.localeCompare(b.name,request.language??'fr')||a.id.localeCompare(b.id)).map(row=>{
  const labels=new Map<ResourceName,string>();let current:{row:ResourceRow;resource:ResourceName}|undefined={row,resource};
  while(current){labels.set(current.resource,current.row.name);const key:string|undefined=definitions[current.resource].parentFields.find(key=>current!.row[key]!==null);current=key?index.get(current.row[key] as string):undefined;}
  const values=[row.name,...ancestors[resource].map(name=>labels.get(name)??'')];
  if(resource==='countries')values.push(String(row.iso2),String(row.iso3));if(request.includeIds)values.push(row.id);
  if(request.coordinates){const point=row.coordinates as {longitude:number;latitude:number}|null|undefined;values.push(point?String(point.longitude):'',point?String(point.latitude):'');}
  if(request.boundaries)values.push(row.boundary?JSON.stringify(row.boundary):'');return values;
 });return {headers,rows};
}
export async function writeHumanCsv(tables:ResourceTables,directory:string,request:ExportRequest,signal?:AbortSignal):Promise<string[]>{
 const files:string[]=[];
 for(const [i,resource] of RESOURCE_NAMES.entries()){
  signal?.throwIfAborted();const {headers,rows}=humanTable(tables,resource,request);const path=(request.language==='en'?resource:frFiles[i])+'.csv';
  // This is a consultation profile. Protect formula-like strings instead of silently treating data as spreadsheet code.
  const safe=(value:string)=>/^[\s]*[=+\-@\t\r\n]/.test(value)?"'"+value:value;
  await writeFile(join(directory,path),stringify([headers,...rows.map(row=>row.map(safe))],{bom:true,record_delimiter:'\r\n'}),{flag:'wx'});files.push(path);
 }return files;
}
export async function writeWorkbook(tables:ResourceTables,directory:string,request:ExportRequest,signal?:AbortSignal):Promise<string[]>{
 const fr=request.language!=='en';
 const information={name:'Informations',headers:fr?['Informations','Description']:['Information','Description'],rows:[[fr?'Référentiel':'Reference',fr?'République du Congo (CG/COG)':'Republic of Congo (CG/COG)'],[fr?'Couverture':'Coverage',fr?'Partielle ; les listes ne constituent pas un recensement exhaustif.':'Partial; these lists are not an exhaustive census.'],[fr?'Données absentes':'Missing data',fr?'Une feuille vide signale un manque de données, pas une absence sur le terrain.':'An empty sheet is a data gap, not proof that places do not exist.'],[fr?'Sources et dates':'Sources and dates','README.txt']]};
 const sheets=[information,...RESOURCE_NAMES.map((resource,i)=>({name:(fr?frNames:enNames)[i]!,...humanTable(tables,resource,request)}))];
 await writeXlsx(join(directory,'congo.xlsx'),sheets,signal);return ['congo.xlsx'];
}
