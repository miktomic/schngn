import {
  isTripStatus,
  MAX_TRIP_COUNT,
  sortTrips,
  validateTripInput,
  type EditableTrip
} from '../trips/tripCrud';
import { normalizeCountryCode } from '../trips/countries';

export const SCHNGN_BACKUP_SCHEMA_VERSION = 1;
export const MAX_TRIP_BACKUP_BYTES = 1_000_000;

export interface TripBackupFile {
  schemaVersion: typeof SCHNGN_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  trips: EditableTrip[];
}

export type ImportTripsResult = { ok: true; trips: EditableTrip[] } | { ok: false; error: string };

export function tripsToBackupJson(trips: EditableTrip[], exportedAt: Date = new Date()): string {
  if (trips.length > MAX_TRIP_COUNT) {
    throw new RangeError(`A backup can contain at most ${MAX_TRIP_COUNT} trips.`);
  }

  const backup: TripBackupFile = {
    schemaVersion: SCHNGN_BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    trips: sortTrips(trips).map(copyTripForBackup)
  };

  return JSON.stringify(backup, null, 2);
}

export function importTripsFromJson(json: string): ImportTripsResult {
  if (new TextEncoder().encode(json).byteLength > MAX_TRIP_BACKUP_BYTES) {
    return { ok: false, error: 'Import file is too large.' };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Import file is not valid JSON.' };
  }

  if (!isBackupEnvelope(parsed)) {
    return { ok: false, error: 'Import file is not a SCHNGN JSON backup.' };
  }

  if (!isValidExportTimestamp(parsed.exportedAt)) {
    return { ok: false, error: 'Import file has an invalid export timestamp.' };
  }

  if (parsed.trips.length > MAX_TRIP_COUNT) {
    return { ok: false, error: `Import file contains too many trips (maximum ${MAX_TRIP_COUNT}).` };
  }

  const trips: EditableTrip[] = [];
  const tripIds = new Set<string>();

  for (const [index, value] of parsed.trips.entries()) {
    const result = parseBackupTrip(value, index + 1);
    if (result.ok === false) {
      return { ok: false, error: result.error };
    }

    if (tripIds.has(result.trip.id)) {
      return { ok: false, error: `Trip ${index + 1} duplicates an earlier trip id.` };
    }

    tripIds.add(result.trip.id);
    trips.push(result.trip);
  }

  return { ok: true, trips: sortTrips(trips) };
}

function copyTripForBackup(trip: EditableTrip): EditableTrip {
  return {
    id: trip.id,
    label: trip.label,
    countryCode: trip.countryCode,
    entryDate: trip.entryDate,
    exitDate: trip.exitDate,
    status: trip.status
  };
}

function isBackupEnvelope(value: unknown): value is { schemaVersion: number; exportedAt: string; trips: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Record<keyof TripBackupFile, unknown>>;
  return (
    candidate.schemaVersion === SCHNGN_BACKUP_SCHEMA_VERSION &&
    typeof candidate.exportedAt === 'string' &&
    Array.isArray(candidate.trips)
  );
}

function parseBackupTrip(value: unknown, ordinal: number): { ok: true; trip: EditableTrip } | { ok: false; error: string } {
  if (!value || typeof value !== 'object') {
    return { ok: false, error: `Trip ${ordinal} is not a valid trip.` };
  }

  const candidate = value as Partial<Record<keyof EditableTrip, unknown>>;
  const id = readRequiredString(candidate.id);
  const label = readRequiredString(candidate.label);
  const entryDate = readRequiredString(candidate.entryDate);
  const exitDate = readRequiredString(candidate.exitDate);
  const status = candidate.status;

  if (!id || !label || !entryDate || !exitDate) {
    return { ok: false, error: `Trip ${ordinal} is missing required fields.` };
  }

  if (!isTripStatus(status)) {
    return { ok: false, error: `Trip ${ordinal} has an invalid status.` };
  }

  let countryCode: string | undefined;
  if (candidate.countryCode !== undefined && candidate.countryCode !== null) {
    if (typeof candidate.countryCode !== 'string') {
      return { ok: false, error: `Trip ${ordinal} has an unsupported country.` };
    }
    countryCode = normalizeCountryCode(candidate.countryCode);
  }

  const trip: EditableTrip = {
    id,
    label,
    countryCode,
    entryDate,
    exitDate,
    status
  };

  const errors = validateTripInput(trip);
  if (errors.countryCode) {
    return { ok: false, error: `Trip ${ordinal} has an unsupported country.` };
  }
  if (errors.entryDate || errors.exitDate) {
    return { ok: false, error: `Trip ${ordinal} has an invalid date range.` };
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: `Trip ${ordinal} has invalid fields.` };
  }

  return { ok: true, trip };
}

function readRequiredString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

function isValidExportTimestamp(value: string): boolean {
  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}
