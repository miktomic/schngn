---
target: apps/web design system and mocks
total_score: 26
p0_count: 3
p1_count: 7
timestamp: 2026-07-08T22-54-25Z
slug: apps-web-design-system-and-mocks
---
✅ UPDATED: integrated both asynchronous subagent assessments: design-director review plus deterministic/browser evidence. Parent evidence and subagent findings now agree: the identity direction is strong, but the production UI has not caught up to the system.

# SCHNGN Design System and Mock Critique

Target: `apps/web` design system and mocks

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Mocks make the verdict obvious, but the current app demo renders a different scenario from the mocks. |
| 2 | Match System / Real World | 3 | "Italy fits" and "safe buffer days" work. "Protected" language is misleading and should be replaced. |
| 3 | User Control and Freedom | 2 | Planner and edit flows are planned but not present in the current app shell. |
| 4 | Consistency and Standards | 2 | Pencil identity, Tufte mock, synthesis mock, and current Svelte shell use different palettes, radii, and type. |
| 5 | Error Prevention | 3 | Risk panels explain over-limit states, but booked versus what-if distinction still needs hard rules. |
| 6 | Recognition Rather Than Recall | 3 | Timeline and trip lists expose evidence, but dense Tufte proof needs progressive disclosure on mobile. |
| 7 | Flexibility and Efficiency | 2 | The Victor-style simulator is the right differentiator, but it is not yet implemented as a reusable flow. |
| 8 | Aesthetic and Minimalist Design | 3 | Identity board is coherent. Current code still has blue gradients, Inter, large radii, and heavy shadows. |
| 9 | Error Recovery | 2 | Unsafe mock states name the problem and first fix, but no concrete correction workflow exists yet. |
| 10 | Help and Documentation | 3 | "Why safe" and proof ledger are strong. Non-Schengen exclusions and disclaimer placement need screen-level treatment. |
| **Total** | | **26/40** | **Promising direction, not yet a unified system.** |

## Anti-Patterns Verdict

**LLM assessment:** The v2 identity board does not feel like generic AI output. It has a specific point of view: paper, ink, evidence, rolling-window proof. The current Svelte UI does feel closer to a generic AI/SaaS prototype: Inter, blue radial gradient, 34px phone radius, 28px metric card radius, and a large soft shadow.

**Deterministic scan:** `node .agents/skills/impeccable/scripts/detect.mjs --json apps/web/src/routes/+page.svelte apps/web/src/routes/app/+page.svelte` returned `[]`. Scanning `apps/web/src` also returned `[]`. No bundled detector findings.

**Source evidence:** `apps/web/DESIGN.md` defines 14 color tokens, but current UI source uses 27 unique hex colors across the target UI files, with `0 / 27` matching the new design tokens. Source still has `0` references to Source Sans 3 and IBM Plex Mono. Tight tracking appears in `+page.svelte:77` and `app/+page.svelte:123` at `-0.07em`, beyond the `-0.04em` floor in `DESIGN.md`. Resting shadows, 24px+ radii, and gradients still appear in the Svelte shell.

**Accessibility evidence:** Sampled text contrast passed WCAG AA in 12/12 tested text pairs, but timeline segment non-text contrast fails for France (`#61a5fa`, 2.17:1) and Italy (`#16a34a`, 2.82:1) against the track/background. Timeline spans expose visible country names, but `title` attributes do not expose date ranges well for touch/mobile or assistive tech.

**Browser evidence:** `/` and `/app` rendered without JS console errors. Computed styles on `/app` confirmed Inter, blue radial background, `34px` phone radius, `28px` metric card radius, and `0 28px 90px rgba(...)` shadow. The rendered app scenario showed `46 safe buffer days` and `44 / 90`, while the Pencil mocks and identity docs use the canonical `15 safe buffer days` and `75 / 90` scenario. URL scanning via Impeccable was skipped because Puppeteer is not installed and was not added to avoid dependency churn.

## Overall Impression

The Tufte direction is the right soul of the product. The v2 identity board is strong enough to become canonical. The problem is drift: the production Svelte shell, the older synthesis mock, and the new identity board are not yet speaking the same visual language.

The biggest opportunity is to lock the identity now, then generate/build all screens from the same answer card, rolling-window timeline, and proof-ledger component vocabulary.

## What's Working

1. **The paper-and-ink evidence direction is ownable.** It makes SCHNGN feel like an instrument rather than a travel lifestyle app.
2. **The semantic state model is strong.** Safe, booked, what-if, and risk can become a durable product vocabulary if the colors and labels stay consistent.
3. **The rolling-window mark is the right logo direction.** It encodes the actual product idea without falling into travel clipart.

## Priority Issues

### [P1] Canonical identity is not yet implemented in code

**Why it matters:** If the team builds screens from the current Svelte shell, SCHNGN will inherit the wrong brand: blue fintech gradient, Inter, over-rounded cards, and heavy shadows.

