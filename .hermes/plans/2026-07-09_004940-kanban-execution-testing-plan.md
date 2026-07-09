# SCHNGN Kanban Execution and Testing Plan

> **For Hermes:** Use `test-driven-development` for every behavior change. Implement one vertical slice at a time. Do not advance to UI polish until US-01/US-02/US-03 are green with robust fixtures.

**Goal:** Turn the current SCHNGN scaffold into a real functioning local-first Schengen 90/180 PWA without compromising correctness, privacy, or trust.

**Current context:**

- Current app is live at `https://schngn.com`, but functionally it is still a scaffold.
- Current engine has starter behavior in `packages/engine/src/index.ts` and 6 tests in `packages/engine/tests/engine.test.ts`.
- Current app route `apps/web/src/routes/app/+page.svelte` uses hard-coded demo trips.
- Current waitlist endpoint exists at `apps/web/src/routes/api/waitlist/+server.ts`, but provider/storage is not finalized.
- No real trip CRUD, local repository, import/export, analytics wrapper, simulator UI, PWA service worker, or EC-parity fixture suite exists yet.

**Architecture principle:**

- `packages/engine`: pure TypeScript, no browser/Worker/Bun APIs.
- `apps/web`: SvelteKit UI, browser-only trip storage, tiny Worker route for waitlist only.
- CI: Node 24 tooling, Bun 1.3.14 scripts, Cloudflare Workers deployment.
- Privacy: no trip dates/history/calculation timelines to servers or analytics.

---

## Execution policy

1. Keep WIP at one story until US-01 is trustworthy.
2. Use RED-GREEN-REFACTOR for every behavior.
3. Add narrow tests first, run and observe failure, then implement.
4. Run narrow tests after each slice; run `npx -y bun@1.3.14 run check` before declaring a card done.
5. For UI cards, smoke-test `/app` in browser and check console errors.
6. For privacy-sensitive cards, inspect network payloads manually.
7. For production-facing cards, verify local, preview/build, and post-deploy behavior.

---

# Card-by-card plan

## US-01 — Rolling 180-day calculation engine

**Execution:**

- Create fixture structure under `packages/engine/tests/fixtures/`.
- Add EC-parity fixture format: trips, reference date, expected used days, expected remaining, notes/source.
- Add 40–60 fixtures covering exact 180-day inclusivity, overlapping trips, adjacent trips, same-day trips, excluded countries, non-EU Schengen countries, leap years, year boundaries, over-limit states, future trips, and historical trips dropping out.
- Add property tests for invariants: no double-counting physical days, adding excluded-country trips does not change usage, usage cannot exceed unique counted days, old days drop one-by-one at the 180-day boundary.
- Refactor engine internals only after fixtures are green.

**Files:**

- Modify: `packages/engine/src/index.ts`
- Modify/Create: `packages/engine/tests/engine.test.ts`
- Create: `packages/engine/tests/fixtures/ec/*.json`
- Optional create: `packages/engine/tests/properties.test.ts`

**Tests:**

- `npx -y bun@1.3.14 test packages/engine/tests`
- `npx -y bun@1.3.14 run check`

**Done when:**

- EC fixture suite passes.
- Boundary/property tests pass.
- CI fails if engine behavior drifts.

## US-02 — Latest safe exit date calculation

**Execution:**

- Specify `latestSafeExitDate` contract precisely: returns `null` when the entry day itself is unsafe; returns last safe inclusive exit date otherwise.
- Add tests where exit date is safe and exit+1 is unsafe.
- Cover already-at-limit, over-limit, excluded-country, overlapping-with-existing, and days-coming-back during the candidate stay.
- Ensure algorithm does not rely on arbitrary short search limits for valid trips.

**Files:**

- Modify: `packages/engine/src/index.ts`
- Modify/Create: `packages/engine/tests/engine.test.ts` or `packages/engine/tests/latest-safe-exit.test.ts`

**Tests:**

- `npx -y bun@1.3.14 test packages/engine/tests/latest-safe-exit.test.ts`
- `npx -y bun@1.3.14 test packages/engine/tests`

**Done when:**

- For every fixture, returned date is safe and date+1 is unsafe.
- `null` behavior is explicit and tested.

## US-03 — Overstay / verdict flag

**Execution:**

- Decide whether classifier accepts `daysRemaining` only or full `UsageResult` so true over-limit can show over-by days.
- Add boundary tests for 82/83/89/90/91 days used.
- Expose display-ready labels without legal-advice copy.

**Files:**

- Modify: `packages/engine/src/index.ts`
- Modify/Create: `packages/engine/tests/verdict.test.ts`

