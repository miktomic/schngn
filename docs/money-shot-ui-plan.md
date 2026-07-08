# Money shot UI plan

## Goal

The key SCHNGN view must answer one question in under five seconds:

> Am I safe for my planned Schengen trips, and if not, exactly what must change?

The screen should not be a generic calculator dashboard. It should be a trust-building travel status view.

## Design principles

1. **Answer first, math second**
   - Lead with a plain-language status: Safe / Action Required.
   - Avoid leading with raw counters.

2. **One dominant metric**
   - Use “cushion days” or “days over limit” as the hero metric.
   - Hide secondary numbers below the fold or in an explanation drawer.

3. **Make the rolling window visible**
   - Represent the 180-day period as a sliding frame over a horizontal timeline.
   - Trips inside the window are saturated; trips outside fade.

4. **Protect future commitments**
   - Planned trips can be “locked.”
   - Simulations should show whether they break locked trips.

5. **Explain in human language**
   - “Looking backward from Oct 13…”
   - “Entry and exit days both count.”
   - “This leaves a 15-day cushion.”

6. **Trust and privacy are UI elements**
   - Offline/private badge.
   - Border-ready PDF.
   - Official-source disclaimer in report/about view.

## Key view structure

1. Header: SCHNGN + Offline & Private badge.
2. Mode switch: Check Current / Trip Planner.
3. Hero status card:
   - Safe & Protected or Action Required.
   - Safe buffer days / over-limit days.
   - Must-exit-by date for the current what-if trip, or required fix.
4. Rolling 180-day visualizer:
   - Timeline.
   - Active 180-day frame.
   - Past, committed, what-if, and over-limit segments.
   - 75/90 capacity meter.
5. Trips affecting this answer:
   - Past trip.
   - Committed future trip.
   - What-if simulated trip.
6. Explanation drawer:
   - Plain-language “why.”
   - Inclusive day counting reminder.
7. Border-ready PDF CTA.

## Inspiration synthesized

- NotebookLM recommended avoiding a circular gauge because the rule is a sliding window, not a fixed bucket.
- NotebookLM also flagged confusing labels: “cushion days,” “latest safe exit,” “locked,” and “draft.” The mock was updated to use “safe buffer days,” “must exit by,” “committed,” and “what-if.”
- Mobile dashboard guidance favors scannable top-line information, not desktop-style dense tables.
- Calendar UI guidance favors compressed date context plus agenda/details below on mobile.
- Schengen Simple’s strongest idea is future-aware planning; our angle should be making that logic more transparent.

## Prototype created

Standalone HTML mock:

`/Users/michael/work/schngn/sketches/001-money-shot-status/index.html`

Interactions:

- “Simulate +9 days” toggles safe → risk state.
- Explanation drawer opens/closes.
- PDF CTA shows mocked toast.

## Next iteration questions

1. Is “safe buffer days” the right hero metric, or should the hero say “Safe until Oct 13”?
2. Is the timeline understandable without instructions?
3. Should the money shot show a calendar strip instead of a horizontal timeline?
4. Should “committed trip” be user-facing language, or should we use “Booked”?
5. Does dark navy feel trustworthy, or too fintech/serious?
