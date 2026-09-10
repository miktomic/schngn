# Moving-window screen: data, semantics, and design directions

**Review scope:** the canonical `/app` status and timeline surface, the interactive `MovingWindowTimeline` component, and the synthetic `/explainer` example.

**Source of truth:** the current implementation in [`apps/web/src/lib/design/MovingWindowTimeline.svelte`](../../../apps/web/src/lib/design/MovingWindowTimeline.svelte), [`apps/web/src/lib/timeline/movingWindow.ts`](../../../apps/web/src/lib/timeline/movingWindow.ts), [`apps/web/src/lib/design/TimelineLedger.svelte`](../../../apps/web/src/lib/design/TimelineLedger.svelte), [`apps/web/src/lib/dashboard/dashboardState.ts`](../../../apps/web/src/lib/dashboard/dashboardState.ts), [`apps/web/src/lib/trips/tripCrud.ts`](../../../apps/web/src/lib/trips/tripCrud.ts), and `packages/engine`.

**Design exploration:** the ten directions below are the authoritative variants in `~/.gstack/projects/miktomic-schngn/designs/timeline-ten-directions-20260910/variants.json`. Their shared synthetic scenario is `~/.gstack/projects/miktomic-schngn/designs/timeline-ten-directions-20260910/scenario.json`, generated with seed `1276709372`. No second design seed or independently generated range table is part of this review.

## The screen’s job

The screen must answer three questions in sequence:

1. **What is my current or planned status?** The outer status surface says whether the selected plan fits, is close, or is over the ordinary 90/180 limit.
2. **Why did SCHNGN reach that answer?** The single chronological axis shows the trips, the inclusive rolling 180-day band, Today, and the counted-day total.
3. **What changes if I move the date or include a what-if?** The checking-date controls recompute a view in memory while preserving the saved answer and saved trips.

The visual anchor remains one shared chronological axis, a translucent 180-day band, square country flags where country metadata exists, and a large `used / 90` total below the axis. Text labels remain transparent so the axis can pass behind the typography without creating white badges. Details that need exact dates or per-trip arithmetic belong in the disclosure below the primary diagram.

## Complete app screen versus isolated explainer

These surfaces use the same production engine but have different responsibilities.

### The complete `/app` screen

The first calculator section is a continuous workspace. Its visible order is:

1. **Status section (`#status`)**
   - `StatusChip` with a localized target-trip status such as “Italy fits”, “Italy at limit”, or “Italy needs changes”.
   - Calculation scope and the saved/reference date.
   - Hero metric: safe buffer days or days over limit.
   - Fact cards for latest safe exit and aggregate days used.
   - “Why this answer” or “Needs attention” copy, followed by the action to take.
   - A quick-adjuster entry point when there is a target trip.
2. **Canonical timeline section (`#timeline`)**
   - Introductory copy explaining that the result is saved and that the timeline can be explored.
   - The interactive `TimelineLedger`, which delegates to `MovingWindowTimeline` for ordinary safe/risk/planner modes.
   - A collapsed returning-days forecast tied to the saved result, not to the date currently being explored.
   - The moving-window diagram, details disclosure, controls, and saved checkpoint.
3. **Trips section (`#trips`)**
   - The editable trip list and the explicit trip-adjustment flow.

The outer status answer is authoritative for the saved calculator state. Scrubbing the timeline does not update `dashboardState`, the hero verdict, stored trips, local storage, account sync, or the returning-days forecast. A redesign must keep this distinction visible.

### The isolated `/explainer` example

`MovingWindowExample.svelte` is a teaching surface. It supplies deterministic synthetic trips and starts at `today` with a 65-day what-if stay excluded. It uses the same interactive component and engine, but its purpose is to demonstrate cause and effect:

- baseline: two historical trips, `25 / 90` today;
- include the 65-day what-if at Today: `26 / 90`, because its entry day counts;
- move to the planned exit while the what-if remains included: `95 / 90` and over the limit;
- move to the planned exit with the what-if excluded: `30 / 90`.

