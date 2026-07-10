import { describe, expect, test } from 'bun:test';
import type { EditableTrip } from '../src/lib/trips/tripCrud';
import {
  deleteAccountData,
  getAccountTrips,
  putAccountTrips,
  type AccountFetch
} from '../src/lib/account/accountClient';

const trip: EditableTrip = {
  id: 'trip-client',
  label: 'Account trip',
  countryCode: 'IT',
  entryDate: '2026-08-01',
  exitDate: '2026-08-03',
  status: 'booked'
};
const sessionToken = 'test-session-token';

describe('browser account API client', () => {
  test('loads and validates an authenticated account snapshot', async () => {
    const fetcher: AccountFetch = async () =>
      Response.json({ trips: [trip], revision: 2, updatedAt: '2026-07-09T12:00:00.000Z', consentVersion: 'account-sync-v1' });

    expect(await getAccountTrips(sessionToken, fetcher)).toEqual({
      ok: true,
      snapshot: { trips: [trip], revision: 2, updatedAt: '2026-07-09T12:00:00.000Z', consentVersion: 'account-sync-v1' }
    });
  });

  test('rejects malformed server data instead of applying it locally', async () => {
    const fetcher: AccountFetch = async () =>
      Response.json({ trips: [{ ...trip, entryDate: '2026-99-99' }], revision: 2, updatedAt: '2026-07-09T12:00:00.000Z', consentVersion: 'account-sync-v1' });

    expect(await getAccountTrips(sessionToken, fetcher)).toEqual({ ok: false, code: 'invalid_response' });
  });

  test('saves only trips and expected revision without a client-selected owner', async () => {
    let requestBody = '';
    let requestInit: RequestInit | undefined;
    const fetcher: AccountFetch = async (_input, init) => {
      requestBody = String(init?.body ?? '');
      requestInit = init;
      return Response.json({ trips: [trip], revision: 3, updatedAt: '2026-07-09T12:01:00.000Z', consentVersion: 'account-sync-v1' });
    };

    const result = await putAccountTrips(sessionToken, [trip], 2, fetcher);

    expect(result).toEqual({
      ok: true,
      snapshot: { trips: [trip], revision: 3, updatedAt: '2026-07-09T12:01:00.000Z', consentVersion: 'account-sync-v1' }
    });
    expect(JSON.parse(requestBody)).toEqual({
      trips: [trip],
      expectedRevision: 2,
      consent: true,
      consentVersion: 'account-sync-v1'
    });
    expect(requestBody).not.toContain('userId');
    expect(requestBody).not.toContain('email');
    expect(requestInit?.credentials).toBe('omit');
    expect(requestInit?.cache).toBe('no-store');
    expect(requestInit?.redirect).toBe('error');
    expect((requestInit?.headers as Record<string, string>).authorization).toBe(`Bearer ${sessionToken}`);
  });

  test('returns the current snapshot on a revision conflict', async () => {
    const fetcher: AccountFetch = async () =>
      Response.json(
        {
          error: 'revision_conflict',
          snapshot: { trips: [trip], revision: 4, updatedAt: '2026-07-09T12:02:00.000Z', consentVersion: 'account-sync-v1' }
        },
        { status: 409 }
      );

    expect(await putAccountTrips(sessionToken, [trip], 2, fetcher)).toEqual({
      ok: false,
      code: 'conflict',
      snapshot: { trips: [trip], revision: 4, updatedAt: '2026-07-09T12:02:00.000Z', consentVersion: 'account-sync-v1' }
    });
  });

  test('distinguishes authentication and service failures', async () => {
    const unauthorized: AccountFetch = async () => Response.json({ error: 'authentication_required' }, { status: 401 });
    const unavailable: AccountFetch = async () => Response.json({ error: 'account_storage_unavailable' }, { status: 503 });

    expect(await getAccountTrips(sessionToken, unauthorized)).toEqual({ ok: false, code: 'unauthorized' });
    expect(await getAccountTrips(sessionToken, unavailable)).toEqual({ ok: false, code: 'unavailable' });
  });

  test('deletes account application data through the authenticated endpoint', async () => {
    let request: {
      input: string;
      method?: string;
      authorization?: string;
      credentials?: RequestCredentials;
      cache?: RequestCache;
      redirect?: RequestRedirect;
    } | null = null;
    const fetcher: AccountFetch = async (input, init) => {
      request = {
        input: String(input),
        method: init?.method,
        authorization: (init?.headers as Record<string, string>).authorization,
        credentials: init?.credentials,
        cache: init?.cache,
        redirect: init?.redirect
      };
      return Response.json({ ok: true });
    };

    expect(await deleteAccountData(sessionToken, fetcher)).toEqual({ ok: true });
    expect(request).toEqual({
      input: '/api/account',
      method: 'DELETE',
      authorization: `Bearer ${sessionToken}`,
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error'
    });
  });
});
