<script lang="ts">
  import { onMount } from 'svelte';
  import { calculateUsageOnDate } from '@schngn/engine';
  import { intlLocale, type Locale } from '$lib/i18n';
  import { formatLocalizedCount, formatLocalizedNumber } from '$lib/i18n/countUi';
  import { movingWindowUi, timelineViewUi } from '$lib/i18n/movingWindowUi';
  import { formatRollingTimelineSummary } from '$lib/i18n/timelineUi';
  import { countTripSchengenDays, toEngineTrips, type EditableTrip } from '$lib/trips/tripCrud';
  import { buildMovingWindow, distance, movingWindowBounds, shiftDate } from '$lib/timeline/movingWindow';
  import { buildContributionSeries } from '$lib/timeline/layeredContributions';
  import LayeredContributions from './LayeredContributions.svelte';

  let { trips, referenceDate, today = referenceDate, locale, tripName, label, resultLabel, initialDate }: {
    trips: EditableTrip[]; referenceDate: string; today?: string; locale: Locale;
    tripName: (trip: EditableTrip) => string; label: string; resultLabel?: string; initialDate?: string;
  } = $props();
  const id = $props.id();
  let selected = $state<string | null>(null);
  let ready = $state(false);
  let dateError = $state('');
  let view = $state<'sliding' | 'layered'>('sliding');
  onMount(() => { ready = true; });
  let copy = $derived(movingWindowUi(locale));
  let viewCopy = $derived(timelineViewUi(locale));
  let bounds = $derived(movingWindowBounds(trips, referenceDate, today));
  let totals = $derived(new Map(trips.filter(trip => !trip.ongoing).map(trip => [trip.id, countTripSchengenDays(trip)])));
  let requestedDate = $derived(selected ?? initialDate ?? referenceDate);
  let checkingDate = $derived(requestedDate >= bounds.minDate && requestedDate <= bounds.endDate ? requestedDate : referenceDate);
  let model = $derived(buildMovingWindow(trips, checkingDate, bounds));
  // Plot geometry depends on trips and extent, not on the moving date cursor.
  let contributions = $derived(view === 'layered' ? buildContributionSeries(trips, bounds) : null);
  let todayPosition = $derived(distance(bounds.startDate, today) / bounds.days * 100);
  let markers = $derived.by(() => {
    const ends: number[] = [];
    return model.lanes.flatMap((lane, index) => {
      if (!lane.segments.length) return [];
      const segment = lane.segments[0];
      const position = Math.max(6, Math.min(94, segment.left + segment.width / 2));
      return [{ lane, index, position }];
    }).sort((a, b) => a.position - b.position).map(marker => {
      let tier = ends.findIndex(end => marker.position - end >= 18);
      if (tier < 0) tier = ends.length;
      ends[tier] = marker.position;
      return { ...marker, tier };
    });
  });
  let markerTiers = $derived(Math.max(1, ...markers.map(marker => marker.tier + 1)));
  // Bundle every flag together; selecting a country must not make a network request.
  const flagAssets = import.meta.glob('./flags/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const flag = (code: string | undefined) => {
    const svg = code ? flagAssets[`./flags/${code.toLowerCase()}.svg`] : undefined;
    return svg ? `data:image/svg+xml,${encodeURIComponent(svg)}` : null;
  };
  let savedUsage = $derived(calculateUsageOnDate(toEngineTrips(trips, referenceDate), referenceDate));
  let summary = $derived(formatRollingTimelineSummary(locale, model.usage.daysUsed, model.usage.daysRemaining, model.usage.overBy));
  const number = (value: number) => formatLocalizedNumber(locale, value);
  const dateLabel = (date: string, compact = false) => new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric', month: 'short', ...(!compact || date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' as const } : {}), timeZone: 'UTC'
  }).format(new Date(`${date}T00:00:00Z`));
  function selectDate(date: string) {
    selected = date;
    dateError = '';
  }
  function changeDate(input: HTMLInputElement) {
    if (input.value && input.validity.valid) selectDate(input.value);
    else {
      dateError = input.validationMessage;
      input.value = checkingDate;
    }
  }
</script>

