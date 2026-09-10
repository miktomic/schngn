# Moving-window integration review

Verified 2026-09-10. All screenshots and browser inputs use synthetic trips. Earlier captures and automated tests use a fixed 2026-09-09 clock; the single-axis captures use 2026-09-10.

## Alternative expert reviews and ten design studies — 2026-09-10

Independent report-only design-review and qa-only passes found two urgent issues: invalid checking-date text can disagree with the active answer, and dense/overlapping markers become ambiguous. The detailed reviews and full data specification are linked below.

- [Review synthesis](alternative-review-summary.md)
- [Independent design review](alternative-design-review.md)
- [Independent usability review](alternative-usability-review.md)
- [Full screen data specification](screen-data-specification.md)

Ten working design studies, a comparison board, and mobile/desktop screenshots are stored at ~/.gstack/projects/miktomic-schngn/designs/timeline-ten-directions-20260910/. They share real engine frames and random seed 1276709372. The shortlist is H (risk hierarchy), C (scenario comparison), B (instrument clarity), with A as an evidence-oriented alternative. None is an approved production replacement. Ten prototype interaction/layout checks passed; the current full repository gate passed 448 tests with zero Svelte errors/warnings.

## Square flags and transparent labels — 2026-09-10

Replaced platform emoji flags with locally bundled 32×32 SVG assets for all 29 supported country codes. Removed paper backgrounds from Today, durations, trip names, and expanded trip details. Assets come from MIT-licensed flag-icons 7.5.0 and are all bundled inline, avoiding country-specific network requests.

Verified loaded square images and transparent text backgrounds in the browser, plus mobile safe/risk, desktop, and Arabic screenshots with no runtime errors. `bun run check` passed 444 tests, all builds and smoke checks, and zero Svelte errors/warnings.

Updated previews: [mobile](square-flags-390.png), [over-limit](square-flags-risk-390.png), [desktop](square-flags-1280.png), [Arabic](square-flags-ar-390.png).

## Single-axis redesign — 2026-09-10

The user's reference calls for one shared timeline rather than a stacked trip ledger. The calculator and interactive example now render fixed stay bars on one arrowed axis, country flags where available, a Today marker, a translucent moving 180-day rectangle, and the large counted-days total below. The window and count turn red together when the engine reports an overage. Neutral numbered markers identify trips without country metadata; the what-if uses a diamond. Closely spaced annotations move into additional vertical space with leader lines while every stay remains on the shared axis.

Detailed date ranges, per-trip counts, and the legend now live in a closed disclosure. Date input, keyboard slider, Today/result shortcuts, saved checkpoint, and engine-backed calculations remain available. The synthetic second historical trip is spaced farther from the first so the basic teaching example stays readable; all four checkpoints remain 25, 26, 95, and 30 counted days.

Current screenshots: [mobile baseline](single-axis-390.png), [mobile over-limit](single-axis-risk-390.png), [desktop](single-axis-1280.png), [Arabic mobile](single-axis-ar-390.png). Visual inspection found no browser runtime errors. Automated coverage asserts a single axis, the count below the chart, disclosure state, all 17 locales at 320px, keyboard exploration, and unchanged guest storage/main verdict.

Final gate: `bun run check` passed all 444 tests, Svelte reported zero errors and zero warnings, and all builds and compiled/HTTP smoke checks passed. `git diff --check` passed. No deployment or commit was performed.

The initial full browser run passed 39/40: an existing trip-dialog opening test timed out. The rerun passed all 40 tests in 44.4 seconds after the build completed. The mechanical Impeccable detector flags the timeline arrow's 3px right border as a side-tab; visual inspection confirms this is an arrowhead, not an accented card.

## Refinement after the Impeccable critique — 2026-09-10

All four prioritized findings from the independent critique were addressed:

- **Readable travel evidence:** the sample axis now covers 290 days instead of roughly 520. Trip tracks use the full available width, short stays have explicit entry dots, and date ranges remain visible. Older records remain in the evidence list; marks are clipped to the focused axis without changing the engine count.
- **Baseline before consequence:** the Explainer starts at today with the 65-day what-if stay excluded (25/90). Including it produces 26/90 today; the Planned exit shortcut shows 95/90. Excluding it at that exit gives 30/90. A fixed Today line and Today shortcut provide orientation throughout.
- **Explicit mark meanings:** counted, outside-window, what-if and entry-marker labels accompany the diagram. Each closed stay states how many of its days are counted in this window, replacing unexplained ratios. Controls and evidence labels cover all 17 locales.
- **Separated date contexts:** the repeated exploration heading became an action-oriented slider label. The date-specific evidence is grouped above the controls. The saved checkpoint stays visible, and its returning-day forecast is a separately labeled disclosure. Native date input and keyboard focus remain intact; invalid dates use native validation feedback.

Final verification: `bun run check` passed with **439 tests**, zero failures, zero Svelte errors/warnings, all builds, and the compiled agent smoke. `CI=1 bun run test:e2e` passed **all 40 browser tests in 39.2 seconds**. The browser suite covers the new baseline/add-what-if/planned-exit sequence, unchanged stored trips and main verdict, all 17 locales at 320px, RTL, keyboard operation, and the saved forecast disclosure. The Impeccable detector returned no findings for either revised visualization component; this is mechanical evidence, not a replacement for visual judgment.

