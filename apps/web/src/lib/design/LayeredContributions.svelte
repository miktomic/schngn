<script lang="ts">
  import type { UsageResult } from '@schngn/engine';
  import { intlLocale, type Locale } from '$lib/i18n';
  import { formatLocalizedNumber } from '$lib/i18n/countUi';
  import { movingWindowUi, timelineViewUi } from '$lib/i18n/movingWindowUi';
  import { contributionReading, type ContributionSeries } from '$lib/timeline/layeredContributions';
  import { distance } from '$lib/timeline/movingWindow';
  import type { EditableTrip } from '$lib/trips/tripCrud';

  let { series, usage, today, locale, tripName, flag }: {
    series: ContributionSeries; usage: UsageResult; today: string; locale: Locale;
    tripName: (trip: EditableTrip) => string; flag: (code: string | undefined) => string | null;
  } = $props();
  const id = $props.id();
  let measuredWidth = $state(0);
  const width = $derived(Math.max(230, measuredWidth || 560));
  const left = 34, top = 42, bottom = 252;
  const right = $derived(width - 12);
  const copy = $derived(movingWindowUi(locale));
  const viewCopy = $derived(timelineViewUi(locale));
  const values = $derived(contributionReading(series, usage));
  const maxY = $derived(Math.max(100, Math.ceil(series.points.reduce((max, point) => Math.max(max, point.used), 0) / 30) * 30));
  const y = (value: number) => bottom - value / maxY * (bottom - top);
  const x = (date: string) => left + distance(series.startDate, date) / Math.max(1, distance(series.startDate, series.endDate)) * (right - left);
  const number = (value: number) => formatLocalizedNumber(locale, value);
  const dateLabel = (date: string) => new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', ...(series.startDate.slice(0, 4) !== series.endDate.slice(0, 4) ? { year: 'numeric' as const } : {}), timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  const paths = $derived.by(() => {
    const cumulative = series.points.map(() => 0);
    return series.layers.map((layer, layerIndex) => {
      const lower = series.points.map((point, i) => `${x(point.date)},${y(cumulative[i])}`);
      const upper = series.points.map((point, i) => {
        cumulative[i] += point.values[layerIndex];
        return `${x(point.date)},${y(cumulative[i])}`;
      });
      return { layer, path: `M${upper.join(' L')} L${lower.reverse().join(' L')} Z` };
    });
  });
  const totalPath = $derived(`M${series.points.map(point => `${x(point.date)},${y(point.used)}`).join(' L')}`);
  const projected = $derived(series.layers.some(layer => layer.projected));
</script>

<div class="contribution-chart" bind:clientWidth={measuredWidth}>
  <p class="chart-explanation" id={`${id}-explanation`}>{viewCopy.layerHint}{#if projected} <strong>{copy.ongoing}</strong>{/if}</p>
  <svg viewBox={`0 0 ${width} 279`} role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-explanation`}>
    <title id={`${id}-title`}>{viewCopy.layered} · {dateLabel(usage.referenceDate)} · {number(usage.daysUsed)} / {number(90)}</title>
    <defs>
      <pattern id={`${id}-projection`} width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" stroke="var(--ink)" stroke-opacity=".35" stroke-width="1" /></pattern>
    </defs>
    <text x={left} y="19" class="axis-title">{copy.counted}</text>
    {#each [0, 45, 90, ...(maxY > 100 ? [maxY] : [])] as tick}
      <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} class="grid-line" />
      <text x={left - 8} y={y(tick) + 4} text-anchor="end" class="tick">{number(tick)}</text>
    {/each}
    {#each paths as { layer, path } (layer.id)}
      <path d={path} fill={layer.color} fill-opacity=".8" class="layer" />
      {#if layer.projected}<path d={path} fill={`url(#${id}-projection)`} />{/if}
    {/each}
    <path d={totalPath} class="total-line" />
    <line x1={left} x2={right} y1={y(90)} y2={y(90)} class="limit-line" />
    <text x={left + 4} y={y(90) - 9} class="limit-label">{viewCopy.limit}</text>
    {#if today >= series.startDate && today <= series.endDate}
      <line x1={x(today)} x2={x(today)} y1={top} y2={bottom} class="today-line" />
    {/if}
    <line x1={x(usage.referenceDate)} x2={x(usage.referenceDate)} y1={top} y2={bottom} class="checking-line" />
    <circle cx={x(usage.referenceDate)} cy={y(usage.daysUsed)} r="4.5" class="checking-point" />
    <line x1={left} x2={right} y1={bottom} y2={bottom} class="baseline" />
  </svg>
  <div class="contribution-axis" dir="ltr"><bdi>{dateLabel(series.startDate)}</bdi><bdi>{dateLabel(series.endDate)}</bdi></div>
  <div class="contribution-reading" aria-label={`${copy.counted} · ${dateLabel(usage.referenceDate)}`}>
    {#each series.layers as layer, index (layer.id)}
      <div class="contribution-key">
        <span class="color-key" style={`--layer-color:${layer.color}`} aria-hidden="true"></span>
        {#if layer.trips.length === 1 && flag(layer.trips[0].entryCountryCode)}<img src={flag(layer.trips[0].entryCountryCode)} alt="" width="20" height="20" />{/if}
        <span class="layer-name" dir="auto">{layer.trips.length > 1 ? viewCopy.earlierTrips : tripName(layer.trips[0])}{#if layer.projected}<small>{copy.ongoing}</small>{/if}</span>
        <strong>{number(values[index])}</strong>
      </div>
    {/each}
  </div>
  {#if series.hasOverlap}<p class="overlap-note">{viewCopy.overlapHint}</p>{/if}
</div>

<style>
  .contribution-chart { min-width: 0; }
  .chart-explanation, .overlap-note { color: var(--muted); font-size: .875rem; line-height: 1.5; margin: 4px 0 14px; }
  .chart-explanation strong { font-weight: 600; }
  svg { width: 100%; display: block; overflow: visible; font-family: inherit; direction: ltr; }
  text { fill: var(--muted); font-size: 12px; }
  .axis-title { fill: var(--ink); font-size: 13px; font-weight: 650; }
  .tick { font-variant-numeric: tabular-nums; }
  .grid-line { stroke: var(--line); stroke-dasharray: 2 4; }
  .layer { stroke: var(--paper); stroke-width: .6; }
  .total-line { fill: none; stroke: var(--ink); stroke-width: 1.8; }
  .limit-line { stroke: var(--risk); stroke-width: 1.5; stroke-dasharray: 5 4; }
  .limit-label { fill: var(--risk); font-weight: 650; }
  .today-line { stroke: var(--muted); stroke-dasharray: 2 4; }
  .checking-line { stroke: var(--ink); stroke-dasharray: 4 3; }
  .checking-point { fill: var(--ink); stroke: var(--paper); stroke-width: 1.5; }
  .baseline { stroke: var(--control-line); }
  .contribution-axis { display: flex; justify-content: space-between; gap: 12px; font-size: .8rem; color: var(--muted); margin: -16px 0 20px 34px; }
  .contribution-axis bdi:last-child { text-align: end; }
  .contribution-reading { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 10px 24px; }
  .contribution-key { display: flex; align-items: center; gap: 8px; font-size: .875rem; min-width: 0; }
  .color-key { width: 12px; height: 12px; background: var(--layer-color); flex-shrink: 0; }
  .contribution-key img { border-radius: 0; flex-shrink: 0; }
  .layer-name { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .layer-name small { display: block; font-size: .8rem; color: var(--muted); }
  .contribution-key strong { font-variant-numeric: tabular-nums; }
  .overlap-note { margin-top: 14px; }
</style>
