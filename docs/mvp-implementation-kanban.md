# SCHNGN MVP Implementation Kanban

> Source: Schengen Tracker MVP Product Backlog pasted into Hermes on 2026-07-08.
> Scope: **Option B Web/PWA** — the original no-login/local-only MVP is complete; optional Clerk accounts and authenticated sync are an explicit approved scope change.

## Board policy

- **WIP limit:** one story in `Doing` at a time through the correctness/test-harness foundation. The engine is the load-bearing wall; do not decorate it with UI wallpaper until it stands.
- **Quality gate:** US-01/US-02/US-03 must pass EC-parity + boundary tests before implementation moves into polished dashboard work.
- **Privacy gate:** any analytics/fake-door work must prove it sends **no trip dates, no PII, no local travel history**.
- **Definition of done for every card:** acceptance criteria met, relevant automated tests pass, mobile manual QA done, privacy/disclaimer unaffected, analytics verified where relevant.
- **Test infrastructure is a first-class card.** Do not hide browser, accessibility, performance, or privacy/network checks as “later.” Later is where bugs rent office space.
- **Default status:** all cards start in `Todo`. Move only when actually implemented and verified.

## Kanban overview

| Column | Purpose | WIP limit |
|---|---|---:|
| `Ready / Sprint 1` | Correctness and data foundation | 1–2 |
| `Infrastructure / Cross-cutting` | Test harness, privacy QA, production smoke, domain hygiene | 1 |
| `Next / Sprint 2` | Core UX, trust, simulator, import/export | 2 |
| `Validation / Sprint 2–3` | Fake-door monetization and analytics | 2 |
| `Launch / Sprint 3` | SEO, PWA, accuracy proof, and optional Clerk signup | 2 |
| `Blocked / Needs decision` | Requires product/legal/provider decision | n/a |
| `Done` | Implemented + verified | n/a |
| `Won't in MVP` | Explicit scope guardrails | n/a |

---

# Ready / Sprint 1 — Correctness and local foundation

## US-01 — Rolling 180-day calculation engine

- **Priority:** Must
- **Estimate:** L
- **Status:** Done
- **Depends on:** none
- **Why now:** this is the product. If this is wrong, everything else is a charming overstay generator.
- **Implementation target:** pure calculation engine, fixtures, property/golden tests, CI gate.
- **Acceptance summary:**
  - Entry and exit days both count.
  - Rolling 180-day look-back from any reference date.
  - Overlapping/adjacent trips de-duplicated.
  - Engine inputs are explicit Schengen stay ranges; country classification is resolved before calculation.
  - Outside-Schengen periods are represented as gaps between counted ranges.
- **Verification:** 50 EC-rule fixtures, 100 deterministic property scenarios, golden counted-day test, and full `npx -y bun@1.3.14 run check` pass.

## US-02 — Latest safe exit date calculation

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01
- **Implementation target:** function that returns last legal/safe exit date for an active/planned Schengen stay.
- **Acceptance summary:**
  - Computes latest exit while keeping usage ≤ 90 on every day of the candidate stay.
  - Handles already-at-limit and over-limit cases.
  - Extends the final continuous stay while preserving earlier segments of a split journey.
- **Verification:** boundary tests prove returned exit is safe and exit + 1 day overstays; covered no-prior-stay, 89-used, 90-used, old-days-aging-out, and split-journey cases.

## US-03 — Overstay / verdict flag

- **Priority:** Must
- **Estimate:** S
- **Status:** Done
- **Depends on:** US-01
- **Implementation target:** status classifier with configurable thresholds.
- **Acceptance summary:**
  - `OK` when buffer > configured close threshold.
  - `Cutting it close` when buffer is 1 through threshold.
  - `At limit` when exactly 90 days are used but allowance is not exceeded.
  - `Overstay / over limit` only when usage exceeds allowance.
