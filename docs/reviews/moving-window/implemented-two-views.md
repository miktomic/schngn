# Implemented Sliding window and Layered contributions

User selection: graphic studies A and J, with a switch between them. Implemented on the canonical calculator timeline and the synthetic moving-window explainer. The default remains Sliding window. Both buttons are native keyboard-accessible controls with an announced pressed state; the selected checking date, current count, what-if data, and saved checkpoint are shared.

## Implementation

- `MovingWindowTimeline.svelte`: shared view switch and existing date/result state. The sliding timeline keeps square flags and transparent text backgrounds.
- `LayeredContributions.svelte`: responsive stacked areas, 90-day threshold, checking-date cursor, trip legend with counts, and explicit projected-stay treatment.
- `lib/timeline/layeredContributions.ts`: exact turn points and assignment of engine-counted unique dates. Overlapping days are attributed once to the earliest-starting trip, with a stable ID tie-break. The chart explains the attribution when overlaps are present. Histories with more than six contributing trips group earlier trips while retaining their days. Open-ended stays use the existing projection adapter. Empty data and long empty date spans do not require daily expansion.
- `movingWindowUi.ts`: view labels and explanatory product copy in all 17 locales.
- `layered-contributions.test.ts` and `moving-window.e2e.ts`: calculation/attribution, boundary geometry, date continuity, what-if behavior, keyboard operation, local storage and viewport checks.
- Architecture, DEC-14 and canonical agent context record the approved view choice.

The layered geometry is derived from trips and the date extent, so moving the checking-date cursor does not regenerate the time series. View selection is state on the mounted component; it is not persisted or sent to a server.

## Verification

- Six new contribution tests pass, including an every-day engine/interpolation comparison, overlap de-duplication and input-order invariance, outside-Schengen gaps, open-ended stays, grouping, empty and distant trips, and 500 overlapping records with an intermediate over-limit peak.
- Focused moving-window browser tests: 4 passed. All 17 locales at 320px; keyboard view switching preserves focus; view changes preserve the checking date, saved verdict and trip storage. What-if changes update the selected graphic without resetting the view.
- Full browser suite: 48 passed.
- Type checks: pass; Svelte reports 0 errors and 0 warnings.
- Builds, compiled agent smoke and agent-readiness HTTP smoke: pass.
- Rendered UI inspection: English 390/1280px and Arabic, Hebrew and German at 320px. No viewport overflow, clipped SVG labels, browser page errors or submitted request bodies observed using synthetic data.
- The same visual/interaction checks were repeated through the compiled Tailscale preview URL.

## Release verification

The focused release branch is based on the current production code, including the agent-access migration assertion fix. Release validation runs `bun run prepr` on the final tree, followed by Linux CI on the exact commit before opening the PR. Production is verified after the protected main deployment completes; prior preview results are not deployment evidence.

Native-device screen-reader testing and user comprehension testing remain outside this browser verification.
