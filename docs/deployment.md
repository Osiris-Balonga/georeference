# Deploy the API and documentation

[Français](deployment.fr.md) · [Home](../README.md)

The public site, [documentation](https://two42places.onrender.com/docs) and API use one public origin. The combined Next.js gateway serves the site at `/`; data routes use `/v1/...`; Fastify retains `/docs` and `/openapi.json`. The npm package is the standalone CLI and optional SDK, not the server distribution.

## Render configuration

Use the repository root as the build directory, a Node web service, and Node.js `24.18.0`:

| Setting | Value |
|---|---|
| Build | `npm ci --include=dev && npm run build:site` |
| Start | `npm run start:site` |
| Readiness check | `/health/ready` |
| `NODE_VERSION` | `24.18.0` |
| `NODE_ENV` | `production` |
| `API_HOST` | `0.0.0.0` |
| `PORT` | Provided by Render |

The reference is bundled in Git: no database, disk, runtime download or private environment secret is required. Build with development dependencies to compile the core, API and web workspaces. The Node supervisor forwards shutdown signals to Fastify and Next.js.

The production service follows `main` and automatically deploys only after CI checks pass. Task PRs target `dev`; reviewed releases go from `dev` to `main`. Applying the combined-site build/start commands is a separate delivery configuration change. Keep repository branch protections in place. Free web services can sleep when idle; their first request may take longer.

Verify a terminal `live` deploy, root/language redirects, a real `/v1/congo` response, `/v1/dataset`, both documentation locales and `/health/ready`. A successful creation or deploy trigger alone does not prove the service is live.

These are the combined-site settings to apply when delivering this branch. The currently deployed service may still use the API-only commands. See [the website guide](website.md) for the internal port, graceful shutdown, build-time proxy origin and aggregate rate limit. The root is the public frontend; /docs and /v1 remain available.
