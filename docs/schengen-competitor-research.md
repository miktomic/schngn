# Schengen visit tracker competitor research

## Executive summary

The market is crowded. A plain “90/180 calculator” is not differentiated enough.

The easiest product to start with is a **mobile-first web app / PWA** with a shared TypeScript calculation engine. It can ship fastest, be indexed by search, work on iPhone and Android browsers, and later become native iOS/Android through a wrapper or a dedicated mobile app using the same core rules engine.

Recommended v1 positioning:

> **A privacy-first Schengen trip planner that explains every answer, protects future trips, and produces a border-ready report.**

Do not compete only on “days remaining.” Compete on trust, explainability, and planning confidence.

## Official rule baseline

Authoritative references:

- European Commission short-stay calculator: https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en
- Official calculator UI: https://ec.europa.eu/assets/home/visa-calculator/calculator.htm?lang=en
- Swiss SEM explanation: https://www.sem.admin.ch/sem/en/home/themen/einreise/info-einreise/voraussetzungen-nach-staat/mit-visum/aufenthaltsrechner.html

Core requirements:

- Non-EU/third-country short-stay travelers can usually stay **maximum 90 days within any rolling 180-day period**.
- Count back 180 days from each day of stay.
- Entry day and exit day both count.
- Stays across Schengen countries are pooled.
- Long-stay visas and EU residence permits are not handled by the simple short-stay rule.
- The EU calculator has **check** and **planning** modes.
- Any app must clearly disclaim that it is a planning aid, not legal authorization.

## Competitor landscape

### Official EU calculator

Source: https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en

Strengths:

- Authoritative benchmark.
- Free.
- Supports check and planning modes.

Weaknesses:

- Dated UI.
- Manual data entry.
- Does not persist trip history.
- Weak mobile UX.
- No offline, reminders, reports, family profiles, or explanation UX beyond raw results.

Opportunity:

- Use it as the reference implementation to test against, but beat it on UX, storage, and explanation.

### Schengen Calculator 90/180 — Vitaliy Golubenko

Source: https://apps.apple.com/us/app/schengen-calculator-90-180/id1054807221

Observed data:

- iOS app, active since 2015.
- 4.5 rating, 171 US ratings in Apple data during research.
- Free with in-app subscription.
- Features: days used/remaining, latest stay date, calendar/timeline, future trip planning, iCloud sync, calculation breakdown.

Strengths:

- Long-lived and trusted by many users.
- Strong app-store keyword position.
- Clear core feature set.

Weaknesses / review signals:

- Users complain when they cannot edit trips easily.
- Some users distrust results because rolling-window answers are unintuitive.
- Data loss / payment-change confusion appeared in reviews.

Learning:

- Accuracy is not enough. Users need editable trips, transparent explanations, and confidence-preserving UX.

### Schengen Simple

Sources:

- https://schengensimple.com/
- https://apps.apple.com/us/app/schengen-simple/id1637045933
- https://play.google.com/store/apps/details?id=com.schengensimple.android&hl=en_US

Observed data:

- iOS and Android.
- 4.8 rating, 323 US App Store ratings in Apple data during research.
- Strong positioning around “looks forwards and backwards.”
- Features: allowance under every calendar date, passport-control mode, allowance analysis, multi-traveller support, support from real people.

Strengths:

- Best differentiated product story found.
- Solves the hard planner question: “What can I fit without breaking future fixed trips?”
- Strong explanation and trust positioning.

Weaknesses:

- Subscription / paid model may deter casual users.
- Web version appears not fully central yet.
- Larger app footprint.

Learning:

- Future-aware planning is the premium feature. We should not ship a naive future planner that only validates one proposed trip and ignores later committed trips.

### 180 Days: Schengen Calculator — Splinterware

Source: https://apps.apple.com/us/app/180-days-schengen-calculator/id1663779128

Observed data:

- iOS/iPad.
- 4.9 rating, 99 US ratings; UK page showed 809 ratings.
- Features: past/future trips, trip detail, overstay warnings, overlap warnings, local privacy, one-time purchase after trial.

Strengths:

- Simple, clear, privacy-first.
- Users like straightforward design.
- One-time purchase is liked relative to subscriptions.

