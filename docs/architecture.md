# SCHNGN Architecture

## Purpose

SCHNGN is a local-first Schengen 90/180-day tracker and planner. Anonymous use remains local-only. Optional Clerk accounts add D1 sync for repeat visits: completing signup from an explicit signup-and-save CTA stores the current trips automatically, without weakening the guest privacy boundary. Agents can use the same calculation locally through a strict TypeScript API, JSON CLI, loopback HTTP/OpenAPI service, or stdio MCP server.

## Runtime model

The canonical calculator timeline exposes a browser-local moving-window inspector through `TimelineLedger.svelte` and `MovingWindowTimeline.svelte`. `lib/timeline/movingWindow.ts` computes fixed bar geometry and delegates counted days to the production engine. Inspecting another date never writes trips or changes the dashboard verdict. A synthetic `MovingWindowExample.svelte` on `/explainer` uses the same component to compare plans with and without a what-if stay. The explorer limits its selectable dates to the day before the earlier of today or the saved checkpoint through the planned horizon; older stay dates remain visible as evidence, with their marks clipped to the displayed axis. The Explainer starts at today with the hypothetical stay excluded. Static editor previews and the reviewed scroll walkthrough retain their existing compact timeline.

Diagram artifacts:

- [`docs/app-architecture-diagram.md`](app-architecture-diagram.md) — Mermaid diagram plus explanation.
- [`docs/app-architecture.drawio`](app-architecture.drawio) — editable draw.io source.
- [`docs/app-architecture.html`](app-architecture.html) — standalone browser/SVG visual.

The key architecture rule:

> **Bun is the local build/test/dev tool. Node 24+ is the Node tooling baseline. Cloudflare Workers is the production runtime.**

Bun never runs deployed production code. Production runs inside Cloudflare `workerd` V8 isolates. Therefore, anything that ships to the Worker or browser must avoid Bun-native APIs such as `bun:sqlite`, filesystem access, subprocesses, or raw sockets.

For SCHNGN this is fine, because the app is deliberately local-first:

```text
┌──────────────────────────── BUILD / CI — BUN ────────────────────────────┐
│ bun install                                                               │
│ bun test          → engine, capability, agent, and web suites              │
│ bun run build     → engine/capability/agent builds + SvelteKit/Vite       │
│ wrangler deploy   → uploads Worker + static assets                        │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────── PRODUCTION — CLOUDFLARE WORKERS ─────────────────────┐
│ Static Assets                                                             │
│   - prerendered landing/app shell                                         │
│   - JS/CSS/PWA manifest                                                   │
│                                                                           │
│ _worker.js                                                                │
│   - authenticated sync/export/deletion routes                             │
│   - verifies Clerk session; derives owner server-side                     │
│                                                                           │
│ Cloudflare D1                                                            │
│   - consented account rows keyed by verified Clerk user ID                │
│   - account schemas plus idempotent retired-table cleanup                 │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────── USER BROWSER ────────────────────────────────┐
│ Svelte UI                                                                 │
│ @schngn/engine pure calculation logic                                     │
│ browser storage for guest trips and signed-in working cache               │
│ service worker/offline app shell                                           │
│ guest data stays here; signed-in sync requires explicit consent           │
└───────────────────────────────────────────────────────────────────────────┘

┌──────────────────── LOCAL AGENT PROCESS — NODE 24+ ──────────────────────┐
│ @schngn/capability strict schema-versioned calculation API                │
│ @schngn/agent JSON CLI                                                    │
│ loopback-only HTTP API + OpenAPI 3.1 discovery                            │
│ read-only MCP tools over stdio                                            │
│ no persistence, telemetry, outbound network calls, or hosted listener     │
└───────────────────────────────────────────────────────────────────────────┘
```

The local packages are MIT licensed and published publicly as `@schngn/engine`, `@schngn/capability`, and `@schngn/agent`. The repository also contains a source-distributed SCHNGN agent skill intended for `npx skills add miktomic/schngn --skill schngn`.

