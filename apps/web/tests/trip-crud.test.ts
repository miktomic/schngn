import { describe, expect, test } from 'bun:test';
import { calculateUsageOnDate } from '@schngn/engine';
import {
  countTripOutsideDays,
  countTripSchengenDays,
  deleteTripById,
  inclusiveTripDays,
  isTripBeforeRollingWindow,
  rollingWindowStartDate,
  sortTrips,
  statusForTripDates,
  toEngineTrips,
  tripToForm,
  upsertTrip,
  validateTripInput,
  type EditableTrip,
  type TripFormInput
} from '../src/lib/trips/tripCrud';
import { SCHENGEN_COUNTRY_OPTIONS } from '../src/lib/trips/countries';
import { makeTrip } from './trip-fixtures';

const france = makeTrip('france', 'France', '2026-05-01', '2026-05-12', 'past', 'FR');
const italy = makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT');

function form(overrides: Partial<TripFormInput> = {}): TripFormInput {
  return {
    label: '',
    entryCountryCode: '',
    exitCountryCode: '',
    entryDate: '2026-07-01',
    exitDate: '2026-07-12',
    outsideBreaks: [],
    status: 'booked',
    ...overrides
  };
}

describe('trip CRUD model', () => {
  test('accepts equal entry and exit as a one-day Schengen stay', () => {
    const input = form({ entryDate: '2026-10-13', exitDate: '2026-10-13', status: 'what-if' });
    expect(validateTripInput(input)).toEqual({});
    expect(inclusiveTripDays(input)).toBe(1);
  });

  test('infers past status from the final exit date', () => {
    expect(statusForTripDates('booked', '2026-07-09', '2026-07-10')).toBe('past');
    expect(statusForTripDates('what-if', '2026-07-09', '2026-07-10')).toBe('past');
    expect(statusForTripDates('booked', '2026-07-10', '2026-07-10')).toBe('booked');
    expect(statusForTripDates('what-if', '2026-07-11', '2026-07-10')).toBe('what-if');
    expect(statusForTripDates('past', '2026-07-11', '2026-07-10')).toBe('booked');

    const result = upsertTrip(
      [],
      form({ entryDate: '2026-07-01', exitDate: '2026-07-09', status: 'booked' }),
      '2026-07-10'
    );
    expect(result.trips[0].status).toBe('past');
  });

  test('rejects the final exit before the first entry', () => {
    expect(validateTripInput(form({ entryDate: '2026-10-14', exitDate: '2026-10-13' }))).toEqual({
      exitDate: 'The exit date cannot be before the entry date.'
    });
  });

  test('uses neutral entry and exit date validation messages', () => {
    expect(validateTripInput(form({ entryDate: '', exitDate: '' }))).toEqual({
      entryDate: 'The entry date is required.',
      exitDate: 'The exit date is required.'
    });
    expect(validateTripInput(form({ entryDate: '2026-02-30', exitDate: '2026-13-01' }))).toEqual({
      entryDate: 'Enter a valid entry date.',
      exitDate: 'Enter a valid exit date.'
    });
  });

  test('accepts only optional Schengen border countries', () => {
    expect(validateTripInput(form({ entryCountryCode: ' it ', exitCountryCode: 'AT' }))).toEqual({});
    expect(validateTripInput(form({ entryCountryCode: 'IE' }))).toEqual({
      entryCountryCode: 'Choose a Schengen country or leave this optional field blank.'
    });
    expect(SCHENGEN_COUNTRY_OPTIONS.some((country) => country.code === 'IT')).toBe(true);
    expect(SCHENGEN_COUNTRY_OPTIONS.some((country) => country.code === 'IE')).toBe(false);
  });

  test('defaults an empty exit country to the entry country without overwriting an explicit exit', () => {
    expect(upsertTrip([], form({ entryCountryCode: 'IT', exitCountryCode: '' }), '2026-06-01').trips[0]).toMatchObject({
      entryCountryCode: 'IT',
      exitCountryCode: 'IT'
    });
    expect(upsertTrip([], form({ entryCountryCode: 'IT', exitCountryCode: 'AT' }), '2026-06-01').trips[0]).toMatchObject({
      entryCountryCode: 'IT',
      exitCountryCode: 'AT'
    });
  });

  test('identifies only trips ending before the inclusive 180-day window', () => {
    expect(rollingWindowStartDate('2026-07-10')).toBe('2026-01-12');
    expect(isTripBeforeRollingWindow(makeTrip('old', 'Old', '2026-01-01', '2026-01-11'), '2026-07-10')).toBe(true);
    expect(isTripBeforeRollingWindow(makeTrip('boundary', 'Boundary', '2026-01-01', '2026-01-12'), '2026-07-10')).toBe(false);
    expect(isTripBeforeRollingWindow(makeTrip('future', 'Future', '2026-08-01', '2026-08-05'), '2026-07-10')).toBe(false);
  });

  test('turns an outside-Schengen break into two counted stays', () => {
    const result = upsertTrip([], form({
      label: 'Italy to Austria',
      entryCountryCode: 'IT',
      exitCountryCode: 'AT',
      outsideBreaks: [{ id: 'ireland', leftDate: '2026-07-05', reentryDate: '2026-07-08' }]
    }));

    expect(result.errors).toEqual({});
    expect(result.trips[0]).toMatchObject({
      entryCountryCode: 'IT',
      exitCountryCode: 'AT',
      stays: [
        { entryDate: '2026-07-01', exitDate: '2026-07-05' },
        { entryDate: '2026-07-08', exitDate: '2026-07-12' }
      ]
    });
    expect(countTripSchengenDays(result.trips[0])).toBe(10);
    expect(countTripOutsideDays(result.trips[0])).toBe(2);
    expect(calculateUsageOnDate(toEngineTrips(result.trips), '2026-07-12').daysUsed).toBe(10);
    expect(tripToForm(result.trips[0]).outsideBreaks).toEqual([
      { id: 'break-1', leftDate: '2026-07-05', reentryDate: '2026-07-08' }
    ]);
  });

  test('requires a full calendar day outside and rejects overlapping breaks', () => {
    expect(validateTripInput(form({ outsideBreaks: [{ id: 'short', leftDate: '2026-07-05', reentryDate: '2026-07-06' }] }))).toMatchObject({
      breakFields: { short: { reentryDate: 'A break must include at least one full calendar day outside Schengen.' } }
    });
    expect(validateTripInput(form({ outsideBreaks: [
      { id: 'one', leftDate: '2026-07-03', reentryDate: '2026-07-07' },
      { id: 'two', leftDate: '2026-07-05', reentryDate: '2026-07-09' }
    ] }))).toMatchObject({ breakFields: { two: { leftDate: 'Outside-Schengen breaks cannot overlap.' } } });
  });

  test('uses neutral exit and re-entry messages for outside-Schengen breaks', () => {
    expect(validateTripInput(form({ outsideBreaks: [{ id: 'missing', leftDate: '', reentryDate: '' }] }))).toMatchObject({
      breakFields: {
        missing: {
          leftDate: 'Enter an exit date.',
          reentryDate: 'Enter a re-entry date.'
        }
      }
    });
    expect(validateTripInput(form({
      outsideBreaks: [{ id: 'invalid', leftDate: '2026-02-30', reentryDate: '2026-13-01' }]
    }))).toMatchObject({
      breakFields: {
        invalid: {
          leftDate: 'Enter a valid exit date.',
          reentryDate: 'Enter a valid re-entry date.'
        }
      }
    });
    expect(validateTripInput(form({
      outsideBreaks: [{ id: 'outside-trip', leftDate: '2026-07-13', reentryDate: '2026-07-15' }]
    }))).toMatchObject({
      breakFields: {
        'outside-trip': {
          leftDate: 'The exit date must fall within the trip.',
          reentryDate: 'The re-entry date must fall within the trip.'
        }
      }
    });
  });

  test('trims optional labels and rejects impossible dates, statuses, and oversized labels', () => {
    expect(validateTripInput(form({ entryDate: '2026-02-30' }))).toEqual({ entryDate: 'Enter a valid entry date.' });
    expect(validateTripInput(form({ status: 'confirmed' as EditableTrip['status'] }))).toEqual({ status: 'Choose past, booked, or what-if.' });
    expect(validateTripInput(form({ label: 'a'.repeat(81) }))).toEqual({ label: 'Keep the trip label to 80 characters or fewer.' });
    expect(upsertTrip([], form({ label: '  Summer trip  ' })).trips[0].label).toBe('Summer trip');
  });

  test('edits, sorts, deletes, and recalculates through the engine contract', () => {
    const result = upsertTrip([france, italy], form({
      id: 'italy',
      label: 'Italy shortened',
      entryDate: '2026-04-20',
      exitDate: '2026-04-20'
    }));
    expect(result.trips.map((trip) => trip.id)).toEqual(['italy', 'france']);
    expect(calculateUsageOnDate(toEngineTrips(result.trips), '2026-10-13').daysUsed).toBe(13);
    expect(deleteTripById(sortTrips([italy, france]), 'france')).toEqual([italy]);
  });
});
