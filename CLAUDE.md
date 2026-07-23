# SCHNGN Agent Context

This file is the canonical project context for coding agents. `AGENTS.md` must remain a symlink to this file so Claude Code, Codex, and other agents read the same instructions.

If this file conflicts with source code or docs, inspect the source and update this file. Do not preserve stale instructions out of politeness; stale context is just technical debt with better typography.

## Project

SCHNGN is a privacy-first Schengen 90/180-day tracker and trip planner.

The product is **Option B Web/PWA** with an approved optional-account expansion:

- Mobile-first web app/PWA.
- Anonymous use without login; guest trip storage is local-only.
- Optional Clerk signup for repeat visits and cross-device sync.
- Localized help/feature-request contact form delivered through a fixed-destination Cloudflare email binding.
- Signed-in trip storage in Cloudflare D1 after an explicit save action: completing Clerk signup from a “Sign up & save” CTA automatically stores the current trips; existing users may also enable sync after sign-in.
- Provably-correct Schengen calculation engine.
- Local agent access through a strict TypeScript API, JSON CLI, loopback HTTP/OpenAPI service, and stdio MCP server; the SCHNGN calculation runtime remains on the operator's machine.
- Public MIT npm packages for `@schngn/engine`, `@schngn/capability`, and `@schngn/agent`, plus a repository-backed `schngn` skill for compatible agents.
- Free calculator with optional Clerk account signup and explicitly consented trip sync.
- No GPS, passport scanning, OCR, automatic guest upload, global visa/tax rule engine, or legal advice workflow.

Primary product promise:

> Tell a traveler whether their planned Schengen trip is safe, explain why, and let them keep it local or explicitly sync it to their account.

## Non-negotiables

