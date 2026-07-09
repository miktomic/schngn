# SCHNGN Pencil visual identity results

Generated with Pencil CLI 0.2.8 using the Codex agent/model path (`gpt-5.5`) on 2026-07-09.

## Artifacts

| Artifact | Path | Notes |
|---|---|---|
| Visual identity brief | `docs/pencil-visual-identity-brief.md` | Source brief for the Pencil run. |
| Pencil prompt | `sketches/pencil/prompts/schngn-visual-identity-system.md` | Short prompt attached to the brief. |
| Initial board | `sketches/pencil/schngn-visual-identity-system.pen` | First pass, generated from the Tufte evidence-ledger file. |
| Initial PNG | `sketches/pencil/exports/schngn-visual-identity-system.png` | Includes the original Tufte screen and black gutter, useful as process artifact only. |
| EU-stars identity board | `sketches/pencil/schngn-visual-identity-system-eu-stars.pen` | Updated board with Schengen constellation logo lockups, app icons, header usage, and Star Gold token. |
| EU-stars identity PNG | `sketches/pencil/exports/schngn-visual-identity-system-eu-stars.png` | Recommended image for review after Michael chose the EU-stars theme. |
| Board-only PNG | `sketches/pencil/exports/schngn-visual-identity-system-board.png` | Focused board export regenerated after replacing protected-language copy. |

## Skill setup

- Loaded `pencil-design`, `design-taste-frontend`, `product-ui-prototyping`, and `hermes-agent`.
- Confirmed the correct Impeccable install path is the npm package command: `npx impeccable install`.
- `impeccable@latest` reports the project install is already present and up to date: `.agents/skills/impeccable/` and `.github/skills/impeccable/`, skill version `3.9.1`.
- Note: the Hermes skills-hub copy of `pbakaus/impeccable` was blocked by Hermes security scanning; that is not the supported install path for this project.

## Recommended direction

Use the clean v2 board as the current identity-system candidate.

The strongest direction is:

- Tufte-inspired paper-and-ink base.
- Consumer-softened mint safe surfaces.
- Semantic status palette: safe green, booked blue, what-if amber, risk red.
- Source Sans 3 for primary UI.
- IBM Plex Mono for dates, ratios, and proof-ledger annotations.
- Custom/tight `SCHNGN` wordmark with missing vowels made intentional.
- EU-stars-inspired Schengen constellation mark as the preferred logo direction, integrated with the rolling 180-day window idea.

## Canonical palette candidate

| Token | Hex | Role |
|---|---:|---|
| `--color-paper` | `#F7F5EF` | App background, report paper |
| `--color-surface` | `#FFFFFF` | Cards and sheets |
| `--color-surface-mint` | `#EDF5F1` | Calm safe surfaces |
| `--color-ink` | `#10231F` | Primary text, logo, main CTA |
| `--color-muted` | `#4F5F59` | Body, annotations |
| `--color-line` | `#C8D1C8` | Borders, timeline rules |
| `--color-safe` | `#0F6B4F` | Safe status, local/private |
| `--color-safe-bg` | `#DFF1E9` | Safe chip background |
| `--color-booked` | `#1F5F9F` | Booked/committed trips |
| `--color-booked-bg` | `#E6EEF7` | Booked surfaces |
| `--color-whatif` | `#8A5A00` | What-if simulations |
| `--color-whatif-bg` | `#FFF1D6` | What-if surfaces |
| `--color-risk` | `#A8322A` | Over-limit state |
| `--color-risk-bg` | `#FDE8E4` | Risk surfaces |
| `--color-star-gold` | `#C8A74E` | Logo-only EU-stars constellation accent |

Contrast pairs checked before generation all passed WCAG AA.

## Taste review

What works:

- The board is coherent enough to use as a design-system foundation.
- The amber what-if state is much better than the purple from the synthesis mock.
- Status chips use color plus icon/shape, not color alone.
- The paper/ink direction preserves the Tufte credibility Michael liked.
- Logo concepts now encode rolling-window/calculation rather than generic travel.

Remaining decisions:

1. Logo direction is now locked unless Michael changes it again: EU-stars-inspired Schengen constellation mark + SCHNGN wordmark, with the stars integrated into the rolling 180-day window concept.
2. Decide whether the primary UI font should be Source Sans 3 or IBM Plex Sans. Recommendation: Source Sans 3 for readability, IBM Plex Mono for ledger data.
3. Decide whether the app should keep the paper background everywhere or use paper for report/explanation surfaces and a slightly cooler mint background for the dashboard. Recommendation: paper globally, mint only for safe-state surfaces.
4. Tighten the wordmark manually later. Pencil's wordmark is directionally good but not final brand design.

## Verification

- Pencil generated `.pen` and PNG artifacts.
- Clean v2 PNG dimensions: 2880 x 4760.
- EU-stars board artifacts were generated after Michael chose the stars theme:
  - `sketches/pencil/schngn-visual-identity-system-eu-stars.pen`
  - `sketches/pencil/exports/schngn-visual-identity-system-eu-stars.png`
  - `sketches/pencil/exports/schngn-visual-identity-system-board.png`
- Vision review confirmed the EU-stars board reads as a Schengen constellation rather than an official EU flag/emblem.
- Text verification confirmed the EU-stars `.pen` contains zero occurrences of `protected` and uses `Booked, counted` instead.
- Pencil layout scan reported no layout problems on the revised logo section.