- **Verification:** boundary tests at 82/83/89/90/91 days used plus configurable close-threshold tests; app shell now calls `classifyVerdict(usage)` so 90 and 91 are distinguishable.

## US-19 — App test harness and privacy QA infrastructure

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01/US-02/US-03 calculation contract; can begin once app route shape is stable
- **Why now:** every app card after this needs browser, accessibility, and privacy-network verification. If the harness is missing, “manual QA” becomes folklore.
- **Implementation target:** Playwright/browser smoke tests, app utility test structure, mobile viewport checks, accessibility/contrast checks, and reusable privacy/network assertions.
- **Acceptance summary:**
  - Automated mobile Chromium smoke covers `/` and `/app` via `bun run test:e2e`.
  - Bun app utility tests cover reusable privacy-network assertions.
  - Privacy helper fails if trip dates, email, names, labels, or travel history appear in forbidden network URLs/bodies.
  - E2E smoke covers mobile viewport, keyboard focus reachability, proof/report/account states, and no forbidden network payloads.
  - `bun run check` remains fast and includes app utility tests, typecheck, and build; Playwright remains explicit so normal CI/local checks are not painfully slow.
- **Verification:** `npx -y bun@1.3.14 run check` passed; `npx -y bun@1.3.14 run test:e2e` passed; deliberate forbidden-payload fixtures fail loudly in `apps/web/tests/privacy-network.test.ts`.

## US-04 — Add / edit / delete a trip

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01 data model contract, US-19 for browser/integration coverage
- **Implementation target:** trip CRUD UI and validation.
- **Acceptance summary:**
  - Add first Schengen entry, final Schengen exit, optional entry/exit countries and label.
  - Add one or more inline outside-Schengen breaks; the app derives multiple counted stays.
  - Equal entry/exit allowed as a one-day trip.
  - Exit before entry rejected inline.
  - Edit/delete re-sorts list and recalculates immediately.
- **Verification:** Bun tests cover multi-country journeys, split stays, outside-day summaries, validation, and recalculation; Playwright covers the complete mobile entry flow and persisted schema-two shape.

## US-05 — Guest local-only persistence, original no-account scope

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-04, US-19
- **Implementation target:** localStorage repository with no server fallback.
- **Acceptance summary:**
  - Trips persist across reload/restart.
  - Trip dates are never transmitted.
  - Visible local/private data message.
  - User-facing backup warning explains that local-only data needs export/backup if the device/browser is cleared.
- **Verification:** `npx -y bun@1.3.14 run check` passed with 79 Bun tests / 1137 assertions; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium reload-persistence and privacy-network coverage; storage-disabled/corrupt-storage fallbacks covered by unit tests.

---

# Next / Sprint 2 — Core user experience and reassurance

## US-06 — JSON export / import

- **Priority:** Must
- **Estimate:** S
- **Status:** Done
- **Depends on:** US-04, US-05
- **Implementation target:** JSON backup and restore flow.
- **Acceptance summary:**
  - Export downloads JSON.
  - Import validates schema, restores trips, recalculates.
  - Malformed imports fail with clear error.
  - Backup/restore copy explains how local-only data can be moved between devices manually.
- **Verification:** `npx -y bun@1.3.14 run check` passed with 82 Bun tests / 1145 assertions; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium JSON download/import/clear/malformed-import coverage and privacy-network assertions.

## US-07 — Dashboard: days used / remaining / status

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01, US-02, US-03
- **Implementation target:** mobile-first money-shot dashboard using the synthesis design direction.
- **Acceptance summary:**
  - Above-the-fold: days remaining, status badge, latest safe exit.
  - Live recalculation as trips change.
  - Large-type, high-contrast, calm design.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 87 Bun tests / 1174 assertions including five dashboard money-shot scenarios; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium assertions for dynamic latest safe exit and privacy-network checks.

