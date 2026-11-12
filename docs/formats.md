# Formats, files and business tables

[Français](formats.fr.md) · [Home](../README.md) · [Full format assessment](format-decisions.md)

The unreleased 1.1.0 CLI exports selected Congo data as resources, not a mixed entity dump. UUIDs identify application records. Human lists show names by default. All formats share the reference's partial, dated coverage; no format supplies missing geography.

## Files and worksheets

| Format | Main output | Intended reader |
|---|---|---|
| `xlsx` | `congo.xlsx`, with Informations and category sheets | Excel/compatible spreadsheet applications |
| `csv` | Nine category files, even when a category has only its header | People reading tabular lists |
| `json` | Nine named files, each a formatted JSON array; empty categories are `[]` | Application JSON readers |
| `ndjson` | Nine named files, one resource object per line | Batch pipelines/resource importer |
| `sql-postgres` | `schema.sql` and `data.sql`; data-only omits the schema file | PostgreSQL |
| `sqlite` | `congo.sqlite`, containing business tables | SQLite readers |
| `geojson` | Requested point/boundary FeatureCollections | Mapping tools; geometries may be null |

All packages also contain `README.txt` and `manifest.json`. With `--audit`, detailed `coverage.json` and `provenance.json` are metadata, never seed rows.

French CSV names are `pays.csv`, `departements.csv`, `communes.csv`, `districts.csv`, `arrondissements.csv`, `communautes-urbaines.csv`, `communautes-rurales.csv`, `quartiers.csv`, and `villages.csv`. XLSX has corresponding Pays, Départements, Communes, Districts, Arrondissements, Communautés urbaines, Communautés rurales, Quartiers and Villages sheets, plus Informations. `--language en` changes human labels; it does not translate geographic names or change UUIDs.

CSV contains one table per file and cannot contain workbook tabs. Names of ancestor places replace raw relationship IDs in human lists. For example, a neighborhood row can show its name, arrondissement, commune, department and country. `--include-ids` adds UUIDs when needed. Neither these lists nor XLSX are lossless seeding inputs. Formula-like text must remain text when opened in a spreadsheet.

Application JSON/NDJSON names are `countries`, `departments`, `communes`, `districts`, `arrondissements`, `urbanCommunities`, `ruralCommunities`, `neighborhoods`, and `villages`, with the appropriate extension. Rows have `id`, `name` and explicit fields such as `departmentId` or `arrondissementId`; there is no generic `kind`/`parentId` column to interpret. These resource files are not MongoDB Extended JSON or an automatic MongoDB migration; applications choose their collection/`_id` conventions explicitly.

## Relational tables

| Default SQL table | Relationship fields |
|---|---|
| `countries` | ISO2/ISO3 codes |
| `departments` | `country_id` |
| `communes`, `districts` | `department_id` |
| `arrondissements` | `commune_id`, optional municipal `number` |
| `urban_communities`, `rural_communities` | `district_id` |
| `neighborhoods` | Exactly one documented parent: `commune_id`, `arrondissement_id`, or `urban_community_id` |
| `villages` | Exactly one documented parent: `district_id`, `rural_community_id`, or `urban_community_id` |

Every table has a UUID identity and a name. PostgreSQL uses UUID primary/foreign keys; SQLite stores UUID strings. Geometry is optional data, not an inferred location.

Supply a JSON naming configuration through `--sql-config`:

```json
{
  "schema": "public",
  "tables": {
    "communes": "cities",
    "neighborhoods": "quarters"
  }
}
```

Unspecified names keep defaults. Keys identify resources; values are table names. Names must be valid identifiers and distinct. This renames generated objects consistently; it is not an existing-column/local-key mapping or a migration. SQLite does not support a custom PostgreSQL schema.

PostgreSQL schema generation creates tables, indexes and foreign keys without dropping existing data. An existing table is not made compatible by `CREATE TABLE IF NOT EXISTS`. `data.sql` uses stable-UUID upserts by default; `--sql-mode insert-only` retains existing matching rows. Omitted rows are never deletion instructions. See [database import](seeding.md).

## Packaging and limits

`--compression none|gzip|zip` controls packaging. ZIP carries an inner manifest: extract into a new directory before resource import. Integrity verification checks received bytes, not the source's authority or exhaustive coverage. Failed/cancelled generation must not publish a partial destination.

The public resource path requires included parents and rejects mixed hierarchical entity output. Text JSON can be large; NDJSON is suitable for batch processing. Keep source revisions, generator version and finished artifacts when reproducing data. Binary bytes may vary across tool versions even when UUIDs/values are unchanged.

MySQL/MariaDB SQL, SQLite SQL scripts, generated TypeScript modules, YAML, Parquet, GeoParquet, GeoPackage and Shapefile remain evaluated future adapters, not advertised V1 outputs. A file extension cannot establish standards compliance. See [format decisions](format-decisions.md).
