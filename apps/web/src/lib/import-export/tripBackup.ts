import { sortTrips, validateTripInput, type EditableTrip } from '$lib/trips/tripCrud';

export const SCHNGN_BACKUP_SCHEMA_VERSION = 1;

export interface TripBackupFile {
  schemaVersion: typeof SCHNGN_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  trips: EditableTrip[];
}

export type ImportTripsResult = { ok: true; trips: EditableTrip[] } | { ok: false; error: string };

export function tripsToBackupJson(trips: EditableTrip[], exportedAt: Date = new Date()): string {
  const backup: TripBackupFile = {
    schemaVersion: SCHNGN_BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    trips: sortTrips(trips).map(copyTripForBackup)
  };

  return JSON.stringify(backup, null, 2);
}

export function importTripsFromJson(json: string): ImportTripsResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Import file is not valid JSON.' };
  }

  if (!isBackupEnvelope(parsed)) {
    return { ok: false, error: 'Import file is not a SCHNGN JSON backup.' };
  }

  const trips: EditableTrip[] = [];

  for (const [index, value] of parsed.trips.entries()) {
    const result = parseBackupTrip(value, index + 1);
    if (result.ok === false) {
      return { ok: false, error: result.error };
    }

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

  if (!id || !label || !entryDate || !exitDate || (status !== 'past' && status !== 'booked' && status !== 'what-if')) {
    return { ok: false, error: `Trip ${ordinal} is missing required fields.` };
  }

  const trip: EditableTrip = {
    id,
    label,
    countryCode: typeof candidate.countryCode === 'string' && candidate.countryCode.trim() ? candidate.countryCode.trim().toUpperCase() : undefined,
    entryDate,
    exitDate,
    status
  };

  const errors = validateTripInput(trip);
  if (errors.entryDate || errors.exitDate) {
    return { ok: false, error: `Trip ${ordinal} has an invalid date range.` };
  }

  return { ok: true, trip };
}

function readRequiredString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}
