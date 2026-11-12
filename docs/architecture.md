# Architecture and adapters

[Français](architecture.fr.md) · [Home](../README.md)

```text
Dated Congo facts + persistent UUID registry
                    ↓
Validated internal snapshot and geographic selection
                    ↓
Public domain resources and explicit relationships
                    ↓
        output-specific adapters
        ├─ names and ancestor labels → CSV / XLSX
        ├─ UUID resource collections → JSON / NDJSON
        ├─ configurable relational schema/data → PostgreSQL / SQLite
        └─ supplied geometry → GeoJSON
                    ↓
README + optional audit + compression + integrity manifest

Verified resource package → preview/apply → PostgreSQL business tables
Domain resources → optional SDK / a future API contract
```

The public model separates countries, departments, communes, districts, arrondissements, communities, neighborhoods and villages. It preserves documented variable parentage. A same-name department and commune are different resources; the model does not force an arrondissement where evidence establishes a direct commune parent.

## Stable identity and representations

A versioned identity registry assigns UUIDs once. Names and source codes are not recomputed into new identifiers on each export. API-facing resources, JSON and database outputs share the same logical UUIDs. Human lists use place names and hide IDs by default. Source-specific identifiers remain provenance, not public primary keys.

`toResourceTables` projects validated internal entities to typed resource tables. `exportResources` is the public resource export path; `readResourcePackage` validates supported resource packages and their identity. Internal canonical snapshots and legacy adapters/seeding remain compatibility components. Their generic entity dump is not the new CLI default and must not be mistaken for the public resource contract.

The same resources can back a future HTTP API, but this revision implements no hosted API, endpoint service or deployment. Generated data and an optional installed SDK are separate consumption choices.

## Adding a format

Keep identifiers, geographic selection and parent rules in the shared model. A writer owns serialization, naming and representation loss. The coordinator owns temporary output, file safety, checksums, compression and publishing a completed directory. Human-readable headers/relations belong to presentation adapters; SQL quoting and constraints belong to database adapters.

A new format needs reader/interoperability tests and clear unsupported-option rejection. Its addition must not introduce a new geographic rule inside its writer. The low-level `ExportAdapter`/`registerExportAdapter` extension contract is retained for canonical compatibility; registration there alone does not add a public business-resource CLI format. Built-in public formats are explicit and documented.

## Import is not export

The database importer owns write policy, schema compatibility, transaction boundaries and concurrency. It consumes verified JSON/NDJSON resources, not the human CSV/XLSX layout. SQL schema generation, applying a migration and importing a dataset remain distinct actions. The public business-table path is not an arbitrary ORM/local-key mapper.

Default packages carry a readable coverage summary. Detailed audit information is opt-in and has metadata role; it never becomes application place rows. Integrity verification cannot certify a complete/current geographic inventory. See [coverage](congo-reference.md), [formats](formats.md) and [migration](migration.md).
