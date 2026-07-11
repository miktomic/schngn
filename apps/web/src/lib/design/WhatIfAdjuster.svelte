<script lang="ts">
  import { formatDate, type Locale } from '$lib/i18n';
  import { createWhatIfUiTranslator } from '$lib/i18n/whatIfUi';
  import {
    differenceInDays,
    moveTripDates,
    resizeTripEntry,
    resizeTripExit,
    type AdjustmentMode,
    type AdjustmentRange,
    type DateAdjustment
  } from '$lib/simulator/whatIfDates';

  interface Props {
    accentColor?: string;
    cutoffDate?: string | null;
    entryDate: string;
    entryMax?: string;
    exitDate: string;
    exitMin?: string;
    feedback?: string;
    feedbackTone?: 'safe' | 'limit' | 'risk';
    range: AdjustmentRange;
    locale?: Locale;
    onDatesChange: (adjustment: DateAdjustment) => void;
  }

  let {
    accentColor = 'var(--whatif)',
    cutoffDate = null,
    entryDate,
    entryMax,
    exitDate,
    exitMin,
    feedback = '',
    feedbackTone = 'safe',
    range,
    locale = 'en',
    onDatesChange
  }: Props = $props();
  let rail: HTMLDivElement;
  let drag = $state<{ entryDate: string; exitDate: string; mode: AdjustmentMode; pointerX: number; width: number } | null>(null);
  let copy = $derived(createWhatIfUiTranslator(locale));
  let entryOffset = $derived(differenceInDays(range.minDate, entryDate));
  let exitOffset = $derived(differenceInDays(range.minDate, exitDate));
  let left = $derived((entryOffset / range.totalDays) * 100);
  let right = $derived((exitOffset / range.totalDays) * 100);
  let width = $derived(Math.max(1.5, right - left));
  let compact = $derived(right - left < 8);
  let midpoint = $derived(Math.max(12, Math.min(88, (left + right) / 2)));
  let cutoffOffset = $derived(cutoffDate ? differenceInDays(range.minDate, cutoffDate) : -1);
  let cutoffPosition = $derived((cutoffOffset / range.totalDays) * 100);
  let cutoffVisible = $derived(cutoffDate !== null && cutoffOffset >= 0 && cutoffOffset <= range.totalDays);
  let entryMaximum = $derived(entryMax ?? exitDate);
  let exitMinimum = $derived(exitMin ?? entryDate);
  let entryMaximumOffset = $derived(differenceInDays(range.minDate, entryMaximum));
  let exitMinimumOffset = $derived(differenceInDays(range.minDate, exitMinimum));

  function beginDrag(event: PointerEvent, mode: AdjustmentMode): void {
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    drag = { entryDate, exitDate, mode, pointerX: event.clientX, width: rail.getBoundingClientRect().width };
    event.preventDefault();
  }

  function continueDrag(event: PointerEvent): void {
    if (!drag) return;
    const days = Math.round(((event.clientX - drag.pointerX) / Math.max(drag.width, 1)) * range.totalDays);
    onDatesChange(adjust(drag.mode, drag.entryDate, drag.exitDate, days));
  }

  function endDrag(): void { drag = null; }

  function handleKey(event: KeyboardEvent, mode: AdjustmentMode): void {
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    onDatesChange(adjust(mode, entryDate, exitDate, direction * (event.shiftKey ? 7 : 1)));
  }

  function adjust(mode: AdjustmentMode, currentEntry: string, currentExit: string, days: number): DateAdjustment {
    if (mode === 'move') return moveTripDates(currentEntry, currentExit, days, range);
    if (mode === 'entry') return resizeTripEntry(currentEntry, currentExit, days, range);
    return resizeTripExit(currentEntry, currentExit, days, range);
  }

  function updateExactDate(event: Event, mode: 'entry' | 'exit'): void {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (!value) return;
    const days = differenceInDays(mode === 'entry' ? entryDate : exitDate, value);
    onDatesChange(adjust(mode, entryDate, exitDate, days));
  }

  function labelDate(value: string): string {
    return formatDate(locale, value, { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<section class="adjuster" style={`--adjust-accent:${accentColor}`} aria-label={copy('title')}>
  <p>{copy('hint')}</p>

  <div class="rail-shell" dir="ltr">
    <div class="rail" bind:this={rail}>
      <span class="rail-line" aria-hidden="true"></span>
      <span class="handle-date entry-date" class:compact style={`left:${left}%`}>
        <small>{copy('entry')}</small><bdi>{labelDate(entryDate)}</bdi>
      </span>
      <span class="handle-date exit-date" class:compact style={`left:${right}%`}>
        <small>{copy('exit')}</small><bdi>{labelDate(exitDate)}</bdi>
      </span>
      {#if cutoffVisible && cutoffDate}
        <span class="cutoff-marker" style={`left:${cutoffPosition}%`} aria-label={`${copy('overFrom')} ${labelDate(cutoffDate)}`}>
        </span>
      {/if}
      <button
        class="trip-block"
        class:dragging={drag?.mode === 'move'}
        type="button"
        style={`left:${left}%;width:${width}%`}
        aria-label={`${copy('move')}: ${labelDate(entryDate)} – ${labelDate(exitDate)}`}
        onpointerdown={(event) => beginDrag(event, 'move')}
        onpointermove={continueDrag}
        onpointerup={endDrag}
        onpointercancel={endDrag}
        onkeydown={(event) => handleKey(event, 'move')}
      ><span>{differenceInDays(entryDate, exitDate) + 1}</span></button>
      <button
        class="handle entry-handle"
        class:compact
        class:dragging={drag?.mode === 'entry'}
        type="button"
        style={`left:${left}%`}
        role="slider"
        aria-label={`${copy('entry')}: ${labelDate(entryDate)}`}
        aria-valuemin={0}
        aria-valuemax={entryMaximumOffset}
        aria-valuenow={entryOffset}
        aria-valuetext={labelDate(entryDate)}
        onpointerdown={(event) => beginDrag(event, 'entry')}
        onpointermove={continueDrag}
        onpointerup={endDrag}
        onpointercancel={endDrag}
        onkeydown={(event) => handleKey(event, 'entry')}
      ></button>
      <button
        class="handle exit-handle"
        class:compact
        class:dragging={drag?.mode === 'exit'}
        type="button"
        style={`left:${right}%`}
        role="slider"
        aria-label={`${copy('exit')}: ${labelDate(exitDate)}`}
        aria-valuemin={exitMinimumOffset}
        aria-valuemax={range.totalDays}
        aria-valuenow={exitOffset}
        aria-valuetext={labelDate(exitDate)}
        onpointerdown={(event) => beginDrag(event, 'exit')}
        onpointermove={continueDrag}
        onpointerup={endDrag}
        onpointercancel={endDrag}
        onkeydown={(event) => handleKey(event, 'exit')}
      ></button>
    </div>
    <div class="rail-status" style={`--trip-midpoint:${midpoint}%`}>
      {#if feedback}
        <output
          class="range-feedback {feedbackTone}"
          aria-live="polite"
          aria-atomic="true"
        >{feedback}</output>
      {/if}
      {#if cutoffVisible && cutoffDate}
        <span class="cutoff-label">{copy('overFrom')} <bdi>{labelDate(cutoffDate)}</bdi></span>
      {/if}
    </div>
  </div>

  <div class="exact-date-area">
    <div class="exact-dates">
      <label><span>{copy('entry')}</span><input type="date" min={range.minDate} max={entryMaximum} value={entryDate} onchange={(event) => updateExactDate(event, 'entry')} /></label>
      <label><span>{copy('exit')}</span><input type="date" min={exitMinimum} max={range.maxDate} value={exitDate} onchange={(event) => updateExactDate(event, 'exit')} /></label>
    </div>
  </div>
</section>

<style>
  .adjuster { display: grid; gap: 16px; }
  p { margin: 0; }
  p { max-width: 65ch; color: var(--muted); line-height: 1.45; }
  .rail-shell { display: grid; gap: 10px; }
  .rail { position: relative; height: 82px; touch-action: none; }
  .rail-line { position: absolute; inset: 52px 0 auto; height: 8px; border: 1px solid var(--line); border-radius: 5px; background: var(--surface); }
  .trip-block { position: absolute; top: 42px; z-index: 2; min-width: 22px; height: 28px; border: 1px solid var(--adjust-accent); border-radius: 7px; background: color-mix(in srgb, var(--surface), var(--adjust-accent) 12%); color: var(--ink); cursor: grab; touch-action: none; }
  .trip-block::before { content: ''; position: absolute; inset: -8px -11px; }
  .trip-block:active, .trip-block.dragging { cursor: grabbing; background: color-mix(in srgb, var(--surface), var(--adjust-accent) 22%); }
  .trip-block span { font: 700 0.72rem/1 'IBM Plex Mono', ui-monospace, monospace; pointer-events: none; }
  .handle { position: absolute; top: 34px; z-index: 4; width: 44px; height: 44px; margin-left: -22px; border: 0; background: transparent; cursor: ew-resize; touch-action: none; }
  .handle::before { content: ''; position: absolute; inset: 2px 8px; border: 2px solid var(--adjust-accent); border-radius: 8px; background: var(--surface); }
  .handle::after { content: ''; position: absolute; inset: 13px auto auto 21px; width: 2px; height: 18px; border-radius: 2px; background: var(--adjust-accent); }
  .handle.dragging::before { background: color-mix(in srgb, var(--surface), var(--adjust-accent) 14%); }
  .entry-handle.compact { margin-left: -46px; }
  .exit-handle.compact { margin-left: 2px; }
  .handle-date {
    position: absolute;
    top: 0;
    z-index: 3;
    display: grid;
    gap: 1px;
    min-width: max-content;
    color: var(--ink);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.2;
    pointer-events: none;
    text-align: center;
    transform: translateX(-50%);
  }
  .handle-date small { color: var(--muted); font: inherit; font-size: 0.62rem; font-weight: 650; }
  .entry-date.compact { transform: translateX(calc(-100% - 24px)); }
  .exit-date.compact { transform: translateX(24px); }
  .cutoff-marker {
    position: absolute;
    top: 39px;
    bottom: 0;
    z-index: 3;
    width: 2px;
    background: var(--risk);
    pointer-events: none;
  }
  .cutoff-marker::before { position: absolute; top: -3px; left: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--risk); content: ''; }
  .rail-status { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding-inline-start: clamp(0px, var(--trip-midpoint), calc(100% - 180px)); }
  .range-feedback {
    max-width: 100%;
    border-radius: 6px;
    padding: 5px 8px;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1.2;
  }
  .range-feedback.safe { background: var(--safe-bg); color: var(--safe); }
  .range-feedback.limit { background: var(--whatif-bg); color: var(--whatif); }
  .range-feedback.risk { background: var(--risk-bg); color: var(--risk); }
  .cutoff-label { max-width: 100%; border-radius: 5px; background: var(--risk-bg); color: var(--risk); padding: 4px 7px; font-size: 0.68rem; font-weight: 750; line-height: 1.25; }
  button:focus-visible, input:focus-visible { outline: 3px solid color-mix(in srgb, var(--adjust-accent), transparent 35%); outline-offset: 2px; }
  .exact-date-area { display: grid; gap: 8px; border-top: 1px solid color-mix(in srgb, var(--adjust-accent), transparent 65%); padding-top: 12px; }
  .exact-dates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  label { display: grid; gap: 5px; color: var(--ink); font-weight: 700; }
  input { min-width: 0; min-height: 44px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); padding: 8px 10px; font: inherit; }
  input[type='date'] { max-inline-size: 100%; padding-inline: 10px 8px; }
  @media (max-width: 520px) {
    .exact-dates { grid-template-columns: 1fr; }
    .rail { height: 88px; }
    .handle-date { font-size: 0.65rem; }
    .rail-status { padding-inline-start: 0; }
    .range-feedback, .cutoff-label { width: fit-content; }
  }
  @media (prefers-reduced-motion: reduce) { .trip-block, .handle { transition: none; } }
</style>
