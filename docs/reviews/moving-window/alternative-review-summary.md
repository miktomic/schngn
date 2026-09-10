# Review synthesis and recommended shortlist

Date: 10 September 2026. Scope: SCHNGN's central calculator timeline and the related moving-window explainer.

Two separate agents used the design-review and qa-only skills to inspect the running application with synthetic data. A third independently documented the source-level data contract and checked the prototype scenario against the production engine. These are expert-assisted reviews, not sessions with representative travelers or a certification of accessibility.

## Findings that matter most

| Priority | Finding | Evidence | Required outcome |
|---|---|---|---|
| P1 | An invalid checking date can remain in the field while the answer belongs to the previous valid date. | Usability MW-001 | Reject with an inline explanation and restore the displayed active date, or explicitly suspend the result until valid. A visible input and visible answer must never silently disagree. |
| P1 | Close and overlapping trips cause fragile stacks of elevated labels and thin leaders. | Usability MW-002; design F-04 | Establish an intentional cluster/label policy and verify at least five nearby stays at 320px and 390px. |
| High | Saved-plan, scenario, and inspected-date readings are separated by scroll and may appear contradictory. | Design F-01; usability MW-005 | Put the result's scope and inspected date next to the dominant count. Keep the original-plan checkpoint visible when it differs. |
| High | The main chart lacks a concise accessible explanation of the window, Today, and trip contributions. | Design F-03/F-09 | Provide a labeled summary and discoverable detailed evidence. Country identity must not depend on interpreting a flag. The existing detailed per-trip counts are useful and should be preserved. |
| P2 | Full trip duration can be mistaken for contribution to the inspected window. | Usability MW-003 | Label full duration and counted contribution as distinct measures. |
| P2 | Projected ongoing geometry can look like a committed future stay. | Usability MW-004 | Give projected continuation a distinct treatment and identify its forecast endpoint. |
| P2 | Counted/outside/what-if meanings are hidden behind a disclosure. | Design F-05 | Keep a compact text-and-shape key beside the axis. |
| P2 | Amber label contrast is approximately 4.16:1 in the reviewed baseline. | Design F-08 | Verify and adjust the actual rendered pair to at least 4.5:1 at this text size. |
| Structural | The moving lesson is far down a long explainer page, unlike the reference's focused sequence. | Design F-02 | Keep the calculator task-focused and make the teaching sequence directly reachable. |

The screen is visually credible and the reviewed engine-backed checkpoints were correct. Passing counts and responsive bounds are not enough to close the P1 findings. Native screen-reader testing, representative user testing, and broader localized/dense histories remain required for the final implementation.

## What the alternatives demonstrate

- **H — Swiss grid:** strongest immediate hierarchy for a risk state. The inspected count is prominent before the timeline.
- **C — Bret Victor:** clearest same-date comparison between the original plan and the additional stay. It demonstrates the change directly instead of requiring memory.
- **B — Rams:** a calm single-instrument composition with a visible legend and grouped controls.
- **A — Tufte:** a strong evidence-oriented option when the traveler needs to audit the trip arithmetic.

The independent design reviewer explicitly favored H's risk hierarchy, C's scenario comparison, and B's visible legend. Our recommendation is to test these three first, with A as the evidence-oriented comparison. This is a shortlist for testing, not a final selection or authorization to replace production.

C's timeline sits lower on mobile; H's controls also sit below its first viewport. B still needs clear separation between first-conflict date and end-of-trip consequence. A proposed hybrid should resolve those weaknesses rather than combine every visible element.

## What is complete

Ten standalone interactive studies (A–J), desktop and mobile captures, a comparison board with a local feedback export, the full screen data specification, design rationale with primary sources, and both independent review reports.

The studies use the same engine-generated synthetic frames and the same recorded random seed. All ten passed checks for the initial 95-day reading; Today at 26; removing the extra stay at 25; planned exit without it at 30; keyboard date changes; retained slider focus; and no horizontal overflow at 320px. No browser runtime errors were observed in these checks.

## Scope and limits

The studies do not replace the production screen. They intentionally omit production trip editing, account flows, localization, and complex ongoing/dense data. Those remain implementation requirements in the data specification. The existing production findings have been documented, not silently patched during a report-only review.

Fresh exploration seed: **1276709372**. This controls reproducible artifact choices, not the assistant's internal model seed. Ten design families were deliberately selected to provide range; only bounded typography/spacing parameters were sampled.

## Evidence

- [Independent design review](alternative-design-review.md)
- [Independent usability review](alternative-usability-review.md)
- [Full data and interaction specification](screen-data-specification.md)
- Design principles and tradeoffs: local design study artifact `design-rationale.md` (outside this repository)
- Prototype verification results: local design study artifact `verification.json` (outside this repository)

Final repository gate: bun run check passed **448 tests**, zero Svelte errors/warnings, all builds, and compiled/HTTP smoke checks. This checks the current shared working tree; production UI was not modified by this review/exploration turn.
