import { isLocale, type Locale } from '../i18n';

export const CONTACT_RECIPIENT = 'schngn@proton.me';
export const CONTACT_SENDER = 'support@schngn.com';
export const CONTACT_MESSAGE_MIN_LENGTH = 20;
export const CONTACT_MESSAGE_MAX_LENGTH = 4_000;

export type ContactRequestType = 'help' | 'feature';

interface ContactEmailMessage {
  to?: string;
  from: string | { email: string; name?: string };
  replyTo?: string;
  subject: string;
  text: string;
}

export interface ContactEmailBinding {
  send(message: ContactEmailMessage): Promise<unknown>;
}

export interface ContactRateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface ContactEnvironment {
  CONTACT_EMAIL?: ContactEmailBinding;
  CONTACT_RATE_LIMITER?: ContactRateLimitBinding;
  TURNSTILE_SECRET_KEY?: string;
}

export interface ContactDependencies {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface ContactPayload {
  type: ContactRequestType;
  name: string;
  email: string;
  message: string;
  locale: Locale;
  website: string;
  turnstileToken: string;
}

interface TurnstileResult {
  success?: boolean;
  action?: string;
  hostname?: string;
}

const NO_STORE_HEADERS = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  vary: '*'
};
const CONTACT_BODY_MAX_BYTES = 16_384;
const CONTACT_PAYLOAD_KEYS = new Set(['type', 'name', 'email', 'message', 'locale', 'website', 'turnstileToken']);

const LOCAL_TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

export async function handleContactRequest(
  request: Request,
  env: ContactEnvironment | undefined,
  dependencies: ContactDependencies = { fetch }
): Promise<Response> {
  if (!isSameOriginRequest(request)) return response(403, 'invalid_origin');
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return response(415, 'invalid_request');
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > CONTACT_BODY_MAX_BYTES) {
    return response(413, 'invalid_request');
  }

  let input: unknown;
  try {
    const bytes = await readLimitedRequestBody(request, CONTACT_BODY_MAX_BYTES);
    if (bytes === null) return response(413, 'invalid_request');
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    return response(400, 'invalid_request');
  }

  const payload = parsePayload(input);
  if (!payload) return response(400, 'invalid_request');
  if (payload.website) return response(200, undefined, true);

  if (!env?.CONTACT_EMAIL || !env.CONTACT_RATE_LIMITER) return response(503, 'unavailable');

  const rateLimitKey = request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
  try {
    const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: `contact:${rateLimitKey}` });
    if (!rateLimit.success) return response(429, 'rate_limited');
  } catch {
    return response(503, 'unavailable');
  }

  const url = new URL(request.url);
  const localRequest = isLocalHostname(url.hostname);
  const turnstileSecret = readSecret(env.TURNSTILE_SECRET_KEY) ?? (localRequest ? LOCAL_TURNSTILE_TEST_SECRET : null);
  if (!turnstileSecret) return response(503, 'unavailable');

  const verified = await verifyTurnstile(
    payload.turnstileToken,
    turnstileSecret,
    rateLimitKey === 'unknown' ? undefined : rateLimitKey,
    url.hostname,
    localRequest,
    dependencies
  );
  if (!verified) return response(400, 'verification_failed');

  const requestLabel = payload.type === 'help' ? 'Help request' : 'Feature request';
  const senderName = payload.name || 'Not provided';
  const body = [
    requestLabel,
    '',
    `Name: ${senderName}`,
    `Email: ${payload.email}`,
    `Language: ${payload.locale}`,
    '',
    payload.message
  ].join('\n');

  try {
    await env.CONTACT_EMAIL.send({
      to: CONTACT_RECIPIENT,
      from: { email: CONTACT_SENDER, name: 'SCHNGN contact form' },
      replyTo: payload.email,
      subject: `[SCHNGN] ${requestLabel}`,
      text: body
    });
  } catch {
    return response(503, 'unavailable');
  }

  return response(200, undefined, true);
}

function parsePayload(input: unknown): ContactPayload | null {
  if (!isRecord(input)) return null;
  if (Object.keys(input).some((key) => !CONTACT_PAYLOAD_KEYS.has(key))) return null;

  const type = input.type;
  const name = cleanSingleLine(input.name, 80, true);
  const email = cleanSingleLine(input.email, 254, false);
  const message = cleanMessage(input.message);
  const locale = input.locale;
  const website = cleanSingleLine(input.website, 200, true);
  const turnstileToken = cleanSingleLine(input.turnstileToken, 2_048, false);

  if (
    (type !== 'help' && type !== 'feature') ||
    name === null ||
    email === null ||
    !isValidEmail(email) ||
    message === null ||
    !isLocale(locale) ||
    website === null ||
    turnstileToken === null
  ) return null;

  return { type, name, email, message, locale, website, turnstileToken };
}

function cleanSingleLine(value: unknown, maxLength: number, allowEmpty: boolean): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').trim();
  if ((!allowEmpty && cleaned.length === 0) || cleaned.length > maxLength) return null;
  return cleaned;
}

function cleanMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
  if (cleaned.length < CONTACT_MESSAGE_MIN_LENGTH || cleaned.length > CONTACT_MESSAGE_MAX_LENGTH) return null;
  return cleaned;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | undefined,
  expectedHostname: string,
  localRequest: boolean,
  dependencies: ContactDependencies
): Promise<boolean> {
  try {
    const validationResponse = await dependencies.fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
        signal: AbortSignal.timeout(5_000)
      }
    );
    if (!validationResponse.ok) return false;
    const result = await validationResponse.json() as TurnstileResult;
    if (!result.success || result.action !== 'contact') return false;
    return localRequest || result.hostname === expectedHostname;
  } catch {
    return false;
  }
}

function readSecret(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readLimitedRequestBody(request: Request, limit: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function response(status: number, error?: string, ok = false): Response {
  return new Response(JSON.stringify(error ? { ok: false, error } : { ok }), {
    status,
    headers: NO_STORE_HEADERS
  });
}