## US-09 — Future-trip simulator, “Can I book this?”

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01, US-03, US-07
- **Implementation target:** non-mutating what-if trip input and verdict panel.
- **Acceptance summary:**
  - Proposed dates produce instant safe / at-limit / not-safe verdict.
  - Simulation does not mutate saved trips.
  - Shows max additional days for proposed start date.
  - Shows first useful fix when a proposal is unsafe.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 91 Bun tests / 1195 assertions including future-trip simulator safe, at-limit, over-limit, invalid-input, max-stay, and non-mutating what-if behavior; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage proving simulator safe/unsafe UI updates and simulated labels do not appear in saved trips.

## US-08 — Days coming back calendar/timeline visualization

- **Priority:** Must
- **Estimate:** L
- **Status:** Done
- **Depends on:** US-01, US-02, US-07, US-09
- **Implementation target:** timeline forecast component and allowance recovery view.
- **Acceptance summary:**
  - Shows when used days return.
  - Future dates show available days.
  - Next date allowance improves is clearly marked.
  - Handles ~50 trips under 300ms.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 95 Bun tests / 1210 assertions including fixed trip-set, duplicate-day, non-Schengen exclusion, empty-window, and ~50-trip returning-day forecast cases; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the dynamic Returns screen, next-return date, forecast rows, and privacy-network assertions.
## US-10 — Disclaimers and “not legal advice” framing

- **Priority:** Must
- **Estimate:** S
- **Status:** Done
- **Depends on:** copy/legal review decision.
- **Implementation target:** persistent footer + first-run disclaimer notice.
- **Acceptance summary:**
  - Planning tool only; not legal advice; not guarantee of entry.
  - Edge cases explicitly excluded.
  - Links to official EC calculator, EES, and ETIAS information.
  - No runtime AI-generated legal explanations.
- **Verification:** `npx -y bun@1.3.14 run test` passed with fixed legal-copy tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for persistent footer, dismissible full notice, report disclaimer, official-source links, and privacy-network assertions; official EC/EES/ETIAS links returned HTTP 200.

## US-11 — “Why this number?” plain-English explainer

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01, human-reviewed copy.
- **Implementation target:** expandable explainer tied to calculation output.
- **Acceptance summary:**
  - Explains entry/exit counting.
  - Explains rolling 180-day look-back.
  - Explains why old trips remain until they drop off.
- **Verification:** `npx -y bun@1.3.14 run test` passed with deterministic explanation-state tests for safe and over-limit calculations; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium proof-screen assertions for counted-day summary, active 180-day window, inclusive counting, and official-source framing.

---

# Validation / Sprint 2–3 — Demand and monetization proof

## US-15 — Privacy-friendly analytics funnel

- **Priority:** Must
- **Estimate:** S
- **Status:** Done
- **Depends on:** US-04, US-05, privacy/product decision.
- **Implementation target:** privacy-safe analytics wrapper with Plausible-compatible client hook and no provider lock-in.
- **Acceptance summary:**
  - Events: `page_view`, `calculator_start`, `trip_added`, `simulation_run`.
  - Payloads are allowlisted and aggregate-only: source, trip count bucket, safe-buffer bucket, or verdict.
  - Trip dates, labels, names, email addresses, country history, and personal timelines are rejected before any analytics call.
  - UI wiring fires aggregate funnel events from workspace views, trip-add, and simulator actions without sending trip details or identity data.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 104 Bun tests / 1242 assertions including privacy-safe analytics allowlist and forbidden-payload rejection tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for intercepted Plausible-compatible events and no forbidden network payloads.

## US-13 — Border-ready PDF export fake-door (retired)

