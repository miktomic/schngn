# SCHNGN MVP Implementation Kanban

> Source: Schengen Tracker MVP Product Backlog pasted into Hermes on 2026-07-08.  
> Scope: **Option B Web/PWA MVP** — no login, local-only storage, provably-correct engine, free calculator + fake-door paid unlock.

## Board policy

- **WIP limit:** one story in `Doing` at a time until US-01 is green. The engine is the load-bearing wall; do not decorate it with UI wallpaper until it stands.
- **Quality gate:** US-01/US-02/US-03 must pass EC-parity + boundary tests before implementation moves into polished dashboard work.
- **Privacy gate:** any analytics/fake-door work must prove it sends **no trip dates, no PII, no local travel history**.
- **Definition of done for every card:** acceptance criteria met, relevant automated tests pass, mobile manual QA done, privacy/disclaimer unaffected, analytics verified where relevant.
- **Default status:** all cards start in `Todo`. Move only when actually implemented and verified.

## Kanban overview

| Column | Purpose | WIP limit |
|---|---|---:|
| `Ready / Sprint 1` | Correctness and data foundation | 1–2 |
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
- **Status:** Todo
- **Depends on:** none
- **Why now:** this is the product. If this is wrong, everything else is a charming overstay generator.
- **Implementation target:** pure calculation engine, fixtures, property/golden tests, CI gate.
- **Acceptance summary:**
  - Entry and exit days both count.
  - Rolling 180-day look-back from any reference date.
  - Overlapping/adjacent trips de-duplicated.
  - Cyprus/Ireland excluded; Iceland/Norway/Liechtenstein/Switzerland included.
- **Verification:** 40–60 EC-parity fixtures, property tests, golden-master tests, CI fails on drift.

## US-02 — Latest safe exit date calculation

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-01
- **Implementation target:** function that returns last legal/safe exit date for an active/planned stay.
- **Acceptance summary:**
  - Computes latest exit while keeping usage ≤ 90.
  - Handles already-at-limit and over-limit cases.
- **Verification:** fixture tests prove returned exit is safe and exit + 1 day overstays.

## US-03 — Overstay / verdict flag

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** US-01
- **Implementation target:** status classifier with configurable thresholds.
- **Acceptance summary:**
  - `OK` when buffer > 7 days.
  - `Cutting it close` when buffer is 1–7 days.
  - `Overstay / over limit` when usage exceeds allowance.
- **Verification:** boundary tests at 82/83/89/90/91 days used.

## US-04 — Add / edit / delete a trip

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-01 data model contract
- **Implementation target:** trip CRUD UI and validation.
- **Acceptance summary:**
  - Add entry date, exit date, optional country/label.
  - Equal entry/exit allowed as a one-day trip.
  - Exit before entry rejected inline.
  - Edit/delete re-sorts list and recalculates immediately.
- **Verification:** unit validation tests, integration add/edit/delete → recalculation, mobile Safari/Chrome QA.

## US-05 — Local-only persistence, no account

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-04
- **Implementation target:** localStorage or IndexedDB persistence layer.
- **Acceptance summary:**
  - Trips persist across reload/restart.
  - Trip dates are never transmitted.
  - Visible local/private data message.
- **Verification:** reload/reopen test, DevTools network audit, storage-disabled warning.

---

# Next / Sprint 2 — Core user experience and reassurance

## US-06 — JSON export / import

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** US-04, US-05
- **Implementation target:** JSON backup and restore flow.
- **Acceptance summary:**
  - Export downloads JSON.
  - Import validates schema, restores trips, recalculates.
  - Malformed imports fail with clear error.
- **Verification:** serialize/deserialize round-trip tests, corrupted import manual QA.

## US-07 — Dashboard: days used / remaining / status

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-01, US-02, US-03
- **Implementation target:** mobile-first money-shot dashboard using the synthesis design direction.
- **Acceptance summary:**
  - Above-the-fold: days remaining, status badge, latest safe exit.
  - Live recalculation as trips change.
  - Large-type, high-contrast, calm design.
- **Verification:** integration tests for five scenarios, WCAG AA contrast, 200% zoom, older/low-tech user sanity check.

## US-09 — Future-trip simulator, “Can I book this?”

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-01, US-03, US-07
- **Implementation target:** non-mutating what-if trip input and verdict panel.
- **Acceptance summary:**
  - Proposed dates produce instant yes/no verdict.
  - Simulation does not mutate saved trips.
  - Shows max additional days for proposed start date.
- **Verification:** simulated-trip unit tests, integration test proves saved totals unchanged, clear/reset manual QA.

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
- **Depends on:** copy/legal review decision
- **Implementation target:** persistent footer + first-run disclaimer notice.
- **Acceptance summary:**
  - Planning tool only; not legal advice; not guarantee of entry.
  - Edge cases explicitly excluded.
  - Links to official EC calculator and EES information.
