import fs from 'node:fs/promises';
import {mergeCascade} from './lib/cascade.mjs';
import {validateCongoReference} from '../src/congo.ts';

const root=new URL('../',import.meta.url),read=async path=>JSON.parse(await fs.readFile(new URL(path,root),'utf8'));
const source=await read('reference/sources/administrative-cascade.json');
const input=await read('reference/congo.json'),registry=await read('reference/identities.json');
const metadata={id:source.id,name:'Republic of Congo administrative cascade supplied by the maintainer',
 url:'https://github.com/Osiris-Balonga/georeference/blob/feature/administrative-cascade/reference/sources/administrative-cascade.json',
 license:'NOASSERTION — factual geographic records supplied by the maintainer; upstream reuse terms unspecified',
 attribution:'Public-administration contact, as confirmed by the maintainer; personal attribution withheld',
 revision:'sha256:'+source.sha256};
if(!input.sources.some(s=>s.id===source.id))input.sources.push(metadata);
const result=mergeCascade(input,registry,source);
result.catalog.coverage.notes=[
 'Partial factual reference enriched with the administrative cascade supplied by the maintainer on '+source.receivedAt+'.',
 'Source observation/effective dates are unknown; receipt date is not an observation date.',
 'Code collisions preserve distinct named places with separate stable UUIDs.',
 'Same-name singleton arrondissement tiers are represented as commune collections, without inventing subdivisions.',
 'Unresolved parent codes, unnamed quarters and untyped center labels remain in the source audit.',
 'Legacy records absent from the supplied cascade are preserved; absence does not establish deletion.',
 'No coordinates or boundaries are inferred.'
];
const byId=new Map(result.catalog.entries.map(e=>[e.entity.id,e.entity]));
const within=(entity,id)=>{let e=entity;while(e){if(e.id===id)return true;e=byId.get(e.parentId);}return false;};
result.catalog.coverage.communes=result.catalog.entries.filter(e=>e.entity.kind==='commune').map(({entity:c})=>({
 id:c.id,name:c.name,status:'partial',namedNeighborhoods:result.catalog.entries.filter(e=>e.entity.kind==='neighborhood'&&within(e.entity,c.id)).length,
 arrondissements:result.catalog.entries.filter(e=>e.entity.kind==='arrondissement'&&e.entity.parentId===c.id).length,
 observationDates:input.coverage.communes?.find(e=>e.id===c.id)?.observationDates??[]
}));
validateCongoReference(result.catalog);
const outputs={'reference/congo.json':result.catalog,'reference/identities.json':result.registry,'reference/cascade-audit.json':result.audit};
for(const [path,data] of Object.entries(outputs)){
 const bytes=JSON.stringify(data,null,2)+'\n';
 if(process.argv.includes('--check')){if(await fs.readFile(new URL(path,root),'utf8')!==bytes)throw new Error('Cascade materialization differs: '+path);}
 else await fs.writeFile(new URL(path,root),bytes);
}
console.log(JSON.stringify({datasetVersion:result.catalog.datasetVersion,counts:result.catalog.coverage.referenceCounts,
 dispositions:result.audit.rows.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),renames:result.audit.renames.length},null,2));