- **Priority:** Must
- **Estimate:** S
- **Status:** Retired after validation
- **Depends on:** US-07, US-15, approved fake-door pricing; see `docs/product-decisions.md`.
- **Implementation target:** report-screen fake-door CTA using the approved €9 MVP default; broader price-bucket persistence/distribution remains US-14.
- **Acceptance summary:**
  - “Generate border-ready PDF — €9” button on the border-ready report screen.
  - Click logs aggregate-only `pdf_buy_intent` with `source: report` and `price_bucket: eur_9`.
  - Shows honest early-access message and explicit “No payment was taken” copy.
  - Does not send trip dates, report contents, labels, email, or personal travel timelines.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 106 Bun tests / 1250 assertions including PDF fake-door state and analytics-event tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the PDF fake-door CTA, early-access/no-charge message, `pdf_buy_intent`, and no forbidden network payloads.
- **Success metric:** PDF-click rate after completed calculation > 10%.
- **Retirement note:** The PDF/report fake door and `pdf_buy_intent` event were removed. The product now uses the bottom-of-workspace account CTA to explain the validated repeat-visit value: saving trip history for future calculations and optional cross-device sync after explicit consent.

## US-14 — Paid unlock fake-door + pricing A/B (retired)

- **Priority:** Must
- **Estimate:** M
- **Status:** Retired after validation
- **Depends on:** US-09, US-13, US-15, approved fake-door price buckets; see `docs/product-decisions.md`.
- **Historical implementation target:** premium/full-tracker planner CTA with persisted one-time price bucket assignment in local browser storage.
- **Acceptance summary:**
  - Gates premium/full-planner framing behind an unlock fake-door CTA on the Planner screen.
  - Assigns approved €5 / €9 / €19 EU buckets and £5 / £9 / £19 UK buckets through a tested bucket helper.
  - Persists the assigned bucket across reloads using local storage; invalid stored values are ignored and reassigned.
  - Logs aggregate-only `unlock_buy_intent` with `source: planner` and the assigned `price_bucket`.
  - Shows honest early-access and “No payment was taken” copy; no checkout or charge path is enabled.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 110 Bun tests / 1266 assertions including bucket assignment, persistence, invalid-value recovery, and aggregate unlock-intent payload tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the planner unlock CTA, early-access/no-charge message, `unlock_buy_intent`, PDF fake-door, and no forbidden network payloads.
- **Success metric:** targeted-traffic preorder/buy-intent > 2%.
- **Retirement note:** The hidden price assignment, `market=uk` URL context, planner fake door, local price-bucket storage, and `unlock_buy_intent` event were removed. Clerk signup and the real account-value CTA remain active.

## US-18 — Retired waitlist / email-capture experiment

- **Priority:** Should
- **Estimate:** S
- **Status:** Retired and removed from the active product on 2026-07-11
- **Depends on:** approved Cloudflare D1 waitlist decision and privacy copy; see `docs/product-decisions.md`.
- **Historical implementation target:** email capture on the Waitlist screen with a D1-backed `/api/waitlist` endpoint when the `DB` binding is configured.
- **Historical acceptance summary:**
  - Email field with explicit consent and visible privacy note.
  - Submit button remains disabled until email + consent are present.
  - Endpoint accepts only normalized email, consent/version, source, and optional price bucket.
  - Endpoint rejects missing consent, invalid source, and invalid price bucket values.
  - Endpoint rejects unknown fields, including trip dates/history/calculation payload fields, and stores no trip data.
  - If `DB` is not bound yet, endpoint returns `202` accepted with `stored: false` instead of attempting unsafe storage.
- **Historical verification:** `npx -y bun@1.3.14 run test` passed with 114 Bun tests / 1279 assertions including D1 insert-shape, consent-required, invalid-source/bucket rejection, and unbound fallback tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for email-only waitlist submit, consent gating, confirmation, `waitlist_signup`, and no trip-date/label leakage.
- **Retirement note:** the active screen, endpoint, and analytics event are removed. Signup now goes directly through Clerk. With no production waitlist data to preserve, the obsolete `0001` creation migration is removed; `0005` idempotently drops the old table from any already-provisioned database.

---

# Launch / Sprint 3 — Distribution and polish

