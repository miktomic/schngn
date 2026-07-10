import {
  ACCOUNT_TRIP_SNAPSHOT_SCHEMA_VERSION,
  ACCOUNT_SYNC_CONSENT_VERSION,
  parseAccountTrips,
  type AccountTripSnapshot
} from './accountTripSnapshot';
import type { EditableTrip } from '../trips/tripCrud';

export interface AccountD1PreparedStatement {
  bind(...values: unknown[]): AccountD1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface AccountD1Database {
  prepare(query: string): AccountD1PreparedStatement;
  batch?(statements: AccountD1PreparedStatement[]): Promise<unknown>;
}

interface SnapshotRow {
  revision: number;
  trips_json: string;
  updated_at: string;
  consent_version: string;
}

interface SnapshotLookupRow {
  account_deleted: number;
  revision: number | null;
  trips_json: string | null;
  updated_at: string | null;
  consent_version: string | null;
}

interface RevisionRow {
  revision: number;
  updated_at: string;
  consent_version: string;
}

export type PutAccountTripSnapshotResult =
  | { ok: true; snapshot: AccountTripSnapshot }
  | { ok: false; conflict: AccountTripSnapshot }
  | { ok: false; deleted: true };

export const ACCOUNT_DELETION_TOMBSTONE_RETENTION_DAYS = 30;

export class AccountRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountRepositoryError';
  }
}

export class AccountDeletedError extends AccountRepositoryError {
  constructor() {
    super('Account storage is no longer available.');
    this.name = 'AccountDeletedError';
  }
}

export async function getAccountTripSnapshot(
  db: AccountD1Database,
  userId: string
): Promise<AccountTripSnapshot> {
  assertUserId(userId);
  const userIdHash = await hashClerkUserId(userId);
  await purgeExpiredAccountDeletionTombstones(db);

  const row = await db
    .prepare(
      `select
         case when tombstone.clerk_user_id_hash is null then 0 else 1 end as account_deleted,
         snapshot.revision,
         snapshot.trips_json,
         snapshot.updated_at,
         snapshot.consent_version
       from (select ?1 as clerk_user_id, ?2 as clerk_user_id_hash) as account
       left join account_deletion_tombstones as tombstone
         on tombstone.clerk_user_id_hash = account.clerk_user_id_hash
        and tombstone.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       left join account_trip_snapshots as snapshot
         on snapshot.clerk_user_id = account.clerk_user_id
        and tombstone.clerk_user_id_hash is null`
    )
    .bind(userId, userIdHash)
    .first<SnapshotLookupRow>();

  if (row === null) {
    throw new AccountRepositoryError('Account lookup returned no result.');
  }

  return snapshotFromLookupRow(row);
}

export async function putAccountTripSnapshot(
  db: AccountD1Database,
  userId: string,
  expectedRevision: number,
  trips: EditableTrip[]
): Promise<PutAccountTripSnapshotResult> {
  assertUserId(userId);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new AccountRepositoryError('Expected revision is invalid.');
  }

  const parsed = parseAccountTrips(trips);
  if (parsed.ok === false) {
    throw new AccountRepositoryError('Trip snapshot is invalid.');
  }
  const tripsJson = JSON.stringify(parsed.trips);
  const userIdHash = await hashClerkUserId(userId);
  await purgeExpiredAccountDeletionTombstones(db);

  const row = expectedRevision === 0
    ? await db
        .prepare(
          `insert into account_trip_snapshots
             (clerk_user_id, schema_version, revision, trips_json, consent_version)
           select ?1, ${ACCOUNT_TRIP_SNAPSHOT_SCHEMA_VERSION}, 1, ?2, ?3
           where not exists (
             select 1
             from account_deletion_tombstones
             where clerk_user_id_hash = ?4
               and expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           )
           on conflict(clerk_user_id) do nothing
           returning revision, updated_at, consent_version`
        )
        .bind(userId, tripsJson, ACCOUNT_SYNC_CONSENT_VERSION, userIdHash)
        .first<RevisionRow>()
    : await db
        .prepare(
          `update account_trip_snapshots
           set schema_version = ${ACCOUNT_TRIP_SNAPSHOT_SCHEMA_VERSION},
               revision = revision + 1,
               trips_json = ?3,
               consent_version = ?4,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           where clerk_user_id = ?1
             and revision = ?2
             and not exists (
               select 1
               from account_deletion_tombstones
               where clerk_user_id_hash = ?5
                 and expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             )
           returning revision, updated_at, consent_version`
        )
        .bind(userId, expectedRevision, tripsJson, ACCOUNT_SYNC_CONSENT_VERSION, userIdHash)
        .first<RevisionRow>();

  if (row === null) {
    try {
      return { ok: false, conflict: await getAccountTripSnapshot(db, userId) };
    } catch (error) {
      if (error instanceof AccountDeletedError) return { ok: false, deleted: true };
      throw error;
    }
  }

  const revision = revisionFromRow(row, expectedRevision + 1);

  return {
    ok: true,
    snapshot: {
      trips: parsed.trips,
      revision: revision.revision,
      updatedAt: revision.updated_at,
      consentVersion: revision.consent_version
    }
  };
}