**Fix:** Treat `apps/web/DESIGN.md` as source of truth. Replace app CSS with tokens for paper, ink, line, safe, booked, what-if, and risk. Move from shadow-heavy cards to bordered ledger surfaces.

**Suggested command:** `$impeccable polish apps/web/src/routes/app/+page.svelte`

### [P1] Scenario data is inconsistent across mocks and app

**Why it matters:** The mocks teach one story: 75/90, 15 safe buffer days. The app renders another: 44/90, 46 buffer days. This undermines design review because hierarchy, copy, and component sizing are scenario-dependent.

**Fix:** Use a shared demo fixture for Pencil prompts, docs, and Svelte demo state. If the canonical scenario is 75/90, add prior counted trips or update all mock copy to 44/90.

**Suggested command:** `$impeccable harden apps/web/src/routes/app/+page.svelte`

### [P0] Engine, privacy, and legal trust contracts must lead UI polish

**Why it matters:** The UI promises explainable correctness and private calculation. If the engine cannot prove every counted day, or if waitlist/analytics/report flows collect trip details, the design becomes a liability.

**Fix:** Keep US-01 engine correctness ahead of UI polish. For waitlist, analytics, report, or fake-door flows, capture email/intent only and never trip dates, itinerary histories, calculated timelines, names, passports, or legal status.

**Suggested command:** `$impeccable harden privacy-and-proof-contract`

### [P1] "Protected" language is dangerous product copy

**Why it matters:** "Booked, protected" or "Greece remains protected" can imply legal entitlement or official safety. Even "Booked, not protected" may put the wrong word in the user’s head.

**Fix:** Prefer "Booked trip counted" or "Booked, counted". Use explanatory copy when needed: "Booked means included in this plan; it does not change the legal limit."

**Suggested command:** `$impeccable clarify apps/web/src/routes/app/+page.svelte`

### [P2] Tufte proof density needs progressive disclosure

**Why it matters:** The dense evidence ledger is excellent for trust, but too much proof on the default mobile screen can bury the answer.

**Fix:** Default screen: answer card plus compact rolling-window preview. Explanation screen/report: full Tufte proof ledger, counted trips, days returning soon, and inclusive-counting details.

**Suggested command:** `$impeccable shape calculation-proof-ledger`

### [P2] Timeline component needs a strict anatomy

**Why it matters:** The timeline is SCHNGN's core differentiator. If every screen redraws it differently, users will relearn the rule each time.

**Fix:** Define one rolling-window timeline component with tokens for active frame, past trip, booked trip, what-if trip, returned day, buffer, and risk extension. Use amber for what-if everywhere.

**Suggested command:** `$impeccable extract rolling-window-timeline`

### [P2] Logo direction is good but not final

**Why it matters:** The rolling-window mark is conceptually right, but Pencil's wordmark and icon proportions should not be treated as finished brand design.

**Fix:** Lock direction, not exact geometry: rolling 180-day window mark plus SCHNGN wordmark. Manually refine spacing, 32px app-icon readability, and one-color usage before generating every screen.

**Suggested command:** `$impeccable shape logo-and-app-icon-system`

## Persona Red Flags

**Jordan, first-time anxious traveler:** The current app says "Italy fits", but the proof uses dates and counts that do not match the mock story. If Jordan compares a design screenshot to the live app, trust drops immediately.

**Alex, power planner:** The concept promises what-if simulation, days returning, and fix suggestions, but the current app shell has no control surface. Alex will hit the ceiling quickly.

**Sam, accessibility-sensitive traveler:** The identity board's semantic colors are promising, but current code relies on color-heavy timeline segments, two non-text timeline segments fail 3:1 contrast, and date ranges are not exposed well beyond `title` attributes.

## Minor Observations

- The landing page has two CTAs pointing to `/app`: "Open calculator" and "See how it works". They are different labels for the same action.
- Current source uses 27 unique hex colors across target UI files; none match the 14 canonical tokens in `apps/web/DESIGN.md`.
- Current display letter spacing is too tight at about `-0.07em`; the identity spec sets a safer floor.
- Current app global font is Inter. It should become Source Sans 3 once font loading is added.
- Current app background uses cool blue radial gradient. Canonical direction is paper with mint only for meaningful safe surfaces.
- The synthesis mock's purple trip segment should be replaced with amber.
- The risk mock is directionally strong because it keeps the overage visible instead of hiding the bad news.

## Questions to Consider

1. Should the canonical demo scenario remain `75 / 90` and `15 safe buffer days`, or should the app's starter fixture change all docs and mocks to `44 / 90` and `46 safe buffer days`?
2. Should the first Pencil screen batch start from the compact mobile sample in the identity board or the richer synthesis mock layout?
3. Should the hero metric be "15 safe buffer days" or "Safe through Oct 13"?
4. Should the logo be locked as rolling-window mark plus wordmark now, with manual refinement later, or do we need one more focused logo Pencil pass?
5. What exactly does the "Border-ready report" contain, and how do we prevent it from implying official/legal approval?
