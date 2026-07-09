import { error, json, type RequestHandler } from '@sveltejs/kit';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const CONSENT_VERSION = 'v1';
const ALLOWED_SOURCES = new Set(['waitlist', 'pdf_export', 'unlock_planner', 'landing']);
const ALLOWED_PRICE_BUCKETS = new Set(['eur_5', 'eur_9', 'eur_19', 'gbp_5', 'gbp_9', 'gbp_19']);

interface WaitlistPayload {
  email: string;
  consent: boolean;
  source: string;
  priceBucket?: string;
}

function parsePayload(body: unknown): WaitlistPayload {
  if (typeof body !== 'object' || body === null) {
    throw error(400, 'Invalid waitlist payload');
  }
  const payload = body as Record<string, unknown>;
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const consent = payload.consent === true;
  const source = typeof payload.source === 'string' ? payload.source.trim() : 'waitlist';
  const priceBucket = typeof payload.priceBucket === 'string' ? payload.priceBucket.trim() : undefined;

  if (!EMAIL_PATTERN.test(email)) {
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

export const POST: RequestHandler = async ({ request, platform }) => {
  const body: unknown = await request.json().catch(() => null);
  const payload = parsePayload(body);
  const db = platform?.env.DB;

  if (!db) {
    return json({ ok: true, stored: false, reason: 'DB binding is not configured yet' }, { status: 202 });
  }

  await db
    .prepare(
      `insert into waitlist_signups (email, consent, consent_version, source, price_bucket)
       values (?1, ?2, ?3, ?4, ?5)
       on conflict(email) do update set
         consent = excluded.consent,
         consent_version = excluded.consent_version,
         source = excluded.source,
         price_bucket = excluded.price_bucket`
    )
    .bind(payload.email, payload.consent, CONSENT_VERSION, payload.source, payload.priceBucket ?? null)
    .run();

  return json({ ok: true, stored: true });
};
