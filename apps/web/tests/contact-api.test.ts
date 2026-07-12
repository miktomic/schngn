import { describe, expect, test } from 'bun:test';
import {
  CONTACT_RECIPIENT,
  CONTACT_SENDER,
  handleContactRequest,
  type ContactEmailBinding,
  type ContactEnvironment
} from '../src/lib/contact/contactApi';

const endpoint = 'https://schngn.com/api/contact';
const payload = {
  type: 'help',
  name: 'Mira',
  email: 'mira@example.com',
  message: 'Please help me understand the timeline display.',
  locale: 'en',
  website: '',
  turnstileToken: 'valid-token'
};

function request(body: unknown = payload, headers: Record<string, string> = {}): Request {
  return new Request(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://schngn.com', ...headers },
    body: JSON.stringify(body)
  });
}

function dependencies(result: object = { success: true, action: 'contact', hostname: 'schngn.com' }) {
  return { fetch: async () => new Response(JSON.stringify(result), { status: 200 }) };
}

function environment(overrides: Partial<ContactEnvironment> = {}) {
  const sent: Parameters<ContactEmailBinding['send']>[0][] = [];
  const env: ContactEnvironment = {
    TURNSTILE_SECRET_KEY: 'test-secret',
    CONTACT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    CONTACT_EMAIL: { send: async (message) => { sent.push(message); } },
    ...overrides
  };
  return { env, sent };
}

describe('contact request endpoint', () => {
  test('sends a validated help request only to the fixed support address', async () => {
    const { env, sent } = environment();
    const response = await handleContactRequest(request(), env, dependencies());

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: CONTACT_RECIPIENT,
      from: { email: CONTACT_SENDER, name: 'SCHNGN contact form' },
      replyTo: payload.email,
      subject: '[SCHNGN] Help request'
    });
    expect(sent[0].text).toContain(payload.message);
    expect(sent[0].text).not.toContain('cf-connecting-ip');
  });

  test('rejects malformed fields before calling Turnstile or email', async () => {
    const { env, sent } = environment();
    const response = await handleContactRequest(
      request({ ...payload, email: 'not-an-email', message: 'short' }),
      env,
      { fetch: async () => { throw new Error('Turnstile should not run'); } }
    );

    expect(response.status).toBe(400);
    expect(sent).toHaveLength(0);
    expect((await handleContactRequest(request({ ...payload, trips: [] }), env, dependencies())).status).toBe(400);
    expect((await handleContactRequest(request({ ...payload, message: 'x'.repeat(17_000) }), env, dependencies())).status).toBe(413);
  });

  test('fails closed for cross-origin, failed verification, and missing bindings', async () => {
    const { env, sent } = environment();
    expect((await handleContactRequest(request(payload, { origin: 'https://attacker.example' }), env, dependencies())).status).toBe(403);
    expect((await handleContactRequest(request(), env, dependencies({ success: false }))).status).toBe(400);
    expect((await handleContactRequest(request(), undefined, dependencies())).status).toBe(503);
    expect(sent).toHaveLength(0);
  });

  test('rate limits before verification and silently absorbs honeypot submissions', async () => {
    const limited = environment({ CONTACT_RATE_LIMITER: { limit: async () => ({ success: false }) } });
    expect((await handleContactRequest(request(), limited.env, dependencies())).status).toBe(429);
    expect(limited.sent).toHaveLength(0);

    const honeypot = environment();
    const response = await handleContactRequest(request({ ...payload, website: 'https://spam.example' }), honeypot.env, {
      fetch: async () => { throw new Error('Turnstile should not run'); }
    });
    expect(response.status).toBe(200);
    expect(honeypot.sent).toHaveLength(0);
  });

  test('does not accept an unexpected Turnstile action or hostname', async () => {
    const { env, sent } = environment();
    expect((await handleContactRequest(request(), env, dependencies({ success: true, action: 'login', hostname: 'schngn.com' }))).status).toBe(400);
    expect((await handleContactRequest(request(), env, dependencies({ success: true, action: 'contact', hostname: 'other.example' }))).status).toBe(400);
    expect(sent).toHaveLength(0);
  });
});
