import { describe, expect, test } from 'bun:test';
import {
  calculateUsageOnDate,
  classifyVerdict,
  isTripSafeForEveryDay,
  latestSafeExitDate,
  type Trip
} from '../src/index';

interface SourceFixtureTrip extends Trip { countryCode?: string }
interface UsageFixture {
  id: string;
  description: string;
  referenceDate: string;
  trips: SourceFixtureTrip[];
  expected: {
    windowStart: string;
    windowEnd: string;
    daysUsed: number;
    daysRemaining: number;
    overLimit: boolean;
    overBy: number;
  };
}

const TEST_SCHENGEN_COUNTRY_CODES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IS',
  'IT',
  'LV',
  'LI',
  'LT',
  'LU',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'CH'
]);

const sourceFixtures = (await Bun.file(
  new URL('./fixtures/ec/rolling-180-fixtures.json', import.meta.url)
).json()) as UsageFixture[];
const fixtures = sourceFixtures.map((fixture) => ({
  ...fixture,
  trips: fixture.trips
    .filter((trip) => !trip.countryCode || TEST_SCHENGEN_COUNTRY_CODES.has(trip.countryCode))
    .map(({ entryDate, exitDate, label }) => ({ entryDate, exitDate, label }))
}));

const MS_PER_DAY = 86_400_000;

describe('Schengen rolling 180-day engine', () => {
  test('counts entry and exit day, including a same-day trip as one day', () => {
    const trips: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-01' }
    ];

    expect(calculateUsageOnDate(trips, '2026-05-01').daysUsed).toBe(1);
  });

  test('de-duplicates overlapping trips instead of double-counting physical days', () => {
    const trips: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-05' },
      { entryDate: '2026-05-03', exitDate: '2026-05-07' }
    ];

    expect(calculateUsageOnDate(trips, '2026-05-07').daysUsed).toBe(7);
  });

  test('uses an inclusive 180-day look-back window ending on the reference date', () => {
    const trips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-01-10' }
    ];

    expect(calculateUsageOnDate(trips, '2026-06-29').daysUsed).toBe(10);
    expect(calculateUsageOnDate(trips, '2026-06-30').daysUsed).toBe(9);
  });

  test('validates invalid Schengen stay ranges', () => {
    expect(() =>
      calculateUsageOnDate([{ entryDate: '2026-05-10', exitDate: '2026-05-01' }], '2026-05-10')
    ).toThrow(RangeError);
  });

  test('counts only explicit Schengen stay ranges and preserves gaps outside Schengen', () => {
    const stays: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-05' },
      { entryDate: '2026-05-08', exitDate: '2026-05-12' }
    ];
    expect(calculateUsageOnDate(stays, '2026-05-12').daysUsed).toBe(10);
  });

  test('classifies verdict boundaries from usage, not floored remaining days', () => {
    expect(classifyVerdict(usageAtDaysUsed(82)).state).toBe('ok');
    expect(classifyVerdict(usageAtDaysUsed(82)).label).toBe('OK');

    expect(classifyVerdict(usageAtDaysUsed(83)).state).toBe('close');
    expect(classifyVerdict(usageAtDaysUsed(83)).label).toBe('Cutting it close');

    expect(classifyVerdict(usageAtDaysUsed(89)).state).toBe('close');
    expect(classifyVerdict(usageAtDaysUsed(89)).label).toBe('Cutting it close');

    expect(classifyVerdict(usageAtDaysUsed(90))).toMatchObject({
      state: 'close',
      label: 'At limit',
      tone: 'warning'
    });

    expect(classifyVerdict(usageAtDaysUsed(91))).toMatchObject({
      state: 'over',
      label: 'Overstay / over limit',
      tone: 'danger'
    });
  });

  test('supports configurable close-buffer thresholds', () => {
    expect(classifyVerdict(usageAtDaysUsed(75), 14).state).toBe('ok');
    expect(classifyVerdict(usageAtDaysUsed(75), 15).state).toBe('close');
  });

});

describe('latest safe exit date calculation', () => {
  test('returns the 90th day for a new Schengen stay and proves the next day overstays', () => {
    expectLatestSafeExitBoundary([], '2026-10-01', '2026-12-29');
  });

  test('returns the only safe entry day when 89 days are already used', () => {
    const existingTrips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-03-30' }
    ];

    expectLatestSafeExitBoundary(existingTrips, '2026-04-01', '2026-04-01');
  });

  test('returns null when the entry day itself would exceed the allowance', () => {
    const existingTrips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-03-31' }
    ];

    expect(latestSafeExitDate(existingTrips, '2026-04-01')).toBeNull();
  });

  test('accounts for old days aging out of the rolling window during a continuous stay', () => {
    const existingTrips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-03-30' }
    ];

    expectLatestSafeExitBoundary(existingTrips, '2026-06-30', '2026-09-27');
  });

  test('treats every engine input as an explicit Schengen stay', () => {
    expectLatestSafeExitBoundary([], '2026-10-01', '2026-12-29');
  });
});

