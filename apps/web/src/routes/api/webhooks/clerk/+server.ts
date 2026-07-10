import { verifyWebhook as verifyClerkWebhook, type WebhookEvent } from '@clerk/backend/webhooks';
import { json, type RequestHandler } from '@sveltejs/kit';
import {
  tombstoneDeletedAccountData,
  type AccountD1Database
} from '../../../../lib/account/accountRepository';

const NO_STORE_HEADERS = { 'cache-control': 'no-store' };

interface ClerkWebhookEnvironment {
  DB?: unknown;
  CLERK_WEBHOOK_SIGNING_SECRET?: unknown;
}

interface ClerkWebhookEventLike {
  type: string;
  data: unknown;
}

export interface ClerkWebhookDependencies {
  verifyWebhook(request: Request, options: { signingSecret: string }): Promise<ClerkWebhookEventLike>;
  tombstoneDeletedAccountData(db: unknown, userId: string): Promise<void>;
}

const defaultDependencies: ClerkWebhookDependencies = {
  verifyWebhook: (request, options) => verifyClerkWebhook(request, options) as Promise<WebhookEvent>,
  tombstoneDeletedAccountData: (db, userId) =>
    tombstoneDeletedAccountData(db as AccountD1Database, userId)
};

function readSigningSecret(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const secret = value.trim();
  return secret.length > 0 ? secret : null;
}

function deletedUserId(event: ClerkWebhookEventLike): string | null {
  if (typeof event.data !== 'object' || event.data === null || !('id' in event.data)) return null;
  const id = event.data.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function _createClerkWebhookHandler(dependencies: ClerkWebhookDependencies = defaultDependencies): RequestHandler {
  return async ({ request, platform }) => {
    const env = platform?.env as ClerkWebhookEnvironment | undefined;
    const signingSecret = readSigningSecret(env?.CLERK_WEBHOOK_SIGNING_SECRET);

    if (!signingSecret) {
      return json({ ok: false, error: 'Webhook is not configured' }, { status: 503, headers: NO_STORE_HEADERS });
    }

    let event: ClerkWebhookEventLike;
    try {
      event = await dependencies.verifyWebhook(request, { signingSecret });
    } catch {
      return json({ ok: false, error: 'Invalid webhook signature' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (event.type !== 'user.deleted') {
      return json({ ok: true, ignored: true }, { headers: NO_STORE_HEADERS });
    }

    const userId = deletedUserId(event);
    if (!userId) {
      return json({ ok: false, error: 'Invalid deletion event' }, { status: 400, headers: NO_STORE_HEADERS });
    }

    if (!env?.DB) {
      return json(
        { ok: false, error: 'Account deletion is temporarily unavailable' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    try {
      await dependencies.tombstoneDeletedAccountData(env.DB, userId);
    } catch {
      return json(
        { ok: false, error: 'Account deletion is temporarily unavailable' },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    return json({ ok: true, deleted: true }, { headers: NO_STORE_HEADERS });
  };
}

export const POST = _createClerkWebhookHandler();
