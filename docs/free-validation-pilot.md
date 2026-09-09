# SCHNGN free validation pilot

Status: prepared, not recruiting. Owner: Michael. Prepared 9 September 2026.
The calculator remains free. No paid acquisition or billing experiment is part
of this pilot. Launch readiness is governed by `production-readiness.md`.

## Question and participants

Can repeat travelers independently plan multiple Schengen stays, understand the
result's date, and return when their plans change?

Invite 30 volunteers who expect to plan at least two Schengen stays in the next
six months and believe the ordinary 90/180 rule applies to them. Product testing
does not establish a person's immigration eligibility. Seek a mix of returning
family visitors, independent travelers, and people splitting time between
Schengen and non-Schengen countries. Keep interviews focused on the workflow.

Begin with five moderated sessions. Fix result-integrity or blocking usability
problems before inviting the remaining 25. Run the cohort for four weeks after
the first invitation; record the actual dates when recruitment starts.

## Readiness before invitations

- Deployed release and public/guest/offline checks pass.
- Controlled signup, repeat-device sync, reconciliation, export, deletion, and
  sign-out isolation pass against production.
- Support email receipt and privacy-safe analytics delivery are verified.
- Real operator details and appropriate legal/native-language review are complete.
- Consent and an operator-controlled private location for volunteer contact
  information are agreed. Never commit participant identities or responses.

## Session script

Explain that SCHNGN is a planning aid, not a guarantee of entry. Use supplied
synthetic dates for observation. Participants may try their own history privately;
do not ask them to send it, share screenshots, or expose it on a recorded call.

1. Add two stays and a proposed future trip without coaching.
2. Explain which date the prominent result describes and what it means.
3. Change a planned exit date, compare the result, and undo the change.
4. Reload and confirm the plan remains available. Try offline use.
5. Optionally try the clearly labelled account-and-save flow.
6. Ask what they currently use, what was confusing, and when they would use this again.

At weeks two and four, ask whether they returned to update a real plan, whether
SCHNGN changed a planning decision, and what prevented use. Distinguish voluntary
return visits from visits prompted by the follow-up.

## Measurement and decision

These are proposed learning thresholds, not market benchmarks or revenue forecasts.

| Measure | Proposed threshold | Evidence |
| --- | --- | --- |
| Independent completion | 24 of 30 finish the multi-trip task without help | Anonymous session tally |
| Understanding | 24 of 30 correctly explain result and checkpoint date | Anonymous session tally |
| Repeat usefulness | 10 of 30 report an unprompted return to update a plan within four weeks | Voluntary follow-up, explicitly self-reported |
| Concrete value | 5 describe a specific planning decision it helped them make | De-identified themes, no travel dates |
| Correctness/privacy | Zero unresolved result-integrity or data-disclosure defects | Issue and regression evidence |

Count withdrawals/nonresponses explicitly; report denominators and do not infer
retention from pageviews. Existing analytics allow only `page_view`,
`calculator_start`, `trip_added`, and `simulation_run`, with approved bucketed
properties. Those aggregate events cannot identify this cohort or prove individual
return visits. Do not add identity tracking, session replay, travel dates, free-text
labels, or account identifiers to measure the pilot.

If comprehension/completion is weak, fix the observed friction and repeat five
sessions. If completion is strong but repeat usefulness is weak, revisit the target
traveler and acquisition channel before expanding features. If the thresholds are
met, run a larger free cohort and conduct willingness-to-pay interviews before
proposing any paid feature or changing the free product policy.

## Invitation draft — not sent

“I'm testing SCHNGN, a free tool for planning several Schengen trips while keeping
trip data on your device unless you choose account sync. Would you be willing to
try a short planning task and share feedback over the next four weeks? It is a
planning aid, not legal advice. You won't need to share your passport or travel
history with me.”

Recruitment and follow-up messages require explicit authorization before sending.
