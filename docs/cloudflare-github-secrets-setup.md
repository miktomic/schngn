# Infisical, Cloudflare, Clerk + GitHub Configuration

Production domain: `https://schngn.com`  
Worker name: `schngn-web`  
Wrangler config: `apps/web/wrangler.jsonc`

Infisical is the authoritative store for SCHNGN application and deployment secrets. GitHub Actions remains the production runner, but it retrieves values directly from Infisical with a short-lived OIDC identity. GitHub stores no duplicate Actions secret/variable copies and no long-lived Infisical credential.

Use this file for credential setup and [`docs/production-readiness.md`](production-readiness.md) for the authoritative release gate and provider verification sequence.

## Current decision

Use the Infisical environments and path below:

| Infisical source | Purpose | Access path |
|---|---|---|
| `dev` at `/apps/web` | Local full-account testing and development-only provider values | Authenticated `infisical run` |
| `prod` at `/apps/web` | Seven production Cloudflare, Clerk, and Turnstile values | Direct GitHub OIDC exchange in the protected production deploy job |

The protected GitHub Environment `production` is a deployment approval and OIDC trust boundary, not a secret store. The deploy job alone receives `id-token: write` and exchanges GitHub's short-lived identity token with Infisical identity `812097c6-b028-4a21-9af0-291ebc835cfa`. Do not configure an Infisical Secret Sync for this repository and do not create GitHub Actions secret or variable copies of the seven values.

## Prerequisites

Before CI can deploy:

1. `schngn.com` must be an active Cloudflare zone.
2. Registrar nameservers must point to Cloudflare.
3. The Infisical project must have `dev` and `prod` environments with the `/apps/web` path.
4. The repo must have a protected GitHub Environment named `production`, restricted to `main`.
5. Infisical identity `812097c6-b028-4a21-9af0-291ebc835cfa` must have the path-scoped GitHub OIDC authentication method described below.
6. The production deploy job must have job-local `id-token: write`; other jobs keep `contents: read`.
7. `apps/web/wrangler.jsonc` must include the custom domain route.

Current route config:

```jsonc
"routes": [
  { "pattern": "schngn.com", "custom_domain": true },
  { "pattern": "www.schngn.com", "custom_domain": true }
]
```

Cloudflare Custom Domains require an exact hostname match. The deploy workflow provisions/repairs the `www` DNS record and an HTTP 308 ruleset redirect to the apex.

## Infisical values to create

Populate provider values directly in Infisical. Never copy a secret through chat, a tracked file, a screenshot, or a shell command. If a credential has appeared in any of those places, rotate it at the provider before adding the replacement to Infisical.

Production `prod` `/apps/web` must contain:

| Name | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Least-privilege Cloudflare deployment token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID used by Wrangler |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser key; intentionally browser-visible |
| `CLERK_SECRET_KEY` | Clerk server key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk endpoint signing secret for `/api/webhooks/clerk` |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public site key for the `/contact` widget |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification key |

Development `dev` `/apps/web` must contain matching Clerk **Development** instance values:

| Name | Requirement |
|---|---|
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Required for local signup/sign-in |
| `CLERK_SECRET_KEY` | Required for authenticated local sync, export, and deletion |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Required only when testing local lifecycle webhooks |
| `PUBLIC_TURNSTILE_SITE_KEY` | Required when testing the contact widget locally |
| `TURNSTILE_SECRET_KEY` | Required when testing server-side Turnstile verification locally |

Google OAuth Client ID and Client Secret stay inside the corresponding Clerk social connection. They are not SCHNGN runtime bindings and do not belong in Infisical, GitHub, or Cloudflare.

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

Do not commit the ID. Enter it directly in Infisical `prod` `/apps/web` as `CLOUDFLARE_ACCOUNT_ID`.

### 4. Populate Infisical and configure direct GitHub OIDC

1. Create or confirm Infisical environments `dev` and `prod`.
2. Create `/apps/web` in both environments and enter the values from the inventory above directly in the Infisical UI.
3. In GitHub repo `miktomic/schngn`, create or confirm Environment `production`; restrict deployments to `main` and add reviewers if desired. Do not add Actions secrets or variables to it.
4. Configure Infisical machine identity `812097c6-b028-4a21-9af0-291ebc835cfa` with organization role **No Access** and broad project role **No Access**.
5. Add only a permanent project additional privilege with:
   - subject `secrets`;
   - actions `describeSecret` and `readValue`;
   - environment condition equal to `prod`;
   - secret-path condition equal to `/apps/web`.
