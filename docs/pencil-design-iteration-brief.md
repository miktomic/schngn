# SCHNGN design iteration brief

## Objective

Create the next round of SCHNGN money-shot mockups. SCHNGN is a privacy-first mobile web/PWA for Schengen 90/180-day tracking and trip planning. The key screen must answer, in under five seconds:

> Am I safe for my planned Schengen trips, and if not, exactly what must change?

The mock should not feel like a generic calculator. It should feel like a trustworthy travel compliance instrument for anxious travelers, second-home owners, frequent business travelers, and family planners.

## Core scenario for all mocks

Use the same realistic scenario so variants are comparable:

- User is planning an Italy trip.
- Past trip: France, May 1–15, 15 days.
- Committed trip: Greece, Aug 3–18, 16 days, already booked/protected.
- What-if trip: Italy, Oct 1–13, 13 days.
- Result: Italy fits.
- Current rolling-window usage at Italy exit: 75 / 90.
- Hero metric: 15 safe buffer days.
- Must-exit-by date: Oct 13.
- If user extends Italy by 9 days, state becomes unsafe: 94 / 90 and 4 days over limit.

Use inclusive day counting language: entry and exit days both count.

## Shared product principles

1. Answer first, math second.
2. One dominant status and one dominant metric.
3. Show the rolling 180-day window; do not use a circular gauge as the primary explanation.
4. Protect future commitments; planned trips can be committed/booked.
5. Explain why in plain language.
6. Privacy is a design feature: local/offline/private mode, exportable border-ready report.
7. Risk state must be as designed as the safe state.
8. Mobile-first: design for 390px wide phone first.
9. Accessibility: 44px+ touch targets, no hover-only interactions, visible focus, high contrast, no red/green-only meaning.

## Existing designer directions

### 1. Jony Ive / Apple — Calm Permission Object

Theory: reduce anxiety by turning the answer into one calm, beautiful, passport-like object. Hide calculation detail until the user asks.

Best for: consumer default home screen.

Risk: too much beautiful silence can make trust-sensitive users suspicious.

Iteration target: make the object calm but add enough receipts: a visible “why this is safe” affordance and a minimal rolling-window trace.

### 2. Edward Tufte — Evidence-Rich Travel Ledger

Theory: trust comes from seeing the evidence. Use a compact, truthful annotated timeline showing trips, active 180-day window, days used, and days returning.

Best for: explanation mode, reports, advisors, power users.

Risk: can overwhelm normal users.

Iteration target: keep dense evidence but preserve a clear top answer; do not bury the status inside a spreadsheet.

### 3. Bret Victor — Explorable Schengen Simulator

Theory: the user understands by manipulating the plan. Trips are objects on a timeline and the rolling 180-day window is a movable lens.

Best for: planner mode and flagship differentiation.

Risk: interaction complexity on mobile.

Iteration target: create a touch-friendly simulator layout: drag handles, live status update, clear first unsafe day explanation.

### 4. Dieter Rams — Compliance Appliance

Theory: this is a serious tool for avoiding legal/admin trouble. It should be honest, obvious, functional, and quiet.

Best for: current-status mode, older users, legal/pro context.

Risk: can feel cold.

Iteration target: make it feel serious but not punitive; use plain labels, strong alignment, minimal decoration.

### 5. UI UX Pro Max — Trust Instrument

Theory: combine public-service trust, accessibility, bullet KPI, rolling 180-day visual, and explicit proof ledger.

Best for: practical production base.

Risk: can become generic institutional dashboard.

Iteration target: keep the accessible structure but add emotional calm and consumer warmth.

### 6. Pencil — Independent visual designer pass

Theory: let Pencil/Codex reinterpret the product from the brief without over-constraining it.

Best for: discovering unexpected visual composition and hierarchy.

Risk: AI design drift, decorative widgets, weak rule explanation.

Iteration target: one polished, compelling mobile money-shot screen that a human could immediately react to.

## Evaluation rubric

Score each variant on:

- Answer speed: can a user tell safe/unsafe in under 5 seconds?
- Trust: does the screen show why without drowning the user?
- Anxiety reduction: does it feel calm and decisive?
- Rule clarity: does the rolling 180-day logic make sense?
- Mobile feasibility: no tiny controls, no horizontal scroll, no hidden critical content.
- Differentiation: does this feel meaningfully better than generic calculators?
- Willingness to pay: does it look valuable enough for export/report/pro planning features?

## Production recommendation to test

Likely winning blend:

- Home: Ive calm permission object.
- Planner: Victor explorable simulator.
- Explanation/report: Tufte evidence ledger.
- Current-status/admin-safe mode: Rams compliance appliance.
- Production accessibility/design-system floor: UI UX Pro Max trust instrument.
