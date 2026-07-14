# SCHNGN Product Decisions

> Last updated: 2026-07-14
> Scope: original MVP validation plus the approved optional-account and local-agent scope changes for SCHNGN.

This file records product, privacy, infrastructure, and launch decisions that unblock the MVP Kanban board. It is intentionally concise: durable decisions, rationale, and implementation constraints. Not a graveyard for every passing thought with a hat.

## Decision summary

| ID | Decision | Status | Impacted cards |
|---|---|---|---|
| DEC-01 | Use Plausible Cloud for MVP analytics | Approved | US-15, US-13, US-14, US-16, US-20 |
| DEC-02 | Use one-time fake-door price buckets: €5/€9/€19 default, £5/£9/£19 for UK pages | Approved | US-13, US-14 |
| DEC-03 | Historical Cloudflare D1 waitlist/email capture experiment | Retired; superseded by DEC-10 | US-18 |
| DEC-04 | Use fixed planning-aid/not-legal-advice disclaimer copy | Approved | US-10, US-11 |
| DEC-05 | Use official EC short-stay calculator, EES, and ETIAS references | Approved | US-10, US-12 |
| DEC-06 | Include public `/accuracy` validation page in MVP after US-01 is robust | Approved | US-12 |
| DEC-07 | No Sentry for MVP launch; use Cloudflare logs + smoke tests first | Approved | US-20 |
| DEC-08 | Redirect `www.schngn.com` to `https://schngn.com` | Approved | US-21 |
| DEC-09 | Landing angle: inclusive Schengen trip planning for frequent travelers, family visits, and longer stays | Approved | US-16 |
| DEC-10 | Optional Clerk accounts with consented, authenticated D1 trip sync | Approved scope change | US-22 |
| DEC-11 | Use the supplied cobalt SCHNGN wordmark and euro-star mark as the production identity | Approved | Production brand surfaces |
| DEC-12 | Model trips as journeys made of explicit Schengen stays | Approved | US-04, US-19 |
| DEC-13 | Localize the whole site in 17 languages, including RTL Hebrew and Arabic | Approved | Whole-site UI |
| DEC-14 | Use one continuous anchored calculator workspace with one canonical saved timeline | Approved | Core app UX |
| DEC-16 | Expose the calculation to agents through local-only TypeScript, CLI, loopback HTTP/OpenAPI, and stdio MCP surfaces | Approved post-MVP scope change | US-23 |

## DEC-01 — Analytics provider

**Decision:** Use **Plausible Cloud** for MVP analytics.

**Rationale:**

- Privacy-first and cookieless by design.
- Simple enough for MVP custom events.
- Less operational and privacy-risk surface than PostHog at this stage.
- Fathom is an acceptable fallback, but Plausible is the default.

**Implementation constraints:**

- Analytics must use a typed/allowlisted wrapper.
- Allowed events:
  - `page_view`
  - `calculator_start`
  - `trip_added`
  - `simulation_run`
  - `unlock_buy_intent`
- Never include:
  - trip dates
  - country sequences/history
  - names
  - emails
  - local storage dumps
  - calculated personal travel timelines

## DEC-02 — Fake-door pricing

**Decision:** Use one-time fake-door price buckets.

- Default/EU: **€5 / €9 / €19**
- UK-targeted pages: **£5 / £9 / £19**

**Rationale:**

- Tests willingness-to-pay without subscription complexity.
- Local currency improves UK traffic signal quality.
- MVP captures intent only; no accidental charge.

**Implementation constraints:**

- Persist assigned bucket locally.
- Log only assigned bucket and intent event.
- No payment capture unless explicitly enabled later.
- No trip data in analytics payloads.

## DEC-03 — Retired email/waitlist experiment

**Historical decision:** The original MVP used **Cloudflare D1** for a separate waitlist/email-capture experiment.

The retired implementation stored only:

- email
- `created_at`
- consent flag/version
- source/context string
- optional price bucket or fake-door source

**Original rationale:**

- SCHNGN already deploys on Cloudflare.
- D1 gives queryable rows and exportability.
- Cleaner than KV for the original waitlist experiment.

**Retirement decision (2026-07-11):** The active waitlist screen, public email-capture route, and `waitlist_signup` analytics event are removed. People who want repeat-visit access sign up through Clerk. SCHNGN does not maintain a second email funnel or copy Clerk-owned identity fields into D1.

**Retirement constraints:**