6. Add a GitHub OIDC authentication method:
   - issuer/discovery URL: `https://token.actions.githubusercontent.com`;
   - subject: `repo:miktomic/schngn:environment:production`;
   - audience: `https://github.com/miktomic`;
   - access-token TTL and maximum TTL: 300 seconds;
   - maximum token uses: 1.
7. Bind the stable claims that identify this deployment:
   - `repository=miktomic/schngn`;
   - `repository_id=1293458953`;
   - `repository_owner=miktomic`;
   - `repository_owner_id=62066522`;
   - `environment=production`;
   - `ref=refs/heads/main`;
   - `ref_type=branch`;
   - `event_name=push`;
   - `workflow_ref=miktomic/schngn/.github/workflows/ci.yml@refs/heads/main`;
   - `runner_environment=github-hosted`.
8. Do not bind run IDs, SHA, or actor claims that change on every legitimate deployment.
9. Verify the complete seven-value production set with the repository validator before the first deploy. Confirm that the project has no Infisical Secret Sync configured.

The non-secret identity ID, project ID, and OIDC audience are declared in the workflow. They identify the exchange but cannot retrieve values without the signed GitHub token and the matching Infisical trust policy.

### 5. Configure Clerk production

In the Clerk production instance:

1. Confirm `schngn.com` is the production application domain and the allowed redirect/origin settings match the deployed routes.
2. Create the endpoint `https://schngn.com/api/webhooks/clerk`.
3. Subscribe it to `user.deleted`, the lifecycle event handled for D1 cleanup.
4. Copy the generated signing secret directly into Infisical `prod` `/apps/web` as `CLERK_WEBHOOK_SIGNING_SECRET`. Do not paste it into chat, docs, terminal commands, or the repository.

Clerk remains the identity source. Do not create a duplicate D1 user profile merely to mirror email/name fields. D1 application data is keyed by the Clerk user ID derived from the verified server session, never a client-supplied owner.

For Google signup, use the separate [`Google signup production setup`](google-oauth-production-setup.md) runbook. Google OAuth credentials are entered directly into the Clerk production Google connection and must not be added to Infisical, GitHub, or Cloudflare.

### 6. Configure contact delivery

In Cloudflare before deploying the contact binding:

1. Enable Email Routing or Email Service for `schngn.com`.
2. Add `schngn@proton.me` as a destination address and complete the verification email in Proton Mail.
3. Enable the `support@schngn.com` → `schngn@proton.me` routing rule and onboard `schngn.com` so the Worker may also send from the branded support address.
4. Create a Turnstile widget for `schngn.com` with the action `contact` used by the app.
5. Store its public site key as `PUBLIC_TURNSTILE_SITE_KEY` and its secret as `TURNSTILE_SECRET_KEY` in Infisical `prod` `/apps/web`.

Wrangler restricts `CONTACT_EMAIL` to the one destination and sender. `CONTACT_RATE_LIMITER` permits three attempts per minute before Turnstile verification. No email provider API key is stored in Infisical or GitHub.

### 7. Test locally without exposing secrets

Infisical `dev` `/apps/web` is the single source of truth for local account configuration. Authenticate the Infisical CLI interactively:

```bash
infisical login
```

An Infisical machine-identity ID only identifies the principal; it is not sufficient to authenticate a local process. A developer uses the cached human CLI login. An unattended coding agent needs separately and securely provisioned Universal Auth credentials (or another approved Infisical auth method) supplied by its host secret store—never pasted into chat, committed, or embedded in a command.

Apply local D1 migrations, then inject the development values into the web process without materializing an environment file:

```bash
bun run d1:migrate:local
bun run secrets:check:dev
bun run dev:infisical
```

The committed `.infisical.json` selects the non-secret project. The committed `apps/web/.env.example` documents names only; normal full-account testing does not copy values into `.env.local` or `.dev.vars`. The CLI injects them into both Vite and the emulated Worker process.

If locally authenticated with `wrangler login`, test:

```bash
cd apps/web
infisical run --env=dev --path=/apps/web -- bun run build
infisical run --env=dev --path=/apps/web -- wrangler deploy --dry-run
```

Production deployment runs only through GitHub Actions, the protected
`production` Environment, and direct OIDC retrieval. For an emergency
redeployment of the current trusted `main` commit, use **Re-run all jobs** on
that commit's GitHub Actions run. This preserves the complete test, two-file
binding lifecycle, inactive upload, migration, active deploy, redirect, and
smoke sequence. Do not substitute a local `bun run deploy`; it is a low-level
Wrangler command and is not the production runbook.

Never materialize the `prod` environment in a local file or inject it into a
local production deploy.