1. **Correctness gates everything.** The 90/180-day engine is safety-critical. UI polish must not outrun engine correctness.
2. **Guests stay local-only.** Never send an anonymous traveler’s trip dates, full travel history, or calculated timeline to a server. Clicking a clearly labeled signup-and-save CTA is explicit storage consent: after Clerk signup completes, the current trips may enter D1. Existing-account sign-in still reconciles safely before any overwrite; trip data never enters analytics or logs.
3. **No legal advice.** Use fixed, human-reviewed explanatory copy and clear disclaimers.
4. **No secrets in repo/docs/logs.** Do not print or commit Cloudflare tokens, API keys, cookies, OAuth material, or `.env` contents.
5. **Authenticated ownership is server-derived.** Account data is keyed by the verified Clerk user ID. Never accept a client-supplied owner, and never persist guest trips server-side.
6. **Node 24+ is the Node tooling baseline.** It is pinned through `.node-version` and `.nvmrc`; GitHub Actions uses Node-24-compatible actions and `actions/setup-node`.
7. **Bun 1.3.14 remains the build/test/package runner.** Production still runs on Cloudflare Workers (`workerd`), not Node or Bun.
8. **TypeScript 7 is the root, engine, capability, and agent compiler baseline.** Keep the Svelte web workspace on TypeScript 6 until TypeScript 7 exposes the programmatic API required by Svelte tooling; do not force an unsupported repo-wide 7.x resolution.
9. **Agent calculation surfaces are local-only.** The agent HTTP server may bind only to loopback, MCP uses stdio, and the capability performs no persistence, telemetry, logging, or outbound network calls. A cloud-backed agent host or model provider may still receive and retain tool inputs and results under its own policies. A SCHNGN-hosted or remote calculation API/MCP is not approved; it requires a new privacy, authentication, and consent decision before SCHNGN infrastructure may receive anonymous trip dates.

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
Build/dev/test: Bun 1.3.14; Node 24+; TypeScript 7 engine/capability/agent + TypeScript 6 Svelte tooling
App framework: SvelteKit + Vite
Production: Cloudflare Workers + Static Assets
Core logic: packages/engine plus the strict local packages/capability adapter, pure TypeScript
Local agent runtime: apps/agent on Node 24+; JSON CLI, loopback HTTP/OpenAPI, and stdio MCP
Agent distribution: public MIT npm packages plus the repository-backed schngn skill
Trip data: guest browser storage; signup-and-save or separately consented signed-in sync in Cloudflare D1
Identity: optional Clerk accounts; Clerk is the identity source of truth
Dynamic Worker routes: authenticated account/sync/export/deletion endpoints plus Clerk lifecycle webhook
```

Important consequence:

- Code shipped to the browser or Worker must avoid Bun-native APIs (`bun:sqlite`, filesystem access, subprocesses, raw sockets).
- The engine package must remain runtime-agnostic and dependency-light.
- The Node-based agent app is a local process, not a Cloudflare Worker route or hosted service. Its HTTP listener must remain loopback-only and its MCP transport must remain stdio-only.

## Repository structure

```text
schngn/
├── .agents/skills/schngn/          # repository-backed agent behavior and setup skill
├── apps/
│   ├── agent/                       # local Node CLI, loopback HTTP/OpenAPI, stdio MCP
│   └── web/                         # SvelteKit app, Cloudflare Worker/static assets target
│       ├── src/routes/+page.svelte  # SEO landing page
│       ├── src/routes/app/+page.svelte
│       ├── src/routes/agents/+page.svelte # localized local-agent setup and interface guide
│       ├── src/routes/api/account/   # authenticated account trip API
│       ├── src/routes/api/webhooks/  # verified Clerk lifecycle webhook
│       ├── src/lib/account/          # signup-save intent, repository, reconciliation
│       ├── src/lib/auth/             # Clerk browser and Worker auth boundaries
│       └── migrations/               # account schemas plus idempotent retired-table cleanup
├── packages/
│   ├── capability/                  # strict, versioned local agent calculation contract
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
packages/capability/             # strict schemas and three transport-neutral operations
apps/agent/                      # JSON CLI, loopback HTTP/OpenAPI, stdio MCP adapters
.agents/skills/schngn/           # skill that routes agents to the local runtime without reimplementing math
apps/web/src/lib/trips/         # validated local trip CRUD/storage
apps/web/src/lib/account/       # authenticated D1 sync and conflict handling
apps/web/src/lib/auth/          # Clerk client/server integration
apps/web/src/lib/analytics/     # aggregate-only event boundary
apps/web/src/lib/import-export/ # private JSON backup/restore
```

`/app` has a tab-free calculator workspace plus a dedicated Account & data destination in the shared header. Stable hashes address `timeline`, `trips`, and `account`: `#timeline` and `#trips` render the continuous calculator, while `#account` switches the same mounted route to the account, sync, import, export, and browser-data controls so pending sync state is preserved. Legacy `?section=` links are canonicalized by `apps/web/src/lib/navigation/appAnchor.ts`; the retired pricing-only `market` query is removed during the same canonicalization. Retired `#status` maps to `timeline`, retired `#details` plus planner, proof, and returning-days destinations map to `trips`, and the retired report destination maps to `account`. The Explainer and FAQ are dedicated localized public pages at `/explainer` and `/faq`; legacy `#rules`, `#explainer`, `#help`, and `#faq` app destinations redirect to those pages. The localized `/agents` page documents MCP-first setup, the repository-backed skill, CLI, loopback REST/OpenAPI, TypeScript, tool schemas, and the surrounding agent-host privacy boundary without collecting trip inputs. Localized `/privacy` and `/terms` documents are linked from the shared site footer without crowding the primary header. The canonical master timeline is the first calculator section, followed immediately by the saved-trip cards under their own Trips anchor. The Explainer teaches the ordinary-short-stay calculation through a five-step walkthrough that renders the production `TimelineLedger`, `TripMiniTimeline`, and `StatusChip` components against deterministic sample trips; the teaching surface therefore stays visually and mathematically aligned with `/app`. The FAQ keeps reviewed rule answers linked to official EU sources and visibly distinguishes product behavior from legal/rule guidance. Clicking a trip row expands that trip's draggable adjuster directly beneath it, while the single bottom “Add new trip” action opens the trip editor as a dialog. Saved trips share one user-facing model regardless of whether their dates are past or future, and adjustments remain previews until explicitly committed.

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
bun run test:capability
bun run test:agent
bun run build:agent
bun run release:packages:check
bun run release:packages:public-check
bun run agent:cli -- help
bun run agent:api
bun run agent:mcp
bun run secrets:check:dev
bun run secrets:check:prod
bun run dev:infisical
cd apps/web && bun run check
cd apps/web && bun run dev -- --host 127.0.0.1 --port 5173
```

`bun run check` is the local CI equivalent: all tests, TypeScript checks for the engine/capability/agent packages, Svelte/TypeScript web checks, every build, and a compiled agent CLI/MCP smoke. `bun run test:e2e` remains the separate browser gate.

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
bun run smoke:agent
bun run test:e2e
inactive resource provisioning + D1 migrations
serialized, fail-closed deploy + canonical-domain setup + blocking smoke on main
```

