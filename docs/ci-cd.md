# SCHNGN CI/CD

## Goals

The pipeline has one job: prevent a wrong Schengen calculator from shipping. Everything else is secondary garnish.

## CI trigger

GitHub Actions runs on:

- every pull request
- every push to `main`

Workflow file:

```text
.github/workflows/ci.yml
```

## CI stages

Toolchain policy:

- Node is pinned to `24` through `.node-version` and `.nvmrc` for Node-based tooling.
- Bun is pinned to `1.3.14` through `.bun-version` and the root `packageManager` field.
- The engine build uses the TypeScript 7 native compiler. The Svelte typecheck temporarily uses
  TypeScript 6 because TypeScript 7.0 does not expose the programmatic API required by
  `svelte-check`.
- Production is still Cloudflare Workers / `workerd`, not Node.

```text
checkout
  ↓
setup Node 24 from `.node-version`
  ↓
setup Bun 1.3.14
  ↓
bun install --frozen-lockfile
  ↓
bun run test
  ↓
bun run typecheck
  ↓
bun run build
  ↓
install Chromium + bun run test:e2e
  ↓
inactive version upload provisions bindings (main only)
  + required Clerk bindings from an ephemeral runner file
  ↓
apply D1 migrations
  ↓
deploy active Worker + configure www redirect
  ↓
blocking production smoke checks
```

## Required quality gates

### Engine correctness gate

`bun run test` must pass before build or deploy.

Current tests are a real published-rule correctness gate:

- inclusive entry/exit day counting
- overlapping and duplicate trip de-duplication
- inclusive rolling 180-day look-back
- explicit Schengen stay-range inputs with country classification outside the engine
- outside-Schengen gaps preserved when a multi-country journey is flattened
- country-annotated source fixtures adapted to explicit counted ranges before the engine call
- 50 EC-rule rolling-window fixtures
- deterministic property checks against an independent day-set oracle
- golden counted-day scenario
- verdict boundary classification at 82/83/89/90/91 days used, including exact-limit versus over-limit distinction and configurable close threshold
- latest safe exit date boundary coverage: no prior stays, 89-used one-day remaining, 90-used null, and old days aging out

### Build gate

`bun run build` must produce:

- engine TypeScript output
- SvelteKit Cloudflare output under `.svelte-kit/cloudflare`

### App/browser and privacy gates

US-19 adds two app-level gates, both required by CI:

- `bun run test` includes privacy-network rejection, empty/corrupt/unavailable storage, schema-two multi-stay import validation, optional Schengen border countries, outside-break calculation, dashboard and future-commitment conflicts, dynamic proof/return state, runtime analytics allowlists, strict email-only waitlist parsing, authenticated account isolation/consent/export/deletion/webhook checks, D1 migration/config checks, security headers, PWA/offline behavior, SEO, and truthful accuracy evidence.
- `bun run test:e2e` runs Playwright mobile Chromium smoke for `/`, `/accuracy`, and `/app`, including UK second-home landing title/meta/hero/CTA coverage, accuracy-page title/official-source/case/non-endorsement coverage, US-17 service-worker install/control plus offline `/app` reload coverage, proof/report/privacy/waitlist states, US-04 add/edit/delete/validation behavior, US-05 reload persistence, US-06 JSON export/import/malformed-import behavior, US-07 dynamic latest-safe-exit display, US-09 future-trip simulator safe/unsafe behavior with non-mutating saved trips, US-08 dynamic days-coming-back forecast rows, US-10/US-11 disclaimer/explanation/official-link coverage, US-15 Plausible-compatible event interception with no trip-date/label/email leakage, US-13 PDF fake-door CTA/no-charge/intent coverage, US-14 paid unlock CTA/no-charge/intent coverage, US-18 waitlist email-only POST/consent/confirmation coverage, keyboard focus reachability, and privacy-network assertions.

Before enabling analytics or fake-door flows, CI/manual QA must confirm:

- analytics payloads do not contain trip dates
- analytics payloads do not contain email/PII unless explicitly part of waitlist flow
- waitlist endpoint accepts only email, not trips
- guests generate no account trip requests; authenticated sync requires explicit consent
- account endpoints derive the owner from the verified Clerk session, never request data
- account trips, Clerk user IDs, and identity data do not enter analytics or logs
- Playwright smoke remains green for the relevant route/state after UI changes

## Deployment

