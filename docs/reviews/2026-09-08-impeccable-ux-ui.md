# SCHNGN calculator UX/UI improvements

Completed locally on 8 September 2026. Tracking: https://github.com/miktomic/mg-hq/issues/5. Release preparation began on 9 September 2026; deployment is pending. The verification below records the original local pass, with release gates and production verification to be recorded after they complete.

The Impeccable 3.9.1 independent design and technical reviews identified temporal ambiguity in the main result, unnecessary mobile entry friction, and keyboard recovery gaps. The baseline critique is in `.impeccable/critique/2026-09-08T21-00-31Z__apps-web-src-routes-app-page-svelte.md` (27/40, first run; no post-change score claimed).

## Changes

- Display the calculation date immediately beside the dominant verdict. Identify the first over-limit checkpoint explicitly, using labels provided in all 17 locales. The existing calculation algorithm and result values are unchanged.
- Consolidate first-run setup into one block with Add new trip and the existing secondary no-trip action. Render timeline/trip scaffolding after history is available; legacy hash navigation falls back to the setup block while empty.
- Put required entry/exit dates before the calendar and optional label. Remove repeated modal preamble, add an accessible top dismissal button, and keep Save/Cancel in a sticky action row.
- Focus the first invalid control after failed save. Return focus to an adjacent trip or Add new trip after deletion.
- Use the existing localized Entry date / Exit date terminology in date adjustment, including slider labels.
- Omit hypothetical extension cutoff decoration for unchanged completed trips without an actual conflict. Label the safe-exit result when shown, avoiding duplication in ongoing stays.
- Increase calendar month navigation and language control touch targets to 44px.

## Verification

- `bun run check`: passed; 432 tests, zero failures; Svelte check zero errors/warnings; production builds and compiled agent smoke passed.
- `bun run test:e2e`: 38 passed. Includes guest privacy payload checks, offline/PWA behavior, calendar keyboard/touch controls, account flows with mocked auth, responsive layouts, RTL, and new regressions for focus recovery, result dates, completed-history presentation, and all 17 locales at 320px with reduced motion.
- Manual native browser: 390px mobile form screenshot confirmed required dates, top dismissal, Save, and Cancel in the opening viewport. Invalid save focused `trip-entry` with `aria-invalid=true`. Synthetic September 8–18 stay produced 11 counted days and 79 buffer days, explicitly dated September 18. Hebrew screenshot at 320px showed correct RTL layout and document width exactly 320px. Synthetic trip deleted through UI; focus returned to Add new trip; English and viewport restored; owned tab closed.
- Scoped Impeccable detector after changes returned `[]`; `git diff --check` passed.

## Limits

No production authentication or contact submission tested manually; local Turnstile configuration is unavailable. Existing build chunk-size warning remains. Browser emulation and DOM checks do not replace a real screen-reader or native-speaker review of the new labels. Existing reviewed rule copy was preserved. No detector overlay was injected because native browser evaluation is read-only; static detector and native visual/DOM evidence were used. Development HMR errors during edits/build regeneration were resolved by final checks and reload; no claim of a clean uninterrupted console session is made.

The preexisting `.codex/config.toml` and `docs/research/` work was preserved. Review server stopped. Critique temporary body removed; snapshot write and trend read succeeded. Minor baseline observations (redundant Expand tab stop and generic route label) remain outside this focused pass.
