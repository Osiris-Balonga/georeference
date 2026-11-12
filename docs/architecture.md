# Architecture and adapters

[Français](architecture.fr.md) · [Home](../README.md)

```text
One-shot CLI → bundled, dated Congo reference
              ↓
CG-only scope + coverage + per-entity provenance
              ↓
        validation → versioned SQLite snapshot
                              ↓
              kind/geographic selection + ancestor resolution
                              ↓
                   canonical entity iterator
                              ↓
                         format adapter
                              ↓
             data + coverage/provenance + compression + manifest
                              ↓
                    verified export package

Export package → validation → import plan → PostgreSQL adapter → target database
Local snapshot → read SDK → application lookups/iteration
```

The shared contract lives in `src/types.ts`. Core rules own identifiers, graph integrity, selection, and projected geometry. Adapters own encoding and format-specific validation. The export coordinator owns temporary output, packaging, checksums, and publication. The seeder owns database update semantics; the SDK owns read access, not database synchronization.

The one-shot CLI orchestrator uses the bundled Congo reference without a geographic download, creates a temporary snapshot and delegates to the export coordinator. Explicit custom snapshots must also contain only CG data and retain their own partial coverage. It owns cleanup, not a persistent project installation. Generated data files are standalone; importing the SDK remains optional. See [generation](generation.md).

`entityType` supplies generic internal storage classes; `kind` preserves commune, arrondissement, neighborhood, and other administrative meanings. The internal contract can support future extensions, but this product ships Congo data exclusively. Parent validation supports the documented variable-depth hierarchy. Coverage/provenance sidecars are manifest entries with `role: 'metadata'`, excluded from geographic seeding payloads. File verification checks integrity, not whether geography is exhaustive or legally current.

The `ExportAdapter` contract declares `format`, `version`, `validate(request)`, and `write(context)`. Its context includes a repeatable canonical entity iterator, resolved plan, output directory, and optional cancellation signal. A writer returns relative filenames after closing its handles. It must reject unsupported combinations before producing output and preserve stable IDs.

Adding a format means implementing that contract, registering it, and writing behavior/reader compatibility tests. Geographic filtering and identifier allocation do not move into the new writer. The library's `registerExportAdapter(adapter)` accepts a custom format string for the current process; duplicate registrations and overriding built-in formats are rejected. The CLI lists the built-in formats; custom writers are registered by application code. Heavy native geospatial dependencies are not required for existing formats.

## Register a custom writer

This application-level example exports one stable ID per line and refuses tree or geometry requests, since this format deliberately contains IDs only:

```ts
import { open } from 'node:fs/promises';
import { join } from 'node:path';
import { Snapshot, exportSnapshot, registerExportAdapter } from 'georeference';

registerExportAdapter({
  format: 'entity-ids',
  version: '1.0.0',
  validate(request) {
    if (request.layout === 'hierarchical' || request.coordinates || request.boundaries) {
      throw new Error('entity-ids supports flat IDs without geometry');
    }
  },
  async write({ plan, directory, signal }) {
    const file = await open(join(directory, 'ids.txt'), 'wx');
    try {
      for (const entity of plan.entities()) {
        signal?.throwIfAborted();
        await file.write(entity.id + '\n');
      }
    } finally {
      await file.close();
    }
    return ['ids.txt'];
  },
});

const snapshot = Snapshot.open('./data/congo.sqlite');
try {
  await exportSnapshot(snapshot, 'exports/entity-ids', { format: 'entity-ids' });
} finally {
  snapshot.close();
}
```

Return relative filenames after closing resources. The coordinator supplies manifest generation, integrity checks, compression, cancellation, and atomic publication to the custom format too. A custom format is not automatically a supported seeder input.

## Release selection plans

`Snapshot.select()` returns a plan whose `entities()` iterator can be read repeatedly until disposal. Lower-level callers must release the plan's temporary selection resources after use:

```ts
import { Snapshot } from 'georeference';

const snapshot = Snapshot.open('./data/congo.sqlite');
try {
  const plan = snapshot.select({ countries: ['CG'] });
  try {
    for (const entity of plan.entities()) console.log(entity.id);
  } finally {
    plan.dispose?.();
  }
} finally {
  snapshot.close();
}
```

Keep the snapshot open while using the plan. The export coordinator and read SDK release their own plans automatically; consumers directly calling `select()` own that lifecycle.

## Resource behavior

Snapshots use SQLite rather than forcing every export to load the source file again. Iterators let flat writers process records progressively; hierarchical output and some import paths require bounded materialization. A single polygon can still be large. Cancellation, output cleanup, and atomic publication belong to the coordinator; applications embedding the library decide their job scheduling and storage limits.

V1 does not include a hosted job queue, dashboard, SDK remote service, or universal source reconciliation engine. Such services can wrap the library without changing the entity contract. Do not infer an operational capacity guarantee from a streaming API: measure the chosen dataset, writer, concurrency, and deployment.

## Version boundaries

Dataset version, contract version, adapter version, and package version have different meanings. Source revisions and checksums make provenance visible. The same logical selection should preserve values and IDs; byte-identical regeneration across different binary libraries or compression tools is a separate guarantee.