Deployment uses Wrangler from `apps/web` and targets the production domain `https://schngn.com` plus a canonical `www.schngn.com` custom-domain redirect route:

```bash
bun run deploy
```

This runs:

```bash
vite build && wrangler deploy
```

The GitHub Actions production deploy job only runs on `main`, after unit/type/build/browser gates pass, and is attached to the GitHub Environment named `production`. It passes the publishable Clerk key into the production build. It then writes the three required Clerk runtime bindings to a mode-`0600` file under `RUNNER_TEMP`, uploads an inactive version with `wrangler versions upload --secrets-file`, applies D1 migrations, and only then performs the active `wrangler deploy --secrets-file`. An `always()` cleanup step removes that fixed temporary filename directly, so cleanup does not depend on a previous step successfully publishing an output. No `wrangler secret put` command is used because that would create and immediately deploy a secret-only version.

The deploy job keeps only a derived `true`/`false` configuration gate at job scope. Raw Cloudflare credentials are injected separately into the inactive upload, migration, active deploy, and canonical-redirect steps that need them; checkout, dependency installation, build, Clerk binding preparation, cleanup, and public production smoke do not receive those values. Every external GitHub Action is pinned to a reviewed 40-character commit SHA, with its release version retained in a comment for upgrade review.

## Post-deploy smoke and privacy-safe operations

Run the production smoke script after every deploy:

```bash
bun run smoke:production
```

The script verifies:

- `https://schngn.com/`, `/app`, and `/accuracy` return healthy HTML and expected launch copy.
- PWA/static assets `/manifest.json`, `/service-worker.js`, `/favicon.png`, the production wordmark/social card, a maskable icon, `/robots.txt`, and `/sitemap.xml` return healthy responses.
- Canonical metadata and sitemap content stay on the apex domain, not `www.schngn.com`.
- `/api/waitlist` accepts one deterministic `production-smoke@schngn.invalid` email-only request and reports `stored: true` (the fixed address is upserted, not multiplied on every deploy).
- The smoke request does not submit trip dates, trip history, country timelines, names, passports, secrets, or other traveler data.
- Anonymous `GET /api/account/trips`, empty-trip `PUT /api/account/trips`, and `DELETE /api/account` requests all return `401 authentication_required` with `cache-control: no-store`. The PUT contains no dates or identity fields and proves authentication happens before sync parsing/storage.
- Public responses include the baseline security headers.
- `www.schngn.com` redirects canonically; unresolved or split-domain behavior fails production smoke by default.

The deploy job also runs `bun run cloudflare:canonical-www` before production smoke. That idempotently configures Cloudflare-side canonical host hygiene using the production `CLOUDFLARE_API_TOKEN`: it finds the active `schngn.com` zone, creates or repairs a proxied `www.schngn.com` CNAME pointing at `schngn.com`, and creates or updates a Dynamic Redirect rule for `www.schngn.com` → `https://schngn.com` with HTTP 308 while preserving path and query string. The script logs only resource/action summaries, not token values. If that configuration fails, the deploy should fail rather than silently shipping split-domain behavior.

The public smoke intentionally has no Clerk session, so it cannot prove signed-in synchronization. Before opening account signup broadly, perform a controlled production test account smoke: opt in, sync, repeat-visit reload, export, deletion, sign-out cache isolation, and signed `user.deleted` webhook cleanup. Use synthetic trips only and inspect requests/logs for privacy; delete the test account and rows afterward.

Privacy-safe operations for MVP:

- Use Cloudflare logs plus the smoke script first; no Sentry or equivalent third-party error-monitoring SDK in the MVP.
- Inspect analytics, account sync, waitlist, and fake-door payloads with browser/devtools or Playwright before changing those flows.
- Keep operational logs aggregate; never log trip dates, labels, full history, passport/residence details, or secrets.
- Verify account routes return only the current signed-in user’s data, and verify that a guest or signed-in user without sync consent cannot upload trips.

Rollback/failure notes:

- If `test-build` fails, do not deploy.
- If deploy fails, inspect the GitHub Actions `Deploy production` logs and Wrangler error, then rerun after fixing credentials/routes/config.
- If production smoke fails after deploy, use Cloudflare deployment history to roll back to the previous known-good Worker version or push a small revert/fix commit.
- If D1 migration, waitlist/account persistence, Clerk authentication/webhook verification, security headers, or the canonical `www` redirect fail, treat the release as incomplete and stop paid traffic until fixed or rolled back.

## Secrets strategy

