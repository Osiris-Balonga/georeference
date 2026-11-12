# GeoReference — Republic of the Congo

[Français](README.fr.md) · [Congo reference](docs/congo-reference.md) · [Getting started](docs/getting-started.md) · [Contributing](CONTRIBUTING.md)

Generate standalone files of **Republic of the Congo (Congo-Brazzaville, CG/COG)** departments, communes, districts, arrondissements, and source-observed neighborhoods. The CLI uses a bundled, curated reference with dated provenance; its default geographic data path needs no network download. Read generated files directly from your application. A runtime SDK is optional.

**Release status:** this documentation describes the upcoming **1.1.0 Congo-only revision**. It does not mean 1.1.0 is published. The previously published npm/GitHub 1.0.0 version has the older behavior; bare `npx georeference` uses that version until the correction is released. The commands below run a checkout of this revision.

## Generate from this checkout

Use Node.js **24.18.x** and npm:

```sh
npm ci
npm run build
node dist/cli.js
node dist/cli.js arrondissements --city Brazzaville --output ./data/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Pointe-Noire --format csv --output ./data/pointe-noire-neighborhoods
```

The default command creates a new `data/georeference/` directory with `entities.json`, `coverage.json`, `provenance.json`, and `manifest.json`. It leaves your package manifest, lockfile, and dependencies untouched. Existing destinations are refused. After publication of this revision, use `npx georeference` in place of `node dist/cli.js`; npm may download the executable, while the geographic reference stays bundled.

## Real data with explicit limits

The reference contains curated administrative facts, not a fictional demonstration or a world catalog. It combines government electoral observations from 2022, territorial laws from 2024, and a national registry from 2025. Those different dates are preserved. It does **not** claim every current neighborhood, village, boundary, or coordinate as of 2026.

`coverage.json` reports reference/export counts, source dates, missing named coverage, code-only/unclassified observations, and unresolved conflicts. An empty neighborhood result means no eligible named observation in this reference; it does not mean no neighborhoods exist. `provenance.json` explains the evidence for exported entities. See [coverage and sources](docs/congo-reference.md).

`kind` records administrative meaning: `department`, `commune`, `district`, `arrondissement`, `urban-community`, `rural-community`, `neighborhood`, or `village` where verified. A department and its same-name commune are separate entities. A neighborhood can belong directly to a commune, an arrondissement, or an urban community; the documented parent is preserved.

## Commands and formats

Use `generate` for the whole bundled reference or select `countries`, `departments`, `communes`, `cities` (alias for communes), `districts`, `arrondissements`, `neighborhoods`, or `villages`. Filters use stored identities and verified descendants. Country selection accepts CG/COG or the stored Congo ID; other countries, including CD/COD, are outside this product.

JSON (flat/hierarchical), NDJSON, CSV, PostgreSQL SQL, SQLite, and GeoJSON are available, with gzip/ZIP packaging. Geometry is included only when it exists; missing points and boundaries are never fabricated. See [generation](docs/generation.md) and [format limits](docs/formats.md).

## Files, database import, optional SDK

| Need | Use |
|---|---|
| Add geographic files to your application | Generate once; use your own readers |
| Initialize/update PostgreSQL | Use the seeder with preview, mapping, and update policy |
| Query a prepared local snapshot through TypeScript | Opt into the read SDK |

Generation does not seed a database. An SQL file does not handle every existing-key, field-ownership, revision, or recovery requirement. The new nullable SQL `kind` column requires an explicit schema/mapping update for existing managed tables; no silent migration occurs. See [seeding](docs/seeding.md).

## Documentation

| English | Français |
|---|---|
| [Congo reference, coverage and hierarchy](docs/congo-reference.md) | [Référentiel Congo, couverture et hiérarchie](docs/congo-reference.fr.md) |
| [Generation](docs/generation.md) | [Génération](docs/generation.fr.md) |
| [Getting started and optional SDK](docs/getting-started.md) | [Prise en main et SDK optionnel](docs/getting-started.fr.md) |
| [Formats](docs/formats.md) | [Formats](docs/formats.fr.md) |
| [PostgreSQL seeding](docs/seeding.md) | [Amorçage PostgreSQL](docs/seeding.fr.md) |
| [Sources and licensing](docs/data-sources.md) | [Sources et licences](docs/data-sources.fr.md) |
| [Architecture and adapters](docs/architecture.md) | [Architecture et adaptateurs](docs/architecture.fr.md) |
| [Contributing](CONTRIBUTING.md) | [Contribuer](CONTRIBUTING.fr.md) |

## Development and license

`npm run check` runs TypeScript validation, tests, and build. Behavior changes use tests first; task pull requests target `dev`, and release pull requests go from `dev` to `main`.

Code and documentation: [MIT](LICENSE), © 2026 Osiris Balonga. Source facts retain provenance and applicable source terms; MIT does not relicense external maps or publications. Synthetic fixtures remain tests only. See [data licensing](docs/data-sources.md).
