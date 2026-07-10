import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { POST } from '../src/routes/api/waitlist/+server';

interface CapturedD1Run {
  sql: string;
  params: unknown[];
}

function createD1Recorder() {
  const runs: CapturedD1Run[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          return {
            async run() {
              runs.push({ sql, params });
              return { success: true };
            }
          };
        }
      };
    }
  };
  return { db, runs };
}

async function postWaitlist(
  body: unknown,
  platform: unknown,
  options: { contentType?: string; rawBody?: string; headers?: Record<string, string> } = {}
) {
  const requestBody = options.rawBody ?? JSON.stringify(body);
  return POST({
    request: new Request('https://schngn.com/api/waitlist', {
      method: 'POST',
      body: requestBody,
      headers: { 'content-type': options.contentType ?? 'application/json', ...options.headers }
    }),
    platform
  } as Parameters<typeof POST>[0]);
}

describe('waitlist API', () => {
  test('normalizes and upserts only the allowlisted waitlist fields in D1', async () => {
    const { db, runs } = createD1Recorder();
    const response = await postWaitlist(
      {
        email: '  MICHAEL@EXAMPLE.COM ',
        consent: true,
        source: 'pdf_export',
        priceBucket: 'eur_9'
      },
      { env: { DB: db } }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, stored: true });
    expect(runs).toHaveLength(1);
    expect(runs[0].sql).toContain('waitlist_signups');
    expect(runs[0].sql).toContain('on conflict(email) do update');
    expect(runs[0].sql).not.toContain('created_at =');
    expect(runs[0].params).toEqual(['michael@example.com', 1, 'v1', 'pdf_export', 'eur_9']);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('rejects unknown fields, including trip data, instead of silently dropping them', async () => {
    const { db, runs } = createD1Recorder();

    await expect(
      postWaitlist(
        {
          email: 'person@example.com',
          consent: true,
          source: 'waitlist',
          tripDates: ['2026-09-15', '2026-10-13']
        },
        { env: { DB: db } }
      )
    ).rejects.toMatchObject({ status: 400 });
    expect(runs).toHaveLength(0);
  });

  test('requires explicit consent before storing email', async () => {
    const { db, runs } = createD1Recorder();

    await expect(postWaitlist({ email: 'person@example.com', source: 'waitlist' }, { env: { DB: db } })).rejects.toMatchObject({
      status: 400
    });
    expect(runs).toHaveLength(0);
  });

  test('rejects invalid source and price bucket values', async () => {
    const { db, runs } = createD1Recorder();

    await expect(
      postWaitlist({ email: 'person@example.com', consent: true, source: 'Italy 2026', priceBucket: '2026-10-13' }, { env: { DB: db } })
    ).rejects.toMatchObject({ status: 400 });
    expect(runs).toHaveLength(0);
  });

  test('rejects overlong email addresses', async () => {
    const { db, runs } = createD1Recorder();
    const email = `${'a'.repeat(245)}@example.com`;

    await expect(postWaitlist({ email, consent: true, source: 'waitlist' }, { env: { DB: db } })).rejects.toMatchObject({
      status: 400
    });
    expect(runs).toHaveLength(0);
  });

  test('requires JSON content type and valid JSON', async () => {
    await expect(
      postWaitlist({ email: 'person@example.com', consent: true, source: 'waitlist' }, { env: {} }, { contentType: 'text/plain' })
    ).rejects.toMatchObject({ status: 415 });

    await expect(postWaitlist(null, { env: {} }, { rawBody: '{not json' })).rejects.toMatchObject({ status: 400 });
  });

  test('rejects request bodies above the endpoint limit before parsing', async () => {
    const rawBody = JSON.stringify({
      email: 'person@example.com',
      consent: true,
      source: 'waitlist',
      padding: 'x'.repeat(5000)
    });

    await expect(postWaitlist(null, { env: {} }, { rawBody })).rejects.toMatchObject({ status: 413 });
  });

  test('returns accepted but unstored when D1 binding is not configured', async () => {
    const response = await postWaitlist({ email: 'person@example.com', consent: true, source: 'waitlist' }, { env: {} });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, stored: false, reason: 'DB binding is not configured yet' });
  });

  test('returns a service-unavailable boundary when D1 rejects a write', async () => {
    const db = {
      prepare() {
        return {
          bind() {
            return {
              async run() {
                throw new Error('internal D1 detail');
              }
            };
          }
        };
      }
    };

    await expect(
      postWaitlist({ email: 'person@example.com', consent: true, source: 'waitlist' }, { env: { DB: db } })
    ).rejects.toMatchObject({ status: 503 });
  });

  test('ships a versioned D1 migration and an ID-free Wrangler binding', () => {
    const migration = readFileSync('apps/web/migrations/0001_create_waitlist_signups.sql', 'utf8');
    const wrangler = readFileSync('apps/web/wrangler.jsonc', 'utf8');

    expect(migration).toContain('create table if not exists waitlist_signups');
    expect(migration).toContain('created_at');
    expect(migration).toContain('email text primary key');
    expect(migration).toContain('consent_version');
    expect(wrangler).toContain('"binding": "DB"');
    expect(wrangler).toContain('"migrations_dir": "migrations"');
    expect(wrangler).not.toContain('xxxx');
  });
});