The local box describes the SCHNGN runtime, not the full data path of every agent client. SCHNGN makes no outbound requests, but a cloud-backed agent host or model provider may receive and retain MCP tool inputs and results under its own policies.

## Components

### `packages/engine`

Pure TypeScript calculation engine.

Responsibilities:

- Rolling 180-day usage calculation.
- Inclusive entry/exit-day counting.
- Overlap and adjacent-trip de-duplication.
- Counting explicit continuous Schengen stay ranges; the engine has no country-classification branch.
- De-duplicating overlapping stay ranges while preserving full calendar-day gaps outside Schengen.
- Latest safe exit date calculation.
- Verdict classification.

Constraints:

- No browser APIs.
- No Worker APIs.
- No Bun-native APIs.
- No dependencies unless there is a strong reason.
- Must be testable in isolation.

This is the safety-critical package. CI must fail if its tests fail.

The web trip model is a traveler-facing journey with optional entry/exit country context and one or more `stays`. Outside-Schengen breaks are stored as gaps between those stays. Before calculation, the web layer flattens journeys to pure `{ entryDate, exitDate }` ranges. This keeps route labels out of the mathematical contract.

### `packages/capability`

Strict, transport-neutral adapter over `@schngn/engine`.

Responsibilities:

- Runtime-validation schemas for explicit `{ entryDate, exitDate }` Schengen stays.
- Versioned `calculateUsage`, `checkStay`, and `latestSafeExit` operations.
- Stable semantic statuses and safe validation issue codes.
- Fixed planning-aid advisory and official-source link on every successful result.
- A maximum of 100 ranges in each stay-list field, plus the separate candidate range for a stay check.

Constraints:

- No browser, Worker, filesystem, persistence, logging, analytics, or network APIs.
- No country classification, identity/account fields, labels, open-ended state, or legal-status inference.
- Unknown request fields are rejected rather than ignored.
- The public evidence description remains published-rule fixtures and an independent oracle, not captured European Commission calculator parity.

### `apps/agent`

Local Node 24+ transports for `@schngn/capability`.

Responsibilities:

- JSON CLI commands `usage`, `check-stay`, and `latest-exit`, reading stdin or an explicit file.
- A loopback HTTP API with health, OpenAPI 3.1 discovery, and versioned calculation endpoints.
- Three read-only MCP tools over stdio.
- Bounded input/body sizes, structured non-echoing errors, and no-store HTTP responses.

Constraints:

- The HTTP listener accepts only `127.0.0.1`, `::1`, or `localhost`; it is not a hosted API.
- MCP uses stdio only; no remote transport is approved.
- The app stores and logs no trip data, makes no outbound network requests, and emits no telemetry.
- A surrounding agent host may still transmit tool arguments and results to its model provider; that behavior is outside the SCHNGN runtime boundary.
- A remote or hosted phase requires a new decision covering privacy, authentication, explicit consent, retention/logging, and abuse controls.

### `apps/web`

SvelteKit app deployed to Cloudflare Workers with Static Assets.

Responsibilities:

- Marketing/SEO landing page.
- Localized `/agents` setup and interface documentation for the local runtime and repository-backed skill.
- Mobile-first calculator shell.
- Local trip storage and import/export.
- Dashboard, simulator, and days-coming-back views.
- Privacy-safe analytics hooks.
- Optional Clerk authentication and authenticated D1 sync.
- Account-data export and deletion flows.
- Aggregate-only Plausible event adapter.

Constraints:

- Guest trip dates stay client-side and never enter an anonymous endpoint.
- Signed-in trips may enter D1 only after explicit consent.
- Every account query derives its owner from the verified Clerk session; no client-supplied owner is trusted.
- There is no trip data in analytics or logs.

### Clerk and authenticated account routes

Clerk is the identity source of truth. D1 stores application data keyed by the verified Clerk user ID; it does not duplicate email, name, password, OAuth profile, or other Clerk-owned identity data without a specific product need.

