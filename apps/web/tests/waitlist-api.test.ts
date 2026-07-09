import { describe, expect, test } from 'bun:test';
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

async function postWaitlist(body: unknown, platform: unknown) {
  return POST({
    request: new Request('https://schngn.com/api/waitlist', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' }
    }),
    platform
  } as Parameters<typeof POST>[0]);
}

describe('waitlist API', () => {
  test('stores only email, consent, source, and price bucket in D1', async () => {
    const { db, runs } = createD1Recorder();
    const response = await postWaitlist(
      {
        email: '  MICHAEL@EXAMPLE.COM ',
        consent: true,
        source: 'pdf_export',
        priceBucket: 'eur_9',
        tripDates: ['2026-09-15', '2026-10-13'],
        tripLabel: 'Italy booked trip'
      },
      { env: { DB: db } }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, stored: true });
    expect(runs).toHaveLength(1);
    expect(runs[0].sql).toContain('waitlist_signups');
    expect(runs[0].params).toEqual(['michael@example.com', true, 'v1', 'pdf_export', 'eur_9']);
    expect(JSON.stringify(runs[0])).not.toContain('2026-09-15');
    expect(JSON.stringify(runs[0])).not.toContain('Italy booked trip');
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

  test('returns accepted but unstored when D1 binding is not configured', async () => {
    const response = await postWaitlist({ email: 'person@example.com', consent: true, source: 'waitlist' }, { env: {} });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true, stored: false, reason: 'DB binding is not configured yet' });
  });
});
