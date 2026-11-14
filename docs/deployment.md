# Deploy the API and documentation

[Français](deployment.fr.md) · [Home](../README.md)

The [hosted documentation](https://two42places.onrender.com/) and the API share one Fastify web service. `/` leads to documentation; data routes use `/v1/...`; `/openapi.json` exposes the contract. The npm package is the standalone CLI and optional SDK, not the server distribution.

## Render configuration

Use the repository root as the build directory, a Node web service, and Node.js `24.18.0`:

| Setting | Value |
|---|---|
| Build | `npm ci --include=dev && npm run build:api` |
| Start | `node apps/api/dist/server.js` |
| Readiness check | `/health/ready` |
| `NODE_VERSION` | `24.18.0` |
| `NODE_ENV` | `production` |
| `API_HOST` | `0.0.0.0` |
| `PORT` | Provided by Render |

The reference is bundled in Git: no database, disk, runtime download or private environment secret is required. Build with development dependencies because TypeScript compiles both workspaces. The start command runs the Node process directly so shutdown signals reach Fastify.

The review deployment follows the explicit task branch with automatic deployment disabled. For later delivery, deploy the reviewed commit after checks pass; switching the deployment source to a release branch is an explicit configuration change. Keep repository branch protections in place. Free web services can sleep when idle; their first request may take longer.

Verify a terminal `live` deploy, root/language redirects, a real `/v1/countries` response, `/v1/dataset`, both documentation locales and `/health/ready`. A successful creation or deploy trigger alone does not prove the service is live.
