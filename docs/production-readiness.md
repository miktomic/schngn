# SCHNGN Production Readiness

This is the authoritative go/no-go checklist for `https://schngn.com`. It separates repository-owned release gates from environment-owned Clerk, Cloudflare, and Plausible setup. A green feature board is not a substitute for this checklist.

## Repository release gate

Run from the repository root:

```bash
bun install --frozen-lockfile
bun run check
bun run test:e2e
```

The release is blocked unless all three commands pass. The checks cover engine and application unit tests, privacy payload assertions, Svelte/TypeScript diagnostics, the Cloudflare build, and the mobile Chromium critical path.

Manual browser verification must also confirm:

- a new browser starts with no fictional trips or verdict;
- the first-run history step requires either a previous trip or an explicit no-history confirmation before showing a safe allowance;
- the continuous workspace restores its selected hash anchor after refresh, including localized and RTL routes;
- optional entry/exit countries accept only current Schengen choices and never alter the count;
- a trip that leaves and re-enters Schengen shows the correct counted days and visible timeline gap;
- a what-if trip cannot make a later booked trip unsafe without warning;
- timeline, proof, risk, and returning-day dates match the entered itinerary;
- every saved trip can be adjusted from the canonical timeline without changing its identity or mutating another trip;
- keyboard focus reaches every action, visible controls meet the 44px project target, and 200% zoom does not hide content;
- offline reload retains the calculator shell and locally saved trips;
- the approved wordmark renders without a white canvas, browser favicon links resolve, and regular plus maskable PWA icons survive install masking;
- observed analytics requests contain no trip dates, labels, email, or travel history;
- a guest remains local-only and emits no account trip request;
- the signup action opens Clerk directly; SCHNGN exposes no separate email-capture form or endpoint;
- signup/sign-in alone does not upload local trips; a signed-in user must give explicit sync consent;
- version-one local storage and backups are intentionally unsupported; the schema-two D1 migration clears any pre-launch account snapshots while preserving Clerk accounts;
- account requests contain no client-controlled owner and authorization-isolation tests prove one user cannot access another user’s rows;
- account export and deletion operate only on the verified signed-in user;
- account, webhook, and operational logs contain no trip dates, labels, history, email, or Clerk user ID.

`bun run smoke:production` automatically proves the anonymous boundary: `GET /api/account/trips`, an empty-trip `PUT /api/account/trips`, and `DELETE /api/account` must return `401 authentication_required` with `cache-control: no-store`. All account-route responses additionally require `vary: *`, which prevents the legacy v1 service worker from caching them. Because CI has no user session, the signed-in consent/sync/export/deletion sequence remains a controlled manual production smoke using synthetic data.

## One-time production configuration

### GitHub production environment

Configure the GitHub Environment named `production`:

- secret `CLOUDFLARE_API_TOKEN`;
- variable `CLOUDFLARE_ACCOUNT_ID` (a secret fallback is supported).
- variable `PUBLIC_CLERK_PUBLISHABLE_KEY`;
- secret `CLERK_SECRET_KEY`;
- secret `CLERK_WEBHOOK_SIGNING_SECRET`.

Use a least-privilege Cloudflare token scoped to the SCHNGN account/zone. It needs the permissions required to deploy Workers, provision/apply D1 migrations, manage the `www` DNS record, and manage the canonical redirect ruleset. Never place any value in this repository or command output.

The workflow passes the public Clerk value to the production build. For Worker runtime bindings it creates a mode-`0600` JSON file at a fixed path in `RUNNER_TEMP`, performs inactive `wrangler versions upload --secrets-file`, applies migrations, performs the gated active deploy with the same file, and unconditionally removes that fixed path in an `always()` step. Raw Cloudflare values are step-scoped to the deployment operations that require them; the job-level gate contains only a derived boolean. Production must fail if a required binding is absent; do not replace this with `wrangler secret put`, which immediately deploys a secret-only version.

### Clerk production instance

Configure the Clerk production instance for `schngn.com`, including the exact allowed origins and redirect URLs used by the application. Create the production webhook endpoint:

```text
https://schngn.com/api/webhooks/clerk
```

Subscribe it to `user.deleted`, then store the generated signing secret as `CLERK_WEBHOOK_SIGNING_SECRET` in the GitHub `production` Environment. The account expansion must not deploy until that third Clerk value is present.

Verify in production:

- anonymous calculator use works with Clerk unavailable and no trip request leaves the browser;
- a new signup does not upload existing guest trips until separate explicit consent;
- signed-in sync survives a repeat visit and is isolated to the verified Clerk user ID;
- changing request fields cannot select another owner;
- export returns only the current account’s application data;
- deletion removes D1 account rows, and a correctly signed repeated deletion webhook is safe/idempotent;
- the deletion webhook writes the hashed 30-day replay guard before snapshot deletion, stale-session
  GET/PUT requests receive a generic gone response, and expired guards are purged;
- sign-out removes or isolates synchronized local cache data on a shared browser.

### Browser Content Security Policy

SvelteKit owns the document CSP in `apps/web/svelte.config.js` using `mode: 'auto'`: dynamic HTML receives a per-response nonce, while prerendered HTML receives build-specific SHA-256 script hashes. The server hook must preserve that generated header. Cloudflare `_headers` intentionally carries only the static baseline headers; adding a second static CSP there would intersect with and break the generated hash policy.