The example can use `resultLabel="Planned exit"` and `initialDate={today}`. The canonical app omits `initialDate`, so its explorer initially uses the saved `referenceDate`. The explainer may teach the sequence more explicitly, but it must not imply that the synthetic trip is stored or that its result changes the app’s saved verdict.

## Data contract

The UI receives traveler data as `EditableTrip[]` and converts it to the engine’s country-free `SchengenStay[]`. Country flags, labels, status, and IDs are presentation metadata. They never alter the calculation.

### Saved input records

| Field | Type | Meaning on screen | Calculation effect and constraints |
|---|---|---|---|
| `id` | string | Stable key for a trip row/marker | Identity only. Used to preserve Svelte rows and never shown as a rule input. |
| `label` | optional string | User-facing trip name | Display only; at most 80 code points and single-line after validation. |
| `status` | `past \| booked \| what-if` | Visual/editor state | The moving-window chart highlights `what-if`; `past` and `booked` remain evidence bars. The engine ignores status. |
| `entryCountryCode` | optional ISO-like supported country code | Selects the locally bundled square entry flag | Presentation only. Missing code uses a neutral numbered marker or the what-if diamond. No network request occurs. |
| `exitCountryCode` | optional supported country code | Route/detail context elsewhere in the app | Not used by the moving-window math and not currently shown as a second flag on the primary marker. |
| `ongoing` | optional `true` | Marks an open-ended final stay as “Open-ended · projected” | The latest ongoing stay is projected to the checking date for calculation. Only one ongoing trip is allowed by trip validation. |
| `stays` | one or more `{ entryDate, exitDate }` ranges | Exact Schengen intervals and any visible breaks | Entry and exit are inclusive. Multiple stays represent time outside Schengen between them. Ranges are flattened before engine calculation. |

The trip editor also accepts `outsideBreaks`. It turns each break into a closed stay before and a new stay after the break. The complete trip can have at most 20 outside breaks and the browser can store at most 500 trips. Those are storage/editor limits, not changes to the 90/180 rule.

### Date roles

The date vocabulary must remain explicit in every design direction.

| Name | Source | Meaning | What changes when it changes |
|---|---|---|---|
| `today` | `currentLocalIsoDate()` in the browser’s local calendar | Orientation point for “now”; rendered as a fixed Today marker | The axis orientation and planning horizon use it. It is not automatically the saved result date. |
| `referenceDate` | `buildDashboardState`’s effective checkpoint | Saved/authoritative result date for the canonical calculator | The outer verdict, saved usage, target-trip answer, and saved checkpoint use it. In the app it is normally the earliest planned conflict, a target trip’s exit, or today when no trip supplies another date. |
| `initialDate` | Optional timeline prop | First date shown by the explorer | The explainer sets it to Today; the app omits it and therefore starts at `referenceDate`. It does not change data. |
| `checkingDate` | `selected \| initialDate \| referenceDate`, clamped to bounds | The date at the right edge of the inspected rolling window | The engine recomputes `windowStart`, aggregate usage, counted overlays, and the large total. It never changes `referenceDate` or saved trips. |
| `windowStart` | Engine result: `checkingDate - 179` calendar days | Left edge of the inclusive 180-day window | The band covers `windowStart` through `checkingDate`, both included. |
| `firstConflictDate` | `buildDashboardState` scan across planned/booked/what-if stays | Earliest date on which a planned checkpoint produces `overLimit` | It can become the saved `referenceDate` and target-trip focus. It is not the same as the latest safe exit. |
| `latestSafeExitDate` | Engine `latestSafeExitDate` for the selected target stay | Last exit date that remains safe for every day of the candidate stay | Shown in the outer fact card/action copy. It is a recommendation for the target stay, not the current checking date and not a new saved date. |
| planned exit | A user’s trip exit, or the explainer’s `referenceDate` at `today + 109` | The future checkpoint at which the whole plan is evaluated | In the synthetic example, it is 2026-12-28. It is a label/shortcut context, not a separate engine rule. |

Date labels are formatted for the selected locale using UTC midnight for stable ISO-date presentation. The source date used for “today” is the browser’s local calendar date, so a traveler crossing midnight may see Today change before a UTC-based service would.

### Outer status state

