import { describe, expect, test } from 'bun:test';
import {
  SCHENGEN_SHORT_STAY_COUNTRY_CODES,
  calculateUsageOnDate,
  classifyVerdict,
  countsForShortStay,
  isSchengenShortStayCountryCode,
  isTripSafeForEveryDay,
  latestSafeExitDate,
  type Trip
} from '../src/index';

interface UsageFixture {
  id: string;
  description: string;
  referenceDate: string;
  trips: Trip[];
  expected: {
    windowStart: string;
    windowEnd: string;
    daysUsed: number;
    daysRemaining: number;
    overLimit: boolean;
    overBy: number;
  };
}

const fixtures = (await Bun.file(
  new URL('./fixtures/ec/rolling-180-fixtures.json', import.meta.url)
).json()) as UsageFixture[];

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

const MS_PER_DAY = 86_400_000;

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

  test('classifies country codes explicitly instead of counting every unknown country as Schengen', () => {
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toHaveLength(29);
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('FR');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('BG');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('RO');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('IS');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('NO');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('LI');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toContain('CH');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).not.toContain('IE');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).not.toContain('CY');
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).not.toContain('GB');

    expect(isSchengenShortStayCountryCode('fr')).toBe(true);
    expect(isSchengenShortStayCountryCode('IE')).toBe(false);
    expect(isSchengenShortStayCountryCode('CY')).toBe(false);
    expect(isSchengenShortStayCountryCode('GB')).toBe(false);
    expect(isSchengenShortStayCountryCode('US')).toBe(false);
    expect(isSchengenShortStayCountryCode('XX')).toBe(false);

    expect(countsForShortStay({ entryDate: '2026-05-01', exitDate: '2026-05-02' })).toBe(true);
    expect(
      countsForShortStay({ entryDate: '2026-05-01', exitDate: '2026-05-02', countryCode: 'CH' })
    ).toBe(true);
    expect(
      countsForShortStay({ entryDate: '2026-05-01', exitDate: '2026-05-02', countryCode: 'GB' })
    ).toBe(false);
  });

  test('validates invalid date ranges even for excluded or non-Schengen trips', () => {
    expect(() =>
      calculateUsageOnDate([{ entryDate: '2026-05-10', exitDate: '2026-05-01', countryCode: 'IE' }], '2026-05-10')
    ).toThrow(RangeError);

    expect(() =>
      calculateUsageOnDate([{ entryDate: '2026-05-10', exitDate: '2026-05-01', countryCode: 'GB' }], '2026-05-10')
    ).toThrow(RangeError);
  });

  test('excludes Ireland/Cyprus/other non-Schengen countries and includes non-EU Schengen countries', () => {
    const trips: Trip[] = [
      { entryDate: '2026-05-01', exitDate: '2026-05-05', countryCode: 'IE' },
      { entryDate: '2026-05-06', exitDate: '2026-05-10', countryCode: 'CY' },
      { entryDate: '2026-05-11', exitDate: '2026-05-15', countryCode: 'GB' },
      { entryDate: '2026-05-16', exitDate: '2026-05-20', countryCode: 'US' },
      { entryDate: '2026-05-21', exitDate: '2026-05-25', countryCode: 'CH' },
      { entryDate: '2026-05-26', exitDate: '2026-05-30', countryCode: 'NO' }
    ];

    expect(calculateUsageOnDate(trips, '2026-05-30').daysUsed).toBe(10);
  });

  test('classifies verdict boundaries from the remaining-day buffer', () => {
    expect(classifyVerdict(8).state).toBe('ok');
    expect(classifyVerdict(7).state).toBe('close');
    expect(classifyVerdict(1).state).toBe('close');
    expect(classifyVerdict(0).state).toBe('over');
    expect(classifyVerdict(-1).state).toBe('over');
  });

});