**Tests:**

- `npx -y bun@1.3.14 test packages/engine/tests/verdict.test.ts`
- `npx -y bun@1.3.14 run check`

**Done when:**

- OK, close, and over states are unambiguous.
- Over-limit still exposes `overBy`.

## US-04 — Add / edit / delete a trip

**Execution:**

- Add app-level trip model with stable `id`, `entryDate`, `exitDate`, optional `countryCode`, `label`, and maybe `status` for booked/what-if later.
- Create validation utilities independent of Svelte components.
- Build mobile form: add, edit, delete, inline validation, equal date allowed, exit-before-entry rejected.
- Wire CRUD to in-memory store first; persistence is US-05.

**Files:**

- Create: `apps/web/src/lib/trips/types.ts`
- Create: `apps/web/src/lib/trips/validation.ts`
- Create: `apps/web/src/lib/stores/trips.svelte.ts` or Svelte store equivalent
- Create/Modify: `apps/web/src/lib/components/TripForm.svelte`
- Create/Modify: `apps/web/src/lib/components/TripList.svelte`
- Modify: `apps/web/src/routes/app/+page.svelte`

**Tests:**

- Unit tests for validation.
- Component/integration tests for add/edit/delete once test runner is added.
- Manual browser QA on mobile viewport.

**Done when:**

- User can manage trips without hard-coded demo data.
- List re-sorts and recalculates immediately.

## US-05 — Local-only persistence, no account

**Execution:**

- Choose localStorage first unless IndexedDB is needed; simpler is better for MVP.
- Implement repository abstraction so UI never touches raw storage directly.
- Add schema versioning and safe migration path.
- Add storage-disabled warning.
- Add visible privacy message: trips stay on this device.

**Files:**

- Create: `apps/web/src/lib/data/tripRepository.ts`
- Create: `apps/web/src/lib/data/storageAvailability.ts`
- Modify: trip store and `/app` route

**Tests:**

- Repository tests with mocked `Storage`.
- Reload manual QA.
- DevTools Network audit: no trip dates sent.

**Done when:**

- Trips survive reload/reopen.
- Network audit proves no trip payloads leave browser.

## US-06 — JSON export / import

**Execution:**

- Define export schema with version and trips.
- Implement JSON download using browser Blob/ObjectURL.
- Implement import parser with strict validation and clear errors.
- Recalculate after import.

**Files:**

- Create: `apps/web/src/lib/import-export/schema.ts`
- Create: `apps/web/src/lib/import-export/json.ts`
- Create/Modify: import/export components

**Tests:**

- Round-trip tests.
- Malformed JSON/schema rejection tests.
- Manual corrupt-file import QA.

**Done when:**

- Export/import works without server calls.
- Bad import does not corrupt existing trips.

## US-07 — Dashboard: days used / remaining / status

**Execution:**

- Replace hard-coded demo dashboard with state-driven dashboard.
- Use production direction from `synthesis-compelling-mock`.
- Create scenario fixtures for dashboard states: safe, close, over, no trips, future planned trip.
- Keep answer above fold: status, remaining days, latest safe exit.

**Files:**

- Create: `apps/web/src/lib/components/DashboardSummary.svelte`
- Create: `apps/web/src/lib/components/StatusBadge.svelte`
- Modify: `apps/web/src/routes/app/+page.svelte`
- Possibly create: `apps/web/src/lib/calculation/viewModel.ts`

**Tests:**

- View-model tests for five scenarios.
- Browser smoke at mobile viewport.
- WCAG AA contrast check / Impeccable audit.
- 200% zoom manual QA.

**Done when:**

- A real user can see the answer without reading the machinery.

## US-09 — Future-trip simulator, “Can I book this?”

**Execution:**

- Add non-mutating simulator state.
- Compute verdict for proposed entry/exit without saving it.
- Show max additional days for proposed start date.
- Add clear/reset.

**Files:**

- Create: `apps/web/src/lib/simulation/simulateTrip.ts`
- Create: `apps/web/src/lib/components/TripSimulator.svelte`
- Modify: `/app` page

**Tests:**

- Engine-level tests for simulated candidate trips.
- Store/UI tests proving saved trips unchanged.
- Manual clear/reset QA.

**Done when:**

- User can answer “Can I book this?” without mutating saved history.

## US-08 — Days coming back calendar/timeline visualization

**Execution:**

- Add engine helper to compute future availability by date.
- Keep visualization deterministic and accessible before making it fancy.
- Handle 50 trips under 300ms.
- Mark next date allowance improves.

