import {
  MAX_TRIP_BACKUP_BYTES,
  SCHNGN_BACKUP_SCHEMA_VERSION,
  importTripsFromJson
} from '../import-export/tripBackup';
import type { EditableTrip } from '../trips/tripCrud';

export const ACCOUNT_TRIP_SNAPSHOT_SCHEMA_VERSION = 2;
export const ACCOUNT_SYNC_CONSENT_VERSION = 'account-sync-v2';
export const MAX_ACCOUNT_SYNC_BODY_BYTES = MAX_TRIP_BACKUP_BYTES;

export interface AccountTripSnapshot {
  trips: EditableTrip[];
  revision: number;
  updatedAt: string | null;
  consentVersion: typeof ACCOUNT_SYNC_CONSENT_VERSION | null;
}

export type ParseAccountTripsResult =
  | { ok: true; trips: EditableTrip[] }
  | { ok: false; error: string };

/**
 * Shared trust boundary for trip arrays received from either D1 or a browser.
 * It deliberately reuses the import/export validator so country, date, id,
 * count, duplicate, and serialized-size rules cannot drift between storage
 * paths.
 */
export function parseAccountTrips(value: unknown): ParseAccountTripsResult {
  let json: string;

  try {
    json = JSON.stringify({
      schemaVersion: SCHNGN_BACKUP_SCHEMA_VERSION,
      exportedAt: '1970-01-01T00:00:00.000Z',
      trips: value
    });
  } catch {
    return { ok: false, error: 'Trip data is not serializable.' };
  }

  const result = importTripsFromJson(json);
  if (result.ok === false) {
    return { ok: false, error: result.error };
  }

  return { ok: true, trips: result.trips };
}