/** Deletes the current trip snapshot without disabling sync for an existing Clerk account. */
export async function deleteAccountData(db: AccountD1Database, userId: string): Promise<void> {
  assertUserId(userId);
  await purgeExpiredAccountDeletionTombstones(db);
  const result = await db
    .prepare('delete from account_trip_snapshots where clerk_user_id = ?1')
    .bind(userId)
    .run();

  assertSuccessfulD1Result(result, 'Account data deletion failed.');
}

/**
 * Removes a deleted Clerk user's snapshot and installs a 30-day replay/race guard.
 *
 * The marker contains only a one-way account-id digest. D1 executes the batch
 * transactionally and in statement order: the marker is written first, so a concurrent
 * snapshot write either commits before this batch and is deleted, or observes the marker
 * and cannot recreate the row. Thirty days exceeds token, webhook retry, and in-flight
 * request windows; expired markers are ignored and opportunistically purged.
 */
export async function tombstoneDeletedAccountData(
  db: AccountD1Database,
  userId: string
): Promise<void> {
  assertUserId(userId);
  if (typeof db.batch !== 'function') {
    throw new AccountRepositoryError('Transactional account deletion is unavailable.');
  }
  const userIdHash = await hashClerkUserId(userId);

  const tombstone = db
    .prepare(
      `insert into account_deletion_tombstones (clerk_user_id_hash, deleted_at, expires_at)
       values (
         ?1,
         strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
         strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+${ACCOUNT_DELETION_TOMBSTONE_RETENTION_DAYS} days')
       )
       on conflict(clerk_user_id_hash) do update set
         deleted_at = excluded.deleted_at,
         expires_at = excluded.expires_at
       where account_deletion_tombstones.expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .bind(userIdHash);
  const snapshotDeletion = db
    .prepare('delete from account_trip_snapshots where clerk_user_id = ?1')
    .bind(userId);
  const expiredTombstonePurge = db.prepare(
    `delete from account_deletion_tombstones
     where expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
  );

  const results = await db.batch([tombstone, snapshotDeletion, expiredTombstonePurge]);
  if (!Array.isArray(results) || results.length !== 3) {
    throw new AccountRepositoryError('Transactional account deletion returned an invalid result.');
  }
  assertSuccessfulD1Result(results[0], 'Account deletion tombstone failed.');
  assertSuccessfulD1Result(results[1], 'Account data deletion failed.');
  assertSuccessfulD1Result(results[2], 'Expired account deletion tombstone purge failed.');
}

function emptyAccountTripSnapshot(): AccountTripSnapshot {
  return { trips: [], revision: 0, updatedAt: null, consentVersion: null };
}