## US-16 — SEO landing page, broadly targeted

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** validated positioning copy, analytics from US-15, approved inclusive traveler angle; see `docs/product-decisions.md`.
- **Implementation target:** landing page for travelers managing the Schengen 90/180-day rule, with frequent travel, family visits, and longer stays as representative uses.
- **Acceptance summary:**
  - Hero, benefit bullets, trust line, CTA.
  - SEO title/meta/social tags for Schengen 90/180 calculation and trip-planning intent.
  - Mobile-first load without private trip-value network leakage.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 117 Bun tests / 1296 assertions including UK second-home SEO source tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the targeted landing metadata, hero, trust line, CTA, and no forbidden network payloads.
- **Success metric:** cold-traffic Clerk signup conversion > 5%.
- **Positioning update:** Nationality- and second-home-specific headline copy was retired because the calculator serves a broader traveler audience.

## US-12 — Accuracy trust signal

- **Priority:** Should
- **Estimate:** S
- **Status:** Done
- **Depends on:** US-01 EC-parity suite, approved public `/accuracy` page decision, and official-source references; see `docs/product-decisions.md`.
- **Implementation target:** trust claim and `/accuracy` validation evidence page.
- **Acceptance summary:**
  - Transparent evidence wording for deterministic rule fixtures, boundary cases, and the independent oracle, with a separate link to the European Commission calculator for comparison.
  - Public `/accuracy` page with curated test cases.
  - No unsafe “certified,” “approved,” or guaranteed-entry language except explicit non-endorsement copy.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 120 Bun tests / 1310 assertions including `/accuracy` source tests for official-source framing, curated cases, landing evidence link, and unsafe-language rejection; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for `/accuracy`, the EC calculator link, safe trust copy, and no forbidden network payloads.

## US-17 — Installable PWA + offline

- **Priority:** Should
- **Estimate:** M
- **Status:** Done
- **Depends on:** stable calculator shell, US-05 local persistence
- **Implementation target:** manifest + service worker + offline calculator.
- **Acceptance summary:**
  - Installable manifest with maskable 192/512 icons.
  - Service worker precaches the app shell and runtime-caches same-origin resources.
  - Calculator works offline after the shell is installed and controlled.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 123 tests / 1330 assertions including `apps/web/tests/pwa.test.ts`; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium offline reload coverage for `/app`.

## US-20 — Post-deploy smoke tests and privacy-safe operations

- **Priority:** Must
- **Estimate:** S
- **Status:** Done
- **Depends on:** stable production deployment, US-15 for analytics payload rules, approved no-Sentry MVP monitoring decision; see `docs/product-decisions.md`.
- **Implementation target:** repeatable production smoke script/checklist and privacy-safe operational monitoring using Cloudflare logs/smoke tests first.
- **Acceptance summary:**
  - `bun run smoke:production` verifies `https://schngn.com/`, `/app`, `/accuracy`, `/manifest.json`, `/service-worker.js`, `/robots.txt`, and `/sitemap.xml` return healthy responses.
  - Smoke script proves the anonymous account boundary without submitting email or traveler data.
  - Smoke script verifies anonymous account GET/empty-trip PUT/DELETE requests return `401 authentication_required` with no-store caching; signed-in account sync remains a controlled manual production check.
  - GitHub Actions runs production smoke checks after successful Cloudflare deploy.
  - Post-deploy runbook covers privacy-safe payload inspection, no-Sentry MVP operations, Cloudflare logs, failure handling, rollback notes, and `www` DNS warning behavior.
- **Verification:** `npx -y bun@1.3.14 test apps/web/tests/post-deploy-smoke.test.ts` passed; `node scripts/post-deploy-smoke.mjs` passed against production with 8 checks and 1 known `www.schngn.com` DNS warning.

## US-21 — Canonical `www` redirect and domain hygiene

