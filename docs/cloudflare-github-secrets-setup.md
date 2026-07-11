# Cloudflare, Clerk + GitHub Configuration

Production domain: `https://schngn.com`  
Worker name: `schngn-web`  
Wrangler config: `apps/web/wrangler.jsonc`

This project keeps deployment simple: Cloudflare deployment credentials and Clerk runtime bindings live in the GitHub `production` Environment, not Infisical or the repository.

Use this file for credential setup and [`docs/production-readiness.md`](production-readiness.md) for the authoritative release gate and provider verification sequence.

## Current decision

Use GitHub Environment `production` for deployment credentials and Clerk configuration.

Why:

- The Cloudflare deploy token and Clerk server secrets are only needed by GitHub Actions/Workers.
- GitHub Environment secrets are simple and can later get protection rules/approval gates.
- Infisical remains the upgrade path for centralized rotation/audit or multiple consumers.

## Prerequisites

Before CI can deploy:

1. `schngn.com` must be an active Cloudflare zone.
2. Registrar nameservers must point to Cloudflare.
3. The repo must have a GitHub Environment named `production`.
4. The `production` environment must contain Cloudflare deployment credentials and all three Clerk bindings.
5. `apps/web/wrangler.jsonc` must include the custom domain route.

Current route config:

```jsonc
"routes": [
  { "pattern": "schngn.com", "custom_domain": true },
  { "pattern": "www.schngn.com", "custom_domain": true }
]
```

Cloudflare Custom Domains require an exact hostname match. The deploy workflow provisions/repairs the `www` DNS record and an HTTP 308 ruleset redirect to the apex.

## GitHub values to create

In GitHub repo `miktomic/schngn`:

```text
Settings → Environments → production
```

Create:

| Name | GitHub type | Value |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Environment secret | Cloudflare API token value |
| `CLOUDFLARE_ACCOUNT_ID` | Environment variable preferred; secret also works | Cloudflare account ID |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Environment variable | Clerk publishable key; intentionally browser-visible |
| `CLERK_SECRET_KEY` | Environment secret | Clerk server key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Environment secret | Clerk endpoint signing secret for `/api/webhooks/clerk` |

The workflow accepts account ID from either environment variable or secret:

```yaml
CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID || secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Keep `PUBLIC_CLERK_PUBLISHABLE_KEY` as a variable because it is part of the browser client configuration. Keep both other Clerk values as secrets. The account feature must not deploy until `CLERK_WEBHOOK_SIGNING_SECRET` has been created from the production Clerk webhook endpoint and added here.

## Cloudflare API token setup

In Cloudflare dashboard:

```text
My Profile → API Tokens → Create Token
```

Cloudflare docs recommend starting from:

```text
Custom → Edit Cloudflare Workers
```

Then restrict scope as tightly as possible.

### Minimum practical permissions for current SCHNGN deploy

Use these permissions for the CI deploy token:

| Scope | Permission | Level | Why |
|---|---|---|---|
| Account | Account Settings | Read | Wrangler/account lookup |
| Account | Workers Scripts | Edit | Create/update `schngn-web` Worker and static assets |
| Account | D1 | Edit | Provision the account database and apply migrations |
| Zone | Workers Routes | Edit | Attach custom domain route `schngn.com` |
| Zone | DNS | Edit | Create/repair the proxied `www` record |
| Zone | Rulesets | Edit | Create/repair the canonical HTTP 308 redirect |

Scope resources:

| Resource type | Scope |
|---|---|
| Account resources | Only the account that owns `schngn.com` |
| Zone resources | Only `schngn.com` zone, if Cloudflare UI allows; otherwise all zones in that account as a fallback |

### Do not add without a feature need

| Permission | Add when |
|---|---|
| Account → Workers R2 Storage → Edit | Only if we add R2; not needed now |

Do **not** use the global Cloudflare API key.

## One-time Cloudflare setup path

### 1. Add domain to Cloudflare

If not already done:

```text
Cloudflare dashboard → Websites → Add a site → schngn.com
```

Then update registrar nameservers to Cloudflare.

### 2. Create the API token

Use the permission table above.

Copy the token once. Do not paste it into chat, docs, screenshots, shell history, or the repo.

### 3. Find account ID

Cloudflare dashboard:

```text
Account Home → right sidebar / account details → Account ID
```

Or for a local authenticated Wrangler session:

```bash
cd apps/web
wrangler whoami
```

Do not commit the ID into secret files. It may live as a GitHub Actions variable.

### 4. Add GitHub Environment values

GitHub UI:

```text
Repo → Settings → Environments → New environment → production
```

Add:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SIGNING_SECRET
```

Optional but recommended:

- Add deployment branch rule: `main` only.
- Later, add required reviewers if deploys should be manually approved.

### 5. Configure Clerk production

In the Clerk production instance:

1. Confirm `schngn.com` is the production application domain and the allowed redirect/origin settings match the deployed routes.
2. Create the endpoint `https://schngn.com/api/webhooks/clerk`.
3. Subscribe it to `user.deleted`, the lifecycle event handled for D1 cleanup.
4. Copy the generated signing secret directly into the GitHub `production` Environment as `CLERK_WEBHOOK_SIGNING_SECRET`. Do not paste it into chat, docs, terminal commands, or the repository.

Clerk remains the identity source. Do not create a duplicate D1 user profile merely to mirror email/name fields. D1 application data is keyed by the Clerk user ID derived from the verified server session, never a client-supplied owner.

### 6. Test locally without exposing secrets

