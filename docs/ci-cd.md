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
- The engine, capability, and agent packages use the TypeScript 7 native compiler. Bun bundles the
  local agent entry points for Node 24+. The Svelte typecheck temporarily uses
  TypeScript 6 because TypeScript 7.0 does not expose the programmatic API required by
  `svelte-check`.
- Web production is still Cloudflare Workers / `workerd`, not Node. `apps/agent` is a local Node
  process and is never included in the Wrangler deployment.

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
compile-artifact smoke for the agent CLI and stdio MCP server
  ↓
install Chromium + bun run test:e2e
  ↓
inactive version upload provisions bindings (main only)
  + required Clerk and contact-form bindings from an ephemeral runner file
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

The fixture suite verifies published-rule behavior using deterministic cases and an independent day-set oracle. It does not claim captured-output parity with the European Commission calculator.

### Local agent capability gate

`bun run test` includes `packages/capability` and `apps/agent`; focused commands are `bun run test:capability` and `bun run test:agent`.

The gate covers:

- strict schema-version-one inputs with at most 100 explicit `{ entryDate, exitDate }` ranges per stay-list field and a separate candidate range for stay checks;
- rejection of labels, country metadata, identity/account fields, invalid ranges, and unknown fields;
- stable rule-set metadata, semantic statuses, and fixed planning-aid advisory output;
- usage, every-day candidate-stay, and latest-safe-exit operations over the shared engine;
- JSON CLI stdin/file behavior, bounded input, structured errors, and clean stdout;
- loopback-only HTTP binding/request guards, 64 KiB body limits, no-store responses, and OpenAPI 3.1 discovery;
- three read-only MCP tools over stdio with structured output and safe error results.

No agent test may add persistence, telemetry, outbound network calls, or a hosted listener. Remote HTTP or MCP is outside the approved scope and requires a new privacy/authentication/consent decision.

### Build gate

`bun run build` must produce:

- engine TypeScript output
- capability TypeScript output
- Node-targeted local agent bundles for the CLI, loopback API, and stdio MCP server
- SvelteKit Cloudflare output under `.svelte-kit/cloudflare`

`bun run smoke:agent` then launches the compiled Node CLI and stdio MCP bundle against synthetic dates. This catches packaging or entry-point failures that source-level tests cannot see.

### App/browser and privacy gates

US-19 adds two app-level gates, both required by CI:

- `bun run test` includes privacy-network rejection, empty/corrupt/unavailable storage, schema-two multi-stay import validation, optional Schengen border countries, outside-break calculation, dashboard and future-commitment conflicts, dynamic proof/return state, runtime analytics allowlists, authenticated account isolation/consent/export/deletion/webhook checks, D1 migration/config checks, security headers, PWA/offline behavior, SEO, and truthful accuracy evidence.
- `bun run test:e2e` runs Playwright mobile Chromium smoke for `/`, `/accuracy`, `/explainer`, `/faq`, `/contact`, `/privacy`, `/terms`, and `/app`, including inclusive Schengen trip-planning title/meta/hero/CTA coverage, accuracy-page title/official-source/case/non-endorsement coverage, service-worker install/control plus offline `/app` reload coverage, the canonical Timeline and Trips sections, a dedicated localized Explainer rendered with production components, a sourced localized FAQ, the contact-form field/privacy boundary, public legal-page metadata and RTL rendering, expandable saved-trip adjusters, trip validation, reload persistence, JSON export/import, Clerk signup entry points, keyboard focus reachability, and privacy-network assertions.

Before enabling analytics or fake-door flows, CI/manual QA must confirm:

- analytics payloads do not contain trip dates
- analytics payloads do not contain email/PII
- the contact endpoint accepts only user-entered support fields, never trip history, and is separate from account signup, marketing, and analytics
- account signup is delegated to Clerk and never uses the contact form
- guests generate no account trip requests; the save-labelled signup action records explicit storage consent and automatically persists current trips after account creation
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

The local `apps/agent` build is exercised by the repository gate but is not uploaded by Wrangler and does not create a production calculation endpoint. The word “API” in this surface means the in-process TypeScript contract or the loopback-only HTTP service. Any hosted API/MCP phase remains unapproved because it would cause submitted trip dates to leave the operator's machine.