- **Priority:** Should
- **Estimate:** S
- **Status:** Done
- **Depends on:** approved `www.schngn.com` → apex redirect decision and Cloudflare DNS/custom-domain setup; see `docs/product-decisions.md`.
- **Implementation target:** implement canonical `www.schngn.com` redirect to `https://schngn.com`.
- **Acceptance summary:**
  - Cloudflare routes include apex and `www.schngn.com` custom domains.
  - SvelteKit server hook redirects any `www.schngn.com` request that reaches the Worker to the apex URL with HTTP 308.
  - Canonical URL, Open Graph URL, robots, and sitemap behavior agree with the apex domain decision.
  - Sitemap advertises apex-only `/`, `/app`, and `/accuracy` URLs.
- **Verification:** `npx -y bun@1.3.14 test apps/web/tests/domain-hygiene.test.ts apps/web/tests/landing-seo.test.ts` passed; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed. Pre-implementation live check showed `www.schngn.com` did not resolve yet, so post-deploy DNS/redirect smoke is still required after Cloudflare accepts/provisions the new custom domain.

---

# Resolved product decisions

These decisions were approved on 2026-07-09 and recorded in `docs/product-decisions.md` and the Hermes Kanban board:

- **Analytics provider:** Plausible Cloud for MVP.
- **Fake-door pricing:** one-time €5 / €9 / €19 default; £5 / £9 / £19 for UK-targeted pages.
- **Retired email/waitlist experiment:** Cloudflare D1 capture was superseded by direct Clerk signup on 2026-07-11; fresh databases start at account migration `0002`, and `0005` cleans already-provisioned databases.
- **Legal/disclaimer copy:** fixed planning-aid/not-legal-advice copy; no runtime AI legal explanations.
- **Official-source references:** EC short-stay calculator, EES, and ETIAS official links.
- **Public validation page:** include `/accuracy` after US-01 is robust.
- **Production error monitoring:** no Sentry for MVP launch; use Cloudflare logs + smoke tests first.
- **`www` domain policy:** redirect `www.schngn.com` to `https://schngn.com`.
- **Ad test angle:** UK second-home owners and frequent EU travelers post-Brexit.
- **Optional accounts:** Clerk for identity, with a clearly labelled signup-and-save action that automatically persists current trips after account creation; existing-account reconciliation remains protected against silent overwrites.
- **Local agent capability:** one strict TypeScript contract exposed through a JSON CLI, loopback HTTP/OpenAPI, and read-only stdio MCP; no hosted calculation endpoint is approved.

---

# Current state

The original MVP implementation cards above shipped code and automated coverage. The separate waitlist experiment was later retired; the active product now sends account creation directly to Clerk. The later US-23 capability adds a local SCHNGN runtime without adding a hosted SCHNGN calculation endpoint. US-24 replaces two-field-only trip entry with a reusable localized calendar while retaining exact native date controls. A cloud-backed agent host may still process tool inputs and results under its own policies. Production-readiness hardening is tracked separately because a green feature card is not proof that provider configuration, live telemetry, or every adversarial input is safe.

---

# Optional accounts and authenticated sync — approved scope change

## US-22 — Optional Clerk account and consented trip sync

- **Priority:** Must for the account expansion; does not block guest calculator use
- **Estimate:** L
- **Status:** In progress
- **Depends on:** US-04, US-05, US-06, US-19, DEC-10
- **Implementation target:** optional Clerk authentication plus Cloudflare D1 storage for users who explicitly choose a save-labelled signup action.
- **Acceptance summary:**
  - The app remains fully usable without signup; guest trips remain local-only and never enter a server request.
  - “Sign up & save” / “Create account & save trips” is the explicit storage choice: after Clerk completes account creation, the current local trips are stored automatically.
  - Ordinary sign-in to an existing account retains conflict detection and reconciliation before either local or account trips are replaced.
  - Clerk is the identity source of truth; D1 application data is keyed by the server-verified Clerk user ID.
  - No endpoint accepts a client-supplied owner. Every account read/write/export/deletion is scoped from the verified session.
  - No SCHNGN-managed email waitlist exists; account creation goes through Clerk and the save-labelled signup action carries the account-storage consent.
  - Signed-in users can export and delete their application data; a verified Clerk deletion webhook provides cleanup fallback.
  - Sign-out isolates or removes synchronized local cache data on shared devices.
  - No trip dates, history, labels, calculated timelines, Clerk user IDs, or email enter analytics or operational logs.
