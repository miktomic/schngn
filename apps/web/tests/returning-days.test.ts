import { describe, expect, test } from 'bun:test';
import { buildReturningDaysForecast } from '../src/lib/returns/returningDays';
import { makeTrip } from './trip-fixtures';

const defaultTrips = [
  makeTrip('france', 'France', '2026-05-01', '2026-05-12'),
  makeTrip('germany', 'Germany', '2026-06-10', '2026-06-27'),
  makeTrip('greece', 'Greece', '2026-08-03', '2026-08-18', 'booked'),
  makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked')
];

describe('days-coming-back forecast', () => {
  test('forecasts when counted days leave the inclusive window', () => {
    const forecast = buildReturningDaysForecast(defaultTrips, { referenceDate: '2026-10-13', horizonDays: 30 });
    expect(forecast.currentUsedLabel).toBe('75 / 90 used');
    expect(forecast.summaryLabel).toBe('12 days return in the next 30 days');
    expect(forecast.rows[0]).toMatchObject({ date: '2026-10-28', source: 'France May 1 leaves the window' });
  });

  test('finds the first returning day across the full future window used by the canonical timeline', () => {
    const forecast = buildReturningDaysForecast(
      [makeTrip('spring', 'Spring trip', '2026-03-01', '2026-03-03')],
      { referenceDate: '2026-03-03', horizonDays: 180 }
    );
    expect(forecast.rows.map((row) => row.date)).toEqual(['2026-08-28', '2026-08-29', '2026-08-30']);
  });

  test('reports no returning days when the window is empty', () => {
    expect(buildReturningDaysForecast([], { referenceDate: '2026-10-13', horizonDays: 30 }).rows).toEqual([]);
  });

  test('groups duplicate physical days once and preserves outside-Schengen gaps', () => {
    const one = makeTrip('one', 'France A', '2026-05-01', '2026-05-03');
    const duplicate = makeTrip('two', 'Duplicate', '2026-05-02', '2026-05-02');
    const split = makeTrip('split', 'Split stay', '2026-05-08', '2026-05-08');
    split.stays.push({ entryDate: '2026-05-11', exitDate: '2026-05-11' });
    const forecast = buildReturningDaysForecast([one, duplicate, split], { referenceDate: '2026-10-13', horizonDays: 40 });
    expect(forecast.rows).toHaveLength(5);
    expect(forecast.rows.map((row) => row.date)).not.toContain('2026-11-05');
  });

  test('handles about 50 trips within the mobile budget', () => {
    const manyTrips = Array.from({ length: 50 }, (_, index) => {
      const day = String((index % 28) + 1).padStart(2, '0');
      return makeTrip(`trip-${index}`, `Trip ${index}`, `2026-05-${day}`, `2026-05-${day}`);
    });
    const started = performance.now();
    const forecast = buildReturningDaysForecast(manyTrips, { referenceDate: '2026-10-13', horizonDays: 60 });
    expect(performance.now() - started).toBeLessThan(300);
    expect(forecast.rows.length).toBeGreaterThan(0);
  });
});
