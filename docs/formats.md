# Supported formats and limits

[Français](formats.fr.md) · [Home](../README.md)

Every export uses the same selected entities and stable IDs. Its manifest records the data version, provenance, options, context ancestors, external references, geometry coverage, and checksums. `--format` names are listed below.

For the uses, complexity, dependencies, limits, and priorities of all evaluated formats, read [format decisions](format-decisions.md).

| Format | V1 purpose | Layout and geometry | Limitations |
|---|---|---|---|
| `json` | General application exchange | Flat records or `--layout hierarchical`; optional coordinates/boundaries | Hierarchical output is limited to 50,000 entities; many consumers load the whole document |
| `ndjson` | Batch pipelines and seeder input | One flat entity per line; optional coordinates/boundaries | Schema/metadata live in the manifest; a single large geometry still makes a large record |
| `csv` | Spreadsheets and normalized tabular exchange | Flat records; structured fields use JSON cells | No intrinsic type system; preserve IDs as text in spreadsheet import; not a hierarchical format |
| `sql-postgres` | PostgreSQL standard-schema scripts | `--schema-mode schema-and-data` or `data-only`; `--sql-mode upsert` or `insert-only` | PostgreSQL-specific, not MySQL/MariaDB/SQLite SQL; data-only requires the compatible standard table |
| `sqlite` | A ready-to-query local database | Standalone file with relationships/indexes | Not GeoPackage or SpatiaLite; JSON geometry does not imply native spatial indexing |
| `geojson` | Point and boundary map layers | Separate point/boundary FeatureCollections when requested | WGS84 `[longitude, latitude]`; polygon boundaries are not inferred from points |

Coordinates and boundaries are separate options. Missing geometry must not become `(0,0)` or an invented polygon. Ancestor inclusion is the default for relational integrity; `--no-ancestors` declares dependencies outside the export.

CSV's machine profile preserves source values. `id`, `entityType`, `name`, and `countryId` are plain strings; `parentId` is a JSON string or `null`. Optional `codes`, `names`, `level`, `coordinates`, and `boundary` are JSON-valued cells: an empty cell means absent, literal `null` means explicitly null. Coordinate/boundary columns are omitted when not requested. `--spreadsheet-safe` is an explicit presentation profile for spreadsheet formula-like cells; do not use that transformed output as a lossless machine interchange source.

SQL creation mode creates the standard schema; it is not a migration engine. An existing table is not made compatible by `CREATE TABLE IF NOT EXISTS`. For updates to an application database use the [seeder](seeding.md), which has its own field ownership and revision policy.

## Compression and reproduction

`--compression none`, `gzip`, or `zip` controls transport packaging. Gzip payloads are read transparently. ZIP output contains `manifest.json` plus `package.zip`; the archive contains its own manifest and payloads. Verify the outer package for archive integrity; extract the ZIP to a new directory for payload verification and seeding. Completed exports are published only after generation; existing output directories are rejected. Cancellation/failure must not publish a partially complete package.

Retain published artifacts when exact bytes matter. Semantic reproducibility means the same snapshot and normalized request select the same values/IDs; binary formats and compression metadata may differ between generator/tool versions. Manifest checksums validate the artifact you received, not every possible future regeneration.

## Formats not included in V1

MySQL/MariaDB SQL, SQLite SQL scripts, generated TypeScript data modules, YAML, Parquet, GeoParquet, GeoPackage, and Shapefile are not advertised as supported. They can be added as adapters when a concrete integration needs them. A TypeScript SDK is already available; that is separate from exporting datasets as TypeScript source.

GeoPackage requires OGC metadata and geometry encoding; renaming a `.sqlite` file is insufficient. GeoParquet needs a tested version/profile, not simply a WKB column. Shapefile has restrictive field names/types and multifile packaging, so it is a compatibility target rather than the default geographic format.
