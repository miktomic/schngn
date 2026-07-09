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
│       │   │   └── api/waitlist/+server.ts   # Worker route
│       │   ├── app.css
│       │   └── app.html
│       ├── static/
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
| `bun run check` | test + typecheck + build | Local CI equivalent |
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
- PWA/service worker later.
- Privacy-safe analytics wrappers.
- Tiny Worker endpoints for waitlist/fake-door flows.

Forbidden:

- Sending trip dates to analytics or server endpoints.
- Server-side Schengen trip persistence.
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

Preferred:

```bash
bun install
bun run check
bun run dev
```

Temporary no-global-Bun path:

```bash
npx -y bun@1.3.14 install
npx -y bun@1.3.14 run check
```

The US-01 engine gate is now in place: `packages/engine/tests/engine.test.ts` loads `packages/engine/tests/fixtures/ec/rolling-180-fixtures.json` and adds property/golden tests.

## Next structure to add

When implementing the remaining backlog, add:

```text
apps/web/src/lib/data/          # local storage repository
apps/web/src/lib/stores/        # trip/result stores
apps/web/src/lib/components/    # money-shot UI components
apps/web/src/lib/analytics/     # privacy-safe event wrapper
apps/web/src/lib/import-export/ # JSON import/export
```
