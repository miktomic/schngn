<script lang="ts">
  import { addDays, formatISODate, parseISODate } from '@schngn/engine';
  import { formatDate, type Locale } from '$lib/i18n';
  import { toEngineTrips, tripExitDate, type EditableTrip } from '$lib/trips/tripCrud';

  interface MiniTimelineProps {
    color: string;
    label: string;
    locale?: Locale;
    referenceDate: string;
    trip: EditableTrip;
  }

  interface MiniTimelineSegment {
    days: number;
    startOffset: number;
  }

  interface MiniTimelineModel {
    endDate: string;
    segments: MiniTimelineSegment[];
    startDate: string;
  }

  let {
    color,
    label,
    locale = 'en',
    referenceDate,
    trip
  }: MiniTimelineProps = $props();

  let model = $derived(buildTimelineModel(trip, referenceDate));

  function buildTimelineModel(inputTrip: EditableTrip, suppliedEndDate: string): MiniTimelineModel {
    const suppliedStartDate = shiftDate(suppliedEndDate, -179);
    const exitDate = tripExitDate(inputTrip);

    // Anchor trips that finish outside the supplied rolling window to their
    // own final day so both older trips and later plans remain visible.
    const endsOutsideWindow = exitDate < suppliedStartDate || exitDate > suppliedEndDate;
    const endDate = endsOutsideWindow ? exitDate : suppliedEndDate;
    const startDate = shiftDate(endDate, -179);
    const segments = toEngineTrips([inputTrip], suppliedEndDate)
      .sort((left, right) => left.entryDate.localeCompare(right.entryDate))
      .flatMap((stay): MiniTimelineSegment[] => {
        const visibleStart = stay.entryDate < startDate ? startDate : stay.entryDate;
        const visibleEnd = stay.exitDate > endDate ? endDate : stay.exitDate;
        if (visibleStart > visibleEnd) return [];

        return [{
          days: dayDistance(visibleStart, visibleEnd) + 1,
          startOffset: dayDistance(startDate, visibleStart)
        }];
      });

    return { endDate, segments, startDate };
  }

  function shiftDate(isoDate: string, days: number): string {
    return formatISODate(addDays(parseISODate(isoDate), days));
  }

  function dayDistance(startDate: string, endDate: string): number {
    return Math.round((parseISODate(endDate).getTime() - parseISODate(startDate).getTime()) / 86_400_000);
  }

  function formatTick(isoDate: string): string {
    return formatDate(locale, isoDate, { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<figure
  class="trip-mini-timeline"
  style={`--trip-color: ${color}`}
  role="img"
  aria-label={label}
  dir="ltr"
>
  <span class="trip-mini-track" aria-hidden="true">
    {#each model.segments as segment, index (`${segment.startOffset}-${segment.days}-${index}`)}
      <span
        class="trip-mini-segment"
        style={`--segment-start: ${(segment.startOffset / 180) * 100}%; --segment-width: ${(segment.days / 180) * 100}%`}
      ></span>
    {/each}
  </span>
  <span class="trip-mini-ticks" aria-hidden="true">
    <time datetime={model.startDate}><bdi>{formatTick(model.startDate)}</bdi></time>
    <time datetime={model.endDate}><bdi>{formatTick(model.endDate)}</bdi></time>
  </span>
</figure>

<style>
  .trip-mini-timeline {
    display: grid;
    gap: 4px;
    width: 100%;
    min-width: 0;
    margin: 0;
  }

  .trip-mini-track {
    position: relative;
    display: block;
    width: 100%;
    min-width: 0;
    height: 14px;
    overflow: hidden;
    border: 1px solid var(--control-line, #718079);
    border-radius: 4px;
    background: var(--surface, #ffffff);
  }

  .trip-mini-segment {
    position: absolute;
    inset-block: 2px;
    inset-inline-start: var(--segment-start);
    width: var(--segment-width);
    min-width: 1px;
    border-radius: 2px;
    background: var(--trip-color, #1f5f9f);
  }

  .trip-mini-ticks {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: var(--muted, #4f5f59);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.68rem;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
  }

  .trip-mini-ticks time {
    min-width: 0;
    white-space: nowrap;
  }

  .trip-mini-ticks time:last-child {
    text-align: end;
  }
</style>
