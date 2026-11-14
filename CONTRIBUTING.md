# Contributing to GeoReference

[Français](CONTRIBUTING.fr.md) · [Home](README.md)

Contributions should make geographic data easier to use without weakening identifiers, provenance, or repeatable imports. Start with an issue for substantial behavior changes, new sources, or new formats so the use case and compatibility target are clear.

## Local setup

Use Node.js 24.18.x and npm:

```sh
npm ci
npm run check
```

The check runs TypeScript validation, behavior tests, and the build. Tests use synthetic data and temporary directories. A PostgreSQL integration test uses `DATABASE_URL` when provided; a skipped integration test is not evidence that PostgreSQL transport was verified. Never point destructive test fixtures at a production database.

The repository has a private API workspace alongside the public CLI/SDK package. Install from the repository root with the single lockfile; do not commit a separate API lockfile. To work on HTTP behavior:

```sh
npm run dev:api
npm run typecheck:api
npm run test:api
```

For the compiled server, run `npm run build:api` then `npm run start:api`. The build includes the shared core. `npm run build` and public package generation remain CLI/SDK operations. Run `npm run test:acceptance` for API/source/export parity and packed CLI isolation. See [API usage](docs/api.md) and [architecture](docs/architecture.md).

## Branches and pull requests

- Create a focused task branch from `dev`, for example `feature/country-aliases`, `fix/csv-empty-values`, or `docs/import-guide`.
- Open working pull requests against `dev`. Release pull requests go from this repository's `dev` to `main`.
- Keep commits coherent and verified, using Conventional Commits such as `fix(csv): preserve absent optional fields`. Include the behavior and its tests together; do not commit an intentionally failing intermediate state.
- Explain the observable problem, resulting behavior, compatibility impact, and checks actually run. Link the relevant issue when one exists.
- Required checks must pass on the actual pull-request head. Do not force push protected branches, delete them, or bypass required reviews/checks.

Branch protection is enforced by repository settings; a workflow file alone is not protection. Availability and effective settings must be verified when configuring the repository.

## Tests before behavior changes

Write a focused test from the expected behavior or reproduced bug, run it and observe a meaningful failure, then implement and refactor with tests green. For example, an import change should demonstrate the second run leaves unchanged records untouched, not merely check that a helper was called.

Use independent expected values. Do not adjust expectations to fit a broken implementation. An import/module-missing failure only proves missing scaffolding; behavioral assertions must also distinguish a concrete wrong result. Documentation and static assets use direct checks rather than artificial tests.

For format adapters, cover stable IDs, non-ASCII names, absent versus null fields, unsupported options, output readability, cancellation, and any representation loss. Database changes need real engine semantics and a PostgreSQL integration path. Any new runtime dependency needs a concrete purpose and a license/maintenance check.

For the API, keep geographic rules in the shared catalog/query modules. Test HTTP boundaries with the existing Node test runner and `app.inject()`; retain real-server lifecycle coverage for startup/shutdown. Cover direct and descendant neighborhood relationships, invalid versus missing typed IDs, partial empty results, pagination, conditional caching and request limits. HTTP schemas must match documented resources and must not expose internal audit blobs. Verify that API dependencies and code do not enter the public CLI package, and compare API/source/export UUIDs when changing resource projection.

## Public documentation and examples

Update matching English/French guides in the same pull request. Code, API fields, CLI options, and commit subjects remain English. Keep examples executable and mark fictional data clearly. Do not advertise a format or database version that has not been verified.

Keep software and data licensing separate. Record source licenses, attribution, and revisions. Do not commit credentials, downloaded datasets, production exports, local databases, generated builds, or personal data. Private agent plans, prompts, reports, and handoffs do not belong in this repository.

## Before requesting review

Inspect the full staged diff, run the applicable checks, and remove unrelated changes. State limitations honestly, including checks that were skipped or could not run. For security-sensitive findings, follow [SECURITY.md](SECURITY.md) instead of posting exploit details in a public issue.
