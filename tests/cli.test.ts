import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp,rm,readFile } from 'node:fs/promises';
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
  await assert.rejects(run(['snapshot','--input','examples/sample.ndjson','--metadata','examples/metadata.json','--output',snapshot]),/exists/);
  assert.equal(JSON.parse(await readFile(join(output,'manifest.json'),'utf8')).geometry.coordinates.requested,true);
});
test('CLI help succeeds and refuses unknown options and unavailable format requests',async()=>{
  const help=await run(['--help']);assert.match(help.stdout,/GeoReference/);
  await assert.rejects(run(['export','--unknown']),/Unknown option|Unknown argument/i);
  await assert.rejects(run(['inspect','--boundaries']),/not supported|not valid|requires/i);
});
