---
name: SCHNGN Web
description: Privacy-first Schengen 90/180 tracker with an evidence-led paper-and-ink product UI.
colors:
  paper: "#F7F5EF"
  surface: "#FFFFFF"
  surface-mint: "#EDF5F1"
  ink: "#10231F"
  muted: "#4F5F59"
  line: "#C8D1C8"
  safe: "#0F6B4F"
  safe-bg: "#DFF1E9"
  booked: "#1F5F9F"
  booked-bg: "#E6EEF7"
  whatif: "#8A5A00"
  whatif-bg: "#FFF1D6"
  risk: "#A8322A"
  risk-bg: "#FDE8E4"
  star-gold: "#C8A74E"
typography:
  display:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.16
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.25
  body:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.02em"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "14px 18px"
    typography: "{typography.title}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 18px"
    typography: "{typography.title}"
  chip-safe:
    backgroundColor: "{colors.safe-bg}"
    textColor: "{colors.safe}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.title}"
  chip-booked:
    backgroundColor: "{colors.booked-bg}"
    textColor: "{colors.booked}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.title}"
  chip-whatif:
    backgroundColor: "{colors.whatif-bg}"
    textColor: "{colors.whatif}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.title}"
  chip-risk:
    backgroundColor: "{colors.risk-bg}"
    textColor: "{colors.risk}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.title}"
---

# Design System: SCHNGN Web

## 1. Overview

**Creative North Star: "The Border Ledger"**

SCHNGN should look like a calm calculation instrument: paper, ink, hairlines, direct language, visible evidence. The system borrows the credibility of a Tufte-style proof ledger, then softens it enough for an anxious traveler on a phone. It is not a travel lifestyle brand. It is not a legal service. It is a local-first answer machine with receipts.

The interface should keep the verdict dominant and the proof inspectable. Default screens are restrained and mobile-first. Explanation, report, and risk surfaces can become denser, but density must serve trust rather than decoration.

**Key Characteristics:**

- Paper-and-ink surface language.
- EU-stars-inspired Schengen constellation mark.
- Plain-language verdicts with visible calculation evidence.
- Semantic state colors for safe, booked, what-if, and risk.
- Monospace only for dates, ratios, ticks, and ledger annotations.
- Low motion, high clarity, no decorative effects.

## 2. Colors

The palette is warm-neutral paper with dark green-black ink and restrained semantic state colors. Color is functional, not ornamental.

### Primary

- **Ink** (`#10231F`): Primary text, wordmark, high-emphasis CTA backgrounds, and proof-ledger strokes. Use it when the interface needs authority.
- **Star Gold** (`#C8A74E`): Logo-only star accent for the EU-stars-inspired mark. Do not use it as a status color or generic decoration.
- **Safe Green** (`#0F6B4F`): Safe verdicts, local/private status, positive count states, and return-day indicators.

### Secondary

- **Booked Blue** (`#1F5F9F`): Booked or committed trips. This color means user commitment, not legal protection.
- **What-if Amber** (`#8A5A00`): Simulations, uncommitted plans, adjustable trip segments, and planner experiments.
- **Risk Red** (`#A8322A`): Over-limit states, destructive actions, and required fixes.

Do not use the older prototype blues/greens directly in timeline segments unless they map to these tokens and pass 3:1 non-text contrast against the actual track/background.

### Neutral

- **Paper** (`#F7F5EF`): App background and report surfaces.
- **Surface** (`#FFFFFF`): Cards, sheets, forms, and high-contrast containers.
- **Surface Mint** (`#EDF5F1`): Calm safe-state surfaces and subtle status panels.
- **Muted Ink** (`#4F5F59`): Secondary copy, captions, annotations, and explanatory prose.
- **Ledger Line** (`#C8D1C8`): Borders, timeline rails, dividers, and card outlines.
- **Safe Background** (`#DFF1E9`), **Booked Background** (`#E6EEF7`), **What-if Background** (`#FFF1D6`), **Risk Background** (`#FDE8E4`): State tints for chips, panels, and grouped rows.

### Named Rules

**The Semantic Color Rule.** Green means safe or local/private, blue means booked, amber means what-if, red means risk. Do not use these colors decoratively.

**The No Purple Rule.** Purple is not a SCHNGN simulation state. The synthesis mock's purple what-if segment must be replaced with amber.

**The Color Plus Shape Rule.** Status must use text and shape or icon, not color alone.

## 3. Typography

**Display Font:** Source Sans 3, falling back to system sans.

**Body Font:** Source Sans 3, falling back to system sans.

**Label/Mono Font:** IBM Plex Mono, falling back to system monospace.

**Character:** Source Sans 3 gives the app a readable public-service tone without defaulting to Inter. IBM Plex Mono adds ledger credibility for dates, ratios, and proof annotations without turning the whole product into a terminal.

### Hierarchy

- **Display** (700, 44px, 1.05): Main verdict metrics such as "15 safe buffer days" or "4 days over limit". Mobile display can scale down, but should not use overly tight tracking.
- **Headline** (650, 24px, 1.16): Section titles such as "Why this is safe" and "Trips counted".
- **Title** (650, 18px, 1.25): Card titles, row labels, strong button labels, and status chip text.
- **Body** (400, 16px, 1.5): Explanatory copy. Keep prose to 65-75 characters per line when possible.
- **Label** (500, 13px, 1.35): Date ranges, timeline ticks, ratios, and ledger metadata. Use sentence case unless the element is a mechanical ledger label.

### Named Rules

**The Mono Is Evidence Rule.** Use IBM Plex Mono only when the text is a date, ratio, tick, proof annotation, or machine-like label. Do not use mono for marketing voice.

**The Tracking Floor Rule.** Avoid letter-spacing tighter than `-0.04em`. The current prototype's `-0.07em` headings are too cramped.

