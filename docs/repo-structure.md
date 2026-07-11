# SCHNGN Repo Structure and Build

## Layout

```text
schngn/
├── .bun-version
├── .node-version
├── .nvmrc
├── .github/workflows/ci.yml
├── apps/
│   └── web/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── +page.svelte              # SEO landing
│       │   │   ├── app/+page.svelte          # calculator shell
│       │   │   ├── api/account/              # authenticated account-data deletion route
│       │   │   ├── api/account/trips/        # authenticated trip sync/export route
│       │   │   └── api/webhooks/clerk/       # signed identity lifecycle cleanup
│       │   ├── app.css
│       │   └── app.html
│       ├── migrations/                     # authenticated account schemas plus retired-table cleanup
│       ├── static/                         # PWA manifest, worker, favicon/icons, brand/social assets, SEO files
│       ├── e2e/                            # Playwright mobile browser coverage
│       ├── svelte.config.js
│       ├── vite.config.ts
│       ├── wrangler.jsonc
│       └── package.json
├── packages/
│   └── engine/
│       ├── src/index.ts
│       ├── tests/engine.test.ts
│       ├── tsconfig.json
│       └── package.json
├── docs/
├── package.json
├── bunfig.toml
└── tsconfig.base.json
```

## Root scripts

| Script | Command | Purpose |
|---|---|---|
| `bun run dev` | `cd apps/web && bun run dev` | Run SvelteKit dev server |
| `bun run test` | `bun test` | Run all Bun tests |
| `bun run test:engine` | `bun test packages/engine/tests` | Run engine tests only |
| `bun run typecheck` | `cd apps/web && bun run check` | Run Svelte/TypeScript checks |
| `bun run build` | engine build + web build | Build deployable app |
| `bun run check` | test + typecheck + build | Core release gate; pair with `test:e2e` |
| `bun run test:e2e` | Playwright mobile Chromium | Critical browser/privacy/offline gate |
| `bun run d1:migrate:local` | Wrangler D1 local migrations | Verify account schema and forward cleanup locally |
| `bun run d1:migrate:remote` | Wrangler D1 remote migrations | Production migration step after inactive provisioning |
| `bun run deploy` | `cd apps/web && bun run deploy` | Build and deploy through Wrangler |

## Package rules

### `@schngn/engine`

Allowed:

- Pure TypeScript.
- Date arithmetic helpers.
- Fixtures/tests.

Forbidden:

- Browser storage.
- Svelte components.
- Cloudflare APIs.
- Bun-native APIs.
- Network calls.

### `@schngn/web`

Allowed:

- Svelte UI.
- Browser local storage / IndexedDB.
- PWA/service worker and offline shell.
- Privacy-safe analytics wrappers.
- Authenticated account and Clerk lifecycle Worker endpoints.
- Optional Clerk authentication.
- D1-backed sync for signed-in users after explicit consent.
- Authenticated account-data export and deletion.

Forbidden:

- Sending trip dates to analytics, logs, or anonymous endpoints.
- Server-side trip persistence for guests or before explicit consent.
- Accepting an account owner from the client instead of deriving the Clerk user ID from the verified session.
- Legal advice generation.

## Build pipeline

1. Install dependencies.
2. Run `bun test`.
3. Build `@schngn/engine` with `tsc`.
4. Build SvelteKit app with Vite and `@sveltejs/adapter-cloudflare`.
5. Deploy `.svelte-kit/cloudflare` through Wrangler.

## Local setup

Toolchain:

- Node 24+ for Node-based tooling.
- Bun 1.3.14 for package install, scripts, tests, and builds.
- TypeScript 7 for the pure engine compiler and root CLI.
- The web workspace remains on TypeScript 6 for `svelte-check` until TypeScript 7 exposes the
  programmatic API required by Svelte tooling.

Preferred:

```bash
bun install
bun run check
bun run test:e2e
bun run dev
```

Temporary no-global-Bun path:

```bash
npx -y bun@1.3.14 install
npx -y bun@1.3.14 run check
npx -y bun@1.3.14 run test:e2e
```

The US-01 engine gate is now in place: `packages/engine/tests/engine.test.ts` loads `packages/engine/tests/fixtures/ec/rolling-180-fixtures.json` and adds property/golden tests.

## Current web library structure

The MVP uses feature-oriented libraries rather than the older planned `data/`, `stores/`, and generic `components/` folders:

```text
apps/web/src/lib/trips/         # validation, CRUD, and local storage repository
apps/web/src/lib/dashboard/     # answer-first dashboard state
apps/web/src/lib/simulator/     # non-mutating future-trip planning
apps/web/src/lib/returns/       # days-coming-back forecast
apps/web/src/lib/explanation/   # calculation proof state
apps/web/src/lib/design/        # shared product UI components
apps/web/src/lib/analytics/     # privacy-safe event wrapper
apps/web/src/lib/import-export/ # JSON import/export
apps/web/src/lib/fake-door/     # paid-intent state and events
apps/web/src/lib/auth/          # Clerk client/session integration
apps/web/src/lib/account/       # consented authenticated sync and account lifecycle helpers
```
