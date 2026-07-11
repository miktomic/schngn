<script lang="ts">
  import { addDays, formatISODate, parseISODate } from '@schngn/engine';
  import { intlLocale, type Locale } from '$lib/i18n';
  import { createAppDeepUiTranslator } from '$lib/i18n/appDeepUi';
  import { createWhatIfUiTranslator, formatAdjusterFeedback } from '$lib/i18n/whatIfUi';
  import { createOngoingStayUiTranslator } from '$lib/i18n/ongoingStayUi';
  import type { AdjustmentRange, DateAdjustment } from '$lib/simulator/whatIfDates';
  import type { ProposedTripInput, TripSimulationState } from '$lib/simulator/tripSimulator';
  import { SCHENGEN_COUNTRY_OPTIONS } from '$lib/trips/countries';
  import { createOutsideBreak, MAX_OUTSIDE_BREAKS, MAX_TRIP_LABEL_LENGTH } from '$lib/trips/tripCrud';
  import StatusChip from './StatusChip.svelte';
  import WhatIfAdjuster from './WhatIfAdjuster.svelte';

  interface Props {
    accentColor?: string;
    blockingMessage?: string;
    entryDate: string;
    entryMax?: string;
    exitDate: string;
    exitMin?: string;
    hasChanges: boolean;
    form: ProposedTripInput;
    headingId?: string;
    locale?: Locale;
    onClose: () => void;
    onDatesChange: (adjustment: DateAdjustment) => void;
    onFormChange: (form: ProposedTripInput) => void;
    onSave: () => void | Promise<void>;
    panelId?: string;
    range: AdjustmentRange;
    sourceName: string;
    state: TripSimulationState;
  }

  let {
    accentColor = 'var(--whatif)',
    blockingMessage = '',
    entryDate,
    entryMax,
    exitDate,
    exitMin,
    hasChanges,
    form,
    headingId: requestedHeadingId,
    locale = 'en',
    onClose,
    onDatesChange,
    onFormChange,
    onSave,
    panelId,
    range,
    sourceName,
    state
  }: Props = $props();

  const instanceId = $props.id();
  let headingId = $derived(requestedHeadingId ?? `${instanceId}-heading`);
  const resultId = `${instanceId}-result`;

  let whatIf = $derived(createWhatIfUiTranslator(locale));
  let deep = $derived(createAppDeepUiTranslator(locale));
  let ongoingStay = $derived(createOngoingStayUiTranslator(locale));
  let hasValidResult = $derived(state.valid && state.usage !== null && state.simulatedTrip !== null);
  let canSave = $derived(hasChanges && hasValidResult);
  let tone = $derived<'safe' | 'risk' | 'whatif'>(
    state.statusTone === 'risk' ? 'risk' : state.statusTone === 'safe' ? 'safe' : 'whatif'
  );
  let cutoffDate = $derived(firstOverLimitDate(state));
  let rangeFeedback = $derived(state.usage
    ? formatAdjusterFeedback(locale, state.usage.overBy, state.usage.daysRemaining, state.completed)
    : '');

  function firstOverLimitDate(simulationState: TripSimulationState): string | null {
    if (simulationState.conflict?.date) return simulationState.conflict.date;
    if (!simulationState.latestSafeExitDate) return null;
    return formatISODate(addDays(parseISODate(simulationState.latestSafeExitDate), 1));
  }

  function countryName(code: string): string {
    return new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(code) ?? code;
  }

  function updateField<K extends keyof ProposedTripInput>(field: K, value: ProposedTripInput[K]): void {
    onFormChange({ ...form, [field]: value });
  }

  function updateEntryCountry(event: Event): void {
    const entryCountryCode = (event.currentTarget as HTMLSelectElement).value;
    onFormChange({
      ...form,
      entryCountryCode,
      exitCountryCode: form.ongoing ? '' : form.exitCountryCode || entryCountryCode
    });
  }

  function updateOngoing(event: Event): void {
    const ongoing = (event.currentTarget as HTMLInputElement).checked;
    onFormChange({ ...form, ongoing, exitCountryCode: ongoing ? '' : form.exitCountryCode });
  }

  function addOutsideBreak(): void {
    if (form.outsideBreaks.length >= MAX_OUTSIDE_BREAKS) return;
    updateField('outsideBreaks', [...form.outsideBreaks, createOutsideBreak(form.outsideBreaks.length)]);
  }

  function updateOutsideBreak(id: string, field: 'leftDate' | 'reentryDate', value: string): void {
    updateField('outsideBreaks', form.outsideBreaks.map((outsideBreak) =>
      outsideBreak.id === id ? { ...outsideBreak, [field]: value } : outsideBreak
    ));
  }

  function removeOutsideBreak(id: string): void {
    updateField('outsideBreaks', form.outsideBreaks.filter((outsideBreak) => outsideBreak.id !== id));
  }