## 4. Elevation

SCHNGN is flat by default. Depth comes from paper layers, borders, spacing, and tonal panels rather than soft SaaS shadows. Shadows may appear only for transient overlays, drag states, or a lifted sheet that genuinely sits above the page.

### Shadow Vocabulary

- **None at rest** (`box-shadow: none`): Default for cards, status panels, proof ledger, and forms.
- **Interactive lift** (`0 6px 14px rgba(16, 35, 31, 0.10)`): Optional hover or drag state on desktop-only interactive objects.
- **Modal sheet** (`0 18px 48px rgba(16, 35, 31, 0.16)`): Dialogs and report preview overlays only.

### Named Rules

**The Hairline Over Shadow Rule.** Use a 1px line and structured spacing before reaching for a shadow. Avoid border plus large blurry shadow on the same element.

## 5. Components

### Buttons

- **Shape:** Rectangular with modest softness (`10px`). Pills are reserved for compact status badges only.
- **Primary:** Ink background, white text, minimum 44px height, 14px 18px padding, strong Source Sans 3 label.
- **Secondary:** Surface background, ink text, 1px ink or ledger-line border.
- **Report:** Can use ink background with a document icon and explicit label: "Border-ready report".
- **Risk action:** Risk background with risk text and border. Use direct labels such as "Fix unsafe plan".
- **Hover / Focus:** Desktop hover may darken or lift slightly. Focus must use a visible 3px outline with sufficient contrast.

### Chips

- **Style:** Tinted state background, matching state text, 1px border, and a compact icon or shape marker.
- **States:** Safe, booked, what-if, risk, and local/private.
- **Rule:** Chips must read correctly in grayscale through label and shape.

### Cards / Containers

- **Corner Style:** `14px` for normal cards, `18px` for major answer panels. Avoid 24px+ rounded cards in app UI.
- **Background:** Surface for neutral cards, surface mint or state backgrounds for meaningful states.
- **Shadow Strategy:** No shadow at rest.
- **Border:** 1px ledger line by default. Use state-color border only when the whole panel is a semantic state.
- **Internal Padding:** 16px on dense mobile cards, 24px on major answer panels.

### Inputs / Fields

- **Style:** Surface background, 1px ledger line, `10px` radius, label above the input.
- **Focus:** 3px outline or double-border treatment using safe green or ink. Do not rely on placeholder text as a label.
- **Error / Disabled:** Risk text and border for errors, muted ink and paper background for disabled.

### Logo / Mark

The preferred logo direction is an **EU-stars-inspired Schengen constellation** paired with the SCHNGN wordmark.

- Use a ring, arc, or partial orbit of small star points to evoke Europe and the Schengen zone.
- Integrate the star structure with the product's core mental model: a rolling 180-day window, timeline frame, or day-count orbit.
- Use Ink for the wordmark and Star Gold only for the stars or a tiny accent.
- The mark must work in one color, at 32px, and as a PWA icon.
- It must not copy the official EU flag: no cobalt rectangle, no exact institutional emblem lockup, no official-looking seal, and no implication that SCHNGN is an EU service.

### Navigation

- **Style:** Minimal top bar with SCHNGN wordmark, EU-stars-inspired mark, and local/private status. Avoid a full marketing nav inside the app shell.
- **Mobile:** Keep header compact. The answer card must appear without a long preamble.
- **Brand:** Use the Schengen constellation mark plus SCHNGN wordmark once the mark is finalized.

### Rolling Window Timeline

The timeline is SCHNGN's signature component. It should show the active 180-day window, trip segments, returning days, and usage ratio in one inspectable composition.

- Past trips: muted gray.
- Booked trips: blue.
- What-if trips: amber.
- Safe buffer or returned days: green.
- Risk/over-limit extension: red.
- Active 180-day frame: ink or ledger line, visible but not heavy.
- Labels: use IBM Plex Mono for dates and ratios, Source Sans 3 for human labels.

### Answer Card

The answer card is the money-shot component.

- Verdict chip at top: "Italy fits" or "Action required".
- Dominant metric: "15 safe buffer days" or "4 days over limit".
- Two or three supporting facts: must-exit date, days used, trips counted.
- Short plain-language explanation.
- Link or affordance to "Why this is safe" or "Show calculation".

## 6. Do's and Don'ts

### Do:

- **Do** lead with the verdict and one dominant metric.
- **Do** use the paper-and-ink palette from this file as the canonical visual source, not the older blue prototype.
- **Do** keep trip data local and reinforce that in UI copy.
- **Do** use amber for what-if and blue for booked trips.
- **Do** keep risk panels specific: days over, cause, and first fix.
- **Do** preserve the Tufte evidence-ledger feeling in explanation and report surfaces.
- **Do** use the EU-stars-inspired Schengen constellation mark as the preferred logo direction, then manually refine the wordmark later.
- **Do** label committed travel as "Booked trip counted" or "Booked, counted" where space is tight.

### Don't:

- **Don't** use purple for simulations or what-if trips.
- **Don't** use Inter as the brand default unless deliberately reverting to a neutral fallback during implementation.
- **Don't** use circular gauges as the main explanation for a rolling-window rule.
- **Don't** use generic travel icons: plane, suitcase, globe, passport stamp, or map pin.
- **Don't** copy the official EU flag, official EU star-ring proportions, or any mark that implies EU institutional endorsement.
- **Don't** imply booked trips are legally protected; avoid using "protected" as a status label.
- **Don't** ship over-rounded cards, large blurry shadows, or glassy decorative panels.
- **Don't** hide the calculation behind a legal-sounding report. The report is an output, not the product's proof.
- **Don't** send trip dates, country histories, calculated personal timelines, names, passports, or legal status to analytics or server endpoints.
