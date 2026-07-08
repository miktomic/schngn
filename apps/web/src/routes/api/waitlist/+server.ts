import { error, json, type RequestHandler } from '@sveltejs/kit';

function extractEmail(body: unknown): string {
  if (typeof body !== 'object' || body === null || !('email' in body)) return '';
  const { email } = body as { email?: unknown };
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const body: unknown = await request.json().catch(() => null);
  const email = extractEmail(body);

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw error(400, 'Invalid email');
  }

  if (!platform?.env.WAITLIST) {
    return json({ ok: true, stored: false, reason: 'WAITLIST binding is not configured yet' }, { status: 202 });
  }

  await platform.env.WAITLIST.put(`email:${email}`, JSON.stringify({ createdAt: new Date().toISOString() }));
  return json({ ok: true, stored: true });
};
