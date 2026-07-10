import { describe, expect, test } from 'bun:test';
import { _createClerkWebhookHandler } from '../src/routes/api/webhooks/clerk/+server';

function webhookEvent(request: Request, platform: unknown) {
  return { request, platform } as Parameters<ReturnType<typeof _createClerkWebhookHandler>>[0];
}

describe('Clerk deletion webhook', () => {
  test('verifies user.deleted before installing the replay guard and deleting the snapshot', async () => {
    const calls: string[] = [];
    const handler = _createClerkWebhookHandler({
      verifyWebhook: async (_request, options) => {
        expect(options).toEqual({ signingSecret: 'test-webhook-signing-secret' });
        return { type: 'user.deleted', data: { id: 'user_deleted' } };
      },
      tombstoneDeletedAccountData: async (db, userId) => {
        expect(db).toBeDefined();
        calls.push(userId);
      }
    });
    const response = await handler(
      webhookEvent(new Request('https://schngn.com/api/webhooks/clerk', { method: 'POST', body: '{}' }), {
        env: { DB: { prepare() {} }, CLERK_WEBHOOK_SIGNING_SECRET: 'test-webhook-signing-secret' }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, deleted: true });
    expect(calls).toEqual(['user_deleted']);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('ignores other verified Clerk events without touching D1', async () => {
    let deleted = false;
    const handler = _createClerkWebhookHandler({
      verifyWebhook: async () => ({ type: 'user.updated', data: { id: 'user_unchanged' } }),
      tombstoneDeletedAccountData: async () => {
        deleted = true;
      }
    });
    const response = await handler(
      webhookEvent(new Request('https://schngn.com/api/webhooks/clerk', { method: 'POST', body: '{}' }), {
        env: { CLERK_WEBHOOK_SIGNING_SECRET: 'test-webhook-signing-secret' }
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, ignored: true });
    expect(deleted).toBe(false);
  });

  test('rejects an invalid signature and never invokes cleanup', async () => {
    let deleted = false;
    const handler = _createClerkWebhookHandler({
      verifyWebhook: async () => {
        throw new Error('signature detail');
      },
      tombstoneDeletedAccountData: async () => {
        deleted = true;
      }
    });
    const response = await handler(
      webhookEvent(new Request('https://schngn.com/api/webhooks/clerk', { method: 'POST', body: '{}' }), {
        env: { DB: {}, CLERK_WEBHOOK_SIGNING_SECRET: 'test-webhook-signing-secret' }
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: 'Invalid webhook signature' });
    expect(deleted).toBe(false);
  });

  test('fails closed when the signing secret, database, or deleted user id is absent', async () => {
    const request = new Request('https://schngn.com/api/webhooks/clerk', { method: 'POST', body: '{}' });
    let verifyCalls = 0;
    const handler = _createClerkWebhookHandler({
      verifyWebhook: async () => {
        verifyCalls += 1;
        return { type: 'user.deleted', data: { id: null } };
      },
      tombstoneDeletedAccountData: async () => {}
    });

    const missingSecret = await handler(webhookEvent(request.clone(), { env: { DB: {} } }));
    expect(missingSecret.status).toBe(503);
    expect(await missingSecret.json()).toEqual({ ok: false, error: 'Webhook is not configured' });
    expect(verifyCalls).toBe(0);

    const missingId = await handler(
      webhookEvent(request.clone(), { env: { DB: {}, CLERK_WEBHOOK_SIGNING_SECRET: 'test-webhook-signing-secret' } })
    );
    expect(missingId.status).toBe(400);
    expect(await missingId.json()).toEqual({ ok: false, error: 'Invalid deletion event' });

    const noDbHandler = _createClerkWebhookHandler({
      verifyWebhook: async () => ({ type: 'user.deleted', data: { id: 'user_deleted' } }),
      tombstoneDeletedAccountData: async () => {}
    });
    const missingDb = await noDbHandler(
      webhookEvent(request.clone(), { env: { CLERK_WEBHOOK_SIGNING_SECRET: 'test-webhook-signing-secret' } })
    );
    expect(missingDb.status).toBe(503);
    expect(await missingDb.json()).toEqual({ ok: false, error: 'Account deletion is temporarily unavailable' });
  });

  test('returns a retryable failure when account cleanup does not complete', async () => {
    const handler = _createClerkWebhookHandler({
      verifyWebhook: async () => ({ type: 'user.deleted', data: { id: 'user_deleted' } }),
      tombstoneDeletedAccountData: async () => {
        throw new Error('private D1 detail');
      }
    });
    const response = await handler(
      webhookEvent(new Request('https://schngn.com/api/webhooks/clerk', { method: 'POST', body: '{}' }), {
        env: { DB: {}, CLERK_WEBHOOK_SIGNING_SECRET: 'test-webhook-signing-secret' }
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: 'Account deletion is temporarily unavailable' });
  });
});
