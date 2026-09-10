# Alternative usability review: moving-window calculator

**Status:** DONE_WITH_CONCERNS\
**Date:** 2026-09-10\
**Scope:** `/app#timeline` central calculator and `/explainer` moving-window example\
**Method:** report-only browser QA using an isolated Playwright 1.61.1 context against the existing `http://localhost:5173` dev server. No production source, build, or server process was changed.

## What the screen is communicating

The central screen combines two related readings:

1. **The saved-plan decision.** The result panel names the current plan or trip, the inspected/result date, safe buffer or over-limit days, latest safe exit, and the short explanation that supports the answer.
2. **The moving 180-day inspection.** The timeline fixes the trips on one chronological axis and moves the inclusive 180-day window. The band shows the inspected window; trip markers and bars show travel history and planned/open-ended stays; the large `used / 90` total is the answer for the selected checking date.
3. **The inspection controls.** The slider and date field change the checking date. `Today` returns to the local current date, while `Back to result` restores the saved-result checkpoint. The saved result row and forecast disclosure preserve the original calculation while the user explores.
4. **The trip ledger.** Cards below the visualization provide trip names, total stay duration, border context when provided, date ranges, status, mini bars, edit, and delete actions.
5. **The explainer state.** The synthetic example teaches the same model with two historical stays, an optional 65-day what-if stay, and a 30-day planned stay. Verified checkpoints are `25 / 90` baseline, `26 / 90` with the what-if stay, `95 / 90` at planned exit, and `26 / 90` after returning to Today.

The data model is therefore richer than the large total alone: a trip's full duration, the part of that trip inside the selected 180-day window, the selected checking date, the saved-result checkpoint, and a projected end for an open-ended stay all coexist. The visual hierarchy needs to keep those meanings separate at the moment they are read.

## Verified scenarios

- Empty guest state: the app offers `Add new trip` and keeps the timeline absent until a trip exists. Evidence: [empty state](../../../.gstack/qa-reports/screenshots/initial-app.png).
- Three labelled stays: France 1–15 Apr (15 days), Italy 1–10 May (10 days), Spain 1–30 Oct (30 days). At 30 Oct the result is `37 / 90`; the timeline and ledger agree. Evidence: [mobile three-trip view](../../../.gstack/qa-reports/screenshots/alternative-mobile-three-trips.png), [desktop three-trip view](../../../.gstack/qa-reports/screenshots/alternative-desktop-three-trips.png).
- Overlapping history: 1–15 Apr, 10–20 Apr, and 18 Apr–2 May. The screen reports `32 / 90`, so overlapping days are deduplicated. Evidence: [overlapping mobile view](../../../.gstack/qa-reports/screenshots/alternative-mobile-overlap.png).
- Over-limit state: a 1 Jun–10 Sep stay produces the first over-limit result on 30 Aug, `91 / 90`, and a latest safe exit of 29 Aug. Evidence: [risk viewport](../../../.gstack/qa-reports/screenshots/alternative-mobile-risk-viewport.png).
- Open-ended stay: a 1 Sep stay with no exit date reports `35 / 90` on 10 Sep, labels the trip as open-ended/projected, and extends the visual forecast axis to 9 Mar 2027. Evidence: [ongoing stay](../../../.gstack/qa-reports/screenshots/alternative-mobile-ongoing.png).
- Explainer checkpoints: baseline `25 / 90`, checked what-if `26 / 90`, planned exit `95 / 90`, and Today `26 / 90`. Evidence: [explainer baseline](../../../.gstack/qa-reports/screenshots/alternative-explainer-baseline.png), [explainer what-if](../../../.gstack/qa-reports/screenshots/alternative-explainer-whatif.png), [explainer planned exit](../../../.gstack/qa-reports/screenshots/alternative-explainer-planned-viewport.png).
- Slider keyboard behavior: one `ArrowLeft` changed 30 Oct to 29 Oct; the slider exposes an `aria-valuetext` date. `Today` moved to 10 Sep and `Back to result` returned to 30 Oct.
- Date-entry validation: same-day stays are accepted as one day; a reversed range shows `The exit date cannot be before the entry date.`
- Guest privacy observation: in a fresh guest context, trip creation generated local page/module requests only; no request with trip POST data was observed during this review.
- Browser console: no page errors were observed in the isolated scenarios above.

## Findings

### MW-001 — An out-of-range checking date can remain visible while the calculation stays on the previous date

**Severity:** P1 / high\
**Category:** Functional, UX, Accessibility

**Reproduction:**

1. Add France 1–15 Apr, Italy 1–10 May, and Spain 1–30 Oct.
2. In `Checking date`, enter `01/01/2025` and leave the field.

**Observed:** The field visibly contains `01/01/2025` and is browser-invalid (`Value must be 09/09/2026 or later`), but the slider remains at 30 Oct, the window remains 4 May–30 Oct, and the result remains `37 / 90`. There is no inline message connecting the invalid field to the unchanged result. Evidence: [invalid checking-date control](../../../.gstack/qa-reports/screenshots/alternative-mobile-invalid-checking-date-control.png).

