---
target: Moving-window timeline in the calculator and Explainer
total_score: 32
p0_count: 0
p1_count: 2
timestamp: 2026-09-10T05-37-14Z
slug: pps-web-src-lib-design-movingwindowtimeline-svelte
---
Method: dual-agent (A: /root/design_assessment · B: /root/detector_assessment)

The moving-window design is a good foundation, but it does not yet explain the idea as immediately as the supplied references. Impeccable rates it 32/40. The strongest part is reversible exploration; the biggest opportunity is making the timeline itself readable before asking users to interpret the numbers.

## Anti-patterns verdict

Low AI-slop signal. The palette, native controls, restrained borders and explicit risk state fit SCHNGN. The weakness is more specific: the arrangement resembles an analytics table, while the references tell a simple travel story.

The deterministic detector returned zero findings across MovingWindowTimeline.svelte, MovingWindowExample.svelte and TimelineLedger.svelte. This confirms no covered mechanical anti-patterns were detected; it does not evaluate narrative clarity. No detector false positives were emitted. No reliable browser overlay was available.

## Design health

| Heuristic | Score | Main observation |
|---|---:|---|
| Visibility of status | 4/4 | Checking date, live count and saved checkpoint are explicit. |
| Match to the real world | 3/4 | The travel timeline lacks visible dates and landmarks. |
| User control | 4/4 | Scrubbing, date entry and reset preserve saved trips. |
| Consistency | 3/4 | Native controls work; repeated headings add noise. |
| Error prevention | 4/4 | Bounded, reversible exploration prevents accidental edits. |
| Recognition over recall | 2/4 | Users must infer trip dates and mark meanings. |
| Flexibility and efficiency | 3/4 | Keyboard and direct entry work; date landmarks would help. |
| Minimalist design | 3/4 | Restrained styling, but evidence is fragmented. |
| Error recovery | 3/4 | Reset works; rejected dates have little explanation. |
| Help and documentation | 3/4 | The surrounding Explainer helps more than the diagram itself. |
| Total | 32/40 | Good, with clarity improvements needed. |

## What works

- The saved-result checkpoint is worth preserving. A user can inspect 90/90 while still seeing the original 91/90 result; exploring does not silently alter the plan.
- Risk is calm and explicit: a textual overage plus a red count and window tint.
- The interaction fits mobile and RTL layouts. Assessment A inspected live 320px, 390px, 1280px and Arabic views using synthetic data; native controls remained usable without horizontal overflow.

## Priority issues

### P1: Trip marks are too small to explain the dates

The observed 390px track was about 228px wide and covered roughly October 2025 through March 2027. The 15-day and 10-day stays occupied only about 6.6px and 4.4px; at 320px they shrank to about 4.5px and 3px. Only axis endpoints are visible, and the trip date ranges are visually hidden.

This makes it difficult to see which stay aged out or connect a bar with an actual journey. Use a more focused initial extent, meaningful month/date ticks and compact visible trip dates. Give very short stays a distinct marker or inspection affordance while preserving an honest duration scale. Suggested command: `$impeccable layout`.

### P1: The Explainer skips the baseline and the Today anchor

The example starts at a future planned exit with the what-if stay already included: 95/90. There is no Today marker. The reader has to reverse-engineer why the early stays are gray and what caused the overage.

Start with an understandable baseline and a visible Today anchor, then let the reader add the 65-day hypothetical stay and move to the later trip. Label the future checkpoint as the planned exit. Keep the calculator's saved verdict fixed while exploring. Suggested command: `$impeccable shape`.

### P2: Mark meanings are implicit

The interactive branch omits the static timeline's legend. Gray, amber and blue marks appear without an explicit key, and 0/15 can be mistaken for a zero-day trip.

Add concise direct labels or a compact legend explaining counted versus outside-window days and the what-if state. Describe a row as zero of its fifteen days counted in this window. Do not blindly label all blue bars Booked: the current shared rendering is not a reliable booking-status key. Per-trip ratios and hidden dates already provide accessible text; hiding redundant graphical bars is not itself an accessibility failure. The missing part is the meaning of the evidence. Suggested command: `$impeccable clarify`.

### P2: Repeated labels compete with the visual story

The Explainer repeats Explore the moving window above the section and again over the slider. Controls, aggregate explanation, range, rows, endpoint dates, checkpoint and return forecast form a long reading sequence.

Use one heading and an action-oriented slider label. Keep the selected-date evidence together and clearly separate the saved-result forecast so its date scope remains unmistakable. Suggested command: `$impeccable distill`.

## Cognitive load and emotional journey

Assessment A found moderate cognitive load: three of eight checklist items need work—chunking, recall burden and progressive disclosure. This is not an excess of buttons; it is the number of facts that must be mentally connected.

The best moment is scrubbing across 90/90 to 91/90. The weakest teaching moment is opening on red 95/90 without first establishing the example. The reference's baseline → what-if → future consequence sequence is worth restoring.

## Persona red flags

- First-time traveler: may not know why a future date is selected or what 0/15 means.
- Distracted mobile traveler: may miss the 3–5px historical trip marks.
- Screen-reader or low-vision user: has textual counts and dates, but needs clearer counted/outside-window semantics; do not solve this by duplicating every decorative bar in the accessibility tree.

## Minor observations and direction

Native date formatting depends on browser and device locale; do not replace a reliable native picker just to force one format. Add a locale-formatted date beside it only if necessary. Keep the saved checkpoint, native interaction and understated risk treatment. The improvement should be a clearer story, not more visual decoration.

The next pass has two clear themes: date/state clarity and readable mobile evidence. Questions skipped because that priority is straightforward. No implementation changes are part of this critique.
