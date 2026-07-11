<script lang="ts">
  import type { Locale } from '$lib/i18n';
  import { createAppDeepUiTranslator } from '$lib/i18n/appDeepUi';
  import { createWhatIfUiTranslator } from '$lib/i18n/whatIfUi';
  import type { AdjustmentRange, DateAdjustment } from '$lib/simulator/whatIfDates';
  import type { TripSimulationState } from '$lib/simulator/tripSimulator';
  import type { EditableTrip } from '$lib/trips/tripCrud';
  import StatusChip from './StatusChip.svelte';
  import TimelineLedger from './TimelineLedger.svelte';
  import WhatIfAdjuster from './WhatIfAdjuster.svelte';

  interface Props {
    baseTrips: EditableTrip[];
    entryDate: string;
    entryMax?: string;
    exitDate: string;
    exitMin?: string;
    headingId?: string;
    locale?: Locale;
    onClose: () => void;
    onDatesChange: (adjustment: DateAdjustment) => void;
    onSave: () => void | Promise<void>;
    panelId?: string;
    range: AdjustmentRange;
    sourceName: string;
    state: TripSimulationState;
  }

  let {
    baseTrips,
    entryDate,
    entryMax,
    exitDate,
    exitMin,
    headingId: requestedHeadingId,
    locale = 'en',
    onClose,
    onDatesChange,
    onSave,
    panelId,
    range,
    sourceName,
    state
  }: Props = $props();

  const instanceId = $props.id();
  let headingId = $derived(requestedHeadingId ?? `${instanceId}-heading`);
  const resultId = `${instanceId}-result`;
  const timelineHeadingId = `${instanceId}-timeline-heading`;

  let deep = $derived(createAppDeepUiTranslator(locale));
  let whatIf = $derived(createWhatIfUiTranslator(locale));
  let canSave = $derived(state.valid && state.usage !== null && state.simulatedTrip !== null);
  let tone = $derived<'safe' | 'risk' | 'whatif'>(
    state.statusTone === 'risk' ? 'risk' : state.statusTone === 'safe' ? 'safe' : 'whatif'
  );
</script>

<section id={panelId} class="trip-adjust-panel" aria-labelledby={headingId} aria-describedby={resultId}>
  <header>
    <div>
      <p class="source-name">{sourceName}</p>
      <h2 id={headingId} tabindex="-1">{whatIf('title')}</h2>
    </div>
  </header>

  <WhatIfAdjuster
    {entryDate}
    {entryMax}
    {exitDate}
    {exitMin}
    {range}
    {locale}
    {onDatesChange}
  />

  {#if canSave && state.usage && state.simulatedTrip}
    <div id={resultId} class="live-result" aria-live="polite" aria-atomic="true">
      <div class="result-heading">
        <span>{whatIf('live')}</span>
        <StatusChip {tone} label={state.statusLabel} />
      </div>
      <strong class:risk={state.statusTone === 'risk'}>{state.latestSafeExitLabel}</strong>
      <p>{state.summaryCopy}</p>
    </div>

    <TimelineLedger
      headingId={timelineHeadingId}
      label={deep('whatIfWindow')}
      {locale}
      mode={state.statusTone === 'risk' ? 'risk' : 'planner'}
      trips={baseTrips}
      simulation={state.simulatedTrip}
      referenceDate={state.usage.referenceDate}
    />
  {:else}
    <div id={resultId} class="invalid-result" role="status" aria-live="polite">
      <strong>{deep('validDates')}</strong>
      <p>{deep('fixFields')}</p>
    </div>
  {/if}

  <div class="actions">
    <button class="save-action" type="button" disabled={!canSave} onclick={() => onSave()}>
      {whatIf('saveChanges')}
    </button>
    <button class="keep-action" type="button" onclick={onClose}>{whatIf('keepOriginal')}</button>
  </div>
</section>

<style>
  .trip-adjust-panel {
    display: grid;
    gap: 18px;
    border: 1px solid var(--whatif);
    border-radius: 12px;
    background: var(--whatif-bg);
    padding: clamp(16px, 3vw, 24px);
    box-shadow: none;
  }

  header,
  .result-heading,
  .actions {
    display: flex;
    align-items: center;
  }

  header,
  .result-heading {
    justify-content: space-between;
    gap: 16px;
  }

  .source-name,
  h2,
  .live-result p,
  .invalid-result p {
    margin: 0;
  }

  .source-name {
    margin-bottom: 3px;
    color: var(--whatif);
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  h2 {
    color: var(--ink);
    font-size: 1.25rem;
    line-height: 1.2;
    letter-spacing: -0.015em;
    text-wrap: balance;
  }

  .live-result,
  .invalid-result {
    display: grid;
    gap: 8px;
    border: 1px solid color-mix(in srgb, var(--whatif), transparent 54%);
    border-radius: 10px;
    background: color-mix(in srgb, var(--surface), var(--whatif-bg) 28%);
    padding: 14px;
  }

  .result-heading > span {
    color: var(--muted);
    font-size: 0.86rem;
    font-weight: 700;
  }

  .live-result > strong {
    color: var(--safe);
    font-size: 1.3rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .live-result > strong.risk {
    color: var(--risk);
  }

  .live-result p,
  .invalid-result p {
    max-width: 68ch;
    color: var(--muted);
    line-height: 1.45;
  }

  .invalid-result {
    border-color: var(--risk);
    background: var(--risk-bg);
  }

  .invalid-result strong {
    color: var(--risk);
  }

  .actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  button {
    min-height: 44px;
    border-radius: 10px;
    padding: 10px 16px;
    font: inherit;
    font-weight: 750;
    cursor: pointer;
  }

  .save-action {
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--surface);
  }

  .keep-action {
    border: 1px solid color-mix(in srgb, var(--ink), transparent 24%);
    background: var(--surface);
    color: var(--ink);
  }

  button:hover:not(:disabled) {
    filter: brightness(0.94);
  }

  button:active:not(:disabled) {
    translate: 0 1px;
  }

  button:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--whatif), transparent 30%);
    outline-offset: 2px;
  }

  button:disabled {
    border-color: color-mix(in srgb, var(--muted), transparent 55%);
    background: color-mix(in srgb, var(--paper), var(--muted) 8%);
    color: color-mix(in srgb, var(--muted), transparent 12%);
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    .result-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .actions {
      align-items: stretch;
      flex-direction: column;
    }

    button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    button:active:not(:disabled) {
      translate: none;
    }
  }
</style>
