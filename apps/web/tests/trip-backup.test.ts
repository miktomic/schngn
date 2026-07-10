import { describe, expect, test } from 'bun:test';
import { calculateUsageOnDate } from '@schngn/engine';
import {
  MAX_TRIP_BACKUP_BYTES,
  importTripsFromJson,
  tripsToBackupJson
} from '../src/lib/import-export/tripBackup';
import { MAX_TRIP_COUNT, toEngineTrips, type EditableTrip } from '../src/lib/trips/tripCrud';

const unsortedTrips: EditableTrip[] = [
  {
    id: 'italy',
    label: 'Italy',
    countryCode: 'IT',
    entryDate: '2026-09-15',
    exitDate: '2026-10-13',
    status: 'booked'
  },
  {
    id: 'france',
    label: 'France',
    countryCode: 'FR',
    entryDate: '2026-05-01',
    exitDate: '2026-05-12',
    status: 'past'
  }
];

describe('JSON trip backup and restore', () => {
  test('round-trips exported trips and recalculates through the engine contract', () => {
    const json = tripsToBackupJson(unsortedTrips, new Date('2026-01-02T03:04:05.000Z'));

    expect(json).toContain('"schemaVersion": 1');
    expect(json).toContain('"exportedAt": "2026-01-02T03:04:05.000Z"');

    const result = importTripsFromJson(json);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.trips.map((trip) => trip.id)).toEqual(['france', 'italy']);
    expect(calculateUsageOnDate(toEngineTrips(result.trips), '2026-10-13').daysUsed).toBe(41);
  });

  test('rejects malformed JSON with a clear error without returning trips', () => {
    const result = importTripsFromJson('{not json');

    expect(result).toEqual({ ok: false, error: 'Import file is not valid JSON.' });
  });

  test('rejects missing schema or invalid trip fields with clear errors', () => {
    expect(importTripsFromJson(JSON.stringify({ trips: unsortedTrips }))).toEqual({
      ok: false,
      error: 'Import file is not a SCHNGN JSON backup.'
    });

    expect(
      importTripsFromJson(
        JSON.stringify({
          schemaVersion: 1,
          exportedAt: '2026-01-02T03:04:05.000Z',
          trips: [{ ...unsortedTrips[0], exitDate: '2026-09-14' }]
        })
      )
    ).toEqual({ ok: false, error: 'Trip 1 has an invalid date range.' });
  });

  test('rejects impossible dates, unsupported countries, and duplicate ids', () => {
    const backup = (trips: unknown[]) =>
      JSON.stringify({ schemaVersion: 1, exportedAt: '2026-01-02T03:04:05.000Z', trips });

    expect(importTripsFromJson(backup([{ ...unsortedTrips[0], entryDate: '2026-02-30' }]))).toEqual({
      ok: false,
      error: 'Trip 1 has an invalid date range.'
    });
    expect(importTripsFromJson(backup([{ ...unsortedTrips[0], countryCode: 'Spain' }]))).toEqual({
      ok: false,
      error: 'Trip 1 has an unsupported country.'
    });
    expect(importTripsFromJson(backup([unsortedTrips[0], { ...unsortedTrips[0], label: 'Duplicate' }]))).toEqual({
      ok: false,
      error: 'Trip 2 duplicates an earlier trip id.'
    });
    expect(importTripsFromJson(backup([{ ...unsortedTrips[0], id: 'x'.repeat(129) }]))).toEqual({
      ok: false,
      error: 'Trip 1 has invalid fields.'
    });
    expect(importTripsFromJson(backup([{ ...unsortedTrips[0], label: 'x'.repeat(81) }]))).toEqual({
      ok: false,
      error: 'Trip 1 has invalid fields.'
    });
  });

  test('rejects a backup with an invalid export timestamp', () => {
    expect(importTripsFromJson(JSON.stringify({ schemaVersion: 1, exportedAt: 'not-a-date', trips: [] }))).toEqual({
      ok: false,
      error: 'Import file has an invalid export timestamp.'
    });
  });

  test('rejects an oversized backup before parsing it', () => {
    expect(importTripsFromJson(' '.repeat(MAX_TRIP_BACKUP_BYTES + 1))).toEqual({
      ok: false,
      error: 'Import file is too large.'
    });
  });

  test('rejects a backup above the trip-count limit', () => {
    const trips = Array.from({ length: MAX_TRIP_COUNT + 1 }, (_, index) => ({
      ...unsortedTrips[0],
      id: `trip-${index}`
    }));
    const json = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2026-01-02T03:04:05.000Z',
      trips
    });

    expect(importTripsFromJson(json)).toEqual({
      ok: false,
      error: `Import file contains too many trips (maximum ${MAX_TRIP_COUNT}).`
    });
  });
});