Full setup runbook: [`docs/cloudflare-github-secrets-setup.md`](cloudflare-github-secrets-setup.md).

Decision for production:

- **GitHub Environment variables/secrets are the current deployment source.** The production environment is the simplest boundary for Cloudflare credentials and Clerk Worker bindings.
- **Use Infisical as the upgrade/source-of-truth path** if we need team-wide secret management, rotation/audit workflows, multiple environments, or the same secret consumed outside GitHub Actions.
- **Do not put deployment credentials in repository-wide secrets unless there is a reason.** Prefer the `production` GitHub Environment so future approval/protection rules apply only to deployment, not to every CI job.

Recommended setup for now:

| Store | Name | Type | Purpose |
|---|---|---|---|
| GitHub Environment: `production` | `CLOUDFLARE_API_TOKEN` | Secret | Least-privilege Wrangler deployment token |
| GitHub Environment: `production` | `CLOUDFLARE_ACCOUNT_ID` | Variable preferred; secret accepted by fallback | Cloudflare account ID used by Wrangler |
| GitHub Environment: `production` | `PUBLIC_CLERK_PUBLISHABLE_KEY` | Variable | Public client key used at build time and as a Worker binding |
| GitHub Environment: `production` | `CLERK_SECRET_KEY` | Secret | Clerk server authentication/API key |
| GitHub Environment: `production` | `CLERK_WEBHOOK_SIGNING_SECRET` | Secret | Verifies Clerk lifecycle webhooks |

The workflow supports `CLOUDFLARE_ACCOUNT_ID` as either an environment variable or secret:

```yaml
CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID || secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Recommended Cloudflare token permissions:

- Workers Scripts: Edit
- Workers Routes: Edit, if route/custom-domain management requires it
- D1: Edit, for automatic binding provisioning and migrations
- Zone DNS: Edit, for the canonical `www` record
- Zone Rulesets: Edit, for the HTTP 308 redirect rule

Do not use a global Cloudflare API key. Create a narrow token for this app.

`apps/web/wrangler.jsonc` declares all three Clerk binding names under `secrets.required`. Production upload/deploy fails clearly when any one is missing. `PUBLIC_CLERK_PUBLISHABLE_KEY` is safe to expose to the browser, but the workflow still includes it in the temporary bindings file so SvelteKit’s Worker runtime can read the same configured value without committing it. The other two values must never be printed.

The production webhook endpoint is `https://schngn.com/api/webhooks/clerk`. Configure it in Clerk for the required account-lifecycle event set and place its generated signing secret in `CLERK_WEBHOOK_SIGNING_SECRET` before deployment. The current production workflow must not deploy the account expansion until this third value exists.

### When to use Infisical

Use Infisical for SCHNGN if any of these become true:

- more than GitHub Actions needs the Cloudflare token;
- we add staging/preview/prod secret matrices;
- we want centralized audit/rotation;
- we want Infisical Secret Syncs to push secrets into GitHub Environment secrets;
- we want GitHub Actions to fetch secrets from Infisical via OIDC machine identity at runtime.

If using Infisical with GitHub Actions, prefer **GitHub OIDC → Infisical machine identity** over storing a long-lived Infisical service token in GitHub. Otherwise we merely move the turtle one layer down and call it architecture.

Do not store secrets in the repo, docs, wiki, logs, screenshots, or chat output.

## Cloudflare resources

The approved D1 binding is declared without a committed external identifier. It contains separate schemas for consented waitlist email and authenticated account data; account rows are keyed by the server-verified Clerk user ID. Current Wrangler provisions the resource during inactive version upload:

```jsonc
"d1_databases": [
  { "binding": "DB", "migrations_dir": "migrations" }
]
```

Schema migrations live in `apps/web/migrations/` and are applied locally/remotely with:

```bash
bun run d1:migrate:local
bun run d1:migrate:remote
```

`0001_create_waitlist_signups.sql` owns the email-only waitlist. `0002_create_account_trip_snapshots.sql` owns authenticated snapshots and records `clerk_user_id`, optimistic revision, validated trip JSON, `consent_version`, and `consented_at`. Do not join or repurpose the waitlist as an account identity table.

## Release policy

For now:

1. Work on branches or local commits.
2. PR to `main`.
3. CI must pass.
4. Merge to `main`.
5. Auto-deploy only if Cloudflare credentials and all required Clerk bindings are configured.

No manual deploys from dirty working trees.