For local Clerk development, place development-instance values in ignored `apps/web/.env.local` or `apps/web/.dev.vars`. Use names only matching the production bindings:

```dotenv
PUBLIC_CLERK_PUBLISHABLE_KEY=replace-with-development-value
CLERK_SECRET_KEY=replace-with-development-value
CLERK_WEBHOOK_SIGNING_SECRET=replace-with-development-value
```

Both `.env*` and `.dev.vars*` are ignored. Never use production keys in a committed example file.

If locally authenticated with `wrangler login`, test:

```bash
cd apps/web
bun run build
wrangler deploy --dry-run
```

For a real local deploy:

```bash
cd apps/web
bun run deploy
```

Only do real deploys from a clean working tree.

### 7. Test GitHub deploy

Push to `main` after CI is configured.

Expected pipeline:

```text
test-build passes
  ↓
permission-restricted runner file is created from GitHub Clerk values
  ↓
inactive version upload provisions the D1 binding and required Clerk bindings
  ↓
D1 migrations apply
  ↓
Wrangler deploys schngn-web to active traffic with the same required bindings
  ↓
temporary runner file is removed even if upload/deploy fails
  ↓
www DNS/redirect configuration and blocking smoke pass
  ↓
https://schngn.com serves the app
```

## Verification after deploy

Check:

```bash
curl -I https://schngn.com/
curl -I https://schngn.com/app
curl -I https://www.schngn.com/
```

Expected:

- HTTP 200 or appropriate Cloudflare response.
- TLS certificate valid.
- `/app` loads the SvelteKit app shell.
- `www` redirects to the apex with path/query preserved.
- Clerk signup/sign-in opens successfully on the production domain.
- A guest creates no account trip requests and remains local-only.
- The automated production smoke confirms anonymous account GET/PUT/DELETE requests return `401 authentication_required` with `cache-control: no-store`.
- A signed-in user can consent to sync, reload their own data, export it, and delete it.
- A signed-in user cannot read/write another account by changing request fields; ownership comes from the verified Clerk session.
- The Clerk deletion webhook is signature-verified and removes the matching D1 account data idempotently.

Browser checks:

- Open `https://schngn.com/`.
- Open `https://schngn.com/app`.
- Check browser console for JS errors.
- Confirm Plausible aggregate events arrive without trip dates, labels, email, or calculated timelines.
- Confirm Cloudflare logs contain no trip dates, labels, histories, account email, or Clerk user IDs.

The signed-in checks require a controlled production test account and synthetic trips; they are not performed by the unauthenticated CI smoke. Delete the test account/application rows after verification.

## Current workflow behavior

Workflow file:

```text
.github/workflows/ci.yml
```

Important details:

- Pull requests run unit/privacy tests, typecheck, build, and Playwright mobile Chromium.
- Pushes to `main` run the same gates, then an inactive upload with ephemeral Clerk bindings, D1 migrations, active deploy with those bindings, guaranteed temporary-file cleanup, canonical redirect setup, and blocking production smoke.
- Deploy job is attached to environment `production`.
- Job scope receives only a non-secret configured/not-configured gate. Cloudflare credential values are exposed only to the upload, migration, deploy, and redirect steps that require them; public production smoke keeps only the non-secret gate and base URL behavior.
- External actions use audited full commit SHAs with release-version comments, so an upstream moving tag cannot silently change the workflow.
- Cleanup always removes the fixed `RUNNER_TEMP/schngn-worker-bindings.json` path and does not rely on a previous step output.
- If Cloudflare credentials are absent, deploy is skipped with a clear message.
- If Cloudflare deployment is enabled but any required Clerk binding is missing, deployment fails before provisioning.

## If deploy fails

Common failure modes:

| Symptom | Likely cause | Fix |
|---|---|---|
| Authentication error | Missing/incorrect `CLOUDFLARE_API_TOKEN` | Recreate token; update GitHub environment secret |
| Account not found | Missing/wrong `CLOUDFLARE_ACCOUNT_ID` | Copy account ID from Cloudflare dashboard |
| Cannot create/update Worker | Token lacks Workers Scripts Edit | Add Account → Workers Scripts → Edit |
| Cannot attach `schngn.com` | Token lacks Workers Routes Edit or domain is not active zone | Add Zone → Workers Routes → Edit; verify `schngn.com` zone is active |
| DNS/custom domain creation error | Token/zone cannot create needed DNS/cert resources | Add custom domain once in dashboard or temporarily grant needed DNS permission |
| D1 provisioning/migration fails | Token lacks D1 permission or the migration is invalid | Add Account → D1 → Edit; verify locally with `bun run d1:migrate:local` |
| `www` setup fails | Token lacks DNS/Rulesets permission | Grant zone-scoped DNS and Rulesets Edit, then rerun the idempotent setup script |
| Missing required Clerk binding | One of the three GitHub production values is absent | Add the named variable/secret; do not weaken `secrets.required` |
| Clerk webhook returns unauthorized | Wrong endpoint signing secret or unverified request | Recreate/rotate the endpoint secret in Clerk and update only the GitHub environment secret |
| Signed-in sync returns unauthorized | Clerk domain/session configuration mismatch | Check the production domain, allowed origins/redirects, cookie scope, and Worker secret |

## Infisical later

If this grows beyond one deploy token, move to Infisical.

Preferred future pattern:

```text
GitHub Actions OIDC → Infisical machine identity → fetch Cloudflare token at runtime
```

Avoid storing a long-lived Infisical service token in GitHub if OIDC is available.