Authenticated routes are responsible for:

- verifying the Clerk session on every request;
- recording the versioned signup-and-save or separate sync consent before the first upload;
- validating and scoping all reads/writes to the server-derived user ID;
- exporting the signed-in user’s application data;
- deleting account data on user request, with a verified Clerk lifecycle webhook as cleanup fallback.

The production route surface is `/api/account/trips` for authenticated trip sync/export, `/api/account` for account-data deletion, and `/api/webhooks/clerk` for signed lifecycle cleanup.

A verified Clerk `user.deleted` event writes a one-way SHA-256 digest tombstone before deleting
the trip snapshot in the same ordered D1 batch. The marker blocks stale-session and webhook-race
writes for 30 days, which exceeds the expected token, retry, and in-flight request windows. Active
markers make account reads/writes return a generic gone response; expired markers are ignored and
opportunistically purged. The user-facing “delete saved trips” action deletes only the snapshot and
does not tombstone a still-existing Clerk account.

Sign-out must not expose a previous user’s synchronized cache on a shared device, and no trip data may enter analytics or operational logs.

### Signup boundary

There is no SCHNGN-managed email waitlist. People who want an account use Clerk signup directly. A separate localized contact form sends only the support fields a visitor explicitly enters to `schngn@proton.me` through a fixed-destination Cloudflare Email Service binding; it is protected by Turnstile and rate limiting and never attaches trip history. Clerk remains responsible for identity data and SCHNGN stores no duplicate email/profile row in D1.

Because there is no production waitlist data to preserve, `0001_create_waitlist_signups.sql` is removed. Fresh databases begin the active account schema at migration `0002`. Forward migration `0005_drop_waitlist_signups.sql` uses `DROP TABLE IF EXISTS` to clean any already-provisioned database safely; it never creates or repurposes an identity table.

## Data boundaries

| Data | Location | Leaves local client? | Notes |
|---|---|---:|---|
| Guest trip dates | Browser storage | No | No account or server fallback |
| Local agent inputs/results | SCHNGN process plus the invoking client | Depends on agent host | SCHNGN does not transmit them; a cloud-backed host may transmit and retain inputs/results under its own policies |
| Signed-in trip dates/settings | Browser cache + Cloudflare D1 | Only after explicit consent | D1 rows keyed by verified Clerk user ID |
| Identity/session | Clerk | Yes, on optional signup/sign-in | Clerk remains identity source of truth |
| Calculation results | Browser memory/UI | No by default | May be shown/exported locally |
| Analytics | Plausible Cloud | Yes, aggregate only | Allowlisted buckets only; no trip data or PII |
| Fake-door buy intent | Analytics/provider | Yes, event only | No trip details |

## Deployment target

Production domain: `https://schngn.com`.

`apps/agent` is not part of the production Worker deployment. Its HTTP surface is a local loopback interface, its MCP transport is stdio, and its TypeScript API runs in the caller's local process. There is no approved public calculation endpoint.

Use `@sveltejs/adapter-cloudflare`, not the deprecated Workers-specific adapter.

The app builds with SvelteKit/Vite and deploys through Wrangler to Cloudflare Workers Static Assets. Static routes/assets should bypass Worker invocation where possible; dynamic routes are intentionally tiny.

The Wrangler config maps the Worker to the apex and `www` custom domains. A post-deploy Cloudflare script ensures `www` resolves and redirects canonically to the apex:

```jsonc
"routes": [
  { "pattern": "schngn.com", "custom_domain": true },
  { "pattern": "www.schngn.com", "custom_domain": true }
]
```

## Architecture decisions

