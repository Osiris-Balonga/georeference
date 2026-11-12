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
  const created=await run(['snapshot','--input','examples/sample.ndjson','--metadata','examples/metadata.json','--output',snapshot]);
  assert.equal(JSON.parse(created.stdout).count,4);
  const exported=await run(['export','--snapshot',snapshot,'--output',output,'--format','ndjson','--types','locality','--coordinates','--compression','gzip']);
  assert.equal(JSON.parse(exported.stdout).count,4);
  const verified=await run(['verify','--package',output]);assert.equal(JSON.parse(verified.stdout).count,4);
  const generated=join(folder,'generated');
  const generation=await run(['generate','--snapshot',snapshot,'--output',generated,'--types','locality','--coordinates']);
  assert.equal(JSON.parse(generation.stdout).count,4);
  const countries=await run(['countries','--snapshot',snapshot,'--output',join(folder,'countries')]);
  assert.equal(JSON.parse(countries.stdout).count,1);
  await assert.rejects(run(['snapshot','--input','examples/sample.ndjson','--metadata','examples/metadata.json','--output',snapshot]),/exists/);
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
  await writeFile(source,row('XZ','XZZ','Synthetic country','101')+'\n'+row('XY','XYY','Other country','102')+'\n');
  const invoke=(args:string[])=>exec(process.execPath,[cli,...args],{cwd:folder,maxBuffer:1024*1024});
  // No subcommand: the default flow generates JSON into data/georeference.
  const result=await invoke(['--source-file',source,'--country','XZ']);
  assert.equal(JSON.parse(result.stdout).count,1);
  const document=JSON.parse(await readFile(join(folder,'data/georeference/entities.json'),'utf8'));
  assert.equal(document.entities[0].id,'geonames:101');assert.equal(document.entities[0].name,'Synthetic country');
  await invoke(['verify','--package','data/georeference']);
  assert.equal(await readFile(join(folder,'package.json'),'utf8'),packageText);
  assert.equal(await readFile(join(folder,'package-lock.json'),'utf8'),lockText);
  assert.deepEqual((await readdir(folder)).sort(),['countryInfo.txt','data','package-lock.json','package.json']);
  await assert.rejects(invoke(['countries','--source-file',source]),/exists/);
  await invoke(['countries','--source-file',source,'--format','csv','--output','data/csv']);
  assert.match(await readFile(join(folder,'data/csv/entities.csv'),'utf8'),/Synthetic country/);
  await assert.rejects(invoke(['countries','--source-file',source,'--format','yaml','--output','data/bad']),/Unsupported export format/);
  await assert.rejects(invoke(['countries','--source-file',source,'--snapshot','missing.sqlite','--output','data/mixed']),/source-file.*snapshot|snapshot.*source-file/);
});
