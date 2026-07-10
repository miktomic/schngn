import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  createAccountDeletionHandler,
  createAccountTripHandlers
} from '../src/lib/account/accountApi';
import type {
  AccountD1Database,
  AccountD1PreparedStatement
} from '../src/lib/account/accountRepository';
import {
  ACCOUNT_DELETION_TOMBSTONE_RETENTION_DAYS,
  tombstoneDeletedAccountData
} from '../src/lib/account/accountRepository';
import {
  ACCOUNT_SYNC_CONSENT_VERSION,
  ACCOUNT_TRIP_SNAPSHOT_SCHEMA_VERSION,
  MAX_ACCOUNT_SYNC_BODY_BYTES,
  parseAccountTrips
} from '../src/lib/account/accountTripSnapshot';
import { MAX_TRIP_COUNT, type EditableTrip } from '../src/lib/trips/tripCrud';
import { makeTrip } from './trip-fixtures';

interface StoredSnapshot {
  revision: number;
  tripsJson: string;
  updatedAt: string;
  consentVersion: string;
}

class MemoryAccountDatabase implements AccountD1Database {
  readonly snapshots = new Map<string, StoredSnapshot>();
  readonly tombstones = new Map<string, string>();
  readonly prepared: Array<{ sql: string; params: unknown[] }> = [];
  runResultOverrides: unknown[] = [];
  batchResultOverride: unknown = NO_OVERRIDE;

  prepare(sql: string): AccountD1PreparedStatement {
    const db = this;
    let params: unknown[] = [];

    return {
      bind(...values: unknown[]) {
        params = values;
        db.prepared.push({ sql, params });
        return this;
      },
      async first<T>() {
        const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
        const userId = String(params[0] ?? '');

        if (normalizedSql.startsWith('select case when tombstone.clerk_user_id_hash')) {
          const userIdHash = String(params[1] ?? '');
          const deleted = db.hasActiveTombstone(userIdHash);
          const row = db.snapshots.get(userId);
          return {
            account_deleted: deleted ? 1 : 0,
            revision: deleted ? null : row?.revision ?? null,
            trips_json: deleted ? null : row?.tripsJson ?? null,
            updated_at: deleted ? null : row?.updatedAt ?? null,
            consent_version: deleted ? null : row?.consentVersion ?? null
          } as T;
        }

        if (normalizedSql.startsWith('insert into account_trip_snapshots')) {
          const userIdHash = String(params[3] ?? '');
          if (db.hasActiveTombstone(userIdHash)) return null;
          if (db.snapshots.has(userId)) return null;
          const row = {
            revision: 1,
            tripsJson: String(params[1]),
            updatedAt: '2026-07-09T10:00:00.000Z',
            consentVersion: String(params[2])
          };
          db.snapshots.set(userId, row);
          return {
            revision: row.revision,
            updated_at: row.updatedAt,
            consent_version: row.consentVersion
          } as T;
        }

        if (normalizedSql.startsWith('update account_trip_snapshots')) {
          const userIdHash = String(params[4] ?? '');
          if (db.hasActiveTombstone(userIdHash)) return null;
          const expectedRevision = Number(params[1]);
          const row = db.snapshots.get(userId);
          if (!row || row.revision !== expectedRevision) return null;
          const updated = {
            revision: row.revision + 1,
            tripsJson: String(params[2]),
            updatedAt: '2026-07-09T10:01:00.000Z',
            consentVersion: String(params[3])
          };
          db.snapshots.set(userId, updated);
          return {
            revision: updated.revision,
            updated_at: updated.updatedAt,
            consent_version: updated.consentVersion
          } as T;
        }

        throw new Error(`Unexpected first() SQL: ${sql}`);
      },
      async run() {
        if (db.runResultOverrides.length > 0) return db.runResultOverrides.shift();

        const normalizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
        const userId = String(params[0] ?? '');
        if (normalizedSql.startsWith('insert into account_deletion_tombstones')) {
          if (!db.hasActiveTombstone(userId)) {
            db.tombstones.set(
              userId,
              new Date(Date.now() + ACCOUNT_DELETION_TOMBSTONE_RETENTION_DAYS * 86_400_000).toISOString()
            );
          }
          return { success: true };
        }
        if (normalizedSql.startsWith('delete from account_trip_snapshots')) {
          db.snapshots.delete(userId);
          return { success: true };
        }
        if (normalizedSql.startsWith('delete from account_deletion_tombstones')) {
          for (const [hash, expiresAt] of db.tombstones) {
            if (Date.parse(expiresAt) <= Date.now()) db.tombstones.delete(hash);
          }
          return { success: true };
        }
        throw new Error(`Unexpected run() SQL: ${sql}`);
      }
    };
  }