1. **Local-first remains the guest default.** Signup and sync are optional; anonymous trips never leave the browser.
2. **Pure engine package.** Keeps correctness separate from UI and deployment details.
3. **Bun for speed, not runtime coupling.** Bun is a toolchain choice; deployed code must remain Worker/browser compatible.
4. **SvelteKit on Cloudflare.** Good fit for the PWA and a small authenticated Worker API surface.
5. **Fake-door monetization before building paid features.** Validate willingness to pay before building expensive surfaces.
6. **Clerk identity, D1 application data.** Do not build a second identity store; associate consented account data with the server-verified Clerk user ID.
7. **Deletion and export are part of storage.** Authenticated sync is incomplete until users can retrieve and delete their data.
8. **Agent access remains local.** One strict capability contract powers the TypeScript API, JSON CLI, loopback HTTP/OpenAPI service, and stdio MCP server without sending anonymous trip dates to SCHNGN infrastructure.

## Current implementation status

Implemented:

- Pure TypeScript engine with deterministic fixtures, boundary cases, a golden scenario, and independent-oracle property checks.
- Strict local agent capability with a TypeScript API, JSON CLI, loopback HTTP/OpenAPI service, and stdio MCP tools.
- Local trip CRUD, semantic validation, persistence, and JSON backup/restore.
- A tab-free calculator workspace with timeline and trips, plus a header-linked Account & data destination on the same mounted route and dedicated localized `/explainer`, `/faq`, `/agents`, `/contact`, `/privacy`, and `/terms` public resources.
- Installable offline PWA shell.
- Aggregate-only analytics adapter with no email capture.
- Unit, type, build, browser, privacy-network, and post-deploy smoke gates.

The checked-in suite verifies the published 90/180-day rule semantics. It does not claim captured output parity with the European Commission calculator until provenance-backed official outputs are added. Optional accounts are the explicit DEC-10/US-22 scope expansion. Infisical is authoritative for development and production secrets. GitHub Actions retrieves the production set directly with short-lived OIDC credentials and stores no duplicate Actions secret or variable copies; external Infisical/Clerk/D1/Plausible/Cloudflare configuration is tracked in `docs/production-readiness.md`.

Public content negotiation and skill discovery are described in
`docs/agent-readiness.md`. The build-generated Worker wrapper serves allowlisted
Markdown assets before the SvelteKit adapter; private routes remain unchanged.

The moving-window view uses one shared chronological axis, optional country markers, a translucent 180-day band, and a large counted-day total below. Full per-trip dates and counts are available in a collapsed disclosure. The example separates the two historical trips visually while retaining its 25/26/95-day checkpoints.

`MovingWindowTimeline.svelte` also offers the approved layered-contributions graphic through `LayeredContributions.svelte`. Both views share the same selected date, engine reading, saved checkpoint, and native date controls. `lib/timeline/layeredContributions.ts` partitions overlapping stay intervals for stable visual attribution, then assigns the engine's de-duplicated counted dates to at most six layers. Earlier trips are grouped for large histories. Exact rolling-count turn points preserve the count between plotted dates while avoiding day-by-day expansion of long empty spans. Open-ended stays use the existing projection adapter and are labeled in the chart. Switching views does not persist preferences or trip changes and never makes a network request.


## Read-only delegated agent access (DEC-17)

The web Worker wraps SvelteKit in Cloudflare's OAuth provider. Clerk session
verification authorizes the human consent page only; OAuth tokens authorize
`/mcp`, `/api/agent/trips` and `/a2a` only. The issuer and exact protected resource
are `https://schngn.com`; scopes are `docs:read` and `trips:read`. The server derives
trip ownership from encrypted grant props, never request parameters. Tools use
existing D1 account snapshots and fixed generated Markdown assets.

D1 one-time consent records bind the original request to a user/session. KV
contains opaque-token/grant/client metadata, with bounded retention. D1 grant and
token-digest deny lists cover distributed KV revocation. Deletion revokes grants
and clears pending consent; deleted-account tombstones continue to guard reads.
There are no new trip stores, hosted calculations, agent writes or task logs.
Browser WebMCP uses the existing pure capability directly with explicit inputs.
See `docs/agent-readiness.md` for current draft versions and the final-build gate.
