<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateUsageOnDate } from '@schngn/engine';
  import { formatDate, intlLocale, type Locale } from '$lib/i18n';
  import { createAppDeepUiTranslator } from '$lib/i18n/appDeepUi';
  import { formatLocalizedCount } from '$lib/i18n/appRuntimeUi';
  import { createAppUiTranslator } from '$lib/i18n/appUi';
  import { countryGuideUi } from '$lib/i18n/countryGuideUi';
  import { explainerUi } from '$lib/i18n/explainerUi';
  import { buildExplainerScenario } from '$lib/explainer/explainerScenario';
  import { createTripOnboardingTranslator } from '$lib/i18n/tripOnboardingUi';
  import { formatAdjusterFeedback } from '$lib/i18n/whatIfUi';
  import { buildReturningDaysForecast } from '$lib/returns/returningDays';
  import { countTripSchengenDays, currentLocalIsoDate, toEngineTrips, tripEntryDate, tripExitDate, type EditableTrip } from '$lib/trips/tripCrud';
  import { assignTripColors } from '$lib/trips/tripCardState';
  import StatusChip from './StatusChip.svelte';
  import TimelineLedger from './TimelineLedger.svelte';
  import TripMiniTimeline from './TripMiniTimeline.svelte';

  interface Props { locale: Locale; }
  let { locale }: Props = $props();

  let referenceDate = $state(currentLocalIsoDate());
  let step = $state(0);
  let observer: IntersectionObserver | null = null;
  const stepNodes = new Map<number, HTMLElement>();
  const visibleStepRatios = new Map<number, number>();

  let copy = $derived(explainerUi(locale));
  let countryGuide = $derived(countryGuideUi(locale));
  let deep = $derived(createAppDeepUiTranslator(locale));
  let appUi = $derived(createAppUiTranslator(locale));
  let tripOnboarding = $derived(createTripOnboardingTranslator(locale));
  let scenario = $derived(buildExplainerScenario(referenceDate, copy.sampleOne, copy.sampleTwo));
  let trips = $derived<EditableTrip[]>(scenario.trips);
  let visibleTrips = $derived(step < 2 ? [] : step < 5 ? trips.slice(0, 1) : trips);
  let colors = $derived(assignTripColors(trips));
  let usage = $derived(calculateUsageOnDate(toEngineTrips(visibleTrips, referenceDate), referenceDate));
  let returningForecast = $derived(buildReturningDaysForecast(visibleTrips, { referenceDate, horizonDays: 180 }));
  let resultLabel = $derived(formatAdjusterFeedback(locale, usage.overBy, usage.daysRemaining));

  onMount(() => {
    referenceDate = currentLocalIsoDate();
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const index = Number((entry.target as HTMLElement).dataset.explainerStep);
        visibleStepRatios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      const active = [...visibleStepRatios.entries()]
        .filter(([, ratio]) => ratio > 0)
        .sort((left, right) => right[1] - left[1] || left[0] - right[0])[0];
      if (active) {
        step = active[0];
      } else {
        const firstTop = stepNodes.get(0)?.getBoundingClientRect().top;
        const lastBottom = stepNodes.get(copy.steps.length - 1)?.getBoundingClientRect().bottom;
        if (firstTop !== undefined && firstTop > window.innerHeight * 0.55) step = 0;
        if (lastBottom !== undefined && lastBottom < window.innerHeight * 0.45) step = copy.steps.length - 1;
      }
    }, {
      rootMargin: '-24% 0px -44% 0px',
      threshold: [0, 0.15, 0.35, 0.6]
    });
    for (const node of stepNodes.values()) observer.observe(node);
    return () => observer?.disconnect();
  });

  function observeStep(node: HTMLElement, index: number): { destroy(): void } {
    stepNodes.set(index, node);
    observer?.observe(node);
    return {
      destroy() {
        observer?.unobserve(node);
        stepNodes.delete(index);
        visibleStepRatios.delete(index);
      }
    };
  }

  function dateRange(trip: EditableTrip): string {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${formatDate(locale, tripEntryDate(trip), options)} - ${formatDate(locale, tripExitDate(trip), options)}`;
  }

  function countryName(code: string): string {
    return new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(code) ?? code;
  }

  function routeLabel(trip: EditableTrip): string {
    const entry = countryName(trip.entryCountryCode ?? 'IT');
    const exit = countryName(trip.exitCountryCode ?? trip.entryCountryCode ?? 'IT');
    return `${entry} → ${exit}`;
  }

  function openCountryGuide(): void {
    if (typeof document === 'undefined') return;
    const details = document.querySelector<HTMLDetailsElement>('#schengen-countries details');
    if (details) details.open = true;
  }
</script>

<section class="walkthrough" data-active-step={step} aria-label={copy.stepLabel}>
  <div class="walkthrough-layout">
    <div class="story-steps">
      {#each copy.steps as item, index}
        <article
          class="story-step"
          class:current={step === index}
          data-explainer-step={index}
          aria-current={step === index ? 'step' : undefined}
          use:observeStep={index}
        >
          <h2>{item.title}</h2>
          <p>{item.body}</p>
          {#if item.emphasis}<p class="step-emphasis">{item.emphasis}</p>{/if}
          {#if index === 0}
            <a class="country-guide-link" href="#schengen-countries" onclick={openCountryGuide}>
              {countryGuide.trigger}
            </a>
          {/if}
        </article>
      {/each}
    </div>

    <aside class="visual-column" aria-label={copy.visualLabel}>
      <div class="visual-heading">
        <span>{copy.visualLabel}</span>
        <strong aria-live="polite">{copy.steps[step].title}</strong>
      </div>

      <div class="demo-shell" aria-label={copy.steps[step].title}>
      {#key step}
        <div class="demo-stage">
          {#if step === 2}
            <section class="sample-form" aria-labelledby="sample-form-heading">
              <h3 id="sample-form-heading">{deep('addStay')}</h3>
              <label>
                <span>{deep('tripLabel')} <small>{deep('optional')}</small></span>
                <input type="text" value={copy.sampleOne} readonly />
              </label>
              <div class="date-fields">
                <label>
                  <span>{deep('entered')}</span>
                  <input type="date" value={tripEntryDate(trips[0])} readonly />
                  <small>{deep('entryCounts')}</small>
                </label>
                <label>
                  <span>{deep('left')}</span>
                  <input type="date" value={tripExitDate(trips[0])} readonly />
                  <small>{deep('exitCounts')}</small>
                </label>
              </div>
            </section>
          {/if}

          <section class="demo-timeline" aria-labelledby="demo-timeline-heading">
            <div class="demo-heading">
              <h3 id="demo-timeline-heading">{tripOnboarding('timelineTitle')}</h3>
              {#if step >= 2}
                <StatusChip tone={usage.overBy > 0 ? 'risk' : 'safe'} label={resultLabel} />
              {/if}
            </div>
            <TimelineLedger
              label={appUi('rollingWindow')}
              {locale}
              mode={usage.overBy > 0 ? 'risk' : 'safe'}
              trips={visibleTrips}
              {referenceDate}
              returnDates={step === 4 ? returningForecast.rows.map((row) => row.date) : []}
              horizonDays={returningForecast.horizonDays}
            />
          </section>

          {#if visibleTrips.length > 0}
            <section class="demo-trips" aria-labelledby="demo-trips-heading">
              <h3 id="demo-trips-heading">{tripOnboarding('nav')}</h3>
              <div class="trip-list">
                {#each visibleTrips as trip}
                  <article class="demo-trip-card" style={`--trip-color:${colors[trip.id]}`}>
                    <div class="trip-card-heading">
                      <span class="trip-color-dot" aria-hidden="true"></span>
                      <span class="trip-copy">
                        <strong><bdi>{trip.label}</bdi></strong>
                        <span class="trip-day-count"><bdi>{formatLocalizedCount(locale, countTripSchengenDays(trip), 'day').text}</bdi></span>
                        <span class="trip-route"><bdi>{routeLabel(trip)}</bdi></span>
                        <span class="trip-dates"><bdi>{dateRange(trip)}</bdi></span>
                      </span>
                    </div>
                    <TripMiniTimeline
                      {trip}
                      color={colors[trip.id]}
                      {locale}
                      {referenceDate}
                      label={`${trip.label}. ${dateRange(trip)}`}
                    />
                  </article>
                {/each}
              </div>
            </section>
          {/if}
        </div>
      {/key}
      </div>
    </aside>
  </div>
</section>

<style>
  .walkthrough { position: relative; }
  .walkthrough-layout { display: grid; grid-template-columns: minmax(250px, 0.68fr) minmax(0, 1.32fr); align-items: start; gap: clamp(36px, 6vw, 76px); }
  .story-steps { display: grid; min-width: 0; }
  .story-step { display: grid; min-height: min(74svh, 720px); align-content: center; gap: 14px; opacity: 0.42; padding: clamp(64px, 10vh, 112px) 0; transition: opacity 240ms ease, transform 240ms ease; transform: translateX(-8px); }
  :global([dir='rtl']) .story-step { transform: translateX(8px); }
  .story-step.current { opacity: 1; transform: translateX(0); }
  .story-step h2 { margin: 0; color: var(--ink); font-size: clamp(1.85rem, 4vw, 3.35rem); line-height: 1.02; letter-spacing: -0.035em; text-wrap: balance; }
  .story-step.current h2 { color: var(--safe); }
  .story-step p { max-width: 34ch; margin: 0; color: var(--muted); font-size: clamp(1.05rem, 1.8vw, 1.25rem); line-height: 1.58; text-wrap: pretty; }
  .story-step .step-emphasis { color: var(--safe); font-weight: 760; line-height: 1.4; }
  .story-step .country-guide-link { width: fit-content; color: var(--safe); font-weight: 760; text-decoration-thickness: 1px; text-underline-offset: 4px; }
  .story-step .country-guide-link:hover { color: var(--ink); }
  .story-step .country-guide-link:focus-visible { outline: 3px solid var(--safe); outline-offset: 4px; }

  .visual-column { position: sticky; top: 18px; display: grid; min-width: 0; grid-column: 2; grid-row: 1; gap: 10px; align-self: start; }
  .visual-heading { display: grid; min-width: 0; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: 10px 18px; }
  .visual-heading span { color: var(--safe); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.76rem; font-weight: 760; }
  .visual-heading strong { min-width: 0; color: var(--muted); font-size: 0.92rem; line-height: 1.3; overflow-wrap: anywhere; text-align: end; }

  .demo-shell { min-width: 0; border: 1px solid var(--control-line); border-radius: 12px; background: var(--surface); padding: 16px; box-shadow: 0 16px 44px color-mix(in srgb, var(--ink), transparent 90%); }
  .demo-stage { display: grid; gap: 20px; animation: stage-in 260ms cubic-bezier(0.22, 1, 0.36, 1); }
  .demo-timeline, .demo-trips { display: grid; gap: 10px; }
  .demo-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .demo-heading h3, .demo-trips > h3, .sample-form h3 { margin: 0; font-size: 1.25rem; line-height: 1.2; }
  .demo-timeline :global(.timeline-card) { background: var(--paper); }

  .sample-form { display: grid; gap: 14px; border-bottom: 1px solid var(--line); padding: 4px 4px 20px; }
  .sample-form label { display: grid; min-width: 0; gap: 5px; color: var(--ink); font-weight: 700; }
  .sample-form label small { color: var(--muted); font-weight: 500; line-height: 1.35; }
  .date-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .sample-form input { width: 100%; min-width: 0; min-height: 48px; border: 1px solid var(--control-line); border-radius: 8px; background: var(--surface); color: var(--ink); padding: 9px 11px; }
  .sample-form input[type='date'] { padding-inline: 10px 8px; }

  .trip-list { display: grid; gap: 10px; }
  .demo-trip-card { display: grid; min-width: 0; gap: 12px; border: 1px solid var(--line); border-radius: 10px; background: color-mix(in srgb, var(--paper), var(--trip-color) 4%); padding: 12px; }
  .trip-card-heading { display: grid; min-width: 0; grid-template-columns: 10px minmax(0, 1fr); align-items: start; gap: 4px 10px; }
  .trip-color-dot { width: 10px; height: 10px; margin-top: 5px; border-radius: 50%; background: var(--trip-color); }
  .trip-copy { display: grid; min-width: 0; gap: 2px; }
  .trip-copy > strong { color: var(--ink); font-size: 1.05rem; line-height: 1.25; overflow-wrap: anywhere; }
  .trip-copy > span { color: var(--muted); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.8rem; line-height: 1.4; overflow-wrap: anywhere; }
  .trip-copy > .trip-day-count { width: fit-content; max-width: 100%; color: var(--ink); font-size: 1.35rem; font-weight: 780; font-variant-numeric: tabular-nums; letter-spacing: -0.015em; line-height: 1.15; }
  .trip-copy .trip-route { color: var(--ink); font-family: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif; font-size: 0.85rem; font-weight: 650; }

  @keyframes stage-in { from { opacity: 0; transform: translateX(12px); } }

  @media (max-width: 900px) {
    .walkthrough-layout { grid-template-columns: minmax(0, 1fr); gap: 0; }
    .visual-column { top: 0; z-index: 3; grid-column: 1; grid-row: 1; background: var(--paper); padding: 8px 0 12px; }
    .story-steps { grid-column: 1; grid-row: 2; }
    .story-step { min-height: 68svh; padding: 52px 4px; transform: none; }
    :global([dir='rtl']) .story-step { transform: none; }
    .story-step p { max-width: 44ch; }
    .demo-shell { max-height: 58svh; overflow: hidden; padding: 12px; box-shadow: 0 10px 30px color-mix(in srgb, var(--ink), transparent 92%); }
    .demo-trips { display: none; }
  }

  @media (max-width: 560px) {
    .visual-heading { grid-template-columns: 1fr; gap: 2px; }
    .visual-heading strong { font-size: 0.82rem; text-align: start; }
    .demo-stage { gap: 10px; }
    .sample-form { gap: 8px; padding: 0 0 10px; }
    .sample-form > label { display: none; }
    .sample-form label small { display: none; }
    .sample-form input { min-height: 40px; padding-block: 6px; }
    .date-fields { gap: 8px; }
    .demo-heading { align-items: flex-start; flex-direction: column; }
    .story-step { min-height: 62svh; }
    .story-step h2 { font-size: clamp(1.75rem, 9vw, 2.6rem); }
  }

  @media (prefers-reduced-motion: reduce) {
    .story-step { transition: none; transform: none; }
    .demo-stage { animation: none; }
  }
</style>
