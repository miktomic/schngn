# SCHNGN Product Decisions

> Last updated: 2026-07-09
> Scope: MVP validation for SCHNGN — privacy-first Schengen 90/180-day PWA.

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

**Store only:**

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

- Never store trip dates, travel history, or calculated results server-side.
- Keep waitlist data separate from local trip storage.
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
- “Validated against” is allowed only after the EC-parity suite exists.

## DEC-06 — Public validation page

**Decision:** Include a public `/accuracy` validation page in MVP after US-01 is robust.

**Content direction:**

- Curated public test cases from the EC-parity suite.
- Clear method and limitations.
- Link to official EC calculator.
- Use careful language: “validated against,” not “certified,” “approved,” or “guaranteed.”

**Implementation constraint:** Do not publish the trust claim before US-01 has the robust fixture suite.

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

## Board state

The corresponding Hermes Kanban decision cards on board `schngn` were completed on 2026-07-09 with comments and structured metadata.
