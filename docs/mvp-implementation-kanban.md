# SCHNGN MVP Implementation Kanban

> Source: Schengen Tracker MVP Product Backlog pasted into Hermes on 2026-07-08.
> Scope: **Option B Web/PWA MVP** — no login, local-only storage, provably-correct engine, free calculator + fake-door paid unlock.

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
| `Launch / Sprint 3` | SEO, waitlist, PWA, accuracy proof | 2 |
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
  - Cyprus/Ireland and other non-Schengen country codes excluded; Iceland/Norway/Liechtenstein/Switzerland included.
  - Explicit Schengen country-code allowlist exported for UI/import validation.
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
  - Treats missing country as manual Schengen input.
  - Returns `null` for non-Schengen target countries because Schengen safe exit is not applicable.
- **Verification:** boundary tests prove returned exit is safe and exit + 1 day overstays; covered no-prior-trip, 89-used, 90-used, old-days-aging-out, missing-country, and non-Schengen target cases.

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
  - E2E smoke covers mobile viewport, keyboard focus reachability, proof/report/privacy/waitlist states, and no forbidden network payloads.
  - `bun run check` remains fast and includes app utility tests, typecheck, and build; Playwright remains explicit so normal CI/local checks are not painfully slow.
- **Verification:** `npx -y bun@1.3.14 run check` passed; `npx -y bun@1.3.14 run test:e2e` passed; deliberate forbidden-payload fixtures fail loudly in `apps/web/tests/privacy-network.test.ts`.

## US-04 — Add / edit / delete a trip

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-01 data model contract, US-19 for browser/integration coverage
- **Implementation target:** trip CRUD UI and validation.
- **Acceptance summary:**
  - Add entry date, exit date, optional country/label.
  - Equal entry/exit allowed as a one-day trip.
  - Exit before entry rejected inline.
  - Edit/delete re-sorts list and recalculates immediately.
- **Verification:** `npx -y bun@1.3.14 run check` passed with 75 Bun tests / 1124 assertions; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium add/edit/delete/validation and privacy-network coverage.

## US-05 — Local-only persistence, no account

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
  - Events: `page_view`, `calculator_start`, `trip_added`, `simulation_run`, `pdf_buy_intent`, `unlock_buy_intent`, `waitlist_signup`.
  - Payloads are allowlisted and aggregate-only: source, trip count bucket, safe-buffer bucket, verdict, or price bucket.
  - Trip dates, labels, names, email addresses, country history, and personal timelines are rejected before any analytics call.
  - UI wiring fires aggregate funnel events from screen views, trip-add, simulator, and waitlist intent without sending trip details.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 104 Bun tests / 1242 assertions including privacy-safe analytics allowlist and forbidden-payload rejection tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for intercepted Plausible-compatible events and no forbidden network payloads.

## US-13 — Border-ready PDF export fake-door

- **Priority:** Must
- **Estimate:** S
- **Status:** Done
- **Depends on:** US-07, US-15, approved fake-door pricing; see `docs/product-decisions.md`.
- **Implementation target:** report-screen fake-door CTA using the approved €9 MVP default; broader price-bucket persistence/distribution remains US-14.
- **Acceptance summary:**
  - “Generate border-ready PDF — €9” button on the border-ready report screen.
  - Click logs aggregate-only `pdf_buy_intent` with `source: report` and `price_bucket: eur_9`.
  - Shows honest early-access message and explicit “No payment was taken” copy.
  - Does not send trip dates, report contents, labels, email, or personal travel timelines.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 106 Bun tests / 1250 assertions including PDF fake-door state and analytics-event tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the PDF fake-door CTA, early-access/no-charge message, `pdf_buy_intent`, and no forbidden network payloads.
- **Success metric:** PDF-click rate after completed calculation > 10%.

## US-14 — Paid unlock fake-door + pricing A/B

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** US-09, US-13, US-15, approved fake-door price buckets; see `docs/product-decisions.md`.
- **Implementation target:** premium/full-tracker planner CTA with persisted one-time price bucket assignment in local browser storage.
- **Acceptance summary:**
  - Gates premium/full-planner framing behind an unlock fake-door CTA on the Planner screen.
  - Assigns approved €5 / €9 / €19 EU buckets and £5 / £9 / £19 UK buckets through a tested bucket helper.
  - Persists the assigned bucket across reloads using local storage; invalid stored values are ignored and reassigned.
  - Logs aggregate-only `unlock_buy_intent` with `source: planner` and the assigned `price_bucket`.
  - Shows honest early-access and “No payment was taken” copy; no checkout or charge path is enabled.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 110 Bun tests / 1266 assertions including bucket assignment, persistence, invalid-value recovery, and aggregate unlock-intent payload tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the planner unlock CTA, early-access/no-charge message, `unlock_buy_intent`, PDF fake-door, and no forbidden network payloads.
- **Success metric:** targeted-traffic preorder/buy-intent > 2%.

## US-18 — Waitlist / email capture