**Files:**

- Add: `packages/engine/src/index.ts` helper or new module.
- Add tests under `packages/engine/tests/availability.test.ts`.
- Create: `apps/web/src/lib/components/AvailabilityTimeline.svelte`

**Tests:**

- Fixed trip-set assertions.
- Performance test with ~50 trips.
- Browser accessibility/manual screen-reader sanity check.

**Done when:**

- Timeline shows when days come back and remains fast.

## US-10 — Disclaimers and “not legal advice” framing

**Execution:**

- Finalize fixed copy; no AI-generated legal wording at runtime.
- Add persistent footer and first-run dismissible notice.
- Add official EC/EES links.
- Store dismissal locally only.

**Files:**

- Create: `apps/web/src/lib/copy/disclaimers.ts`
- Create: `apps/web/src/lib/components/DisclaimerNotice.svelte`
- Modify: layout/app page

**Tests:**

- Copy visibility checks.
- Link checks.
- Manual first-run dismissal/reload QA.

**Done when:**

- Legal framing is visible without burying the product.

## US-11 — “Why this number?” plain-English explainer

**Execution:**

- Create calculation explanation view-model from engine output.
- Use human-reviewed copy fragments only.
- Explain counted days, 180-day window, and why old trips still count.

**Files:**

- Create: `apps/web/src/lib/explain/explanationModel.ts`
- Create: `apps/web/src/lib/components/CalculationExplainer.svelte`

**Tests:**

- Explanation model tests against known fixtures.
- Accuracy review against EC guidance.
- 3-user comprehension test notes.

**Done when:**

- User can understand the number without reading a statute or accidentally calling a lawyer.

## US-15 — Privacy-friendly analytics funnel

**Execution:**

- Choose provider: Plausible, Fathom, or PostHog.
- Implement a tiny analytics wrapper with typed allowed events.
- Payload allowlist only: no dates, no names, no country sequences, no email.
- Add development logger/test mode.

**Files:**

- Create: `apps/web/src/lib/analytics/events.ts`
- Create: `apps/web/src/lib/analytics/client.ts`
- Modify: landing/app/fake-door/waitlist flows

**Tests:**

- Unit tests asserting event payload schemas exclude forbidden fields.
- Manual network inspection for each event.
- Provider dashboard receipt check.

**Done when:**

- Events arrive and payloads are privacy-safe.

## US-13 — Border-ready PDF export fake-door

**Execution:**

- Add honest CTA from dashboard.
- On click: log `pdf_buy_intent`, show coming-soon/early-access modal, optionally email capture.
- Do not build real PDF generation yet unless validation says yes.

**Files:**

- Create: `apps/web/src/lib/components/FakeDoorCta.svelte`
- Create: `apps/web/src/lib/components/EarlyAccessModal.svelte`
- Modify dashboard route

**Tests:**

- Event fires once per click.
- Modal/message displays.
- No payment flow invoked.
- Network payload contains no trip data.

**Done when:**

- We can measure interest without accidentally selling vaporware with a Stripe costume.

## US-14 — Paid unlock fake-door + pricing A/B

**Execution:**

- Decide price buckets/currency.
- Persist assignment locally so reload keeps same bucket.
- Expose premium CTA after relevant simulator/dashboard moments.
- Log assigned bucket and buy intent without trip data.

**Files:**

- Create: `apps/web/src/lib/monetization/priceBucket.ts`
- Create/Modify: premium CTA components
- Modify analytics events

**Tests:**

- Bucket distribution unit test.
- Persistence test.
- Event payload test.
- Reload manual QA.

**Done when:**

- Buy-intent measurement works and is honest.

## US-18 — Waitlist / email capture

**Execution:**

- Choose provider/storage: Cloudflare KV/D1 or external email provider.
- Add GDPR consent copy.
- Ensure email is stored separately from trip data.
- Make `/api/waitlist` reject unknown payload fields if needed.

**Files:**

- Modify: `apps/web/src/routes/api/waitlist/+server.ts`
- Create: `apps/web/src/lib/components/WaitlistForm.svelte`
- Add provider/binding config if chosen

**Tests:**

- API tests for valid/invalid email and malformed JSON.
- Manual submit confirmation.
- Provider dashboard/storage verification.
- Consent copy visible.

**Done when:**

- Email capture works in production and remains separate from trips.

## US-16 — SEO landing page, niche-targeted

**Execution:**

- Decide first target angle: UK second-home owners, frequent travelers, or remote workers.
- Rewrite landing page for that niche.
- Add trust copy, CTA, privacy promise, and long-tail metadata.
- Keep page fast and mobile-first.

