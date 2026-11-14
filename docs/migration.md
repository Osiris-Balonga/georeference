# Move to the resource export contract

[Français](migration.fr.md) · [Home](../README.md) · [Formats](formats.md)

## Moving to 242Places

The product is now 242Places. Use `npx 242places` for files, or install `242places` only when using the optional SDK. Imports use `242places` and `242places/seeding`. Default generation now writes to `./data/242places`; an explicit `--output` keeps your chosen location. Earlier published versions retain the `georeference` package name so existing installations remain available. Stable UUIDs, dataset versions, resource fields, HTTP `/v1` routes and internal snapshot/import-ledger names are preserved by this rename. Existing generated files are not rewritten.

## Earlier export contract

Version 1.1.0 deliberately changes public output from npm 1.0.0 and earlier development exports. Keep existing files/backups, generate into a new directory and compare before replacing application data.

| Earlier output | New resource output |
|---|---|
| Mixed `entities.json` / `entities.csv` | Separate category JSON arrays or human CSV files |
| Generic `kind`, `parentId` fields | Named resources and explicit relationships |
| Source-style `geonames:` / `cg:` identities | Persisted UUID identities |
| One `georeference_entities` SQL table | Separate configurable business tables |
| Large default coverage/provenance reports | Human `README.txt`; detailed `--audit` when requested |
| Legacy single-table import options | Business-table importer with explicit limited options |

The factual reference remains dated and partial. Changing representation does not add missing neighborhoods, villages or geometry.

## Preserve identities when migrating

The bundled `reference/identities.json` registry maps prior stored identities to UUIDs assigned once. Renaming a display label must preserve its assigned UUID. Do not generate random IDs on each import or build associations from names alone. Same-name departments/communes/districts remain distinct.

Existing databases need a reviewed mapping/migration from old keys to these UUIDs, including dependent application rows. The new SQL naming configuration is not that migration. Do not run generated data against a former generic table or an incompatible same-name table and expect automatic conversion.

## Update consumers

Load category arrays directly, such as `communes.json`, rather than expecting a top-level `entities` wrapper. Replace generic `parentId` filtering with explicit fields for the category, such as `communeId` on arrondissements and `arrondissementId` on neighborhoods. Also handle direct commune/urban-community neighborhood parents.

Use JSON/NDJSON resource packages for business-table imports. Human CSV/XLSX are lists, even when UUIDs are included. Preserve the manifest and README with exported files. Detailed audit data is metadata, not an extra collection to seed.

## Compatibility boundaries

Canonical snapshot APIs/legacy helpers remain lower-level compatibility components. They do not make old packages interchangeable with the new public resource files. An exported SQLite business database is not a canonical snapshot.

The new public path requires typed UUID resources with their ancestors included. It does not silently convert unsupported untyped records, omit parents, or restore the old mixed hierarchical JSON layout. Use the source contract and a deliberate migration for custom data.

No automatic MongoDB migration, arbitrary local-key remapping or HTTP API is included. See [database import](seeding.md) and [architecture](architecture.md).