Deployment secret policy:

- Infisical is the authoritative secret store. Use environments `dev` and `prod`, with application values at `/apps/web`.
- Local agents obtain `dev` values with `infisical run`; an identity ID alone is not an authentication credential. Use a human CLI login or securely provisioned Universal Auth credentials, never values pasted into chat or commands.
- GitHub Actions remains the production runner. The protected `production` Environment is the deployment and OIDC trust boundary; its deploy job alone receives `id-token: write`.
- The deploy job exchanges GitHub's short-lived OIDC token directly with Infisical identity `812097c6-b028-4a21-9af0-291ebc835cfa` and reads the seven required values from `prod` `/apps/web`.
- Do not copy deployment values into GitHub Actions secrets or variables and do not configure an Infisical Secret Sync. The workflow fails closed when OIDC exchange, retrieval, or validation fails.
- `scripts/run-with-infisical-oidc.mjs` keeps fetched values in memory, validates the complete production set, starts children from a benign environment allowlist, removes authentication material, and passes each command only its explicitly requested keys.
- Upload Clerk runtime bindings through a permission-restricted temporary runner file passed to inactive `wrangler versions upload --secrets-file`; delete it before migrations, recreate it only for the gated active deploy, and delete that second file even on failure.
- Serialize production deployments without cancellation so rapid main pushes cannot race migrations or allow an older Worker version to finish last.
- Use a least-privilege Cloudflare API token, not a global API key.

Do not invent or commit these values. Enter and rotate provider values directly in Infisical.

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

## Local agent capability rules

Packages: `packages/capability` and `apps/agent`

The capability package is the transport-neutral boundary over `@schngn/engine`. It exposes strict schema-version-one operations for usage on a reference date, checking a candidate stay on every day, and finding the latest safe exit. Each stay-list field accepts at most 100 explicit continuous Schengen stay ranges, with a separate required candidate range for the stay-check operation. Stay objects contain only `entryDate` and `exitDate`; country metadata, labels, IDs, account owners, open-ended state, and unknown fields are rejected. Every result carries the fixed planning-aid advisory and the `ordinary-schengen-90-180/v1` rule-set identifier.

The local agent app exposes that one contract through:

- `schngn usage`, `schngn check-stay`, and `schngn latest-exit`, reading strict JSON from stdin or a file;
- a loopback-only HTTP API with `/openapi.json` and versioned calculation routes;
- read-only MCP tools over stdio.

`@schngn/engine`, `@schngn/capability`, and `@schngn/agent` are MIT licensed and published publicly on npm. The runtime and skill setup is `npm install --global @schngn/agent`, `codex mcp add schngn -- schngn-mcp`, and `npx skills add miktomic/schngn --skill schngn`.

Allowed:

- Local Node 24+ execution built and tested with Bun 1.3.14.
- Strict runtime validation, bounded request bodies, safe error codes, and fixed deterministic advisory copy.
- Loopback HTTP on `127.0.0.1`, `::1`, or `localhost` only.

Forbidden:

- Binding the agent HTTP server to a LAN/public interface or deploying it as a hosted endpoint.
- Remote MCP transports, persistence, analytics, telemetry, outbound network calls, or logging submitted dates.
- Adding country classification or legal-status inference to the calculation contract.
- Claiming direct European Commission calculator parity or EU endorsement.

The TypeScript API and the HTTP “API” are local machine interfaces. The SCHNGN runtime does not transmit tool inputs or results, but a cloud-backed agent host or model provider may receive and retain them under its own policies. Any SCHNGN-hosted or remote calculation phase is a separate, unapproved scope change that must first define authentication, explicit consent, retention/logging rules, abuse controls, and revised privacy disclosure.

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
- A Turnstile-protected, rate-limited contact endpoint that sends only explicitly entered support fields to the fixed support inbox.

Forbidden:

- Sending trip dates to analytics, logs, or any anonymous endpoint.
- Persisting trips server-side for guests or without an explicit signup-and-save or sync action.
- Trusting a user/owner ID supplied by the client; derive ownership from the verified Clerk session.
- Duplicating Clerk identity/profile data in D1 without an application-specific need.
- AI-generated legal explanations.