- There is no production waitlist data to retain, so the obsolete `0001` creation migration is removed rather than carried into fresh databases.
- Fresh databases start with the authenticated account schema at `0002`.
- `0005_drop_waitlist_signups.sql` performs an idempotent `DROP TABLE IF EXISTS` for any already-provisioned database. Do not accept new waitlist writes or repurpose the retired table as account identity.

## DEC-04 — Legal/disclaimer copy

**Decision:** Use fixed, human-approved copy. No runtime AI legal explanations.

**Base copy:**

> SCHNGN is a planning calculator, not legal advice and not a guarantee of entry. It estimates ordinary short stays under the Schengen 90/180-day rule. It does not account for residence permits, long-stay or national visas, bilateral waiver agreements, nationality-specific exceptions, work/study/asylum status, EES/ETIAS transition issues, or border-officer discretion. Always verify with official sources before booking or travelling.

**Footer copy:**

> Planning aid only — not legal advice or a guarantee of entry. Verify with official sources.

**Implementation constraints:**

- Display a persistent short disclaimer on core screens.
- Show fuller copy in first-run notice and explanation/help surfaces.
- Do not generate legal explanations dynamically.

## DEC-05 — Official-source references

**Decision:** Use these official links.

- European Commission short-stay calculator: <https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en>
- EES: <https://travel-europe.europa.eu/en/ees>
- ETIAS: <https://travel-europe.europa.eu/en/etias>

**Implementation constraints:**

- Do not imply EU endorsement or certification.
- “Validated against the European Commission calculator” is allowed only after captured official-calculator outputs and their provenance are checked into the parity suite.
- Until then, describe the actual evidence precisely: deterministic rule fixtures, boundary cases, and an independent day-set oracle.

## DEC-06 — Public validation page

**Decision:** Include a public `/accuracy` evidence page in MVP after US-01 is robust.

**Content direction:**

- Curated public test cases from the EC-parity suite.
- Clear method and limitations.
- Link to official EC calculator.
- Use careful language that distinguishes published-rule verification from direct official-calculator output parity.

**Implementation constraint:** Do not claim direct EC-calculator parity before provenance-backed official outputs exist in the repository.

## DEC-07 — Production error monitoring

**Decision:** No Sentry for MVP launch.

Use first:

- Cloudflare deployment/log visibility.
- Explicit post-deploy smoke tests.
- Browser console checks.
- Privacy/network payload audits.

**Rationale:** Avoid adding another privacy/PII surface while traffic is low.

**Future revisit:** Add Sentry or similar only after real usage justifies it, with strict scrubbing of localStorage, form inputs, breadcrumbs, emails, trip dates, and calculation timelines.

## DEC-08 — `www` domain policy

**Decision:** Redirect `www.schngn.com` to `https://schngn.com`.

**Rationale:**

- Avoid broken or ambiguous `www` traffic.
- Keep apex as canonical.

**Implementation constraints:**

- Canonical URL and Open Graph URL remain apex.
- Verify redirect with `curl -I https://www.schngn.com` and browser check after DNS/Cloudflare configuration.

## DEC-09 — First ad/landing angle

**Decision:** Present SCHNGN as an inclusive **Schengen trip planner for any traveler managing the 90/180-day rule**. Frequent travel, family visits, and second-home stays are examples, not eligibility categories.

**Rationale:**

- The 90/180-day problem applies across nationalities and travel patterns.
- Broad calculator and trip-planning language matches the product's actual scope.
- Specific examples can explain the value without implying the product is only for one nationality or property-owning group.
- Avoid remote-worker tax/visa/legal positioning that exceeds the product scope.

**Implementation direction:** Landing copy and SEO should lead with the Schengen 90/180 calculator and trip planner. Mention frequent trips, family visits, and longer stays as representative uses without making any one group the headline audience.

## DEC-10 — Optional accounts and authenticated sync

**Decision:** Add optional Clerk signup for repeat visits. Guest trips remain local-only. Clerk signup and sign-in open in a SCHNGN-themed in-page overlay so the calculator stays mounted; successful completion returns to the same app URL. The “Sign up & save” and “Create account & save trips” actions are explicit storage consent: after Clerk signup completes, SCHNGN automatically syncs the current validated trip snapshot to Cloudflare D1. A separately signed-in existing user retains the reconciliation and sync-choice flow.

This is an approved **scope change** after the original no-account MVP cards. It does not retroactively weaken the local-only guarantees verified by US-05.

**Identity and ownership:**

