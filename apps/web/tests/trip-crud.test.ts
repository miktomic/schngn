import { describe, expect, test } from 'bun:test';
import { calculateUsageOnDate } from '@schngn/engine';
import {
  deleteTripById,
  inclusiveTripDays,
  sortTrips,
  toEngineTrips,
  upsertTrip,
  validateTripInput,
  type EditableTrip
} from '../src/lib/trips/tripCrud';

const france: EditableTrip = {
  id: 'france',
  label: 'France',
  countryCode: 'FR',
  entryDate: '2026-05-01',
  exitDate: '2026-05-12',
  status: 'past'
};

const italy: EditableTrip = {
  id: 'italy',
  label: 'Italy',
  countryCode: 'IT',
  entryDate: '2026-09-15',
  exitDate: '2026-10-13',
  status: 'booked'
};

describe('trip CRUD model', () => {
  test('accepts equal entry/exit as a one-day trip', () => {
    const input = { label: '', countryCode: '', entryDate: '2026-10-13', exitDate: '2026-10-13', status: 'what-if' as const };

    expect(validateTripInput(input)).toEqual({});
    expect(inclusiveTripDays(input)).toBe(1);
  });

  test('rejects exit date before entry date inline', () => {
    expect(validateTripInput({ label: 'Bad', countryCode: 'IT', entryDate: '2026-10-14', exitDate: '2026-10-13', status: 'booked' })).toEqual({
      exitDate: 'Exit date cannot be before entry date.'
    });
  });

  test('adds trips with normalized optional label/country and sorts by entry date', () => {
    const result = upsertTrip([italy], {
      label: '  ',
      countryCode: ' gr ',
      entryDate: '2026-08-03',
      exitDate: '2026-08-18',
      status: 'booked'
    });

    expect(result.errors).toEqual({});
    expect(result.trips.map((trip) => trip.countryCode)).toEqual(['GR', 'IT']);
    expect(result.trips[0]?.label).toBe('GR trip');
  });

  test('edits existing trips, re-sorts, and recalculates through the engine contract', () => {
    const result = upsertTrip([france, italy], {
      id: 'italy',
      label: 'Italy shortened',
      countryCode: 'IT',
      entryDate: '2026-04-20',
      exitDate: '2026-04-20',
      status: 'booked'
    });

    expect(result.errors).toEqual({});
    expect(result.trips.map((trip) => trip.id)).toEqual(['italy', 'france']);
    expect(result.trips[0]?.label).toBe('Italy shortened');
    expect(calculateUsageOnDate(toEngineTrips(result.trips), '2026-10-13').daysUsed).toBe(13);
  });

  test('deletes a trip and leaves remaining trips sorted', () => {
    expect(deleteTripById(sortTrips([italy, france]), 'france')).toEqual([italy]);
  });
});
