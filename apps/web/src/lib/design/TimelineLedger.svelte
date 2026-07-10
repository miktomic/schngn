<script lang="ts">
  import {
    addDays,
    calculateUsageOnDate,
    countsForShortStay,
    formatISODate,
    parseISODate,
    type Trip
  } from '@schngn/engine';
  import type { EditableTrip } from '$lib/trips/tripCrud';

  type TimelineMode = 'safe' | 'risk' | 'planner' | 'returns';
  type SegmentKind = 'past' | 'booked' | 'whatif' | 'risk' | 'return' | 'empty';

  interface TimelineSegment {
    days: number;
    endDate: string;
    kind: SegmentKind;
    startDate: string;
  }

  interface TimelineModel {
    dayCount: number;
    endDate: string;
    rangeLabel: string;
    segments: TimelineSegment[];
    startDate: string;
    summary: string;
  }

  interface TimelineProps {
    horizonDays?: number;
    label: string;
    mode: TimelineMode;
    referenceDate: string;
    returnDates?: string[];
    simulation?: Trip | null;
    trips: EditableTrip[];
  }

  let {
    horizonDays = 30,
    label,
    mode,
    referenceDate,
    returnDates = [],
    simulation = null,
    trips
  }: TimelineProps = $props();

  let model = $derived(buildTimelineModel({
    horizonDays,
    mode,
    referenceDate,
    returnDates,
    simulation,
    trips
  }));
  let visibleKinds = $derived(new Set(model.segments.map((segment) => segment.kind)));

  const legendItems: { kind: SegmentKind; label: string }[] = [
    { kind: 'past', label: 'Past trip' },
    { kind: 'booked', label: 'Booked trip' },
    { kind: 'whatif', label: 'What-if trip' },
    { kind: 'risk', label: 'Over the limit' },
    { kind: 'return', label: 'Day returned' },
    { kind: 'empty', label: 'Not counted' }
  ];

  function buildTimelineModel(input: Omit<TimelineProps, 'label'>): TimelineModel {
    if (input.mode === 'returns') return buildReturnsTimeline(input);
    return buildRollingWindowTimeline(input);
  }

  function buildRollingWindowTimeline(input: Omit<TimelineProps, 'label'>): TimelineModel {
    const reference = parseISODate(input.referenceDate);
    const start = addDays(reference, -179);
    const startDate = formatISODate(start);
    const endDate = formatISODate(reference);
    const allTrips: Trip[] = [
      ...input.trips.map(({ countryCode, entryDate, exitDate, label: tripLabel }) => ({
        countryCode,
        entryDate,
        exitDate,
        label: tripLabel
      })),
      ...(input.simulation ? [input.simulation] : [])
    ];
    const usage = calculateUsageOnDate(allTrips, endDate);
    const riskDays = new Set(usage.overLimit ? usage.countedDays.slice(90) : []);
    const kindByDate = new Map<string, SegmentKind>();

    for (const trip of input.trips) {
      if (!countsForShortStay(trip)) continue;
      addTripDays(kindByDate, trip, statusKind(trip.status), startDate, endDate);
    }
    if (input.simulation && countsForShortStay(input.simulation)) {
      addTripDays(kindByDate, input.simulation, 'whatif', startDate, endDate);
    }
    for (const day of riskDays) kindByDate.set(day, 'risk');

    const days = isoDateRange(startDate, endDate);
    const segments = groupDays(days, (day) => kindByDate.get(day) ?? 'empty');
    const tripWord = usage.daysUsed === 1 ? 'day' : 'days';
    const allowanceCopy = usage.overLimit
      ? `${usage.overBy} ${usage.overBy === 1 ? 'day is' : 'days are'} over the 90-day limit.`
      : `${usage.daysRemaining} safe buffer ${usage.daysRemaining === 1 ? 'day remains' : 'days remain'}.`;

    return {
      dayCount: days.length,
      endDate,
      rangeLabel: formatDateRange(startDate, endDate),
      segments,
      startDate,
      summary: `${usage.daysUsed} counted ${tripWord} in this inclusive 180-day window. ${allowanceCopy}`
    };
  }

  function buildReturnsTimeline(input: Omit<TimelineProps, 'label'>): TimelineModel {
    const startDate = formatISODate(addDays(parseISODate(input.referenceDate), 1));
    const endDate = formatISODate(addDays(parseISODate(input.referenceDate), input.horizonDays));
    const returnDateSet = new Set(input.returnDates);
    const days = isoDateRange(startDate, endDate);
    const returned = days.filter((day) => returnDateSet.has(day)).length;
    const segments = groupDays(days, (day) => (returnDateSet.has(day) ? 'return' : 'empty'));

    return {
      dayCount: days.length,
      endDate,
      rangeLabel: formatDateRange(startDate, endDate),
      segments,
      startDate,
      summary: returned > 0
        ? `${returned} counted ${returned === 1 ? 'day returns' : 'days return'} to the allowance during this ${days.length}-day forecast.`
        : `No counted days return to the allowance during this ${days.length}-day forecast.`
    };
  }

  function addTripDays(
    kindByDate: Map<string, SegmentKind>,
    trip: Trip,
    kind: SegmentKind,
    windowStart: string,
    windowEnd: string
  ): void {
    const start = trip.entryDate < windowStart ? windowStart : trip.entryDate;
    const end = trip.exitDate > windowEnd ? windowEnd : trip.exitDate;
    if (start > end) return;

    for (const day of isoDateRange(start, end)) {
      const existing = kindByDate.get(day);
      if (!existing || segmentPriority(kind) >= segmentPriority(existing)) kindByDate.set(day, kind);
    }
  }

  function statusKind(status: EditableTrip['status']): SegmentKind {
    if (status === 'booked') return 'booked';
    if (status === 'what-if') return 'whatif';
    return 'past';
  }

  function segmentPriority(kind: SegmentKind): number {
    if (kind === 'risk') return 5;
    if (kind === 'whatif') return 4;
    if (kind === 'booked') return 3;
    if (kind === 'past') return 2;
    if (kind === 'return') return 1;
    return 0;
  }

  function isoDateRange(startDate: string, endDate: string): string[] {
    const days: string[] = [];
    const end = parseISODate(endDate);
    for (let current = parseISODate(startDate); current <= end; current = addDays(current, 1)) {
      days.push(formatISODate(current));
    }
    return days;
  }

  function groupDays(days: string[], kindForDay: (day: string) => SegmentKind): TimelineSegment[] {
    const segments: TimelineSegment[] = [];
    for (const day of days) {
      const kind = kindForDay(day);
      const previous = segments.at(-1);
      if (previous?.kind === kind) {
        previous.days += 1;
        previous.endDate = day;
      } else {
        segments.push({ days: 1, endDate: day, kind, startDate: day });
      }
    }
    return segments;
  }

  function formatDateRange(startDate: string, endDate: string): string {
    const start = parseISODate(startDate);
    const end = parseISODate(endDate);
    if (startDate === endDate) {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(start);
    }
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();
    const startLabel = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      ...(startYear !== endYear ? { year: 'numeric' as const } : {}),
      timeZone: 'UTC'
    }).format(start);
    const endLabel = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(end);
    return `${startLabel}–${endLabel}`;
  }

  function segmentTitle(segment: TimelineSegment): string {
    const labelForKind = legendItems.find((item) => item.kind === segment.kind)?.label ?? segment.kind;
    return `${labelForKind}: ${formatDateRange(segment.startDate, segment.endDate)}`;
  }