The outer status surface is built by `buildDashboardState(trips, undefined, tripFormToday)`. It is a separate data product from the moving-window explorer, even though both call the same engine.

| Field | Meaning on the complete app screen |
|---|---|
| `statusLabel` | Target-trip status such as “Trip fits”, “Trip at limit”, “Trip needs changes”, or “Add a trip”. |
| `statusTone` | `safe`, `close`, or `risk`; derived through the engine’s verdict classification and the seven-day close buffer. |
| `heroMetric` | `daysRemaining safe buffer` when within the limit, or `overBy days over limit` when unsafe. |
| `daysUsedLabel` | Aggregate engine usage formatted as `used / 90`. |
| `latestSafeExitLabel` / `latestSafeExitDate` | The target trip’s latest safe exit, or “No safe stay” / “Add dates” where no date is available. |
| `referenceDate` | Effective saved checkpoint used by the status and canonical timeline. The dashboard chooses the earliest planned conflict first, then a target trip’s exit, then Today. |
| `firstConflictDate` | Earliest planned/booked/what-if date at which the engine returns `overLimit`, or `null`. |
| `targetTrip` | Ongoing trip first, otherwise the latest planned/what-if trip, otherwise the latest saved trip. Used for status language and safe-exit calculation. |
| `whyCopy` | Human-readable summary of the counted days in the 180-day window at `referenceDate`. |
| `actionCopy` | Next action: review counted history, shorten/move the target, or compare its current exit with the latest safe exit. |
| `completed` | Whether the target trip is closed and ended before the current local date; changes the status language to completed. |
| `usage` / `windowLabel` | Full engine result and localized range used to explain the saved checkpoint. |

The `close` tone is a presentation classification, not a new legal threshold: the engine still owns `daysUsed`, `daysRemaining`, `overLimit`, and `overBy`. A redesign may change wording or visual treatment, but it must not derive a second answer from the tone.

### Derived engine result

`calculateUsageOnDate(toEngineTrips(trips, checkingDate), checkingDate)` returns:

| Field | Meaning | Display use |
|---|---|---|
| `referenceDate` | Normalized checking date | The date at the right edge of the inspected window. |
| `windowStart` / `windowEnd` | Inclusive window bounds; end equals the checking date | Range label and translucent band. |
| `daysUsed` | Size of the de-duplicated set of counted calendar days | Large numerator in `used / 90`. |
| `daysRemaining` | `max(90 - daysUsed, 0)` | Safe buffer for safe/close states. |
| `overLimit` | `daysUsed > 90` | Red window/count state and risk tone. |
| `overBy` | `max(daysUsed - 90, 0)` | Risk copy and over-limit explanation. |
| `countedDays` | Sorted ISO dates in the de-duplicated set | Evidence/accessibility source; risk highlighting in the static timeline. |

The denominator is the fixed ordinary Schengen allowance of 90 days. The window is always 180 inclusive days. There is no country-specific branch in the engine.

### Timeline model data

`buildMovingWindow` returns a model with:

- `usage`: the engine result for the current `checkingDate`;
- `window`: percentage `left` and `width` relative to the focused axis;
- `lanes`: one record per supplied trip, including `segments`, `countedSegments`, and a per-trip `counted` value.

`segments` are the full visible geometry of each stay, projected for an ongoing trip and clipped to the focused axis. `countedSegments` are the same trip’s days that fall inside the current 180-day window. The full bars stay fixed while the band and counted overlays move.

The component derives the visible marker from the first segment of each trip. Its center is used to place the square flag/neutral marker and its label. Closely spaced markers are raised into additional tiers with leader lines. A trip with several stays therefore has one primary marker plus several bar segments; the details disclosure is the authoritative place to read every stay range.

Per-trip `counted` values explain contribution but are not additive accounting. If two trips overlap, each lane can say that it contributes the overlapping days while aggregate `daysUsed` counts the physical calendar dates once.

## Calculation rules the screen must make legible

### Inclusive 180-day window

For checking date `D`, the engine evaluates `[D - 179 days, D]`. Both boundaries count. A stay from April 3 through April 17 is 15 days. If the checking date advances one day past the last counted date, the stay’s geometry does not move; one day leaves the aggregate set because it is now outside the rolling window.

