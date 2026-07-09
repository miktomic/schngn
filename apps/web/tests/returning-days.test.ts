import { describe, expect, test } from 'bun:test';
import { buildReturningDaysForecast } from '../src/lib/returns/returningDays';
import type { EditableTrip } from '../src/lib/trips/tripCrud';

const defaultTrips: EditableTrip[] = [
  { id: 'france', label: 'France', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-12', status: 'past' },
  { id: 'germany', label: 'Germany', countryCode: 'DE', entryDate: '2026-06-10', exitDate: '2026-06-27', status: 'past' },
  { id: 'greece', label: 'Greece', countryCode: 'GR', entryDate: '2026-08-03', exitDate: '2026-08-18', status: 'booked' },
  { id: 'italy', label: 'Italy', countryCode: 'IT', entryDate: '2026-09-15', exitDate: '2026-10-13', status: 'booked' }
];

describe('days-coming-back forecast', () => {
  test('forecasts when counted days leave the inclusive 180-day window', () => {
    const forecast = buildReturningDaysForecast(defaultTrips, { referenceDate: '2026-10-13', horizonDays: 30 });

    expect(forecast.currentUsedLabel).toBe('75 / 90 used');
    expect(forecast.summaryLabel).toBe('12 days return in the next 30 days');
    expect(forecast.nextReturnLabel).toBe('Next return: Oct 28');
    expect(forecast.rows).toHaveLength(12);
    expect(forecast.rows[0]).toEqual({
      date: '2026-10-28',
      dateLabel: 'Oct 28',
      daysReturned: 1,
      daysLabel: '+1 day',
      source: 'France May 1 leaves the window'
    });
    expect(forecast.rows.at(-1)).toMatchObject({
      date: '2026-11-08',
      dateLabel: 'Nov 8',
      source: 'France May 12 leaves the window'
    });
  });

  test('reports no returning days when the current window is empty', () => {
    const forecast = buildReturningDaysForecast([], { referenceDate: '2026-10-13', horizonDays: 30 });

    expect(forecast.currentUsedLabel).toBe('0 / 90 used');
    expect(forecast.summaryLabel).toBe('No counted days return in the next 30 days');
    expect(forecast.nextReturnLabel).toBe('No returning days in this window');
    expect(forecast.rows).toEqual([]);
  });

  test('excludes non-Schengen days and groups duplicate physical days only once', () => {
    const trips: EditableTrip[] = [
      { id: 'one', label: 'France A', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-03', status: 'past' },
      { id: 'two', label: 'France duplicate', countryCode: 'FR', entryDate: '2026-05-02', exitDate: '2026-05-02', status: 'past' },
      { id: 'three', label: 'Ireland', countryCode: 'IE', entryDate: '2026-05-02', exitDate: '2026-05-05', status: 'past' }
    ];

    const forecast = buildReturningDaysForecast(trips, { referenceDate: '2026-10-13', horizonDays: 30 });

    expect(forecast.summaryLabel).toBe('3 days return in the next 30 days');
    expect(forecast.rows.map((row) => row.date)).toEqual(['2026-10-28', '2026-10-29', '2026-10-30']);
    expect(forecast.rows[1].source).toBe('France A May 2 leaves the window');
  });

  test('handles about 50 trips quickly enough for the mobile screen', () => {
    const manyTrips: EditableTrip[] = Array.from({ length: 50 }, (_, index) => {
      const day = String((index % 28) + 1).padStart(2, '0');
      return {
        id: `trip-${index}`,
        label: `Trip ${index}`,
        countryCode: 'FR',
        entryDate: `2026-05-${day}`,
        exitDate: `2026-05-${day}`,
        status: 'past'
      };
    });
    const started = performance.now();

    const forecast = buildReturningDaysForecast(manyTrips, { referenceDate: '2026-10-13', horizonDays: 60 });

    expect(performance.now() - started).toBeLessThan(300);
    expect(forecast.rows.length).toBeGreaterThan(0);
  });
});
