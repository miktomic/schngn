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
import { SUPPORTED_COUNTRY_OPTIONS } from '../src/lib/trips/countries';

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

  test('rejects country names, typos, and unknown codes instead of silently excluding them', () => {
    const base = { label: 'Spain', entryDate: '2026-07-01', exitDate: '2026-07-19', status: 'booked' as const };

    expect(validateTripInput({ ...base, countryCode: 'Spain' })).toEqual({
      countryCode: 'Choose a supported country or leave it blank for a manual Schengen trip.'
    });
    expect(validateTripInput({ ...base, countryCode: 'SP' })).toEqual({
      countryCode: 'Choose a supported country or leave it blank for a manual Schengen trip.'
    });
    expect(validateTripInput({ ...base, countryCode: 'XX' })).toEqual({
      countryCode: 'Choose a supported country or leave it blank for a manual Schengen trip.'
    });
  });

  test('accepts supported country codes and blank manual-Schengen input', () => {
    const base = { label: '', entryDate: '2026-07-01', exitDate: '2026-07-19', status: 'booked' as const };

    expect(validateTripInput({ ...base, countryCode: ' es ' })).toEqual({});
    expect(validateTripInput({ ...base, countryCode: 'IE' })).toEqual({});
    expect(validateTripInput({ ...base, countryCode: '' })).toEqual({});
    expect(SUPPORTED_COUNTRY_OPTIONS.some((country) => country.code === 'ES' && country.countsForShortStay)).toBe(true);
    expect(SUPPORTED_COUNTRY_OPTIONS.some((country) => country.code === 'IE' && !country.countsForShortStay)).toBe(true);
  });

  test('rejects impossible calendar dates and invalid runtime statuses', () => {
    expect(
      validateTripInput({
        label: 'Impossible',
        countryCode: 'FR',
        entryDate: '2026-02-30',
        exitDate: '2026-03-01',
        status: 'booked'
      })
    ).toEqual({ entryDate: 'Enter a real entry date.' });

    expect(
      validateTripInput({
        label: 'Invalid status',
        countryCode: 'FR',
        entryDate: '2026-03-01',
        exitDate: '2026-03-02',
        status: 'confirmed' as EditableTrip['status']
      })
    ).toEqual({ status: 'Choose past, booked, or what-if.' });
  });

  test('trims labels, accepts emoji within the limit, and rejects oversized labels', () => {
    const emojiLabel = `  ${'🧳'.repeat(40)}  `;
    const accepted = upsertTrip([], {
      label: emojiLabel,
      countryCode: 'ES',
      entryDate: '2026-07-01',
      exitDate: '2026-07-02',
      status: 'booked'
    });

    expect(accepted.errors).toEqual({});
    expect(accepted.trips[0]?.label).toBe('🧳'.repeat(40));
    expect(
      validateTripInput({
        label: 'a'.repeat(81),
        countryCode: 'ES',
        entryDate: '2026-07-01',
        exitDate: '2026-07-02',
        status: 'booked'
      })
    ).toEqual({ label: 'Keep the trip label to 80 characters or fewer.' });
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
