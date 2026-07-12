import { describe, expect, test } from 'bun:test';
import type { EditableTrip } from '../src/lib/trips/tripCrud';
import {
  ACCOUNT_SYNC_METADATA_KEY,
  ACCOUNT_SIGNUP_SYNC_INTENT_KEY,
  buildAccountSyncMetadata,
  buildPausedAccountSyncMetadata,
  decideAccountReconciliation,
  clearAccountSignupSyncIntent,
  fingerprintTrips,
  hasAccountSignupSyncIntent,
  loadAccountSyncMetadata,
  saveAccountSyncMetadata,
  saveAccountSignupSyncIntent,
  shouldRestoreMissingLocalSnapshot,
  type AccountTripSnapshot
} from '../src/lib/account/accountSync';
import { makeTrip } from './trip-fixtures';

const localTrip: EditableTrip = makeTrip('trip-local', 'Local Spain stay', '2026-05-01', '2026-05-05', 'booked', 'ES');
const cloudTrip: EditableTrip = makeTrip('trip-cloud', 'Cloud France stay', '2026-06-01', '2026-06-03', 'past', 'FR');

const snapshot = (trips: EditableTrip[], revision: number): AccountTripSnapshot => ({
  trips,
  revision,
  updatedAt: revision === 0 ? null : '2026-07-09T12:00:00.000Z',
  consentVersion: revision === 0 ? null : 'account-sync-v2'
});

describe('authenticated account reconciliation', () => {
  test('records signup as explicit account-storage consent until the return flow consumes it', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    };

    expect(saveAccountSignupSyncIntent(storage)).toEqual({ ok: true });
    expect(values.get(ACCOUNT_SIGNUP_SYNC_INTENT_KEY)).toBe('account-sync-v2');
    expect(hasAccountSignupSyncIntent(storage)).toBe(true);
    expect(clearAccountSignupSyncIntent(storage)).toEqual({ ok: true });
    expect(hasAccountSignupSyncIntent(storage)).toBe(false);
  });

  test('offers explicit sync before the first server write', () => {
    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: [localTrip],
        cloud: snapshot([], 0),
        metadata: null
      })
    ).toEqual({ action: 'offer_initial_sync' });
  });

  test('loads an existing account automatically on a genuinely empty device', () => {
    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: [],
        cloud: snapshot([cloudTrip], 3),
        metadata: null
      })
    ).toEqual({ action: 'load_cloud' });
  });

  test('does not silently overwrite unrelated local trips on a new device', () => {
    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: [localTrip],
        cloud: snapshot([cloudTrip], 3),
        metadata: null
      })
    ).toEqual({ action: 'conflict' });
  });

  test('pushes an offline local edit only when the server revision is unchanged', () => {
    const metadata = buildAccountSyncMetadata('user_123', snapshot([localTrip], 4));
    const edited = [{ ...localTrip, stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-06' }] }];

    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: edited,
        cloud: snapshot([localTrip], 4),
        metadata
      })
    ).toEqual({ action: 'push_local' });
  });

  test('loads a newer cloud revision only when local data is unchanged', () => {
    const metadata = buildAccountSyncMetadata('user_123', snapshot([localTrip], 4));

    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: [localTrip],
        cloud: snapshot([cloudTrip], 5),
        metadata
      })
    ).toEqual({ action: 'load_cloud' });
  });

  test('reports a conflict when both the device and account changed', () => {
    const metadata = buildAccountSyncMetadata('user_123', snapshot([localTrip], 4));
    const edited = [{ ...localTrip, stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-06' }] }];

    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: edited,
        cloud: snapshot([cloudTrip], 5),
        metadata
      })
    ).toEqual({ action: 'conflict' });
  });

  test('does not reuse sync metadata across Clerk users', () => {
    const metadata = buildAccountSyncMetadata('user_other', snapshot([localTrip], 4));

    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: [localTrip],
        cloud: snapshot([cloudTrip], 4),
        metadata
      })
    ).toEqual({ action: 'conflict' });
  });

  test('does not offer another Clerk user a one-click upload of the previous account local copy', () => {
    const metadata = buildAccountSyncMetadata('user_previous', snapshot([localTrip], 4));

    expect(
      decideAccountReconciliation({
        userId: 'user_new',
        localTrips: [localTrip],
        cloud: snapshot([], 0),
        metadata
      })
    ).toEqual({ action: 'conflict' });
  });

  test('keeps sync paused after local-only clearing until the user chooses a copy', () => {
    const metadata = buildPausedAccountSyncMetadata('user_123', snapshot([cloudTrip], 4));

    expect(
      decideAccountReconciliation({
        userId: 'user_123',
        localTrips: [],
        cloud: snapshot([cloudTrip], 4),
        metadata
      })
    ).toEqual({ action: 'conflict' });
  });

  test('never auto-restores over a tab-only edit after browser persistence failed', () => {
    const metadata = buildAccountSyncMetadata('user_123', snapshot([cloudTrip], 4));

    expect(
      shouldRestoreMissingLocalSnapshot({
        userId: 'user_123',
        localTrips: [localTrip],
        cloud: snapshot([cloudTrip], 4),
        metadata,
        storageSource: 'empty',
        hasLocalMutations: true
      })
    ).toBe(false);
  });

  test('restores a healthy account copy only when the browser is truly empty and unchanged', () => {
    const metadata = buildAccountSyncMetadata('user_123', snapshot([cloudTrip], 4));

    expect(
      shouldRestoreMissingLocalSnapshot({
        userId: 'user_123',
        localTrips: [],
        cloud: snapshot([cloudTrip], 4),
        metadata,
        storageSource: 'empty',
        hasLocalMutations: false
      })
    ).toBe(true);
  });

  test('stores only user id, revision, and a one-way fingerprint in local metadata', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    };
    const metadata = buildAccountSyncMetadata('user_123', snapshot([localTrip], 7));

    expect(saveAccountSyncMetadata(storage, metadata)).toEqual({ ok: true });
    expect(loadAccountSyncMetadata(storage)).toEqual(metadata);
    const raw = values.get(ACCOUNT_SYNC_METADATA_KEY) ?? '';
    expect(raw).not.toContain(localTrip.stays[0].entryDate);
    expect(raw).not.toContain(localTrip.label);
    expect(metadata.paused).toBe(false);
  });

  test('fingerprints stable trip content and detects meaningful changes', () => {
    expect(fingerprintTrips([localTrip])).toBe(fingerprintTrips([{ ...localTrip }]));
    expect(fingerprintTrips([localTrip])).not.toBe(fingerprintTrips([{ ...localTrip, stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-06' }] }]));
  });
});
