# GeoReference

[Français](README.fr.md) · [Getting started](docs/getting-started.md) · [Formats](docs/formats.md) · [Contributing](CONTRIBUTING.md)

Versioned geographic datasets, portable exports, and repeatable database seeding.

GeoReference generates geographic data files directly in your project. Run the CLI once, keep the generated files, and use them without a GeoReference runtime dependency. An optional TypeScript SDK supports applications that want to query local snapshots.

## What V1 provides

- One-command country generation from GeoNames, with offline input and geographic filtering.
- Validated, versioned SQLite snapshots from canonical JSON/NDJSON or local GeoNames text files.
- Selection by country, subdivision descendants, and entity type, with required ancestors included by default.
- Independent inclusion of point coordinates and polygon/multipolygon boundaries.
- JSON (flat or hierarchical), NDJSON, CSV, PostgreSQL SQL, SQLite, and GeoJSON exports.
- Export manifests with provenance, request options, entity counts, and SHA-256 file checksums; gzip and ZIP packaging.
- PostgreSQL seeding with a preview by default, explicit apply, managed-field updates, stable identifiers, and resumable batches.
- A local read SDK with country/subdivision lookups and locality iteration.

The default command downloads GeoNames country information; the repository itself ships software and a small **synthetic** example. Other geographic coverage depends on your input sources. GeoNames data is CC BY 4.0; the MIT software license does not change dataset licenses.

## Try it locally

Use Node.js **24.18.x** and npm. The npm distribution is pending publication; the intended one-shot workflow is:

```sh
npx georeference
npx georeference countries --country FR,CG --format csv --output ./data/countries
```

The first command creates `data/georeference/entities.json` and `manifest.json`. JSON contains `{ metadata, entities }`. `--output` is a new directory, not a filename. The CLI preserves existing destinations and does not edit your package manifest, lockfile, or dependencies. `npx` downloads/caches the tool outside the project; your application reads the generated files directly. See [one-shot generation](docs/getting-started.md) for offline use and all six formats.

To run this revision from source:

```sh
git clone https://github.com/Osiris-Balonga/georeference.git
cd georeference
npm ci
npm run build
node dist/cli.js
```

Export output directories must be new. Start with the [complete guide](docs/getting-started.md) for GeoNames ingestion, PostgreSQL seeding, and SDK usage.

## Optional SDK

Only applications that want the snapshot query API need `npm install georeference` after publication. Generating JSON, CSV, or other files does not require adding that dependency. See the [SDK example](docs/getting-started.md#optional-sdk).

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
| [One-shot generation](docs/generation.md) | [Génération en une commande](docs/generation.fr.md) |
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