</script>

<section id={panelId} class="trip-adjust-panel" style={`--adjust-accent:${accentColor}`} aria-labelledby={headingId} aria-describedby={resultId}>
  <header>
    <div>
      <p class="source-name">{sourceName}</p>
      <h2 id={headingId} tabindex="-1">{whatIf('title')}</h2>
    </div>
  </header>

  {#if form.ongoing}
    <section class="ongoing-editor" aria-label={ongoingStay('ongoing')}>
      <label for={`${instanceId}-ongoing-entry`}>
        <span>{deep('entered')}</span>
        <input
          id={`${instanceId}-ongoing-entry`}
          type="date"
          max={exitDate}
          value={entryDate}
          onchange={(event) => updateField('entryDate', (event.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <div class="ongoing-leave-by">
        <span>{ongoingStay('leaveBy')}</span>
        <strong>{state.latestSafeExitLabel}</strong>
      </div>
    </section>
  {:else}
    <WhatIfAdjuster
      {accentColor}
      {entryDate}
      {entryMax}
      {exitDate}
      {exitMin}
      {range}
      {locale}
      {cutoffDate}
      feedback={rangeFeedback}
      feedbackTone={state.statusTone === 'risk' ? 'risk' : state.statusTone === 'close' ? 'limit' : 'safe'}
      {onDatesChange}
    />
  {/if}

  <label class="ongoing-toggle" for={`${instanceId}-ongoing`}>
    <input id={`${instanceId}-ongoing`} type="checkbox" checked={form.ongoing} onchange={updateOngoing} />
    <span><strong>{ongoingStay('label')}</strong><small>{ongoingStay('help')}</small></span>
  </label>

  <details class="trip-details-editor">
    <summary>{whatIf('details')}</summary>
    <div class="details-content">
      <label for={`${instanceId}-label`}>
        <span>{deep('tripLabel')} <small>{deep('optional')}</small></span>
        <input
          id={`${instanceId}-label`}
          type="text"
          maxlength={MAX_TRIP_LABEL_LENGTH}
          value={form.label ?? ''}
          oninput={(event) => updateField('label', (event.currentTarget as HTMLInputElement).value)}
        />
      </label>

      <div class="detail-grid">
        <label for={`${instanceId}-entry-country`}>
          <span>{deep('enteredVia')} <small>{deep('optional')}</small></span>
          <select id={`${instanceId}-entry-country`} value={form.entryCountryCode ?? ''} onchange={updateEntryCountry}>
            <option value="">{deep('chooseUseful')}</option>
            {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
          </select>
        </label>
        {#if !form.ongoing}
          <label for={`${instanceId}-exit-country`}>
            <span>{deep('leftVia')} <small>{deep('optional')}</small></span>
            <select
              id={`${instanceId}-exit-country`}
              value={form.exitCountryCode ?? ''}
              onchange={(event) => updateField('exitCountryCode', (event.currentTarget as HTMLSelectElement).value)}
            >
              <option value="">{deep('chooseUseful')}</option>
              {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
            </select>
          </label>
        {/if}
      </div>
      <small class="detail-help">{deep('borderContext')}</small>

      <section class="outside-details" aria-labelledby={`${instanceId}-outside-heading`}>
        <div class="outside-heading">
          <div>
            <h3 id={`${instanceId}-outside-heading`}>{deep('outsideTime')}</h3>
            <p>{deep('outsideTripHelp')}</p>
          </div>
          {#if form.outsideBreaks.length < MAX_OUTSIDE_BREAKS}
            <button class="detail-action" type="button" onclick={addOutsideBreak}>{deep('addOutside')}</button>
          {/if}
        </div>
        {#each form.outsideBreaks as outsideBreak, index (outsideBreak.id)}
          <fieldset>
            <legend>{deep('outsideTime')} {index + 1}</legend>
            <div class="detail-grid">
              <label for={`${instanceId}-${outsideBreak.id}-left`}>
                <span>{deep('left')}</span>
                <input
                  id={`${instanceId}-${outsideBreak.id}-left`}
                  type="date"
                  min={entryDate}
                  max={exitDate}
                  value={outsideBreak.leftDate}
                  onchange={(event) => updateOutsideBreak(outsideBreak.id, 'leftDate', (event.currentTarget as HTMLInputElement).value)}
                />
              </label>
              <label for={`${instanceId}-${outsideBreak.id}-reentry`}>
                <span>{deep('reentered')}</span>
                <input
                  id={`${instanceId}-${outsideBreak.id}-reentry`}
                  type="date"
                  min={entryDate}
                  max={exitDate}
                  value={outsideBreak.reentryDate}
                  onchange={(event) => updateOutsideBreak(outsideBreak.id, 'reentryDate', (event.currentTarget as HTMLInputElement).value)}
                />
              </label>
            </div>
            <button class="remove-detail" type="button" onclick={() => removeOutsideBreak(outsideBreak.id)}>{deep('removeBreak')}</button>
          </fieldset>
        {/each}
      </section>
    </div>
  </details>

  {#if hasValidResult && state.usage && state.simulatedTrip}
    <div id={resultId} class="live-result" aria-live="polite" aria-atomic="true">
      <div class="result-heading">
        <span>{whatIf('live')}</span>
        <StatusChip {tone} label={state.statusLabel} />
      </div>
      <strong class:risk={state.statusTone === 'risk'}>{state.latestSafeExitLabel}</strong>
      <p>{state.summaryCopy}</p>
    </div>

  {:else}
    <div id={resultId} class="invalid-result" role="status" aria-live="polite">
      <strong>{deep('validDates')}</strong>
      <p>{deep('fixFields')}</p>
    </div>
  {/if}

  {#if blockingMessage}
    <p class="blocking-message" role="status" aria-live="polite">{blockingMessage}</p>
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
    border-top: 1px solid color-mix(in srgb, var(--adjust-accent), transparent 58%);
    background: transparent;
    padding: 18px 4px 4px;
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
    color: var(--adjust-accent);
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

  .ongoing-editor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 0.8fr);
    gap: 12px;
    align-items: end;
  }

  .ongoing-leave-by {
    display: grid;
    align-content: center;
    min-height: 44px;
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 55%);
    border-radius: 8px;
    background: var(--safe-bg);
    padding: 8px 10px;
    color: var(--safe);
  }

  .ongoing-leave-by span { font-size: 0.72rem; font-weight: 700; }

  .ongoing-toggle {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    align-items: start;
    gap: 8px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--surface);
    padding: 10px;
  }

  .ongoing-toggle input { width: 20px; min-height: 20px; margin: 2px 0 0; }
  .ongoing-toggle strong, .ongoing-toggle small { display: block; }
  .ongoing-toggle small { margin-top: 2px; color: var(--muted); font-weight: 500; }

  .live-result,
  .invalid-result {
    display: grid;
    gap: 8px;
    border-block: 1px solid color-mix(in srgb, var(--adjust-accent), transparent 66%);
    background: color-mix(in srgb, var(--surface), var(--adjust-accent) 6%);
    padding: 14px;
  }

  .trip-details-editor {
    border-block: 1px solid color-mix(in srgb, var(--adjust-accent), transparent 66%);
    padding-block: 10px;
  }

  summary {
    width: fit-content;
    color: var(--ink);
    font-weight: 760;
    cursor: pointer;
  }

  summary:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--adjust-accent), transparent 35%);
    outline-offset: 3px;
  }

  .details-content {
    display: grid;
    gap: 14px;
    padding-top: 14px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  label {
    display: grid;
    min-width: 0;
    gap: 5px;
    color: var(--ink);
    font-weight: 700;
  }

  label small,
  .detail-help {
    color: var(--muted);
    font-weight: 500;
  }

  input,
  select {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    padding: 8px 10px;
    font: inherit;
  }

  input[type='date'] {
    max-inline-size: 100%;
    padding-inline: 10px 8px;
  }

  .outside-details,
  .outside-heading {
    display: grid;
    gap: 10px;
  }

  .outside-heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  h3,
  .outside-heading p {
    margin: 0;
  }

  h3 {
    font-size: 1rem;
  }

  .outside-heading p {
    color: var(--muted);
    line-height: 1.4;
  }

  fieldset {
    display: grid;
    min-width: 0;
    gap: 10px;
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 10px;
  }

  legend {
    padding-inline: 4px;
    color: var(--muted);
    font-weight: 700;
  }

  .detail-action,
  .remove-detail {
    min-height: 40px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    padding: 7px 10px;
  }

  .remove-detail {
    justify-self: start;
    border: 0;
    background: transparent;
    color: var(--risk);
  }

  .blocking-message {
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--whatif), var(--line) 35%);
    border-radius: 8px;
    background: var(--whatif-bg);
    color: var(--whatif);
    padding: 9px 10px;
    font-weight: 700;
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
    outline: 3px solid color-mix(in srgb, var(--adjust-accent), transparent 30%);
    outline-offset: 2px;
  }

  button:disabled {
    border-color: color-mix(in srgb, var(--muted), transparent 55%);
    background: color-mix(in srgb, var(--paper), var(--muted) 8%);
    color: color-mix(in srgb, var(--muted), transparent 12%);
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    .ongoing-editor { grid-template-columns: 1fr; }
    .result-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .actions {
      align-items: stretch;
      flex-direction: column;
    }

    .detail-grid,
    .outside-heading {
      grid-template-columns: 1fr;
    }

    .detail-action {
      width: 100%;
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