describe('latest safe exit date calculation', () => {
  test('returns the 90th day for a new Schengen stay and proves the next day overstays', () => {
    expectLatestSafeExitBoundary([], '2026-10-01', 'IT', '2026-12-29');
  });

  test('returns the only safe entry day when 89 days are already used', () => {
    const existingTrips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-03-30', countryCode: 'FR' }
    ];

    expectLatestSafeExitBoundary(existingTrips, '2026-04-01', 'IT', '2026-04-01');
  });

  test('returns null when the entry day itself would exceed the allowance', () => {
    const existingTrips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-03-31', countryCode: 'FR' }
    ];

    expect(latestSafeExitDate(existingTrips, '2026-04-01', 'IT')).toBeNull();
  });

  test('accounts for old days aging out of the rolling window during a continuous stay', () => {
    const existingTrips: Trip[] = [
      { entryDate: '2026-01-01', exitDate: '2026-03-30', countryCode: 'FR' }
    ];

    expectLatestSafeExitBoundary(existingTrips, '2026-06-30', 'IT', '2026-09-27');
  });

  test('treats missing country as a manual Schengen trip by default', () => {
    expectLatestSafeExitBoundary([], '2026-10-01', undefined, '2026-12-29');
  });

  test('returns null for non-Schengen target countries because Schengen safe exit is not applicable', () => {
    expect(latestSafeExitDate([], '2026-10-01', 'GB')).toBeNull();
    expect(latestSafeExitDate([], '2026-10-01', 'IE')).toBeNull();
    expect(latestSafeExitDate([], '2026-10-01', 'CY')).toBeNull();
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
        { entryDate: '2026-01-01', exitDate: '2026-01-05', countryCode: 'FR' },
        { entryDate: '2026-01-04', exitDate: '2026-01-07', countryCode: 'DE' },
        { entryDate: '2026-01-08', exitDate: '2026-01-10', countryCode: 'IE' },
        { entryDate: '2026-01-11', exitDate: '2026-01-12', countryCode: 'CH' },
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
    if (!oracleCountsForShortStay(trip.countryCode)) continue;

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

function oracleCountsForShortStay(countryCode: string | undefined): boolean {
  if (!countryCode) return true;
  return TEST_SCHENGEN_COUNTRY_CODES.has(countryCode.toUpperCase());
}

function generateTrips(seed: number): Trip[] {
  const countries = [
    'FR',
    'DE',
    'ES',
    'IT',
    'CH',
    'NO',
    'IS',
    'LI',
    'BG',
    'RO',
    'IE',
    'CY',
    'GB',
    'US',
    'TR',
    undefined
  ];
  const base = dayNumber('2025-09-01');
  const count = 1 + (seed % 12);
  const trips: Trip[] = [];

  for (let index = 0; index < count; index += 1) {
    const startOffset = (seed * 19 + index * 31 + (index % 3) * seed) % 420;
    const length = 1 + ((seed * 7 + index * 11) % 45);
    const countryCode = countries[(seed + index * 5) % countries.length];
    const entryDate = formatDayNumber(base + startOffset);
    const exitDate = formatDayNumber(base + startOffset + length - 1);
    const trip: Trip = countryCode ? { entryDate, exitDate, countryCode } : { entryDate, exitDate };
    trips.push(trip);

    if (index === 0 && seed % 10 === 0) {
      trips.push({ ...trip });
    }
  }

  return trips;
}

function expectLatestSafeExitBoundary(
  existingTrips: Trip[],
  entryDate: string,
  countryCode: string | undefined,
  expectedExitDate: string
): void {
  const actualExitDate = latestSafeExitDate(existingTrips, entryDate, countryCode);
  expect(actualExitDate).toBe(expectedExitDate);

  const safeTrip = buildTrip(entryDate, expectedExitDate, countryCode);
  expect(isTripSafeForEveryDay(existingTrips, safeTrip)).toBe(true);

  const nextExitDate = formatDayNumber(dayNumber(expectedExitDate) + 1);
  const unsafeTrip = buildTrip(entryDate, nextExitDate, countryCode);
  expect(isTripSafeForEveryDay(existingTrips, unsafeTrip)).toBe(false);
}

function buildTrip(entryDate: string, exitDate: string, countryCode: string | undefined): Trip {
  return countryCode ? { entryDate, exitDate, countryCode } : { entryDate, exitDate };
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