</script>

<section class="timeline-card" aria-labelledby="timeline-heading">
  <div class="timeline-head">
    <h2 id="timeline-heading">{label}</h2>
    <span>{model.rangeLabel}</span>
  </div>
  <div
    class="timeline-rail"
    style={`--timeline-days: ${model.dayCount}`}
    role="img"
    aria-label={`${label}. ${model.summary} Date range ${model.rangeLabel}.`}
  >
    {#each model.segments as segment, index (`${segment.startDate}-${segment.kind}-${index}`)}
      <span
        class={`timeline-segment ${segment.kind}`}
        style={`grid-column: span ${segment.days}`}
        title={segmentTitle(segment)}
      ></span>
    {/each}
  </div>
  <div class="timeline-ticks" aria-hidden="true">
    <span>{formatDateRange(model.startDate, model.startDate)}</span>
    <span>{formatDateRange(model.endDate, model.endDate)}</span>
  </div>
  <p class="timeline-summary">{model.summary}</p>
  <ul class="timeline-legend" aria-label="Timeline legend">
    {#each legendItems as item}
      {#if visibleKinds.has(item.kind)}
        <li><span class={item.kind}></span>{item.label}</li>
      {/if}
    {/each}
  </ul>
</section>

<style>
  .timeline-card {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 14px;
  }

  .timeline-head,
  .timeline-ticks,
  .timeline-legend {
    display: flex;
    align-items: center;
  }

  .timeline-head,
  .timeline-ticks {
    justify-content: space-between;
    gap: 12px;
  }

  .timeline-card h2 {
    min-width: 0;
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .timeline-head > span,
  .timeline-ticks {
    color: var(--muted);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.75rem;
    font-weight: 650;
  }

  .timeline-head > span {
    flex: 0 1 auto;
    text-align: end;
  }

  .timeline-rail {
    display: grid;
    grid-template-columns: repeat(var(--timeline-days), minmax(0, 1fr));
    gap: 1px;
    min-height: 34px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    padding: 3px;
  }

  .timeline-segment {
    min-width: 1px;
    border-radius: 3px;
  }

  .timeline-segment.past,
  .timeline-legend .past { background: var(--past); }
  .timeline-segment.booked,
  .timeline-legend .booked { background: var(--booked); }
  .timeline-segment.whatif,
  .timeline-legend .whatif { background: var(--whatif); }
  .timeline-segment.risk,
  .timeline-legend .risk { background: var(--risk); }
  .timeline-segment.return,
  .timeline-legend .return { background: var(--safe); }
  .timeline-segment.empty { background: var(--surface); }
  .timeline-legend .empty {
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .timeline-summary {
    max-width: 72ch;
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .timeline-legend {
    flex-wrap: wrap;
    gap: 8px 14px;
    margin: 0;
    padding: 0;
    color: var(--muted);
    font-size: 0.8rem;
    list-style: none;
  }

  .timeline-legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .timeline-legend li > span {
    width: 11px;
    height: 11px;
    flex: 0 0 auto;
    border-radius: 2px;
  }

  @media (max-width: 520px) {
    .timeline-head {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }

    .timeline-head > span {
      text-align: start;
    }
  }
</style>
