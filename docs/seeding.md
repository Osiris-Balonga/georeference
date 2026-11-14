# PostgreSQL resource import

[Français](seeding.fr.md) · [Home](../README.md) · [Tables](formats.md#relational-tables)

Generating files, applying database changes and reading through the optional SDK are separate operations. The 1.1.0 public CLI imports Congo resource packages into separate business tables. It does not run an arbitrary SQL download or infer an application's existing schema.

## Preview, then apply

Generate a JSON or NDJSON resource package and set `DATABASE_URL` outside tracked files:

```sh
npx 242places@1.2.0 generate --format ndjson --output ./exports/congo-seed
npx 242places@1.2.0 seed --package ./exports/congo-seed --create-schema
npx 242places@1.2.0 seed --package ./exports/congo-seed --create-schema --apply
```

Without `--apply`, the importer only previews changes. `--create-schema` permits creating the configured business tables when applying; it does not silently add columns to existing incompatible tables. Human CSV/XLSX, GeoJSON, SQL scripts and SQLite exports are not seeder inputs. Metadata/audit files are never imported as places.

Use `--sql-config FILE` for the same naming configuration as SQL export:

```json
{
  "schema": "public",
  "tables": {
    "communes": "cities",
    "neighborhoods": "quarters"
  }
}
```

```sh
npx 242places@1.2.0 seed --package ./exports/congo-seed --sql-config ./sql-names.json --create-schema
npx 242places@1.2.0 seed --package ./exports/congo-seed --sql-config ./sql-names.json --create-schema --apply
```

Names change all related generated table/foreign-key references consistently. They do not map columns or arbitrary local primary keys. Review the configuration and preview before applying to an application database.

## Updates and transactions

- UUIDs identify matching rows. Default `--mode upsert` inserts missing resources and can update supplied source-managed values.
- Identical replay must create no duplicates or artificial row updates. UUIDs are not regenerated per import.
- `--mode insert-only` retains existing matching UUID rows.
- Missing resources never mean deletion. A partial geographic export is not an instruction to synchronize away application data.
- Required parents must be included and relationships must be valid. A quartier may belong directly to a commune, arrondissement or urban community.
- Apply uses a database transaction and a dedicated PostgreSQL session with an import lock. Failure rolls back the transaction; the new business-table path does not promise the legacy batch/checkpoint protocol.

Schema creation is separate from migration. An existing `cities` table with integer local IDs does not become compatible by changing its configured name. Create a reviewed migration/integration or a compatible separate schema before importing; do not replace application primary keys automatically. Managed value updates are not automatic reconciliation of local edits.

The public business-table command accepts `--package`, `--apply`, `--create-schema`, `--mode` and `--sql-config`. Legacy single-table `--mapping`, `--table`, batch/revision/checkpoint flags are not silently interpreted by this new path. Existing low-level canonical seeder code remains a compatibility component, not the contract of these new packages.

## SQL files are another delivery path

`sql-postgres` generates `schema.sql` and `data.sql`. Review/apply schema before data with your PostgreSQL tools. `--schema-mode data-only` assumes compatible tables already exist. Script generation itself never connects to a database.

PostgreSQL scripts are not universal SQL. MySQL/MariaDB and SQLite SQL scripts are not supported dialects in this revision. Ready-to-query SQLite is a separate artifact. A checksum proves file integrity, not correct source geography or a trusted sender. Consult the actual CI results for engine verification and [migration](migration.md) before replacing previous exports.