### De-duplication

The engine inserts every in-window stay day into a `Set`. Overlapping or adjacent stays cannot inflate the aggregate count. Per-trip totals intentionally remain separate explanatory numbers, so a review must label them as “this trip’s days in window” and never sum them to claim the aggregate.

### Outside-Schengen gaps

Multiple `stays` within one journey mean the traveler left Schengen and re-entered. Only the explicit stay ranges count. A full calendar-day gap between an exit and the next entry is not silently filled. Country route labels do not substitute for explicit stays.

### Open-ended stays

An ongoing trip stores a projected exit so the editor can show a bounded record. At calculation time, the final stay is extended to the `checkingDate` when its entry is on or before that date. The moving-window bar extends through the visible forecast, but the counted overlay stops at the checking date. The UI must label this as a projection and must not present the projected future as a saved traveler-confirmed exit.

### Saved versus hypothetical

Saved trips are the `trips` prop and are shown in the canonical app. A `what-if` trip is still an in-memory `EditableTrip` for the purpose of the calculation, but its inclusion is explicit in the explainer and its visual treatment is amber. Date exploration and what-if inclusion do not write local storage, account data, analytics dates, or server payloads. The outer saved verdict remains separate from the hypothetical total.

## Fixed-date example using the current explainer data

The following values were obtained by invoking the existing `@schngn/engine` and `movingWindow.ts` functions with `today = 2026-09-10`. No parallel calculator or hand-written rule implementation was used.

### Input trips

| ID / visual role | Metadata | Stay | Inclusive total |
|---|---|---:|---:|
| `moving-earlier` / France | `status=past`, `entryCountryCode=FR` | 2026-04-03 → 2026-04-17 | 15 |
| `moving-recent` / Italy | `status=past`, `entryCountryCode=IT` | 2026-06-07 → 2026-06-16 | 10 |
| `moving-whatif` / What-if stay | `status=what-if`, no country code | 2026-09-10 → 2026-11-13 | 65 |
| `moving-planned` / Planned stay | `status=booked`, `entryCountryCode=ES` | 2026-11-29 → 2026-12-28 | 30 |

The focused axis is 2026-03-14 → 2026-12-28, 290 calendar days. The earlier trip, recent trip, what-if stay, and planned stay occupy approximately 6.9–12.1%, 29.3–32.8%, 62.1–84.5%, and 89.7–100% of that axis respectively. The 180-day band is 62.1% of the axis because the example includes a future planned exit while avoiding unused months beyond it.

### Checkpoints

| Scenario | Included stays | Checking date | Window | Aggregate | Per-trip counted values | State |
|---|---|---:|---:|---:|---|---|
| Baseline at Today | France + Italy | 2026-09-10 | 2026-03-15 → 2026-09-10 | 25 / 90 | France 15, Italy 10 | 65 safe buffer days |
| Include what-if at Today | France + Italy + first what-if day | 2026-09-10 | 2026-03-15 → 2026-09-10 | 26 / 90 | France 15, Italy 10, what-if 1 | 64 safe buffer days |
| Include what-if at planned exit | France + Italy + what-if + Spain | 2026-12-28 | 2026-07-02 → 2026-12-28 | 95 / 90 | France 0, Italy 0, what-if 65, Spain 30 | 5 days over limit |
| Exclude what-if at planned exit | France + Italy + Spain | 2026-12-28 | 2026-07-02 → 2026-12-28 | 30 / 90 | France 0, Italy 0, Spain 30 | 60 safe buffer days |

For the included what-if scenario, the first over-limit checkpoint is **2026-12-24**, when the engine returns 91 counted days and `overBy=1`. The planned exit on 2026-12-28 is therefore already four days into the risk state. This distinction matters: “first conflict” is the earliest unsafe checkpoint; “planned exit” is the traveler’s chosen endpoint; “latest safe exit” is the last safe endpoint returned for a specific target stay.