**User impact:** A traveler can read the date they typed as the date being checked while the large answer still belongs to a different date. On a safety-sensitive calculator, that is a direct answer-to-input mismatch. The same behavior was observed for a date after the allowed maximum (`01/01/2027`).

### MW-002 — Overlapping entries collapse into a vertical label stack with no exact entry dates on the axis

**Severity:** P1 / high\
**Category:** Visual, UX, Content

**Reproduction:**

1. Add three stays whose dates overlap or sit close together: 1–15 Apr, 10–20 Apr, and 18 Apr–2 May.
2. Read the mobile moving-window diagram.

**Observed:** The three entries appear as a vertical stack at the same narrow area of the axis. The markers are labelled `1`, `2`, and `3`, with durations and trip names stacked above and below one another. The diagram shows only the overall axis endpoints and Today; the exact entry dates are not visible in the main visualization. Evidence: [overlapping mobile view](../../../.gstack/qa-reports/screenshots/alternative-mobile-overlap.png).

**User impact:** The user cannot reliably tell which marker corresponds to which calendar date or distinguish a close trip from an overlapping one. They must leave the visualization and inspect the cards, which defeats the purpose of the primary data view for dense histories.

### MW-003 — Full trip duration and counted-in-window duration are visually adjacent but not explicitly distinguished

**Severity:** P2 / medium\
**Category:** UX, Content, Accessibility

**Observed:** In the risk state, the long-stay marker displays `102 days` on the axis while the large result below displays `91 / 90`, with the window band covering only the inspected portion. The card also repeats `102 days` and `12 days over the limit`. The component text explains the selected-window count, but the axis treatment does not label the `102` value as the trip's full duration. Evidence: [risk viewport](../../../.gstack/qa-reports/screenshots/alternative-mobile-risk-viewport.png).

**User impact:** A first-time user can interpret `102 days` as the number counted in the current 180-day window, then see a conflicting `91 / 90` below. The data is correct in the tested scenario; the issue is the visual relationship between two different measures.

### MW-004 — Open-ended projections create a long future bar that can read like a committed stay

**Severity:** P2 / medium\
**Category:** Visual, UX, Content

**Observed:** For a 1 Sep open-ended stay, the axis extends to 9 Mar 2027 and the projected bar continues to the right edge with an arrow. `Open-ended · projected` is present, and the card says `Exit date open`, but the projected geometry dominates the compact mobile chart. Evidence: [ongoing stay](../../../.gstack/qa-reports/screenshots/alternative-mobile-ongoing.png).

**User impact:** The visual weight of a projected continuation can make a forecast look like a booked or confirmed travel record. The latest safe exit (29 Nov in the tested state) and the projected extent need a stronger visual distinction when both are on screen.

### MW-005 — The calculator repeats the same total in three nearby locations on mobile

**Severity:** P2 / medium\
**Category:** UX, Content

**Observed:** On the mobile calculator, the result panel shows `37 / 90`, the moving-window card repeats `37 / 90` below the diagram, and the saved-result row repeats `37 / 90` again. The trip cards add another set of durations below. Evidence: [mobile three-trip view](../../../.gstack/qa-reports/screenshots/alternative-mobile-three-trips.png).

**User impact:** Repetition helps scanning but weakens hierarchy. Users may not know which total is the editable inspection and which is the saved result, especially after scrubbing. The labels provide context, but the three numerically identical totals compete with the single primary answer.

## Health score for this scoped review

This is a feature-scoped score, not a full-site release score.

| Category | Score | Basis |
|---|---:|---|
| Console | 100 | No page errors observed in isolated runs. |
| Links | N/A | Link crawl was outside the requested screen scope. |
| Visual | 76 | Overlap collision and projected-bar dominance. |
| Functional | 78 | Core counts, overlap deduplication, keyboard scrubbing, and checkpoints worked; invalid date input can be stale. |
| UX | 66 | The stale date/result state and dense marker ambiguity affect the primary task. |
| Performance | 95 | No perceptible interaction delay in tested scenarios. |
| Content | 78 | Full-duration versus counted-duration and projection semantics need stronger separation. |
| Accessibility | 82 | Native date/range controls and keyboard interaction work; invalid date feedback is not inline or tied to the result. |

**Scoped health score: 78/100.** The engine-backed values were consistent in the exercised cases. The two P1 findings concern the user's ability to know which date and which marker the answer represents, so they should be resolved before treating this as the application's finished primary screen.

## Untested or not claimed

- No production deployment or authenticated/account flow was tested.
- No full link crawl or full-app accessibility audit was run.
- No native screen-reader session was run; `aria-valuetext` and the browser accessibility surface were inspected, but VoiceOver/NVDA speech output remains unverified.
- No 17-locale sweep was run in this review; long translated labels, RTL marker ordering, and date formatting need a separate pass.
- No 10+ trip stress case was run. The overlapping three-trip case is evidence of collision risk, not a claim about the maximum supported trip count.
- No live border/visa/legal interpretation was assessed. The review covers product behavior and presentation only.
