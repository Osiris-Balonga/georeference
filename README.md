# GeoReference

[Français](README.fr.md) · [Getting started](docs/getting-started.md) · [Formats](docs/formats.md) · [Contributing](CONTRIBUTING.md)

Versioned geographic datasets, portable exports, and repeatable database seeding.

GeoReference is a TypeScript library and command-line tool for building a consistent reference of countries, administrative subdivisions, and localities. Keep stable identifiers across exports, select a geographic scope, and load reference data into PostgreSQL without confusing file generation with database synchronization.

## What V1 provides

- Validated, versioned SQLite snapshots from canonical JSON/NDJSON or local GeoNames text files.
- Selection by country, subdivision descendants, and entity type, with required ancestors included by default.
- Independent inclusion of point coordinates and polygon/multipolygon boundaries.
- JSON (flat or hierarchical), NDJSON, CSV, PostgreSQL SQL, SQLite, and GeoJSON exports.
- Export manifests with provenance, request options, entity counts, and SHA-256 file checksums; gzip and ZIP packaging.
- PostgreSQL seeding with a preview by default, explicit apply, managed-field updates, stable identifiers, and resumable batches.
- A local read SDK with country/subdivision lookups and locality iteration.

This repository ships software and a small **synthetic** example. It does not ship a complete world dataset or a hosted API. Data coverage depends on the input source; the MIT software license does not change a source dataset's license.

## Try it locally

Use Node.js **24.18.x** and npm. The package is built from this repository; no npm publication is assumed.

```sh
git clone https://github.com/Osiris-Balonga/georeference.git
cd georeference
npm ci
npm run build
node dist/cli.js snapshot --input examples/sample.ndjson --metadata examples/metadata.json --output data/example.sqlite
node dist/cli.js export --snapshot data/example.sqlite --format json --country XZ --coordinates --boundaries --output exports/example-json
node dist/cli.js verify --package exports/example-json
```

Export output directories must be new. Start with the [complete guide](docs/getting-started.md) for GeoNames ingestion, PostgreSQL seeding, and SDK usage.

## Three ways to use the data

| Need | Use |
|---|---|
| Download or exchange a snapshot | Export files with a manifest |
| Initialize/update an application database | Use the PostgreSQL seeder with a reviewed update policy |
| Query reference data from application code | Use the read SDK over a local snapshot |

An SQL export is not a universal seeder. Seeding also deals with existing keys, field ownership, conflicts, revisions, transactions, and recovery. See [database import](docs/seeding.md).

## Documentation

| English | Français |
|---|---|
| [Getting started](docs/getting-started.md) | [Prise en main](docs/getting-started.fr.md) |
| [Supported formats and limits](docs/formats.md) | [Formats pris en charge et limites](docs/formats.fr.md) |
| [PostgreSQL seeding](docs/seeding.md) | [Amorçage PostgreSQL](docs/seeding.fr.md) |
| [Data sources and licenses](docs/data-sources.md) | [Sources et licences des données](docs/data-sources.fr.md) |
| [Architecture and adapters](docs/architecture.md) | [Architecture et adaptateurs](docs/architecture.fr.md) |
| [Contributing](CONTRIBUTING.md) | [Contribuer](CONTRIBUTING.fr.md) |

Public guides are maintained in both languages. API identifiers, fields, and commands stay English.

## Development

```sh
npm ci
npm run check
```

Behavior changes use tests first. Task branches target `dev`; release pull requests go from `dev` to `main`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and PostgreSQL integration checks.

## License

Software and synthetic examples: [MIT](LICENSE), © 2026 Osiris Balonga. GeoNames data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with required GeoNames attribution. Any other source keeps its own terms. Read [data licensing](docs/data-sources.md) before redistributing exports.
