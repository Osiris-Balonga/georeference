# Getting started

[Français](getting-started.fr.md) · [Home](../README.md)

## Build and create a snapshot

Requirements: Node.js 24.18.x, npm, and disk space for snapshots/exports. PostgreSQL is needed only for seeding into PostgreSQL. SQLite support comes from Node's built-in `node:sqlite` module.

```sh
npm ci
npm run build
node dist/cli.js --help
node dist/cli.js snapshot --input examples/sample.ndjson --metadata examples/metadata.json --output data/example.sqlite
node dist/cli.js inspect --snapshot data/example.sqlite
```

The included entities are fictional. The metadata file specifies `contractVersion`, `datasetVersion`, and `sources`; each source declares `name`, `url`, `license`, `attribution`, and `revision`. Input entities have stable `id`, `entityType`, `name`, `countryId`, and `parentId`. Optional fields are `codes`, localized `names`, administrative `level`, `coordinates`, and Polygon/MultiPolygon `boundary`.

Countries refer to themselves through `countryId` and have `parentId: null`. Every other parent must exist in the snapshot. Coordinate objects use named `longitude` and `latitude`; GeoJSON positions use `[longitude, latitude]`. Creating a snapshot validates the graph and geometry. Supply a new output path rather than overwriting an existing snapshot.

## Select and export

```sh
node dist/cli.js export --snapshot data/example.sqlite --country XZ --types locality --coordinates --format ndjson --compression gzip --output exports/localities
node dist/cli.js verify --package exports/localities
node dist/cli.js export --snapshot data/example.sqlite --subdivision example:region --format json --layout hierarchical --output exports/region-tree
node dist/cli.js export --snapshot data/example.sqlite --format geojson --coordinates --boundaries --output exports/map-layers
```

Country filters accept stable IDs or country codes. Multiple IDs/types use comma-separated values. Subdivision filters include descendants by administrative membership; they do not perform spatial intersection. Required ancestors are added by default and reported as context. `--no-ancestors` makes references outside the selection explicit; an importer must resolve them in the target.

Coordinates and boundaries are excluded unless requested. Missing geometry stays missing; the manifest reports coverage. A requested format/layout combination must be supported; consult [formats](formats.md).

Export packages contain `manifest.json` and data files. Verification checks file integrity. Preserve the manifest when sharing files. Gzip compresses each payload inside the directory; the package reader decompresses it. With ZIP, the output directory contains an outer manifest and `package.zip`; the archive contains the payload files and an inner manifest. Verify the original directory for archive integrity, then extract `package.zip` to a **new directory** and verify/seed that extracted directory. Compression is transport packaging, not a new data contract.

## Use real GeoNames inputs

Download the desired files from [GeoNames exports](https://download.geonames.org/export/dump/), retain their license, and extract any ZIP archives yourself. Then ingest local text files:

```sh
node dist/cli.js geonames --countries data/countryInfo.txt --admin1 data/admin1CodesASCII.txt --admin2 data/admin2Codes.txt --places data/cities1000.txt --version geonames-2026-11-11 --output data/geonames.sqlite
```

Only `--countries`, `--version`, and `--output` are mandatory. The importer does not fetch data from the network. It accepts GeoNames populated-place records, not every feature class. Each supplied file receives a SHA-256 provenance revision. See [source coverage and limitations](data-sources.md).

## Seed PostgreSQL

Export normalized JSON, NDJSON, or CSV, then preview before applying:

```sh
node dist/cli.js export --snapshot data/example.sqlite --format ndjson --coordinates --output exports/seed
node dist/cli.js seed --package exports/seed --create-schema
node dist/cli.js seed --package exports/seed --create-schema --apply
```

Set `DATABASE_URL` in your shell or secret manager before running the seed commands. Do not put credentials in tracked files or exported packages. The commands above target the standard schema; existing application tables require an explicit mapping. See [seeding](seeding.md) for revision ordering, field ownership, and recovery.

## Read through the SDK

After building, use the library from the repository or a locally packed/installed package:

```ts
import { Snapshot, createClient } from '@osiris-balonga/georeference';

const snapshot = Snapshot.open('data/example.sqlite');
try {
  const client = createClient(snapshot);
  console.log(client.getEntity('example:locality'));
  console.log(client.getCountry('example:country'));
} finally {
  snapshot.close();
}
```

The SDK reads the local snapshot and does not synchronize an application database. Keep the snapshot open while iterating and close it when finished. The package is not assumed to be published on npm; build/install from this repository.
