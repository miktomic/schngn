# SCHNGN Agent Context

This file is the canonical project context for coding agents. `AGENTS.md` must remain a symlink to this file so Claude Code, Codex, and other agents read the same instructions.

If this file conflicts with source code or docs, inspect the source and update this file. Do not preserve stale instructions out of politeness; stale context is just technical debt with better typography.

## Project

SCHNGN is a privacy-first Schengen 90/180-day tracker and trip planner.

The MVP is **Option B Web/PWA**:

- Mobile-first web app/PWA.
- No login or account.
- Local-only trip storage.
- Provably-correct Schengen calculation engine.
- Free calculator plus fake-door paid unlock/PDF validation.
- No GPS, passport scanning, OCR, cloud sync, global visa/tax rule engine, or legal advice workflow in MVP.

Primary product promise:

> Tell a traveler whether their planned Schengen trip is safe, explain why, and keep their trip data on their device.

## Non-negotiables

1. **Correctness gates everything.** The 90/180-day engine is safety-critical. UI polish must not outrun engine correctness.
2. **Trip data stays client-side.** Do not send trip dates, full travel history, or calculated personal travel timelines to servers or analytics.
3. **No legal advice.** Use fixed, human-reviewed explanatory copy and clear disclaimers.
4. **No secrets in repo/docs/logs.** Do not print or commit Cloudflare tokens, API keys, cookies, OAuth material, or `.env` contents.
5. **No server-side trip persistence in MVP.** The only current server-side data path is waitlist email / fake-door intent.
6. **Node 24+ is the Node tooling baseline.** It is pinned through `.node-version` and `.nvmrc`; GitHub Actions uses Node-24-compatible actions and `actions/setup-node`.
7. **Bun 1.3.14 remains the build/test/package runner.** Production still runs on Cloudflare Workers (`workerd`), not Node or Bun.

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
Build/dev/test: Bun 1.3.14; Node 24+ for Node-based tooling and GitHub Actions
App framework: SvelteKit + Vite
Production: Cloudflare Workers + Static Assets
Core logic: packages/engine, pure TypeScript
Trip data: browser local storage / IndexedDB only
Dynamic Worker routes: tiny endpoints, currently /api/waitlist
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
│       └── src/routes/api/waitlist/+server.ts
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

Planned next structure:

```text
packages/engine/tests/fixtures/ec/*.json
packages/engine/tests/properties.test.ts
apps/web/src/lib/data/          # local storage repository
apps/web/src/lib/stores/        # trip/result stores
apps/web/src/lib/components/    # money-shot UI components
apps/web/src/lib/analytics/     # privacy-safe event wrapper
apps/web/src/lib/import-export/ # JSON import/export
```

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
optional deploy on main if Cloudflare secrets exist
```

Deployment secret policy:

- Use GitHub Environment `production` for the initial Cloudflare deploy boundary.
- Store `CLOUDFLARE_API_TOKEN` as a production environment secret.
- Store `CLOUDFLARE_ACCOUNT_ID` as a production environment variable when possible; the workflow accepts a secret fallback.
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
- Cyprus and Ireland are excluded from Schengen short-stay counting.
- Iceland, Norway, Liechtenstein, and Switzerland are included.
- Remaining days = `90 - used`, floored at zero for display.
- Over-limit state must still expose over-by days.

The current engine tests are only a starter suite. The next serious implementation step is US-01: 40–60 EC-parity fixtures plus property/golden-master tests.

## Web app rules

Package: `apps/web`

Allowed:

- SvelteKit UI.
- Browser local storage / IndexedDB.
- PWA/offline support.
- Privacy-safe analytics wrappers.
- Tiny Worker endpoints for waitlist/fake-door flows.

Forbidden:

- Sending trip dates to analytics or any server endpoint.
- Persisting trips server-side.
- AI-generated legal explanations.
- Adding accounts/cloud sync before validation.

The `/api/waitlist` endpoint may accept email only. It must not accept trip data.

## Product/backlog priority

Use `docs/product-decisions.md` for approved MVP product/provider/domain decisions. Use `docs/mvp-implementation-kanban.md` as the implementation board.

Pull order:

1. US-01 — Rolling 180-day engine and EC-parity suite.
2. US-02 — Latest safe exit date.
3. US-03 — Verdict flag.
4. US-04 — Trip CRUD.
5. US-05 — Local-only persistence.
6. US-06 — JSON import/export.
7. US-07 — Dashboard money-shot.
8. US-09 — Future-trip simulator.
9. US-08 — Days-coming-back visualization.
10. US-10/US-11 — disclaimers and explanation.
11. US-15/US-13/US-14/US-18 — analytics and validation flows.
12. US-16/US-12/US-17 — launch, trust signal, PWA/offline.

Until US-01 is green, avoid spending serious effort on UI polish. The engine is the load-bearing wall.

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

Use `design-taste-frontend` for landing page, portfolio-style, visual redesign, and marketing UI work where taste/hierarchy/anti-slop rules matter. Use `impeccable` for design-system context, UI critique/polish/audit/layout/type/color passes, and deterministic UI anti-pattern detection via `npx impeccable detect`. Do **not** let either design skill override SCHNGN’s higher-priority constraints: engine correctness, local-only trip data, no legal advice, accessibility, and the product/backlog pull order above.

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
- `waitlist_signup`

Never include:

- trip dates
- country sequence/history if it can reconstruct travel
- email except in explicit waitlist provider flow
- names, passports, residence details, visas, or legal status

## External services

Current intended services:

- Cloudflare Workers + Static Assets for deployment.
- Cloudflare KV/D1 or external provider for waitlist only; provider not finalized.
- Privacy-friendly analytics provider not finalized.

If configuring any external service, do not write secrets to files. Use GitHub secrets, Cloudflare dashboard, or local `.env` files ignored by git.

## Agent workflow

Before coding:

1. Read this file.
2. Read `docs/architecture.md`, `docs/repo-structure.md`, `docs/product-decisions.md`, and the relevant backlog/design docs.
3. Check `git status --short`.
4. Avoid mixing unrelated changes.

While coding:

- Keep packages separated: engine logic in `packages/engine`; UI/storage in `apps/web`.
- Keep trip data local.
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
