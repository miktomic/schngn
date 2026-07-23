import { addDays, formatISODate, parseISODate } from '@schngn/engine';
import { intlLocale, type Locale } from '$lib/i18n/locales';

const DAYS_IN_CALENDAR_GRID = 42;

export interface CalendarDay {
  date: string;
  day: number;
}

export interface CalendarMonth {
  days: Array<CalendarDay | null>;
  label: string;
  month: string;
  weekdayLabels: string[];
}

export interface OrderedDateRange {
  entryDate: string;
  exitDate: string;
}

export function isISOCalendarDate(value: string): boolean {
  try {
    parseISODate(value);
    return true;
  } catch {
    return false;
  }
}

export function calendarMonthStart(date: string): string {
  const parsed = parseISODate(date);
  return formatISODate(new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1)));
}

export function buildCalendarMonth(month: string, locale: Locale): CalendarMonth {
  const monthStart = parseISODate(calendarMonthStart(month));
  const year = monthStart.getUTCFullYear();
  const monthIndex = monthStart.getUTCMonth();
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingEmptyDays = (monthStart.getUTCDay() + 6) % 7;
  const dateFormatter = new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
  const weekdayFormatter = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'short',
    timeZone: 'UTC'
  });
  const monday = new Date(Date.UTC(2026, 0, 5));
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    weekdayFormatter.format(addDays(monday, index)).replace(/\.$/, '')
  );
  const days: Array<CalendarDay | null> = Array(leadingEmptyDays).fill(null);

  for (let day = 1; day <= dayCount; day += 1) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    days.push({ date: formatISODate(date), day });
  }
  while (days.length < DAYS_IN_CALENDAR_GRID) days.push(null);

  return {
    days,
    label: dateFormatter.format(monthStart),
    month: formatISODate(monthStart),
    weekdayLabels
  };
}

export function shiftCalendarMonth(month: string, offset: number): string {
  const parsed = parseISODate(calendarMonthStart(month));
  return formatISODate(new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + offset, 1)));
}

export function shiftCalendarDateMonth(date: string, offset: number): string {
  const parsed = parseISODate(date);
  const targetStart = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + offset, 1));
  const targetLastDay = new Date(Date.UTC(
    targetStart.getUTCFullYear(),
    targetStart.getUTCMonth() + 1,
    0
  )).getUTCDate();
  targetStart.setUTCDate(Math.min(parsed.getUTCDate(), targetLastDay));
  return formatISODate(targetStart);
}

export function orderDateRange(firstDate: string, secondDate: string): OrderedDateRange {
  parseISODate(firstDate);
  parseISODate(secondDate);
  return firstDate <= secondDate
    ? { entryDate: firstDate, exitDate: secondDate }
    : { entryDate: secondDate, exitDate: firstDate };
}

export function inclusiveCalendarDays(entryDate: string, exitDate: string): number {
  if (!isISOCalendarDate(entryDate) || !isISOCalendarDate(exitDate) || exitDate < entryDate) return 0;
  return Math.round((parseISODate(exitDate).getTime() - parseISODate(entryDate).getTime()) / 86_400_000) + 1;
}
