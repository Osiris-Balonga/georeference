# Public website

[Français](website.fr.md) · [Architecture](architecture.md)

The private Next.js App Router workspace in `apps/web` presents the Republic of the Congo to the public. The homepage, territory overview, project/sources page, explorer and place profiles share the approved design tokens and illustrated footer. The UI supports French and English, system theme/primary language defaults and saved overrides. The public site and product guides use **242Places**; native API reference pages use **242Places API**. The Project page distinguishes decorative artwork from documentary city photographs and measured geography.

## Run locally

```sh
npm ci
npm run build:site
npm run start:site
```

Open http://localhost:3000 . The supervisor starts Next.js on `PORT` (3000 by default) and Fastify on loopback port 3001. Public `/v1/*`, `/docs/*`, `/openapi.json` and `/health/*` are forwarded to Fastify. Both processes stop together if either fails or the supervisor receives SIGTERM. The npm CLI remains independent.

For frontend development, run the API on port 3001 in one terminal (`PORT=3001 npm run dev:api` with the shell's environment syntax), then `npm run dev:web`. If port 3001 is occupied, set `API_INTERNAL_ORIGIN=http://127.0.0.1:4101` before building Next.js, and `API_INTERNAL_PORT=4101` when starting the supervisor. Next rewrites are resolved at build time; keep these settings consistent. Never point the internal origin at an untrusted service.

## URL state and data

Homepage search also offers place suggestions after two characters and a 250ms typing pause, scoped by the shadcn category selector. Each result shows its type and ancestors to distinguish homonyms. Arrow keys choose a suggestion, Enter opens its stable UUID profile, and Escape closes suggestions without discarding the typed search. Submitting without a selection opens the explorer with `q` and `resource`. Failed suggestions still permit a full search. The Congo overview reuses this control scoped to departments.

Explorer URLs use `q`, `resource`, `parent` and `offset`. Submitting a search or choosing a filter adds a browser history entry; changing filters resets pagination, while page changes retain filters. Back/forward and locale changes preserve the query. No auto-submission on each keystroke. TanStack Query caches requests for five minutes and cancels stale requests using AbortSignal. Error, empty and skeleton states are provided. Category controls use shadcn/ui Select and mobile navigation uses Sheet, with focus handling from Radix. The components configuration and CSS semantic tokens are in the web workspace.

Server-rendered pages read the same versioned catalog through the Node SDK, loaded natively to retain file-relative data paths. Interactive exploration consumes the HTTP API. No second data store or duplicated administrative rules. Names remain unchanged between locales; labels and explanatory copy are translated. UUIDs remain canonical; same-name department/commune records stay separate.

`GET /v1/congo` is the public country entry point. `GET /v1/search` supports search, typed resources, ancestor selection and pagination; `direct=true` limits results to direct children. `GET /v1/places/{id}` returns the typed place and ordered ancestors. Old country routes remain compatible, are deprecated in OpenAPI and are absent from primary documentation navigation. Countries remain an internal extensible category, not a worldwide product promise.

## Place descriptions and discovery

Profiles render deterministic FR/EN descriptions from the place's type, actual ancestors and recorded descendant counts. Neighborhoods name their immediate parent and, when applicable, commune. Communes can mention recorded arrondissements and neighborhoods. Counts use the full catalog rather than a paginated result; the wording deliberately says “recorded” because coverage is partial. Zero counts never imply that a territory contains no places. There are no fabricated histories or randomly varied descriptions.

The homepage always shows three city cards: Brazzaville, Pointe-Noire and Dolisie, each with its own sourced photograph. They sit side by side on desktop. On mobile, horizontal touch/trackpad scrolling remains available with the next card peeking into view; the scrollbar is hidden without blocking vertical page scrolling. There are no city tabs. Global search still covers all catalogued places; discovery never silently restricts its scope.

Location is optional and processed only in the browser. On arrival, the site reuses an already-granted geolocation permission to place the nearby city first, keeping all three cards visible. There is no location button or automatic permission prompt. Coordinates are neither stored nor sent to this API or a geocoding service. Denied, unavailable, inaccurate or distant locations retain the default card order.

The proximity check uses three separate, coarse discovery anchors ([Brazzaville](https://www.wikidata.org/wiki/Q3844), [Pointe-Noire](https://www.wikidata.org/wiki/Q223920), [Dolisie](https://www.wikidata.org/wiki/Q246554)). It rejects accuracy worse than 20km and requires a city within 30km. This provides a nearby suggestion, never an assertion of administrative containment. Anchors do not add measured geometry to catalog records. See the [browser geolocation documentation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) for permission and secure-context requirements.

## Layout, artwork and motion

Reading content is capped at 1280px. Footer/background surfaces fill the viewport width; the footer uses a minimum viewport height, allowing content-fit growth on mobile. Its panorama is the final page element, with no caption or copyright strip below. The blue daytime sky and matching starry nighttime sky follow the active theme with scoped contrasting text colors. All 640/960/1440/2172px panorama variants resize the same wide composition; landmarks are never brought closer on mobile. The frame only trims transparent sky. Hero discovery grows with its controls and cards, avoiding overlap with search. Reveal and route-arrival transitions use opacity/transform; controls are interruptible. Reduced-motion preferences disable motion and smooth scrolling.

Fonts, photographs and artwork are served locally. City photographs use 384/768/1200-or-1280px WebP variants selected through `srcset`/`sizes`. Footer panorama variants range from about 25KB to 200KB; each sky is about 11KB. Photograph credits and CC BY-SA 4.0 terms appear on the Project page and in `apps/web/public/images/README.md`; the code's MIT license does not replace their license. Generated map/skyline/skies remain illustrations, not administrative boundaries.

Search inputs use a subtle surface change and caret on focus, without outline, ring or bottom border; keyboard focus on links and category buttons remains visible. When the original search bar leaves above the viewport, the same form docks at the bottom on mobile and at the top on desktop. Its input, category and query are preserved; there is no duplicate form. Mobile suggestions open upward and safe-area insets protect the bottom edge. Scrolling back restores its original position without a layout jump. Reduced motion disables the arrival animation.

Mobile/tablet place ancestry has extra space below its heading. The project page keeps source documents in an expandable disclosure, with coverage caveats always visible. `npm run test:web` covers URL state, description grammar/counts, proximity filtering, location permission/card order, docking/input preservation and search interactions with React Testing Library/jsdom.

Theme controls display only the resolved sun/moon icon. The first visit follows system light/dark, with dark as the unavailable-information fallback. Clicking toggles directly between light and dark and stores an override; system changes are followed until that explicit choice. Unicode arrows in interface text are replaced by plain labels or Lucide icons where direction is useful.

## Search engines and sharing

Public pages have localized titles/descriptions, self-canonical URLs and reciprocal FR/EN `hreflang` links. Place descriptions include their actual type and ancestry. The unfiltered homepage is the root destination selected by language; the Documentation link opens `/docs/{locale}/introduction`. Search results use `noindex, follow` and a canonical URL without query parameters to avoid indexing combinations of filters. Place profiles and editorial pages remain indexable.

`/sitemap.xml` lists the canonical home/Congo/project pages and every stable place UUID in both languages, with language alternates. It excludes search variants and does not invent a fresh modification date on every request. `/robots.txt` points to the sitemap and excludes machine API/health routes. Home `WebSite` and profile `BreadcrumbList` structured data describe the visible product and ancestry; JSON is escaped before HTML embedding.

`/{locale}/opengraph-image` generates a local 1200×630 PNG with the shared brand, translated tagline and resized skyline. Open Graph and Twitter large-image metadata use absolute public URLs. `PUBLIC_SITE_URL` can override the production origin when moving to a custom domain; keep it consistent at build and runtime. It defaults to `https://two42places.onrender.com`.

These choices follow [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions) and [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Indexing and ranking remain search-engine decisions. After domain ownership is verified in Google Search Console, the owner can submit `/sitemap.xml` and inspect URLs; no verification token or claimed indexing is fabricated.

## Validation and hosting

`npm run check` includes core/API/web checks and a production web build. `npm run test:site` launches the combined built server and checks locale routing, pages, assets, docs CSP and actual API data. Set `SITE_URL` to test an already-running local server. Browser validation separately covers search/filter/history, mobile menus, viewport bounds and native Scalar interactions.

The existing free Render Node service uses build `npm ci --include=dev && npm run build:site`, start `npm run start:site`, health `/health/ready`. It tracks `main` after CI checks pass. Keep internal origin/port consistent if overridden. Fastify receives gateway connections from loopback, so its direct-IP rate limit is aggregate for this topology; configure `API_RATE_LIMIT_MAX` for the expected gateway traffic. No unverified forwarded-IP trust is enabled. This topology keeps the public frontend, `/docs/*` and `/v1/*` on one origin without a second paid service.