There is no SCHNGN-managed email waitlist. Repeat visitors sign up through Clerk. The separate contact form is only for support and feature requests; it never attaches trip history or enters analytics. Signup CTAs explicitly say they save trips; completing that Clerk signup automatically stores the current validated trip snapshot in D1 without creating a duplicate identity row. Existing users who sign in through the separate sign-in action retain reconciliation safeguards.

## Product/backlog priority

Use `docs/product-decisions.md` for approved MVP product/provider/domain decisions. Use `docs/mvp-implementation-kanban.md` as the implementation board.

Pull order:

All original MVP implementation cards are green. Optional accounts and authenticated sync are an explicit post-MVP scope change recorded as DEC-10/US-22, not a reinterpretation of the original local-only cards. The completed local agent capability is the separate DEC-16/US-23 scope change; it does not authorize hosted calculation. `docs/production-readiness.md` is authoritative for the web launch. Remaining web work should be explicit provider/account configuration, edge rate limiting, live payload verification, or new validation tasks—not another quiet scope creep goblin.

Documentation drift cleanup is continuous: current-state claims in `README.md`, architecture, CI/CD, Cloudflare setup, product decisions, and the Kanban must agree with the production-readiness checklist. Tests in `apps/web/tests/docs-consistency.test.ts` guard the known stale skeleton and parity claims.

US-01/US-02/US-03, US-19, US-04, US-05, US-06, US-07, US-09, US-08, US-10, US-11, US-15, US-13, US-14, US-18, US-16, US-12, US-17, US-21, US-20, and US-23 are green.

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
- “Why this answer”
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
- `.agents/skills/schngn/SKILL.md`, the repository-backed local calculation and setup skill intended for `npx skills add miktomic/schngn --skill schngn`.

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

For local agent work, prefer:

- Shared contract tests in `packages/capability` before transport tests.
- Node-compatible CLI, loopback HTTP/OpenAPI, and stdio MCP tests in `apps/agent`.
- Tests that reject unknown/private fields, non-loopback hosts, oversized bodies, and submitted-value echoing in errors.

## Privacy and analytics

Allowed analytics events must be aggregate only:

- `page_view`
- `calculator_start`
- `trip_added` with count bucket only
- `simulation_run` without dates

Never include:

- trip dates
- country sequence/history if it can reconstruct travel
- email or other Clerk-owned identity fields
- names, passports, residence details, visas, or legal status

These exclusions apply equally to guest and signed-in users. Authentication does not make trip data safe for telemetry or operational logs.

## External services

Approved MVP services:

- Cloudflare Workers + Static Assets for deployment.
- Cloudflare D1 for authenticated account data saved after a signup-and-save or separate sync action, keyed by Clerk user ID. Migration `0005` provides forward cleanup of the retired waitlist table only.
- Plausible Cloud for aggregate-only analytics.
- Clerk for optional authentication and identity lifecycle webhooks.
- Cloudflare Email Service plus Turnstile for fixed-destination support requests; `schngn@proton.me` must be a verified destination and the public/sender address is restricted to `support@schngn.com`.
- Infisical as the authoritative `dev`/`prod` secret store, with local process injection and direct production retrieval through GitHub OIDC.

The SCHNGN local agent runtime uses no external service. Its loopback HTTP server and stdio MCP server are local transports, not production infrastructure. The surrounding agent host may still be an external, cloud-backed service and may handle tool inputs and results under its own policies.

If configuring any external service, do not write secrets to tracked files or paste them into chat, docs, logs, screenshots, or shell commands. Enter values directly into Infisical; use `infisical run` for local processes and the repository's scoped GitHub OIDC wrapper for production deployment.

## Agent workflow

Before coding:

1. Read this file.
2. Read `docs/architecture.md`, `docs/repo-structure.md`, `docs/product-decisions.md`, and the relevant backlog/design docs.
3. Check `git status --short`.
4. Avoid mixing unrelated changes.

While coding:

- Keep packages separated: engine logic in `packages/engine`; strict transport-neutral agent schemas/operations in `packages/capability`; local Node transports in `apps/agent`; UI/storage in `apps/web`.
- Keep guest trip data local; require a verified Clerk session plus an explicit signup-and-save or separate sync action for account storage.
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
