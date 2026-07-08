import { describe, expect, test } from 'bun:test';
import {
  calculateUsageOnDate,
  classifyVerdict,
  latestSafeExitDate,
  type Trip
} from '../src/index';

describe('Schengen rolling 180-day engine', () => {
  test('counts entry and exit day, including a same-day trip as one day', () => {
    const trips: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-01', countryCode: 'FR' }
    ];

    expect(calculateUsageOnDate(trips, '2026-05-01').daysUsed).toBe(1);
  });

  test('de-duplicates overlapping trips instead of double-counting physical days', () => {
    const trips: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-05', countryCode: 'FR' },
      { entryDate: '2026-05-03', exitDate: '2026-05-07', countryCode: 'DE' }
    ];

    expect(calculateUsageOnDate(trips, '2026-05-07').daysUsed).toBe(7);
  });

  test('uses an inclusive 180-day look-back window ending on the reference date', () => {
    const trips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-01-10', countryCode: 'ES' }
    ];

    expect(calculateUsageOnDate(trips, '2026-06-29').daysUsed).toBe(10);
    expect(calculateUsageOnDate(trips, '2026-06-30').daysUsed).toBe(9);
  });

  test('excludes Ireland/Cyprus and includes non-EU Schengen countries', () => {
    const trips: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-05', countryCode: 'IE' },
      { entryDate: '2026-05-06', exitDate: '2026-05-10', countryCode: 'CY' },
      { entryDate: '2026-05-11', exitDate: '2026-05-15', countryCode: 'CH' }
    ];

    expect(calculateUsageOnDate(trips, '2026-05-15').daysUsed).toBe(5);
  });

  test('classifies verdict boundaries from the remaining-day buffer', () => {
    expect(classifyVerdict(8).state).toBe('ok');
    expect(classifyVerdict(7).state).toBe('close');
    expect(classifyVerdict(1).state).toBe('close');
    expect(classifyVerdict(0).state).toBe('over');
    expect(classifyVerdict(-1).state).toBe('over');
  });

  test('computes latest safe exit date for a new stay with no prior trips', () => {
    expect(latestSafeExitDate([], '2026-10-01', 'IT')).toBe('2026-12-29');
  });
});