- **Verification:** disclaimer visible on every core screen, first-run notice dismissible, official links resolve.

## US-11 — “Why this number?” plain-English explainer

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** US-01, human-reviewed copy
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
- **Depends on:** analytics provider decision
- **Implementation target:** Plausible/Fathom/PostHog configured without PII/trip dates.
- **Acceptance summary:**
  - Events: `page_view`, `calculator_start`, `trip_added`, `simulation_run`, `pdf_buy_intent`, `unlock_buy_intent`, `waitlist_signup`.
  - Trip event payloads contain count buckets only, never dates.
- **Verification:** trigger each event, inspect network payloads, confirm dashboard receipt.

## US-13 — Border-ready PDF export fake-door

- **Priority:** Must
- **Estimate:** S
- **Status:** Todo
- **Depends on:** US-07, US-15, price/copy decision
- **Implementation target:** fake-door CTA from dashboard.
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
- **Depends on:** US-09, US-13, US-15, price bucket decision
- **Implementation target:** premium/full-tracker CTA with persisted A/B price assignment.
- **Acceptance summary:**
  - Gates premium framing behind buy/waitlist step.
  - Randomly assigns $5 / $9 / $19 or local equivalent.
  - Logs buy intent and assigned price.
- **Verification:** distribution test across buckets, event payload test, persistence across reloads.
- **Success metric:** targeted-traffic preorder/buy-intent > 2%.

## US-18 — Waitlist / email capture

- **Priority:** Should
- **Estimate:** S
- **Status:** Todo
- **Depends on:** provider + privacy copy decision
- **Implementation target:** email capture on landing and fake-door steps.
- **Acceptance summary:**
  - Email field with GDPR consent and privacy note.
  - Stored separately from trip data.
- **Verification:** submit → confirmation → appears in provider; consent/privacy link present.

---

# Launch / Sprint 3 — Distribution and polish

## US-16 — SEO landing page, niche-targeted

- **Priority:** Must
- **Estimate:** M
- **Status:** Todo
- **Depends on:** validated positioning copy, analytics from US-15
- **Implementation target:** landing page aimed at UK second-home owners / frequent travelers.
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
- **Depends on:** US-01 EC-parity suite, decision on public test-case page
- **Implementation target:** trust claim and link to validation evidence.
- **Acceptance summary:**
  - “Validated against the European Commission's official short-stay calculator” with link.
  - Optional public test cases.
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

---

# Blocked / Needs decision

Move these decisions out of the way before pulling dependent cards:

- **Analytics provider:** Plausible vs Fathom vs PostHog. Must support privacy-friendly event tracking without dates/PII.
- **Fake-door pricing:** confirm $5 / $9 / $19, EUR/GBP equivalent, or a different price ladder.
- **Email/waitlist provider:** choose lightweight provider and GDPR consent copy.
- **Legal/disclaimer copy:** final human-reviewed wording for not-legal-advice and excluded edge cases.
- **Official-source references:** canonical EC calculator/EES links to display.
- **Public validation page:** decide whether US-12 includes public test cases in MVP.
- **Ad test angle:** UK second-home owners vs frequent travelers vs remote workers for the first landing page/ad campaign.

---

# Done

Nothing yet. Correct state; honesty is cheaper than optimistic project management cosplay.

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

# Pull order

Use this order unless a dependency or decision changes:

1. US-01 — Rolling 180-day engine
2. US-02 — Latest safe exit date
3. US-03 — Verdict flag
4. US-04 — Trip CRUD
5. US-05 — Local-only persistence
6. US-06 — JSON import/export
7. US-07 — Dashboard money-shot
8. US-09 — Future-trip simulator
9. US-08 — Days-coming-back visualization
10. US-10 — Disclaimers
11. US-11 — Why-this-number explainer
12. US-15 — Privacy-friendly analytics
13. US-13 — PDF fake-door
14. US-14 — Paid unlock fake-door + pricing A/B
15. US-18 — Waitlist/email capture
16. US-16 — SEO landing page
17. US-12 — Accuracy trust signal
18. US-17 — Installable PWA/offline

# Suggested GitHub issue labels

If we convert this to GitHub Issues/Projects later, use:

- `priority:must`, `priority:should`
- `size:s`, `size:m`, `size:l`
- `epic:correctness`, `epic:data-entry`, `epic:core-ux`, `epic:trust-legal`, `epic:monetization`, `epic:analytics-distribution`, `epic:pwa`
- `privacy-critical`
- `ec-parity`
- `blocked:decision`
- `won't-mvp`