- Clerk is the identity source of truth for sessions, email, login methods, and identity lifecycle.
- D1 application rows are keyed by the server-verified Clerk user ID.
- Every account read, write, export, and deletion derives the owner from the verified Clerk session. Never accept a client-supplied owner.
- Do not duplicate Clerk profile fields in D1 without a concrete application requirement.

**Consent and guest behavior:**

- Signup is optional; the calculator remains usable without an account.
- Guest trips never leave browser storage and have no server fallback.
- Completing signup from a signup-and-save CTA automatically uploads the current local trips to the newly created account.
- A normal existing-account sign-in does not silently overwrite local or cloud data; it follows the reconciliation flow and may require a separate sync choice.

**Lifecycle requirements:**

- Provide an authenticated export of the user’s application data.
- Provide account-data deletion; a verified Clerk deletion webhook is a cleanup fallback for D1 rows.
- A verified `user.deleted` webhook must atomically install a 30-day replay guard before deleting
  the snapshot. Store only a one-way SHA-256 digest of the Clerk user ID in that guard, ignore and
  opportunistically purge expired markers, and never use the user-facing “delete saved trips” action
  to tombstone an account that still exists in Clerk.
- Clear or isolate synchronized browser caches on sign-out so a later user on a shared device cannot read the prior account’s trips.
- Do not send trip dates, histories, labels, calculated timelines, Clerk user IDs, or account email to Plausible or operational logs.

**Infrastructure:**

- GitHub production variable: `PUBLIC_CLERK_PUBLISHABLE_KEY`.
- GitHub production secrets: `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SIGNING_SECRET`.
- Runtime secrets are uploaded through a permission-restricted ephemeral runner file with `wrangler versions upload --secrets-file`; no key value is committed or printed.

## DEC-11 — Production brand identity

**Decision:** Use the supplied cobalt SCHNGN wordmark with its euro-and-stars glyph and calendar detail as the production wordmark. Use the supplied square euro-and-stars artwork as the source for browser and install icons.

**Implementation constraints:**

- The canonical web wordmark is `apps/web/static/brand/schngn-wordmark.png` and is rendered through `SchngnLogo.svelte`.
- Browser, Apple touch, and PWA icons are deterministic crops and resizes of the supplied square artwork. The manifest uses separate `any` and `maskable` entries.
- Do not redraw, auto-trace, or reinterpret the supplied geometry. Background cleanup, cropping, resizing, and format conversion are allowed.
- The interface's semantic safe/booked/what-if/risk palette remains unchanged. Brand blue and yellow remain inside the artwork until a separate palette decision is approved.
- The mark must never imply EU certification, ownership, or endorsement.

## DEC-12 — Trips are journeys made of Schengen stays

**Decision:** Ask for the first entry into and final exit from the Schengen Area, not one destination country. Optional entry and exit countries provide recall/report context but never affect the calculation. A journey that temporarily leaves Schengen contains multiple counted stay ranges separated by full calendar-day gaps outside Schengen.

**Implementation constraints:**

- The engine accepts explicit `{ entryDate, exitDate }` Schengen stay ranges only.
- Entry and exit boundary days count inclusively; overlapping ranges are de-duplicated.
- The web layer validates optional entry/exit countries against the current Schengen list.
- When the entry country is chosen and the exit country is blank, the form mirrors the entry country as a reversible default; it never overwrites an explicit exit choice.
- The form progressively reveals inline outside-Schengen breaks, summarizes counted versus outside days, and previews the resulting inclusive 180-day allocation on the shared timeline.
- A newly added historical trip ending before today’s inclusive rolling-window start requires an inline “Save anyway” confirmation because it will not affect today’s allocation. The boundary day itself remains in-window.
- A journey whose final exit is before the current local date is automatically marked Past. An exit today remains current; users choose only Booked or What-if for current and future journeys.
- A traveler may leave the final exit open for a current or future stay when the actual exit date is not known. A current open-ended stay is counted through the current local date; a future open-ended stay is projected through its latest safe exit based on the other saved trips. The saved journey keeps an explicit internal open-ended marker, and the calculated deadline is never presented as the traveler’s actual exit. Only one journey may be open-ended at a time; entering the actual exit closes it.
- Local storage, backups, and account snapshots use schema version 2. Version-one data is intentionally unsupported because no legacy-data commitment exists.
- D1 migration `0004_reset_account_trip_snapshots_v2.sql` clears pre-launch snapshots and recreates the constrained schema-two table without deleting Clerk accounts.
- Country metadata and full travel histories remain prohibited from analytics and logs.

## DEC-13 — Whole-site localization and reviewed-copy boundary

