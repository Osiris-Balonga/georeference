# HTTP API

[Français](api.fr.md) · [Home](../README.md) · [Architecture](architecture.md)

The repository includes a public, read-only Fastify API for Republic of the Congo (CG/COG) resources. Run it from a source checkout. The published `georeference@1.1.0` package remains the standalone file generator and optional local SDK; running `npx georeference` does not start this server. This guide describes local operation, not an already deployed public service.

## Run locally

Use Node.js 24.18.x and npm. From the repository root:

```sh
npm ci
npm run dev:api
```

The default address is `http://127.0.0.1:3000`. Open `/docs` for interactive documentation or `/openapi.json` for the machine-readable contract. For a compiled server:

```sh
npm run build:api
npm run start:api
```

`build:api` builds the shared core before the API. `npm run build` still builds the CLI/SDK package. The API is a private npm workspace with its own HTTP dependencies; it is not installed as a permanent dependency when generating files in another project.

## Interactive reference with Scalar

Open `http://127.0.0.1:3000/docs` after starting the API. It opens the French introduction at `/docs/fr/introduction`; select **EN** for `/docs/en/introduction`. Guides and operations share one header, navigation, page filter and light/dark controls. Guide chapters have independent addresses and previous/next navigation. Their contents list appears on large screens and folds above the content on smaller screens. Guide code blocks include copy controls with confirmation feedback. The language links keep the current page. Mobile navigation uses the menu button. Light/dark preference is stored locally when browser storage is available.

Guides cover the first request, place relationships, pagination and errors. Every API operation has its own page using Scalar's native modern layout and default components: parameters on the left, request and response examples on the right when space permits. The reference navigation groups lists, UUID lookups and relationships by resource; it also includes dataset, coverage and health operations. There is no additional contents column on operation pages. Older category URLs redirect to their first operation.

Operation pages start at their natural top. Scalar's document overview, server/client-library introduction and category summary are omitted from this dedicated view, so scrolling upward does not reveal duplicate headings or empty panels. Choose the snippet language directly from the operation's native code example. A small presentation adapter targets pinned Scalar1.78.1; check the hidden overview frames, single visible page heading and normal top-of-page position when upgrading. No initial scroll offset or calculated page height is used.

On `/docs/en/communes/list`, open **Test Request**, enter `q=Brazzaville`, then send the request. Use `/docs/en/communes/get` for a UUID lookup or `/docs/en/arrondissements/by-communes` for the arrondissements of a commune. Geographic examples and suggested UUIDs come from the loaded catalog; an empty category never receives an invented example. Language links keep the current operation. Native copy buttons, response schemas and the request client remain available. These requests use the API's normal validation and rate limits.

The native request client fills the viewport, with its close button integrated into its toolbar. Close it or press Escape to return to the operation at the same reading position. The host keeps the operation URL stable while Scalar manages the client and keyboard focus. Request controls and response panels keep Scalar's behavior and styling. The small window-frame CSS adapter targets the pinned Scalar version; verify full-screen sizing and keyboard return when upgrading Scalar.

`@fastify/swagger` generates `/openapi.json` directly from the route schemas; **Scalar replaces Swagger UI**, not the OpenAPI generator. Each operation page serves its isolated projection at the same address followed by `/openapi.json`, preserving parameter and response schemas. The older category projections at `/docs/{fr|en}/spec/{chapter}.json` remain available, as does the full contract at `/openapi.json`. No duplicate handwritten schemas are maintained. English/French chapter content, UI labels and operation descriptions are provided; technical field names, URLs, JSON keys and place names retain their original identifiers.

Fastify serves the reading shell, styles and small navigation script; Scalar's JavaScript loads only on API reference chapters, locally. Default remote fonts, telemetry, AI assistance and developer promotion tools are disabled; requests go directly to this API without a hosted Scalar proxy. No Scalar account, frontend framework or paid service is required. The documentation uses a per-response CSP nonce; its HTML must not be cached by a reverse proxy. The current root-relative URLs assume the API is hosted at the origin root, not under a rewritten path prefix.

