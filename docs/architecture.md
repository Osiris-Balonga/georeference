# Architecture, API and adapters

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
Domain resources → indexed read-only catalog → Fastify HTTP API / optional SDK
```

The public model separates countries, departments, communes, districts, arrondissements, communities, neighborhoods and villages. It preserves documented variable parentage. A same-name department and commune are different resources; the model does not force an arrondissement where evidence establishes a direct commune parent.

## Stable identity and representations

A versioned identity registry assigns UUIDs once. Names and source codes are not recomputed into new identifiers on each export. API-facing resources, JSON and database outputs share the same logical UUIDs. Human lists use place names and hide IDs by default. Source-specific identifiers remain provenance, not public primary keys.

`toResourceTables` projects validated internal entities to typed resource tables. `exportResources` is the public resource export path; `readResourcePackage` validates supported resource packages and their identity. Internal canonical snapshots and legacy adapters/seeding remain compatibility components. Their generic entity dump is not the new CLI default and must not be mistaken for the public resource contract.

The source repository includes a Fastify API application in a private npm workspace, backed by these resources. The published `242places@1.2.1` CLI continues to generate standalone files; it does not start the API. HTTP queries, generated data and an optional installed SDK are separate consumption choices. Database import remains an explicit write action. See the [API guide](api.md) for local setup and the HTTP contract; no public hosting address is implied.

## Shared core and private HTTP application

```text
reference/
  congo.json                  dated facts and evidence
  identities.json             persistent UUID registry
src/
  cli.ts                      standalone generation command
  client.ts                   optional local SDK
  domain/
    types.ts                  concrete geographic resource types
    model.ts                  conversion and integrity validation
    catalog.ts                validated read-only catalog and indexes
    query.ts                  search, pagination and relationships
    export.ts                 existing export coordinator
    ...                       database and format components
apps/api/
  package.json                private HTTP workspace and dependencies
  src/
    app.ts                    application factory, independent of listening
    server.ts                 configuration, startup and shutdown wiring
    config.ts                 validated environment configuration
    shutdown.ts               bounded signal-driven shutdown
    plugins/                  security, errors and OpenAPI
    schemas/                  shared HTTP resource/envelope schemas
    routes/                   administration, places, reference and health
    http/cache.ts             conditional HTTP caching
  tests/                      HTTP behavior and server lifecycle
tests/                        shared core and existing CLI/import tests
```

One root npm lockfile installs the public core package and the private API workspace. Fastify, TypeBox and HTTP plugins belong to the API package, not the CLI's production dependencies. Core builds and public package generation remain independent of the API build. The API build compiles the shared core first. This boundary is checked with the packed CLI as well as repository tests.

The domain owns geographic rules. `catalog.ts` builds a validated indexed view of the reference; `query.ts` implements deterministic search, bounds and direct/descendant relationships. Routes translate a validated HTTP request into these queries and return the public envelope. They do not implement a second set of parent rules or read files on every request.

The server loads and validates the bundled Congo reference once before accepting traffic. The current dataset fits in memory. Requests use that immutable version until a new service delivery replaces it; no database server, mutable refresh process or remote fetch is required for consultation. A storage-backed catalog can be considered when writes, administration or larger spatial workloads justify it.

## HTTP boundaries

`buildApp` constructs Fastify separately from the listening server so tests can inject requests without opening a port. TypeBox schemas define query validation, response serialization, TypeScript inference and OpenAPI documentation. The core's source/data integrity validation stays independent of HTTP. Fastify response schemas expose named business fields rather than internal evidence objects.

List routes are bounded and paginated. Detail and relationship routes verify typed UUIDs. A commune can own a neighborhood directly or through an arrondissement; the commune neighborhood route finds real descendants without changing the stored direct parent. The API keeps same-name communes and departments distinct. Empty results describe known data, not geographic absence.

Successful data responses include dataset/coverage metadata and conditional caching. Errors and health probes are not cached. Public browser access has no credentials; per-process rate limiting, explicit proxy trust, safe errors and restrained structured logs bound the HTTP surface. Health/readiness and graceful shutdown support an ordinary Node service. Deployment settings and HTTPS termination must be chosen for the actual host.

The `/v1` contract, API software version and reference `datasetVersion` are separate. The service exposes the deployed reference and does not claim to host all historical datasets. Ordinary place responses stay small; dataset and coverage endpoints provide the explanatory metadata. Source anomalies do not become selectable places, and missing coordinates or boundaries are not inferred.

HTTP export generation is not part of this query service. The existing CLI handles custom formats and the importer handles database writes. If downloadable exports are later exposed over HTTP, prepare versioned artifacts with the existing coordinator and serve those bounded files rather than doing arbitrary synchronous export work per request.

## Verification

Shared catalog tests cover identities, typed parentage, search, pagination and direct/descendant selection. API tests cover the complete commune/arrondissement/neighborhood flow, request rejection, empty versus missing resources, envelopes, cache, limits and documentation. A real-server check covers startup and lifecycle. Existing export/import tests remain in place; API/export/source parity checks protect UUID consistency. Behavior changes use a meaningful failing test before implementation; documentation uses direct command/link checks. See [contributing](../CONTRIBUTING.md).

## Adding a format

Keep identifiers, geographic selection and parent rules in the shared model. A writer owns serialization, naming and representation loss. The coordinator owns temporary output, file safety, checksums, compression and publishing a completed directory. Human-readable headers/relations belong to presentation adapters; SQL quoting and constraints belong to database adapters.

A new format needs reader/interoperability tests and clear unsupported-option rejection. Its addition must not introduce a new geographic rule inside its writer. The low-level `ExportAdapter`/`registerExportAdapter` extension contract is retained for canonical compatibility; registration there alone does not add a public business-resource CLI format. Built-in public formats are explicit and documented.

Register a business writer through `registerResourceAdapter({ format, version, validate, write })`. Its `write(tables, context)` receives validated domain resources and returns relative filenames; `exportResources` handles packaging without a coordinator change. Registration is process-local in SDK integrations, not automatic CLI plugin installation. Built-in names cannot be replaced.

The write-only XLSX adapter creates SpreadsheetML parts and uses the existing ZIP dependency, with fixed archive dates and literal string cells. ExcelJS 4.4.0 (MIT) is a development-only independent reader for interoperability tests. Its UUID helper is overridden to 11.1.1 to resolve the advisory affecting the older test dependency. No ExcelJS runtime is distributed with the CLI; the identity registry uses Node's UUID generator independently.

## Import is not export

The database importer owns write policy, schema compatibility, transaction boundaries and concurrency. It consumes verified JSON/NDJSON resources, not the human CSV/XLSX layout. SQL schema generation, applying a migration and importing a dataset remain distinct actions. The public business-table path is not an arbitrary ORM/local-key mapper.

Default packages carry a readable coverage summary. Detailed audit information is opt-in and has metadata role; it never becomes application place rows. Integrity verification cannot certify a complete/current geographic inventory. See [coverage](congo-reference.md), [formats](formats.md) and [migration](migration.md).

## Public frontend

The private apps/web workspace adds Next.js, shadcn/ui and URL-driven exploration. A small supervisor runs Next.js and loopback Fastify behind one public origin. Server pages reuse the immutable catalog; interactive discovery uses the API. See [website architecture](website.md).
