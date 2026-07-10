# SCHNGN visual identity and design system brief

> Historical identity brief. DEC-11 superseded its logo exploration on 2026-07-10 with the supplied production wordmark and euro-star favicon artwork.

## Objective

Use Pencil to define the SCHNGN visual identity before building every product screen. The user likes the existing `tufte-evidence-ledger` direction. Preserve its evidence-rich trust while making the system warm enough for consumer mobile use.

This is not a marketing landing page pass. This is the product design system foundation for the local-first Schengen 90/180 PWA.

## Design read

Mobile product UI for anxious travelers and family planners. Trust-first, evidence-led, public-service clear, and calm. Lean Tufte ledger plus softened permission object. Avoid App Store gloss, travel clipart, AI-purple gradients, and airport cybersecurity dashboard cosplay.

Dials:

- Design variance: 4/10. Structured, evidence-led, not chaotic.
- Motion: 2/10. State transitions only; no decorative motion.
- Visual density: 6/10. Compact proof, but answer must stay dominant.

## Existing artifacts to honor

- `sketches/pencil/tufte-evidence-ledger.pen`
- `sketches/pencil/exports/tufte-evidence-ledger.png`
- `sketches/pencil/synthesis-compelling-mock.pen`
- `sketches/pencil/exports/synthesis-compelling-mock.png`
- `docs/pencil-design-iteration-results.md`
- `docs/money-shot-ui-plan.md`

## What worked in the Tufte direction

- Paper-like background and serious ink typography feel credible.
- Evidence is visible: active 180-day window, trips counted, days returning soon.
- Semantic colors are meaningful: safe, booked, what-if, risk.
- The product looks like a useful instrument, not generic SaaS.
- Strong borders and ledger cards make the calculation feel inspectable.

## What needs improvement

- It is a little too dense for the default home screen.
- Hero number dominates so much that the status hierarchy could feel blunt.
- The logo is currently just a wordmark. It needs a small mark and rules.
- The palette should be locked before all screens are generated.
- The synthesis mock introduced purple for what-if; replace that with amber/gold so semantic color stays consistent.
- Avoid over-rounded generic cards. Use radius only where it communicates touchability or grouping.

## Recommended palette to explore first

All contrast pairs below were checked and pass WCAG AA for text when used as specified.

| Token | Hex | Use |
|---|---:|---|
| `--color-paper` | `#F7F5EF` | App background, report paper |
| `--color-surface` | `#FFFFFF` | Primary cards and sheets |
| `--color-surface-mint` | `#EDF5F1` | Calm safe surfaces |
| `--color-ink` | `#10231F` | Primary text, logo, main CTA |
| `--color-muted` | `#4F5F59` | Body and annotations |
| `--color-line` | `#C8D1C8` | Borders, timeline rules |
| `--color-safe` | `#0F6B4F` | Safe status, local/private badge |
| `--color-safe-bg` | `#DFF1E9` | Safe chip background |
| `--color-booked` | `#1F5F9F` | Booked/committed trips |
| `--color-booked-bg` | `#E6EEF7` | Booked surfaces |
| `--color-whatif` | `#8A5A00` | What-if trips, simulation edits |
| `--color-whatif-bg` | `#FFF1D6` | What-if surfaces |
| `--color-risk` | `#A8322A` | Over-limit state |
| `--color-risk-bg` | `#FDE8E4` | Risk surfaces |

Suggested contrast pairs:

- Ink on paper: 15.02:1.
- Muted on paper: 6.19:1.
- Safe on safe background: 5.53:1.
- Booked on booked background: 5.61:1.
- What-if on what-if background: 5.31:1.
- Risk on risk background: 5.65:1.
- White on ink CTA: 16.38:1.

## Typography exploration

Preferred direction:

- Primary UI: Source Sans 3, IBM Plex Sans, or Atkinson Hyperlegible. Must feel readable and official without becoming government beige.
- Ledger/date/number support: IBM Plex Mono or Berkeley Mono style. Use for dates, ratios, timeline ticks, proof ledger annotations.
- Wordmark: custom SCHNGN letters or a tightened grotesk. The missing vowels are the brand feature; make it intentional.

Avoid:

- Inter as the default visual identity.
- Decorative serif as the core app font.
- Overly technical Fira Code everywhere.

## Logo and mark exploration

Create a logo system, not one decorative icon.

Required logo explorations:

1. Wordmark-only: `SCHNGN` with custom letter spacing and missing-vowel confidence.
2. Mark + wordmark: EU-stars-inspired Schengen constellation integrated with a rolling 180-day window frame.
3. Mark + wordmark: star orbit / partial ring around a day-count timeline, credible at small sizes.
4. Tiny app icon: must work at 32px and as a PWA icon.

Logo constraints:

- Use the EU stars theme as inspiration, not as an official emblem clone.
- No cobalt EU-flag rectangle, no exact institutional star-ring proportions, no official-looking seal, and no implication that SCHNGN is an EU service.
- No globe, airplane, suitcase, passport clipart, or generic map pin.
- No legal scales or shield clichés unless abstracted beyond recognition.
- The logo should imply Europe, calculation, window, privacy, and travel without saying all five at once like a committee memo.

## Components to show on the board

The Pencil output should be a visual identity board with enough product UI samples to judge reuse.

Include:

- Logo lockups and app icon concepts.
- Palette swatches with semantic labels.
- Typography scale: display, title, body, mono date, mono ratio.
- Status chips: safe, booked, what-if, risk, local/private.
- Buttons: primary, secondary, report, destructive/risk action.
- Core cards: answer card, ledger card, explanation card, risk card.
- Timeline tokens: active 180-day frame, trip segment styles, days-returning ticks.
- One compact mobile sample using the Italy scenario, but do not spend the whole canvas on a final app screen.

## Product scenario for sample components

- User is planning an Italy trip.
- Past trip: France, May 1-15, 15 days.
- Booked trip: Greece, Aug 3-18, 16 days.
- What-if trip: Italy, Oct 1-13, 13 days.
- Result: Italy fits.
- Usage at Italy exit: 75 / 90.
- Hero metric: 15 safe buffer days.
- Must exit by: Oct 13.
- If Italy extends by 9 days: unsafe, 94 / 90, 4 days over limit.

## Copy rules

Use these terms:

- Italy fits
- 15 safe buffer days
- Must exit by Oct 13
- Days used 75 / 90
- Rolling 180-day window
- Why this is safe
- Trips counted in this answer
- Booked, not protected
- What-if, not draft
- Local & private
- Border-ready report

Avoid:

- legal advice tone
- compliance object jargon
- payload, draft, object, schema
- fake exact metrics not in the scenario
- em dashes in visible copy

## Evaluation rubric

A successful board makes these decisions easier:

1. Which color palette should become canonical?
2. Does the logo feel ownable and calm, not generic travel-tech?
3. Are safe, booked, what-if, and risk visually distinct without relying only on color?
4. Can the Tufte evidence style scale down to a normal mobile user?
5. Can we build every screen from these tokens without aesthetic drift?
