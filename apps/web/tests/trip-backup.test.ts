import { describe, expect, test } from 'bun:test';
import { calculateUsageOnDate } from '@schngn/engine';
import { importTripsFromJson, tripsToBackupJson } from '../src/lib/import-export/tripBackup';
import { toEngineTrips, type EditableTrip } from '../src/lib/trips/tripCrud';

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
});