  async batch(statements: AccountD1PreparedStatement[]): Promise<unknown> {
    if (this.batchResultOverride !== NO_OVERRIDE) return this.batchResultOverride;

    const snapshotBackup = new Map(this.snapshots);
    const tombstoneBackup = new Map(this.tombstones);
    try {
      const results: unknown[] = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    } catch (error) {
      this.snapshots.clear();
      for (const [key, value] of snapshotBackup) this.snapshots.set(key, value);
      this.tombstones.clear();
      for (const [key, value] of tombstoneBackup) this.tombstones.set(key, value);
      throw error;
    }
  }

  private hasActiveTombstone(userIdHash: string): boolean {
    const expiresAt = this.tombstones.get(userIdHash);
    return expiresAt !== undefined && Date.parse(expiresAt) > Date.now();
  }
}

const NO_OVERRIDE = Symbol('no override');

const italyTrip: EditableTrip = makeTrip('italy-2026', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT');

const authenticated = async () => ({
  ok: true as const,
  userId: 'user_verified_alice',
  sessionId: 'session_1'
});

const anonymous = async () => ({
  ok: false as const,
  status: 401 as const,
  error: 'Authentication required'
});

function syncBody(trips: EditableTrip[], expectedRevision: number) {
  return {
    trips,
    expectedRevision,
    consent: true,
    consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
  };
}

function accountEvent(
  method: 'GET' | 'PUT' | 'DELETE',
  db: MemoryAccountDatabase,
  body?: unknown,
  options: { rawBody?: string; contentType?: string } = {}
) {
  const rawBody = options.rawBody ?? (body === undefined ? undefined : JSON.stringify(body));
  return {
    request: new Request('https://schngn.com/api/account/trips', {
      method,
      body: rawBody,
      headers: rawBody === undefined ? undefined : { 'content-type': options.contentType ?? 'application/json' }
    }),
    platform: { env: { DB: db } }
  };
}

function expectPrivateAccountHeaders(response: Response): void {
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('vary')).toBe('*');
}

describe('account trip snapshot parser', () => {
  test('reuses strict trip validation and returns a sorted safe copy', () => {
    const result = parseAccountTrips([
      italyTrip,
      makeTrip('france-2026', 'France', '2026-05-01', '2026-05-12', 'past', 'FR')
    ]);

    expect(result).toEqual({
      ok: true,
      trips: [expect.objectContaining({ id: 'france-2026' }), expect.objectContaining({ id: 'italy-2026' })]
    });
  });

  test('rejects unsupported countries, duplicate ids, too many trips, and oversized data', () => {
    expect(parseAccountTrips([{ ...italyTrip, entryCountryCode: 'Spain' }])).toMatchObject({ ok: false });
    expect(parseAccountTrips([italyTrip, { ...italyTrip, label: 'Duplicate' }])).toMatchObject({ ok: false });
    expect(
      parseAccountTrips(
        Array.from({ length: MAX_TRIP_COUNT + 1 }, (_, index) => ({ ...italyTrip, id: `trip-${index}` }))
      )
    ).toMatchObject({ ok: false });
    expect(parseAccountTrips([{ ...italyTrip, label: 'x'.repeat(MAX_ACCOUNT_SYNC_BODY_BYTES) }])).toMatchObject({ ok: false });
  });
});

