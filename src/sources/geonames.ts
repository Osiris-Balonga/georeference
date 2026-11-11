import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import type { DataSource, Entity, SnapshotMetadata } from '../types.ts';

export interface GeoNamesPaths {
  countryInfo: string;
  admin1?: string;
  admin2?: string;
  places?: string;
}

/** Ingest unzipped local GeoNames files. Records/maps are retained in memory. */
export async function importGeoNames(
  paths: GeoNamesPaths,
  options: { datasetVersion: string },
): Promise<{ metadata: SnapshotMetadata; entities: Entity[] }> {
  if (!options.datasetVersion.trim()) throw new Error('A nonempty dataset version is required');
  const entities: Entity[] = [];
  const identifiers = new Set<string>();
  const countries = new Map<string, string>();
  const subdivisions = new Map<string, string>();
  const sources: DataSource[] = [];

  function add(entity: Entity) {
    if (identifiers.has(entity.id)) throw new Error(`Duplicate GeoNames ID: ${entity.id}`);
    identifiers.add(entity.id);
    entities.push(entity);
  }

  function countryId(code: string) {
    const id = countries.get(code);
    if (!id) throw new Error(`Unknown country code ${code}; include its countryInfo record`);
    return id;
  }

  async function consume(path: string, label: string, minimum: number, onRow: (row: string[]) => void) {
    const stream = createReadStream(path);
    const hash = createHash('sha256');
    stream.on('data', chunk => hash.update(chunk));
    const lines = createInterface({input:stream,crlfDelay:Infinity});
    let lineNumber = 0;
    try {
      for await (const line of lines) {
        lineNumber++;
        if (!line.trim() || line.startsWith('#')) continue;
        const row = line.split('\t');
        if (row.length < minimum) throw new Error(`Expected at least ${minimum} tab-separated columns`);
        try { onRow(row); }
        catch (error) { throw new Error(`${label}:${lineNumber}: ${(error as Error).message}`, {cause:error}); }
      }
    } finally { lines.close(); stream.destroy(); }
    sources.push({
      name:`GeoNames ${label}`,
      url:label === 'populated places' ? 'https://download.geonames.org/export/dump/' : `https://download.geonames.org/export/dump/${label}`,
      license:'CC-BY-4.0',
      attribution:'GeoNames — https://www.geonames.org/ — Creative Commons Attribution 4.0',
      revision:`sha256:${hash.digest('hex')}`,
    });
  }

  await consume(paths.countryInfo, 'countryInfo.txt', 17, row => {
    const code = row[0]!;
    if (!/^[A-Z]{2}$/.test(code)) throw new Error(`Invalid country code ${code}`);
    if (countries.has(code)) throw new Error(`Duplicate country code ${code}`);
    const id = sourceId(row[16]!);
    countries.set(code, id);
    add({id,entityType:'country',name:requiredName(row[4]!),countryId:id,parentId:null,codes:{iso2:code,iso3:row[1]!,geonames:row[16]!}});
  });
  if (!countries.size) throw new Error('countryInfo.txt contains no country records');

  for (const [path, level, label] of [[paths.admin1,1,'admin1CodesASCII.txt'],[paths.admin2,2,'admin2Codes.txt']] as const) {
    if (!path) continue;
    await consume(path,label,4,row => {
      const code = row[0]!;
      const parts = code.split('.');
      if (parts.length !== level + 1 || parts.some(part => !part)) throw new Error(`Invalid administrative code ${code}`);
      if (subdivisions.has(code)) throw new Error(`Duplicate administrative code ${code}`);
      const country = countryId(parts[0]!);
      const id = sourceId(row[3]!);
      const parentId = level === 2 ? subdivisions.get(parts.slice(0,2).join('.')) ?? country : country;
      add({id,entityType:'subdivision',name:requiredName(row[1]!),countryId:country,parentId,level,codes:{geonames:row[3]!,geonamesAdmin:code}});
      subdivisions.set(code,id);
    });
  }

  if (paths.places) await consume(paths.places,'populated places',19,row => {
    if (row[6] !== 'P') return;
    const countryCode = row[8]!;
    const country = countryId(countryCode);
    const id = sourceId(row[0]!);
    const admin1 = `${countryCode}.${row[10]!}`;
    const admin2 = `${admin1}.${row[11]!}`;
    const parentId = subdivisions.get(admin2) ?? subdivisions.get(admin1) ?? country;
    const latitude = Number(row[4]);
    const longitude = Number(row[5]);
    if (!row[4]?.trim() || !row[5]?.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error(`Invalid coordinates for ${id}`);
    }
    const adminCode = row[11] ? admin2 : row[10] ? admin1 : countryCode;
    add({id,entityType:'locality',name:requiredName(row[1]!),countryId:country,parentId,codes:{geonames:row[0]!,geonamesAdmin:adminCode},coordinates:{longitude,latitude}});
  });

  return {metadata:{contractVersion:'1.0',datasetVersion:options.datasetVersion,sources},entities};
}

function sourceId(value: string): string {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(`Invalid GeoNames geoname ID: ${value}`);
  return `geonames:${value}`;
}

function requiredName(value: string): string {
  if (!value.trim()) throw new Error('An entity name must not be empty');
  return value;
}