- **Release gate:** repository tests must prove authorization isolation, no-consent/no-upload behavior, guest network silence, strict schemas, webhook verification/idempotency, export/deletion ownership, migration safety, and browser privacy behavior. Live production also requires Clerk domain/redirect configuration and a verified webhook signing secret.

---

# Local agent capability — approved post-MVP scope change

## US-23 — Local TypeScript API, JSON CLI, loopback HTTP/OpenAPI, and stdio MCP

- **Priority:** Should; additive local integration surface
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01, US-02, US-03, DEC-16
- **Implementation target:** expose the pure calculation to local agents through one strict versioned contract and thin local transports.
- **Acceptance summary:**
  - `@schngn/capability` provides strict schema-version-one TypeScript operations for usage on a reference date, checking a candidate stay on every day, and finding the latest safe exit.
  - Each stay-list field accepts at most 100 explicit continuous `{ entryDate, exitDate }` Schengen ranges, with a separate candidate range for stay checks; dates are real ISO calendar dates and unknown fields, labels, countries, IDs, account owners, and open-ended state are rejected.
  - Results use stable semantic fields, the `ordinary-schengen-90-180/v1` rule-set identifier, and fixed planning-aid/not-legal-advice advisory copy with the official source link.
  - `@schngn/agent` exposes strict JSON CLI commands through stdin or a file, a 64 KiB-bounded loopback HTTP API with OpenAPI 3.1 discovery, and three read-only MCP tools over stdio.
  - The HTTP server accepts only loopback hosts and returns no-store, non-echoing structured errors. MCP has no remote transport.
  - No capability surface stores or logs trip data, emits analytics/telemetry, or makes outbound network calls.
  - A cloud-backed agent host or model provider may still receive and retain tool inputs and results; the local guarantee applies to the SCHNGN runtime itself.
  - `@schngn/engine`, `@schngn/capability`, and `@schngn/agent` are MIT-licensed public npm packages; the initial registry release was confirmed on 2026-07-14.
  - The repository-backed `schngn` skill is prepared for distribution through the intended `npx skills add miktomic/schngn --skill schngn` command and delegates all math to the local runtime.
  - The localized `/agents` resource documents MCP-first setup, the skill, CLI, loopback REST/OpenAPI, TypeScript, operation schemas, and the agent-host privacy boundary.
  - Node 24+ is the runtime baseline; Bun 1.3.14 builds and tests the engine, capability, and agent packages as part of the root release gate.
  - The evidence wording remains published-rule fixtures and an independent oracle; there is no direct European Commission calculator output-parity claim.
- **Verification:** `bun run test:capability` passed with 15 tests / 50 assertions; `bun run test:agent` passed with 12 tests / 71 assertions covering JSON CLI, loopback/host/body guards, OpenAPI, structured errors, and stdio MCP tool results; `bun run build:agent` passed for the engine, capability, and four Node-targeted agent bundles; `bun run smoke:agent` launched the compiled CLI and stdio MCP server successfully. Root `bun run check` includes these tests, TypeScript checks, builds, and compiled-agent smoke.
- **Remote guardrail:** A SCHNGN-hosted API, hosted MCP server, non-loopback HTTP binding, or other SCHNGN-operated remote calculation phase remains unapproved because it would send anonymous trip dates to SCHNGN infrastructure. It requires a new decision covering privacy, authentication, explicit consent, logging/retention, rate/abuse controls, export/deletion expectations, and account-model integration.

---

# Trip-entry usability — approved additive scope

