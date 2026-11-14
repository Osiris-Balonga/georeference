# Public website

[Français](website.fr.md) · [Architecture](architecture.md)

The private Next.js App Router workspace in `apps/web` presents the Republic of the Congo to the public. The homepage, territory overview, project/sources page, explorer and place profiles share the approved design tokens and illustrated footer. The UI supports French and English, system theme/primary language defaults and saved overrides. Illustration labels distinguish artwork from surveyed geometry; no coordinates or boundaries were invented.

## Run locally

```sh
npm ci
npm run build:site
npm run start:site
```

Open http://localhost:3000 . The supervisor starts Next.js on `PORT` (3000 by default) and Fastify on loopback port 3001. Public `/v1/*`, `/docs/*`, `/openapi.json` and `/health/*` are forwarded to Fastify. Both processes stop together if either fails or the supervisor receives SIGTERM. The npm CLI remains independent.

For frontend development, run the API on port 3001 in one terminal (`PORT=3001 npm run dev:api` with the shell's environment syntax), then `npm run dev:web`. If port 3001 is occupied, set `API_INTERNAL_ORIGIN=http://127.0.0.1:4101` before building Next.js, and `API_INTERNAL_PORT=4101` when starting the supervisor. Next rewrites are resolved at build time; keep these settings consistent. Never point the internal origin at an untrusted service.

## URL state and data

Explorer URLs use `q`, `resource`, `parent` and `offset`. Submitting a search or choosing a filter adds a browser history entry; changing filters resets pagination, while page changes retain filters. Back/forward and locale changes preserve the query. No auto-submission on each keystroke. TanStack Query caches requests for five minutes and cancels stale requests using AbortSignal. Error, empty and skeleton states are provided. Category controls use shadcn/ui Select and mobile navigation uses Sheet, with focus handling from Radix. The components configuration and CSS semantic tokens are in the web workspace.

Server-rendered pages read the same versioned catalog through the Node SDK, loaded natively to retain file-relative data paths. Interactive exploration consumes the HTTP API. No second data store or duplicated administrative rules. Names remain unchanged between locales; labels and explanatory copy are translated. UUIDs remain canonical; same-name department/commune records stay separate.

`GET /v1/congo` is the public country entry point. `GET /v1/search` supports search, typed resources, ancestor selection and pagination; `direct=true` limits results to direct children. `GET /v1/places/{id}` returns the typed place and ordered ancestors. Old country routes remain compatible, are deprecated in OpenAPI and are absent from primary documentation navigation. Countries remain an internal extensible category, not a worldwide product promise.

## Layout, artwork and motion

Reading content is capped at 1280px. Footer/background surfaces fill the viewport width; the footer uses a minimum viewport height, allowing content-fit growth on mobile. Its panorama uses object containment to keep monuments visible. Hero composition adapts to short desktop viewports. Reveal and route-arrival transitions use opacity/transform; controls are interruptible. Reduced-motion preferences disable motion and smooth scrolling. Fonts and artwork are served locally; generated illustrative artwork provenance is documented in `apps/web/public/images/README.md`.

## Validation and hosting

`npm run check` includes core/API/web checks and a production web build. `npm run test:site` launches the combined built server and checks locale routing, pages, assets, docs CSP and actual API data. Set `SITE_URL` to test an already-running local server. Browser validation separately covers search/filter/history, mobile menus, viewport bounds and native Scalar interactions.

For the existing Render Node service, the future delivery settings are build `npm ci --include=dev && npm run build:site`, start `npm run start:site`, health `/health/ready`. Keep internal origin/port consistent if overridden. Fastify receives gateway connections from loopback, so its direct-IP rate limit is aggregate for this topology; configure `API_RATE_LIMIT_MAX` for the expected gateway traffic. No unverified forwarded-IP trust is enabled. No Render settings are changed by adding this code.
