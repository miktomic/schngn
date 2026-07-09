import { sortTrips, type EditableTrip } from './tripCrud';

export const SCHNGN_TRIPS_STORAGE_KEY = 'schngn.trips.v1';

export interface TripStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadTripsResult {
  trips: EditableTrip[];
  source: 'defaults' | 'storage';
  warning?: string;
}

export function createDefaultTrips(): EditableTrip[] {
  return [
    { id: 'france', label: 'France', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-12', status: 'past' },
    { id: 'germany', label: 'Germany', countryCode: 'DE', entryDate: '2026-06-10', exitDate: '2026-06-27', status: 'past' },
    { id: 'greece', label: 'Greece', countryCode: 'GR', entryDate: '2026-08-03', exitDate: '2026-08-18', status: 'booked' },
    { id: 'italy', label: 'Italy', countryCode: 'IT', entryDate: '2026-09-15', exitDate: '2026-10-13', status: 'booked' }
  ];
}

export function loadTripsFromStorage(storage: TripStorageLike): LoadTripsResult {
  let stored: string | null;

  try {
    stored = storage.getItem(SCHNGN_TRIPS_STORAGE_KEY);
  } catch {
    return {
      trips: createDefaultTrips(),
      source: 'defaults',
      warning: 'Browser storage is unavailable. Your trips can still be calculated in this tab, but they may not persist after reload.'
    };
  }

  if (!stored) {
    return { trips: createDefaultTrips(), source: 'defaults' };
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) throw new Error('Stored trip payload is not an array.');

    const trips = parsed.map(parseStoredTrip);
    return { trips: sortTrips(trips), source: 'storage' };
  } catch {
    return {
      trips: createDefaultTrips(),
      source: 'defaults',
      warning: 'Stored trips could not be loaded, so SCHNGN restored the bundled example trips. Export JSON before clearing browser data.'
    };
  }
}

export function saveTripsToStorage(storage: TripStorageLike, trips: EditableTrip[]): void {
  try {
    storage.setItem(SCHNGN_TRIPS_STORAGE_KEY, JSON.stringify(sortTrips(trips)));
  } catch {
    // Local-only means storage failure should never push data elsewhere.
    // The UI surfaces the limitation; the repository stays intentionally quiet.
  }
}

export function clearTripsFromStorage(storage: TripStorageLike): void {
  try {
    storage.removeItem(SCHNGN_TRIPS_STORAGE_KEY);
  } catch {
    // Same rule as save: do not escalate to a network fallback.
  }
}

function parseStoredTrip(value: unknown): EditableTrip {
  if (!value || typeof value !== 'object') throw new Error('Trip is not an object.');
  const trip = value as Partial<Record<keyof EditableTrip, unknown>>;

  const id = readRequiredString(trip.id, 'id');
  const label = readRequiredString(trip.label, 'label');
  const entryDate = readRequiredString(trip.entryDate, 'entryDate');
  const exitDate = readRequiredString(trip.exitDate, 'exitDate');
  const status = readStatus(trip.status);
  const countryCode = typeof trip.countryCode === 'string' && trip.countryCode.trim() ? trip.countryCode.trim().toUpperCase() : undefined;

  return { id, label, countryCode, entryDate, exitDate, status };
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Trip ${field} is required.`);
  return value;
}

function readStatus(value: unknown): EditableTrip['status'] {
  if (value === 'past' || value === 'booked' || value === 'what-if') return value;
  throw new Error('Trip status is invalid.');
}