function snapshotFromLookupRow(row: SnapshotLookupRow): AccountTripSnapshot {
  if (row.account_deleted !== 0 && row.account_deleted !== 1) {
    throw new AccountRepositoryError('Account lookup returned an invalid deletion state.');
  }
  if (row.account_deleted === 1) throw new AccountDeletedError();

  if (row.revision === null) {
    if (row.trips_json !== null || row.updated_at !== null || row.consent_version !== null) {
      throw new AccountRepositoryError('Account lookup returned an invalid empty snapshot.');
    }
    return emptyAccountTripSnapshot();
  }

  if (
    typeof row.trips_json !== 'string' ||
    typeof row.updated_at !== 'string' ||
    typeof row.consent_version !== 'string'
  ) {
    throw new AccountRepositoryError('Stored trip snapshot is invalid.');
  }

  return snapshotFromRow({
    revision: row.revision,
    trips_json: row.trips_json,
    updated_at: row.updated_at,
    consent_version: row.consent_version
  });
}

function snapshotFromRow(row: SnapshotRow): AccountTripSnapshot {
  if (!Number.isSafeInteger(row.revision) || row.revision < 1) {
    throw new AccountRepositoryError('Stored trip snapshot has an invalid revision.');
  }
  if (typeof row.updated_at !== 'string' || !isIsoTimestamp(row.updated_at)) {
    throw new AccountRepositoryError('Stored trip snapshot has an invalid timestamp.');
  }

  let storedTrips: unknown;
  try {
    storedTrips = JSON.parse(row.trips_json) as unknown;
  } catch {
    throw new AccountRepositoryError('Stored trip snapshot is invalid.');
  }

  const parsed = parseAccountTrips(storedTrips);
  if (parsed.ok === false) {
    throw new AccountRepositoryError('Stored trip snapshot is invalid.');
  }

  return {
    trips: parsed.trips,
    revision: row.revision,
    updatedAt: row.updated_at,
    consentVersion: parseConsentVersion(row.consent_version)
  };
}

function assertUserId(userId: string): void {
  if (typeof userId !== 'string' || userId.length < 1 || userId.length > 256) {
    throw new AccountRepositoryError('Authenticated user id is invalid.');
  }
}

async function hashClerkUserId(userId: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new AccountRepositoryError('Account deletion protection is unavailable.');
  }
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(userId)
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function purgeExpiredAccountDeletionTombstones(db: AccountD1Database): Promise<void> {
  const result = await db
    .prepare(
      `delete from account_deletion_tombstones
       where expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
    .run();
  assertSuccessfulD1Result(result, 'Expired account deletion tombstone purge failed.');
}

function isIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function parseConsentVersion(value: string): typeof ACCOUNT_SYNC_CONSENT_VERSION {
  if (value !== ACCOUNT_SYNC_CONSENT_VERSION) {
    throw new AccountRepositoryError('Stored trip snapshot has an invalid consent version.');
  }
  return value;
}

function revisionFromRow(row: RevisionRow, expectedRevision: number): {
  revision: number;
  updated_at: string;
  consent_version: typeof ACCOUNT_SYNC_CONSENT_VERSION;
} {
  if (row === null || typeof row !== 'object') {
    throw new AccountRepositoryError('Snapshot write returned an invalid result.');
  }
  if (row.revision !== expectedRevision || !Number.isSafeInteger(row.revision)) {
    throw new AccountRepositoryError('Snapshot write returned an invalid revision.');
  }
  if (typeof row.updated_at !== 'string' || !isIsoTimestamp(row.updated_at)) {
    throw new AccountRepositoryError('Snapshot write returned an invalid timestamp.');
  }
  if (typeof row.consent_version !== 'string') {
    throw new AccountRepositoryError('Snapshot write returned an invalid consent version.');
  }
  return {
    revision: row.revision,
    updated_at: row.updated_at,
    consent_version: parseConsentVersion(row.consent_version)
  };
}

function assertSuccessfulD1Result(value: unknown, message: string): void {
  if (typeof value !== 'object' || value === null || !('success' in value) || value.success !== true) {
    throw new AccountRepositoryError(message);
  }
}