**Files:**

- Modify: `apps/web/src/routes/+page.svelte`
- Modify: `apps/web/static/robots.txt` if needed
- Possibly create content sections/components

**Tests:**

- Lighthouse SEO/performance target >= 90.
- Meta/canonical checks.
- Mobile viewport QA.
- Ad-campaign landing sanity check.

**Done when:**

- Landing page can convert cold traffic to calculator starts/waitlist.

## US-12 — Accuracy trust signal

**Execution:**

- Once US-01 is robust, add trust claim.
- Decide whether to publish public validation cases.
- Link to EC calculator/source references.
- Avoid overstating certification.

**Files:**

- Modify landing/app dashboard.
- Optional create: `apps/web/src/routes/accuracy/+page.svelte`
- Optional create: generated static validation summary from fixtures.

**Tests:**

- Claim/link presence tests/manual check.
- Public page loads if included.
- Claim language review.

**Done when:**

- Trust signal is evidence-backed, not marketing confetti.

## US-17 — Installable PWA + offline

**Execution:**

- Audit current `manifest.json`.
- Add service worker with SvelteKit-compatible strategy.
- Cache app shell and engine JS.
- Ensure calculator works offline after first load.
- Avoid caching dynamic waitlist submission as if it succeeded.

**Files:**

- Modify: `apps/web/static/manifest.json`
- Create: service worker route/file depending on SvelteKit approach
- Modify app shell as needed

**Tests:**

- Lighthouse PWA checks.
- iOS install manual test.
- Android install manual test.
- Airplane-mode calculator test.
- Offline waitlist failure UX check.

**Done when:**

- The calculator is usable offline after first load.

---

# Missing for a real functioning app

## Correctness

- Full EC-parity fixture suite.
- Property/golden-master tests.
- Explicit public validation source policy.
- Clear handling of excluded edge cases: residence permits, bilateral waivers, Brazil exception, legal status complexities.

## App functionality

- Real trip CRUD.
- Local persistence repository.
- Import/export.
- State-driven dashboard instead of hard-coded demo trips.
- Simulator that does not mutate saved trips.
- Days-coming-back view.
- First-run/disclaimer flow.
- Explanation model tied to actual calculation output.

## Testing infrastructure

- Browser/component/integration test runner, likely Playwright for E2E and Vitest or Bun tests for pure TS UI utilities.
- Accessibility/contrast checks.
- Lighthouse checks.
- Network privacy audit procedure.
- Performance test for availability visualization.

## Product decisions

- Analytics provider.
- Waitlist/email provider.
- Price buckets/currency.
- Legal/disclaimer copy.
- Official EC/EES references.
- Public validation page yes/no.
- First target segment for landing page/ad campaign.
- `www.schngn.com` redirect policy.

## Production operations

- Waitlist storage binding/provider configured.
- Privacy-safe analytics configured.
- Post-deploy smoke test script.
- Optional error monitoring without leaking trip data.
- Backup/export guidance for users because data is local-only.

---

# Recommended implementation sequence

1. US-01 engine parity suite.
2. US-02 latest safe exit.
3. US-03 verdict classifier.
4. Add test infrastructure for app utilities and E2E.
5. US-04 trip CRUD in memory.
6. US-05 local persistence + privacy audit.
7. US-06 import/export.
8. US-07 real dashboard.
9. US-09 simulator.
10. US-08 days-coming-back.
11. US-10 disclaimer.
12. US-11 explainer.
13. Decide analytics/waitlist/pricing/legal copy.
14. US-15 analytics.
15. US-13 PDF fake-door.
16. US-14 paid unlock fake-door.
17. US-18 waitlist.
18. US-16 landing page.
19. US-12 accuracy page/signal.
20. US-17 PWA/offline.

---

# Standard verification commands

```bash
npx -y bun@1.3.14 test packages/engine/tests
npx -y bun@1.3.14 run test
npx -y bun@1.3.14 run typecheck
npx -y bun@1.3.14 run build
npx -y bun@1.3.14 run check
cd apps/web && npx -y bun@1.3.14 run dev -- --host 127.0.0.1 --port 5173
```

For UI cards:

- Open `/app` in browser.
- Check browser console.
- Test mobile viewport.
- Test keyboard navigation.
- Inspect network payloads if analytics/waitlist/fake-door is involved.

For deployment cards:

- Push only after local `run check` passes.
- Watch GitHub Actions.
- Verify `https://schngn.com/` and `https://schngn.com/app`.
- Confirm no console errors.
