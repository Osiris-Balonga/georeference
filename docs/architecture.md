# Architecture and adapters

[Français](architecture.fr.md) · [Home](../README.md)

```text
Canonical input / GeoNames text
              ↓
        validation → versioned SQLite snapshot
                              ↓
              geographic selection + ancestor resolution
                              ↓
                   canonical entity iterator
                              ↓
                         format adapter
                              ↓
             data files + compression + manifest
                              ↓
                    verified export package

Export package → validation → import plan → PostgreSQL adapter → target database
Local snapshot → read SDK → application lookups/iteration
```

The shared contract lives in `src/types.ts`. Core rules own identifiers, graph integrity, selection, and projected geometry. Adapters own encoding and format-specific validation. The export coordinator owns temporary output, packaging, checksums, and publication. The seeder owns database update semantics; the SDK owns read access, not database synchronization.

The `ExportAdapter` contract declares `format`, `version`, `validate(request)`, and `write(context)`. Its context includes a repeatable canonical entity iterator, resolved plan, output directory, and optional cancellation signal. A writer returns relative filenames after closing its handles. It must reject unsupported combinations before producing output and preserve stable IDs.

Adding a format means implementing that contract, registering it, and writing behavior/reader compatibility tests. Geographic filtering and identifier allocation do not move into the new writer. Adapter registration is static in V1; there is no arbitrary plugin execution or marketplace. Heavy native geospatial dependencies are not required for existing formats.

## Resource behavior

Snapshots use SQLite rather than forcing every export to load the source file again. Iterators let flat writers process records progressively; hierarchical output and some import paths require bounded materialization. A single polygon can still be large. Cancellation, output cleanup, and atomic publication belong to the coordinator; applications embedding the library decide their job scheduling and storage limits.

V1 does not include a hosted job queue, dashboard, SDK remote service, or universal source reconciliation engine. Such services can wrap the library without changing the entity contract. Do not infer an operational capacity guarantee from a streaming API: measure the chosen dataset, writer, concurrency, and deployment.

## Version boundaries

Dataset version, contract version, adapter version, and package version have different meanings. Source revisions and checksums make provenance visible. The same logical selection should preserve values and IDs; byte-identical regeneration across different binary libraries or compression tools is a separate guarantee.
