import {
  isTripStatus,
  isRealIsoDate,
  isValidTripId,
  MAX_TRIP_COUNT,
  sortTrips,
  validateEditableTrip,
  type EditableTrip
} from '../trips/tripCrud';
import { isSupportedCountryCode, normalizeCountryCode } from '../trips/countries';

export const SCHNGN_BACKUP_SCHEMA_VERSION = 2;
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

  if (trips.filter((trip) => trip.ongoing).length > 1) {
    return { ok: false, error: 'Import file contains more than one ongoing stay.' };
  }

  return { ok: true, trips: sortTrips(trips) };
}

function copyTripForBackup(trip: EditableTrip): EditableTrip {
  return {
    id: trip.id,
    label: trip.label,
    entryCountryCode: trip.entryCountryCode,
    exitCountryCode: trip.exitCountryCode,
    ongoing: trip.ongoing,
    stays: trip.stays.map((stay) => ({ ...stay })),
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
  const label = readOptionalString(candidate.label);
  const status = candidate.status;
  const ongoing = candidate.ongoing === true ? true : candidate.ongoing === undefined ? undefined : null;

  if (!id || !isValidTripId(id) || !Array.isArray(candidate.stays) || candidate.stays.length === 0) {
    return { ok: false, error: `Trip ${ordinal} is missing required fields.` };
  }

  if (!isTripStatus(status) || ongoing === null) {
    return { ok: false, error: `Trip ${ordinal} has an invalid status.` };
  }

  const entryCountryCode = parseOptionalCountry(candidate.entryCountryCode);
  const exitCountryCode = parseOptionalCountry(candidate.exitCountryCode);
  if (entryCountryCode === null || exitCountryCode === null) {
    return { ok: false, error: `Trip ${ordinal} has an unsupported border country.` };
  }

  const stays = candidate.stays.map(parseBackupStay);
  if (stays.some((stay) => stay === null)) {
    return { ok: false, error: `Trip ${ordinal} has an invalid Schengen stay.` };
  }

  const trip: EditableTrip = {
    id,
    label,
    entryCountryCode,
    exitCountryCode,
    ongoing,
    stays: stays as EditableTrip['stays'],
    status
  };

  const errors = validateEditableTrip(trip);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: `Trip ${ordinal} has invalid fields.` };
  }

  return { ok: true, trip };
}

function parseBackupStay(value: unknown): EditableTrip['stays'][number] | null {
  if (!value || typeof value !== 'object') return null;
  const stay = value as { entryDate?: unknown; exitDate?: unknown };
  const entryDate = readRequiredString(stay.entryDate);
  const exitDate = readRequiredString(stay.exitDate);
  if (!entryDate || !exitDate || !isRealIsoDate(entryDate) || !isRealIsoDate(exitDate) || exitDate < entryDate) return null;
  return { entryDate, exitDate };
}

function parseOptionalCountry(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return null;
  const normalized = normalizeCountryCode(value);
  return normalized && isSupportedCountryCode(normalized) ? normalized : null;
}

function readRequiredString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

function readOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return undefined;
  return value.trim() || undefined;
}

function isValidExportTimestamp(value: string): boolean {
  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}
