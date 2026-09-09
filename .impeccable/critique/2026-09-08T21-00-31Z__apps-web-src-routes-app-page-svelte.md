---
target: SCHNGN calculator UX and UI
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-09-08T21-00-31Z
slug: apps-web-src-routes-app-page-svelte
---
# SCHNGN calculator: Impeccable UX/UI critique

Method: dual-agent (A: independent design review; B: isolated technical detector and browser review). Assessment A was finalized before Assessment B findings were released. Target: apps/web/src/routes/app/+page.svelte and shared calculator components. Baseline before implementation, 8 September 2026.

## Overall assessment

The calculator is a credible, restrained instrument. Semantic status colors, clear type, visible timeline evidence, and explicit save/cancel controls support an anxious traveler. The main weakness is temporal clarity: an earlier conflict checkpoint can be mistaken for the current or full-trip outcome. Mobile trip entry also puts optional information ahead of the essential dates.

## Nielsen heuristic scores

| Heuristic | Score / 4 | Evidence |
|---|---:|---|
| Status visibility | 2 | Strong verdict, ambiguous checkpoint |
| Real-world match | 2 | Historical and prospective date meanings mix |
| Control and freedom | 3 | Escape and adjustment cancellation restore focus; deletion does not |
| Consistency | 3 | Coherent styling, inconsistent date vocabulary |
| Error prevention | 3 | Explicit save and deletion confirmation |
| Recognition over recall | 2 | Different date scopes require reconciliation |
| Efficiency | 3 | Calendar and exact date entry |
| Minimalism | 3 | Calm dashboard, long entry form |
| Error recovery | 3 | Field errors wired, but invalid submit lacks immediate focus recovery |
| Help and documentation | 3 | Explanation, FAQ, country guide, inclusive-day hints |
| Total | 27 / 40 | Baseline design assessment; technical defects listed below |

## Anti-pattern verdict

No obvious generic AI aesthetic. Scoped detector returned [] with exit 0: zero findings, rules, flagged files, or false positives. This is not proof of accessibility compliance. No ignore file existed.

## Priority issues

1. P1: Main verdict can show 1 day over while an ongoing trip shows 69 over. The dashboard selects the earliest conflict; date context is buried in prose. Put the checkpoint beside the dominant number and identify the first conflict. Source: dashboard/dashboardState.ts and routes/app/+page.svelte. Clarify.
2. P1: Invalid save leaves focus on Save with no error announcement. Focus the first invalid field, retaining its error description. Source: saveTrip in routes/app/+page.svelte. Harden.
3. P2: Mobile entry begins with long guidance and an optional label; required dates and exit actions need scrolling. Put required dates first, add a top close action, and retain visible save/cancel controls. Distill/adapt.
4. P2: Empty onboarding repeats the no-history branch while separating Add new trip. Use one setup block and postpone empty timeline/trip scaffolding. Onboard.
5. P2: Unchanged completed-trip adjustment shows prospective danger and an unlabeled safe-exit date. Suppress the extension cutoff for unchanged completed trips without a conflict; label the deadline when shown. Clarify.
6. P2: Date entry and adjustment use different vocabulary. Reuse localized Entry date / Exit date everywhere in the adjuster. Clarify.
7. P2: Deletion removes the focused region and leaves document focus. Move focus to an adjacent trip or Add new trip. Harden.
8. P3: Calendar month arrows and language control measure 40px. Align these with the product's 44px touch guidance. Polish; not a claimed WCAG AA violation.

## Cognitive load and emotional journey

The dashboard groups information well. Entry exposes many optional decisions before completion; the empty page repeats the same branch. Differing date scopes create a confidence valley immediately after the reassuring large verdict. Exact input and Keep original offer useful recovery. The primary improvement is to put the date and result in one visual unit and get travelers to essential date entry sooner.

## Persona red flags

- Anxious first-time traveler: competing overage totals and historical safe-exit dates undermine certainty.
- Keyboard user: invalid-save and delete focus recovery need correction; observed Escape and Keep original work.
- Distracted mobile traveler: required fields and cancellation should be available immediately.

## Minor observations and limits

Named trips can repeat an uninformative route label, “trip.” Duplicate summary and Expand controls add a keyboard stop. Neither blocks this focused pass. Existing brand tokens and reviewed rule copy should remain unchanged. Local production authentication was unavailable; no production auth/sync claim is made. No real screen-reader runtime or measured contrast audit was performed.

A inspected desktop and 390px mobile; B inspected 1280px, 390px, and 320px, including empty state, save, invalid input, deletion, guest account, and Escape. B observed no document horizontal overflow or console errors/warnings. Existing browser trips were preserved; B's synthetic trip was deleted.

Questions skipped: the issues are concrete and the user already requested implementation. Proceed with clarify, onboard, harden, adapt, then polish within the established product design.
