# Format decisions

[Français](format-decisions.fr.md) · [Supported formats](formats.md) · [Home](../README.md)

Decision record reviewed November 12, 2026.

The product scope is exclusively the Republic of the Congo. These encoding choices serve its curated, source-dated reference; no format broadens country coverage or supplies missing neighborhoods/geometries. Version 1.1.0 introduces the Congo-only resource contract; version 1.0.0 used the older country-list behavior.

This comparison explains the V1 boundary and where another adapter would be useful. **V1** means one of the seven implemented built-in formats; **later** means evaluated but unsupported by the shipped CLI. Later priorities are driven by a concrete integration request, not a promise to implement every format.

Complexity includes generation and interoperability validation: **low**, **medium**, or **high**, relative to the shared domain resource contract. Dependencies for later formats are likely categories, not installed packages or approved version choices. Data quality, coverage, and redistribution rights remain prerequisites for every format.

## Comparison

| Format | Concrete uses | Relevance to GeoReference | Generation complexity | Dependencies | Main limits | Priority |
|---|---|---|---|---|---|---|
| JSON | Application resources grouped by category | Very high for integrations | Low | Native JSON serialization and file streams | Pretty arrays improve navigation; large files can still require memory; old mixed hierarchical output is not the public contract | **V1**, `json` |
| JSON Lines / NDJSON | Batch resource import and incremental reads | Very high for pipelines | Low | Native JSON serialization and streams | One object per line in each category; metadata stays separate; a large geometry remains a large record | **V1**, `ndjson` |
| XLSX | Lists with category worksheets, spreadsheet navigation and readable relationships | Very high for the human audience | Medium | XLSX workbook writer and reader compatibility checks | Multi-sheet workbook, not a seeder package; worksheet/row limits and cell text handling require validation | **V1**, `xlsx` |
| CSV | Human-readable lists in spreadsheet tools | Very high for broad accessibility | Low to medium | `csv-stringify` | One file per category, not workbook tabs; names and ancestor labels by default; UUID option; presentation output is not seeder input | **V1**, `csv` |
| PostgreSQL SQL | Business-schema initialization and reviewable data scripts | High for application integration | Medium | SQL generator, PostgreSQL for validation; `pg` for live import | Separate schema/data scripts, configurable table names, UUID PK/FKs; schema creation is not migration; PostgreSQL only | **V1**, `sql-postgres` |
| MySQL / MariaDB SQL | Applications already using those database engines | High when recipients require them | Medium to high | Separate dialect profiles/generators and independent engine tests | DDL, quoting, collations, and UPSERT expressions vary by engine/version; shared product history does not establish compatibility | **Later**, demand-driven |
| SQLite SQL script | Reviewable textual reconstruction of a local database | Medium; overlaps with the ready-to-use SQLite file | Medium | SQLite SQL generator; SQLite engine for validation | Text loading step still needed; engine-specific typing, batch limits, and foreign-key activation; not a PostgreSQL script | **Later**, after a demonstrated script use case |
| Ready-to-use SQLite | Offline applications, local queries, database inspection | Very high for a portable, directly queryable artifact | Medium | V1 uses built-in `node:sqlite` | Requires finalization/closed handles; exported relational database differs from the internal snapshot contract; ordinary SQLite is not GeoPackage | **V1**, `sqlite` |
| TypeScript data modules | Small Congo administrative lists and compile-time imports in frontend applications | High for small subsets; low for large geometry bundles | Low to medium | Module generator and TypeScript compiler validation | Compile/bundle cost; static types do not validate arbitrary runtime input; data-as-code is not an SDK | **Later**; the read SDK is already V1 |
| YAML | Human-edited configuration and small readable fixtures | Low to medium; limited benefit over JSON for bulk transfer | Low to medium | A YAML 1.2 serializer | Scalar quoting/schema choices affect reader interpretation; inefficient for large datasets; must preserve string IDs | **Later**, if a configuration workflow needs it |
| GeoJSON | Web maps, spatial inspection, point/boundary exchange | Very high when licensed geometries exist | Medium | Native JSON output plus core geometry validation | WGS84 longitude/latitude order; verbose boundaries; separate point/boundary layers; absent geometry remains null | **V1**, `geojson` |
| Parquet | Analytics, data warehouses, selective column reads | High for substantial analytical workloads | Medium to high | A Parquet writer and codecs; Arrow-based tooling is a candidate | Binary schema, row-group sizing, reader compatibility; no enforced relational foreign keys; not a human-readable interchange | **Later**, first analytical candidate |
| GeoParquet | Spatial analytics over large point/boundary collections | High once a spatial analytics audience is established | High | Compatible Parquet/geospatial writer and a pinned GeoParquet profile | Geometry typing/encoding, CRS, metadata, and reader versions must agree; a binary geometry column alone is insufficient | **Later**, following the Parquet path |
| GeoPackage | Desktop GIS exchange, offline spatial databases, multiple layers | High for QGIS/GIS workflows | High | A conforming writer, commonly GDAL/OGR with SQLite support | OGC metadata and geometry encoding required; a renamed SQLite file is not compliant; layer/geometry rules must be validated | **Later**, preferred before Shapefile for new GIS workflows |
| Shapefile, delivered as ZIP | Older GIS pipelines that require this interchange | Low by default; high for a specific legacy recipient | High | GIS writer such as GDAL/OGR, DBF/encoding support, multifile ZIP | Traditional 10-character field names, limited attributes, possible truncation; target at most 2 GB per component for interoperability | **Later**, explicit compatibility requirement |

