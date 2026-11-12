# Getting started

[Français](getting-started.fr.md) · [Home](../README.md) · [Generation](generation.md)

Use Node.js 24.18.x and `npx georeference@1.1.0`. Source contributors can also build the checkout with `npm ci` and `npm run build`.

```sh
npx georeference@1.1.0 generate --format xlsx --output ./exports/congo-excel
npx georeference@1.1.0 generate --format json --output ./exports/congo-json
npx georeference@1.1.0 verify --package ./exports/congo-json
```

Open `exports/congo-excel/congo.xlsx` for the lists. Application arrays are in `exports/congo-json/communes.json`, `arrondissements.json`, `neighborhoods.json`, etc. Read `README.txt` for dates and partial coverage. `verify` checks file integrity, not geographic exhaustiveness.

## Read JSON in an application

This example assumes your application serves the generated resource files at `/data/`. It requires your application's web server, not opening a page through `file://`.

```js
const load = async name => {
  const response = await fetch("/data/" + name + ".json");
  if (!response.ok) throw new Error("Unable to load " + name);
  return response.json();
};

const [communes, arrondissements, neighborhoods] = await Promise.all([
  load("communes"), load("arrondissements"), load("neighborhoods")
]);

const brazzaville = communes.find(row => row.name === "Brazzaville");
const cityArrondissements = arrondissements.filter(
  row => row.communeId === brazzaville?.id
);
const talangai = cityArrondissements.find(row => row.name === "Talangaï");
const quarters = neighborhoods.filter(
  row => talangai && row.arrondissementId === talangai.id
);
```

Use names for display and UUIDs for stored selections. A production form must reset descendant choices when its parent changes, handle fetch failures/empty lists, and support neighborhoods attached directly through `communeId` or `urbanCommunityId`. A missing named observation is not proof that no neighborhood exists.

## Prepare PostgreSQL separately

```sh
npx georeference@1.1.0 generate --format ndjson --output ./exports/congo-seed
npx georeference@1.1.0 seed --package ./exports/congo-seed --create-schema
npx georeference@1.1.0 seed --package ./exports/congo-seed --create-schema --apply
```

Set `DATABASE_URL` in your environment first. Preview is read-only; `--apply` writes. Human CSV/XLSX, SQL scripts and SQLite files are not equivalent seeder inputs. Use the verified resource JSON/NDJSON package. See [database import](seeding.md) for configuration and existing-schema limits.

## Optional SDK

Reading generated files does not require `npm install georeference`. Applications choosing the optional SDK can install `georeference@1.1.0`; version 1.0.0 does not expose the new resource contract.

```ts
import { loadCongoReference, toResourceTables } from 'georeference';

const reference = await loadCongoReference();
const resources = toResourceTables(reference.entities);
console.log(resources.communes);
console.log(resources.neighborhoods);
```

`exportResources` exports selected snapshots using the public resource model; `readResourcePackage` verifies supported JSON/NDJSON resource packages. The internal canonical snapshot and legacy adapters are compatibility building blocks, not the public file layout. See [architecture](architecture.md) and [migration](migration.md).

A SQLite export is a database of business tables, not the internal snapshot consumed by `Snapshot.open`. Resource functions prepare a future API, but no HTTP server is shipped here.
