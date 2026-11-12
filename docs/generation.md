# Generate files in your project

[Français](generation.fr.md) · [Home](../README.md)

Use Node.js 24.18.x and npm. Run the tool once from your target project. To use a local build instead, build the repository and replace `npx georeference` with `node /path/to/georeference/dist/cli.js`.

```sh
npx georeference
npx georeference countries --country FR,CG --format csv --output ./data/countries
npx georeference countries --format sqlite --output ./data/countries-db
npx georeference countries --source-file ./sources/countryInfo.txt --output ./data/offline
```

No command means country generation: download GeoNames `countryInfo.txt` over HTTPS, then create `./data/georeference/entities.json` and `manifest.json`. JSON contains `{ metadata, entities }`; use your application's own JSON reader. `npx` caches the executable and its dependencies outside the project. Your `package.json`, lockfile, and project dependencies are untouched. Generated files require no GeoReference runtime installation.

`--output` is a **new directory**, not a filename. Existing destinations are refused, including repeated generation. Generate into another directory, then review/replace application data yourself. Generation never seeds a database. All six [export formats](formats.md) are available; CSV uses the documented machine profile. Keep the manifest with the data for attribution, versions, and checksums.

The default source supplies country names, codes, and stable IDs, without coordinates or boundaries. For richer data, use an existing snapshot:

```sh
npx georeference generate --snapshot ./sources/world.sqlite --types locality --country CG --coordinates --format ndjson --output ./data/places
npx georeference countries --snapshot ./sources/world.sqlite --boundaries --format geojson --output ./data/borders
```

`countries` selects countries only; `generate` accepts type/subdivision filters on the snapshot. Without a snapshot both use countryInfo. GeoJSON requires geometry flags and preserves unavailable geometry as null. An exported SQLite database differs from an internal snapshot; see [formats](formats.md).

Downloads have a 30-second timeout and a 2 MiB source limit. Connection failures fail generation; `--source-file` uses a retained GeoNames file offline. There is no silent stale-data fallback or persistent data cache. Dataset versions derive from source SHA-256, so changed upstream bytes produce a new version. Retain the source file and generator version to reproduce output. Temporary downloads/snapshots are cleaned up after success or failure. Generated metadata/manifests retain GeoNames attribution and CC BY 4.0; preserve them when redistributing data. See [sources](data-sources.md).

The [SDK](getting-started.md#optional-sdk) is optional for applications that want to query a local snapshot. File generation does not need it.
