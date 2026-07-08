# SCHNGN visionary design directions

These are four alternative directions for the SCHNGN money-shot view. They are not minor theme changes; each one has a different theory of how users understand and trust the Schengen 90/180 rule.

## 1. Jony Ive / Apple: The Calm Permission Object

### Thesis
The screen should feel like a single beautifully machined object that tells you whether your trip fits. Almost no visible machinery until the user asks for it.

### Money-shot view
A large, calm, passport-like card:

```text
┌──────────────────────────────┐
│ SAFE FOR ITALY               │
│                              │
│ 15 days                      │
│ safe buffer                  │
│                              │
│ You can stay until Oct 13.   │
│ Greece remains protected.    │
│                              │
│ [Turn card over: why]        │
└──────────────────────────────┘
```

The timeline is not a chart at first. It is a quiet glow/track behind the card. The user can “turn over” the card to reveal the calculation.

### Visual language
- Large white space.
- Soft material surfaces, almost hardware-like.
- One dominant object.
- Typography does most of the work.
- Green/amber/red used sparingly.
- Details hidden by default.

### Interaction
- The card flips/slides to reveal “why.”
- Simulating a trip gently morphs the card from safe to warning.
- No spreadsheet-like interface.

### Strength
Feels premium, trustworthy, low anxiety.

### Risk
May hide too much. The Schengen rule is trust-sensitive; too much minimalism becomes suspicious. Very Apple problem: beautiful silence where a nervous user wants receipts.

### Best use
Consumer default home screen.

---

## 2. Edward Tufte: The Evidence-Rich Travel Ledger

### Thesis
Trust comes from seeing the evidence. The answer is not enough; the screen should show a compact, truthful miniature of the whole calculation.

### Money-shot view
A dense but elegant annotated timeline:

```text
Oct 13 exit check      75 / 90 days used
Apr 17 ───────────────────────────────── Oct 13
        France     Greece             Italy
        ███        █████████████      ███
        15d        47d committed      13d what-if

Days returning:
May 01 +1  May 02 +1  ...
```

Everything visible has meaning. No decorative cards unless they carry data.

### Visual language
- Small multiples.
- Thin rules, annotations, labels.
- High data-ink ratio.
- Calendar/timeline hybrids.
- Muted color with red only for violations.
- No “dashboard confetti.”

### Interaction
- Tap any date/trip segment to see how it contributes to the count.
- Scrub the exit date; the active 180-day window moves.
- Show days falling out as tiny annotations.

### Strength
Maximum credibility. Great for advisors, power users, and border-ready reports.

### Risk
Can overwhelm normal users. Tufte is excellent until your user is in an airport queue with low battery and mild visa panic.

### Best use
Explanation mode, desktop/tablet view, PDF report, advisor/pro mode.

---

## 3. Bret Victor: The Explorable Schengen Simulator

### Thesis
The user should understand the rule by manipulating it. The app is not a calculator; it is an explorable explanation.

### Money-shot view
A draggable timeline where trips are objects and the 180-day window is a movable lens:

```text
[ France ]       [ Greece - committed ]      [ Italy - what-if ]
      ┌──────────── active 180-day lens ────────────┐
      │                                             │
      └─────────────────────────────────────────────┘

Live result: Italy fits. 15 safe buffer days.
```

The user drags the Italy trip longer/shorter and watches the result change instantly.

### Visual language
- Clear manipulable objects.
- Immediate cause/effect.
- Timeline as the main workspace.
- Result card follows the cursor/gesture.
- Explanations appear inline at the point of change.

### Interaction
- Drag trip edges to extend/shorten.
- Drag a trip to different dates.
- Watch the result update live.
- App says: “The first unsafe day is Oct 19 because France is still inside the window.”

### Strength
This could be the differentiator. Users learn the rule by playing with their actual plans.

### Risk
More engineering and more UX complexity. Needs excellent touch behavior or it becomes a tiny rage machine.

### Best use
Trip planner mode. This should probably be our flagship interaction.

---

## 4. Dieter Rams: The Compliance Appliance

### Thesis
This is a tool for avoiding legal/admin trouble. It should behave like a clear, honest appliance: obvious state, obvious controls, no decoration pretending to help.

### Money-shot view
An industrial control panel:

```text
SCHENGEN STATUS

PERMITTED

Used in window:       75 / 90
Remaining today:      15
Trip must end by:     13 Oct 2026
Committed trips safe: YES

[Add trip] [Explain calculation] [Export report]
```

### Visual language
- Functional, almost medical/instrument-panel clarity.
- Strong labels.
- Monochrome with status color.
- No gradients, no metaphor, no cute travel illustrations.
- Grid alignment and plain language.

### Interaction
- Inputs are explicit and forgiving.
- Every action has predictable consequences.
- Explanation is a ledger, not a story.

### Strength
Very trustworthy. Excellent for anxious users who want a serious tool.

### Risk
Can feel cold and less consumer-friendly. The app might look like it was built by a Swiss border officer with a fondness for rectangles. Not necessarily bad.

### Best use
Current-status mode, older users, second-home owners, professional/legal-adjacent context.

---

# My recommendation

Do not pick only one. Combine them deliberately:

1. **Default home:** Jony Ive calm permission object.
2. **Planner interaction:** Bret Victor explorable simulator.
3. **Explanation/report:** Edward Tufte evidence ledger.
4. **Form/current-status mode:** Dieter Rams compliance appliance.

That gives us emotional clarity plus mathematical trust.

# Next sketches to build

Build four disposable HTML variants:

1. `002-ive-calm-permission-object`
2. `003-tufte-evidence-ledger`
3. `004-victor-explorable-simulator`
4. `005-rams-compliance-appliance`

Then compare them against the current mock on:

- answer speed
- trust
- anxiety reduction
- clarity of rolling 180-day rule
- mobile feasibility
- perceived willingness to pay

# Other possible visionary lenses

Useful later, but not first four:

- **Don Norman:** brutal human-centered affordances; every error state anticipates real user confusion.
- **Susan Kare:** friendly icon language; make Schengen feel less bureaucratic and more humane.
- **Massimo Vignelli:** transit-map clarity; routes, zones, and dates as an elegant travel diagram.
- **Charles & Ray Eames:** educational playfulness; teach the rule through models and motion.
- **Dieter Rams + Tufte hybrid:** the serious advisor/pro interface.
