import { error, json, type RequestHandler } from '@sveltejs/kit';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_BODY_BYTES = 4096;
const CONSENT_VERSION = 'v1';
const ALLOWED_KEYS = new Set(['email', 'consent', 'source', 'priceBucket']);
const ALLOWED_SOURCES = new Set(['waitlist', 'pdf_export', 'unlock_planner', 'landing', 'production_smoke']);
const ALLOWED_PRICE_BUCKETS = new Set(['eur_5', 'eur_9', 'eur_19', 'gbp_5', 'gbp_9', 'gbp_19']);
const NO_STORE_HEADERS = { 'cache-control': 'no-store' };

interface WaitlistPayload {
  email: string;
  consent: boolean;
  source: string;
  priceBucket?: string;
}

function parsePayload(body: unknown): WaitlistPayload {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw error(400, 'Invalid waitlist payload');
  }
  const payload = body as Record<string, unknown>;
  if (Object.keys(payload).some((key) => !ALLOWED_KEYS.has(key))) {
    throw error(400, 'Unknown waitlist fields are not allowed');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const consent = payload.consent === true;
  const source = typeof payload.source === 'string' ? payload.source.trim() : '';
  const priceBucket = typeof payload.priceBucket === 'string' ? payload.priceBucket.trim() : undefined;

  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw error(400, 'Invalid email');
  }
  if (!consent) {
    throw error(400, 'Consent is required');
  }
  if (!ALLOWED_SOURCES.has(source)) {
    throw error(400, 'Invalid waitlist source');
  }
  if (priceBucket !== undefined && !ALLOWED_PRICE_BUCKETS.has(priceBucket)) {
    throw error(400, 'Invalid price bucket');
  }

  return { email, consent, source, priceBucket };
}

async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') {
    throw error(415, 'Content-Type must be application/json');
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_BODY_BYTES) {
    throw error(413, 'Waitlist payload is too large');
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw error(413, 'Waitlist payload is too large');
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch {
    throw error(400, 'Invalid JSON payload');
  }
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const body = await readJsonBody(request);
  const payload = parsePayload(body);
  const db = platform?.env.DB;

  if (!db) {
    return json({ ok: true, stored: false, reason: 'DB binding is not configured yet' }, { status: 202, headers: NO_STORE_HEADERS });
  }

  try {
    const result = await db
      .prepare(
        `insert into waitlist_signups (email, consent, consent_version, source, price_bucket)
         values (?1, ?2, ?3, ?4, ?5)
         on conflict(email) do update set
           consent = excluded.consent,
           consent_version = excluded.consent_version,
           source = excluded.source,
           price_bucket = excluded.price_bucket`
      )
      .bind(payload.email, payload.consent ? 1 : 0, CONSENT_VERSION, payload.source, payload.priceBucket ?? null)
      .run();

    if (typeof result === 'object' && result !== null && 'success' in result && result.success === false) {
      throw new Error('D1 write was not successful');
    }
  } catch {
    throw error(503, 'Waitlist storage is temporarily unavailable');
  }

  return json({ ok: true, stored: true }, { headers: NO_STORE_HEADERS });
};
