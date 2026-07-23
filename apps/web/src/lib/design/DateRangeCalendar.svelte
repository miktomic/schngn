<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { addDays, formatISODate, parseISODate } from '@schngn/engine';
  import { formatDate, type Locale } from '$lib/i18n';
  import {
    buildCalendarMonth,
    calendarMonthStart,
    inclusiveCalendarDays,
    isISOCalendarDate,
    orderDateRange,
    shiftCalendarDateMonth,
    shiftCalendarMonth,
    type OrderedDateRange
  } from '$lib/calendar/dateRangeCalendar';
  import {
    createDateRangeCalendarUiTranslator,
    formatCalendarDayNumber,
    formatDateRangeSelection
  } from '$lib/i18n/dateRangeCalendarUi';

  interface DateRangeCalendarProps {
    entryDate: string;
    exitDate: string;
    locale?: Locale;
    onRangeChange: (range: OrderedDateRange) => void;
    today: string;
  }

  interface DragSelection {
    anchor: string;
    moved: boolean;
    pointerId: number;
    previousRange: OrderedDateRange;
    previousSelectingExit: boolean;
    previousSelectionAnchor: string | null;
    startedWithEntry: boolean;
  }

  let {
    entryDate,
    exitDate,
    locale = 'en',
    onRangeChange,
    today
  }: DateRangeCalendarProps = $props();

  function initialCalendarDate(): string {
    return isISOCalendarDate(entryDate) ? entryDate : today;
  }

  let root: HTMLElement;
  let viewMonth = $state(calendarMonthStart(initialCalendarDate()));
  let focusDate = $state(initialCalendarDate());
  let selectionAnchor = $state<string | null>(null);
  let selectingExit = $state(false);
  let dragSelection = $state<DragSelection | null>(null);
  let singleMonth = $state(false);
  let suppressClick = $state(false);
  let pendingRangeKey: string | null = null;

  let ui = $derived(createDateRangeCalendarUiTranslator(locale));
  let isRtl = $derived(locale === 'he' || locale === 'ar');
  let months = $derived([
    buildCalendarMonth(viewMonth, locale),
    buildCalendarMonth(shiftCalendarMonth(viewMonth, 1), locale)
  ]);
  let selectedDays = $derived(inclusiveCalendarDays(entryDate, exitDate));
  let status = $derived(
    selectingExit
      ? ui('chooseExit')
      : selectedDays > 0
        ? formatDateRangeSelection(locale, selectedDays)
        : ''
  );

  function rangeKey(range: OrderedDateRange): string {
    return `${range.entryDate}\u0000${range.exitDate}`;
  }

  function emitRange(range: OrderedDateRange): void {
    pendingRangeKey = rangeKey(range);
    onRangeChange(range);
  }

  $effect(() => {
    const nextRange = { entryDate, exitDate };
    const nextKey = rangeKey(nextRange);
    if (pendingRangeKey === nextKey) {
      pendingRangeKey = null;
      return;
    }

    pendingRangeKey = null;
    selectionAnchor = null;
    selectingExit = false;
    dragSelection = null;
    suppressClick = false;
    if (isISOCalendarDate(entryDate)) {
      focusDate = entryDate;
      viewMonth = calendarMonthStart(entryDate);
    }
  });

  onMount(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const syncSingleMonth = (): void => {
      singleMonth = media.matches;
      if (singleMonth && calendarMonthStart(focusDate) !== viewMonth) {
        viewMonth = calendarMonthStart(focusDate);
      }
    };
    syncSingleMonth();
    media.addEventListener('change', syncSingleMonth);
    return () => media.removeEventListener('change', syncSingleMonth);
  });

  function isSelected(date: string): boolean {
    return isISOCalendarDate(entryDate)
      && isISOCalendarDate(exitDate)
      && date >= entryDate
      && date <= exitDate;
  }

  function chooseDate(date: string): void {
    focusDate = date;
    if (selectingExit && selectionAnchor) {
      emitRange(orderDateRange(selectionAnchor, date));
      selectingExit = false;
      selectionAnchor = null;
      return;
    }

    selectionAnchor = date;
    selectingExit = true;
    emitRange({ entryDate: date, exitDate: date });
  }

  function handleDayClick(date: string): void {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    chooseDate(date);
  }

  function handlePointerDown(event: PointerEvent, date: string): void {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLButtonElement).focus();
    suppressClick = true;
    focusDate = date;

    const startedWithEntry = selectingExit && selectionAnchor !== null;
    const anchor = startedWithEntry ? selectionAnchor! : date;
    const previousRange = { entryDate, exitDate };
    const previousSelectingExit = selectingExit;
    const previousSelectionAnchor = selectionAnchor;
    if (!startedWithEntry) {
      selectionAnchor = date;
      selectingExit = true;
    }
    emitRange(orderDateRange(anchor, date));
    dragSelection = {
      anchor,
      moved: anchor !== date,
      pointerId: event.pointerId,
      previousRange,
      previousSelectingExit,
      previousSelectionAnchor,
      startedWithEntry
    };
    root.setPointerCapture?.(event.pointerId);
  }

  function dateAtPointer(event: PointerEvent): string | null {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const day = target?.closest<HTMLButtonElement>('[data-calendar-date]');
    return day && root.contains(day) ? day.dataset.calendarDate ?? null : null;
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!dragSelection || dragSelection.pointerId !== event.pointerId) return;
    const date = dateAtPointer(event);
    if (!date) return;
    if (date !== dragSelection.anchor) dragSelection.moved = true;
    focusDate = date;
    emitRange(orderDateRange(dragSelection.anchor, date));
  }

  function finishPointerSelection(event: PointerEvent): void {
    if (!dragSelection || dragSelection.pointerId !== event.pointerId) return;
    const completed = dragSelection.moved || dragSelection.startedWithEntry;
    dragSelection = null;
    if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
    if (completed) {
      selectingExit = false;
      selectionAnchor = null;
    }
  }

  function cancelPointerSelection(event: PointerEvent): void {
    if (!dragSelection || dragSelection.pointerId !== event.pointerId) return;
    const canceled = dragSelection;
    dragSelection = null;
    if (root.hasPointerCapture?.(event.pointerId)) root.releasePointerCapture(event.pointerId);
    selectionAnchor = canceled.previousSelectionAnchor;
    selectingExit = canceled.previousSelectingExit;
    suppressClick = false;
    emitRange(canceled.previousRange);
  }

  async function focusCalendarDate(date: string, forceMonth = false): Promise<void> {
    focusDate = date;
    const targetMonth = calendarMonthStart(date);
    const targetIsVisible = targetMonth === viewMonth
      || (!singleMonth && targetMonth === shiftCalendarMonth(viewMonth, 1));
    if (forceMonth || !targetIsVisible) {
      viewMonth = targetMonth;
    }
    await tick();
    root.querySelector<HTMLButtonElement>(`[data-calendar-date="${date}"]`)?.focus();
  }

  function mondayIndex(date: string): number {
    return (parseISODate(date).getUTCDay() + 6) % 7;
  }

  async function handleDayKeydown(event: KeyboardEvent, date: string): Promise<void> {
    let targetDate: string | null = null;
    let forceMonth = false;

    switch (event.key) {
      case 'ArrowLeft': targetDate = formatISODate(addDays(parseISODate(date), isRtl ? 1 : -1)); break;
      case 'ArrowRight': targetDate = formatISODate(addDays(parseISODate(date), isRtl ? -1 : 1)); break;
      case 'ArrowUp': targetDate = formatISODate(addDays(parseISODate(date), -7)); break;
      case 'ArrowDown': targetDate = formatISODate(addDays(parseISODate(date), 7)); break;
      case 'Home': targetDate = formatISODate(addDays(parseISODate(date), -mondayIndex(date))); break;
      case 'End': targetDate = formatISODate(addDays(parseISODate(date), 6 - mondayIndex(date))); break;
      case 'PageUp': targetDate = shiftCalendarDateMonth(date, -1); forceMonth = true; break;
      case 'PageDown': targetDate = shiftCalendarDateMonth(date, 1); forceMonth = true; break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        chooseDate(date);
        return;
      default:
        return;
    }

    event.preventDefault();
    await focusCalendarDate(targetDate, forceMonth);
  }

  async function navigateMonth(offset: number): Promise<void> {
    viewMonth = shiftCalendarMonth(viewMonth, offset);
    focusDate = viewMonth;
    await tick();
    root.querySelector<HTMLButtonElement>(`[data-calendar-date="${focusDate}"]`)?.focus();
  }
