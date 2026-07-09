# SCHNGN Architecture

## Purpose

SCHNGN is a local-first Schengen 90/180-day tracker and planner. The MVP optimizes for trust, correctness, privacy, and fast validation of willingness to pay.

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
│   - /api/waitlist only, unless we intentionally add dynamic routes         │
│   - no Schengen trip data                                                 │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────── USER BROWSER ────────────────────────────────┐
│ Svelte UI                                                                 │
│ @schngn/engine pure calculation logic                                     │
│ browser storage for trips                                                 │
│ service worker/offline support later                                      │
│ all Schengen trip data stays here                                         │
└───────────────────────────────────────────────────────────────────────────┘
```

## Components

### `packages/engine`

Pure TypeScript calculation engine.

Responsibilities:

- Rolling 180-day usage calculation.
- Inclusive entry/exit-day counting.
- Overlap and adjacent-trip de-duplication.
- Exclusion/inclusion policy for short-stay country counting.
- Latest safe exit date calculation.
- Verdict classification.

Constraints:

- No browser APIs.
- No Worker APIs.
- No Bun-native APIs.
- No dependencies unless there is a strong reason.
- Must be testable in isolation.

This is the safety-critical package. CI must fail if its tests fail.

### `apps/web`

SvelteKit app deployed to Cloudflare Workers with Static Assets.

Responsibilities:

- Marketing/SEO landing page.
- Mobile-first calculator shell.
- Local trip storage and import/export.
- Dashboard, simulator, and days-coming-back views.
- Privacy-safe analytics hooks.
- Waitlist/fake-door endpoints.

Constraints:

- Trip dates stay client-side.
- Network payloads must not contain trip dates or full travel history.
- Server endpoints are only for non-trip data such as waitlist email.

### `/api/waitlist`

The only current dynamic Worker route.

Responsibilities:

- Validate email.
- Store email in Cloudflare KV/D1 or an external provider once configured.
- Return an honest success/queued response.

Constraints:

- Never mix waitlist/email data with trip data.
- No trip payloads accepted.

## Data boundaries

| Data | Location | Leaves browser? | Notes |
|---|---|---:|---|
| Trip dates | Browser storage | No | Core privacy promise |
| Calculation results | Browser memory/UI | No by default | May be shown/exported locally |
| Analytics | Provider | Yes, aggregate only | No dates, no PII |
| Waitlist email | KV/D1/provider | Yes | Separate from trip storage |
| Fake-door buy intent | Analytics/provider | Yes, event only | No trip details |

## Deployment target

Production domain: `https://schngn.com`.

Use `@sveltejs/adapter-cloudflare`, not the deprecated Workers-specific adapter.

The app builds with SvelteKit/Vite and deploys through Wrangler to Cloudflare Workers Static Assets. Static routes/assets should bypass Worker invocation where possible; dynamic routes are intentionally tiny.

The Wrangler config maps the Worker to the apex custom domain with:

```jsonc
"routes": [
  { "pattern": "schngn.com", "custom_domain": true }
]
```

Do not add `www.schngn.com` until the DNS/redirect decision is made. If `www` is enabled later, it should either redirect canonically to `https://schngn.com` or be explicitly configured as a second custom domain.

## Architecture decisions

1. **Local-first before accounts.** Avoids GDPR/backend/support burden before validation.
2. **Pure engine package.** Keeps correctness separate from UI and deployment details.
3. **Bun for speed, not runtime coupling.** Bun is a toolchain choice; deployed code must remain Worker/browser compatible.
4. **SvelteKit on Cloudflare.** Good fit for mostly-static PWA with one or two tiny dynamic routes.
5. **Fake-door monetization before building paid features.** Validate willingness to pay before building expensive surfaces.

## Current implementation status

Created skeleton:

- `packages/engine/src/index.ts`
- `packages/engine/tests/engine.test.ts`
- `apps/web/`
- `.github/workflows/ci.yml`
- Cloudflare `wrangler.jsonc`

The engine currently has a small initial test suite. It is not yet the full EC-parity suite from US-01; that is the next serious implementation step.
