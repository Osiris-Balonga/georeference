import yazl from 'yazl';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import type {Readable} from 'node:stream';

export interface WorkbookSheet {name:string;headers:string[];rows:string[][]}
const main='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationships='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function xml(value:string):string{
 return value.replace(/_x([\da-f]{4})_/gi,'_x005F_x$1_').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\r]/g,char=>'_x'+char.charCodeAt(0).toString(16).padStart(4,'0').toUpperCase()+'_').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function column(index:number):string{let value='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))value=String.fromCharCode(65+(n-1)%26)+value;return value;}
const prefix='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
/** Write-only SpreadsheetML: explicit string cells, fixed ZIP dates and no formula evaluation. */
export async function writeXlsx(path:string,sheets:WorkbookSheet[],signal?:AbortSignal):Promise<void>{
 signal?.throwIfAborted();const zip=new yazl.ZipFile();
 const add=(name:string,value:string)=>zip.addBuffer(Buffer.from(prefix+value),name,{mtime:new Date('1980-01-01T00:00:00Z')});
 const finish=pipeline(zip.outputStream,createWriteStream(path,{flags:'wx'}),{signal});
 try{
  add('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>');
  add('_rels/.rels',`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="workbook" Type="${relationships}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add('xl/workbook.xml',`<workbook xmlns="${main}" xmlns:r="${relationships}"><sheets>`+sheets.map((sheet,i)=>`<sheet name="${xml(sheet.name)}" sheetId="${i+1}" r:id="sheet${i+1}"/>`).join('')+'</sheets></workbook>');
  add('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>`<Relationship Id="sheet${i+1}" Type="${relationships}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="styles" Type="${relationships}/styles" Target="styles.xml"/></Relationships>`);
  add('xl/styles.xml',`<styleSheet xmlns="${main}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF215B44"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  for(const [i,sheet] of sheets.entries()){
   signal?.throwIfAborted();
   if(!sheet.headers.length||sheet.rows.length>1048575)throw new Error('Worksheet exceeds supported dimensions');
   const cells=[sheet.headers,...sheet.rows].map((row,r)=>{signal?.throwIfAborted();return `<row r="${r+1}" ht="${r===0?25:21}" customHeight="1">`+row.map((value,c)=>`<c r="${column(c)}${r+1}" t="inlineStr" s="${r===0?1:0}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')+'</row>';}).join('');
   const cols=sheet.headers.map((header,c)=>`<col min="${c+1}" max="${c+1}" width="${header==='ID'?40:sheet.name==='Informations'&&c===1?100:26}" customWidth="1"/>`).join('');
   add(`xl/worksheets/sheet${i+1}.xml`,`<worksheet xmlns="${main}"><dimension ref="A1:${column(sheet.headers.length-1)}${sheet.rows.length+1}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${cells}</sheetData><autoFilter ref="A1:${column(sheet.headers.length-1)}${sheet.rows.length+1}"/></worksheet>`);
  }
  zip.end();await finish;
 }catch(error){(zip.outputStream as Readable).destroy(error instanceof Error?error:undefined);await finish.catch(()=>{});throw error;}
}
