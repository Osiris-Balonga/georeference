import assert from 'node:assert/strict';import {test} from 'node:test';import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {loadCongoReference} from '../src/congo.ts';import {Snapshot,createSnapshot} from '../src/snapshot.ts';import {exportResources} from '../src/domain/export.ts';import {readResourcePackage} from '../src/domain/package.ts';
test('separated JSON/NDJSON packages round-trip with gzip and detect identity or payload tampering',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'domain-package-'));const r=await loadCongoReference();await createSnapshot(join(dir,'source.sqlite'),r.metadata,r.entities);const snapshot=Snapshot.open(join(dir,'source.sqlite'));t.after(async()=>{snapshot.close();await rm(dir,{recursive:true,force:true});});
 for(const format of ['json','ndjson']){
  const out=join(dir,format);await exportResources(snapshot,out,{format,compression:'gzip'});const loaded=await readResourcePackage(out);
  assert.equal(loaded.tables.neighborhoods.length,782);assert.equal(loaded.tables.countries[0]?.iso2,'CG');assert.ok(loaded.tables.neighborhoods.some(e=>e.name==='Mpila'));
  const path=join(out,'manifest.json');const manifest=JSON.parse(await readFile(path,'utf8'));manifest.datasetVersion='forged';await writeFile(path,JSON.stringify(manifest));await assert.rejects(readResourcePackage(out),/identity/);
 }
 const out=join(dir,'csv');await exportResources(snapshot,out,{format:'csv'});await assert.rejects(readResourcePackage(out),/JSON|NDJSON/);
});
