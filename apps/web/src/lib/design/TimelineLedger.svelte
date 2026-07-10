<script lang="ts">
  import {
    addDays,
    calculateUsageOnDate,
    formatISODate,
    parseISODate,
    type SchengenStay
  } from '@schngn/engine';
  import type { EditableTrip } from '$lib/trips/tripCrud';
  import { intlLocale, type Locale } from '$lib/i18n';

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
    locale?: Locale;
    mode: TimelineMode;
    referenceDate: string;
    returnDates?: string[];
    simulation?: EditableTrip | null;
    trips: EditableTrip[];
  }

  let {
    horizonDays = 30,
    label,
    locale = 'en',
    mode,
    referenceDate,
    returnDates = [],
    simulation = null,
    trips
  }: TimelineProps = $props();

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

  const legendCatalog: Record<Locale, string[]> = {
    en: ['Past trip', 'Booked trip', 'What-if trip', 'Over the limit', 'Day returned', 'Not counted'],
    fr: ['Voyage passé', 'Voyage réservé', 'Simulation', 'Limite dépassée', 'Jour récupéré', 'Non compté'],
    de: ['Vergangene Reise', 'Gebuchte Reise', 'Was-wäre-wenn', 'Über dem Limit', 'Tag zurück', 'Nicht gezählt'],
    es: ['Viaje pasado', 'Viaje reservado', 'Simulación', 'Sobre el límite', 'Día recuperado', 'No contado'],
    it: ['Viaggio passato', 'Viaggio prenotato', 'Simulazione', 'Oltre il limite', 'Giorno recuperato', 'Non conteggiato'],
    ru: ['Прошлая поездка', 'Забронированная поездка', 'Сценарий', 'Сверх лимита', 'День возвращён', 'Не учитывается'],
    tr: ['Geçmiş seyahat', 'Rezerve seyahat', 'Senaryo', 'Sınırın üzerinde', 'Gün geri döndü', 'Sayılmadı'],
    he: ['נסיעה קודמת', 'נסיעה מוזמנת', 'תרחיש', 'מעל למגבלה', 'יום חזר', 'לא נספר'],
    ar: ['رحلة سابقة', 'رحلة محجوزة', 'سيناريو', 'فوق الحد', 'يوم مستعاد', 'غير محسوب']
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
      summary: rollingSummary(input.locale ?? 'en', usage.daysUsed, usage.daysRemaining, usage.overBy)
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
      summary: returnsSummary(input.locale ?? 'en', returned, days.length)
    };
  }

  function rollingSummary(summaryLocale: Locale, used: number, remaining: number, overBy: number): string {
    const values: Record<Locale, string> = {
      en: `${used} counted ${used === 1 ? 'day' : 'days'} in this inclusive 180-day window. ${overBy > 0 ? `${overBy} ${overBy === 1 ? 'day is' : 'days are'} over the 90-day limit.` : `${remaining} safe buffer ${remaining === 1 ? 'day remains' : 'days remain'}.`}`,
      fr: `${used} ${used === 1 ? 'jour compté' : 'jours comptés'} dans cette fenêtre inclusive de 180 jours. ${overBy > 0 ? `${overBy} au-delà de la limite de 90 jours.` : `${remaining} ${remaining === 1 ? 'jour de marge sûre restant' : 'jours de marge sûre restants'}.`}`,
      de: `${used} ${used === 1 ? 'gezählter Tag' : 'gezählte Tage'} in diesem inklusiven 180-Tage-Fenster. ${overBy > 0 ? `${overBy} über dem 90-Tage-Limit.` : `${remaining} ${remaining === 1 ? 'sicherer Puffertag verbleibt' : 'sichere Puffertage verbleiben'}.`}`,
      es: `${used} ${used === 1 ? 'día contado' : 'días contados'} en esta ventana inclusiva de 180 días. ${overBy > 0 ? `${overBy} por encima del límite de 90 días.` : `Quedan ${remaining} ${remaining === 1 ? 'día de margen seguro' : 'días de margen seguro'}.`}`,
      it: `${used} ${used === 1 ? 'giorno conteggiato' : 'giorni conteggiati'} nella finestra inclusiva di 180 giorni. ${overBy > 0 ? `${overBy} oltre il limite di 90 giorni.` : `Restano ${remaining} ${remaining === 1 ? 'giorno di margine sicuro' : 'giorni di margine sicuro'}.`}`,
      ru: `${used} ${used === 1 ? 'учтённый день' : 'учтённых дней'} в этом 180-дневном окне. ${overBy > 0 ? `Превышение лимита 90 дней: ${overBy}.` : `Безопасный запас: ${remaining} дн.`}`,
      tr: `Bu 180 günlük pencerede ${used} gün sayıldı. ${overBy > 0 ? `90 günlük sınır ${overBy} gün aşıldı.` : `${remaining} güvenli tampon gün kaldı.`}`,
      he: `${used} ימים נספרו בחלון הכולל של 180 יום. ${overBy > 0 ? `חריגה של ${overBy} ימים ממגבלת 90 הימים.` : `נותרו ${remaining} ימי מרווח בטוח.`}`,
      ar: `احتُسب ${used} يومًا في نافذة 180 يومًا الشاملة. ${overBy > 0 ? `تجاوز حد 90 يومًا بمقدار ${overBy}.` : `يتبقى هامش آمن قدره ${remaining} يومًا.`}`
    };
    return values[summaryLocale];
  }

  function returnsSummary(summaryLocale: Locale, returned: number, forecastDays: number): string {
    const values: Record<Locale, string> = {
      en: returned > 0 ? `${returned} counted ${returned === 1 ? 'day returns' : 'days return'} to the allowance during this ${forecastDays}-day forecast.` : `No counted days return to the allowance during this ${forecastDays}-day forecast.`,
      fr: returned > 0 ? `${returned} ${returned === 1 ? 'jour revient' : 'jours reviennent'} pendant cette prévision de ${forecastDays} jours.` : `Aucun jour ne revient pendant cette prévision de ${forecastDays} jours.`,
      de: returned > 0 ? `${returned} ${returned === 1 ? 'Tag kehrt' : 'Tage kehren'} in dieser ${forecastDays}-Tage-Prognose zurück.` : `In dieser ${forecastDays}-Tage-Prognose kehren keine Tage zurück.`,
      es: returned > 0 ? `${returned} ${returned === 1 ? 'día vuelve' : 'días vuelven'} durante esta previsión de ${forecastDays} días.` : `No vuelve ningún día durante esta previsión de ${forecastDays} días.`,
      it: returned > 0 ? `${returned} ${returned === 1 ? 'giorno torna' : 'giorni tornano'} nella previsione di ${forecastDays} giorni.` : `Nessun giorno torna nella previsione di ${forecastDays} giorni.`,
      ru: returned > 0 ? `За прогнозные ${forecastDays} дней вернётся дней: ${returned}.` : `За прогнозные ${forecastDays} дней учтённые дни не вернутся.`,
      tr: returned > 0 ? `${forecastDays} günlük tahminde ${returned} gün geri döner.` : `${forecastDays} günlük tahminde sayılan gün geri dönmez.`,
      he: returned > 0 ? `${returned} ימים חוזרים במהלך תחזית של ${forecastDays} יום.` : `לא חוזרים ימים במהלך תחזית של ${forecastDays} יום.`,
      ar: returned > 0 ? `يعود ${returned} يومًا خلال توقع ${forecastDays} يومًا.` : `لا تعود أيام خلال توقع ${forecastDays} يومًا.`
    };
    return values[summaryLocale];
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
</script>

<section class="timeline-card" aria-labelledby="timeline-heading">
  <div class="timeline-head">
    <h2 id="timeline-heading">{label}</h2>
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

    .timeline-head > bdi {
      text-align: start;
    }
  }
</style>
