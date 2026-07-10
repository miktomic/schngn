import {
  ACCOUNT_SYNC_CONSENT_VERSION,
  parseAccountTrips,
  type AccountTripSnapshot
} from './accountTripSnapshot';
import type { EditableTrip } from '../trips/tripCrud';

export type AccountFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type AccountClientFailureCode = 'unauthorized' | 'unavailable' | 'invalid_response' | 'conflict';

export type AccountSnapshotResult =
  | { ok: true; snapshot: AccountTripSnapshot }
  | { ok: false; code: Exclude<AccountClientFailureCode, 'conflict'> };

export type AccountSaveResult =
  | { ok: true; snapshot: AccountTripSnapshot }
  | { ok: false; code: 'conflict'; snapshot: AccountTripSnapshot }
  | { ok: false; code: Exclude<AccountClientFailureCode, 'conflict'> };

export type AccountDeleteResult =
  | { ok: true }
  | { ok: false; code: Exclude<AccountClientFailureCode, 'conflict' | 'invalid_response'> };

export async function getAccountTrips(sessionToken: string, fetcher: AccountFetch = fetch): Promise<AccountSnapshotResult> {
  let response: Response;
  try {
    response = await fetcher('/api/account/trips', {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      headers: authenticatedHeaders(sessionToken)
    });
  } catch {
    return { ok: false, code: 'unavailable' };
  }

  if (!response.ok) return requestFailure(response.status);
  return parseSnapshotResponse(response);
}

export async function putAccountTrips(
  sessionToken: string,
  trips: EditableTrip[],
  expectedRevision: number,
  fetcher: AccountFetch = fetch
): Promise<AccountSaveResult> {
  let response: Response;
  try {
    response = await fetcher('/api/account/trips', {
      method: 'PUT',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      headers: authenticatedHeaders(sessionToken, { 'content-type': 'application/json' }),
      body: JSON.stringify({
        trips,
        expectedRevision,
        consent: true,
        consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
      })
    });
  } catch {
    return { ok: false, code: 'unavailable' };
  }

  if (response.status === 409) {
    const body = await readJson(response);
    if (!body || typeof body !== 'object' || !('snapshot' in body)) {
      return { ok: false, code: 'invalid_response' };
    }
    const snapshot = parseSnapshot((body as { snapshot: unknown }).snapshot);
    return snapshot ? { ok: false, code: 'conflict', snapshot } : { ok: false, code: 'invalid_response' };
  }
  if (!response.ok) return requestFailure(response.status);
  return parseSnapshotResponse(response);
}

export async function deleteAccountData(sessionToken: string, fetcher: AccountFetch = fetch): Promise<AccountDeleteResult> {
  let response: Response;
  try {
    response = await fetcher('/api/account', {
      method: 'DELETE',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      headers: authenticatedHeaders(sessionToken)
    });
  } catch {
    return { ok: false, code: 'unavailable' };
  }

  if (response.status === 401) return { ok: false, code: 'unauthorized' };
  if (!response.ok) return { ok: false, code: 'unavailable' };
  return { ok: true };
}

async function parseSnapshotResponse(response: Response): Promise<AccountSnapshotResult> {
  const snapshot = parseSnapshot(await readJson(response));
  return snapshot ? { ok: true, snapshot } : { ok: false, code: 'invalid_response' };
}

function parseSnapshot(value: unknown): AccountTripSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<AccountTripSnapshot>;
  if (!Number.isSafeInteger(candidate.revision) || Number(candidate.revision) < 0) return null;
  if (
    candidate.consentVersion !== null &&
    candidate.consentVersion !== ACCOUNT_SYNC_CONSENT_VERSION
  ) return null;
  if (candidate.updatedAt !== null && (typeof candidate.updatedAt !== 'string' || !isIsoTimestamp(candidate.updatedAt))) return null;
  if (Number(candidate.revision) === 0 && (candidate.updatedAt !== null || candidate.consentVersion !== null)) return null;
  if (Number(candidate.revision) > 0 && (candidate.updatedAt === null || candidate.consentVersion !== ACCOUNT_SYNC_CONSENT_VERSION)) return null;
  const parsedTrips = parseAccountTrips(candidate.trips);
  if (parsedTrips.ok === false) return null;
  return {
    trips: parsedTrips.trips,
    revision: Number(candidate.revision),
    updatedAt: candidate.updatedAt ?? null,
    consentVersion: candidate.consentVersion ?? null
  };
}

function requestFailure(status: number): { ok: false; code: 'unauthorized' | 'unavailable' } {
  return status === 401 ? { ok: false, code: 'unauthorized' } : { ok: false, code: 'unavailable' };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function isIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function authenticatedHeaders(sessionToken: string, additional: Record<string, string> = {}): Record<string, string> {
  return {
    accept: 'application/json',
    authorization: `Bearer ${sessionToken}`,
    ...additional
  };
}