Weaknesses:

- Some confusion about when/what payment is required.
- Narrower feature set.

Learning:

- “Simple and correct” has real demand. Be very transparent about pricing.

### Entorii

Sources:

- https://apps.apple.com/us/app/schengen-calculator-entorii/id1665211096
- https://entorii.com/blog/Best-Schengen-Calculator-Apps.html

Observed data:

- iOS/iPad/Mac and Android according to landing/blog copy.
- 4.0 rating, 4 US App Store ratings in Apple data during research.
- Features: trip simulation, timeline visualization, PDF border documents, sync, ETIAS messaging.

Strengths:

- Strong marketing copy.
- PDF border documents.
- Trip timeline.
- Cross-device Apple support.

Weaknesses / review signals:

- Several reviews cited inaccurate calculations before a rebuilt v9 engine.
- Limited rating count.

Learning:

- The calculation engine must be tested publicly and versioned. If users lose trust once, the app is toast with a nicer icon.

### QRALL Schengen Calculator

Sources:

- Google Play: https://play.google.com/store/apps/details?id=net.qrall.schengencalc&hl=en_US
- iOS: https://apps.apple.com/us/app/schengen-calculator/id1664095518

Observed data:

- Android: 4.6 rating, 600+ reviews, 10K+ downloads.
- iOS: 5.0 rating, 17 US ratings.
- Features: day-by-day calculation, calendar/list views, forward planner, 180-day report, multiple profiles, labels, include/exclude trips, cloud backup/sync in Pro, trip sharing.

Strengths:

- Strong Android footprint.
- Rich practical features.
- Reports and family/multiple-profile features.

Weaknesses:

- Google Play data safety says it may collect/share several data classes, which creates a privacy opening.
- Some review friction around labels / overlaps.

Learning:

- Multi-profile and trip sharing are useful, but can wait until after v1 unless family use is core.

### 90 Days Schengen — elgatovital

Source: https://play.google.com/store/apps/details?id=com.migrationcalc.schengen&hl=en_US

Observed data:

- Android.
- 3.0 rating, 684 reviews, 100K+ downloads.
- Features: future day accumulation, overstay re-entry date, ongoing-trip countdown, notifications, future control date, auto entry/exit dates, Google Drive backup, multiple profiles.

Strengths:

- High download count.
- Deep feature coverage.
- Strong edge-case concept: “permitted length of stay is not always the same as remaining days.”

Weaknesses:

- Low rating vs competitors.
- Users still get confused by remaining vs allowed days.
- UI likely dated/complex.

Learning:

- Explanation UX is a product feature, not help text at the bottom of a screen.

### Botolab Schengen Calculator for 90/180

Source: https://play.google.com/store/apps/details?id=net.botolab.schengen&hl=en_US

Observed data:

- Android.
- 1K+ downloads.
- Claims full offline use, no account, privacy-first, multiple profiles, DST/time-zone/overlap accuracy, accessibility color themes.

Strengths:

- Good privacy/offline positioning.
- Nice edge-case positioning around DST/time zones.
- Accessibility themes are a useful differentiator.

Weaknesses:

- Smaller footprint.
- Play data safety still lists some collected data types.

Learning:

- Edge-case accuracy and accessibility can help us stand out if proven with tests.

### Days Monitor

Sources:

- https://daysmonitor.com/schengen/
- https://apps.apple.com/us/app/days-monitor/id6741947104

Observed data:

- Broader global residency/tax/travel tracker, not Schengen-only.
- iOS app; not enough US ratings shown.
- Features: automatic location logging, Schengen tracking, custom residency rules, photo library GPS history reconstruction, widgets, iCloud sync, PDF/CSV reports.

Strengths:

- Ambitious automation and broad residency/tax use case.
- Photo-library reconstruction is clever.
- “No spreadsheets” positioning.

Weaknesses:

- Much larger scope.
- Automatic location tracking creates trust/privacy friction.
- More complex than needed for casual Schengen users.

Learning:

- Automation/photo import is a later premium feature, not first build.

### TrackingDays

Source: https://apps.apple.com/us/app/trackingdays/id657769643

Observed data:

