# Moving-window design study

Adaptation of the six user-supplied mobile references. Proposed first destination: the existing Explainer, followed by an optional date scrubber in the calculator's shared timeline.

The study keeps trips fixed on a proportional time axis and moves an inclusive 180-day band. Separate lanes keep trip labels readable on mobile. Each lane reports counted days versus the trip's full duration. A date-specific count and a whole-plan result remain separate. The what-if switch reveals its effect on the later Spain stay.

All 264 date/state frames are precomputed by the production engine against synthetic dates. The browser only selects frames; it contains no alternative calculation engine. Regenerate with `bun sketches/rolling-window-study/generate.ts`.

## Verification

- Generation assertions passed: 25 days before the new stay, 95 at Spain exit with the what-if stay, 30 without it.
- Playwright checked the 91-day first-over boundary, 95-day exit, and 30-day toggle at 360px and 736px; no page runtime errors.
- Mobile screenshot inspected for readable labels and controls.
- `bun run check` passed, including compiled agent smoke.

## Integration considerations

This is an interaction study, not an integrated production feature. Reuse or extend `TimelineLedger.svelte` so the Explainer and calculator retain one visual model. Use existing reviewed explanatory copy, all supported locales, accessible date controls, and the app's semantic tokens. The reference's competitor claims and schematic counts are not copied. A date-specific count must not replace checking the complete plan. Keep current-day and checking-date labels distinct. No autoplay is necessary; direct scrubbing provides the motion.

Files: `template.html` is the inline source; `generate.ts` injects engine results into `moving-window.html`; `preview.html` and screenshots record browser inspection. No application route or data flow changed.
