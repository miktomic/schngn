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
- timeline, risk, report, and returning-day dates match the entered itinerary;
- every saved trip can be adjusted from the canonical timeline without changing its identity or mutating another trip;
- keyboard focus reaches every action, visible controls meet the 44px project target, and 200% zoom does not hide content;
- offline reload retains the calculator shell and locally saved trips;
- the approved wordmark renders without a white canvas, browser favicon links resolve, and regular plus maskable PWA icons survive install masking;
- observed analytics requests contain no trip dates, labels, email, or travel history;
- a guest remains local-only and emits no account trip request;
- the signup action opens Clerk in a themed in-page overlay; the separate support form is not a signup or marketing list and never receives trip history automatically;
- the clearly labelled “Sign up & save” / “Create account & save trips” action opens that overlay without leaving the calculator and, after account creation, automatically stores the current local trip history in the new account;
- ordinary sign-in to an existing account still reconciles local and account copies without silently overwriting either one;
- version-one local storage and backups are intentionally unsupported; the schema-two D1 migration clears any pre-launch account snapshots while preserving Clerk accounts;
- account requests contain no client-controlled owner and authorization-isolation tests prove one user cannot access another user’s rows;
- account export and deletion operate only on the verified signed-in user;
- account, webhook, and operational logs contain no trip dates, labels, history, email, or Clerk user ID.

`bun run smoke:production` automatically proves the anonymous boundary: `GET /api/account/trips`, an empty-trip `PUT /api/account/trips`, and `DELETE /api/account` must return `401 authentication_required` with `cache-control: no-store`. All account-route responses additionally require `vary: *`, which prevents the legacy v1 service worker from caching them. Because CI has no user session, the signed-in consent/sync/export/deletion sequence remains a controlled manual production smoke using synthetic data.

## One-time production configuration

### Infisical and GitHub production environment

Infisical is authoritative. Populate all required production values in `prod` at `/apps/web`:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID`;
- `PUBLIC_CLERK_PUBLISHABLE_KEY`;
- `CLERK_SECRET_KEY`;
- `CLERK_WEBHOOK_SIGNING_SECRET`;
- `PUBLIC_TURNSTILE_SITE_KEY`;
- `TURNSTILE_SECRET_KEY`.

Configure Infisical identity `812097c6-b028-4a21-9af0-291ebc835cfa` for GitHub OIDC with read/describe access limited to this project's `prod` `/apps/web` path. Its trust policy must accept only the `miktomic/schngn` workflow on a GitHub-hosted runner, a push to `main`, and GitHub Environment `production`; use audience `https://github.com/miktomic`. Keep the identity's organization and broad project roles at no access so the path-scoped additional privilege is the effective permission.

Keep the GitHub Environment `production` restricted to `main` and apply any desired reviewer protections. It is the deployment and OIDC trust boundary, not a value store: do not create GitHub Actions secret/variable copies and do not configure an Infisical Secret Sync. The deploy job alone receives `id-token: write`; repository and pull-request validation retain `contents: read` only.

Use a least-privilege Cloudflare token scoped to the SCHNGN account/zone. It needs the permissions required to deploy Workers, provision/apply D1 migrations, manage the `www` DNS record, and manage the canonical redirect ruleset. Never place any value in this repository, command output, chat, or documentation.

The repository wrapper exchanges the job's short-lived GitHub OIDC token directly with Infisical, fetches and validates the complete seven-value set in memory, and starts each child process from a benign environment allowlist plus only the keys it explicitly requests. The build receives the two public values; Worker-binding preparation receives five bindings; Cloudflare operations receive only the token and account ID. OIDC authentication material is removed from child environments. Any exchange, retrieval, validation, or deployment failure stops production; there is no missing-credentials skip path.

For Worker runtime bindings the workflow creates a mode-`0600` JSON file at a fixed path in `RUNNER_TEMP`, performs inactive `wrangler versions upload --secrets-file`, and unconditionally removes the file before migrations. It recreates the file only for the active deploy and removes it again afterward. The deploy job is serialized through a non-cancelling production concurrency group, so two main pushes cannot race migrations or finish out of order. Production must fail if a required binding is absent; do not replace this with `wrangler secret put`, which immediately deploys a secret-only version.

### Contact delivery

Before deploying the contact route:

- verify `schngn@proton.me` as a Cloudflare Email Routing destination;
- enable `support@schngn.com` forwarding and onboard `schngn.com` for sending from that branded address;
- create a Turnstile widget for `schngn.com` and add its public/secret key pair to Infisical `prod` `/apps/web`;
- confirm Wrangler provisions the fixed `CONTACT_EMAIL` binding and `CONTACT_RATE_LIMITER` namespace.

Submit one synthetic help request and one feature request. Both must arrive at Proton with the visitor email as `Reply-To`; no trip history, account data, IP address, or analytics request may contain the message. A failed Turnstile token must return `400`, a burst over the limit must return `429`, and every response must be `no-store`.

