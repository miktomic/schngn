# SCHNGN Product Decisions

> Last updated: 2026-07-10
> Scope: original MVP validation plus the approved optional-account scope change for SCHNGN.

This file records product, privacy, infrastructure, and launch decisions that unblock the MVP Kanban board. It is intentionally concise: durable decisions, rationale, and implementation constraints. Not a graveyard for every passing thought with a hat.

## Decision summary

| ID | Decision | Status | Impacted cards |
|---|---|---|---|
| DEC-01 | Use Plausible Cloud for MVP analytics | Approved | US-15, US-13, US-14, US-16, US-20 |
| DEC-02 | Use one-time fake-door price buckets: €5/€9/€19 default, £5/£9/£19 for UK pages | Approved | US-13, US-14 |
| DEC-03 | Use Cloudflare D1 for MVP waitlist/email capture | Approved | US-18 |
| DEC-04 | Use fixed planning-aid/not-legal-advice disclaimer copy | Approved | US-10, US-11 |
| DEC-05 | Use official EC short-stay calculator, EES, and ETIAS references | Approved | US-10, US-12 |
| DEC-06 | Include public `/accuracy` validation page in MVP after US-01 is robust | Approved | US-12 |
| DEC-07 | No Sentry for MVP launch; use Cloudflare logs + smoke tests first | Approved | US-20 |
| DEC-08 | Redirect `www.schngn.com` to `https://schngn.com` | Approved | US-21 |
| DEC-09 | First ad/landing angle: UK second-home owners and frequent EU travelers post-Brexit | Approved | US-16 |
| DEC-10 | Optional Clerk accounts with consented, authenticated D1 trip sync | Approved scope change | US-22 |
| DEC-11 | Use the supplied cobalt SCHNGN wordmark and euro-star mark as the production identity | Approved | Production brand surfaces |

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
  - `waitlist_signup`
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

## DEC-03 — Email/waitlist provider

**Decision:** Use **Cloudflare D1** for MVP waitlist/email capture.

**Store only in the waitlist store:**

- email
- `created_at`
- consent flag/version
- source/context string
- optional price bucket or fake-door source

**Rationale:**

- SCHNGN already deploys on Cloudflare.
- D1 gives queryable rows and exportability.
- Cleaner than KV for real waitlist management.

**Implementation constraints:**

- Never store trip dates, travel history, or calculated results in the waitlist flow.
- Keep waitlist data separate from both guest storage and authenticated account storage.
- Consent/privacy copy must be visible at capture point.

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
- Waitlist consent and account-sync consent are separate purposes and separate records.

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

## Board state

The corresponding Hermes Kanban decision cards on board `schngn` were completed on 2026-07-09 with comments and structured metadata.
