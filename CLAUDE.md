# SCHNGN Agent Context

This file is the canonical project context for coding agents. `AGENTS.md` must remain a symlink to this file so Claude Code, Codex, and other agents read the same instructions.

If this file conflicts with source code or docs, inspect the source and update this file. Do not preserve stale instructions out of politeness; stale context is just technical debt with better typography.

## Project

SCHNGN is a privacy-first Schengen 90/180-day tracker and trip planner.

The product is **Option B Web/PWA** with an approved optional-account expansion:

- Mobile-first web app/PWA.
- Anonymous use without login; guest trip storage is local-only.
- Optional Clerk signup for repeat visits and cross-device sync.
- Signed-in trip storage in Cloudflare D1 only after explicit consent.
- Provably-correct Schengen calculation engine.
- Free calculator plus fake-door paid unlock/PDF validation.
- No GPS, passport scanning, OCR, automatic guest upload, global visa/tax rule engine, or legal advice workflow.

Primary product promise:

> Tell a traveler whether their planned Schengen trip is safe, explain why, and let them keep it local or explicitly sync it to their account.

## Non-negotiables

1. **Correctness gates everything.** The 90/180-day engine is safety-critical. UI polish must not outrun engine correctness.
2. **Guests stay local-only.** Never send an anonymous traveler’s trip dates, full travel history, or calculated timeline to a server. A signed-in traveler’s trips may enter D1 only after explicit sync consent; trip data still never enters analytics or logs.
3. **No legal advice.** Use fixed, human-reviewed explanatory copy and clear disclaimers.
4. **No secrets in repo/docs/logs.** Do not print or commit Cloudflare tokens, API keys, cookies, OAuth material, or `.env` contents.
5. **Authenticated ownership is server-derived.** Account data is keyed by the verified Clerk user ID. Never accept a client-supplied owner, and never persist guest trips server-side.
6. **Node 24+ is the Node tooling baseline.** It is pinned through `.node-version` and `.nvmrc`; GitHub Actions uses Node-24-compatible actions and `actions/setup-node`.
7. **Bun 1.3.14 remains the build/test/package runner.** Production still runs on Cloudflare Workers (`workerd`), not Node or Bun.
8. **TypeScript 7 is the root and engine compiler baseline.** Keep the Svelte web workspace on TypeScript 6 until TypeScript 7 exposes the programmatic API required by Svelte tooling; do not force an unsupported repo-wide 7.x resolution.

## Current architecture

Read these before making structural changes:

- `docs/architecture.md`
- `docs/repo-structure.md`
- `docs/ci-cd.md`
- `docs/cloudflare-github-secrets-setup.md`
- `docs/product-decisions.md`
- `docs/mvp-implementation-kanban.md`

Runtime model:

```text
Production domain: https://schngn.com
Build/dev/test: Bun 1.3.14; Node 24+; TypeScript 7 engine + TypeScript 6 Svelte tooling
App framework: SvelteKit + Vite
Production: Cloudflare Workers + Static Assets
Core logic: packages/engine, pure TypeScript
Trip data: guest browser storage; consented signed-in sync in Cloudflare D1
Identity: optional Clerk accounts; Clerk is the identity source of truth
Dynamic Worker routes: authenticated account/sync/export/deletion endpoints plus Clerk lifecycle webhook
```

Important consequence:

- Code shipped to the browser or Worker must avoid Bun-native APIs (`bun:sqlite`, filesystem access, subprocesses, raw sockets).
- The engine package must remain runtime-agnostic and dependency-light.

## Repository structure

```text
schngn/
├── apps/
│   └── web/                         # SvelteKit app, Cloudflare Worker/static assets target
│       ├── src/routes/+page.svelte  # SEO landing page
│       ├── src/routes/app/+page.svelte
│       ├── src/routes/api/account/   # authenticated account trip API
│       ├── src/routes/api/webhooks/  # verified Clerk lifecycle webhook
│       ├── src/lib/account/          # consent, repository, reconciliation
│       ├── src/lib/auth/             # Clerk browser and Worker auth boundaries
│       └── migrations/               # account schemas plus idempotent retired-table cleanup
├── packages/
│   └── engine/                      # Pure TS Schengen calculation engine
│       ├── src/index.ts
│       └── tests/engine.test.ts
├── docs/                            # Architecture, CI/CD, product/design docs
├── sketches/                        # Design prototypes and Pencil-generated variations
├── .github/workflows/ci.yml
├── package.json
├── bun.lock
└── tsconfig.base.json
```