### Clerk production instance

Configure the Clerk production instance for `schngn.com`, including the exact allowed origins and redirect URLs used by the application. Create the production webhook endpoint:

```text
https://schngn.com/api/webhooks/clerk
```

Subscribe it to `user.deleted`, then store the generated signing secret as `CLERK_WEBHOOK_SIGNING_SECRET` in Infisical `prod` `/apps/web`. The account expansion must not deploy until that value passes the workflow's complete-set validation.

If Google signup is enabled, follow [`google-oauth-production-setup.md`](google-oauth-production-setup.md). The public homepage must expose the localized `/privacy` and `/terms` documents in its shared footer before Google branding verification. Google Client ID and Client Secret values live only in the Clerk production Google connection; they are not application or deployment bindings.

Verify in production:

- anonymous calculator use works with Clerk unavailable and no trip request leaves the browser;
- a new signup started through a save-labelled CTA keeps the calculator mounted and automatically stores the current guest trips only after Clerk completes account creation;
- ordinary sign-in to an existing account preserves the conflict/reconciliation safeguards before any local or account copy is replaced;
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

- scripts: same origin, `https://clerk.schngn.com`, and `https://challenges.cloudflare.com` for Clerk and contact-form bot protection;
- connections: same origin, `https://clerk.schngn.com`, and `https://plausible.io`;
- images: same origin, `data:`, and `https://img.clerk.com`;
- frames: `https://challenges.cloudflare.com` only;
- workers: same origin plus `blob:` for Clerk, while the PWA service worker remains same-origin.

Clerk's runtime CSS-in-JS and SCHNGN's data-driven inline CSS variables require `style-src 'unsafe-inline'`. Scripts do not allow `unsafe-inline` or `unsafe-eval`. Local Vite builds add only Clerk development tenants plus `ws://127.0.0.1:*` and `ws://localhost:*`; those sources must never appear in a production response. Official-source links are top-level HTTPS navigation and are not resource origins, so they do not need CSP allowlist entries. If Clerk's production Frontend API hostname changes, update `apps/web/csp.config.js`, the security tests, and this runbook together before deploying.

### Cloudflare D1

`apps/web/wrangler.jsonc` declares the `DB` binding without a committed database identifier. Current Wrangler provisions the resource for the binding, and migrations live under `apps/web/migrations/`. Active application data is keyed by the server-verified Clerk user ID and may exist only after an explicit save action: the save-labelled signup CTA records that choice, while existing-account reconciliation retains its own confirmation safeguards. Guest trips never enter D1 before account creation. Fresh databases start with the account schema at `0002`. Migration `0005_drop_waitlist_signups.sql` safely drops the retired table if an already-provisioned database still has it.

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
2. remove that file even if upload fails;
3. apply remote D1 migrations with no Clerk/Turnstile bindings file present;
4. recreate the required bindings file and deploy the verified Worker/static assets to active traffic;
5. remove the deployment file even if deploy fails;
6. ensure the canonical `www` DNS/redirect configuration;
7. run the production route, security-header, account-auth, and domain smoke checks.

Do not deploy production manually. For an emergency redeployment of the current trusted `main` commit, use **Re-run all jobs** on that commit's GitHub Actions run so the full binding, migration, deploy, redirect, and smoke sequence remains intact.

## Go/no-go decision

Production traffic is allowed only when:

- repository and browser gates are green;
- Infisical `prod` `/apps/web` contains the complete verified seven-value production set, and the path-scoped OIDC identity can read it from the protected GitHub `production` deployment;
- GitHub secret scanning/push protection (or an equivalent full-history scanner) is enabled and reports no live credential;
- there are no known result-integrity defects;
- the Privacy Policy and Terms name the real legal operator/controller, include the required contact and jurisdiction details, and have received appropriate legal plus native-language review; generated draft copy is not published as final legal copy;
- Clerk production domain/redirect configuration and the signed lifecycle webhook are verified;
- any enabled Google social connection uses a published production OAuth app, the exact Clerk callback, verified public legal URLs, and a successful end-to-end test in a normal browser;
- guest local-only behavior, signup-and-save consent, existing-account reconciliation, cross-account isolation, repeat-visit sync, export, deletion, and sign-out cache isolation are verified;
- D1 account persistence is verified with a controlled, synthetic signed-in smoke;
- the authenticated account-write edge rate limit is enabled and verified;
- contact email delivery, server-side Turnstile validation, and the contact rate limiter are verified;
- aggregate Plausible events are visible and privacy-audited;
- `www` redirects canonically;
- Cloudflare logs show no new Worker errors after deployment;
- public accuracy copy describes the checked-in evidence without claiming EU certification or unrecorded official-calculator parity.

If any item fails, keep the apex deployment available only for controlled verification, stop paid acquisition, and fix or roll back before resuming.
