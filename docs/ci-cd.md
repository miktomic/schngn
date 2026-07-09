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
optional deploy to Cloudflare Workers on main
```

## Required quality gates

### Engine correctness gate

`bun run test` must pass before build or deploy.

Current tests are now a real US-01 correctness gate:

- inclusive entry/exit day counting
- overlapping and duplicate trip de-duplication
- inclusive rolling 180-day look-back
- explicit Schengen country-code allowlist
- Ireland/Cyprus and other non-Schengen country exclusion
- Iceland/Norway/Liechtenstein/Switzerland inclusion
- Bulgaria/Romania MVP baseline inclusion
- 50 EC-rule rolling-window fixtures
- deterministic property checks against an independent day-set oracle
- golden counted-day scenario
- verdict boundary classification at 82/83/89/90/91 days used, including exact-limit versus over-limit distinction and configurable close threshold
- latest safe exit date boundary coverage: no prior trips, 89-used one-day remaining, 90-used null, old-days-aging-out, missing country manual Schengen, and non-Schengen target `null`

### Build gate

`bun run build` must produce:

- engine TypeScript output
- SvelteKit Cloudflare output under `.svelte-kit/cloudflare`

### App/browser and privacy gates

US-19 adds two app-level gates:

- `bun run test` includes `apps/web/tests/privacy-network.test.ts`, which exercises `apps/web/src/lib/privacy/networkPrivacy.ts` and proves forbidden payload fixtures fail loudly. It also includes local-first trip storage tests for empty, saved, corrupt, and unavailable `localStorage` states, US-07 dashboard money-shot scenarios for safe, at-limit, over-limit, imported/saved-trip, and empty states, US-09 simulator scenarios for safe, at-limit, over-limit, invalid-input, max-stay, and non-mutating what-if behavior, US-08 days-coming-back forecast scenarios, US-10/US-11 legal-copy/explanation-state tests, US-15 aggregate-only analytics allowlist tests, US-13 PDF fake-door state/event tests, US-14 paid-unlock bucket/persistence/event tests, US-18 waitlist API tests for D1 insert shape, required consent, safe source/price buckets, and unbound fallback, US-16 landing SEO tests for UK second-home long-tail metadata and trust copy, US-12 accuracy-page tests for official-source framing, curated cases, evidence linking, and unsafe-language rejection, plus US-17 PWA tests for installable manifest metadata, maskable icons, service-worker registration, and offline cache fallback.
- `bun run test:e2e` runs Playwright mobile Chromium smoke for `/`, `/accuracy`, and `/app`, including UK second-home landing title/meta/hero/CTA coverage, accuracy-page title/official-source/case/non-endorsement coverage, US-17 service-worker install/control plus offline `/app` reload coverage, proof/report/privacy/waitlist states, US-04 add/edit/delete/validation behavior, US-05 reload persistence, US-06 JSON export/import/malformed-import behavior, US-07 dynamic latest-safe-exit display, US-09 future-trip simulator safe/unsafe behavior with non-mutating saved trips, US-08 dynamic days-coming-back forecast rows, US-10/US-11 disclaimer/explanation/official-link coverage, US-15 Plausible-compatible event interception with no trip-date/label/email leakage, US-13 PDF fake-door CTA/no-charge/intent coverage, US-14 paid unlock CTA/no-charge/intent coverage, US-18 waitlist email-only POST/consent/confirmation coverage, keyboard focus reachability, and privacy-network assertions.

Before enabling analytics or fake-door flows, CI/manual QA must confirm:

- analytics payloads do not contain trip dates
- analytics payloads do not contain email/PII unless explicitly part of waitlist flow
- waitlist endpoint accepts only email, not trips
- Playwright smoke remains green for the relevant route/state after UI changes

## Deployment

Deployment uses Wrangler from `apps/web` and targets the production domain `https://schngn.com`:

```bash
bun run deploy
```

This runs:

```bash
vite build && wrangler deploy
```

The GitHub Actions production deploy job only runs on `main`, after `test-build` passes, and is attached to the GitHub Environment named `production`.

## Secrets strategy

Full setup runbook: [`docs/cloudflare-github-secrets-setup.md`](cloudflare-github-secrets-setup.md).

Decision for the MVP:

- **GitHub Environment secrets are enough for Cloudflare deployment.** The Cloudflare deploy token is only needed by GitHub Actions, so the production environment is the simplest runtime secret boundary.
- **Use Infisical as the upgrade/source-of-truth path** if we need team-wide secret management, rotation/audit workflows, multiple environments, or the same secret consumed outside GitHub Actions.
- **Do not put Cloudflare credentials in repository secrets unless there is a reason.** Prefer the `production` GitHub Environment so future approval/protection rules apply only to deployment, not to every CI job.

Recommended setup for now:

| Store | Name | Type | Purpose |
|---|---|---|---|
| GitHub Environment: `production` | `CLOUDFLARE_API_TOKEN` | Secret | Least-privilege Wrangler deployment token |
| GitHub Environment: `production` | `CLOUDFLARE_ACCOUNT_ID` | Variable preferred; secret accepted by fallback | Cloudflare account ID used by Wrangler |

The workflow supports `CLOUDFLARE_ACCOUNT_ID` as either an environment variable or secret:

```yaml
CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID || secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Recommended Cloudflare token permissions:

- Workers Scripts: Edit
- Workers Routes: Edit, if route/custom-domain management requires it
- Account Workers KV Storage: Edit, only if using KV waitlist

Do not use a global Cloudflare API key. Create a narrow token for this app.

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

Current scaffold supports a future waitlist binding:

```jsonc
"kv_namespaces": [{ "binding": "WAITLIST", "id": "xxxx" }]
```

Alternative later:

```jsonc
"d1_databases": [{ "binding": "DB", "database_name": "schngn_waitlist", "database_id": "xxxx" }]
```

Do not enable either until the waitlist provider decision is made.

## Release policy

For now:

1. Work on branches or local commits.
2. PR to `main`.
3. CI must pass.
4. Merge to `main`.
5. Auto-deploy only if Cloudflare secrets are configured.

No manual deploys from dirty working trees.
