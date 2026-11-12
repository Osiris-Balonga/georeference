# Generate lists and application resources

[Français](generation.fr.md) · [Home](../README.md) · [Formats](formats.md)

Use Node.js 24.18.x and `npx georeference@1.1.0`. For source development, use `npm ci`, `npm run build` and `node dist/cli.js` instead. Version 1.0.0 does not provide these outputs.

## Choose the output

```sh
npx georeference@1.1.0 generate --format xlsx --output ./exports/congo-excel
npx georeference@1.1.0 generate --format csv --output ./exports/congo-csv
npx georeference@1.1.0 generate --format json --output ./exports/congo-json
npx georeference@1.1.0 generate --format sql-postgres --output ./exports/congo-postgres
```

Every `--output` is a **new directory**, not a filename. Relative paths start at your terminal's current directory: the CSV example writes inside `exports/congo-csv/`, not a previous JSON directory. Existing destinations are refused; consumer dependencies/package files are untouched. The geographic reference is bundled.

Every package has `README.txt` for coverage/dates and `manifest.json` for integrity. `--audit` adds detailed `coverage.json`/`provenance.json`; they are not geographic rows.

## Language and identifiers

CSV headers/filenames and workbook sheets use French by default. `--language en` chooses English. JSON collection/relationship names remain stable English application fields. UUIDs are included in application formats and hidden in human lists unless `--include-ids` is supplied.

```sh
npx georeference@1.1.0 generate --format xlsx --language en --output ./exports/congo-excel-en
npx georeference@1.1.0 communes --format csv --include-ids --output ./exports/communes-with-ids
npx georeference@1.1.0 generate --format json --audit --output ./exports/congo-audited
```

## Filter categories and places

| Command | Selected resource |
|---|---|
| `countries` | Republic of the Congo only |
| `departments` | Departments |
| `communes`, `cities` | Communes; `cities` is an alias, not all populated places |
| `districts` | Districts |
| `arrondissements` | Communal arrondissements |
| `neighborhoods` | Named neighborhoods retained in the reference |
| `villages` | Named villages when curated evidence exists |
| `generate` | All selected resources |

```sh
npx georeference@1.1.0 arrondissements --city Brazzaville --output ./exports/brazzaville-arrondissements
npx georeference@1.1.0 neighborhoods --city Brazzaville --arrondissement 6 --format csv --output ./exports/talangai-csv
npx georeference@1.1.0 neighborhoods --city Pointe-Noire --format xlsx --output ./exports/pointe-noire-excel
```

`--city` accepts a commune name or UUID. `--arrondissement` accepts a name/UUID; numbers require `--city`. Country scope is CG/COG; CD/COD is another country and is refused. Required parents stay in their own categories: total rows can exceed requested neighborhood counts.

Public resources require typed UUIDs and closed parent relationships. Missing ancestors, generic untyped records and hierarchical mixed-entity layouts are not silently converted. See [migration](migration.md).

## SQL naming and packaging

`--sql-config ./sql-names.json` supplies database schema/table names. `--schema-mode data-only` omits PostgreSQL schema generation; `--sql-mode insert-only` preserves matching UUID rows. See [formats](formats.md) and [database import](seeding.md).

`--compression gzip` compresses files separately. ZIP contains its own manifest; extract into a new directory before importing. Keep README/manifest with shared exports. `verify --package DIRECTORY` checks integrity, not geographic completeness.

## Geometry and coverage

Coordinates and boundaries are independent options. The documentary bundle supplies no geometry. GeoJSON requires `--coordinates` and/or `--boundaries`; missing geometry stays null. No name, parent, point or polygon is inferred to fill gaps.

The reference is partial and dated. Empty categories do not declare the territory empty. Filtering or a software update does not make a 2022 observation current in 2026. See [coverage and sources](congo-reference.md).
