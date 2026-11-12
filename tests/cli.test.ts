import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp,rm,readFile,writeFile,readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
const exec=promisify(execFile);
const cli=resolve('src/cli.ts');
const run=(args:string[])=>exec(process.execPath,[cli,...args],{cwd:resolve('.'),maxBuffer:1024*1024});

test('CLI executes snapshot → filtered gzip export → verification and protects destinations',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-cli-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  const snapshot=join(folder,'source.sqlite'),output=join(folder,'out');
  const created=await run(['snapshot','--input','tests/fixtures/sample.ndjson','--metadata','tests/fixtures/metadata.json','--output',snapshot]);
  assert.equal(JSON.parse(created.stdout).count,4);
  const exported=await run(['export','--snapshot',snapshot,'--output',output,'--format','ndjson','--types','locality','--coordinates','--compression','gzip']);
  assert.equal(JSON.parse(exported.stdout).count,4);
  const verified=await run(['verify','--package',output]);assert.equal(JSON.parse(verified.stdout).count,4);
  const generated=join(folder,'generated');
  const generation=await run(['generate','--snapshot',snapshot,'--output',generated,'--types','locality','--coordinates']);
  assert.equal(JSON.parse(generation.stdout).count,4);
  const countries=await run(['countries','--snapshot',snapshot,'--output',join(folder,'countries')]);
  assert.equal(JSON.parse(countries.stdout).count,1);
  await assert.rejects(run(['snapshot','--input','tests/fixtures/sample.ndjson','--metadata','tests/fixtures/metadata.json','--output',snapshot]),/exists/);
  assert.equal(JSON.parse(await readFile(join(output,'manifest.json'),'utf8')).geometry.coordinates.requested,true);
});
test('CLI help succeeds and refuses unknown options and unavailable format requests',async()=>{
  const help=await run(['--help']);assert.match(help.stdout,/GeoReference/);
  await assert.rejects(run(['export','--unknown']),/Unknown option|Unknown argument/i);
  await assert.rejects(run(['inspect','--boundaries']),/not supported|not valid|requires/i);
});

test('CLI generates country files in a consumer project without installing dependencies',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-consumer-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  const packageText='{"name":"consumer","private":true}\n';
  await writeFile(join(folder,'package.json'),packageText);
  const lockText='{"name":"consumer","lockfileVersion":3}\n';
  await writeFile(join(folder,'package-lock.json'),lockText);
  const source=join(folder,'countryInfo.txt');
  const row=(iso:string,iso3:string,name:string,id:string)=>[iso,iso3,'001','',name,'','','','','','','','','','','',id].join('\t');
  await writeFile(source,row('CG','COG','Synthetic country','101')+'\n'+row('CD','COD','Other country','102')+'\n');
  const invoke=(args:string[])=>exec(process.execPath,[cli,...args],{cwd:folder,maxBuffer:1024*1024});
  // No subcommand: the default flow generates JSON into data/georeference.
  const result=await invoke(['--source-file',source,'--country','CG']);
  assert.equal(JSON.parse(result.stdout).count,1);
  const countriesData=JSON.parse(await readFile(join(folder,'data/georeference/countries.json'),'utf8'));
  assert.match(countriesData[0].id,/^[\da-f-]{36}$/);assert.equal(countriesData[0].name,'Synthetic country');
  await invoke(['verify','--package','data/georeference']);
  assert.equal(await readFile(join(folder,'package.json'),'utf8'),packageText);
  assert.equal(await readFile(join(folder,'package-lock.json'),'utf8'),lockText);
  assert.deepEqual((await readdir(folder)).sort(),['countryInfo.txt','data','package-lock.json','package.json']);
  await assert.rejects(invoke(['countries','--source-file',source]),/exists/);
  await invoke(['countries','--source-file',source,'--format','csv','--output','data/csv']);
  assert.match(await readFile(join(folder,'data/csv/pays.csv'),'utf8'),/Synthetic country/);
  await assert.rejects(invoke(['countries','--source-file',source,'--format','yaml','--output','data/bad']),/Unsupported export format/);
  await assert.rejects(invoke(['countries','--source-file',source,'--snapshot','missing.sqlite','--output','data/mixed']),/source-file.*snapshot|snapshot.*source-file/);
});

test('CLI defaults to the bundled Congo reference and offers scoped administrative commands',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-congo-cli-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  const invoke=(args:string[])=>exec(process.execPath,[cli,...args],{cwd:folder,maxBuffer:1024*1024});
  const result=await invoke([]);assert.ok(JSON.parse(result.stdout).count>100);
  const entities=JSON.parse(await readFile(join(folder,'data/georeference/neighborhoods.json'),'utf8'));
  assert.ok(entities.some(e=>e.name==='Mpila'));
  const quarters=await invoke(['neighborhoods','--city','Brazzaville','--arrondissement','6','--country','CG','--output','quarters']);
  assert.ok(JSON.parse(quarters.stdout).count<entities.length);
  const scoped=JSON.parse(await readFile(join(folder,'quarters/neighborhoods.json'),'utf8'));
  assert.ok(scoped.some(e=>e.name==='Mpila'));assert.ok(!scoped.some(e=>e.name==='Pointe-Noire'));
  await invoke(['snapshot','--output','reference.sqlite']);
  const inspected=await invoke(['inspect','--snapshot','reference.sqlite']);assert.equal(JSON.parse(inspected.stdout).count,398);
  for(const code of ['CD','COD','FR'])await assert.rejects(invoke(['countries','--country',code,'--output','bad']),/Congo|CG/);
  assert.deepEqual((await readdir(folder)).sort(),['data','quarters','reference.sqlite']);
});

test('CLI refuses foreign snapshots and seeding packages before contacting a database',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'georeference-foreign-cli-'));t.after(()=>rm(folder,{recursive:true,force:true}));
  const {createSnapshot}=await import('../src/snapshot.ts');const {Snapshot}=await import('../src/snapshot.ts');const {exportResources:exportSnapshot}=await import('../src/domain/export.ts');
  const snapshot=join(folder,'foreign.sqlite');
  const metadata=JSON.parse(await readFile('tests/fixtures/metadata.json','utf8'));
  const foreign={id:'00000000-0000-4000-8000-000000000001',entityType:'country' as const,kind:'country' as const,name:'Synthetic foreign country',countryId:'00000000-0000-4000-8000-000000000001',parentId:null,codes:{iso2:'CD',iso3:'COD'}};
  await createSnapshot(snapshot,metadata,[foreign]);const opened=Snapshot.open(snapshot);
  const pkg=join(folder,'pkg');try{await exportSnapshot(opened,pkg,{format:'json'});}finally{opened.close();}
  await assert.rejects(run(['inspect','--snapshot',snapshot]),/Congo|CG/);
  await assert.rejects(run(['seed','--package',pkg]),/Congo|CG/);
  const input=join(folder,'foreign.json');await writeFile(input,JSON.stringify([foreign]));
  await assert.rejects(run(['snapshot','--input',input,'--metadata','tests/fixtures/metadata.json','--output',join(folder,'blocked.sqlite')]),/Congo|CG/);
  assert.ok(!(await readdir(folder)).includes('blocked.sqlite'));
});
