import type {ExportManifest} from '../types.ts';
import type {ResourceTables} from './model.ts';
import {RESOURCE_NAMES,emptyResourceTables,validateResourceTables,createResourceIdentity} from './model.ts';
import {verifyPackage,boundedText} from '../package.ts';
import {packageFile} from '../files.ts';
export async function readResourcePackage(directory:string):Promise<{manifest:ExportManifest;tables:ResourceTables}>{
 const manifest=await verifyPackage(directory);if(manifest.dataModel!=='resources-v1')throw new Error('Expected a resources-v1 package; legacy entity packages require an explicit migration');
 if(!['json','ndjson'].includes(manifest.request.format))throw new Error('Business seeding requires category JSON or NDJSON; human CSV/Excel cannot be imported');
 if(manifest.files.some(file=>file.path.endsWith('.zip')))throw new Error('Extract ZIP with its inner manifest before importing');
 const files=manifest.files.filter(file=>file.role!=='metadata');if(files.length!==RESOURCE_NAMES.length)throw new Error('Expected one file per resource category');
 const tables=emptyResourceTables();let remaining=128*1024*1024;
 for(const name of RESOURCE_NAMES){const path=name+'.'+manifest.request.format+(manifest.request.compression==='gzip'?'.gz':'');if(!files.some(file=>file.path===path))throw new Error(`Missing resource file: ${path}`);
  const text=await boundedText(await packageFile(directory,path),remaining);remaining-=Buffer.byteLength(text);
  const data=manifest.request.format==='json'?JSON.parse(text):text.split(/\r?\n/).filter(line=>line.trim()).map(line=>JSON.parse(line));
  if(!Array.isArray(data))throw new Error('Expected a resource array');tables[name]=data;
 }
 validateResourceTables(tables);const total=Object.values(tables).reduce((n,rows)=>n+rows.length,0);
 if(total>500000||total!==manifest.count)throw new Error('Resource count mismatch or limit exceeded');
 if(total&&(tables.countries.length!==1||tables.countries[0]?.iso2!=='CG'||tables.countries[0]?.iso3!=='COG'))throw new Error('Only Republic of Congo (CG/COG) is supported');
 const counts={country:tables.countries.length,locality:tables.neighborhoods.length+tables.villages.length,subdivision:total-tables.countries.length-tables.neighborhoods.length-tables.villages.length};
 if(Object.keys(counts).some(key=>counts[key as keyof typeof counts]!==manifest.counts[key as keyof typeof counts]))throw new Error('Resource category count mismatch');
 const identity=createResourceIdentity({contractVersion:'1.0',datasetVersion:manifest.datasetVersion,sources:manifest.sources},manifest.request,tables);
 if(identity!==manifest.contentId)throw new Error('Resource content identity mismatch');
 return {manifest,tables};
}
