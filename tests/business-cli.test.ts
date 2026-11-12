import {test} from 'node:test';import assert from 'node:assert/strict';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {mkdtemp,rm,readFile,writeFile,readdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {resolve,join} from 'node:path';
const exec=promisify(execFile),cli=resolve('src/cli.ts');
test('CLI generates readable business files with explicit audit and SQL naming options',async t=>{
 const cwd=await mkdtemp(join(tmpdir(),'business-consumer-'));t.after(()=>rm(cwd,{recursive:true,force:true}));const run=(args:string[])=>exec(process.execPath,[cli,...args],{cwd,maxBuffer:2*1024*1024});
 const pkg='{"name":"consumer","private":true}\n';await writeFile(join(cwd,'package.json'),pkg);
 const result=await run([]);assert.equal(JSON.parse(result.stdout).dataModel,'resources-v1');
 const json=join(cwd,'data/georeference');assert.ok((await readdir(json)).includes('communes.json'));assert.ok(!(await readdir(json)).includes('coverage.json'));assert.ok(!(await readdir(json)).includes('entities.json'));
 await run(['neighborhoods','--city','Brazzaville','--arrondissement','6','--format','xlsx','--output','excel']);assert.ok((await readdir(join(cwd,'excel'))).includes('congo.xlsx'));
 await run(['generate','--audit','--output','audit']);assert.ok((await readdir(join(cwd,'audit'))).includes('provenance.json'));
 await writeFile(join(cwd,'tables.json'),JSON.stringify({tables:{communes:'villes',neighborhoods:'quartiers'}}));
 await run(['generate','--format','sql-postgres','--sql-config','tables.json','--output','sql']);assert.match(await readFile(join(cwd,'sql/schema.sql'),'utf8'),/"villes"/);assert.match(await readFile(join(cwd,'sql/data.sql'),'utf8'),/"quartiers"/);
 await assert.rejects(run(['generate','--no-ancestors','--output','bad']),/ancestor/);
 await assert.rejects(run(['seed','--package','audit','--revision','2']),/not supported/);
 assert.equal(await readFile(join(cwd,'package.json'),'utf8'),pkg);assert.ok(!(await readdir(cwd)).includes('node_modules'));
});
