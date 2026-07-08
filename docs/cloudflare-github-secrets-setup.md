# Cloudflare + GitHub Secrets Setup

Production domain: `https://schngn.com`  
Worker name: `schngn-web`  
Wrangler config: `apps/web/wrangler.jsonc`

This project keeps deployment simple for MVP: Cloudflare deployment credentials live in GitHub Actions secrets/variables, not Infisical.

## Current decision

Use GitHub Environment `production` for deployment credentials.

Why:

- The Cloudflare deploy token is only needed by GitHub Actions.
- GitHub Environment secrets are simple and can later get protection rules/approval gates.
- Infisical remains the upgrade path for centralized rotation/audit or multiple consumers.

## Prerequisites

Before CI can deploy:

1. `schngn.com` must be an active Cloudflare zone.
2. Registrar nameservers must point to Cloudflare.
3. The repo must have a GitHub Environment named `production`.
4. The `production` environment must contain Cloudflare deployment credentials.
5. `apps/web/wrangler.jsonc` must include the custom domain route.

Current route config:

```jsonc
"routes": [
  { "pattern": "schngn.com", "custom_domain": true }
]
```

Cloudflare Custom Domains require an exact hostname match. `schngn.com` does not automatically cover `www.schngn.com`. Add `www` later only after deciding whether to redirect it to apex or serve it as a second custom domain.

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

The workflow accepts account ID from either environment variable or secret:

```yaml
CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID || secrets.CLOUDFLARE_ACCOUNT_ID }}
```

If GitHub UI feels annoying, storing both as **environment secrets** is fine. Account ID is not really secret, but keeping both in one place is acceptable for MVP. We are not building a bank; we are trying not to build a spreadsheet with delusions.

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
| Zone | Workers Routes | Edit | Attach custom domain route `schngn.com` |

Scope resources:

| Resource type | Scope |
|---|---|
| Account resources | Only the account that owns `schngn.com` |
| Zone resources | Only `schngn.com` zone, if Cloudflare UI allows; otherwise all zones in that account as a fallback |

### Add only when needed

| Permission | Add when |
|---|---|
| Account → Workers KV Storage → Edit | We enable KV-backed waitlist storage |
| Account → D1 → Edit | We choose D1 instead of KV for waitlist |
| Account → Workers R2 Storage → Edit | Only if we add R2; not needed now |
| Zone → DNS → Edit | Only if initial custom-domain creation fails because the token cannot create/update DNS records; prefer one-time dashboard setup first |

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
```

Optional but recommended:

- Add deployment branch rule: `main` only.
- Later, add required reviewers if deploys should be manually approved.

### 5. Test deploy locally without exposing secrets

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

### 6. Test GitHub deploy

Push to `main` after CI is configured.

Expected pipeline:

```text
test-build passes
  ↓
deploy-production runs on main
  ↓
Wrangler deploys schngn-web
  ↓
https://schngn.com serves the app
```

## Verification after deploy

Check:

```bash
curl -I https://schngn.com/
curl -I https://schngn.com/app
```

Expected:

- HTTP 200 or appropriate Cloudflare response.
- TLS certificate valid.
- `/app` loads the SvelteKit app shell.

Browser checks:

- Open `https://schngn.com/`.
- Open `https://schngn.com/app`.
- Check browser console for JS errors.
- Confirm no trip data appears in network payloads once analytics are added.

## Current workflow behavior

Workflow file:

```text
.github/workflows/ci.yml
```

Important details:

- Pull requests run test/typecheck/build only.
- Pushes to `main` run test/typecheck/build, then deploy.
- Deploy job is attached to environment `production`.
- If Cloudflare credentials are absent, deploy is skipped with a clear message.

## If deploy fails

Common failure modes:

| Symptom | Likely cause | Fix |
|---|---|---|
| Authentication error | Missing/incorrect `CLOUDFLARE_API_TOKEN` | Recreate token; update GitHub environment secret |
| Account not found | Missing/wrong `CLOUDFLARE_ACCOUNT_ID` | Copy account ID from Cloudflare dashboard |
| Cannot create/update Worker | Token lacks Workers Scripts Edit | Add Account → Workers Scripts → Edit |
| Cannot attach `schngn.com` | Token lacks Workers Routes Edit or domain is not active zone | Add Zone → Workers Routes → Edit; verify `schngn.com` zone is active |
| DNS/custom domain creation error | Token/zone cannot create needed DNS/cert resources | Add custom domain once in dashboard or temporarily grant needed DNS permission |
| KV binding deploy fails later | Token lacks KV permission or namespace ID missing | Add Workers KV Storage Edit and configure namespace |

## Infisical later

If this grows beyond one deploy token, move to Infisical.

Preferred future pattern:

```text
GitHub Actions OIDC → Infisical machine identity → fetch Cloudflare token at runtime
```

Avoid storing a long-lived Infisical service token in GitHub if OIDC is available.