## US-24 — Localized drag-select date-range calendar

- **Priority:** Should; improves the primary trip-entry workflow
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-04, US-13, DEC-13, DEC-14
- **Implementation target:** a reusable, dependency-free calendar selector inside the Add trip dialog that writes to the existing canonical entry/exit fields.
- **Acceptance summary:**
  - Desktop shows two months; mobile shows one month without horizontal overflow.
  - Mouse, pen, and touch users can drag an inclusive period in either direction and across the two visible desktop months.
  - Tap-tap and Enter/Space selection remain available; arrow, Home/End, and Page Up/Page Down keys move focus without arbitrary past/future limits.
  - Exact native entry and exit inputs remain synchronized as an accessibility and precision fallback, and open-ended stays retain their existing behavior.
  - Calendar instructions, status, month/day formatting, and controls ship in all 17 supported locales; Hebrew and Arabic navigation mirrors correctly.
  - Selection updates the existing local trip form only. It adds no persistence, analytics, logging, or network path and preserves inclusive engine semantics.
- **Verification:** calendar model tests cover Monday-first grids, leap years, reverse ranges, month clamping, inclusive counts, and every locale. Playwright covers reverse cross-month drag through saved-trip output, real touchscreen tap-tap, keyboard selection, 320 px containment, RTL navigation, internal dialog scrolling, open-ended stays, PWA/offline behavior, account sync, outside-Schengen breaks, and inline editing. `bun run test:e2e` passed 32/32 and root `bun run check` passed 430 tests plus every typecheck, build, and compiled-agent smoke.

---

# Still excluded — scope guardrail

These are explicitly excluded from MVP. Do not pull them into active work unless the validation gate changes the strategy.

| Item | Why deferred |
|---|---|
| Native iOS / Android apps | Store cut, review delays, high maintenance; reward for validation |
| Email / flight / calendar parsing | High complexity, privacy risk, breakage risk |
| AI-generated legal explanations | Liability risk; copy must be fixed and human-reviewed |
| Multi-rule tracking, tax residency, UK ETA | Scope and legal complexity explosion |
| B2B / multi-client mode | Liability and procurement friction; later only |
| Push notification alerts | Requires backend/permissions; test appetite first |
| Residence permits, bilateral waivers, Brazil exception | Edge-case engine explicitly excluded and disclaimed |
| Hosted/remote calculation API or MCP | SCHNGN infrastructure must not receive anonymous trip dates without a new privacy/authentication/consent decision |

---

# Production hardening pull order

1. Result integrity: controlled country input, empty first-run state, semantically validated local data, and simulations that protect future booked trips.
2. Truthful evidence UI: data-driven timeline, proof, risk, and returning-days states.
3. Live validation plumbing: Plausible loader plus the authenticated D1 schema/binding/migrations and Clerk signup entry points.
4. Release gates: Playwright, accessibility, privacy payload, type, build, and post-deploy storage checks in CI.
5. Account expansion: optional Clerk authentication, signup-and-save consent, safe existing-account reconciliation, server-derived ownership, D1 data isolation, export/deletion, and lifecycle webhook cleanup.
6. External closeout: provider account setup, least-privilege credentials, migration application, `www` verification, Clerk domain/webhook verification, and a live privacy audit.

The authoritative operational checklist is `docs/production-readiness.md`.

# Suggested GitHub issue labels

If we convert this to GitHub Issues/Projects later, use:

- `priority:must`, `priority:should`
- `size:s`, `size:m`, `size:l`
- `epic:correctness`, `epic:data-entry`, `epic:testing`, `epic:core-ux`, `epic:trust-legal`, `epic:monetization`, `epic:analytics-distribution`, `epic:pwa`, `epic:ops`
- `privacy-critical`
- `ec-parity`
- `test-infrastructure`
- `post-deploy-smoke`
- `domain-hygiene`
- `agent-capability`
- `blocked:decision`
- `won't-mvp`