- **Priority:** Should
- **Estimate:** S
- **Status:** Done
- **Depends on:** approved Cloudflare D1 waitlist decision and privacy copy; see `docs/product-decisions.md`.
- **Implementation target:** email capture on the Waitlist screen with a D1-backed `/api/waitlist` endpoint when the `DB` binding is configured.
- **Acceptance summary:**
  - Email field with explicit consent and visible privacy note.
  - Submit button remains disabled until email + consent are present.
  - Endpoint accepts only normalized email, consent/version, source, and optional price bucket.
  - Endpoint rejects missing consent, invalid source, and invalid price bucket values.
  - Endpoint ignores trip dates/history/calculation payload fields and stores no trip data.
  - If `DB` is not bound yet, endpoint returns `202` accepted with `stored: false` instead of attempting unsafe storage.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 114 Bun tests / 1279 assertions including D1 insert-shape, consent-required, invalid-source/bucket rejection, and unbound fallback tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for email-only waitlist submit, consent gating, confirmation, `waitlist_signup`, and no trip-date/label leakage.

---

# Launch / Sprint 3 — Distribution and polish

## US-16 — SEO landing page, niche-targeted

- **Priority:** Must
- **Estimate:** M
- **Status:** Done
- **Depends on:** validated positioning copy, analytics from US-15, approved UK second-home/frequent-traveler angle; see `docs/product-decisions.md`.
- **Implementation target:** landing page aimed at UK second-home owners and frequent Europe travelers post-Brexit.
- **Acceptance summary:**
  - Hero, benefit bullets, trust line, CTA.
  - SEO title/meta/social tags for UK 90/180 and second-home long-tail terms.
  - Mobile-first load without private trip-value network leakage.
- **Verification:** `npx -y bun@1.3.14 run test` passed with 117 Bun tests / 1296 assertions including UK second-home SEO source tests; `npx -y bun@1.3.14 run typecheck` passed; `npx -y bun@1.3.14 run build` passed; `npx -y bun@1.3.14 run test:e2e` passed with mobile Chromium coverage for the targeted landing metadata, hero, trust line, CTA, and no forbidden network payloads.
- **Success metric:** cold-traffic email/waitlist signup > 5%.

## US-12 — Accuracy trust signal

- **Priority:** Should
- **Estimate:** S
- **Status:** Done
- **Depends on:** US-01 EC-parity suite, approved public `/accuracy` page decision, and official-source references; see `docs/product-decisions.md`.
- **Implementation target:** trust claim and `/accuracy` validation evidence page.
- **Acceptance summary:**
  - “Validated against the European Commission official short-stay calculator” with link.
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
  - Smoke script submits only a generated `smoke+...@schngn.invalid` waitlist email request and rejects trip-date/history fields in the smoke payload.
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
- **Email/waitlist provider:** Cloudflare D1 with email + consent/source metadata only.
- **Legal/disclaimer copy:** fixed planning-aid/not-legal-advice copy; no runtime AI legal explanations.
- **Official-source references:** EC short-stay calculator, EES, and ETIAS official links.
- **Public validation page:** include `/accuracy` after US-01 is robust.
- **Production error monitoring:** no Sentry for MVP launch; use Cloudflare logs + smoke tests first.
- **`www` domain policy:** redirect `www.schngn.com` to `https://schngn.com`.
- **Ad test angle:** UK second-home owners and frequent EU travelers post-Brexit.

---

# Done

No implementation cards are done yet. Product decision cards were completed in the Hermes Kanban board and recorded above / in `docs/product-decisions.md`. Correctly boring distinction: decisions are not shipped product.

---

# Won't in MVP — scope guardrail

These are explicitly excluded from MVP. Do not pull them into active work unless the validation gate changes the strategy.

| Item | Why deferred |
|---|---|
| User accounts / login / cloud sync | Adds GDPR, backend, support burden before validation |
| Native iOS / Android apps | Store cut, review delays, high maintenance; reward for validation |
| Email / flight / calendar parsing | High complexity, privacy risk, breakage risk |
| AI-generated legal explanations | Liability risk; copy must be fixed and human-reviewed |
| Multi-rule tracking, tax residency, UK ETA | Scope and legal complexity explosion |
| B2B / multi-client mode | Liability and procurement friction; later only |
| Push notification alerts | Requires backend/permissions; test appetite first |
| Residence permits, bilateral waivers, Brazil exception | Edge-case engine explicitly excluded and disclaimed |

---

# Remaining pull order

US-01, US-02, US-03, US-19, US-04, US-05, and US-06 are done. Use this order unless a dependency or decision changes:

1. US-07 — Dashboard money-shot
2. US-09 — Future-trip simulator
3. US-08 — Days-coming-back visualization
4. US-10 — Disclaimers
5. US-11 — Plain-language explanations
6. US-15 — Privacy-safe analytics
7. US-13 — PDF/export fake-door
8. US-14 — Paid unlock fake-door
9. US-18 — Waitlist / email capture
10. US-16 — Public `/accuracy` page
11. US-12 — PWA/offline install
12. US-17 — Launch landing page / SEO
13. US-20 — Post-deploy production smoke
14. US-21 — `www` redirect to apex

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
- `blocked:decision`
- `won't-mvp`