Supporting implementation areas:

```text
packages/engine/tests/fixtures/ec/*.json # US-01 fixture gate exists
apps/web/src/lib/trips/         # validated local trip CRUD/storage
apps/web/src/lib/account/       # authenticated D1 sync and conflict handling
apps/web/src/lib/auth/          # Clerk client/server integration
apps/web/src/lib/analytics/     # aggregate-only event boundary
apps/web/src/lib/import-export/ # private JSON backup/restore
```

`/app` is one continuous responsive workspace, not a tabbed screen router. Stable hashes address `status`, `timeline`, `trips`, `details`, `report`, and `account`; legacy `?section=` links are canonicalized by `apps/web/src/lib/navigation/appAnchor.ts`, with the retired planner destination mapping to `trips`. There is one collapsed-by-default trip-entry flow at the top of the workspace. The canonical timeline is the primary view and appears before the saved-trip list. Saved trips share one user-facing model regardless of whether their dates are past or future, and every saved trip can be adjusted from the canonical timeline before changes are explicitly committed.

## Commands

Global Bun may not be installed on every machine. Node-based tooling should use Node 24+ from `.node-version` / `.nvmrc`. If `bun` is missing, use the pinned `npx` form.

Preferred:

```bash
bun install
bun run test
bun run typecheck
bun run build
bun run check
bun run dev
```

Pinned no-global-Bun fallback:

```bash
npx -y bun@1.3.14 install
npx -y bun@1.3.14 run test
npx -y bun@1.3.14 run typecheck
npx -y bun@1.3.14 run build
npx -y bun@1.3.14 run check
```

Useful focused commands:

```bash
bun run test:engine
cd apps/web && bun run check
cd apps/web && bun run dev -- --host 127.0.0.1 --port 5173
```

`bun run check` is the local CI equivalent: tests + Svelte/TS typecheck + build.

## CI/CD

Workflow:

```text
.github/workflows/ci.yml
```

Pipeline:

```text
bun install --frozen-lockfile
bun run test
bun run typecheck
bun run build
bun run test:e2e
inactive resource provisioning + D1 migrations
optional deploy, canonical-domain setup, and blocking smoke on main if Cloudflare credentials and required Clerk bindings exist
```

Deployment secret policy:

- Use GitHub Environment `production` for the initial Cloudflare deploy boundary.
- Store `CLOUDFLARE_API_TOKEN` as a production environment secret.
- Store `CLOUDFLARE_ACCOUNT_ID` as a production environment variable when possible; the workflow accepts a secret fallback.
- Store `PUBLIC_CLERK_PUBLISHABLE_KEY` as a production environment variable.
- Store `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SIGNING_SECRET` as production environment secrets.
- Upload Clerk runtime bindings through a permission-restricted temporary runner file passed to inactive `wrangler versions upload --secrets-file`; delete it even on failure and pass it again only at the gated active deploy.
- Use a least-privilege Cloudflare API token, not a global API key.
- Use Infisical later if we need centralized audit/rotation, staging/prod matrices, Secret Syncs, or GitHub OIDC machine identity retrieval.
- If using Infisical with GitHub Actions, prefer GitHub OIDC to an Infisical machine identity over storing a long-lived Infisical service token in GitHub.

Do not invent or commit these values. Configure them in GitHub/Cloudflare/Infisical only.

## Engine rules

Package: `packages/engine`

Allowed:

- Pure TypeScript.
- Date arithmetic and Schengen rule logic.
- Fixtures, property tests, golden-master tests.

Forbidden:

- Browser APIs.
- Svelte/UI code.
- Cloudflare APIs.
- Bun-native APIs.
- Network calls.
- Server persistence.

Correctness requirements from MVP backlog:

- Entry and exit days both count.
- Rolling window is the inclusive 180-day period ending on a reference date.
- Overlapping/adjacent trips must be de-duplicated; no double-counting physical days.
- Engine inputs are explicit continuous Schengen stay ranges; country metadata never changes the math.
- Trips with time outside Schengen are flattened into multiple stay ranges, preserving inclusive exit/re-entry boundary days and excluding only the full calendar-day gaps.
- The web layer owns the current Schengen border-country allowlist for optional entry/exit context; it never sends non-Schengen records to the engine.
- Remaining days = `90 - used`, floored at zero for display.
- Over-limit state must still expose over-by days.

US-01 is implemented as a published-rule correctness gate: `packages/engine/tests/engine.test.ts` adapts 50 country-annotated source fixtures into explicit Schengen stay ranges, runs deterministic property checks against an independent day-set oracle, and includes golden counted-day scenarios. Do not claim direct European Commission calculator output parity until captured official outputs and provenance are added.

## Web app rules

Package: `apps/web`

Allowed:

- SvelteKit UI.
- Browser local storage / IndexedDB.
- PWA/offline support.
- Privacy-safe analytics wrappers.
- Authenticated account and Clerk lifecycle Worker endpoints.
- Optional Clerk authentication and authenticated D1 trip sync.
- User-initiated account-data export and deletion.

Forbidden:

- Sending trip dates to analytics, logs, or any anonymous endpoint.
- Persisting trips server-side for guests or before explicit sync consent.
- Trusting a user/owner ID supplied by the client; derive ownership from the verified Clerk session.
- Duplicating Clerk identity/profile data in D1 without an application-specific need.
- AI-generated legal explanations.

There is no SCHNGN-managed email waitlist. Repeat visitors sign up through Clerk; signup alone never uploads guest trips or creates a duplicate identity row in D1. Authenticated sync endpoints may accept validated trip records only after consent and must scope every query by the server-verified Clerk user ID. Fresh D1 databases start with the account schema at migration `0002`; migration `0005_drop_waitlist_signups.sql` idempotently removes the retired table from any database that had already been provisioned.

## Product/backlog priority

Use `docs/product-decisions.md` for approved MVP product/provider/domain decisions. Use `docs/mvp-implementation-kanban.md` as the implementation board.

Pull order:

All original MVP implementation cards are green. Optional accounts and authenticated sync are an explicit post-MVP scope change recorded as DEC-10/US-22, not a reinterpretation of the original local-only cards. `docs/production-readiness.md` is authoritative for launch. Remaining work should be explicit provider/account configuration, edge rate limiting, live payload verification, or new validation tasks—not another quiet scope creep goblin.

Documentation drift cleanup is continuous: current-state claims in `README.md`, architecture, CI/CD, Cloudflare setup, product decisions, and the Kanban must agree with the production-readiness checklist. Tests in `apps/web/tests/docs-consistency.test.ts` guard the known stale skeleton and parity claims.

US-01/US-02/US-03, US-19, US-04, US-05, US-06, US-07, US-09, US-08, US-10, US-11, US-15, US-13, US-14, US-18, US-16, US-12, US-17, US-21, and US-20 are green.

## Design direction

Design docs and artifacts live under:

- `docs/money-shot-ui-plan.md`
- `docs/pencil-design-iteration-results.md`
- `docs/outside-agent-compelling-mock-prompt.md`
- `sketches/pencil/exports/pencil-contact-sheet.png`
- `sketches/pencil/exports/synthesis-compelling-mock.png`

Recommended production direction:

- Use `synthesis-compelling-mock` as the base.
- Blend Ive-style calm permission, Victor-style what-if simulation, and public-service trust/accessibility.
- Use Tufte/Rams ideas for explanation/report/pro views.

Production brand identity is locked by DEC-11:

- wordmark: `apps/web/static/brand/schngn-wordmark.png` through `SchngnLogo.svelte`;
- favicon and Apple/PWA derivatives: `apps/web/static/favicon.*` and `apps/web/static/icons/`;
- the earlier Pencil constellation-mark direction is historical provenance, not the current production logo.

