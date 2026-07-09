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
- **Status:** Todo
- **Depends on:** US-01, US-07
- **Implementation target:** rolling-window availability visualization.
- **Acceptance summary:**
  - Future dates show available days.
  - Next date allowance improves is clearly marked.
  - Handles ~50 trips under 300ms.
- **Verification:** fixed trip-set unit assertions, EC planning-mode spot checks, performance test.

## US-10 — Disclaimers and “not legal advice” framing

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** approved fixed disclaimer copy and official-source references; see `docs/product-decisions.md`.
- **Implementation target:** persistent footer + first-run disclaimer notice using fixed copy only.
- **Acceptance summary:**
  - Planning tool only; not legal advice; not guarantee of entry.
  - Edge cases explicitly excluded.
  - Links to official EC calculator, EES, and ETIAS information.
  - No runtime AI-generated legal explanations.
- **Verification:** disclaimer visible on every core screen, first-run notice dismissible, official links resolve.

## US-11 — “Why this number?” plain-English explainer

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-01 and approved fixed copy boundaries; see `docs/product-decisions.md`.
- **Implementation target:** expandable explainer tied to calculation output.
- **Acceptance summary:**
  - Explains entry/exit counting.
  - Explains rolling 180-day look-back.
  - Explains why old trips remain until they drop off.
- **Verification:** accuracy review against EC guidance; 3-user comprehension test.

---

# Validation / Sprint 2–3 — Demand and monetization proof

## US-15 — Privacy-friendly analytics funnel

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** approved Plausible Cloud decision; see `docs/product-decisions.md`.
- **Implementation target:** Plausible Cloud configured through a typed allowlisted analytics wrapper without PII/trip dates.
- **Acceptance summary:**
  - Events: `page_view`, `calculator_start`, `trip_added`, `simulation_run`, `pdf_buy_intent`, `unlock_buy_intent`, `waitlist_signup`.
  - Trip event payloads contain count buckets only, never dates.
- **Verification:** trigger each event, inspect network payloads, confirm dashboard receipt.

## US-13 — Border-ready PDF export fake-door

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** US-07, US-15, approved fake-door pricing; see `docs/product-decisions.md`.
- **Implementation target:** fake-door CTA from dashboard using €5/€9/€19 by default and £5/£9/£19 on UK-targeted pages.
- **Acceptance summary:**
  - “Generate border-ready PDF — $X” button.
  - Click logs `pdf_buy_intent` and shows honest coming-soon / early-access message.
  - No accidental charge.
- **Verification:** event fires, message displays, no payment captured unless explicitly enabled.
- **Success metric:** PDF-click rate after completed calculation > 10%.

## US-14 — Paid unlock fake-door + pricing A/B

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-09, US-13, US-15, approved fake-door price buckets; see `docs/product-decisions.md`.
- **Implementation target:** premium/full-tracker CTA with persisted one-time price bucket assignment.
- **Acceptance summary:**
  - Gates premium framing behind buy/waitlist step.
  - Randomly assigns €5 / €9 / €19 by default, or £5 / £9 / £19 on UK-targeted pages.
  - Logs buy intent and assigned price.
- **Verification:** distribution test across buckets, event payload test, persistence across reloads.
- **Success metric:** targeted-traffic preorder/buy-intent > 2%.

## US-18 — Waitlist / email capture

- **Priority:** Should
- **Estimate:** S
- **Status:** Todo
- **Depends on:** approved Cloudflare D1 waitlist decision and privacy copy; see `docs/product-decisions.md`.
- **Implementation target:** email capture on landing and fake-door steps using Cloudflare D1.
- **Acceptance summary:**
  - Email field with GDPR consent and privacy note.
  - Stored in Cloudflare D1 separately from trip data.
  - Trip dates/history/calculation results are never accepted by the waitlist endpoint.
- **Verification:** submit → confirmation → appears in provider; consent/privacy link present.

---

# Launch / Sprint 3 — Distribution and polish

## US-16 — SEO landing page, niche-targeted

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** validated positioning copy, analytics from US-15, approved UK second-home/frequent-traveler angle; see `docs/product-decisions.md`.
- **Implementation target:** landing page aimed at UK second-home owners and frequent EU travelers post-Brexit.
- **Acceptance summary:**
  - Hero, benefit bullets, trust line, CTA.
  - SEO title/meta for UK 90/180 and second-home long-tail terms.
  - Fast mobile-first load.
- **Verification:** Lighthouse SEO/performance ≥ 90, meta tags present, Google Ads test.
- **Success metric:** cold-traffic email/waitlist signup > 5%.

## US-12 — Accuracy trust signal

- **Priority:** Should
- **Estimate:** S
- **Status:** Todo
- **Depends on:** US-01 EC-parity suite, approved public `/accuracy` page decision, and official-source references; see `docs/product-decisions.md`.
- **Implementation target:** trust claim and `/accuracy` validation evidence page.
- **Acceptance summary:**
  - “Validated against the European Commission's official short-stay calculator” with link.
  - Public `/accuracy` page with curated test cases.
  - No “certified,” “approved,” or guaranteed-entry language.
- **Verification:** claim present, link works, public test-case page loads if included.

## US-17 — Installable PWA + offline

- **Priority:** Should
- **Estimate:** M
- **Status:** Todo
- **Depends on:** stable calculator shell, US-05 local persistence
- **Implementation target:** manifest + service worker + offline calculator.
- **Acceptance summary:**
  - Installable prompt where supported.
  - Calculator works offline after first load.
- **Verification:** install on iOS and Android, airplane-mode calculator test, Lighthouse PWA checks.

## US-20 — Post-deploy smoke tests and privacy-safe operations

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** stable production deployment, US-15 for analytics payload rules, approved no-Sentry MVP monitoring decision; see `docs/product-decisions.md`.
- **Implementation target:** repeatable production smoke script/checklist and privacy-safe operational monitoring using Cloudflare logs/smoke tests first.
- **Acceptance summary:**
  - Script verifies `https://schngn.com/` and `https://schngn.com/app` return healthy HTTP responses.
  - Browser smoke checklist covers app render, console errors, manifest, and core static assets.
  - Post-deploy checklist includes privacy/network inspection for analytics, waitlist, and fake-door payloads.
  - No Sentry or equivalent third-party error monitoring in MVP launch unless explicitly revisited.
  - Rollback/failure notes live in the CI/CD docs.
- **Verification:** smoke script runs against production, browser console is clean, payload audit shows no trip data or secrets, docs link the runbook.

## US-21 — Canonical `www` redirect and domain hygiene

- **Priority:** Should
- **Estimate:** S
- **Status:** Todo
- **Depends on:** approved `www.schngn.com` → apex redirect decision and Cloudflare DNS/custom-domain setup; see `docs/product-decisions.md`.
- **Implementation target:** implement canonical `www.schngn.com` redirect to `https://schngn.com`.
- **Acceptance summary:**
  - `www.schngn.com` redirects to `https://schngn.com`.
  - Canonical URL, Open Graph URL, robots, and sitemap behavior agree with the apex domain decision.
  - No duplicate-content/confusing-domain behavior for launch traffic.
- **Verification:** `curl -I https://www.schngn.com` shows intended behavior if configured, browser check confirms redirect/no-error path, canonical tags remain apex-only unless strategy changes.

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
