Create a full mobile-first SCHNGN MVP screen board using the locked Tufte evidence-ledger design system and EU-stars-inspired Schengen constellation logo.

Use the existing identity board as the source of truth: paper background, ink text, Source Sans 3, IBM Plex Mono for dates/ratios/proof, Star Gold only in the logo, green=safe/local, blue=booked, amber=what-if, red=risk. No purple. No circular gauge. No travel clipart. No official EU flag or exact EU institutional emblem. No legal-advice tone.

Create one coherent board of app screens at 390px mobile width, with shared components and consistent spacing:

1. Onboarding / empty calculator: SCHNGN mark, local & private promise, add first trip CTA, import JSON, short 90/180 explanation, not legal advice.
2. Safe dashboard: Italy fits, 15 safe buffer days, must exit by Oct 13, 75 / 90 days used, rolling 180-day window, trips counted, why safe.
3. Risk dashboard: Action required, 4 days over limit, first fix suggestion, which trip/date causes it, same rolling-window proof.
4. Add/edit trip form: country, entry date, exit date, booked vs what-if toggle, Schengen/non-Schengen treatment, inline validation, entry and exit days both count.
5. Trips list / CRUD: past, booked future, what-if plans, edit/delete affordances, local-only storage reminder.
6. Planner simulator safe and unsafe states: trip objects on timeline, rolling 180-day lens, live result, first unsafe day explanation.
7. Calculation proof ledger: active 180-day window, counted days by trip, days returning soon, inclusive counting note.
8. Days coming back visualization: upcoming returned days and calendar/timeline hybrid.
9. Border-ready report preview: calculation summary, trip ledger, disclaimer, export/download CTA, fake-door unlock state.
10. Privacy/import/export settings: export JSON, import JSON, clear local data, offline/private explanation, analytics privacy note.
11. Waitlist/email intent: email-only capture, explicit no trip data in payload, success and error states.

Use product language: "Booked, counted" not "protected". The answer must dominate. Proof is one gesture away. Risk states should be designed, specific, and fixable, not panicky. Make the board implementation-ready: label reusable components and state tokens where helpful.