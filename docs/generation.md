# Generate Congo reference files

[Français](generation.fr.md) · [Congo coverage](congo-reference.md) · [Home](../README.md)

This guide describes the Congo-only revision planned for 1.1.0. Until publication, npm 1.0.0 keeps the older behavior. Use a checkout of this revision with Node.js 24.18.x, `npm ci`, and `npm run build`; the examples run that local build. After release, `npx georeference` can replace `node dist/cli.js`.

## Bundled data by default

```sh
node dist/cli.js
node dist/cli.js generate --format ndjson --compression gzip --output ./data/congo
node dist/cli.js departments --format csv --output ./data/congo-departments
node dist/cli.js communes --output ./data/congo-communes
```

No command means generation of the bundled Congo reference, not a country-list download. The default JSON package contains `entities.json`, `coverage.json`, `provenance.json`, and `manifest.json` in `./data/georeference/`. JSON uses `{ metadata, entities }`; your application's own JSON reader is sufficient. No database is modified and no dependency added to the target project.

`--output` is a **new directory**, not a filename. Existing paths are refused. Generate elsewhere and review changes before replacing application data. All six [formats](formats.md) use the same reference. Gzip/ZIP package data and metadata; keep the corresponding manifest and coverage/provenance when sharing an export.

## Select administrative kinds

| Command | Selected `kind` |
|---|---|
| `countries` | `country` — the Republic of the Congo only |
| `departments` | `department` |
| `communes`, `cities` | `commune` (`cities` is an alias, not all populated places) |
| `districts` | `district` |
| `arrondissements` | `arrondissement` |
| `neighborhoods` | `neighborhood` |
| `villages` | `village`, where a named source record has been curated |
| `generate` | All selected reference entities |

`generate` and advanced `export` also accept `--kinds department,commune` (comma-separated `kind` values). A semantic command such as `neighborhoods` fixes its own kind. `countries` remains compatible with a supplied country-only snapshot lacking `kind`.

Required ancestors may appear as context, so a payload's row count need not equal the number of selected neighborhoods. Coverage separates reference/export counts from geographic completeness.

```sh
node dist/cli.js arrondissements --city Brazzaville --output ./data/brazzaville-arrondissements
node dist/cli.js neighborhoods --city Brazzaville --arrondissement 2 --format csv --output ./data/bacongo-neighborhoods
node dist/cli.js neighborhoods --city Pointe-Noire --output ./data/pointe-noire-neighborhoods
```

`--city` resolves a stored commune ID or name. `--arrondissement` resolves an ID/name; a bare number requires `--city` because numbers recur between communes. Filters follow verified descendants, not proximity or name similarity. Observation dates still apply after filtering. Missing/ambiguous input must not quietly select a different parent.

Country filters accept `CG`, `COG`, or the stored Congo ID `geonames:2260494`. Other countries are rejected, including `CD`/`COD` (Democratic Republic of the Congo). This CLI does not offer a global dataset.

## Geometry and custom Congo inputs

Coordinates and boundaries remain independent options. Requesting them cannot create unavailable geometry. GeoJSON may contain null geometries; consult coverage and [format limits](formats.md).

Advanced users may supply `--snapshot ./sources/congo.sqlite` instead of the bundle. It must contain only CG data. The legacy `--source-file ./sources/countryInfo.txt` path supplies Congo's country record only; it is not a city/neighborhood source. Custom inputs have their own partial coverage and do not inherit the bundle's observations.

The default geographic reference needs no network. npm may need a connection to obtain the executable through `npx`. No background geographic refresh or silent upstream fallback occurs. Keep the generator version and source revision to reproduce a published package.

The [optional SDK](getting-started.md#optional-sdk) is for applications wanting a local snapshot API. Reading generated files does not require it.
