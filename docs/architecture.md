# SCHNGN Architecture

## Purpose

SCHNGN is a local-first Schengen 90/180-day tracker and planner. Anonymous use remains local-only. Optional Clerk accounts add D1 sync for repeat visits: completing signup from an explicit signup-and-save CTA stores the current trips automatically, without weakening the guest privacy boundary.

## Runtime model

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
│ bun test          → @schngn/engine correctness suite                      │
│ bun run build     → engine TypeScript build + SvelteKit/Vite build        │
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
```

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

### `apps/web`

SvelteKit app deployed to Cloudflare Workers with Static Assets.

Responsibilities:

- Marketing/SEO landing page.
- Mobile-first calculator shell.
- Local trip storage and import/export.
- Dashboard, simulator, and days-coming-back views.
- Privacy-safe analytics hooks.
- Paid-intent fake-door flows that never collect email or trip data.
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

| Data | Location | Leaves browser? | Notes |
|---|---|---:|---|
| Guest trip dates | Browser storage | No | No account or server fallback |
| Signed-in trip dates/settings | Browser cache + Cloudflare D1 | Only after explicit consent | D1 rows keyed by verified Clerk user ID |
| Identity/session | Clerk | Yes, on optional signup/sign-in | Clerk remains identity source of truth |
| Calculation results | Browser memory/UI | No by default | May be shown/exported locally |
| Analytics | Plausible Cloud | Yes, aggregate only | Allowlisted buckets only; no trip data or PII |
| Fake-door buy intent | Analytics/provider | Yes, event only | No trip details |

## Deployment target

Production domain: `https://schngn.com`.

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

## Current implementation status

Implemented:

- Pure TypeScript engine with deterministic fixtures, boundary cases, a golden scenario, and independent-oracle property checks.
- Local trip CRUD, semantic validation, persistence, and JSON backup/restore.
- A continuous calculator workspace with timeline, trips, and account surfaces, plus dedicated localized `/explainer`, `/faq`, and `/contact` public resources.
- Installable offline PWA shell.
- Aggregate-only analytics adapter with no email capture.
- Unit, type, build, browser, privacy-network, and post-deploy smoke gates.

The checked-in suite verifies the published 90/180-day rule semantics. It does not claim captured output parity with the European Commission calculator until provenance-backed official outputs are added. Optional accounts are the explicit DEC-10/US-22 scope expansion. External Clerk/D1/Plausible/Cloudflare configuration is tracked in `docs/production-readiness.md`.
