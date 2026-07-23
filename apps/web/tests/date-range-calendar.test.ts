import { describe, expect, test } from 'bun:test';
import {
  buildCalendarMonth,
  inclusiveCalendarDays,
  orderDateRange,
  shiftCalendarDateMonth,
  shiftCalendarMonth
} from '../src/lib/calendar/dateRangeCalendar';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/locales';
import {
  createDateRangeCalendarUiTranslator,
  formatCalendarDayNumber,
  formatDateRangeSelection
} from '../src/lib/i18n/dateRangeCalendarUi';

describe('date range calendar model', () => {
  test('builds a Monday-first month grid with localized labels', () => {
    const month = buildCalendarMonth('2026-07-01', 'en');

    expect(month.label).toBe('July 2026');
    expect(month.weekdayLabels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(month.days).toHaveLength(42);
    expect(month.days.slice(0, 2)).toEqual([null, null]);
    expect(month.days[2]).toMatchObject({ date: '2026-07-01', day: 1 });
    expect(month.days[32]).toMatchObject({ date: '2026-07-31', day: 31 });
    expect(month.days.slice(33)).toEqual(Array(9).fill(null));
  });

  test('orders a dragged range in either direction and keeps both boundary days', () => {
    expect(orderDateRange('2026-07-19', '2026-07-12')).toEqual({
      entryDate: '2026-07-12',
      exitDate: '2026-07-19'
    });
    expect(orderDateRange('2026-07-12', '2026-07-19')).toEqual({
      entryDate: '2026-07-12',
      exitDate: '2026-07-19'
    });
    expect(orderDateRange('2026-07-12', '2026-07-12')).toEqual({
      entryDate: '2026-07-12',
      exitDate: '2026-07-12'
    });
  });

  test('moves month navigation across year boundaries and clamps focused dates', () => {
    expect(shiftCalendarMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(shiftCalendarMonth('2026-12-01', 1)).toBe('2027-01-01');
    expect(shiftCalendarDateMonth('2026-01-31', 1)).toBe('2026-02-28');
    expect(shiftCalendarDateMonth('2028-01-31', 1)).toBe('2028-02-29');
  });

  test('renders leap day and counts both inclusive range boundaries', () => {
    const leapFebruary = buildCalendarMonth('2028-02-01', 'en');

    expect(leapFebruary.days.some((day) => day?.date === '2028-02-29')).toBe(true);
    expect(inclusiveCalendarDays('2026-07-30', '2026-08-03')).toBe(5);
    expect(inclusiveCalendarDays('2026-07-30', '2026-07-30')).toBe(1);
    expect(inclusiveCalendarDays('2026-08-03', '2026-07-30')).toBe(0);
  });

  test('provides complete calendar controls and status copy for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const ui = createDateRangeCalendarUiTranslator(locale);
      expect(ui('chooseRange').trim().length).toBeGreaterThan(0);
      expect(ui('instructions').trim().length).toBeGreaterThan(0);
      expect(ui('previousMonth').trim().length).toBeGreaterThan(0);
      expect(ui('nextMonth').trim().length).toBeGreaterThan(0);
      expect(ui('chooseExit').trim().length).toBeGreaterThan(0);
      expect(formatDateRangeSelection(locale, 8).trim().length).toBeGreaterThan(0);
    }
  });

  test('localizes visible day numerals and singular selection copy', () => {
    expect(formatCalendarDayNumber('ar', 12)).toBe('١٢');
    expect(formatDateRangeSelection('en', 1)).toBe('1 day selected');
    expect(formatDateRangeSelection('fr', 1)).toBe('1 jour sélectionné');
    expect(formatDateRangeSelection('de', 1)).toBe('1 Tag ausgewählt');
    expect(formatDateRangeSelection('ar', 1)).toBe('تم اختيار يوم واحد');
    expect(formatDateRangeSelection('ar', 8)).toBe('تم اختيار ٨ أيام');
  });
});
