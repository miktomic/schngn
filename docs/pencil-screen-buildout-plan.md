# SCHNGN Pencil screen buildout plan

> Historical screen-planning context. DEC-11 superseded this file's constellation-logo lock on 2026-07-10; current product surfaces use the supplied production wordmark and euro-star favicon artwork. The waitlist frames below are also retired: account creation now goes directly through Clerk.

This plan assumes the visual identity direction in `docs/pencil-visual-identity-results.md` is approved or lightly adjusted.

## Goal

Build the full SCHNGN MVP screen set in Pencil using one coherent design system before production implementation.

The point is not to make 20 disconnected pretty frames. The point is to define reusable product surfaces, states, and transitions so Svelte implementation can proceed without aesthetic drift.

## Shared rules for every Pencil screen

- Use the paper-and-ink identity system from `schngn-visual-identity-system-v2`.
- Mobile-first at 390px wide.
- No trip data sent to servers in product flows.
- No legal advice wording.
- Use the same semantic colors everywhere:
  - Safe: green.
  - Booked: blue.
  - What-if: amber.
  - Risk: red.
- Show risk states with icon/shape/text, not red alone.
- Keep the answer dominant and proof available.
- Prefer ledger/timeline explanation over circular gauges.
- Avoid travel clipart, EU-flag decoration, AI purple, and generic SaaS cards.

## Screen inventory

### 1. Onboarding / empty calculator

Purpose: first-run orientation without account creation.

Must show:

- SCHNGN identity.
- Local & private promise.
- Add first trip CTA.
- Short explanation of 90/180 tracking.
- Import JSON option.
- Disclaimer: not legal advice.

States:

- Empty state.
- Sample/demo mode affordance.

### 2. Current status dashboard - safe

Purpose: answer “Can I go?” in under five seconds.

Must show:

- Italy fits / safe buffer days.
- Must exit by date.
- Days used 75 / 90.
- Rolling 180-day window card.
- Trips counted.
- Why safe drawer/card.
- Border-ready report CTA.

### 3. Current status dashboard - risk / over limit

Purpose: make the failure state as designed as success.

Must show:

- Action required.
- Days over limit.
- First fix suggestion.
- Which trip/date causes the issue.
- Same rolling-window proof.
- CTA to shorten or adjust plan.

### 4. Add/edit trip form

Purpose: low-friction trip entry with inclusive date clarity.

Must show:

- Country field.
- Entry date.
- Exit date.
- Booked/what-if toggle.
- Schengen/non-Schengen country treatment.
- Inline validation.
- Entry and exit days both count reminder.

States:

- Normal.
- Invalid date range.
- Non-Schengen country warning/exclusion.
- Edit existing trip.

### 5. Trips list / CRUD

Purpose: manage stored local trips.

Must show:

- Past trips.
- Booked future trips.
- What-if plans.
- Edit/delete affordances.
- Local-only storage reminder.
- Empty/zero trips state.

### 6. Planner simulator

Purpose: flagship Victor-style what-if interaction.

Must show:

- Trip objects on a timeline.
- Rolling 180-day window/lens.
- Drag/extend affordance concept.
- Live result card.
- First unsafe day explanation.

States:

- Safe plan.
- Extend Italy by 9 days risk state.
- Booked trip protected/counting language.

### 7. Calculation explanation / proof ledger

Purpose: Tufte report-like proof for trust.

Must show:

- Active 180-day window.
- Counted days by trip.
- Days returning soon.
- Inclusive day counting.
- Over-limit trace if applicable.

### 8. Days coming back visualization

Purpose: answer “when do I get days back?”

Must show:

- Upcoming returned days.
- Relationship to old trips leaving the window.
- Calendar/timeline hybrid.
- Safe buffer forecast.

### 9. Border-ready report preview

Purpose: paid/fake-door validation and trust artifact.

Must show:

- Report cover/header.
- Calculation summary.
- Trip ledger.
- Disclaimer.
- Export/download CTA.
- Paid unlock/fake-door state if appropriate.

### 10. Import/export and privacy settings

Purpose: reassure and give control.

Must show:

- Export JSON.
- Import JSON.
- Clear local data.
- Offline/private explanation.
- Analytics privacy note.

### 11. Waitlist / fake-door purchase intent

Purpose: validation flow without collecting trip data.

Must show:

- Email-only waitlist or intent capture.
- No trip data in payload copy.
- Success state.
- Error state.

## Recommended Pencil batches

### Batch A - Core mobile product flow

Generate:

1. Onboarding / empty calculator.
2. Current status safe.
3. Current status risk.
4. Add/edit trip form.
5. Trips list.

### Batch B - Differentiating proof/planner surfaces

Generate:

1. Planner simulator safe.
2. Planner simulator unsafe.
3. Calculation proof ledger.
4. Days coming back.

### Batch C - Validation/report/admin surfaces

Generate:

1. Border-ready report preview.
2. Export/paywall/fake-door state.
3. Privacy/import/export settings.
4. Waitlist/email intent flow.

## Proposed next Pencil command shape

Use a saved prompt file per batch and attach:

- `docs/pencil-visual-identity-brief.md`
- `docs/pencil-visual-identity-results.md`
- this buildout plan
- the approved `.pen` identity board

Run each batch separately so we can review and fix before multiplying mistakes.

## Open decisions before Batch A

1. Approve palette as canonical or request color tweaks.
2. Logo direction is locked: EU-stars-inspired Schengen constellation mark + SCHNGN wordmark. Future Pencil passes should refine geometry/proportions, not reopen globe/passport/report-stamp alternatives.
3. Confirm typography: Source Sans 3 + IBM Plex Mono, or swap Source Sans 3 for IBM Plex Sans.
4. Confirm whether “Booked, counted” is final product language, with explanatory copy that booked trips do not change the legal limit.
