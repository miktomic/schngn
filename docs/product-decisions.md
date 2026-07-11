# SCHNGN Product Decisions

> Last updated: 2026-07-11
> Scope: original MVP validation plus the approved optional-account scope change for SCHNGN.

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
| DEC-09 | First ad/landing angle: UK second-home owners and frequent EU travelers post-Brexit | Approved | US-16 |
| DEC-10 | Optional Clerk accounts with consented, authenticated D1 trip sync | Approved scope change | US-22 |
| DEC-11 | Use the supplied cobalt SCHNGN wordmark and euro-star mark as the production identity | Approved | Production brand surfaces |
| DEC-12 | Model trips as journeys made of explicit Schengen stays | Approved | US-04, US-19 |
| DEC-13 | Localize the whole site in nine languages, including RTL Hebrew and Arabic | Approved | Whole-site UI |
| DEC-14 | Use one continuous anchored calculator workspace with one canonical saved timeline | Approved | Core app UX |

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
  - `pdf_buy_intent`
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

**Decision:** Start with **UK second-home owners and frequent EU travelers post-Brexit**.

**Rationale:**

- Sharp 90/180 pain.
- Clear search intent.
- Likely willingness to pay for confidence/reporting.
- Less noisy than remote-worker positioning, which drifts into tax/visa/legal complexity.

**Implementation direction:** Landing page copy and SEO should target UK 90/180, second homes, frequent France/Spain/Italy travel, and booking confidence.

## DEC-10 — Optional accounts and authenticated sync

**Decision:** Add optional Clerk signup for repeat visits. Guest trips remain local-only. A signed-in user may explicitly consent to sync validated trip data and application settings to Cloudflare D1.

This is an approved **scope change** after the original no-account MVP cards. It does not retroactively weaken the local-only guarantees verified by US-05.

**Identity and ownership:**

- Clerk is the identity source of truth for sessions, email, login methods, and identity lifecycle.
- D1 application rows are keyed by the server-verified Clerk user ID.
- Every account read, write, export, and deletion derives the owner from the verified Clerk session. Never accept a client-supplied owner.
- Do not duplicate Clerk profile fields in D1 without a concrete application requirement.

**Consent and guest behavior:**

- Signup is optional; the calculator remains usable without an account.
- Guest trips never leave browser storage and have no server fallback.
- Signing in does not automatically upload existing local trips. Show a separate, explicit consent action before the first sync.
- Clerk signup and account-sync consent are separate actions: creating a session never uploads guest trips.

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
- Local storage, backups, and account snapshots use schema version 2. Version-one data is intentionally unsupported because no legacy-data commitment exists.
- D1 migration `0004_reset_account_trip_snapshots_v2.sql` clears pre-launch snapshots and recreates the constrained schema-two table without deleting Clerk accounts.
- Country metadata and full travel histories remain prohibited from analytics and logs.

## DEC-13 — Whole-site localization and reviewed-copy boundary

**Decision:** Support English, French, German, Spanish, Italian, Russian, Turkish, Hebrew, and Arabic across the public site and calculator. English uses the existing unprefixed routes; other languages use a locale prefix such as `/fr/app`. Hebrew and Arabic render right-to-left.

**Implementation constraints:**

- Locale selection lives in the URL and a non-sensitive preference cookie. It is never added to trip snapshots or analytics payloads.
- Locale switching preserves the current page, app anchor, and other safe URL context.
- Dates use locale-aware `Intl` formatting. ISO trip dates and engine inputs remain unchanged.
- Localized routes are included in canonical/alternate metadata, the sitemap, and the offline navigation allowlist.
- Fixed legal, safety, rule-explanation, and official-source labels are localized in every supported pack and remain deterministic; generated legal explanations remain forbidden.
- Hebrew and Arabic use semantic RTL document direction while ISO values, email addresses, and other inherently left-to-right data retain appropriate directionality.

## DEC-14 — One continuous calculator workspace

**Decision:** `/app` is one continuous, responsive workspace rather than a set of mutually exclusive tabs. The answer, combined Trips workspace, report, and account/data controls are addressable by stable URL hashes. Trips contains the canonical master timeline followed by saved-trip rows; selecting a row expands its adjuster in place, and one bottom “Add new trip” action opens the trip editor as a dialog.

**Implementation constraints:**

- A first-time user sees the previous-trip step before any safe verdict. They may either add history or explicitly confirm that no prior Schengen trips exist; that assumption persists locally.
- Desktop keeps the current answer visible beside the working surface. Mobile uses one reading column with a compact sticky jump control.
- The master timeline at the top of Trips is canonical. Editor and adjustment previews may show contextual timelines, but they never replace or mutate the saved result until the user saves.
- Every saved-trip row opens the same draggable/resizable adjuster directly beneath that row. Saving preserves the trip ID, status semantics, countries, and outside-Schengen breaks.
- The single “Add new trip” action at the bottom of Trips opens the trip editor as a modal dialog; the workspace has no second trip-entry surface.
- Future planning and saved-trip adjustment keep independent state so experimenting with one cannot silently alter the other.
- `#status`, `#trips`, `#report`, and `#account` restore on refresh and browser navigation. Retired `#timeline` and `#details` hashes canonicalize to `#trips`; old planner, proof, and returning-days `?section=` destinations also map to `#trips`.
- Returning-days, report, and account/data controls use accessible progressive disclosure so the primary workflow stays compact.

## Board state

The corresponding Hermes Kanban decision cards on board `schngn` were completed on 2026-07-09 with comments and structured metadata.
