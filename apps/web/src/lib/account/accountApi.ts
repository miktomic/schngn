import { json, type RequestHandler } from '@sveltejs/kit';
import {
  AccountDeletedError,
  deleteAccountData,
  getAccountTripSnapshot,
  putAccountTripSnapshot,
  type AccountD1Database
} from './accountRepository';
import {
  MAX_ACCOUNT_SYNC_BODY_BYTES,
  ACCOUNT_SYNC_CONSENT_VERSION,
  parseAccountTrips
} from './accountTripSnapshot';
import type { ClerkAuthEnvironment } from '../auth/authenticateRequest';
import type { EditableTrip } from '../trips/tripCrud';

const NO_STORE_HEADERS = { 'cache-control': 'no-store', vary: '*' };
const ALLOWED_PUT_KEYS = new Set(['expectedRevision', 'trips', 'consent', 'consentVersion']);

export type AccountAuthenticationResult =
  | { ok: true; userId: string; sessionId: string | null }
  | { ok: false; status: 401 | 503; error: string };

export type AccountAuthenticateRequest = (
  request: Request,
  env?: ClerkAuthEnvironment
) => Promise<AccountAuthenticationResult>;

interface AccountSyncPayload {
  expectedRevision: number;
  trips: EditableTrip[];
  consent: true;
  consentVersion: typeof ACCOUNT_SYNC_CONSENT_VERSION;
}

export function createAccountTripHandlers(authenticateRequest: AccountAuthenticateRequest): {
  GET: RequestHandler;
  PUT: RequestHandler;
} {
  const GET: RequestHandler = async ({ request, platform }) => {
    const auth = await authenticateRequest(request, platform?.env as ClerkAuthEnvironment | undefined);
    if (auth.ok === false) return authenticationError(auth);

    const db = readDatabase(platform?.env.DB);
    if (!db) return serviceUnavailable();

    try {
      const snapshot = await getAccountTripSnapshot(db, auth.userId);
      return json(snapshot, { headers: NO_STORE_HEADERS });
    } catch (error) {
      if (error instanceof AccountDeletedError) return accountGone();
      return serviceUnavailable();
    }
  };

  const PUT: RequestHandler = async ({ request, platform }) => {
    const auth = await authenticateRequest(request, platform?.env as ClerkAuthEnvironment | undefined);
    if (auth.ok === false) return authenticationError(auth);

    const bodyResult = await readPutPayload(request);
    if (bodyResult.ok === false) {
      return json({ error: bodyResult.error }, { status: bodyResult.status, headers: NO_STORE_HEADERS });
    }

    const db = readDatabase(platform?.env.DB);
    if (!db) return serviceUnavailable();

    try {
      const result = await putAccountTripSnapshot(
        db,
        auth.userId,
        bodyResult.payload.expectedRevision,
        bodyResult.payload.trips
      );
      if (result.ok === false) {
        if ('deleted' in result) return accountGone();
        return json(
          { error: 'revision_conflict', snapshot: result.conflict },
          { status: 409, headers: NO_STORE_HEADERS }
        );
      }
      return json(result.snapshot, { headers: NO_STORE_HEADERS });
    } catch {
      return serviceUnavailable();
    }
  };

  return { GET, PUT };
}

export function createAccountDeletionHandler(
  authenticateRequest: AccountAuthenticateRequest
): RequestHandler {
  return async ({ request, platform }) => {
    const auth = await authenticateRequest(request, platform?.env as ClerkAuthEnvironment | undefined);
    if (auth.ok === false) return authenticationError(auth);

    const db = readDatabase(platform?.env.DB);
    if (!db) return serviceUnavailable();

    try {
      await deleteAccountData(db, auth.userId);
      return json({ ok: true }, { headers: NO_STORE_HEADERS });
    } catch {
      return serviceUnavailable();
    }
  };
}

async function readPutPayload(
  request: Request
): Promise<
  | { ok: true; payload: AccountSyncPayload }
  | { ok: false; status: 400 | 413 | 415; error: string }
> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') {
    return { ok: false, status: 415, error: 'Content-Type must be application/json' };
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_ACCOUNT_SYNC_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Account sync payload is too large' };
  }

  let bytes: Uint8Array | null;
  try {
    bytes = await readLimitedRequestBody(request, MAX_ACCOUNT_SYNC_BODY_BYTES);
  } catch {
    return { ok: false, status: 400, error: 'Account sync request body could not be read' };
  }
  if (bytes === null) {
    return { ok: false, status: 413, error: 'Account sync payload is too large' };
  }

  let body: unknown;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    body = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON payload' };
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, error: 'Invalid account sync payload' };
  }
  const candidate = body as Record<string, unknown>;
  if (Object.keys(candidate).some((key) => !ALLOWED_PUT_KEYS.has(key))) {
    return { ok: false, status: 400, error: 'Unknown account sync fields are not allowed' };
  }
  if (!Number.isSafeInteger(candidate.expectedRevision) || Number(candidate.expectedRevision) < 0) {
    return { ok: false, status: 400, error: 'Expected revision must be a non-negative integer' };
  }
  if (candidate.consent !== true || candidate.consentVersion !== ACCOUNT_SYNC_CONSENT_VERSION) {
    return { ok: false, status: 400, error: 'Versioned cloud-storage consent is required' };
  }

  const parsedTrips = parseAccountTrips(candidate.trips);
  if (parsedTrips.ok === false) {
    return { ok: false, status: 400, error: 'Trip snapshot is invalid' };
  }

  return {
    ok: true,
    payload: {
      expectedRevision: Number(candidate.expectedRevision),
      trips: parsedTrips.trips,
      consent: true,
      consentVersion: ACCOUNT_SYNC_CONSENT_VERSION
    }
  };
}

async function readLimitedRequestBody(request: Request, limit: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > limit) {
        await reader.cancel('Account sync payload is too large');
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function readDatabase(value: unknown): AccountD1Database | null {
  if (!value || typeof value !== 'object' || !('prepare' in value) || typeof value.prepare !== 'function') {
    return null;
  }
  return value as AccountD1Database;
}

function authenticationError(auth: Extract<AccountAuthenticationResult, { ok: false }>): Response {
  const error = auth.status === 401 ? 'authentication_required' : 'authentication_unavailable';
  return json({ error }, { status: auth.status, headers: NO_STORE_HEADERS });
}

function serviceUnavailable(): Response {
  return json(
    { error: 'account_storage_unavailable' },
    { status: 503, headers: NO_STORE_HEADERS }
  );
}

function accountGone(): Response {
  return json(
    { error: 'account_not_available' },
    { status: 410, headers: NO_STORE_HEADERS }
  );
}