The GitHub Actions production deploy job only runs on `main`, after unit/type/build/browser gates pass, and is attached to the GitHub Environment named `production`. It passes the public Clerk and Turnstile keys into the production build. It then writes the required runtime bindings to a mode-`0600` file under `RUNNER_TEMP`, uploads an inactive version with `wrangler versions upload --secrets-file`, applies D1 migrations, and only then performs the active `wrangler deploy --secrets-file`. An `always()` cleanup step removes that fixed temporary filename directly, so cleanup does not depend on a previous step successfully publishing an output. No `wrangler secret put` command is used because that would create and immediately deploy a secret-only version.

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
- Anonymous `GET /api/account/trips`, empty-trip `PUT /api/account/trips`, and `DELETE /api/account` requests all return `401 authentication_required` with `cache-control: no-store`. The PUT contains no dates or identity fields and proves authentication happens before sync parsing/storage.
- Public responses include the baseline security headers.
- `www.schngn.com` redirects canonically; unresolved or split-domain behavior fails production smoke by default.

The deploy job also runs `bun run cloudflare:canonical-www` before production smoke. That idempotently configures Cloudflare-side canonical host hygiene using the production `CLOUDFLARE_API_TOKEN`: it finds the active `schngn.com` zone, creates or repairs a proxied `www.schngn.com` CNAME pointing at `schngn.com`, and creates or updates a Dynamic Redirect rule for `www.schngn.com` → `https://schngn.com` with HTTP 308 while preserving path and query string. The script logs only resource/action summaries, not token values. If that configuration fails, the deploy should fail rather than silently shipping split-domain behavior.

The public smoke intentionally has no Clerk session, so it cannot prove signed-in synchronization. Before opening account signup broadly, perform a controlled production test account smoke: create a guest trip, choose the save-labelled signup action, complete Clerk signup, verify the automatic D1 write, repeat-visit reload, export, deletion, sign-out cache isolation, and signed `user.deleted` webhook cleanup. Also test ordinary sign-in against an existing account to verify conflict-safe reconciliation. Use synthetic trips only and inspect requests/logs for privacy; delete the test account and rows afterward.

Privacy-safe operations for MVP:

- Use Cloudflare logs plus the smoke script first; no Sentry or equivalent third-party error-monitoring SDK in the MVP.
- Inspect analytics, account sync, Clerk signup, and fake-door payloads with browser/devtools or Playwright before changing those flows.
- Keep operational logs aggregate; never log trip dates, labels, full history, passport/residence details, or secrets.
- Verify account routes return only the current signed-in user’s data, that guests cannot upload trips, that signup-and-save writes only after account creation, and that ordinary sign-in does not bypass reconciliation safeguards.

Rollback/failure notes:

- If `test-build` fails, do not deploy.
- If deploy fails, inspect the GitHub Actions `Deploy production` logs and Wrangler error, then rerun after fixing credentials/routes/config.
- If production smoke fails after deploy, use Cloudflare deployment history to roll back to the previous known-good Worker version or push a small revert/fix commit.
- If D1 migration/account persistence, Clerk authentication/webhook verification, security headers, or the canonical `www` redirect fail, treat the release as incomplete and stop paid traffic until fixed or rolled back.

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
| GitHub Environment: `production` | `PUBLIC_TURNSTILE_SITE_KEY` | Variable | Public contact-form bot-check key |
| GitHub Environment: `production` | `TURNSTILE_SECRET_KEY` | Secret | Server-side contact-form bot verification |

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

`apps/web/wrangler.jsonc` declares the Clerk bindings, Turnstile secret, a fixed-destination Cloudflare Email Service binding, and a contact rate limiter. Production upload/deploy fails clearly when required values are missing. The public Clerk and Turnstile keys are browser-visible; server secrets must never be printed.

The contact binding can send only from `support@schngn.com` to the verified `schngn@proton.me` destination. Inbound mail to the same branded support address is forwarded to Proton by an enabled Cloudflare Email Routing rule. The endpoint validates Turnstile server-side, allows three submissions per minute per transient client key, uses `no-store`, and never logs or automatically attaches trip history.

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

The approved D1 binding is declared without a committed external identifier. Active application rows contain only explicitly consented authenticated account data keyed by the server-verified Clerk user ID. Current Wrangler provisions the resource during inactive version upload:

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

Fresh databases start with `0002_create_account_trip_snapshots.sql`, which owns authenticated snapshots and records `clerk_user_id`, optimistic revision, validated trip JSON, `consent_version`, and `consented_at`. The numbering gap is intentional: the retired `0001` creation migration was removed because there is no production data to preserve. `0005_drop_waitlist_signups.sql` is the idempotent forward cleanup for any database that was already provisioned with the old table.

## Release policy

For now:

1. Work on branches or local commits.
2. PR to `main`.
3. CI must pass.
4. Merge to `main`.
5. Auto-deploy only if Cloudflare credentials and all required Clerk/contact bindings are configured.

No manual deploys from dirty working trees.

Do not publish or deploy the local agent HTTP/MCP surfaces remotely without a new approved product decision covering authentication, explicit consent, privacy disclosure, logging/retention, and abuse controls.
