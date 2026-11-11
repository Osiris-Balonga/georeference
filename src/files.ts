import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, resolve, sep } from 'node:path';

export function safeRelativePath(path: string): void {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\') || path.split('/').some(part=>part==='..'||part==='.'||!part) || path.includes(':') || path.includes('\0')) throw new Error('Unsafe package file path');
}
export async function packageFile(directory: string, path: string): Promise<string> {
  safeRelativePath(path);
  const base=await realpath(directory); const file=resolve(base,path);
  const stat=await lstat(file); const actual=await realpath(file);
  if (!stat.isFile() || stat.isSymbolicLink() || !actual.startsWith(base+sep)) throw new Error('Unsafe package file path or symlink');
  return file;
}
export async function fileDigest(path: string): Promise<{bytes:number;sha256:string}> {
  const hash=createHash('sha256'); let bytes=0;
  for await (const chunk of createReadStream(path)) { bytes+=chunk.length;hash.update(chunk); }
  return {bytes,sha256:hash.digest('hex')};
}