<div class="moving-window" data-checking-date={checkingDate} data-view={view}>
  <div class="view-switch" role="group" aria-label={viewCopy.view}>
    <button type="button" aria-pressed={view === 'sliding'} disabled={!ready} onclick={() => view = 'sliding'}>
      <svg viewBox="0 0 24 20" width="24" height="20" aria-hidden="true"><path d="M1 10h22M6 5v10M17 5v10" /><rect x="10" y="2" width="10" height="16" /></svg>
      {viewCopy.sliding}
    </button>
    <button type="button" aria-pressed={view === 'layered'} disabled={!ready} onclick={() => view = 'layered'}>
      <svg viewBox="0 0 24 20" width="24" height="20" aria-hidden="true"><path d="M2 17V3M2 17h21M2 13l7-2 6-5 7-3M2 16l7-1 6-3 7-3" /></svg>
      {viewCopy.layered}
    </button>
  </div>
  <div class="window-range"><bdi>{dateLabel(model.usage.windowStart)} – {dateLabel(checkingDate)}</bdi></div>
  {#if view === 'layered' && contributions}
    <LayeredContributions series={contributions} usage={model.usage} {today} {locale} {tripName} {flag} />
  {:else}
  <div class="journey-chart" class:over={model.usage.overLimit} style={`--window-left:${model.window.left}%;--window-width:${model.window.width}%;--today-position:${todayPosition}%;--axis-top:${70 + (markerTiers - 1) * 120}px`}>
    <div class="window-band" aria-hidden="true"><span>{label}</span></div>
    <div class="journey-axis" aria-hidden="true"></div>
    <div class="today-line" aria-hidden="true"><span class="today-label">{copy.today}</span></div>
    <div class="shared-track" aria-hidden="true">
      {#each model.lanes as lane (lane.trip.id)}
        {#each lane.segments as segment}
          <span class="stay-bar outside" class:ongoing={lane.trip.ongoing} style={`left:${segment.left}%;width:${segment.width}%`}></span>
        {/each}
        {#each lane.countedSegments as segment}
          <span class="stay-bar counted" class:whatif={lane.trip.status === 'what-if'} style={`left:${segment.left}%;width:${segment.width}%`}></span>
        {/each}
      {/each}
    </div>
    {#each markers as marker (marker.lane.trip.id)}
      <div class="trip-marker" class:whatif-marker={marker.lane.trip.status === 'what-if'} style={`--marker-position:${marker.position}%;--marker-rise:${marker.tier * 120}px`} title={tripName(marker.lane.trip)}>
        <span class="marker-symbol" aria-hidden="true">{#if flag(marker.lane.trip.entryCountryCode)}<img class="country-flag" src={flag(marker.lane.trip.entryCountryCode)} alt="" width="32" height="32" />{:else}{marker.lane.trip.status === 'what-if' ? '◇' : number(marker.index + 1)}{/if}</span>
        <span class="marker-duration" dir="auto">{#if marker.lane.trip.ongoing}{copy.ongoing}{:else}<b>{number(totals.get(marker.lane.trip.id) ?? 0)}</b><span>{formatLocalizedCount(locale, totals.get(marker.lane.trip.id) ?? 0, 'day').label}</span>{/if}</span>
        <span class="marker-name" dir="auto">{tripName(marker.lane.trip)}</span>
      </div>
    {/each}
  </div>
  <div class="axis-dates" dir="ltr"><bdi>{dateLabel(bounds.startDate)}</bdi><bdi>{dateLabel(bounds.endDate)}</bdi></div>
  {/if}
  <div class="window-result" class:over={model.usage.overLimit} aria-live="polite" aria-atomic="true">
    <span class="count-label">{copy.counted}</span>
    <strong><bdi dir="ltr"><span class="used-days">{number(model.usage.daysUsed)}</span> / {number(90)}</bdi></strong>
    <span>{summary}</span>
  </div>
  <div class="date-explorer">
    <label class="scrubber-label" for={`${id}-scrubber`}>{copy.moveDate}</label>
    <input class="window-scrubber" id={`${id}-scrubber`} type="range" disabled={!ready} min="0" max={distance(bounds.minDate, bounds.endDate)} step="1" value={distance(bounds.minDate, checkingDate)} aria-valuetext={dateLabel(checkingDate)} oninput={(event) => selectDate(shiftDate(bounds.minDate, Number(event.currentTarget.value)))} />
    <div class="window-controls">
      <label for={`${id}-date`}>{copy.checking}
        <input id={`${id}-date`} type="date" required aria-describedby={dateError ? `${id}-date-error` : undefined} disabled={!ready} value={checkingDate} min={bounds.minDate} max={bounds.endDate} onchange={(event) => changeDate(event.currentTarget)} />
      </label>
      <div class="date-shortcuts">
        <button type="button" onclick={() => selectDate(today)} disabled={!ready || checkingDate === today}>{copy.today}</button>
        <button type="button" onclick={() => selectDate(referenceDate)} disabled={!ready || checkingDate === referenceDate}>{resultLabel ?? copy.reset}</button>
      </div>
    </div>
    {#if dateError}<p id={`${id}-date-error`} role="alert">{dateError}</p>{/if}
  </div>
  <details class="trip-details">
    <summary>{label} · {copy.counted}</summary>
    <ul class="window-key">
      <li><span class="key-mark counted"></span>{copy.counted}</li>
      <li><span class="key-mark outside"></span>{copy.outside}</li>
      {#if trips.some(trip => trip.status === 'what-if')}<li><span class="key-mark whatif"></span>{copy.whatIf}</li>{/if}
    </ul>
    {#each model.lanes as lane (lane.trip.id)}
      <div class="window-lane">
        <div class="lane-label">
          <strong><bdi>{tripName(lane.trip)}</bdi></strong>
          <span class="lane-count">{#if lane.trip.ongoing}{formatLocalizedCount(locale, lane.counted, 'day').text}{:else}{copy.countedInWindow(number(lane.counted), number(totals.get(lane.trip.id) ?? 0))}{/if}</span>
        </div>
        <div class="lane-dates">
          {#each lane.trip.stays as stay, index}
            <bdi>{dateLabel(stay.entryDate, true)} – {lane.trip.ongoing && index === lane.trip.stays.length - 1 ? copy.ongoing : dateLabel(stay.exitDate, true)}</bdi>
          {/each}
        </div>

      </div>
    {/each}
  </details>
  <div class="saved-checkpoint">
    <span>{resultLabel ?? copy.savedResult} · <bdi>{dateLabel(referenceDate)}</bdi></span>
    <strong><bdi dir="ltr">{number(savedUsage.daysUsed)} / {number(90)}</bdi></strong>
  </div>
</div>

<style>
  .moving-window { display: grid; gap: 12px; min-width: 0; }
  .view-switch { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--control-line); border-radius: 10px; margin-bottom: 8px; }
  .view-switch button { flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; border-color: transparent; background: transparent; font-size: .875rem; font-weight: 600; line-height: 1.3; padding: 10px 8px; min-width: 0; }
  .view-switch button[aria-pressed='true'] { background: var(--ink); color: var(--paper); }
  .view-switch button[aria-pressed='true']:hover:not(:disabled), .view-switch button[aria-pressed='true']:active:not(:disabled) { background: var(--ink); color: var(--paper); }
  .view-switch button[aria-pressed='false']:hover:not(:disabled) { background: var(--safe-bg); }
  .view-switch svg { flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 1.5; }
  .view-switch rect { fill: currentColor; fill-opacity: .15; }
  @media (max-width: 420px) { .view-switch button { flex-direction: column; gap: 6px; } }
  .window-result { display: grid; justify-items: center; gap: 8px; color: var(--ink); text-align: center; padding-block: 16px 24px; }
  .window-result strong { font-size: clamp(2.75rem, 9vw, 4rem); line-height: 1.15; font-variant-numeric: tabular-nums; }
  .used-days { color: var(--safe); }
  .window-result.over .used-days { color: var(--risk); }
  .window-result > span { font-size: .9rem; line-height: 1.45; }
  .window-result .count-label { font-size: 1.1rem; font-weight: 650; }
  .window-range { text-align: center; color: var(--muted); font-size: .875rem; }
  .journey-chart { position: relative; height: calc(var(--axis-top) + 172px); margin: 16px 10px 0; direction: ltr; }
  .window-band { position: absolute; top: 0; bottom: 0; left: var(--window-left); width: var(--window-width); background: color-mix(in srgb, var(--whatif) 19%, var(--paper)); border-radius: 8px; }
  .window-band > span { position: absolute; bottom: 12px; left: 8px; right: 8px; text-align: center; font-weight: 650; color: var(--whatif); line-height: 1.15; font-size: .9rem; }
  .journey-chart.over .window-band { background: color-mix(in srgb, var(--risk) 18%, var(--paper)); }
  .journey-chart.over .window-band > span { color: var(--risk); }
  .journey-axis { position: absolute; left: -8px; right: -8px; top: var(--axis-top); height: 4px; background: var(--safe); }
  .journey-axis::after { content: ''; position: absolute; right: 0; top: -6px; width: 12px; height: 12px; border-top: 3px solid var(--safe); border-right: 3px solid var(--safe); transform: rotate(45deg); }
  .today-line { position: absolute; top: calc(var(--axis-top) - 18px); left: var(--today-position); height: 40px; border-left: 1px solid var(--ink); }
  .today-label { position: absolute; bottom: 42px; transform: translateX(-50%); font-size: .8rem; font-weight: 700; padding: 2px 4px; }
  .shared-track { position: absolute; top: calc(var(--axis-top) - 10px); width: 100%; height: 24px; }
  .trip-marker { position: absolute; left: clamp(24px, var(--marker-position), calc(100% - 24px)); top: calc(var(--axis-top) - 54px - var(--marker-rise)); transform: translateX(-50%); width: 18%; max-width: 58px; text-align: center; color: var(--booked); }
  .trip-marker::before { content: ''; position: absolute; top: 32px; left: 50%; height: calc(var(--marker-rise) + 22px); border-left: 1px solid currentColor; opacity: .4; z-index: -1; }
  .marker-symbol { display: block; font-size: 2rem; font-weight: 700; line-height: 32px; }
  .country-flag { display: block; width: 32px; height: 32px; margin-inline: auto; border-radius: 0; }
  .marker-duration { display: block; margin-top: 36px; font-size: .9rem; font-weight: 700; line-height: 1.15; }
  .marker-duration b { display: block; font-size: 1.35rem; }
  .marker-name { display: block; font-size: .7rem; line-height: 1.2; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 3px; }
  .whatif-marker { color: var(--whatif); }
  .trip-details { border-top: 1px solid var(--line); padding-top: 8px; }
  .trip-details summary { cursor: pointer; min-height: 44px; align-content: center; font-weight: 650; }
  .window-lane { padding-block: 12px; border-top: 1px solid var(--line); }
  .lane-label { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 2px 16px; font-size: .9rem; }
  .lane-label strong { overflow-wrap: anywhere; }
  .lane-count { font-size: .875rem; }
  .lane-label strong, .lane-count, .lane-dates bdi { padding-inline: 2px; box-decoration-break: clone; }
  .lane-dates { display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); font-size: .875rem; margin-top: 3px; }
  .stay-bar { position: absolute; top: 0; height: 24px; border-radius: 3px; min-width: 2px; }
  .outside { background: color-mix(in srgb, var(--ink) 55%, var(--paper)); }
  .counted { background: var(--booked); }
  .whatif { background: var(--whatif); }
  .stay-bar.ongoing { border-block: 1px dashed var(--muted); }
  .axis-dates { display: flex; justify-content: space-between; gap: 12px; font-size: .875rem; color: var(--muted); }
  .window-key { display: flex; flex-wrap: wrap; gap: 8px 16px; list-style: none; margin: 0; padding: 0; font-size: .875rem; color: var(--muted); }
  .window-key li { display: inline-flex; align-items: center; gap: 6px; }
  .key-mark { width: 14px; height: 10px; border-radius: 2px; flex-shrink: 0; }

  .date-explorer { display: grid; gap: 6px; border-top: 1px solid var(--line); padding-top: 12px; }
  .scrubber-label { font-weight: 650; font-size: .9rem; }
  .window-scrubber { width: 100%; min-width: 0; margin: 0; min-height: 44px; accent-color: var(--safe); direction: ltr; }
  .window-controls { display: flex; align-items: end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .window-controls label { display: grid; gap: 6px; font-size: .9rem; font-weight: 650; min-width: 0; }
  .date-shortcuts { display: flex; flex-wrap: wrap; gap: 8px; }
  input[type='date'], button { min-height: 44px; max-width: 100%; border: 1px solid var(--control-line); border-radius: 8px; background: var(--surface); color: var(--ink); padding: 8px 12px; font: inherit; }
  button { cursor: pointer; font-size: .9rem; }
  button:hover:not(:disabled) { border-color: var(--ink); background: var(--safe-bg); }
  button:active:not(:disabled) { background: var(--line); }
  button:disabled { cursor: default; opacity: .55; }
  input:focus-visible, button:focus-visible { outline: 3px solid var(--safe); outline-offset: 3px; }
  .saved-checkpoint { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 12px; font-size: .875rem; }
</style>