At the baseline Today checkpoint, the planned stay’s full bar is visible but its counted overlay is empty because it is in the future. At the planned exit checkpoint, the historical bars remain fixed on the axis but are outside the window and contribute zero. Their evidence remains visible so the traveler can understand why the window moved.

## Interaction inventory

| Interaction | Immediate result | Must remain true |
|---|---|---|
| Move keyboard/touch slider | Changes `checkingDate`, band position, overlays, count, and summary | Trips, outer verdict, `referenceDate`, saved checkpoint, and storage do not change. Slider is chronological left-to-right even in RTL. |
| Enter a date | Same as slider after native validity check | Date must stay between `bounds.minDate` and `bounds.endDate`; invalid input uses native validation feedback. |
| Today shortcut | Sets `selected=today` | Does not rewrite the saved result. Disabled when already at Today. |
| Result/checkpoint shortcut | Sets `selected=referenceDate` | In the explainer it can be labeled “Planned exit”; in the app it defaults to “Back to result”. |
| Include what-if checkbox | Adds/removes synthetic `what-if` record in memory | Must visibly identify the 65-day stay and never imply it is saved. |
| Open trip details | Reveals legend, exact stay ranges, and each trip’s in-window/total contribution | It is supplemental evidence; the main axis and count remain the first reading. |
| Open saved forecast | Reveals returning-days forecast from saved `referenceDate` | Forecast does not move with `checkingDate`. |
| Edit/adjust a trip in `/app` | Changes preview or committed trip through the existing editor flow | The moving-window view reflects committed trips only unless the established what-if/simulation surface says otherwise. |

## Ten design directions from the root artifact

Each direction below uses the same scenario, engine semantics, date roles, and privacy boundary. The authoritative metadata lives in `variants.json`; the values below are copied from that file so the review does not introduce a second seed or a second set of ranges. `spacing` is the prototype’s base spacing token and `weight` is its primary text weight. The colors and font stacks are exploration variables only; SCHNGN’s production brand, semantic colors, and accessibility requirements still govern any implementation.

| ID | Direction | School | Layout | Font | Background / ink / accent | Spacing | Weight |
|---|---|---|---|---|---|---:|---:|
| A | Evidence, in one view | Edward Tufte | `evidence` | Georgia, serif | `#fffefa` / `#202520` / `#315748` | 18px | 600 |
| B | The travel instrument | Dieter Rams | `instrument` | Arial Narrow / Arial | `#e8e9e5` / `#242923` / `#426446` | 22px | 650 |
| C | See the consequence | Bret Victor | `laboratory` | Trebuchet MS | `#f3f8f7` / `#153d40` / `#126b75` | 24px | 650 |
| D | A clear answer | GOV.UK Design System | `document` | Arial | `#ffffff` / `#0b0c0c` / `#164d8d` | 22px | 600 |
| E | Focus on your trip | Apple HIG | `focus` | system sans | `#f2f2f7` / `#20212b` / `#365bb5` | 18px | 700 |
| F | Inspect the evidence | IBM Carbon | `analysis` | IBM Plex Sans | `#f4f4f4` / `#161616` / `#0050a8` | 24px | 600 |
| G | An adaptive planner | Material Design 3 | `adaptive` | Roboto / Verdana | `#f7f5fb` / `#302639` / `#65507b` | 22px | 600 |
| H | Time, precisely arranged | Swiss grid / Müller-Brockmann | `grid` | Helvetica Neue | `#faf8f2` / `#15252f` / `#244d64` | 24px | 700 |
| I | Your journey ahead | Transport wayfinding / TfL | `journey` | Gill Sans | `#f7f9fc` / `#152645` / `#123e70` | 22px | 600 |
| J | Understand, then adjust | Nielsen Norman Group | `decision` | Verdana | `#f2f7f0` / `#233621` / `#315f36` | 18px | 600 |

### A — Evidence, in one view

The Tufte variant keeps an annotated timeline, exact count, and supporting evidence in one field of view. Its pitch is compact auditability; the tradeoff recorded by the artifact is that it is less immediate for a first-time traveler. It is the strongest candidate for an explanation/report mode. Keep the aggregate total visually distinct from per-trip rows and retain the reference-like single axis.

