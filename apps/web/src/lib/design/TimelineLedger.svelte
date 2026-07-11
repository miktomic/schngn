<script lang="ts">
  import {
    addDays,
    calculateUsageOnDate,
    formatISODate,
    parseISODate,
    type SchengenStay
  } from '@schngn/engine';
  import { tripEntryDate, tripExitDate, type EditableTrip } from '$lib/trips/tripCrud';
  import { intlLocale, type Locale } from '$lib/i18n';
  import { createWhatIfUiTranslator } from '$lib/i18n/whatIfUi';
  import { formatReturnsTimelineSummary, formatRollingTimelineSummary } from '$lib/i18n/timelineUi';

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

  interface TimelineTripLaneSegment {
    days: number;
    endDate: string;
    startDate: string;
    startOffset: number;
  }

  interface TimelineTripLane {
    kind: SegmentKind;
    segments: TimelineTripLaneSegment[];
    trip: EditableTrip;
  }

  interface TimelineProps {
    headingId?: string;
    horizonDays?: number;
    label: string;
    locale?: Locale;
    mode: TimelineMode;
    onTripSelect?: (trip: EditableTrip) => void;
    referenceDate: string;
    returnDates?: string[];
    selectedTripId?: string | null;
    simulation?: EditableTrip | null;
    tripName?: (trip: EditableTrip) => string;
    trips: EditableTrip[];
  }

  let {
    headingId: requestedHeadingId,
    horizonDays = 30,
    label,
    locale = 'en',
    mode,
    onTripSelect,
    referenceDate,
    returnDates = [],
    selectedTripId = null,
    simulation = null,
    tripName = (trip: EditableTrip) => trip.label ?? 'Trip',
    trips
  }: TimelineProps = $props();

  const instanceId = $props.id();
  let headingId = $derived(requestedHeadingId ?? `${instanceId}-heading`);

  let model = $derived(buildTimelineModel({
    horizonDays,
    locale,
    mode,
    referenceDate,
    returnDates,
    simulation,
    trips
  }));
  let visibleKinds = $derived(new Set(model.segments.map((segment) => segment.kind)));
  let adjustmentCopy = $derived(createWhatIfUiTranslator(locale));
  let tripLanes = $derived(buildTripLanes(trips, model.startDate, model.endDate));

  const legendCatalog: Record<Locale, string[]> = {
    en: ['Past trip', 'Trip', 'What-if trip', 'Over the limit', 'Day returned', 'Not counted'],
    fr: ['Voyage passé', 'Voyage', 'Simulation', 'Limite dépassée', 'Jour récupéré', 'Non compté'],
    de: ['Vergangene Reise', 'Reise', 'Was-wäre-wenn', 'Über dem Limit', 'Tag zurück', 'Nicht gezählt'],
    es: ['Viaje pasado', 'Viaje', 'Simulación', 'Sobre el límite', 'Día recuperado', 'No contado'],
    it: ['Viaggio passato', 'Viaggio', 'Simulazione', 'Oltre il limite', 'Giorno recuperato', 'Non conteggiato'],
    ru: ['Прошлая поездка', 'Поездка', 'Сценарий', 'Сверх лимита', 'День возвращён', 'Не учитывается'],
    tr: ['Geçmiş seyahat', 'Seyahat', 'Senaryo', 'Sınırın üzerinde', 'Gün geri döndü', 'Sayılmadı'],
    he: ['נסיעה קודמת', 'נסיעה', 'תרחיש', 'מעל למגבלה', 'יום חזר', 'לא נספר'],
    ar: ['رحلة سابقة', 'رحلة', 'سيناريو', 'فوق الحد', 'يوم مستعاد', 'غير محسوب']
  };
  const timelineAriaLabel: Record<Locale, string> = { en:'Timeline legend',fr:'Légende de la chronologie',de:'Zeitachsenlegende',es:'Leyenda de la cronología',it:'Legenda della cronologia',ru:'Легенда шкалы времени',tr:'Zaman çizelgesi açıklaması',he:'מקרא ציר הזמן',ar:'مفتاح المخطط الزمني' };
  const dateRangeLabel: Record<Locale, string> = { en:'Date range',fr:'Plage de dates',de:'Datumsbereich',es:'Intervalo de fechas',it:'Intervallo di date',ru:'Диапазон дат',tr:'Tarih aralığı',he:'טווח תאריכים',ar:'نطاق التاريخ' };
  let legendItems = $derived((['past', 'booked', 'whatif', 'risk', 'return', 'empty'] as SegmentKind[]).map((kind, index) => ({ kind, label: legendCatalog[locale][index] })));

  function buildTimelineModel(input: Omit<TimelineProps, 'label'>): TimelineModel {
    if (input.mode === 'returns') return buildReturnsTimeline(input);
    return buildRollingWindowTimeline(input);
  }

  function buildRollingWindowTimeline(input: Omit<TimelineProps, 'label'>): TimelineModel {
    const reference = parseISODate(input.referenceDate);
    const start = addDays(reference, -179);
    const startDate = formatISODate(start);
    const endDate = formatISODate(reference);
    const allTrips: SchengenStay[] = [
      ...input.trips.flatMap((trip) => trip.stays.map((stay) => ({ ...stay, label: trip.label }))),
      ...(input.simulation ? input.simulation.stays.map((stay) => ({ ...stay, label: input.simulation?.label })) : [])
    ];
    const usage = calculateUsageOnDate(allTrips, endDate);
    const riskDays = new Set(usage.overLimit ? usage.countedDays.slice(90) : []);
    const kindByDate = new Map<string, SegmentKind>();

    for (const trip of input.trips) {
      for (const stay of trip.stays) addTripDays(kindByDate, stay, statusKind(trip.status), startDate, endDate);
    }
    if (input.simulation) {
      for (const stay of input.simulation.stays) addTripDays(kindByDate, stay, 'whatif', startDate, endDate);
    }
    for (const day of riskDays) kindByDate.set(day, 'risk');

    const days = isoDateRange(startDate, endDate);
    const segments = groupDays(days, (day) => kindByDate.get(day) ?? 'empty');

    return {
      dayCount: days.length,
      endDate,
      rangeLabel: formatDateRange(startDate, endDate, input.locale ?? 'en'),
      segments,
      startDate,
      summary: formatRollingTimelineSummary(input.locale ?? 'en', usage.daysUsed, usage.daysRemaining, usage.overBy)
    };
  }

  function buildReturnsTimeline(input: Omit<TimelineProps, 'label'>): TimelineModel {
    const startDate = formatISODate(addDays(parseISODate(input.referenceDate), 1));
    const endDate = formatISODate(addDays(parseISODate(input.referenceDate), input.horizonDays ?? 30));
    const returnDateSet = new Set(input.returnDates);
    const days = isoDateRange(startDate, endDate);
    const returned = days.filter((day) => returnDateSet.has(day)).length;
    const segments = groupDays(days, (day) => (returnDateSet.has(day) ? 'return' : 'empty'));

    return {
      dayCount: days.length,
      endDate,
      rangeLabel: formatDateRange(startDate, endDate, input.locale ?? 'en'),
      segments,
      startDate,
      summary: formatReturnsTimelineSummary(input.locale ?? 'en', returned, days.length)
    };
  }

  function addTripDays(
    kindByDate: Map<string, SegmentKind>,
    trip: SchengenStay,
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

  function statusKind(_status: EditableTrip['status']): SegmentKind {
    return 'booked';
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

  function formatDateRange(startDate: string, endDate: string, rangeLocale: Locale = locale): string {
    const start = parseISODate(startDate);
    const end = parseISODate(endDate);
    if (startDate === endDate) {
      return new Intl.DateTimeFormat(intlLocale(rangeLocale), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(start);
    }
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();
    const startLabel = new Intl.DateTimeFormat(intlLocale(rangeLocale), {
      day: 'numeric',
      month: 'short',
      ...(startYear !== endYear ? { year: 'numeric' as const } : {}),
      timeZone: 'UTC'
    }).format(start);
    const endLabel = new Intl.DateTimeFormat(intlLocale(rangeLocale), {
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

  function tripLaneLabel(trip: EditableTrip): string {
    const range = formatDateRange(tripEntryDate(trip), tripExitDate(trip));
    return `${adjustmentCopy('adjust')} ${tripName(trip)}. ${range}`;
  }

  function buildTripLanes(inputTrips: EditableTrip[], windowStart: string, windowEnd: string): TimelineTripLane[] {
    return inputTrips
      .map((trip): TimelineTripLane | null => {
        const segments = trip.stays.flatMap((stay): TimelineTripLaneSegment[] => {
          const startDate = stay.entryDate < windowStart ? windowStart : stay.entryDate;
          const endDate = stay.exitDate > windowEnd ? windowEnd : stay.exitDate;
          if (startDate > endDate) return [];
          return [{
            days: dayDistance(startDate, endDate) + 1,
            endDate,
            startDate,
            startOffset: dayDistance(windowStart, startDate)
          }];
        });
        return segments.length > 0 ? { kind: statusKind(trip.status), segments, trip } : null;
      })
      .filter((lane): lane is TimelineTripLane => lane !== null)
      .sort((left, right) => tripEntryDate(left.trip).localeCompare(tripEntryDate(right.trip))
        || tripExitDate(left.trip).localeCompare(tripExitDate(right.trip))
        || left.trip.id.localeCompare(right.trip.id));
  }

  function dayDistance(startDate: string, endDate: string): number {
    return Math.round((parseISODate(endDate).getTime() - parseISODate(startDate).getTime()) / 86_400_000);
  }
</script>

<section class="timeline-card" aria-labelledby={headingId}>
  <div class="timeline-head">
    <h2 id={headingId}>{label}</h2>
    <bdi>{model.rangeLabel}</bdi>
  </div>
  <div
    class="timeline-rail"
    style={`--timeline-days: ${model.dayCount}`}
    role="img"
    aria-label={`${label}. ${model.summary} ${dateRangeLabel[locale]} ${model.rangeLabel}.`}
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
    <bdi>{formatDateRange(model.startDate, model.startDate)}</bdi>
    <bdi>{formatDateRange(model.endDate, model.endDate)}</bdi>
  </div>
  <p class="timeline-summary">{model.summary}</p>
  {#if onTripSelect && tripLanes.length > 0}
    <section class="timeline-trip-lanes" aria-label={adjustmentCopy('tripToAdjust')}>
      <p>{adjustmentCopy('chooseTrip')}</p>
      <div class="timeline-trip-lane-list">
        {#each tripLanes as lane (lane.trip.id)}
          <button
            class:selected={selectedTripId === lane.trip.id}
            class="timeline-trip-lane"
            type="button"
            aria-label={tripLaneLabel(lane.trip)}
            aria-pressed={selectedTripId === lane.trip.id}
            onclick={() => onTripSelect?.(lane.trip)}
          >
            <span class="timeline-trip-name">
              <strong><bdi>{tripName(lane.trip)}</bdi></strong>
              <small><bdi>{formatDateRange(tripEntryDate(lane.trip), tripExitDate(lane.trip))}</bdi></small>
            </span>
            <span class="timeline-trip-track" style={`--timeline-days: ${model.dayCount}`} aria-hidden="true">
              {#each lane.segments as segment, index (`${lane.trip.id}-${segment.startDate}-${index}`)}
                <span
                  class={`timeline-trip-segment ${lane.kind}`}
                  style={`grid-column: ${segment.startOffset + 1} / span ${segment.days}`}
                ></span>
              {/each}
            </span>
          </button>
        {/each}
      </div>
    </section>
  {/if}
  <ul class="timeline-legend" aria-label={timelineAriaLabel[locale]}>
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

  .timeline-head > bdi,
  .timeline-ticks {
    color: var(--muted);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.75rem;
    font-weight: 650;
  }

  .timeline-head > bdi {
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

  .timeline-trip-lanes {
    display: grid;
    gap: 8px;
    border-top: 1px solid var(--line);
    padding-top: 10px;
  }

  .timeline-trip-lanes > p {
    margin: 0;
    color: var(--ink);
    font-size: 0.85rem;
    font-weight: 750;
  }

  .timeline-trip-lane-list {
    display: grid;
    gap: 6px;
    max-height: 360px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .timeline-trip-lane {
    display: grid;
    grid-template-columns: minmax(120px, 0.32fr) minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    padding: 6px 8px;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  .timeline-trip-lane:hover {
    border-color: var(--muted);
  }

  .timeline-trip-lane.selected {
    border-color: var(--whatif);
    background: var(--whatif-bg);
  }

  .timeline-trip-lane:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--whatif), transparent 35%);
    outline-offset: 2px;
  }

  .timeline-trip-name {
    display: grid;
    min-width: 0;
    gap: 1px;
  }

  .timeline-trip-name strong,
  .timeline-trip-name small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .timeline-trip-name strong { font-size: 0.82rem; }
  .timeline-trip-name small {
    color: var(--muted);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.68rem;
  }

  .timeline-trip-track {
    display: grid;
    grid-template-columns: repeat(var(--timeline-days), minmax(0, 1fr));
    min-width: 0;
    min-height: 20px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 5px;
    background: var(--paper);
    padding: 2px;
  }

  .timeline-trip-segment {
    min-width: 1px;
    border-radius: 2px;
  }

  .timeline-trip-segment.past { background: var(--past); }
  .timeline-trip-segment.booked { background: var(--booked); }
  .timeline-trip-segment.whatif { background: var(--whatif); }

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

  @media (max-width: 620px) {
    .timeline-trip-lane {
      grid-template-columns: 1fr;
      gap: 5px;
    }
  }

  @media (max-width: 520px) {
    .timeline-head {
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }

    .timeline-head > bdi {
      text-align: start;
    }
  }
</style>
