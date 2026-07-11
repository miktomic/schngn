import { describe, expect, test } from 'bun:test';
import {
  clearTripsFromStorage,
  createDefaultTrips,
  loadTripsFromStorage,
  saveTripsToStorage,
  SCHNGN_TRIPS_STORAGE_KEY,
  type TripStorageLike
} from '../src/lib/trips/tripStorage';
import type { EditableTrip } from '../src/lib/trips/tripCrud';
import { MAX_TRIP_COUNT } from '../src/lib/trips/tripCrud';
import { makeTrip } from './trip-fixtures';

class MemoryStorage implements TripStorageLike {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const spain: EditableTrip = makeTrip('spain', 'Spain', '2026-07-01', '2026-07-19', 'booked', 'ES');

describe('local-only trip storage repository', () => {
  test('loads an empty trip list when storage is empty', () => {
    const storage = new MemoryStorage();
    const result = loadTripsFromStorage(storage);

    expect(result.source).toBe('empty');
    expect(result.trips).toEqual([]);
    expect(createDefaultTrips()).toEqual([]);
    expect(result.warning).toBeUndefined();
  });

  test('saves and reloads editable trips without changing their dates', () => {
    const storage = new MemoryStorage();
    expect(saveTripsToStorage(storage, [spain])).toEqual({ ok: true });

    const stored = storage.getItem(SCHNGN_TRIPS_STORAGE_KEY);
    expect(stored).toContain('2026-07-01');
    expect(stored).toContain('Spain');

    const result = loadTripsFromStorage(storage);
    expect(result.source).toBe('storage');
    expect(result.trips).toEqual([spain]);
  });

  test('round-trips the explicit ongoing-stay marker', () => {
    const storage = new MemoryStorage();
    const ongoing = { ...spain, ongoing: true as const, exitCountryCode: undefined };
    expect(saveTripsToStorage(storage, [ongoing])).toEqual({ ok: true });
    expect(loadTripsFromStorage(storage).trips).toEqual([ongoing]);
  });

  test('falls back safely to empty with a warning when stored JSON is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(SCHNGN_TRIPS_STORAGE_KEY, '{not json');

    const result = loadTripsFromStorage(storage);

    expect(result.source).toBe('empty');
    expect(result.trips).toEqual([]);
    expect(result.warning).toContain('could not be loaded');
  });

  test('rejects semantically invalid stored dates, statuses, countries, and duplicate ids', () => {
    const invalidPayloads = [
      [{ ...spain, stays: [{ entryDate: '2026-02-30', exitDate: '2026-07-19' }] }],
      [{ ...spain, stays: [{ entryDate: '2026-07-01', exitDate: '2026-06-30' }] }],
      [{ ...spain, status: 'confirmed' }],
      [{ ...spain, entryCountryCode: 'Spain' }],
      [{ ...spain, id: 'x'.repeat(129) }],
      [{ ...spain, label: 'x'.repeat(81) }],
      [spain, { ...spain, label: 'Duplicate' }]
    ];

    for (const payload of invalidPayloads) {
      const storage = new MemoryStorage();
      storage.setItem(SCHNGN_TRIPS_STORAGE_KEY, JSON.stringify(payload));

      const result = loadTripsFromStorage(storage);
      expect(result.source).toBe('empty');
      expect(result.trips).toEqual([]);
      expect(result.warning).toContain('could not be loaded');
    }
  });

  test('clears persisted trips and reports success', () => {
    const storage = new MemoryStorage();
    expect(saveTripsToStorage(storage, [spain])).toEqual({ ok: true });

    expect(clearTripsFromStorage(storage)).toEqual({ ok: true });
    expect(storage.getItem(SCHNGN_TRIPS_STORAGE_KEY)).toBeNull();
    expect(loadTripsFromStorage(storage).trips).toEqual([]);
  });

  test('rejects stored arrays above the local trip-count limit', () => {
    const storage = new MemoryStorage();
    const tooManyTrips = Array.from({ length: MAX_TRIP_COUNT + 1 }, (_, index) => ({
      ...spain,
      id: `spain-${index}`
    }));
    storage.setItem(SCHNGN_TRIPS_STORAGE_KEY, JSON.stringify(tooManyTrips));

    const result = loadTripsFromStorage(storage);
    expect(result.source).toBe('empty');
    expect(result.trips).toEqual([]);
    expect(result.warning).toContain('could not be loaded');
  });

  test('falls back to empty with a warning when storage is unavailable', () => {
    const brokenStorage: TripStorageLike = {
      getItem() {
        throw new Error('disabled');
      },
      setItem() {
        throw new Error('disabled');
      },
      removeItem() {
        throw new Error('disabled');
      }
    };

    const result = loadTripsFromStorage(brokenStorage);

    expect(result.source).toBe('empty');
    expect(result.trips).toEqual([]);
    expect(result.warning).toContain('Browser storage is unavailable');
    expect(saveTripsToStorage(brokenStorage, [spain])).toEqual({
      ok: false,
      error: 'Trips could not be saved in this browser. Keep this tab open or export a private JSON backup.'
    });
    expect(clearTripsFromStorage(brokenStorage)).toEqual({
      ok: false,
      error: 'Local trip data could not be cleared from this browser.'
    });
  });
});
