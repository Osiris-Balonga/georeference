# Data sources and licenses

[Français](data-sources.fr.md) · [Home](../README.md)

## Software is not a dataset license

GeoReference's code, documentation, and synthetic examples are MIT licensed. Third-party geographic data retains its own license and attribution requirements. An export manifest carries source metadata so recipients can retain that information. Check redistribution rights before adding or publishing any source; a working writer cannot grant rights to its input data.

## GeoNames input

The local importer accepts UTF-8, tab-separated GeoNames files:

| CLI option | Input | Coverage in this importer |
|---|---|---|
| `--countries` | `countryInfo.txt` | Country names/codes and source identifiers; required |
| `--admin1` | `admin1CodesASCII.txt` | First administrative level; optional |
| `--admin2` | `admin2Codes.txt` | Second administrative level; optional |
| `--places` | An extracted GeoNames feature file, e.g. `cities1000.txt` | Populated places (feature class `P`) and point coordinates; optional |

GeoNames publishes its extracts under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). See its [official extract documentation](https://download.geonames.org/export/dump/readme.txt) and [download directory](https://download.geonames.org/export/dump/). GeoReference records GeoNames attribution, the source URL, and a SHA-256 revision of each input file. The checksum identifies the actual local bytes, not a claim that all source files came from the same upstream date.

Download and extract files before ingestion. Keep the same downloaded files to reproduce a snapshot; assign a meaningful `--version` and do not silently replace published versions. No GeoNames username or API key is required for this offline path.

## Deliberate coverage limits

- The importer maps supplied level 1/2 administrative files; it does not claim every administrative level or every locality worldwide. Smaller city extracts are subsets.
- Missing administrative files or entries attach a locality/subdivision to its nearest supplied ancestor. The raw `geonamesAdmin` code remains available; this does not assert there are no intermediate administrative levels.
- CountryInfo alone does not provide the optional point geometries in this importer. Countries/subdivisions have no invented coordinates. Boundaries and language-tagged alternate names are not ingested by this adapter.
- The core accepts canonical polygons/multipolygons from your own appropriately licensed input. It cannot reconstruct boundaries from points or settle contested administrative claims.
- Parsing reads files progressively, but this GeoNames importer retains canonical records and lookup maps in memory before snapshot creation. It is intended for measured inputs, not an unbounded `allCountries` ingestion guarantee. Use country/size-limited inputs and measure resources.
- Duplicate IDs, malformed IDs/coordinates, and unknown country references fail ingestion. Source changes, deletions, mergers, and splits need explicit identity policies; exported stable IDs do not by themselves reconcile history.

Generated datasets, snapshots, source downloads, and exports belong in ignored local directories such as `data/` and `exports/`. They are not committed into this software repository.

## Synthetic example

The committed [example](../examples/README.md) describes fictional places, an invented square boundary, and demonstration coordinates. It uses a reserved invalid source URL and MIT licensing. It is suitable for tutorials and tests, not for geographical decisions.
