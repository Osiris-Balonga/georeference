# GeoReference — Republic of the Congo

[Français](README.fr.md) · [Getting started](docs/getting-started.md) · [Formats](docs/formats.md) · [Contributing](CONTRIBUTING.md)

Get Republic of the Congo (CG/COG) geographic data as readable lists or application resources. Choose Excel category tabs, CSV files with place names, separate JSON collections, or database exports with stable UUIDs and configurable business tables. Generated files need no permanent project dependency.

Version **1.1.0** provides the Congo resource exports. Use `npx georeference@1.1.0` to select this version explicitly. Version 1.0.0 used the previous country-list output.

## Try the data

Use Node.js **24.18.x** and npm:

```sh
npx georeference@1.1.0 generate --format xlsx --output ./exports/congo-excel
npx georeference@1.1.0 neighborhoods --city Brazzaville --format csv --output ./exports/brazzaville-csv
npx georeference@1.1.0 generate --format json --output ./exports/congo-json
```

Open `congo.xlsx` for category worksheets, CSV files for readable lists, or JSON arrays such as `communes.json`, `arrondissements.json` and `neighborhoods.json` for applications. Each new output directory includes a human coverage/date summary in `README.txt` and technical integrity metadata in `manifest.json`. Detailed evidence is optional with `--audit`. Existing destinations are refused.

## Choose the output for the job

| Task | Output |
|---|---|
| Read or share spreadsheet lists | `xlsx`: category worksheets, names and readable relationships |
| Use lists in many spreadsheet tools | `csv`: one file per category, names instead of raw foreign keys by default |
| Add local data to an application | `json` or `ndjson`: separate resources, UUIDs and explicit relationships |
| Initialize PostgreSQL tables | `sql-postgres`: separate schema/data scripts, configurable table names |
| Query a local database directly | `sqlite`: ready-to-query business tables |
| Work with supplied map geometry | `geojson`: requested layers, no invented geometry |

A CSV contains one table, not tabs. Choose XLSX for a multi-sheet workbook. CSV/XLSX are presentation exports, not database seeding inputs. See [generation](docs/generation.md) and [formats](docs/formats.md).

## A dated, partial Congo reference

The curated reference contains **398 records**: 1 country, 15 departments, 16 communes, 23 arrondissements, 89 districts, 4 urban communities and 250 named neighborhoods. These are covered records, not certified national totals for every category. Observations span 2022–2025; no exhaustive current village/neighborhood inventory or geometry is claimed.

Same-name communes/departments have distinct UUIDs. A neighborhood's documented parent can be a commune, arrondissement or urban community. Empty results mean missing observations, not proof that no places exist. See [the reference and sources](docs/congo-reference.md).

## Files, database import and optional SDK

Generating files does not write to a database. The PostgreSQL importer has a read-only preview and a separate apply step; existing tables must match the selected business schema. It does not silently migrate an application or remap arbitrary existing primary keys. See [database import](docs/seeding.md).

The optional SDK exposes resources for applications choosing package integration. Its resource model prepares a future API; **this version deploys no HTTP API**. See [getting started](docs/getting-started.md) and [architecture](docs/architecture.md).

## Documentation

| English | Français |
|---|---|
| [Getting started](docs/getting-started.md) | [Prise en main](docs/getting-started.fr.md) |
| [Generation and filters](docs/generation.md) | [Génération et filtres](docs/generation.fr.md) |
| [Formats and tables](docs/formats.md) | [Formats et tables](docs/formats.fr.md) |
| [Database import](docs/seeding.md) | [Import en base](docs/seeding.fr.md) |
| [Reference and sources](docs/congo-reference.md) | [Référentiel et sources](docs/congo-reference.fr.md) |
| [Migration](docs/migration.md) | [Migration](docs/migration.fr.md) |
| [Architecture](docs/architecture.md) | [Architecture](docs/architecture.fr.md) |
| [Contributing](CONTRIBUTING.md) | [Contribuer](CONTRIBUTING.fr.md) |

## Development and license

`npm run check` runs TypeScript validation, behavior tests and build. Task PRs target `dev`; releases go from `dev` to `main`.

Code/documentation: [MIT](LICENSE), © 2026 Osiris Balonga. Source facts retain provenance and applicable terms; MIT does not relicense external publications/maps. Synthetic fixtures are tests only. See [licensing](docs/data-sources.md).