The production network allowlist is deliberately small:

- scripts: same origin, `https://clerk.schngn.com`, and `https://challenges.cloudflare.com` for Clerk bot protection;
- connections: same origin, `https://clerk.schngn.com`, and `https://plausible.io`;
- images: same origin, `data:`, and `https://img.clerk.com`;
- frames: `https://challenges.cloudflare.com` only;
- workers: same origin plus `blob:` for Clerk, while the PWA service worker remains same-origin.

Clerk's runtime CSS-in-JS and SCHNGN's data-driven inline CSS variables require `style-src 'unsafe-inline'`. Scripts do not allow `unsafe-inline` or `unsafe-eval`. Local Vite builds add only Clerk development tenants plus `ws://127.0.0.1:*` and `ws://localhost:*`; those sources must never appear in a production response. Official-source links are top-level HTTPS navigation and are not resource origins, so they do not need CSP allowlist entries. If Clerk's production Frontend API hostname changes, update `apps/web/csp.config.js`, the security tests, and this runbook together before deploying.

### Cloudflare D1

`apps/web/wrangler.jsonc` declares the `DB` binding without a committed database identifier. Current Wrangler provisions the resource for the binding, and migrations live under `apps/web/migrations/`. Active application data is keyed by the server-verified Clerk user ID and may exist only after explicit consent; guest trips never enter D1. Fresh databases start with the account schema at `0002`. Migration `0005_drop_waitlist_signups.sql` safely drops the retired table if an already-provisioned database still has it.

Local schema verification:

```bash
bun run d1:migrate:local
```

Remote migration application is part of the production workflow and can be run deliberately with:

```bash
bun run d1:migrate:remote
```

Migration `0002_create_account_trip_snapshots.sql` records the verified Clerk owner, optimistic revision, validated trip JSON, and versioned sync-consent time. Migration `0003_create_account_deletion_tombstones.sql` adds a minimal replay guard containing only a one-way Clerk-ID digest and a 30-day expiry. Apply all migrations before activating account routes. Application-visible deletion removes the owner’s snapshot immediately; expired replay guards are ignored and opportunistically purged. Provider backup/time-travel retention follows Cloudflare’s configured policy and must be described accurately in public privacy copy.

### Authenticated-write edge rate limiting

Apply a Cloudflare rate-limiting rule to `PUT /api/account/trips` and `DELETE /api/account`. Keep its threshold high enough for normal multi-device sync bursts, key it per client IP where the active Cloudflare plan permits, and return `429` before the Worker reads a body. Clerk authentication, the 1 MB streaming body cap, and optimistic revisions remain the application controls; the edge rule is defense in depth and must not log request bodies or Clerk tokens.

### Plausible Cloud

Add `schngn.com` as a site in the approved Plausible Cloud account. The bundled client initializes only on the exact production hostname and automatic pageviews are disabled; SCHNGN sends its own allowlisted aggregate events.

After deployment, confirm these events arrive with bucket/source properties only:

- `page_view`
- `calculator_start`
- `trip_added`
- `simulation_run`
- `pdf_buy_intent`
- `unlock_buy_intent`

Do not launch paid traffic if events are absent or if any event contains a date, email, free-form trip label, country history, or calculated timeline.

### Canonical domain

The production workflow runs `bun run cloudflare:canonical-www`. Verify independently:

```bash
curl -I https://www.schngn.com/
```

The response must redirect to `https://schngn.com/` and preserve the path/query. The apex `/`, `/app`, and `/accuracy` routes must return healthy responses with the expected security headers.

## Release sequence

The GitHub production workflow performs this sequence after the test/build/browser gate:

1. create the permission-restricted ephemeral Clerk bindings file and upload an inactive Worker version with `--secrets-file` so Wrangler can provision the ID-less D1 binding without changing production traffic;
2. apply remote D1 migrations;
3. deploy the verified Worker/static assets with the same required bindings to active traffic;
4. remove the ephemeral bindings file even if an earlier step fails;
5. ensure the canonical `www` DNS/redirect configuration;
6. run the production route, security-header, account-auth, and domain smoke checks.

Do not deploy manually from an unverified working tree. If an emergency manual release is unavoidable, follow the same order and retain the command results in the deployment record.

## Go/no-go decision

Production traffic is allowed only when:

- repository and browser gates are green;
- GitHub secret scanning/push protection (or an equivalent full-history scanner) is enabled and reports no live credential;
- there are no known result-integrity defects;
- Clerk production domain/redirect configuration and the signed lifecycle webhook are verified;
- guest local-only behavior, explicit sync consent, cross-account isolation, repeat-visit sync, export, deletion, and sign-out cache isolation are verified;
- D1 account persistence is verified with a controlled, synthetic signed-in smoke;
- the authenticated account-write edge rate limit is enabled and verified;
- aggregate Plausible events are visible and privacy-audited;
- `www` redirects canonically;
- Cloudflare logs show no new Worker errors after deployment;
- public accuracy copy describes the checked-in evidence without claiming EU certification or unrecorded official-calculator parity.

If any item fails, keep the apex deployment available only for controlled verification, stop paid acquisition, and fix or roll back before resuming.