- Broader residency tracker.
- Automatic travel tracking for all countries; Schengen 90/180 as one rule.
- Subscription model.

Strengths:

- Mature residency/tax framing.
- Automatic logging.

Weaknesses:

- Broad, expensive, and heavier than a focused Schengen tool.
- Review friction around reliability/subscriptions.

Learning:

- We should avoid starting with automatic background tracking. It is expensive to build and easy to break trust.

### Web calculators

Sources:

- Days Monitor calculator: https://daysmonitor.com/schengen/
- Visa Calculator: https://www.visa-calculator.com/
- Schengen90.app: https://www.schengen90.app/en
- TravelTally90: https://traveltally90.app/

Common features:

- Free calculator.
- Past trips, future trips/planner.
- Some save only in session/browser.
- Several use SEO pages around ETIAS/EES/rule explanation.
- Some offer reports, calendar reminders, shareable links, or no-login privacy claims.

Learning:

- Web is also crowded, but it is the fastest way to validate acquisition and UX.
- Search visibility matters; each feature should produce useful content pages and explainers, not just an app screen.

## Competitive gaps we can exploit

1. **Explainability as the core UX**
   - Every answer should have “why?”
   - Show the active 180-day window, counted days, ignored days, days falling off, and future commitments.
   - Users often think correct results are wrong because the rule is unintuitive.

2. **Future-aware planning**
   - Not just “is this future trip OK?”
   - Answer: “What is the longest trip I can take between fixed Trip A and Trip B?”
   - Show which planned trip causes the constraint.

3. **Official-parity test suite**
   - Build a visible test harness using official EU examples and additional edge cases.
   - Include inclusive date counting, overlapping/invalid trips, DST/time-zone neutrality, future commitments, and long stays excluded.
   - Publish “matches official calculator for these cases” without pretending to be official.

4. **Privacy-first local mode**
   - No account needed.
   - Data stays in browser/device by default.
   - Export/import JSON/CSV.
   - Optional sync later.

5. **Border-ready report**
   - PDF/shareable report showing trips, 180-day window, days used, and disclaimer.
   - Offline access.
   - This is anxiety-reducing and easy to understand.

6. **Family / group mode later**
   - Valuable for families, couples, immigration consultants.
   - Not necessary for first web MVP unless we want family as the wedge.

7. **Plain-language trust design**
   - Replace legal/calculator jargon with questions:
     - “Can I book this trip?”
     - “When must I leave?”
     - “When can I come back?”
     - “What changes would make this legal?”

## Recommended first platform

Start with **web/PWA**.

Why:

- Fastest to ship and iterate.
- No App Store / Play Store review.
- No native subscription/IAP complexity.
- Works on iPhone and Android immediately through browser/Add to Home Screen.
- SEO acquisition is possible.
- Easy to publish calculator/explainer pages.
- Shared TypeScript engine can later be reused in native apps.

Suggested technical shape:

- Monorepo.
- `packages/core`: pure TypeScript Schengen calculation engine and tests.
- `apps/web`: mobile-first PWA, likely Vite/React or Next.js.
- Local-first storage: IndexedDB/localStorage initially.
- Export/import: JSON and CSV.
- PDF generation for reports.
- Later: `apps/mobile` via Expo or Capacitor, depending how much native UI/background functionality we need.

## Recommended v1 scope

V1 should be narrow and excellent:

1. Add/edit/delete trips.
2. Dashboard: days used, days remaining, safe-until date, earliest re-entry/full-90 date.
3. Future trip simulation.
4. “Fit a trip between these fixed dates” planner.
5. Day-by-day calendar showing remaining allowance under each date.
6. Explanation view for each result.
7. Border-ready PDF/export.
8. Offline PWA with local-only data.
9. Official-parity test examples page / about page.

Out of v1:

- Accounts/sync.
- Payments.
- Automatic GPS tracking.
- Photo/passport-stamp OCR.
- Full global visa/tax residency engine.
- Legal advice workflows.

## Product wedge

Best initial wedge:

> “The Schengen calculator that shows its work — and protects trips you already planned.”

This is easier to trust than “AI-powered visa compliance” and less crowded than “free 90/180 calculator.” No need to add glitter to bureaucracy. It already has enough suffering.
