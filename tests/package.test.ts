import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSnapshot, Snapshot } from '../src/snapshot.ts';
import { exportSnapshot } from '../src/export.ts';
import { verifyPackage, readPackage } from '../src/package.ts';
import type { SnapshotMetadata, Entity } from '../src/types.ts';
import { createHash } from 'node:crypto';

const metadata:SnapshotMetadata={contractVersion:'1.0',datasetVersion:'synthetic-1',sources:[{name:'Synthetic',url:'https://example.org',license:'MIT',attribution:'Synthetic fixture',revision:'1'}]};
const entities:Entity[]=[{id:'001',entityType:'country',name:'Example, "one"',parentId:null,countryId:'001'},{id:'null',entityType:'locality',name:'Étoile',parentId:'001',countryId:'001',coordinates:{longitude:1,latitude:2}}];
async function fixture(t:{after(fn:()=>Promise<void>):void}) {
  const folder=await mkdtemp(join(tmpdir(),'georeference-package-'));
  await createSnapshot(join(folder,'source.sqlite'),metadata,entities);
  const snapshot=Snapshot.open(join(folder,'source.sqlite'));
  t.after(async()=>{snapshot.close();await rm(folder,{recursive:true,force:true});});
  return {folder,snapshot};
}

test('coverage sidecars are checksummed metadata and do not become imported geographic records',async t=>{
  const {folder,snapshot}=await fixture(t);const directory=join(folder,'with-coverage');
  const manifest=await exportSnapshot(snapshot,directory,{format:'ndjson',compression:'gzip'},{geographicCoverage:'partial',sidecars:()=>({'coverage.json':{status:'partial',reason:'Synthetic coverage assertion'}})} as never);
  const report=manifest.files.find(file=>file.path==='coverage.json.gz');assert.ok(report);
  assert.equal((report as typeof report&{role:string}).role,'metadata');
  assert.equal((manifest as typeof manifest&{geographicCoverage:string}).geographicCoverage,'partial');
  assert.equal((await readPackage(directory)).entities.length,2);
  await writeFile(join(directory,report.path),'changed');await assert.rejects(readPackage(directory),/checksum|integrity/i);
});
test('metadata sidecar paths cannot escape or replace geographic payloads',async t=>{
  const {folder,snapshot}=await fixture(t);
  for(const path of ['../escape.json','manifest.json','entities.json']) {
    await assert.rejects(exportSnapshot(snapshot,join(folder,'bad-'+path.length),{format:'json'},{sidecars:()=>({[path]:{}})} as never),/path|sidecar|reserved|collision/i);
  }
});
test('gzip NDJSON packages verify and preserve string IDs, null parent, and requested coordinates',async t=>{
  const {folder,snapshot}=await fixture(t); const path=join(folder,'out');
  const manifest=await exportSnapshot(snapshot,path,{format:'ndjson',coordinates:true,compression:'gzip'});
  assert.equal(manifest.count,2); assert.equal(manifest.files[0]?.path.endsWith('.gz'),true);
  const loaded=await readPackage(path); assert.deepEqual(loaded.entities,entities);
  assert.equal((await verifyPackage(path)).contentId,manifest.contentId);
});
test('normalized CSV round-trips null and literal null identifiers without losing leading zeros',async t=>{
  const {folder,snapshot}=await fixture(t); const path=join(folder,'csv');
  await exportSnapshot(snapshot,path,{format:'csv'});
  const read=await readPackage(path);
  assert.equal(read.entities[0]?.id,'001'); assert.equal(read.entities[0]?.parentId,null);
  assert.equal(read.entities[1]?.id,'null'); assert.equal(read.entities[1]?.parentId,'001');
  assert.equal(read.entities[1]?.coordinates,undefined);
});
test('exports have deterministic content identity, detect tampering, and reject path traversal',async t=>{
  const {folder,snapshot}=await fixture(t);
  const a=await exportSnapshot(snapshot,join(folder,'a'),{format:'json',coordinates:false});
  const b=await exportSnapshot(snapshot,join(folder,'b'),{coordinates:false,format:'json'});
  assert.equal(a.contentId,b.contentId);
  await writeFile(join(folder,'a',a.files[0]!.path),'corrupt');
  await assert.rejects(verifyPackage(join(folder,'a')),/checksum|integrity/i);
  const malicious={...b,files:[{...b.files[0]!,path:'../source.sqlite'}]};
  await writeFile(join(folder,'b','manifest.json'),JSON.stringify(malicious));
  await assert.rejects(verifyPackage(join(folder,'b')),/path/i);
});
test('unsupported options and cancellation never publish partial directories',async t=>{
  const {folder,snapshot}=await fixture(t); const path=join(folder,'out');
  await assert.rejects(exportSnapshot(snapshot,path,{format:'ndjson',layout:'hierarchical'}),/layout|hierarch/i);
  await assert.rejects(access(path));
  const controller=new AbortController(); controller.abort();
  await assert.rejects(exportSnapshot(snapshot,path,{format:'json'},{signal:controller.signal}),/abort/i);
  await assert.rejects(access(path));
});
test('hierarchical JSON can be read as canonical records and spreadsheet profiles cannot seed',async t=>{
  const {folder,snapshot}=await fixture(t);
  await exportSnapshot(snapshot,join(folder,'tree'),{format:'json',layout:'hierarchical'});
  const read=await readPackage(join(folder,'tree')); assert.equal(read.entities.length,2); assert.equal(read.entities[1]?.parentId,'001');
  await exportSnapshot(snapshot,join(folder,'spreadsheet'),{format:'csv',spreadsheetSafe:true});
  await assert.rejects(readPackage(join(folder,'spreadsheet')),/spreadsheet|consultation/i);
});
test('invalid option values are refused before generating an export',async t=>{
  const {folder,snapshot}=await fixture(t);
  await assert.rejects(exportSnapshot(snapshot,join(folder,'bad'),{format:'sql-postgres',schemaMode:'dataOnly'} as never),/schemaMode/i);
  await assert.rejects(exportSnapshot(snapshot,join(folder,'bad'),{format:'sql-postgres',sqlMode:'insertOnly'} as never),/sqlMode/i);
  await assert.rejects(exportSnapshot(snapshot,join(folder,'bad'),{format:'json',layout:'tree'} as never),/layout/i);
});
test('import rejects cross-country parent relationships even when checksums are valid',async t=>{
  const {folder,snapshot}=await fixture(t);const directory=join(folder,'malformed');
  const manifest=await exportSnapshot(snapshot,directory,{format:'ndjson'});
  const malformed=[entities[0],{id:'other',entityType:'country',name:'Other',countryId:'other',parentId:null},{...entities[1],parentId:'other',coordinates:undefined}];
  const text=malformed.map(entity=>JSON.stringify(entity)).join('\n')+'\n';
  await writeFile(join(directory,manifest.files[0]!.path),text);
  manifest.count=3;manifest.counts.country=2;manifest.files[0]!.bytes=Buffer.byteLength(text);manifest.files[0]!.sha256=createHash('sha256').update(text).digest('hex');
  await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest));
  await assert.rejects(readPackage(directory),/country|parent/i);
});
test('manifest metadata cannot be changed without invalidating its content identity',async t=>{
  const {folder,snapshot}=await fixture(t);const directory=join(folder,'identity');
  const manifest=await exportSnapshot(snapshot,directory,{format:'json'});
  manifest.datasetVersion='forged-version';
  await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest));
  await assert.rejects(readPackage(directory),/identity|contentId/i);
});
test('exports reject manifests exceeding the documented reader limit before publication',async t=>{
  const {folder}=await fixture(t);
  const large={...metadata,sources:[{...metadata.sources[0]!,attribution:'x'.repeat(1024*1024)}]};
  await createSnapshot(join(folder,'large.sqlite'),large,entities);
  const snapshot=Snapshot.open(join(folder,'large.sqlite'));
  try {
    await assert.rejects(exportSnapshot(snapshot,join(folder,'large-out'),{format:'json'}),/manifest.*limit|manifest.*MiB/i);
    await assert.rejects(access(join(folder,'large-out')));
  } finally {snapshot.close();}
});
test('export failure against an existing destination does not retain a selection plan',async t=>{
  const {folder,snapshot}=await fixture(t),directory=join(folder,'exists');
  await exportSnapshot(snapshot,directory,{format:'json'});
  const select=snapshot.select.bind(snapshot);let pending=0;
  snapshot.select=(selection)=>{pending++;const plan=select(selection);const dispose=plan.dispose;plan.dispose=()=>{pending--;dispose?.();};return plan;};
  await assert.rejects(exportSnapshot(snapshot,directory,{format:'json'}),/exists/);
  assert.equal(pending,0);
});
