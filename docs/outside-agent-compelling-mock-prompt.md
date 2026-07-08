You are designing a compelling money-shot mock for SCHNGN, a privacy-first mobile web/PWA for Schengen 90/180-day tracking and trip planning.

Your task: create one high-quality, mobile-first mockup of the core SCHNGN screen. It may be a standalone HTML/CSS prototype, Figma-style mock, Pencil design, or another visual artifact, but it must be specific enough to judge. Do not produce a generic travel dashboard.

## Product context

SCHNGN helps travelers understand whether their Schengen travel plans comply with the 90 days in any rolling 180-day period rule. The problem is not only arithmetic. Users are anxious because the rule is confusing, high-stakes, and future trips can break unexpectedly.

The key screen must answer in under five seconds:

> Am I safe for my planned Schengen trips, and if not, exactly what must change?

Target users include frequent travelers, second-home owners, remote workers, business travelers, families planning holidays, and people who need a border-ready explanation of their calculation.

SCHNGN v1 is privacy-first:

- Mobile-first web/PWA.
- No account required.
- Local/offline browser/device storage.
- JSON/CSV import/export.
- Border-ready PDF/report later.
- No GPS, no passport scan, no cloud sync by default.
- Not legal advice.

## Core scenario to show

Use this exact scenario in the mock:

- User is planning an Italy trip.
- Past trip: France, May 1–15, 15 days.
- Committed trip: Greece, Aug 3–18, 16 days, already booked/protected.
- What-if trip: Italy, Oct 1–13, 13 days.
- Result: Italy fits.
- At Italy exit, rolling-window usage is 75 / 90.
- Hero metric: 15 safe buffer days.
- Must-exit-by date: Oct 13.
- Include a way to understand that entry and exit days both count.
- Include a risk-state idea: if Italy is extended by 9 days, the plan becomes unsafe at 94 / 90, 4 days over limit.

## Required content

The first screen/fold should include:

1. Brand: SCHNGN.
2. Privacy/local mode signal: “Local & private” or equivalent.
3. Main status: “Italy fits” / “Safe for Italy” / similarly clear.
4. Hero metric: “15 safe buffer days”.
5. Must-exit-by date: “Must exit by Oct 13”.
6. Capacity/progress: “75 / 90 days used”.
7. Rolling 180-day visualization: do not use only a circular gauge. The user needs to see that the window slides over time.
8. Trip segments: France past, Greece committed/booked, Italy what-if.
9. Explanation affordance: “Why am I safe?” / “Show calculation” / similar.
10. Export/report affordance: “Border-ready report” or similar.

## Design principles

- Answer first, math second.
- One dominant status and one dominant metric.
- Show why, but do not overwhelm the top of the screen.
- Risk state must be as designed as safe state.
- Use plain language: safe buffer days, must exit by, committed/booked, what-if.
- Avoid “draft”, “locked”, “payload”, “compliance object”, or technical terms.
- Use high contrast and accessible text sizes.
- Touch targets must be at least 44px.
- No horizontal scroll on mobile.
- Do not rely on color alone; pair color with text/icons/labels.
- Avoid decorative travel clichés unless they carry meaning. No airport clipart confetti.

## Designer lenses to synthesize

You may choose one lens or blend them deliberately:

### Jony Ive / Apple — Calm Permission Object
A calm, passport-like object gives the answer. Beautiful, sparse, low anxiety. Details appear when requested. Good for default consumer home.

### Edward Tufte — Evidence-Rich Travel Ledger
A compact annotated timeline proves the calculation. High data-ink ratio, meaningful labels, thin rules, visible days returning. Good for explanation/report mode.

### Bret Victor — Explorable Schengen Simulator
Trips are manipulable objects on a timeline. The 180-day window is a movable lens. Dragging or extending a trip instantly updates the answer. Good for planner mode and differentiation.

### Dieter Rams — Compliance Appliance
Serious, functional, obvious. Grid alignment, strong labels, no decorative metaphors. Good for current status and legal/pro context.

### Public-service trust instrument
Accessible, official-feeling, high-contrast navy/blue, semantic green/red/amber, bullet chart for 75/90, explicit proof ledger. Good production foundation.

## What to avoid

- A generic dashboard with cards and charts but no emotional answer.
- A circular gauge as the main explanation; the rule is a rolling window, not a fixed tank.
- Tiny calendar text that cannot be read on a phone.
- Burying the actual answer below controls.
- Making the safe state polished but the unsafe state an afterthought.
- Looking like a fintech portfolio app or a cybersecurity console.

## Deliverable

Produce a polished mobile-first mock of the money-shot screen at approximately 390px wide. If making HTML, use a single self-contained file with inline CSS and realistic static data. Include at least one visible safe state and one described or toggleable risk state.

The mock should make a user say: “I understand whether I can take this trip, and I trust why.”
