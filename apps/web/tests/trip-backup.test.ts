import { describe, expect, test } from 'bun:test';
import { calculateUsageOnDate } from '@schngn/engine';
import { MAX_TRIP_BACKUP_BYTES, importTripsFromJson, tripsToBackupJson } from '../src/lib/import-export/tripBackup';
import { MAX_TRIP_COUNT, toEngineTrips, type EditableTrip } from '../src/lib/trips/tripCrud';
import { makeTrip } from './trip-fixtures';

const unsortedTrips: EditableTrip[] = [
  makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT'),
  makeTrip('france', 'France', '2026-05-01', '2026-05-12', 'past', 'FR')
];
const envelope = (trips: unknown[], exportedAt = '2026-01-02T03:04:05.000Z') =>
  JSON.stringify({ schemaVersion: 2, exportedAt, trips });

describe('JSON trip backup and restore', () => {
  test('round-trips version-two multi-stay trips and recalculates', () => {
    const multiStay: EditableTrip = {
      ...makeTrip('summer', 'Summer', '2026-07-01', '2026-07-05', 'booked', 'IT', 'AT'),
      stays: [
        { entryDate: '2026-07-01', exitDate: '2026-07-05' },
        { entryDate: '2026-07-08', exitDate: '2026-07-12' }
      ]
    };
    const json = tripsToBackupJson([...unsortedTrips, multiStay], new Date('2026-01-02T03:04:05.000Z'));
    expect(json).toContain('"schemaVersion": 2');
    const result = importTripsFromJson(json);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.trips.find((trip) => trip.id === 'summer')?.stays).toHaveLength(2);
    expect(calculateUsageOnDate(toEngineTrips([multiStay]), '2026-07-12').daysUsed).toBe(10);
  });

  test('rejects malformed JSON and version-one backups', () => {
    expect(importTripsFromJson('{not json')).toEqual({ ok: false, error: 'Import file is not valid JSON.' });
    expect(importTripsFromJson(JSON.stringify({ schemaVersion: 1, exportedAt: '2026-01-02T03:04:05.000Z', trips: [] }))).toEqual({
      ok: false,
      error: 'Import file is not a SCHNGN JSON backup.'
    });
  });

  test('rejects invalid stays, border countries, ids, labels, timestamps, and duplicates', () => {
    expect(importTripsFromJson(envelope([{ ...unsortedTrips[0], stays: [{ entryDate: '2026-02-30', exitDate: '2026-03-01' }] }]))).toMatchObject({ ok: false });
    expect(importTripsFromJson(envelope([{ ...unsortedTrips[0], entryCountryCode: 'IE' }]))).toMatchObject({ ok: false });
    expect(importTripsFromJson(envelope([unsortedTrips[0], { ...unsortedTrips[0], label: 'Duplicate' }]))).toEqual({ ok: false, error: 'Trip 2 duplicates an earlier trip id.' });
    expect(importTripsFromJson(envelope([{ ...unsortedTrips[0], id: 'x'.repeat(129) }]))).toMatchObject({ ok: false });
    expect(importTripsFromJson(envelope([{ ...unsortedTrips[0], label: 'x'.repeat(81) }]))).toMatchObject({ ok: false });
    expect(importTripsFromJson(envelope([], 'not-a-date'))).toEqual({ ok: false, error: 'Import file has an invalid export timestamp.' });
  });

  test('rejects oversized and over-count backups', () => {
    expect(importTripsFromJson(' '.repeat(MAX_TRIP_BACKUP_BYTES + 1))).toEqual({ ok: false, error: 'Import file is too large.' });
    const trips = Array.from({ length: MAX_TRIP_COUNT + 1 }, (_, index) => ({ ...unsortedTrips[0], id: `trip-${index}` }));
    expect(importTripsFromJson(envelope(trips))).toEqual({ ok: false, error: `Import file contains too many trips (maximum ${MAX_TRIP_COUNT}).` });
  });
});