**Decision:** Support English, French, German, Spanish, Italian, Brazilian Portuguese, Russian, Ukrainian, Turkish, Serbian in Latin script, Albanian, Georgian, Simplified Chinese, Japanese, Korean, Hebrew, and Arabic across the public site and calculator. English uses the existing unprefixed routes; other languages use a locale prefix such as `/pt-br/app` or `/uk/faq`. Hebrew and Arabic render right-to-left.

**Implementation constraints:**

- Locale selection lives in the URL and a non-sensitive preference cookie. It is never added to trip snapshots or analytics payloads.
- Locale switching preserves the current page, app anchor, and other safe URL context.
- Dates use locale-aware `Intl` formatting. ISO trip dates and engine inputs remain unchanged.
- Localized routes are included in canonical/alternate metadata, the sitemap, and the offline navigation allowlist.
- Fixed legal, safety, rule-explanation, and official-source labels are localized in every supported pack and remain deterministic; generated legal explanations remain forbidden.
- New-market packs begin from the canonical English catalog and must receive native-speaker review of legal and rule copy before paid acquisition targets that language.
- Ukrainian copy explicitly states that residence permits, temporary protection, and other residence status can change which days count; SCHNGN models ordinary short stays only.
- Hebrew and Arabic use semantic RTL document direction while ISO values, email addresses, and other inherently left-to-right data retain appropriate directionality.

## DEC-14 — One continuous calculator workspace

**Decision:** `/app` uses a continuous, responsive calculator rather than mutually exclusive workspace tabs. The canonical 180-day timeline and Trips list form that calculator. Account, sync, import, export, and browser-data controls use a dedicated `#account` destination in the shared header; it switches the same mounted route to an Account & data view so Clerk state and pending sync work are preserved. The guided Explainer and sourced FAQ remain dedicated localized public pages linked from the shared navigation. The Explainer reuses the production timeline, trip mini-timeline, status, date, and counting logic so its examples cannot quietly drift into a different visual or mathematical model. The persistent answer rail is visible but is not a navigation destination. The master timeline is the first calculator section, followed immediately by the saved-trip cards under Trips. Every card always shows its own color-coded 180-day timeline; selecting the card expands sliders and direct date inputs inside it. One bottom “Add new trip” action opens the new-trip editor as a dialog.

**Implementation constraints:**

- A first-time user sees the previous-trip step before any safe verdict. They may either add history or explicitly confirm that no prior Schengen trips exist; that assumption persists locally.
- Desktop keeps the current answer visible beside the working surface. Mobile uses one reading column. The shared header provides Calculator and Account destinations; there is no secondary tab or jump menu inside the calculator.
- The master timeline in the first workspace section is canonical. Editor and adjustment previews may show contextual timelines, but they never replace or mutate the saved result until the user saves.
- Every saved-trip card is the edit affordance: there is no separate expand icon, Edit button, or saved-trip edit dialog. The expanded card exposes the draggable/resizable adjuster and direct date inputs together; a compact details disclosure allows corrections to its label, border-country context, and outside-Schengen breaks. Saving preserves the trip ID, and whether a trip is completed is derived from its dates.
- A card with unsaved changes stays open. Opening another card or the new-trip dialog is blocked until the traveler explicitly saves the changes or chooses “Keep original,” preventing silent loss of an in-progress adjustment.
- Card timeline colors distinguish trips, not safety or booking state. Text labels and the aggregate red over-limit evidence carry status meaning, so the cards remain understandable without color.
- A completed trip that exceeded the allowance is historical evidence, not a plan that still “needs changes.” It is labeled “Completed · N days over at the time,” remains fully counted in any rolling window it affects, and offers correction only if its recorded dates are inaccurate. If that completed history would make a later plan exceed the limit, the later plan is identified as the affected item rather than misattributing the overage to the completed trip.
- The single “Add new trip” action at the bottom of Trips opens the trip editor as a modal dialog; the workspace has no second trip-entry surface.
- Future planning and saved-trip adjustment keep independent state so experimenting with one cannot silently alter the other.
- `#timeline`, `#trips`, and `#account` restore on refresh and browser navigation. Retired `#status` canonicalizes to `#timeline`; retired `#details` and old planner, proof, and returning-days destinations map to `#trips`; retired report and waitlist destinations map to `#account`. Legacy app destinations `#rules`, `#explainer`, `#help`, and `#faq` redirect to the dedicated localized `/explainer` and `/faq` pages.
- FAQ rule answers remain fixed, reviewed copy with direct official EU sources. SCHNGN-specific behavior is labeled separately and never presented as law or a border decision.
- Account/data controls are always visible in the dedicated `#account` destination, while the calculator omits them entirely.
- The unrecognized “border-ready PDF” fake door and its analytics event are retired. The visible bottom CTA instead explains the real account value: keeping trip history for future 90/180 calculations and optional cross-device sync after explicit consent.

