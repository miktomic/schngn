# SCHNGN

SCHNGN is a privacy-first Schengen 90/180-day tracker and trip planner.

The MVP is a mobile-first web/PWA: no account, local-only trip storage, a provably-correct calculation engine, and fake-door monetization hooks for validation.

## Current architecture

- **Build/test/dev runtime:** Bun 1.3.14, with Node 24+ for Node-based tooling and GitHub Actions
- **App:** SvelteKit + Vite
- **Production domain:** `https://schngn.com`
- **Production runtime:** Cloudflare Workers / `workerd` V8 isolates
- **Static hosting:** Cloudflare Workers Static Assets
- **Core logic:** `@schngn/engine`, pure TypeScript with no runtime dependencies
- **Trip data:** browser-local only; no trip dates leave the device
- **Server data:** waitlist email only, via `/api/waitlist` when a Cloudflare KV/D1/provider is configured

Read:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/repo-structure.md`](docs/repo-structure.md)
- [`docs/ci-cd.md`](docs/ci-cd.md)
- [`docs/cloudflare-github-secrets-setup.md`](docs/cloudflare-github-secrets-setup.md)
- [`docs/mvp-implementation-kanban.md`](docs/mvp-implementation-kanban.md)

## Quick start

Install Node 24+ and Bun 1.3.14. If Bun is not installed globally, use `npx bun@1.3.14`.

```bash
bun install
bun run test
bun run build
bun run dev
```

If using the temporary `npx` path:

```bash
npx -y bun@1.3.14 install
npx -y bun@1.3.14 run test
npx -y bun@1.3.14 run build
```

## Workspace layout

```text
packages/engine/  Pure TypeScript Schengen calculation engine
apps/web/         SvelteKit web/PWA shell for Cloudflare Workers
.github/workflows CI/CD pipeline
```

## Non-negotiables

1. Calculation correctness gates deployment.
2. Trip data stays client-side.
3. Analytics must never include trip dates or PII.
4. Legal/edge-case disclaimers stay visible and boring. Boring is good here.