Core UI language:

- “Italy fits” / “Safe for Italy”
- “safe buffer days”
- “must exit by”
- “committed/booked”
- “what-if”
- “Why safe?” / “Show calculation”
- “Border-ready report”

Avoid:

- Generic dashboard cards that bury the answer.
- Circular gauge as the main explanation.
- Travel clipart confetti.
- Technical/legal jargon like “payload,” “draft,” or “compliance object.”

## Installed project skills

Project-level agent skills live under `.agents/skills/`; provider-native companion copies may also live under `.github/skills/`. Skills installed through the generic `skills` CLI are tracked through `skills-lock.json`; provider-native installs such as Impeccable may vendor their own payload directly.

Installed:

- `.agents/skills/design-taste-frontend/SKILL.md` from `Leonxlnx/taste-skill`.
- `.agents/skills/impeccable/SKILL.md` and `.github/skills/impeccable/SKILL.md` from `pbakaus/impeccable`, installed with `npx impeccable install`.

Use `design-taste-frontend` for landing page, portfolio-style, visual redesign, and marketing UI work where taste/hierarchy/anti-slop rules matter. Use `impeccable` for design-system context, UI critique/polish/audit/layout/type/color passes, and deterministic UI anti-pattern detection via `npx impeccable detect`. Do **not** let either design skill override SCHNGN’s higher-priority constraints: engine correctness, guest-local/account-consent data boundaries, no legal advice, accessibility, and the product/backlog pull order above.

## Testing expectations

For code changes:

1. Add or update tests first when changing behavior.
2. Run the narrow test.
3. Run `bun run check` before claiming done.
4. For UI work, smoke-test the relevant route in a browser and check console errors.
5. For privacy-sensitive work, inspect network payloads manually.

For engine work, prefer:

- Fixture tests against official EC calculator outputs.
- Boundary tests for off-by-one failures.
- Property tests for random trip sets.
- Golden-master snapshots for known scenarios.

## Privacy and analytics

Allowed analytics events must be aggregate only:

- `page_view`
- `calculator_start`
- `trip_added` with count bucket only
- `simulation_run` without dates
- `pdf_buy_intent`
- `unlock_buy_intent`

Never include:

- trip dates
- country sequence/history if it can reconstruct travel
- email or other Clerk-owned identity fields
- names, passports, residence details, visas, or legal status

These exclusions apply equally to guest and signed-in users. Authentication does not make trip data safe for telemetry or operational logs.

## External services

Approved MVP services:

- Cloudflare Workers + Static Assets for deployment.
- Cloudflare D1 for authenticated, explicitly consented account data keyed by Clerk user ID. Migration `0005` provides forward cleanup of the retired waitlist table only.
- Plausible Cloud for aggregate-only analytics.
- Clerk for optional authentication and identity lifecycle webhooks.

If configuring any external service, do not write secrets to files. Use GitHub secrets, Cloudflare dashboard, or local `.env` files ignored by git.

## Agent workflow

Before coding:

1. Read this file.
2. Read `docs/architecture.md`, `docs/repo-structure.md`, `docs/product-decisions.md`, and the relevant backlog/design docs.
3. Check `git status --short`.
4. Avoid mixing unrelated changes.

While coding:

- Keep packages separated: engine logic in `packages/engine`; UI/storage in `apps/web`.
- Keep guest trip data local; require a verified Clerk session and explicit consent for account sync.
- Derive account ownership server-side and preserve export/deletion paths.
- Prefer small vertical slices with tests.
- Update docs when architecture or commands change.

Before finishing:

```bash
bun run check
```

or, if Bun is not installed globally:

```bash
npx -y bun@1.3.14 run check
```

Then report:

- files changed
- tests/commands run and their result
- any remaining risk or open decision

## Symlink rule

`AGENTS.md` should be a symlink to `CLAUDE.md`:

```bash
ln -s CLAUDE.md AGENTS.md
```

If you need to update agent instructions, edit `CLAUDE.md`. Do not replace `AGENTS.md` with a separate copy unless the user explicitly asks; duplicated agent instructions drift, and then everyone loses except entropy.