## DEC-15 — Support and feature-request contact form

**Decision:** Add a small localized `/contact` form for help and feature requests. It is not an account, waitlist, newsletter, or analytics surface.

**Implementation constraints:**

- The form collects request type, optional name, reply email, and a message only when the visitor submits them.
- It never reads or attaches saved trips, calculated timelines, account identity, or browser storage.
- The Worker delivers through Cloudflare Email Service from `support@schngn.com` to the fixed, verified `schngn@proton.me` destination. Inbound mail to the branded support address forwards to the same Proton inbox. The browser cannot choose a recipient.
- Cloudflare Turnstile is validated server-side for every real submission, and the Worker rate-limits before verification or delivery.
- Responses use `Cache-Control: no-store`; message content and sender addresses never enter Plausible or operational logs.
- The form warns visitors not to send passport, visa, or other sensitive document numbers and retains a direct email fallback when delivery is unavailable.

## DEC-16 — Local-only agent calculation capability

**Decision:** Expose the ordinary-short-stay calculation to agents through one strict local capability contract and four local surfaces:

- a TypeScript API in `@schngn/capability`;
- a JSON CLI in `@schngn/agent`;
- a loopback-only HTTP API with an OpenAPI 3.1 document;
- three read-only MCP tools over stdio.

This is an approved post-MVP scope change. “API” currently means an in-process TypeScript interface or a service reachable only on the same machine. It does not authorize a SCHNGN-hosted calculation service.

**Distribution:** Publish `@schngn/engine`, `@schngn/capability`, and `@schngn/agent` as public MIT-licensed npm packages, distribute the repository-backed `schngn` skill through `npx skills add miktomic/schngn --skill schngn`, and document the setup and interfaces on a localized `/agents` page. The skill guides compatible agents to the strict local tools; it does not duplicate the calculation. The initial npm registry release was confirmed on 2026-07-14.

**Contract:**

- Schema version `1` and rule set `ordinary-schengen-90-180/v1` cover usage on a reference date, checking a candidate stay on every day, and finding the latest safe exit.
- Each stay-list field accepts at most 100 explicit continuous Schengen stay ranges, with a separate candidate range for the stay-check operation; stay objects contain only `entryDate` and `exitDate` in ISO calendar-date form.
- Full calendar days outside Schengen are represented as gaps between separate stays. Country metadata never changes the math and is not accepted by the capability.
- Successful results include stable semantic fields plus fixed planning-aid/not-legal-advice advisory copy and the official European Commission source link.
- The checked-in evidence remains deterministic published-rule fixtures, boundary/property tests, and an independent day-set oracle. Do not claim captured-output parity with the European Commission calculator, certification, endorsement, or a guarantee of entry.

**Local privacy and runtime boundary:**

- The capability and agent surfaces perform no persistence, analytics, telemetry, outbound network calls, or logging of submitted dates.
- That guarantee covers the SCHNGN runtime. A cloud-backed agent host or model provider may receive and retain tool inputs and results under its own policies.
- The HTTP server accepts only loopback hosts (`127.0.0.1`, `::1`, or `localhost`), uses bounded JSON bodies and no-store responses, and publishes its OpenAPI document locally.
- MCP uses stdio only. Remote MCP transports are not approved.
- The JSON CLI reads stdin or an explicit local file and emits structured JSON; calculation errors do not echo submitted values.
- Node 24+ is the local runtime baseline and Bun 1.3.14 remains the build/test/package runner.

**Remote scope guardrail:** A SCHNGN-hosted HTTP API, hosted MCP server, or any other SCHNGN-operated remote calculation transport remains unapproved because it would send anonymous trip dates to SCHNGN infrastructure. Before any remote phase, approve a separate decision covering authentication, explicit consent, privacy disclosure, retention and operational logging, rate/abuse controls, deletion/export expectations, and the relationship to the signed-in account model. Do not quietly add a Worker calculation route or relax the loopback/stdio restrictions.

## Board state

The original MVP Hermes Kanban decision cards on board `schngn` were completed on 2026-07-09 with comments and structured metadata. DEC-16 is the later local-agent scope decision recorded with completed repository card US-23.