describe('authenticated account trip API', () => {
  test('returns 401 before touching D1 for anonymous GET, PUT, and DELETE requests', async () => {
    const db = new MemoryAccountDatabase();
    const handlers = createAccountTripHandlers(anonymous);
    const deleteAccount = createAccountDeletionHandler(anonymous);

    const getResponse = await handlers.GET(accountEvent('GET', db) as Parameters<typeof handlers.GET>[0]);
    const putResponse = await handlers.PUT(
      accountEvent('PUT', db, syncBody([italyTrip], 0)) as Parameters<typeof handlers.PUT>[0]
    );
    const deleteResponse = await deleteAccount(accountEvent('DELETE', db) as Parameters<typeof deleteAccount>[0]);

    expect([getResponse.status, putResponse.status, deleteResponse.status]).toEqual([401, 401, 401]);
    for (const response of [getResponse, putResponse, deleteResponse]) {
      expectPrivateAccountHeaders(response);
    }
    expect(db.prepared).toHaveLength(0);
  });

  test('GET returns a non-persisted empty revision-zero snapshot for a new account', async () => {
    const db = new MemoryAccountDatabase();
    const { GET } = createAccountTripHandlers(authenticated);

    const response = await GET(accountEvent('GET', db) as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ trips: [], revision: 0, updatedAt: null, consentVersion: null });
    expect(db.snapshots.size).toBe(0);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('marks success and every account error class uncacheable, including for legacy service workers', async () => {
    const successDb = new MemoryAccountDatabase();
    const authenticatedHandlers = createAccountTripHandlers(authenticated);
    const anonymousHandlers = createAccountTripHandlers(anonymous);

    const success = await authenticatedHandlers.GET(
      accountEvent('GET', successDb) as Parameters<typeof authenticatedHandlers.GET>[0]
    );
    const invalid = await authenticatedHandlers.PUT(
      accountEvent('PUT', successDb, { ...syncBody([], 0), owner: 'client-selected' }) as Parameters<
        typeof authenticatedHandlers.PUT
      >[0]
    );
    const unauthorized = await anonymousHandlers.GET(
      accountEvent('GET', successDb) as Parameters<typeof anonymousHandlers.GET>[0]
    );
    const unavailable = await authenticatedHandlers.GET({
      request: new Request('https://schngn.com/api/account/trips'),
      platform: { env: {} }
    } as Parameters<typeof authenticatedHandlers.GET>[0]);

    const conflictDb = new MemoryAccountDatabase();
    conflictDb.snapshots.set('user_verified_alice', {
      revision: 2,
      tripsJson: JSON.stringify([italyTrip]),
      updatedAt: '2026-07-09T10:02:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    const conflict = await authenticatedHandlers.PUT(
      accountEvent('PUT', conflictDb, syncBody([], 1)) as Parameters<typeof authenticatedHandlers.PUT>[0]
    );

    const goneDb = new MemoryAccountDatabase();
    await tombstoneDeletedAccountData(goneDb, 'user_verified_alice');
    const gone = await authenticatedHandlers.GET(
      accountEvent('GET', goneDb) as Parameters<typeof authenticatedHandlers.GET>[0]
    );

    expect([success.status, invalid.status, unauthorized.status, unavailable.status, conflict.status, gone.status])
      .toEqual([200, 400, 401, 503, 409, 410]);
    for (const response of [success, invalid, unauthorized, unavailable, conflict, gone]) {
      expectPrivateAccountHeaders(response);
    }
  });

  test('GET validates and returns only the authenticated account snapshot', async () => {
    const db = new MemoryAccountDatabase();
    db.snapshots.set('user_verified_alice', {
      revision: 4,
      tripsJson: JSON.stringify([italyTrip]),
      updatedAt: '2026-07-09T10:03:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    db.snapshots.set('user_other', {
      revision: 8,
      tripsJson: '[]',
      updatedAt: '2026-07-09T10:04:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    const { GET } = createAccountTripHandlers(authenticated);

    const response = await GET(accountEvent('GET', db) as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      trips: [italyTrip],
      revision: 4,
      updatedAt: '2026-07-09T10:03:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    expect(db.prepared[0]?.params[0]).toBe('user_verified_alice');
    expect(db.prepared[0]?.params[1]).toMatch(/^[0-9a-f]{64}$/);
  });

  test('PUT creates and updates the authenticated owner snapshot with compare-and-swap revisions', async () => {
    const db = new MemoryAccountDatabase();
    const { PUT } = createAccountTripHandlers(authenticated);

    const created = await PUT(
      accountEvent('PUT', db, syncBody([italyTrip], 0)) as Parameters<typeof PUT>[0]
    );
    expect(created.status).toBe(200);
    expect(await created.json()).toEqual({
      trips: [italyTrip],
      revision: 1,
      updatedAt: '2026-07-09T10:00:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });

    const updatedTrip = { ...italyTrip, stays: [{ entryDate: '2026-09-15', exitDate: '2026-10-14' }] };
    const updated = await PUT(
      accountEvent('PUT', db, syncBody([updatedTrip], 1)) as Parameters<typeof PUT>[0]
    );
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({
      trips: [updatedTrip],
      revision: 2,
      updatedAt: '2026-07-09T10:01:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });

    expect([...db.snapshots.keys()]).toEqual(['user_verified_alice']);
    expect(db.prepared.flatMap(({ params }) => params).join(' ')).not.toContain('session_1');
  });

  test('PUT returns the current server snapshot on a revision conflict without overwriting it', async () => {
    const db = new MemoryAccountDatabase();
    db.snapshots.set('user_verified_alice', {
      revision: 3,
      tripsJson: JSON.stringify([italyTrip]),
      updatedAt: '2026-07-09T10:02:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    const { PUT } = createAccountTripHandlers(authenticated);

    const response = await PUT(
      accountEvent('PUT', db, syncBody([{ ...italyTrip, label: 'Stale client edit' }], 2)) as Parameters<typeof PUT>[0]
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'revision_conflict',
      snapshot: {
        trips: [italyTrip],
        revision: 3,
        updatedAt: '2026-07-09T10:02:00.000Z',
        consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
      }
    });
    expect(JSON.parse(db.snapshots.get('user_verified_alice')?.tripsJson ?? '[]')).toEqual([italyTrip]);
  });

  test('rejects a body-supplied user id and malformed trips before accessing D1', async () => {
    const db = new MemoryAccountDatabase();
    const { PUT } = createAccountTripHandlers(authenticated);

    const userIdResponse = await PUT(
      accountEvent('PUT', db, {
        ...syncBody([italyTrip], 0),
        userId: 'user_attacker_selected'
      }) as Parameters<typeof PUT>[0]
    );
    expect(userIdResponse.status).toBe(400);

    const invalidTripResponse = await PUT(
      accountEvent('PUT', db, syncBody([{ ...italyTrip, entryCountryCode: 'Spain' }], 0)) as Parameters<typeof PUT>[0]
    );
    expect(invalidTripResponse.status).toBe(400);
    expect(db.prepared).toHaveLength(0);
  });

  test('requires explicit versioned cloud-storage consent on every PUT', async () => {
    const db = new MemoryAccountDatabase();
    const { PUT } = createAccountTripHandlers(authenticated);

    const missing = await PUT(
      accountEvent('PUT', db, { expectedRevision: 0, trips: [italyTrip] }) as Parameters<typeof PUT>[0]
    );
    const refused = await PUT(
      accountEvent('PUT', db, {
        ...syncBody([italyTrip], 0),
        consent: false
      }) as Parameters<typeof PUT>[0]
    );
    const staleCopy = await PUT(
      accountEvent('PUT', db, {
        ...syncBody([italyTrip], 0),
        consentVersion: 'account-sync-v0'
      }) as Parameters<typeof PUT>[0]
    );

    expect([missing.status, refused.status, staleCopy.status]).toEqual([400, 400, 400]);
    expect(db.prepared).toHaveLength(0);
  });

  test('enforces JSON content type, body-size limits, and non-negative integer revisions', async () => {
    const db = new MemoryAccountDatabase();
    const { PUT } = createAccountTripHandlers(authenticated);

    const wrongType = await PUT(
      accountEvent(
        'PUT',
        db,
        undefined,
        { rawBody: JSON.stringify(syncBody([], 0)), contentType: 'text/plain' }
      ) as Parameters<typeof PUT>[0]
    );
    expect(wrongType.status).toBe(415);
    expectPrivateAccountHeaders(wrongType);

    const tooLarge = await PUT(
      accountEvent('PUT', db, undefined, {
        rawBody: JSON.stringify({ ...syncBody([], 0), padding: 'x'.repeat(MAX_ACCOUNT_SYNC_BODY_BYTES) })
      }) as Parameters<typeof PUT>[0]
    );
    expect(tooLarge.status).toBe(413);
    expectPrivateAccountHeaders(tooLarge);

    const brokenBody = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error('aborted body');
      }
    });
    const unreadable = await PUT({
      request: new Request('https://schngn.com/api/account/trips', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: brokenBody,
        duplex: 'half'
      } as RequestInit & { duplex: 'half' }),
      platform: { env: { DB: db } }
    } as Parameters<typeof PUT>[0]);
    expect(unreadable.status).toBe(400);
    expect(await unreadable.json()).toEqual({ error: 'Account sync request body could not be read' });
    expectPrivateAccountHeaders(unreadable);

    const badRevision = await PUT(
      accountEvent('PUT', db, syncBody([], -1)) as Parameters<typeof PUT>[0]
    );
    expect(badRevision.status).toBe(400);
    expect(db.prepared).toHaveLength(0);
  });

  test('DELETE removes only the authenticated account data and is idempotent', async () => {
    const db = new MemoryAccountDatabase();
    db.snapshots.set('user_verified_alice', {
      revision: 1,
      tripsJson: JSON.stringify([italyTrip]),
      updatedAt: '2026-07-09T10:00:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    db.snapshots.set('user_other', {
      revision: 1,
      tripsJson: '[]',
      updatedAt: '2026-07-09T10:00:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    const DELETE = createAccountDeletionHandler(authenticated);

    const first = await DELETE(accountEvent('DELETE', db) as Parameters<typeof DELETE>[0]);
    const second = await DELETE(accountEvent('DELETE', db) as Parameters<typeof DELETE>[0]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expectPrivateAccountHeaders(first);
    expectPrivateAccountHeaders(second);
    expect(await first.json()).toEqual({ ok: true });
    expect([...db.snapshots.keys()]).toEqual(['user_other']);
    expect(db.tombstones.size).toBe(0);

    const { PUT } = createAccountTripHandlers(authenticated);
    const recreated = await PUT(
      accountEvent('PUT', db, syncBody([italyTrip], 0)) as Parameters<typeof PUT>[0]
    );
    expect(recreated.status).toBe(200);
    expect(db.snapshots.has('user_verified_alice')).toBe(true);
  });

  test('rejects malformed D1 run results instead of treating deletion as successful', async () => {
    for (const malformedResult of [undefined, null, {}, { success: false }, { success: 'true' }]) {
      for (const failurePosition of ['purge', 'snapshot_delete'] as const) {
        const db = new MemoryAccountDatabase();
        if (failurePosition === 'snapshot_delete') db.runResultOverrides.push({ success: true });
        db.runResultOverrides.push(malformedResult);
        const DELETE = createAccountDeletionHandler(authenticated);

        const response = await DELETE(accountEvent('DELETE', db) as Parameters<typeof DELETE>[0]);

        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ error: 'account_storage_unavailable' });
      }
    }
  });

  test('Clerk lifecycle deletion tombstones first, deletes the snapshot, and remains idempotent', async () => {
    const db = new MemoryAccountDatabase();
    db.snapshots.set('user_verified_alice', {
      revision: 7,
      tripsJson: JSON.stringify([italyTrip]),
      updatedAt: '2026-07-09T10:07:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });

    await tombstoneDeletedAccountData(db, 'user_verified_alice');
    const [tombstoneHash, firstExpiry] = [...db.tombstones.entries()][0] ?? [];
    await tombstoneDeletedAccountData(db, 'user_verified_alice');

    expect(db.tombstones.size).toBe(1);
    expect(tombstoneHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tombstoneHash).not.toContain('user_verified_alice');
    expect(db.tombstones.get(String(tombstoneHash))).toBe(firstExpiry);
    expect(Date.parse(String(firstExpiry)) - Date.now()).toBeGreaterThan(29 * 86_400_000);
    expect(Date.parse(String(firstExpiry)) - Date.now()).toBeLessThanOrEqual(
      ACCOUNT_DELETION_TOMBSTONE_RETENTION_DAYS * 86_400_000
    );
    expect(db.snapshots.has('user_verified_alice')).toBe(false);
    const lifecycleStatements = db.prepared
      .map(({ sql }) => sql.replace(/\s+/g, ' ').trim().toLowerCase())
      .filter((sql) =>
        sql.startsWith('insert into account_deletion_tombstones') ||
        sql.startsWith('delete from account_trip_snapshots')
      );
    expect(lifecycleStatements).toEqual([
      expect.stringContaining('insert into account_deletion_tombstones'),
      expect.stringContaining('delete from account_trip_snapshots'),
      expect.stringContaining('insert into account_deletion_tombstones'),
      expect.stringContaining('delete from account_trip_snapshots')
    ]);

    const { GET, PUT } = createAccountTripHandlers(authenticated);
    const getResponse = await GET(accountEvent('GET', db) as Parameters<typeof GET>[0]);
    const putResponse = await PUT(
      accountEvent('PUT', db, syncBody([italyTrip], 0)) as Parameters<typeof PUT>[0]
    );
    expect(getResponse.status).toBe(410);
    expect(putResponse.status).toBe(410);
    expect(await getResponse.json()).toEqual({ error: 'account_not_available' });
    expect(await putResponse.json()).toEqual({ error: 'account_not_available' });
    expect(db.snapshots.has('user_verified_alice')).toBe(false);
  });

  test('a PUT whose authentication began before deletion cannot recreate the account snapshot', async () => {
    const db = new MemoryAccountDatabase();
    db.snapshots.set('user_verified_alice', {
      revision: 1,
      tripsJson: JSON.stringify([italyTrip]),
      updatedAt: '2026-07-09T10:00:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });

    let markAuthenticationStarted!: () => void;
    let releaseAuthentication!: () => void;
    const authenticationStarted = new Promise<void>((resolve) => {
      markAuthenticationStarted = resolve;
    });
    const continueAuthentication = new Promise<void>((resolve) => {
      releaseAuthentication = resolve;
    });
    const racingAuthentication = async () => {
      markAuthenticationStarted();
      await continueAuthentication;
      return authenticated();
    };
    const { PUT } = createAccountTripHandlers(racingAuthentication);

    const pendingPut = PUT(
      accountEvent('PUT', db, syncBody([{ ...italyTrip, label: 'Late write' }], 1)) as Parameters<
        typeof PUT
      >[0]
    );
    await authenticationStarted;
    await tombstoneDeletedAccountData(db, 'user_verified_alice');
    releaseAuthentication();
    const response = await pendingPut;

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: 'account_not_available' });
    expect(db.tombstones.size).toBe(1);
    expect(db.snapshots.has('user_verified_alice')).toBe(false);
  });

  test('expired 30-day replay guards are ignored and opportunistically purged', async () => {
    const db = new MemoryAccountDatabase();
    await tombstoneDeletedAccountData(db, 'user_verified_alice');
    const tombstoneHash = db.tombstones.keys().next().value;
    expect(typeof tombstoneHash).toBe('string');
    db.tombstones.set(String(tombstoneHash), '2000-01-01T00:00:00.000Z');

    const { GET, PUT } = createAccountTripHandlers(authenticated);
    const getResponse = await GET(accountEvent('GET', db) as Parameters<typeof GET>[0]);
    const putResponse = await PUT(
      accountEvent('PUT', db, syncBody([italyTrip], 0)) as Parameters<typeof PUT>[0]
    );

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual({
      trips: [],
      revision: 0,
      updatedAt: null,
      consentVersion: null
    });
    expect(putResponse.status).toBe(200);
    expect(db.tombstones.size).toBe(0);
    expect(db.snapshots.has('user_verified_alice')).toBe(true);
  });

  test('rejects malformed transactional deletion results', async () => {
    const malformedResults: unknown[] = [
      undefined,
      null,
      [],
      [{ success: true }],
      [{ success: true }, {}],
      [{ success: true }, { success: false }],
      [{ success: true }, { success: true }, {}],
      [{ success: true }, { success: true }, { success: false }]
    ];

    for (const malformedResult of malformedResults) {
      const db = new MemoryAccountDatabase();
      db.batchResultOverride = malformedResult;
      let rejected = false;
      try {
        await tombstoneDeletedAccountData(db, 'user_verified_alice');
      } catch {
        rejected = true;
      }
      expect(rejected).toBe(true);
    }
  });

  test('fails closed when D1 is missing or returns a corrupt stored snapshot', async () => {
    const handlers = createAccountTripHandlers(authenticated);
    const missingDbResponse = await handlers.GET({
      request: new Request('https://schngn.com/api/account/trips'),
      platform: { env: {} }
    } as Parameters<typeof handlers.GET>[0]);
    expect(missingDbResponse.status).toBe(503);

    const db = new MemoryAccountDatabase();
    db.snapshots.set('user_verified_alice', {
      revision: 1,
      tripsJson: JSON.stringify([{ ...italyTrip, entryCountryCode: 'not-supported' }]),
      updatedAt: '2026-07-09T10:00:00.000Z',
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    });
    const corruptResponse = await handlers.GET(
      accountEvent('GET', db) as Parameters<typeof handlers.GET>[0]
    );
    expect(corruptResponse.status).toBe(503);
    expect(await corruptResponse.json()).toEqual({ error: 'account_storage_unavailable' });
  });

  test('ships an explicit no-compatibility D1 account snapshot reset for schema two', () => {
    const migration = readFileSync('apps/web/migrations/0004_reset_account_trip_snapshots_v2.sql', 'utf8');

    expect(migration).toContain('drop table if exists account_trip_snapshots');
    expect(migration).toContain('create table account_trip_snapshots');
    expect(migration).toContain('clerk_user_id text primary key');
    expect(migration).toContain('revision integer not null');
    expect(migration).toContain('trips_json text not null');
    expect(migration).toContain('consent_version text not null');
    expect(migration).toContain('consented_at text not null');
    expect(migration).toContain(ACCOUNT_SYNC_CONSENT_VERSION);
    expect(migration).toContain(`schema_version integer not null default ${ACCOUNT_TRIP_SNAPSHOT_SCHEMA_VERSION}`);
    expect(migration).not.toContain('waitlist_signups');
    expect(migration).not.toContain('email');
  });

  test('ships account deletion tombstones as a new append-only migration', () => {
    const snapshotMigration = readFileSync(
      'apps/web/migrations/0002_create_account_trip_snapshots.sql',
      'utf8'
    );
    const tombstoneMigration = readFileSync(
      'apps/web/migrations/0003_create_account_deletion_tombstones.sql',
      'utf8'
    );

    expect(snapshotMigration).not.toContain('account_deletion_tombstones');
    expect(tombstoneMigration).toContain('create table if not exists account_deletion_tombstones');
    expect(tombstoneMigration).toContain('clerk_user_id_hash text primary key');
    expect(tombstoneMigration).toContain('length(clerk_user_id_hash) = 64');
    expect(tombstoneMigration).toContain('deleted_at text not null');
    expect(tombstoneMigration).toContain('expires_at text not null');
    expect(tombstoneMigration).toContain(`+${ACCOUNT_DELETION_TOMBSTONE_RETENTION_DAYS} days`);
    expect(tombstoneMigration).toContain('one-way account-id digest');
    expect(tombstoneMigration).not.toContain('trips_json');
    expect(tombstoneMigration).not.toContain('email');
    expect(tombstoneMigration).not.toContain('clerk_user_id text');
  });
});
