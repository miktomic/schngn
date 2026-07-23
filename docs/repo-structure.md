# SCHNGN Repo Structure and Build

## Layout

```text
schngn/
├── .bun-version
├── .node-version
├── .nvmrc
├── .agents/skills/schngn/                # source-distributed agent skill and setup references
├── .github/workflows/ci.yml
├── apps/
│   ├── agent/
│   │   ├── src/
│   │   │   ├── cli.ts                    # strict JSON CLI and command dispatcher
│   │   │   ├── api.ts                    # standalone loopback API process
│   │   │   ├── http.ts                   # loopback-only HTTP routes and guards
│   │   │   ├── mcp.ts                    # read-only stdio MCP server
│   │   │   └── openapi.ts                # OpenAPI 3.1 document
│   │   ├── tests/                         # CLI, HTTP, and MCP transport coverage
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── +page.svelte              # SEO landing
│       │   │   ├── app/+page.svelte          # calculator shell
│       │   │   ├── agents/+page.svelte       # localized local-agent setup and interface guide
│       │   │   ├── contact/+page.svelte      # localized support/feature form
│       │   │   ├── privacy/+page.svelte      # localized public privacy policy
│       │   │   ├── terms/+page.svelte        # localized public terms of use
│       │   │   ├── api/account/              # authenticated account-data deletion route
│       │   │   ├── api/account/trips/        # authenticated trip sync/export route
│       │   │   ├── api/contact/              # Turnstile-checked fixed-recipient email route
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
│   ├── capability/
│   │   ├── src/                           # strict schemas, operations, metadata, errors
│   │   ├── tests/capability.test.ts
│   │   ├── tsconfig.json
│   │   └── package.json
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
| `bun run test:capability` | `bun test packages/capability/tests` | Run the strict agent-contract tests only |
| `bun run test:agent` | `bun test apps/agent/tests` | Run CLI, loopback HTTP, and stdio MCP tests only |
| `bun run typecheck` | engine + capability + agent + web checks | Run TypeScript 7 package checks and Svelte/TypeScript web checks |
| `bun run build` | engine + capability + agent + web builds | Build all local artifacts and the deployable web app |
| `bun run build:agent` | engine + capability + agent builds | Build the complete local agent stack |
| `bun run release:packages:check` | build + pack/install consumer verification | Verify the three npm package tarballs and clean consumer installs without publishing |
| `bun run release:packages:public-check` | anonymous registry install + runtime smoke | Verify the published npm dependency chain, CLI, TypeScript imports, and MCP server |
| `bun run check` | test + typecheck + build + compiled agent smoke | Core release gate; pair with `test:e2e` |
| `bun run test:e2e` | Playwright mobile Chromium | Critical browser/privacy/offline gate |
| `bun run agent:cli -- <command>` | run `apps/agent/src/cli.ts` | Use the local JSON CLI |
| `bun run agent:api` | run `apps/agent/src/api.ts` | Start the loopback HTTP/OpenAPI service |
| `bun run agent:mcp` | run `apps/agent/src/mcp.ts` | Start the stdio MCP server |
| `bun run d1:migrate:local` | Wrangler D1 local migrations | Verify account schema and forward cleanup locally |
| `bun run d1:migrate:remote` | Wrangler D1 remote migrations | Production migration step after inactive provisioning |
| `bun run deploy` | `cd apps/web && bun run deploy` | Build and deploy through Wrangler |

## Package rules

`@schngn/engine`, `@schngn/capability`, and `@schngn/agent` are MIT licensed and published publicly on npm. The repository-backed `schngn` skill is intended for `npx skills add miktomic/schngn --skill schngn`; it teaches compatible agents how to call the runtime but does not contain a second calculator implementation.

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

### `@schngn/capability`

Allowed:

- Strict runtime validation of explicit continuous Schengen stay ranges.
- Versioned usage, candidate-stay, and latest-safe-exit operations over `@schngn/engine`.
- Stable semantic statuses, bounded stay lists, safe issue codes, and fixed advisory metadata.

Forbidden:

- Filesystem, storage, logging, analytics, outbound network, browser, Worker, or UI APIs.
- Country classification, labels, identity/account fields, open-ended state, and unknown input fields.
- Generated legal advice or direct European Commission calculator parity claims.

### `@schngn/agent`

Allowed:

- Node 24+ JSON CLI execution.
- Loopback-only HTTP with OpenAPI 3.1 discovery and no-store responses.
- Read-only MCP tools over stdio.
- Local structured errors that do not echo submitted values.

Forbidden:

- Non-loopback binding, hosted/public endpoints, or remote MCP transports.
- Persistence, telemetry, analytics, outbound network calls, or logging trip inputs.
- Divergent calculation or validation logic outside `@schngn/capability`.

A future hosted API or MCP service is not implied by this package. It requires a new privacy/authentication/consent decision before implementation.

The package's no-network guarantee applies to the SCHNGN runtime. A cloud-backed agent host or model provider may still receive and retain tool inputs and results under its own policies.

### `@schngn/web`

Allowed:

- Svelte UI.
- Browser local storage / IndexedDB.
- PWA/service worker and offline shell.
- Privacy-safe analytics wrappers.
- Authenticated account and Clerk lifecycle Worker endpoints.
- Optional Clerk authentication.
- D1-backed sync after a clearly labelled signup-and-save choice, with safe reconciliation for existing-account sign-in.
- Authenticated account-data export and deletion.
- Fixed-destination support email delivery with server-side Turnstile validation and rate limiting.

Forbidden:

- Sending trip dates to analytics, logs, or anonymous endpoints.
- Server-side trip persistence for guests or before account creation through the save-labelled signup flow.
- Accepting an account owner from the client instead of deriving the Clerk user ID from the verified session.
- Legal advice generation.
- Automatically attaching trips, timelines, account identity, or browser data to a contact request.

## Build pipeline

1. Install dependencies.
2. Run `bun test`.
3. Build `@schngn/engine` with `tsc`.
4. Build `@schngn/capability` with TypeScript 7.
5. Typecheck and bundle `@schngn/agent` for Node 24+ with Bun.
6. Build SvelteKit app with Vite and `@sveltejs/adapter-cloudflare`.
7. Smoke the compiled agent CLI and stdio MCP entry points with synthetic inputs.
8. Deploy only `.svelte-kit/cloudflare` through Wrangler; the agent artifacts remain local.

## Local setup

Toolchain:

- Node 24+ for Node-based tooling.
- Bun 1.3.14 for package install, scripts, tests, and builds.
- TypeScript 7 for the pure engine, `@schngn/capability`, `@schngn/agent`, and root tooling; Bun bundles the agent entry points for Node 24+.
- The web workspace remains on TypeScript 6 for `svelte-check` until TypeScript 7 exposes the
  programmatic API required by Svelte tooling.

Preferred:

```bash
bun install
bun run check
bun run test:capability
bun run test:agent
bun run build:agent
bun run test:e2e
bun run dev
```

Temporary no-global-Bun path:

```bash
npx -y bun@1.3.14 install
npx -y bun@1.3.14 run check
npx -y bun@1.3.14 run test:capability
npx -y bun@1.3.14 run test:agent
npx -y bun@1.3.14 run build:agent
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