</script>

<section
  bind:this={root}
  class="date-range-calendar"
  role="group"
  aria-label={ui('chooseRange')}
  onpointermove={handlePointerMove}
  onpointerup={finishPointerSelection}
  onpointercancel={cancelPointerSelection}
  onlostpointercapture={cancelPointerSelection}
>
  <div class="calendar-toolbar" dir={isRtl ? 'rtl' : 'ltr'}>
    <button class="month-navigation" type="button" aria-label={ui('previousMonth')} onclick={() => navigateMonth(-1)}>{isRtl ? '→' : '←'}</button>
    <p><bdi>{ui('instructions')}</bdi></p>
    <button class="month-navigation" type="button" aria-label={ui('nextMonth')} onclick={() => navigateMonth(1)}>{isRtl ? '←' : '→'}</button>
  </div>

  <div class="calendar-months">
    {#each months as month, monthIndex (month.month)}
      <section class="calendar-month" class:secondary-month={monthIndex === 1} aria-label={month.label}>
        <h3><bdi>{month.label}</bdi></h3>
        <div class="weekday-row" aria-hidden="true">
          {#each month.weekdayLabels as weekday}<span>{weekday}</span>{/each}
        </div>
        <div class="day-grid">
          {#each month.days as day, index (`${month.month}-${index}`)}
            {#if day}
              <button
                class="calendar-day"
                class:in-range={isSelected(day.date)}
                class:range-start={day.date === entryDate}
                class:range-end={day.date === exitDate}
                class:today={day.date === today}
                type="button"
                data-calendar-date={day.date}
                aria-label={formatDate(locale, day.date, { day: 'numeric', month: 'long', year: 'numeric' })}
                aria-pressed={isSelected(day.date)}
                aria-current={day.date === today ? 'date' : undefined}
                tabindex={day.date === focusDate ? 0 : -1}
                onpointerdown={(event) => handlePointerDown(event, day.date)}
                onclick={() => handleDayClick(day.date)}
                onkeydown={(event) => handleDayKeydown(event, day.date)}
              >{formatCalendarDayNumber(locale, day.day)}</button>
            {:else}
              <span class="empty-day" aria-hidden="true"></span>
            {/if}
          {/each}
        </div>
      </section>
    {/each}
  </div>

  <output class="calendar-status" aria-live="polite">{status}</output>
</section>

<style>
  .date-range-calendar {
    display: grid;
    min-width: 0;
    gap: 10px;
    border: 1px solid var(--control-line, #718079);
    border-radius: 10px;
    background: var(--surface, #ffffff);
    padding: 10px;
    user-select: none;
  }

  .calendar-toolbar {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) 40px;
    align-items: center;
    gap: 8px;
  }

  .calendar-toolbar p {
    margin: 0;
    color: var(--muted, #4f5f59);
    font-size: 0.82rem;
    line-height: 1.3;
    text-align: center;
  }

  .month-navigation {
    display: grid;
    width: 40px;
    min-height: 40px;
    place-items: center;
    border: 1px solid var(--control-line, #718079);
    border-radius: 8px;
    background: var(--paper, #f8fbf8);
    color: var(--ink, #10251f);
    padding: 0;
    font: inherit;
    font-size: 1.1rem;
    font-weight: 750;
  }

  .month-navigation:hover { background: var(--surface-mint, #e8f4ed); }

  .month-navigation:focus-visible,
  .calendar-day:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--safe, #176b50), transparent 38%);
    outline-offset: 2px;
  }

  .calendar-months {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .calendar-month {
    display: grid;
    min-width: 0;
    gap: 5px;
  }

  .calendar-month h3 {
    margin: 0;
    color: var(--ink, #10251f);
    font-size: 0.9rem;
    font-weight: 760;
    text-align: center;
  }

  .weekday-row,
  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .weekday-row span {
    min-width: 0;
    padding-block: 2px;
    color: var(--muted, #4f5f59);
    font-size: 0.68rem;
    font-weight: 730;
    text-align: center;
  }

  .day-grid { gap: 2px; }

  .calendar-day,
  .empty-day {
    min-width: 0;
    min-height: 34px;
  }

  .calendar-day {
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--ink, #10251f);
    padding: 0;
    font: inherit;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    touch-action: none;
  }

  .calendar-day:hover {
    border-color: var(--control-line, #718079);
    background: var(--surface-mint, #e8f4ed);
  }

  .calendar-day.in-range {
    border-color: color-mix(in srgb, var(--safe, #176b50), transparent 64%);
    background: var(--safe-bg, #e4f3eb);
    color: var(--safe, #176b50);
    font-weight: 720;
  }

  .calendar-day.range-start,
  .calendar-day.range-end {
    border-color: var(--safe, #176b50);
    background: var(--safe, #176b50);
    color: var(--paper, #ffffff);
    font-weight: 780;
  }

  .calendar-day.today:not(.range-start):not(.range-end) {
    border-color: var(--safe, #176b50);
  }

  .calendar-status {
    min-height: 1.2em;
    color: var(--safe, #176b50);
    font-size: 0.82rem;
    font-weight: 720;
    text-align: center;
  }

  @media (max-width: 640px) {
    .date-range-calendar { padding: 9px; }
    .calendar-toolbar p { font-size: 0.76rem; }
    .calendar-months { grid-template-columns: minmax(0, 1fr); }
    .secondary-month { display: none; }
    .calendar-day,
    .empty-day { min-height: 44px; }
    .calendar-day { font-size: 0.86rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .date-range-calendar * { scroll-behavior: auto; }
  }
</style>
