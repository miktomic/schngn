import { describe, expect, test } from 'bun:test';
import {
  createDefaultTrips,
  loadTripsFromStorage,
  saveTripsToStorage,
  SCHNGN_TRIPS_STORAGE_KEY,
  type TripStorageLike
} from '../src/lib/trips/tripStorage';
import type { EditableTrip } from '../src/lib/trips/tripCrud';

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

const spain: EditableTrip = {
  id: 'spain',
  label: 'Spain',
  countryCode: 'ES',
  entryDate: '2026-07-01',
  exitDate: '2026-07-19',
  status: 'booked'
};

describe('local-only trip storage repository', () => {
  test('loads bundled defaults when storage is empty', () => {
    const storage = new MemoryStorage();
    const result = loadTripsFromStorage(storage);

    expect(result.source).toBe('defaults');
    expect(result.trips).toEqual(createDefaultTrips());
    expect(result.warning).toBeUndefined();
  });

  test('saves and reloads editable trips without changing their dates', () => {
    const storage = new MemoryStorage();
    saveTripsToStorage(storage, [spain]);

    const stored = storage.getItem(SCHNGN_TRIPS_STORAGE_KEY);
    expect(stored).toContain('2026-07-01');
    expect(stored).toContain('Spain');

    const result = loadTripsFromStorage(storage);
    expect(result.source).toBe('storage');
    expect(result.trips).toEqual([spain]);
  });

  test('falls back to defaults with a warning when stored JSON is corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem(SCHNGN_TRIPS_STORAGE_KEY, '{not json');

    const result = loadTripsFromStorage(storage);

    expect(result.source).toBe('defaults');
    expect(result.trips).toEqual(createDefaultTrips());
    expect(result.warning).toContain('could not be loaded');
  });

  test('falls back to defaults with a warning when storage is unavailable', () => {
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

    expect(result.source).toBe('defaults');
    expect(result.warning).toContain('Browser storage is unavailable');
    expect(() => saveTripsToStorage(brokenStorage, [spain])).not.toThrow();
  });
});
