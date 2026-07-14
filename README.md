# SCHNGN

SCHNGN is a privacy-first Schengen 90/180-day tracker and trip planner.

SCHNGN is a mobile-first web/PWA with a heavily tested pure calculation engine. Guests use it without an account and keep trips local-only; optional Clerk accounts can explicitly sync trips for repeat visits and cross-device use.

## Current architecture

- **Build/test/dev runtime:** Bun 1.3.14, with Node 24+ for Node-based tooling and GitHub Actions
- **App:** SvelteKit + Vite
- **Production domain:** `https://schngn.com`
- **Production runtime:** Cloudflare Workers / `workerd` V8 isolates
- **Static hosting:** Cloudflare Workers Static Assets
- **Core logic:** `@schngn/engine`, pure TypeScript with no runtime dependencies
- **Trip data:** guest trips are browser-local only; completing Clerk signup from a clearly labeled save CTA automatically stores the current trips in D1, while existing-account sign-in keeps reconciliation safeguards
- **Identity:** optional Clerk signup; Clerk is the identity source and application rows are keyed by verified Clerk user ID
- **Server data:** authenticated account trips/settings in Cloudflare D1; there is no email waitlist. The contact form sends only visitor-entered support fields to the support inbox.
- **Analytics:** aggregate-only events through the allowlisted Plausible adapter; never trip dates or email

Read:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/repo-structure.md`](docs/repo-structure.md)
- [`docs/ci-cd.md`](docs/ci-cd.md)
- [`docs/cloudflare-github-secrets-setup.md`](docs/cloudflare-github-secrets-setup.md)
- [`docs/product-decisions.md`](docs/product-decisions.md)
- [`docs/mvp-implementation-kanban.md`](docs/mvp-implementation-kanban.md)

## Quick start

Install Node 24+ and Bun 1.3.14. If Bun is not installed globally, use `npx bun@1.3.14`.

```bash
bun install
bun run check
bun run test:e2e
bun run dev
```

If using the temporary `npx` path:

```bash
npx -y bun@1.3.14 install
npx -y bun@1.3.14 run check
npx -y bun@1.3.14 run test:e2e
```

## Agent integrations

SCHNGN's calculator is available to local agents without sending trip history to a SCHNGN-hosted calculation service:

- `@schngn/engine` is the pure TypeScript calculation engine.
- `@schngn/capability` provides the strict, runtime-agnostic TypeScript API and schemas.
- `@schngn/agent` provides the JSON CLI, loopback REST/OpenAPI server, and MCP stdio server.

All three packages are MIT licensed and published publicly on npm. The local setup is:

```bash
npm install --global @schngn/agent
codex mcp add schngn -- schngn-mcp
npx skills add miktomic/schngn --skill schngn
```

The SCHNGN runtime itself performs no persistence, telemetry, logging, or outbound network calls. A cloud-backed agent host or model provider may still receive and retain tool inputs and results under its own policies. There is no hosted SCHNGN API or MCP endpoint.

See the [agent capability guide](docs/agent-capability.md) for source builds, request contracts, examples, privacy boundaries, and client setup.

## Workspace layout

```text
packages/engine/  Pure TypeScript Schengen calculation engine
packages/capability/ Strict versioned API and schemas for agent consumers
apps/agent/       Local JSON CLI, loopback REST/OpenAPI, and MCP stdio surfaces
apps/web/         SvelteKit web/PWA shell for Cloudflare Workers
.github/workflows CI/CD pipeline
```

## Non-negotiables

1. Calculation correctness gates deployment.
2. Guest trips stay client-side; signed-in sync is optional and consented.
3. Analytics and logs must never include trip dates or PII.
4. Legal/edge-case disclaimers stay visible and boring. Boring is good here.
5. Account ownership comes from the verified Clerk session, never a client-provided user ID.

## Launch status

The original local-first application, offline shell, privacy gates, and Cloudflare deployment path are implemented. Optional accounts and authenticated sync are an explicit scope expansion with separate consent, account-data export, and deletion gates. Production launch still requires the external Clerk/Cloudflare/Plausible checklist in [`docs/production-readiness.md`](docs/production-readiness.md); no provider credentials belong in this repository.
