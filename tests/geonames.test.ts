import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { importGeoNames } from '../src/sources/geonames.ts';

const country = ['XZ', 'XZZ', '999', 'XZ', 'Example Republic', 'Example Capital', '100', '1000', 'ZZ', '.xz', 'EXD', 'Example Dollar', '000', '', '', 'en', '900001', '', ''].join('\t');
const admin1 = 'XZ.01\tFirst Region\tFirst Region\t900002\n';
const admin2 = 'XZ.01.001\tFirst District\tFirst District\t900003\n';
const place = ['900004', "Harbor d'Été", 'Harbor', '', '-4.25', '15.5', 'P', 'PPL', 'XZ', '', '01', '001', '', '', '1200', '', '', 'Etc/UTC', '2026-01-01'].join('\t');

async function fixture(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'georeference-geonames-'));
  try {
    await writeFile(join(directory, 'countries.txt'), '# synthetic countryInfo\n' + country + '\n');
    await writeFile(join(directory, 'admin1.txt'), admin1);
    await writeFile(join(directory, 'admin2.txt'), admin2);
    await writeFile(join(directory, 'places.txt'), place + '\n');
    await run(directory);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('GeoNames conversion preserves numeric source identity, hierarchy, Unicode and coordinate order', async () => {
  await fixture(async directory => {
    const result = await importGeoNames({countryInfo:join(directory,'countries.txt'), admin1:join(directory,'admin1.txt'), admin2:join(directory,'admin2.txt'), places:join(directory,'places.txt')}, {datasetVersion:'2026.01'});
    assert.equal(result.entities.length, 4);
    const [countryEntity, region, district, locality] = result.entities;
    assert.deepEqual(countryEntity, {id:'geonames:900001', entityType:'country', name:'Example Republic', countryId:'geonames:900001', parentId:null, codes:{iso2:'XZ',iso3:'XZZ',geonames:'900001'}});
    assert.equal(region?.parentId, 'geonames:900001');
    assert.equal(district?.parentId, 'geonames:900002');
    assert.equal(locality?.parentId, 'geonames:900003');
    assert.equal(locality?.name, "Harbor d'Été");
    assert.deepEqual(locality?.coordinates, {longitude:15.5,latitude:-4.25});
    assert.equal(result.metadata.contractVersion, '1.0');
    assert.equal(result.metadata.datasetVersion, '2026.01');
    assert.equal(result.metadata.sources.length, 4);
    assert.ok(result.metadata.sources.every(source => source.license === 'CC-BY-4.0' && source.attribution.includes('GeoNames')));
    assert.equal(result.metadata.sources[1]?.revision, 'sha256:' + createHash('sha256').update(admin1).digest('hex'));
    assert.equal(locality?.boundary, undefined);
  });
});

test('country-only input remains usable without manufacturing administrative or geometry data', async () => {
  await fixture(async directory => {
    const result = await importGeoNames({countryInfo:join(directory,'countries.txt')}, {datasetVersion:'one-country'});
    assert.equal(result.entities.length, 1);
    assert.equal(result.entities[0]?.coordinates, undefined);
    assert.equal(result.metadata.sources.length, 1);
  });
});

test('places use nearest supplied ancestor and ignore non-populated features', async () => {
  await fixture(async directory => {
    await writeFile(join(directory,'places.txt'), place + '\n' + place.replace('900004','900005').replace('\tP\tPPL\t','\tT\tMT\t') + '\n');
    const result = await importGeoNames({countryInfo:join(directory,'countries.txt'), places:join(directory,'places.txt')}, {datasetVersion:'places'});
    assert.equal(result.entities.length, 2);
    assert.equal(result.entities[1]?.parentId, 'geonames:900001');
    assert.equal(result.entities[1]?.codes?.geonamesAdmin, 'XZ.01.001');
  });
});

test('duplicate IDs, nonnumeric source IDs and invalid populated-place coordinates are rejected', async () => {
  await fixture(async directory => {
    await writeFile(join(directory,'countries.txt'), country + '\n' + country + '\n');
    await assert.rejects(importGeoNames({countryInfo:join(directory,'countries.txt')}, {datasetVersion:'bad'}), /duplicate/i);
    await writeFile(join(directory,'countries.txt'), country.replace('900001','not-an-id') + '\n');
    await assert.rejects(importGeoNames({countryInfo:join(directory,'countries.txt')}, {datasetVersion:'bad'}), /geoname.*id/i);
    await writeFile(join(directory,'countries.txt'), country + '\n');
    await writeFile(join(directory,'places.txt'), place.replace('-4.25','-94.25') + '\n');
    await assert.rejects(importGeoNames({countryInfo:join(directory,'countries.txt'), places:join(directory,'places.txt')}, {datasetVersion:'bad'}), /coordinate/i);
  });
});

test('unknown country references and empty versions fail with actionable errors', async () => {
  await fixture(async directory => {
    await writeFile(join(directory,'places.txt'), place.replace('\tXZ\t','\tXY\t') + '\n');
    await assert.rejects(importGeoNames({countryInfo:join(directory,'countries.txt'), places:join(directory,'places.txt')}, {datasetVersion:'bad'}), /country.*XY/i);
    await assert.rejects(importGeoNames({countryInfo:join(directory,'countries.txt')}, {datasetVersion:''}), /version/i);
  });
});