### B — The travel instrument

The Rams variant presents one restrained instrument: window, reading, and controls with a clear purpose. It is quiet and legible, but sparse labels need comprehension testing. Use this for a serious current-status mode; do not let its industrial restraint hide the checking date or saved checkpoint.

### C — See the consequence

The Victor variant compares the original plan with the extra stay while scrubbing the same date. It is the strongest cause-and-effect direction, but comparison consumes more space. The comparison must label both scenarios at the same checking date and keep “what-if” reversible and unsaved.

### D — A clear answer

The GOV.UK variant leads with a plain-language result, follows with a readable diagram, and places supporting evidence in a disclosure. It is intentionally low-polish and direct. It is a strong accessibility baseline and a useful test of whether the screen still works when visual styling is removed.

### E — Focus on your trip

The Apple HIG variant uses a focused mobile canvas, clear type hierarchy, and compact date control. Its tradeoff is that hidden detail needs explicit affordances. It can provide the calm default shell, provided the 180-day meaning, exact date range, and saved/hypothetical distinction remain nearby.

### F — Inspect the evidence

The Carbon variant links the inspected timeline and evidence table so that the selected date and supporting rows stay synchronized. It handles detailed planning well but is denser than the reference. This is a strong desktop/advisor direction and a poor candidate for putting the full evidence table above the fold on a 320px phone.

### G — An adaptive planner

The Material 3 variant uses a wide timeline with a contextual reading pane that stacks on a phone. Its adaptive structure is useful for desktop-to-mobile behavior, while rounded grouping can add visual bulk. Any implementation must preserve one chronological axis rather than turning the contextual pane into a competing second timeline.

### H — Time, precisely arranged

The Swiss grid variant aligns the day total, date span, timeline, and trip facts through a strict typographic grid. It has strong scanning rhythm, but large type must survive translation. This is useful for layout discipline and desktop precision; mobile marker tiers and disclosure are still required.

### I — Your journey ahead

The wayfinding/TfL variant connects Today to the planned exit as a destination-oriented journey line. It uses familiar travel language, but chronological distance must remain proportional. Avoid implying that the planned exit is safe merely because it is the next destination; the engine result and first-conflict date remain authoritative.

### J — Understand, then adjust

The Nielsen Norman Group variant separates scenario result, inspected date, and reversible what-if control into a clear sequence. It has strong orientation at the cost of more labels. This is a strong candidate for first-run education and error prevention, as long as the copy does not crowd the single-axis teaching diagram.

### Cross-variant recommendation

Use the root artifact as a structured comparison board rather than choosing a style by name alone. The highest-value combination for SCHNGN remains:

- **D/J** for plain language, date-role separation, and error prevention;
- **C** for reversible cause-and-effect exploration;
- **A/F** for exact evidence and report mode;
- **B/E** for the calm default status object;
- **H** for grid discipline across locales.

Any production synthesis must preserve the current reference composition: one shared axis, fixed trip bars, a moving translucent 180-day band, square local flags, transparent labels, and the large counted total below.

## Root prototype fidelity audit

The root prototype files were inspected read-only. The scenario data itself is semantically consistent with the current engine:

- `scenario.json` reports seed `1276709372`, Today `2026-09-10`, axis `2026-03-14` → `2026-12-28`, and first conflict `2026-12-24`.
- The **original plan** means France + Italy + Spain with the extra stay omitted. It is `25 / 90` at Today and `30 / 90` at the planned exit on December 28. The prototype checkpoint correctly keeps this saved baseline visible even when the extra stay is included in the exploration.
- The **current scenario** with the extra stay is `26 / 90` at Today, `90 / 90` on December 23 (the last safe date), `91 / 90` on December 24 (the first over-limit date), and `95 / 90` at the planned exit. The per-trip values at planned exit are `0, 0, 65, 30` because the historical stays have left the window.
- `data.js` is generated from `packages/engine` by `generate-data.ts`; the seed changes scenario metadata only. The frame values are not independently hand-calculated.