### 8. Test GitHub deploy

Push to `main` after CI is configured.

Expected pipeline:

```text
test-build passes
  ↓
protected production job exchanges a short-lived GitHub OIDC token with Infisical
  ↓
the complete prod /apps/web set is fetched and validated in memory
  ↓
permission-restricted runner file is created from the exact five Worker-binding values
  ↓
inactive version upload provisions the D1 binding plus required Clerk/contact bindings
  ↓
inactive-upload bindings file is removed
  ↓
D1 migrations apply
  ↓
bindings file is recreated and Wrangler deploys schngn-web to active traffic
  ↓
deployment bindings file is removed even if deploy fails
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
- Deploy job is attached to the protected Environment `production` and is the only job granted `id-token: write`.
- GitHub contains no Actions secret/variable copies of the seven production values and no long-lived Infisical token. Infisical Secret Sync is not part of deployment.
- `scripts/run-with-infisical-oidc.mjs` exchanges the short-lived GitHub token with identity `812097c6-b028-4a21-9af0-291ebc835cfa`, fetches and validates the complete `prod` `/apps/web` set in memory, and starts each child from a benign environment allowlist plus only its requested keys.
- The build gets the two public values; the Worker-binding writer gets five bindings; Cloudflare upload/migration/deploy/redirect commands get the token and account ID. OIDC/Infisical auth material is removed from child environments, and public production smoke gets none of these values.
- External actions use audited full commit SHAs with release-version comments, so an upstream moving tag cannot silently change the workflow.
- The Worker JSON is created at fixed `RUNNER_TEMP/schngn-worker-bindings.json` with mode `0600`; an `always()` cleanup removes it before migrations, it is recreated only for active deploy, and a second `always()` cleanup removes it afterward.
- The non-cancelling `schngn-production` concurrency group serializes production jobs, and checkout does not persist GitHub credentials into the working tree.
- OIDC exchange, retrieval, complete-set validation, or any deployment operation failing stops the job. Missing credentials never cause a successful skip.

## If deploy fails

Common failure modes:

| Symptom | Likely cause | Fix |
|---|---|---|
| GitHub OIDC token request fails | Deploy job lacks `id-token: write` or the Environment/branch/event is wrong | Confirm job-local permission and the protected `production` deployment context |
| Infisical OIDC login is denied | Identity trust policy, subject, audience, or bound claims do not match | Compare the identity method with the claims listed in step 4; do not loosen unrelated claims or add a long-lived token |
| Infisical secret fetch is denied | Identity privilege is missing or scoped to the wrong environment/path | Grant only read/describe for `prod` `/apps/web` |
| Production configuration is invalid | Any of the seven values is missing, malformed, or padded with whitespace | Correct the named value directly in Infisical `prod`; do not weaken validation |
| Authentication error | Missing/incorrect `CLOUDFLARE_API_TOKEN` | Recreate the token and update Infisical `prod` |
| Account not found | Missing/wrong `CLOUDFLARE_ACCOUNT_ID` | Correct Infisical `prod` |
| Cannot create/update Worker | Token lacks Workers Scripts Edit | Add Account → Workers Scripts → Edit |
| Cannot attach `schngn.com` | Token lacks Workers Routes Edit or domain is not active zone | Add Zone → Workers Routes → Edit; verify `schngn.com` zone is active |
| DNS/custom domain creation error | Token/zone cannot create needed DNS/cert resources | Add custom domain once in dashboard or temporarily grant needed DNS permission |
| D1 provisioning/migration fails | Token lacks D1 permission or the migration is invalid | Add Account → D1 → Edit; verify locally with `bun run d1:migrate:local` |
| `www` setup fails | Token lacks DNS/Rulesets permission | Grant zone-scoped DNS and Rulesets Edit, then rerun the idempotent setup script |
| Missing required Clerk binding | One of the required production values is absent | Add it to Infisical `prod` and do not weaken complete-set or `secrets.required` validation |
| Clerk webhook returns unauthorized | Wrong endpoint signing secret or unverified request | Recreate/rotate it in Clerk and update Infisical `prod` |
| Signed-in sync returns unauthorized | Clerk domain/session configuration mismatch | Check the production domain, allowed origins/redirects, cookie scope, and Worker secret |

## Rotation and recovery

Rotate at the provider, update the corresponding Infisical environment, validate it, and run the protected deployment. There is no GitHub copy to update or recover.

If a value is missing from Infisical, recover it from the original provider when possible or rotate it. Never introduce a GitHub Actions secret, variable, Infisical Secret Sync, or long-lived Infisical service token as an emergency bypass.
