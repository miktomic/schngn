import {
  isTripStatus,
  MAX_TRIP_COUNT,
  sortTrips,
  validateTripInput,
  type EditableTrip
} from './tripCrud';
import { normalizeCountryCode } from './countries';

export const SCHNGN_TRIPS_STORAGE_KEY = 'schngn.trips.v1';
export const MAX_TRIP_STORAGE_CHARACTERS = 1_000_000;

export interface TripStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadTripsResult {
  trips: EditableTrip[];
  source: 'empty' | 'storage';
  warning?: string;
}

export type TripStorageMutationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Kept as a compatibility boundary for the app shell. First-run state must be
 * genuinely empty; example itineraries must never enter a user's calculation.
 */
export function createDefaultTrips(): EditableTrip[] {
  return [];
}

export function loadTripsFromStorage(storage: TripStorageLike): LoadTripsResult {
  let stored: string | null;

  try {
    stored = storage.getItem(SCHNGN_TRIPS_STORAGE_KEY);
  } catch {
    return {
      trips: [],
      source: 'empty',
      warning: 'Browser storage is unavailable. Your trips can still be calculated in this tab, but they may not persist after reload.'
    };
  }

  if (stored === null) {
    return { trips: [], source: 'empty' };
  }

  try {
    if (stored.length > MAX_TRIP_STORAGE_CHARACTERS) {
      throw new Error('Stored trip payload is too large.');
    }
    const parsed = JSON.parse(stored) as unknown;
    return { trips: parseStoredTrips(parsed), source: 'storage' };
  } catch {
    return {
      trips: [],
      source: 'empty',
      warning: 'Stored trips could not be loaded, so SCHNGN started with an empty trip list. The invalid stored value was left unchanged.'
    };
  }
}

export function saveTripsToStorage(
  storage: TripStorageLike,
  trips: EditableTrip[]
): TripStorageMutationResult {
  let validatedTrips: EditableTrip[];

  try {
    validatedTrips = parseStoredTrips(trips);
  } catch {
    return {
      ok: false,
      error: 'Trips contain invalid data and were not saved.'
    };
  }

  try {
    const serializedTrips = JSON.stringify(validatedTrips);
    if (serializedTrips.length > MAX_TRIP_STORAGE_CHARACTERS) {
      return { ok: false, error: 'Trips exceed the local backup size limit and were not saved.' };
    }
    storage.setItem(SCHNGN_TRIPS_STORAGE_KEY, serializedTrips);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Trips could not be saved in this browser. Keep this tab open or export a private JSON backup.'
    };
  }
}

export function clearTripsFromStorage(storage: TripStorageLike): TripStorageMutationResult {
  try {
    storage.removeItem(SCHNGN_TRIPS_STORAGE_KEY);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Local trip data could not be cleared from this browser.'
    };
  }
}

function parseStoredTrips(value: unknown): EditableTrip[] {
  if (!Array.isArray(value)) throw new Error('Stored trip payload is not an array.');
  if (value.length > MAX_TRIP_COUNT) throw new Error('Stored trip payload contains too many trips.');

  const trips = value.map(parseStoredTrip);
  const ids = new Set<string>();

  for (const trip of trips) {
    if (ids.has(trip.id)) throw new Error(`Duplicate trip id: ${trip.id}`);
    ids.add(trip.id);
  }

  return sortTrips(trips);
}

function parseStoredTrip(value: unknown): EditableTrip {
  if (!value || typeof value !== 'object') throw new Error('Trip is not an object.');
  const trip = value as Partial<Record<keyof EditableTrip, unknown>>;

  const id = readRequiredString(trip.id, 'id');
  const label = readRequiredString(trip.label, 'label');
  const entryDate = readRequiredString(trip.entryDate, 'entryDate');
  const exitDate = readRequiredString(trip.exitDate, 'exitDate');

  if (!isTripStatus(trip.status)) throw new Error('Trip status is invalid.');

  let countryCode: string | undefined;
  if (trip.countryCode !== undefined && trip.countryCode !== null) {
    if (typeof trip.countryCode !== 'string') throw new Error('Trip countryCode is invalid.');
    countryCode = normalizeCountryCode(trip.countryCode);
  }

  const parsedTrip: EditableTrip = {
    id,
    label,
    countryCode,
    entryDate,
    exitDate,
    status: trip.status
  };
  const errors = validateTripInput(parsedTrip);

  if (Object.keys(errors).length > 0) {
    throw new Error(`Trip fields are invalid: ${Object.keys(errors).join(', ')}`);
  }

  return parsedTrip;
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Trip ${field} is required.`);
  return value.trim();
}