Format references: [NDJSON specification](https://github.com/ndjson/ndjson-spec), [CSV RFC 4180](https://www.rfc-editor.org/rfc/rfc4180), [TypeScript modules](https://www.typescriptlang.org/docs/handbook/2/modules.html), [YAML 1.2.2](https://yaml.org/spec/1.2.2/), [GeoJSON RFC 7946](https://www.rfc-editor.org/rfc/rfc7946), [Apache Parquet](https://parquet.apache.org/docs/), [GeoParquet specification](https://geoparquet.org/), [OGC GeoPackage](https://www.ogc.org/standards/geopackage/), and [GDAL Shapefile limits](https://gdal.org/en/stable/drivers/vector/shapefile.html).

## Why PostgreSQL first

One complete import path is more useful than several unverified SQL variants. PostgreSQL gives V1 an explicit conflict target through `ON CONFLICT`, transactional updates, and one engine to validate for the configurable business-table schema. This is a product scope choice, not a claim that other engines cannot support reliable seeding. See [PostgreSQL INSERT](https://www.postgresql.org/docs/current/sql-insert.html).

MySQL and MariaDB use `ON DUPLICATE KEY UPDATE`, with their own handling of unique-key conflicts and incoming values. A future adapter must pin each supported engine/version and test its quoting, collations, DDL, and update behavior separately. SQLite likewise needs its own SQL profile; foreign-key enforcement must be explicitly enabled per connection. References: [MySQL](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html), [MariaDB](https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/inserting-loading-data/insert-on-duplicate-key-update), [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html).

## Files, seeding, and SDK are separate choices

| Need | V1 answer | Why a format alone is insufficient |
|---|---|---|
| Exchange or archive a versioned snapshot | File adapter, compression, manifest, checksums | A recipient still needs a compatible reader and source license information |
| Initialize/update compatible application tables | Resource importer with preview, UUID relationships and transactions | Renaming tables does not migrate incompatible columns or map arbitrary local keys |
| Look up entities from application code | Read SDK over a local snapshot | A generated TypeScript dataset module does not supply loading/query semantics or database synchronization |

The [seeding guide](seeding.md) defines database update guarantees; the [getting-started guide](getting-started.md) shows SDK use. Adding MySQL SQL output would not automatically add a MySQL seeder. Adding TypeScript module output would not replace the SDK.

## Extending the format set

Use the [adapter architecture](architecture.md) to add encoding without moving selection rules or stable-ID handling out of the core. An adapter may use temporary/random-access storage when pure streaming is inappropriate. Specialized geospatial dependencies should remain optional to the existing lightweight path.

Before advertising a new format, identify its real recipient/reader, test versions, declared losses, geometry coverage, licensing, resource limits, and independent read-back. For GeoParquet, choose an interoperability profile from the actual reader matrix rather than assuming the newest specification is universally available; the current specification site includes version 2.0. GDAL's documented Parquet implementation describes specific supported GeoParquet profiles. References: [GeoParquet](https://geoparquet.org/), [GDAL Parquet driver](https://gdal.org/en/stable/drivers/vector/parquet.html).

For a desktop GIS audience, GeoPackage can precede Parquet; for warehouse analytics, the order can reverse. Preserve GeoReference's stable string ID as an attribute even if the target format also uses its own technical row identifier. Validate GeoPackage's required tables/encoding with a conforming reader; consult the [GDAL GeoPackage driver](https://gdal.org/en/stable/drivers/vector/gpkg.html). None of these future evaluations enables an unsupported format in the shipped V1 CLI.
