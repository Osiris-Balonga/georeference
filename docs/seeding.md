# PostgreSQL import and seeding

[Français](seeding.fr.md) · [Home](../README.md)

The upcoming 1.1.0 CLI imports Republic of the Congo (CG/COG) packages only. Generating files, applying database changes, and reading through the optional SDK are separate operations. Coverage/provenance sidecars have manifest role `metadata` and are never geographic rows. A verified checksum proves file integrity, not complete/current geographic coverage.

## Preview, then apply

The seeder reads verified, normalized GeoReference packages, not arbitrary downloaded SQL. Use JSON, NDJSON, or the machine-profile CSV. Spreadsheet-transformed CSV, GeoJSON layers, SQL scripts, and SQLite export files are not interchangeable seeder inputs. V1 package imports are bounded to 128 MiB of uncompressed data and 500,000 records; split larger imports into measured geographic packages. Gzip is read directly; ZIP must first be extracted with its inner manifest into a new directory.

Set `DATABASE_URL` outside tracked files. For the standard GeoReference table:

```sh
node dist/cli.js seed --package ./exports/congo-seed --create-schema
node dist/cli.js seed --package ./exports/congo-seed --create-schema --apply
```

Without `--apply`, the command produces a read-only plan. `--create-schema` allows creation of the standard objects when applying; it is not permission to alter arbitrary existing application schemas. The default target is `public.georeference_entities`.

## Updates and stable identity

- Default `--mode upsert` creates missing records and updates source-managed fields that are actually present. Source values win for those fields; review this policy before importing locally edited reference fields.
- Optional fields absent from input are preserved. Coordinates/boundaries are managed only when the package requested them. An explicit null and an absent field have different meanings.
- `--mode insert-only` creates new records, skips changes to existing records, and reports conflicts. Neither mode deletes entities absent from the package.
- Replaying identical content leaves unchanged rows unchanged. It must not produce duplicates or artificial updates merely because a new import run occurred.
- Foreign keys are resolved through stable identities; required parents must be in the package or already present in the target. An external parent must be a compatible country/subdivision, never a locality. A partial geographic export is never evidence that absent entities should be removed.
- Insert-only validates new children against the existing parents actually retained when incoming parent updates are skipped. A partial UPSERT cannot move a parent to another country or change its type if retained target children would become inconsistent; include the affected subtree in the update.

The seeder uses **source-wins** for managed fields. Automatic merging of local edits, migrations, destructive synchronization, and universal ORM mappings are outside V1.

## Order new dataset revisions explicitly

Dataset version labels are opaque: `release-b` cannot be reliably compared with `2026.11`. The first import defaults to revision `0`. A changed dataset/package requires a strictly higher explicit integer revision:

```sh
node dist/cli.js seed --package ./exports/congo-updated-seed --revision 1 --apply
```

Older/equal conflicting revisions are rejected. `--allow-downgrade` is an explicit override, not a default recovery mechanism. Preserve the same revision when resuming the same interrupted import.

## Existing application keys

Use `--mapping path/to/mapping.json` for a supported mapping of canonical fields to your existing columns. For example:

```json
{
  "schema": "public",
  "table": "places",
  "localIdColumn": "id",
  "columns": {
    "id": "georeference_id",
    "entityType": "entity_type",
    "kind": "administrative_kind",
    "countryId": "country_id",
    "parentId": "parent_id"
  }
}
```

Here `id` is an existing integer serial/identity primary key, while `georeference_id` is the stable string identifier. Its uniqueness must be enforced by a real, non-partial, single-column PRIMARY KEY or UNIQUE constraint/index; a mapping declaration or a composite unique key does not suffice. The seeder preserves local IDs and maps relationships to them; it does not replace the application's primary keys. Other managed columns must have compatible names/types or explicit mappings. Preserve unrelated business columns and supply their required defaults yourself. V1's local-key mapping supports integer serial/identity keys, not every custom/composite key design.

## Existing tables and the new administrative kind

New standard tables include nullable text `kind`. Before importing kind-bearing Congo records into an older managed table, explicitly add a compatible nullable column through your reviewed migration, or map `kind` to a compatible existing column such as `administrative_kind` above. `--create-schema` does not silently alter an existing table. Existing rows can remain null until a reviewed source update supplies their kind; do not guess it from their name or storage class. Missing optional input preserves the target field; an unknown kind is not permission to invent an arrondissement parent.

## Transactions, recovery, and visibility

`--batch-size` bounds each batch (default `500`). Each batch and its recovery cursor commit together. A later failure may leave earlier batches visible; the entire import is not one atomic publication. Rerun the same package, mapping, mode, revision, and batch size to resume. A completed replay performs comparisons again so unchanged records remain unchanged.

An interrupted import must finish with the same package, mapping, mode, and batch size before a different import can start on that target. Do not switch packages or mappings to bypass a pending recovery cursor.

An advisory lock serializes imports for the same target. Library callers must supply a **dedicated connection/session**, not a pool that can switch sessions between queries. The CLI opens a dedicated PostgreSQL client. A checkpoint is useful only after its transaction has committed.

Manifests and checksums detect corruption and missing files; they are not a signature proving the sender's identity. Review provenance and mappings, and use the dry-run before applying a package to an existing application.

## Validation scope

The test suite exercises PostgreSQL semantics using PGlite and includes a `pg` integration test selected by `DATABASE_URL`. CI provisions a PostgreSQL service for that integration path. An unexecuted/skipped service test is not a tested server-version claim; consult the actual CI result for the revision being used.
