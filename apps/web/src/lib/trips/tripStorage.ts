import {
  isTripStatus,
  isValidTripId,
  isRealIsoDate,
  MAX_TRIP_COUNT,
  sortTrips,
  validateEditableTrip,
  type EditableTrip
} from './tripCrud';
import { isSupportedCountryCode, normalizeCountryCode } from './countries';

export const SCHNGN_TRIPS_STORAGE_KEY = 'schngn.trips.v2';
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
  if (!isValidTripId(id)) throw new Error('Trip id is invalid.');
  const label = readOptionalString(trip.label, 'label');

  if (!isTripStatus(trip.status)) throw new Error('Trip status is invalid.');

  const entryCountryCode = readOptionalCountryCode(trip.entryCountryCode, 'entryCountryCode');
  const exitCountryCode = readOptionalCountryCode(trip.exitCountryCode, 'exitCountryCode');
  if (!Array.isArray(trip.stays) || trip.stays.length < 1 || trip.stays.length > 21) {
    throw new Error('Trip stays are invalid.');
  }
  const stays = trip.stays.map((stay, index) => parseStoredStay(stay, index));

  const parsedTrip: EditableTrip = {
    id,
    label,
    entryCountryCode,
    exitCountryCode,
    stays,
    status: trip.status
  };
  const errors = validateEditableTrip(parsedTrip);

  if (Object.keys(errors).length > 0) {
    throw new Error(`Trip fields are invalid: ${Object.keys(errors).join(', ')}`);
  }

  return parsedTrip;
}

function parseStoredStay(value: unknown, index: number): { entryDate: string; exitDate: string } {
  if (!value || typeof value !== 'object') throw new Error(`Trip stay ${index + 1} is invalid.`);
  const stay = value as { entryDate?: unknown; exitDate?: unknown };
  const entryDate = readRequiredString(stay.entryDate, 'entryDate');
  const exitDate = readRequiredString(stay.exitDate, 'exitDate');
  if (!isRealIsoDate(entryDate) || !isRealIsoDate(exitDate) || exitDate < entryDate) {
    throw new Error(`Trip stay ${index + 1} has an invalid date range.`);
  }
  return { entryDate, exitDate };
}

function readOptionalCountryCode(value: unknown, field: string): string | undefined {
  const normalized = normalizeCountryCode(readOptionalString(value, field));
  if (normalized && !isSupportedCountryCode(normalized)) throw new Error(`Trip ${field} is invalid.`);
  return normalized;
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Trip ${field} is required.`);
  return value.trim();
}

function readOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`Trip ${field} is invalid.`);
  const normalized = value.trim();
  return normalized || undefined;
}
