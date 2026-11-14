import assert from 'node:assert/strict';import {test} from 'node:test';import {mkdtemp,readFile,rm,readdir} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import ExcelJS from 'exceljs';import {parse} from 'csv-parse/sync';
import {loadCongoReference} from '../src/congo.ts';import {createSnapshot,Snapshot} from '../src/snapshot.ts';import {exportResources,registerResourceAdapter} from '../src/domain/export.ts';
async function fixture(t){const dir=await mkdtemp(join(tmpdir(),'domain-export-'));const r=await loadCongoReference();await createSnapshot(join(dir,'source.sqlite'),r.metadata,r.entities);const snapshot=Snapshot.open(join(dir,'source.sqlite'));t.after(async()=>{snapshot.close();await rm(dir,{recursive:true,force:true});});return {dir,snapshot};}
test('JSON output is nine pretty category arrays with explicit UUID relationships',async t=>{
 const {dir,snapshot}=await fixture(t);const out=join(dir,'json');const manifest=await exportResources(snapshot,out,{format:'json'});
 assert.equal(manifest.dataModel,'resources-v1');assert.ok(!(await readdir(out)).includes('entities.json'));
 const text=await readFile(join(out,'neighborhoods.json'),'utf8');assert.match(text,/\n  \{/);
 const quarters=JSON.parse(text);const mpila=quarters.find(e=>e.name==='Mpila');assert.ok(mpila);assert.ok(!('kind' in mpila));assert.ok(!('parentId' in mpila));assert.match(mpila.id,/^[\da-f-]{36}$/);
 const arrs=JSON.parse(await readFile(join(out,'arrondissements.json'),'utf8'));assert.equal(arrs.find(e=>e.id===mpila.arrondissementId).name,'Talangaï');
 assert.equal(JSON.parse(await readFile(join(out,'villages.json'),'utf8')).length,3285);
});
test('human CSV uses one category per file, readable ancestor names and optional UUIDs',async t=>{
 const {dir,snapshot}=await fixture(t);const out=join(dir,'csv');await exportResources(snapshot,out,{format:'csv'});
 const text=await readFile(join(out,'quartiers.csv'),'utf8');const rows=parse(text,{columns:true,bom:true});const mpila=rows.find(e=>e.Quartier==='Mpila');
 assert.equal(mpila.Arrondissement,'Talangaï');assert.equal(mpila.Commune,'Brazzaville');assert.equal(mpila.Département,'Brazzaville');assert.ok(!/geonames:|cg:|parentId|entityType|countryId/.test(text));assert.ok(!Object.keys(mpila).includes('ID'));
 const en=join(dir,'en');await exportResources(snapshot,en,{format:'csv',language:'en',includeIds:true});const english=parse(await readFile(join(en,'neighborhoods.csv'),'utf8'),{columns:true,bom:true});assert.match(english.find(e=>e.Neighborhood==='Mpila').ID,/^[\da-f-]{36}$/);
});
test('Excel workbook reopens with named sheets, readable cells and frozen headers',async t=>{
 const {dir,snapshot}=await fixture(t);const out=join(dir,'xlsx');await exportResources(snapshot,out,{format:'xlsx'});
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile(join(out,'congo.xlsx'));
 const sheet=workbook.getWorksheet('Quartiers');assert.ok(sheet);assert.equal(sheet.getCell('A1').value,'Quartier');
 const row=sheet.getRows(2,sheet.rowCount-1).find(r=>r.getCell(1).value==='Mpila');assert.equal(row.getCell(2).value,'Talangaï');assert.equal(row.getCell(3).value,'Brazzaville');assert.equal(sheet.views[0].state,'frozen');
 assert.ok(workbook.getWorksheet('Communes'));assert.ok(workbook.getWorksheet('Villages'));assert.ok(workbook.getWorksheet('Informations'));
});
test('a resource adapter receives domain tables and can add a format without changing the coordinator',async t=>{
 const {writeFile}=await import('node:fs/promises');const {dir,snapshot}=await fixture(t);
 registerResourceAdapter({format:'names-test',version:'1.0',write:async(tables,context)=>{await writeFile(join(context.directory,'names.txt'),tables.communes.map(row=>row.name).join('\n'));return ['names.txt'];}});
 const out=join(dir,'extension');await exportResources(snapshot,out,{format:'names-test'});assert.match(await readFile(join(out,'names.txt'),'utf8'),/Brazzaville/);
 assert.throws(()=>registerResourceAdapter({format:'json',version:'1',write:async()=>[]}),/unique|reserved/);
});
test('XLSX preserves Unicode, XML characters and literal formula-like values as text',async t=>{
 const {writeXlsx}=await import('../src/domain/xlsx.ts');const {dir}=await fixture(t);
 const values=['=1+1','<quartier> & "nom"','literal_x0001_','Été\nligne suivante'];
 const path=join(dir,'literal.xlsx');await writeXlsx(path,[{name:'Lecture',headers:['Nom'],rows:values.map(value=>[value])}]);
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile(path);const sheet=workbook.getWorksheet('Lecture')!;
 // ExcelJS exposes Xstring escapes literally. Excel decodes them once, as specified by
 // https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/bd0aa042-434a-4ca7-b25f-4e1fd25a954d
 const decodeXstring=(value:string)=>value.replace(/_x([\da-f]{4})_/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
 for(const [i,value] of values.entries()){assert.equal(decodeXstring(String(sheet.getCell(i+2,1).value)),value);assert.equal(sheet.getCell(i+2,1).type,ExcelJS.ValueType.String);}
});