Live browser inspection covered English mobile/desktop, Arabic mobile, baseline and risk states, and the calculator. There were no page runtime errors or network requests during date exploration. Screenshots were captured after hydration with a fixed synthetic date. The slider has 6px separation from adjacent labels so its focus ring remains clear. Browser contexts were closed and the temporary dev server stopped; the full browser suite used its own managed fresh server.

Current screenshots:

- [Baseline, mobile](refined-en-390.png)
- [What-if consequence, mobile](refined-risk-390.png)
- [Baseline, desktop](refined-en-1280.png)
- [Arabic, mobile](refined-ar-390.png)
- [Calculator with saved forecast disclosure](refined-calculator-390.png)

The refinement changes the existing moving-window components, localized controls, geometry helper, focused tests, and current architecture/product/agent documentation. No engine behavior, server endpoint, storage flow, or reviewed rule copy changed. It remains local and uncommitted. No new independent design score is claimed; the original critique remains an immutable record.

## Initial integration evidence (retained)

## Result

The canonical calculator now exposes a native date input and keyboard/touch range slider over fixed trip bars. The inclusive 180-day band moves independently of those bars, and per-trip counted/total days explain the aggregate. Over-limit windows have a red tint plus a textual count. The saved-result checkpoint stays visible, reset returns to it, and the main dashboard verdict remains unchanged during exploration. The existing days-returning forecast remains tied to the saved result.

The Explainer adds a synthetic multi-trip example using the same interactive branch of `TimelineLedger`. Including the 65-day what-if stay causes 95 counted days at the later planned stay's exit; excluding it produces 30. The existing reviewed scroll walkthrough and compact editor previews remain intact.

Open-ended stays are labeled as projections and counted through the checking date. Overlapping trips are deduplicated by the engine, while full outside-Schengen days remain excluded. No alternate calculation engine, persistence, analytics event, or network endpoint was added.

## Changed files

- `apps/web/src/lib/design/MovingWindowTimeline.svelte`: shared interaction, date-scoped evidence, fixed checkpoint, native controls, and accessible trip date alternatives.
- `apps/web/src/lib/timeline/movingWindow.ts`: fixed-axis geometry and engine-backed counts, including ongoing-stay projections.
- `apps/web/src/lib/i18n/movingWindowUi.ts`: product controls for all 17 locales.
- `apps/web/src/lib/design/MovingWindowExample.svelte`: synthetic what-if example.
- `apps/web/src/lib/design/TimelineLedger.svelte`: optional interactive branch, preserving existing static uses and returning-day forecast.
- `apps/web/src/routes/app/+page.svelte` and `apps/web/src/routes/explainer/+page.svelte`: integration.
- `apps/web/tests/moving-window.test.ts`, `apps/web/e2e/moving-window.e2e.ts`, and `apps/web/e2e/app-smoke.e2e.ts`: boundary, overlap, projection, privacy, localization and UI-contract coverage.
- `CLAUDE.md`, `docs/architecture.md`, and `docs/product-decisions.md`: current behavior and implementation boundaries. `AGENTS.md` remains a symlink.

## Validation

- Focused model tests: 4 passed, including inclusive day removal, fixed geometry, overlap/outside-day handling, ongoing projections, and date bounds.
- `bun run check`: 437 tests passed, no failures; Svelte check reported zero errors and zero warnings; all builds and compiled CLI/MCP smoke passed.
- `CI=1 bun run test:e2e`: all 40 tests passed in 46.6 seconds on the final implementation, including PWA/offline, account reconciliation, trip adjustment, outside-Schengen breaks and the new interaction.
- New browser coverage checks all 17 locales at 320px with reduced motion, including RTL keyboard direction. The calculator test confirms the main verdict and stored trip snapshot remain unchanged by date exploration.
- Visual inspection at 390px and 1280px, including Arabic. Corrected RTL ratio direction and aligned the axis with the trip rails.
- Browser request inspection after the app finished loading: no requests during date input changes and slider navigation. No page runtime errors in the visual pass.
- `git diff --check`: passed.

The first full browser run had two assertions targeting the retired static image role. Updated them to inspect the interactive result without weakening their expected day counts; the final full suite passed.

## Screenshots

- [Calculator, mobile](calculator-390.png)
- [Explainer, mobile](explainer-390.png)
- [Explainer, desktop](explainer-1280.png)
- [Explainer, Arabic](explainer-ar-390.png)

Browser contexts containing synthetic data were closed, and the temporary development server was stopped. The original study remains in `sketches/rolling-window-study/`. Unrelated pre-existing `.codex/config.toml` and `docs/research/` files were not changed. Implementation is local; no commit, push or deployment was performed. Translated product controls have automated layout coverage but have not received independent native-speaker review.

## Release validation — 2026-09-10

MW-001 is fixed: invalid or empty checking dates restore the date used by the calculation and announce the browser's localized validation message. Valid date, slider, and shortcut changes clear that message. The full release gate passed 448 unit tests and 41 browser tests, including out-of-range and empty date regression coverage. The remaining marker-density and design-study findings remain documented design follow-ups; no alternative prototype was promoted to production in this release.