describe('EC-rule fixture parity suite', () => {
  test('fixture suite has enough coverage to be a correctness gate', () => {
    expect(fixtures).toHaveLength(50);
    expect(new Set(fixtures.map((fixture) => fixture.id)).size).toBe(fixtures.length);
  });

  for (const fixture of fixtures) {
    test(`${fixture.id}: ${fixture.description}`, () => {
      const actual = calculateUsageOnDate(fixture.trips, fixture.referenceDate);

      expect(actual.referenceDate).toBe(fixture.referenceDate);
      expect(actual.windowStart).toBe(fixture.expected.windowStart);
      expect(actual.windowEnd).toBe(fixture.expected.windowEnd);
      expect(actual.daysUsed).toBe(fixture.expected.daysUsed);
      expect(actual.daysRemaining).toBe(fixture.expected.daysRemaining);
      expect(actual.overLimit).toBe(fixture.expected.overLimit);
      expect(actual.overBy).toBe(fixture.expected.overBy);
    });
  }
});

describe('golden-master counted-day scenarios', () => {
  test('returns the exact de-duplicated counted days for a mixed itinerary', () => {
    const result = calculateUsageOnDate(
      [
        { entryDate: '2026-01-01', exitDate: '2026-01-05' },
        { entryDate: '2026-01-04', exitDate: '2026-01-07' },
        { entryDate: '2026-01-11', exitDate: '2026-01-12' },
        { entryDate: '2026-01-13', exitDate: '2026-01-13' }
      ],
      '2026-01-13'
    );

    expect(result.countedDays).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
      '2026-01-11',
      '2026-01-12',
      '2026-01-13'
    ]);
  });
});

describe('property checks against an independent day-set oracle', () => {
  test('matches independent oracle for deterministic generated trip sets', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const trips = generateTrips(seed);
      const referenceDate = formatDayNumber(dayNumber('2025-10-01') + 90 + ((seed * 37) % 360));
      const actual = calculateUsageOnDate(trips, referenceDate);
      const expected = oracleUsage(trips, referenceDate);

      expect(actual.windowStart).toBe(expected.windowStart);
      expect(actual.windowEnd).toBe(expected.windowEnd);
      expect(actual.daysUsed).toBe(expected.daysUsed);
      expect(actual.daysRemaining).toBe(expected.daysRemaining);
      expect(actual.overLimit).toBe(expected.overLimit);
      expect(actual.overBy).toBe(expected.overBy);
      expect(actual.countedDays).toEqual(expected.countedDays);
    }
  });
});

function oracleUsage(trips: Trip[], referenceDate: string) {
  const reference = dayNumber(referenceDate);
  const windowStart = reference - 179;
  const countedDays = new Set<number>();

  for (const trip of trips) {
    const entry = dayNumber(trip.entryDate);
    const exit = dayNumber(trip.exitDate);
    if (exit < entry) throw new RangeError('invalid test trip');

    for (let day = Math.max(entry, windowStart); day <= Math.min(exit, reference); day += 1) {
      countedDays.add(day);
    }
  }

  const countedDayList = [...countedDays].sort((left, right) => left - right).map(formatDayNumber);
  const daysUsed = countedDayList.length;

  return {
    windowStart: formatDayNumber(windowStart),
    windowEnd: formatDayNumber(reference),
    daysUsed,
    daysRemaining: Math.max(90 - daysUsed, 0),
    overLimit: daysUsed > 90,
    overBy: Math.max(daysUsed - 90, 0),
    countedDays: countedDayList
  };
}

function generateTrips(seed: number): Trip[] {
  const base = dayNumber('2025-09-01');
  const count = 1 + (seed % 12);
  const trips: Trip[] = [];

  for (let index = 0; index < count; index += 1) {
    const startOffset = (seed * 19 + index * 31 + (index % 3) * seed) % 420;
    const length = 1 + ((seed * 7 + index * 11) % 45);
    const entryDate = formatDayNumber(base + startOffset);
    const exitDate = formatDayNumber(base + startOffset + length - 1);
    const trip: Trip = { entryDate, exitDate };
    trips.push(trip);

    if (index === 0 && seed % 10 === 0) {
      trips.push({ ...trip });
    }
  }

  return trips;
}

function usageAtDaysUsed(daysUsed: number) {
  if (!Number.isInteger(daysUsed) || daysUsed < 1) {
    throw new RangeError(`daysUsed must be a positive integer, got ${daysUsed}`);
  }

  const entryDate = '2026-01-01';
  const exitDate = formatDayNumber(dayNumber(entryDate) + daysUsed - 1);
  return calculateUsageOnDate([{ entryDate, exitDate }], exitDate);
}

function expectLatestSafeExitBoundary(
  existingTrips: Trip[],
  entryDate: string,
  expectedExitDate: string
): void {
  const actualExitDate = latestSafeExitDate(existingTrips, entryDate);
  expect(actualExitDate).toBe(expectedExitDate);

  const safeTrip = buildTrip(entryDate, expectedExitDate);
  expect(isTripSafeForEveryDay(existingTrips, safeTrip)).toBe(true);

  const nextExitDate = formatDayNumber(dayNumber(expectedExitDate) + 1);
  const unsafeTrip = buildTrip(entryDate, nextExitDate);
  expect(isTripSafeForEveryDay(existingTrips, unsafeTrip)).toBe(false);
}

function buildTrip(entryDate: string, exitDate: string): Trip {
  return { entryDate, exitDate };
}

function dayNumber(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new RangeError(`bad date: ${value}`);
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / MS_PER_DAY;
}

function formatDayNumber(value: number): string {
  return new Date(value * MS_PER_DAY).toISOString().slice(0, 10);
}