One intentional prototype behavior deserves a design decision: `study.js` initializes `day=109` and `include=true`, so the first rendered state is the extra-stay scenario at the planned exit (`95 / 90`). The prototype contains the baseline and Today controls, but it does not open with the baseline-before-consequence sequence used by the production Explainer. If baseline comprehension is a release requirement, initialize the study to `day=0, include=false` or add a clearly labeled “Original plan” opening state.

The evidence table is correct but its data shape needs careful interpretation: each frame’s `counts` array always carries a per-trip diagnostic value for all four trips, including the what-if entry even when the what-if is excluded from aggregate usage. `study.js` filters that row from the visible evidence table when `include=false`, and the footnote correctly states that the aggregate total counts unique dates. Any new renderer must preserve that distinction rather than summing `counts`.

The prototype’s top verdict is scenario-level and pinned to the planned exit, while the reading/chart are checking-date-level and follow the slider. This is valid only because the artifact labels them separately (“Scenario result”, “Counted on”, and “Original plan”). A redesign must retain those labels; otherwise a user could mistake the current reading for the saved planned-exit verdict.

## Acceptance criteria for any selected direction

### Data and calculation

- The rendered count is `calculateUsageOnDate`’s `daysUsed`; no second rule implementation is introduced.
- The 180-day band includes both `windowStart` and `checkingDate`.
- Entry and exit dates both count.
- Overlapping and adjacent stays are de-duplicated in aggregate usage.
- Per-trip contribution values are labeled as explanatory and are never presented as an additive substitute for aggregate usage.
- Outside-Schengen gaps remain gaps; every explicit stay is represented in detail view.
- Open-ended stays are visibly projected and counted through the checking date only.
- `firstConflictDate`, `planned exit`, `latestSafeExitDate`, `today`, and `checkingDate` have separate labels and semantics.

### Comprehension and visual fidelity

- At 320px wide, a traveler can identify the status, checking date, 180-day band, major trip markers, and `used / 90` count without horizontal scrolling.
- The default composition uses one shared chronological axis. Stacked lanes may appear only in a deliberate details/report mode.
- A baseline state can be read before a what-if consequence. The 65-day synthetic stay is excluded by default in the explainer.
- Trip markers use square 32px-or-larger local SVG flags when country metadata exists. Neutral markers remain available without metadata.
- Text labels have transparent backgrounds. No white rectangle is placed behind Today, duration, trip name, or date text.
- The count is visually below the axis in the reference-like teaching composition; the outer app may retain the hero answer above the timeline.
- Risk state is communicated by text and structure as well as color. The axis band and count agree on the same checking date.

### Interaction and accessibility

- The slider and native date input have keyboard access, a 44px interaction target, visible focus, and a localized date value.
- `aria-live` announces the changed aggregate count without echoing trip dates into analytics or network payloads.
- RTL copy flows naturally, while the chart remains chronological left-to-right and its controls preserve the same date order.
- Details and saved-forecast disclosures have descriptive summaries and do not obscure the saved checkpoint.
- Country flags use empty alt text when the adjacent trip name already identifies the record; the trip’s accessible text still exposes the name, dates, counted contribution, and status.
- The axis does not rely on hover-only tooltips for essential data.

### Privacy and product boundaries

- Date exploration and what-if inclusion do not mutate trips or the dashboard verdict.
- Guest trip dates stay in browser memory/storage and do not enter analytics, logs, or anonymous endpoints.
- Flag assets are bundled locally; selecting a country or moving the date makes no network request.
- Account sync remains an explicit authenticated action. No design variant should imply automatic upload.
- The planning-aid/not-legal-advice copy remains available on the full app screen and in explanation/report surfaces.

### Verification

- Existing engine and moving-window unit tests remain green, including inclusive-boundary removal, fixed geometry, overlap de-duplication, outside gaps, ongoing projections, and focused bounds.
- Browser checks cover baseline → what-if → planned exit, unchanged stored trips and outer verdict, 17 locales, 320px, reduced motion, RTL, keyboard control, and no exploration requests.
- Visual review includes mobile baseline, mobile risk, desktop, and Arabic/RTL captures.
- The chosen direction is documented with the exact source data, checkpoint outputs, and any deliberate changes to the current component contract before implementation.
