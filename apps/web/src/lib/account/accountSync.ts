import { sortTrips, type EditableTrip } from '../trips/tripCrud';
import type { TripStorageLike, TripStorageMutationResult } from '../trips/tripStorage';
import { ACCOUNT_SYNC_CONSENT_VERSION, type AccountTripSnapshot } from './accountTripSnapshot';

export type { AccountTripSnapshot } from './accountTripSnapshot';

export const ACCOUNT_SYNC_METADATA_KEY = 'schngn.accountSync.v1';
export const ACCOUNT_SIGNUP_SYNC_INTENT_KEY = 'schngn.accountSignupSync.v1';
const ACCOUNT_SYNC_METADATA_VERSION = 2;

export interface AccountSyncMetadata {
  schemaVersion: typeof ACCOUNT_SYNC_METADATA_VERSION;
  userId: string;
  revision: number;
  syncedFingerprint: string;
  paused: boolean;
}

export type AccountReconciliation =
  | { action: 'offer_initial_sync' }
  | { action: 'load_cloud' }
  | { action: 'push_local' }
  | { action: 'synced' }
  | { action: 'conflict' };

export function shouldRestoreMissingLocalSnapshot(input: {
  userId: string;
  localTrips: EditableTrip[];
  cloud: AccountTripSnapshot;
  metadata: AccountSyncMetadata | null;
  storageSource: 'empty' | 'storage';
  hasLocalMutations: boolean;
}): boolean {
  return Boolean(
    input.cloud.revision > 0 &&
    input.storageSource === 'empty' &&
    input.localTrips.length === 0 &&
    !input.hasLocalMutations &&
    input.metadata?.userId === input.userId &&
    !input.metadata.paused
  );
}

export function decideAccountReconciliation(input: {
  userId: string;
  localTrips: EditableTrip[];
  cloud: AccountTripSnapshot;
  metadata: AccountSyncMetadata | null;
}): AccountReconciliation {
  const { userId, localTrips, cloud } = input;
  const belongsToAnotherAccount = input.metadata !== null && input.metadata.userId !== userId;
  const metadata = input.metadata?.userId === userId ? input.metadata : null;
  const localFingerprint = fingerprintTrips(localTrips);

  if (cloud.revision === 0) {
    if (belongsToAnotherAccount && localTrips.length > 0) return { action: 'conflict' };
    return { action: 'offer_initial_sync' };
  }
  if (!metadata) return localTrips.length === 0 ? { action: 'load_cloud' } : { action: 'conflict' };
  if (metadata.paused) return { action: 'conflict' };

  const localChanged = localFingerprint !== metadata.syncedFingerprint;
  if (cloud.revision === metadata.revision) {
    const cloudFingerprint = fingerprintTrips(cloud.trips);
    if (cloudFingerprint !== metadata.syncedFingerprint) return { action: 'conflict' };
    return localChanged ? { action: 'push_local' } : { action: 'synced' };
  }

  if (cloud.revision > metadata.revision && !localChanged) return { action: 'load_cloud' };
  return { action: 'conflict' };
}

export function buildAccountSyncMetadata(userId: string, snapshot: AccountTripSnapshot): AccountSyncMetadata {
  return {
    schemaVersion: ACCOUNT_SYNC_METADATA_VERSION,
    userId,
    revision: snapshot.revision,
    syncedFingerprint: fingerprintTrips(snapshot.trips),
    paused: false
  };
}

export function buildPausedAccountSyncMetadata(userId: string, snapshot: AccountTripSnapshot): AccountSyncMetadata {
  return { ...buildAccountSyncMetadata(userId, snapshot), paused: true };
}

export function fingerprintTrips(trips: EditableTrip[]): string {
  const canonical = sortTrips(trips).map(({ id, label, entryCountryCode, exitCountryCode, stays, status }) => [
    id,
    label,
    entryCountryCode ?? '',
    exitCountryCode ?? '',
    stays.map(({ entryDate, exitDate }) => [entryDate, exitDate]),
    status
  ]);
  const value = JSON.stringify(canonical);
  let hash = 0xcbf29ce484222325n;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }

  return `fnv1a64-${hash.toString(16).padStart(16, '0')}`;
}

export function loadAccountSyncMetadata(storage: Pick<TripStorageLike, 'getItem'>): AccountSyncMetadata | null {
  try {
    const raw = storage.getItem(ACCOUNT_SYNC_METADATA_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as unknown;
    if (!isAccountSyncMetadata(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function saveAccountSyncMetadata(
  storage: Pick<TripStorageLike, 'setItem'>,
  metadata: AccountSyncMetadata
): TripStorageMutationResult {
  try {
    storage.setItem(ACCOUNT_SYNC_METADATA_KEY, JSON.stringify(metadata));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Account sync status could not be saved in this browser.' };
  }
}

export function clearAccountSyncMetadata(storage: Pick<TripStorageLike, 'removeItem'>): TripStorageMutationResult {
  try {
    storage.removeItem(ACCOUNT_SYNC_METADATA_KEY);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Account sync status could not be cleared from this browser.' };
  }
}

export function saveAccountSignupSyncIntent(
  storage: Pick<TripStorageLike, 'setItem'>
): TripStorageMutationResult {
  try {
    storage.setItem(ACCOUNT_SIGNUP_SYNC_INTENT_KEY, ACCOUNT_SYNC_CONSENT_VERSION);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Signup could not remember the account-save choice in this browser.' };
  }
}

export function hasAccountSignupSyncIntent(
  storage: Pick<TripStorageLike, 'getItem'>
): boolean {
  try {
    return storage.getItem(ACCOUNT_SIGNUP_SYNC_INTENT_KEY) === ACCOUNT_SYNC_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export function clearAccountSignupSyncIntent(
  storage: Pick<TripStorageLike, 'removeItem'>
): TripStorageMutationResult {
  try {
    storage.removeItem(ACCOUNT_SIGNUP_SYNC_INTENT_KEY);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Signup account-save choice could not be cleared in this browser.' };
  }
}

function isAccountSyncMetadata(value: unknown): value is AccountSyncMetadata {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AccountSyncMetadata>;
  return (
    candidate.schemaVersion === ACCOUNT_SYNC_METADATA_VERSION &&
    typeof candidate.userId === 'string' &&
    /^user_[A-Za-z0-9]+$/u.test(candidate.userId) &&
    Number.isSafeInteger(candidate.revision) &&
    (candidate.revision ?? -1) >= 0 &&
    typeof candidate.syncedFingerprint === 'string' &&
    /^fnv1a64-[a-f0-9]{16}$/u.test(candidate.syncedFingerprint) &&
    typeof candidate.paused === 'boolean'
  );
}