See the official [Fastify integration](https://scalar.com/products/api-references/integrations/fastify) and [configuration reference](https://scalar.com/products/api-references/configuration). The UI comes from Scalar; this repository's usage guides remain available in English and French.

## Resources and filters

Use `GET` to retrieve JSON or `HEAD` for the corresponding headers. Each resource has a list route and a detail route, for example `/v1/communes` and `/v1/communes/{id}`. IDs are persistent UUIDs, shared with JSON and database exports.

| List route | Resource | Direct-parent filters |
|---|---|---|
| `/v1/countries` | Countries | None |
| `/v1/departments` | Departments | `countryId` |
| `/v1/communes` | Communes | `departmentId` |
| `/v1/districts` | Districts | `departmentId` |
| `/v1/arrondissements` | Arrondissements | `communeId` |
| `/v1/urban-communities` | Urban communities | `districtId` |
| `/v1/rural-communities` | Rural communities | `districtId` |
| `/v1/neighborhoods` | Neighborhoods | `communeId`, `arrondissementId`, `urbanCommunityId` |
| `/v1/villages` | Villages | `districtId`, `ruralCommunityId`, `urbanCommunityId` |

List routes accept `q`, `limit` and `offset`. Search is a case/accent-insensitive substring match on names; it does not merge places with similar names. `q` is limited to 100 trimmed characters. The default `limit` is 50, the maximum is 100, and `offset` starts at 0. Results have a deterministic name/UUID order. Unknown parameters and invalid values are rejected.

Direct-parent filters mean the stored relationship. For example, `neighborhoods?communeId=...` selects neighborhoods documented directly under that commune. Use a relationship route to include descendants attached through arrondissements.

## Commune → arrondissement → neighborhood

For a form's “city” field, use communes. A same-name department is a separate resource with a different UUID. The following browser JavaScript loads the known Brazzaville options from the local API:

```js
const api = "http://127.0.0.1:3000/v1";

async function get(path) {
  const response = await fetch(api + path);
  if (!response.ok) throw new Error(`Geography request failed: ${response.status}`);
  return response.json();
}

const cities = await get("/communes?q=Brazzaville&limit=100");
const brazzaville = cities.data.find(city => city.name === "Brazzaville");
if (!brazzaville) throw new Error("Brazzaville is not documented in this dataset");

const arrondissements = await get(
  `/communes/${brazzaville.id}/arrondissements?limit=100`
);
const talangai = arrondissements.data.find(row => row.name === "Talangaï");

const neighborhoods = talangai
  ? await get(`/arrondissements/${talangai.id}/neighborhoods?limit=100`)
  : await get(`/communes/${brazzaville.id}/neighborhoods?limit=100`);

// Display row.name in each select; store row.id as the selected value.
console.log(arrondissements.data, neighborhoods.data);
```

The example requests one page. Use `meta.total`, `meta.limit` and `meta.offset` to offer further pages when needed. Reset the selected arrondissement and neighborhood whenever the commune changes, and reset the neighborhood when the arrondissement changes. Handle loading, failures and empty results in the form.

The commune neighborhood route returns all known descendant neighborhoods, including those directly attached to the commune. It does not fabricate an arrondissement for them. A form must allow selecting these direct neighborhoods even when the commune also has arrondissements; do not make a documented arrondissement mandatory for every neighborhood.

| Relationship route | Result |
|---|---|
| `/v1/countries/{id}/departments` | Departments in the country |
| `/v1/departments/{id}/communes` | Communes in the department |
| `/v1/departments/{id}/districts` | Districts in the department |
| `/v1/communes/{id}/arrondissements` | Arrondissements in the commune |
| `/v1/communes/{id}/neighborhoods` | All known neighborhoods in the commune |
| `/v1/arrondissements/{id}/neighborhoods` | Neighborhoods in the arrondissement |
| `/v1/districts/{id}/urban-communities` | Urban communities in the district |
| `/v1/districts/{id}/rural-communities` | Rural communities in the district |
| `/v1/districts/{id}/villages` | All known villages in the district |
| `/v1/urban-communities/{id}/neighborhoods` | Neighborhoods in the urban community |
| `/v1/urban-communities/{id}/villages` | Villages in the urban community |
| `/v1/rural-communities/{id}/villages` | Villages in the rural community |

Relationship lists accept `q`, `limit` and `offset`. They verify that the parent exists in the requested category and preserve the returned resources' real direct-parent fields.

## Responses, versions and coverage

A list returns `{ data: [...], meta: { total, limit, offset, datasetVersion, coverageStatus } }`. A detail returns `{ data: resource, meta: { datasetVersion, coverageStatus } }`. Resource fields retain the same business meaning as the [JSON exports](formats.md). A neighborhood has exactly one documented direct parent; its other parent fields are `null`.

For example, the commune detail `/v1/communes/be83c679-2667-4935-9dad-0f63456298ad` identifies Brazzaville:

```json
{
  "data": {
    "id": "be83c679-2667-4935-9dad-0f63456298ad",
    "name": "Brazzaville",
    "departmentId": "bf82f843-df29-444b-ba2d-fc9df50f220f"
  },
  "meta": {
    "datasetVersion": "cg-reference-2026-11-12.2",
    "coverageStatus": "partial"
  }
}
```

`/v1/dataset` describes the deployed reference through `apiVersion`, `serviceVersion`, `contractVersion`, `datasetVersion`, `country`, `reviewedAt` and `sources`. Source metadata includes usage rights and revision information. `/v1/coverage` provides known resource `counts`, `sourceDates` and `communes` coverage summaries, with `status: "partial"` and `completeGeographicInventory: false`. Both endpoints use the same `data`/`meta` envelope. Detailed source anomalies are not inserted into ordinary place responses.

The bundled reference currently contains 398 records, including 16 communes and 250 named neighborhoods. Brazzaville has 9 documented arrondissements and 74 named neighborhoods. These counts describe covered records, not certified current geographic totals. There are currently no curated village or rural-community rows. An empty list means no matching known observations; it does not prove that those places do not exist. Coordinates and boundaries are not inferred. See [reference and sources](congo-reference.md).

The URL prefix `/v1` (`apiVersion`) versions the HTTP contract. `serviceVersion` versions the API software, `contractVersion` identifies the underlying data contract, and `datasetVersion` identifies the factual reference. A server serves its deployed dataset; older datasets are not automatically queryable through it. Record the dataset version with stored results, and use pinned release data when you need to reproduce an export.

## Errors and HTTP caching

Errors use `{ error: { code, message, requestId } }`. The request ID helps correlate a failure with server logs.

| Status | Meaning |
|---|---|
| `400` | Invalid UUID, filter, pagination or unknown query parameter |
| `404` | Missing route, resource or typed parent |
| `405` | Unsupported method for a known route; inspect `Allow` |
| `413` | Request body exceeds the server limit |
| `429` | Request limit reached; inspect `Retry-After` |
| `500` | Unexpected server failure with a safe public message |

A known parent with no known children returns `200` and `data: []`. This differs from a missing parent, which returns `404`.

Successful data responses supply an `ETag` and a five-minute public cache lifetime. Send the returned value in `If-None-Match` to revalidate; an unchanged representation returns `304` with no body. `HEAD` also has no body. Errors and health responses use `Cache-Control: no-store`.

## Configuration and operation

| Environment variable | Default | Purpose |
|---|---|---|
| `API_HOST` | `127.0.0.1` | Listening address; use an explicit external bind when hosting |
| `PORT` | `3000` | TCP port |
| `API_RATE_LIMIT_MAX` | `60` | Maximum requests per client per minute |
| `TRUSTED_PROXIES` | Unset | Explicit trusted proxy IP addresses/restricted CIDRs, separated by commas; `/0` ranges are refused |

The API allows browser access to public read-only resources without credentials. Rate limiting is in memory and applies per process, not as a global multi-instance quota. Forwarded addresses are trusted only through configured proxy rules; configure these for the actual host before relying on client-IP limits. Terminate HTTPS at the chosen host or reverse proxy.

`/health/live` reports process liveness; `/health/ready` reports service readiness. The catalog is loaded and validated before the server accepts traffic. Shutdown handles `SIGINT` and `SIGTERM` with a bounded drain. No database server or remote data fetch is needed to answer geographic queries.

```sh
npm run typecheck:api
npm run test:api
npm run check
```

The tests include HTTP injection and a real server lifecycle. `npm run test:acceptance` separately verifies source/API/export identity parity and packed CLI isolation. Existing export/import checks remain part of the repository workflow. See [contributing](../CONTRIBUTING.md).

## Files and database imports

The API queries data; it does not seed your database or execute export SQL. Use the [CLI](generation.md) to generate standalone JSON, CSV, Excel or database exports. Use the explicit [import workflow](seeding.md) to write a verified resource package into PostgreSQL. The optional local SDK is a third integration choice and does not require this HTTP service.
