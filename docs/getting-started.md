# Getting started

[Français](getting-started.fr.md) · [Congo reference](congo-reference.md) · [Home](../README.md)

This guide is for the upcoming Congo-only 1.1.0 revision. It does not describe the older published 1.0.0 package. Until the revised release is available, build a checkout of this revision; do not assume a default clone or npm `latest` already contains it.

## Generate files, then read them directly

Use Node.js 24.18.x and npm:

```sh
npm ci
npm run build
node dist/cli.js
node dist/cli.js verify --package ./data/georeference
```

The CLI uses the bundled Republic of the Congo reference and creates a new directory containing `entities.json`, `coverage.json`, `provenance.json`, and `manifest.json`. No geographic download or SDK installation is required. After publication, `npx georeference` offers the same entry point from a target project; npm may download the tool itself.

Your application can load `entities.json` with its own reader. The top level is `{ metadata, entities }`. Preserve the coverage/provenance files and manifest alongside it: row count is not a guarantee of complete geographic coverage. See [generation](generation.md) for kind selectors, commune/arrondissement filters, compression, and [reference coverage](congo-reference.md) for dated gaps.

## Select real administrative units

```sh
node dist/cli.js communes --output ./data/congo-communes
node dist/cli.js arrondissements --city Brazzaville --output ./data/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Brazzaville --arrondissement 2 --output ./data/bacongo-neighborhoods
node dist/cli.js departments --country CG --format csv --output ./data/congo-departments
```

`cities` is an alias for `communes`. An arrondissement number requires its commune through `--city`. Country scope is CG/COG only; CD/COD identifies a different country and is rejected. Keep source-observation dates when displaying a selected neighborhood; filtering does not make a 2022 observation a complete 2026 inventory.

## Optional: prepare a local Congo snapshot

To query the bundled reference through the optional SDK, create an internal snapshot directly:

```sh
node dist/cli.js snapshot --output ./data/congo.sqlite
node dist/cli.js inspect --snapshot ./data/congo.sqlite
```

No input/metadata file is required for this bundled path. `verify --package` checks file integrity; it does not certify geographic completeness or current legal status.

### Custom source input

The default generation path needs no prepared snapshot. For custom ingestion, the following files are **your own validated, real CG inputs**, not fictional files shipped as a dataset. Supply `--input` and `--metadata` together:

```sh
node dist/cli.js snapshot --input ./sources/congo.ndjson --metadata ./sources/congo-metadata.json --output ./data/congo.sqlite
node dist/cli.js inspect --snapshot ./data/congo.sqlite
node dist/cli.js export --snapshot ./data/congo.sqlite --country CG --format ndjson --compression gzip --output ./exports/congo
```

The metadata contract has `contractVersion`, `datasetVersion`, and `sources`; each source has `name`, `url`, `license`, `attribution`, and `revision`. Entities have stable `id`, `entityType`, `name`, `countryId`, and `parentId`; `kind` adds administrative meaning. Optional fields include `codes`, localized `names`, `level`, `coordinates`, and Polygon/MultiPolygon `boundary`.

`entityType` is a storage class (`country`, `subdivision`, `locality`); use `kind` to distinguish a commune, arrondissement, and neighborhood. Countries reference themselves through `countryId` and have `parentId: null`. Parents must exist and satisfy the documented hierarchy. Country identity `geonames:2260494` is preserved. Custom snapshots/CLI inputs must be Congo-only and have their own coverage/provenance; they do not inherit the bundled catalog's observations.

The ready-to-query `sqlite` export uses the relational export schema; it is not the internal snapshot file consumed by `Snapshot.open`. Coordinates use named `longitude`/`latitude`; GeoJSON positions use `[longitude, latitude]`. Missing geometry is never reconstructed from a name or guessed parent.

## Seed PostgreSQL separately

```sh
node dist/cli.js generate --format ndjson --output ./exports/congo-seed
node dist/cli.js seed --package ./exports/congo-seed --create-schema
node dist/cli.js seed --package ./exports/congo-seed --create-schema --apply
```

Set `DATABASE_URL` in your environment before seeding. Preview is the default; `--apply` writes to the database. Coverage/provenance files are metadata, not additional entity payloads. Existing managed tables need the nullable `kind` column or an explicit mapping before importing kind-bearing data. See [seeding](seeding.md) for migration, revision ordering, local keys, and recovery.

## Optional SDK

Generating files needs no `npm install georeference`. Applications choosing a local snapshot query API can build/install this revision's package, for example using the archive printed by `npm pack`. Until publication, the older npm 1.0.0 archive does not provide this revision's kind-specific methods.

```ts
import { Snapshot, createClient } from 'georeference';

const snapshot = Snapshot.open('./data/congo.sqlite');
try {
  const client = createClient(snapshot);
  console.log(client.getCountry('CG'));
  console.log(client.listCommunes());
} finally {
  snapshot.close();
}
```

`listArrondissements(communeId)` and `listNeighborhoods(parentSubdivisionId)` use stored parent identities. Their results depend on the snapshot's kinds and coverage. Keep the snapshot open while iterating and close it after use. The SDK reads data; it does not seed or synchronize an application database.

For direct access to the bundled revision, `await loadCongoReference()` (exported from `georeference`) returns its validated `metadata`, `entities`, `coverage`, per-entity `provenance`, and `issues`. This is optional application integration, independent of generating standalone files.
