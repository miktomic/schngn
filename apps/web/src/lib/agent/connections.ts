import { boundedText } from '../../../agent-readiness/body.mjs';
import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { AccountD1Database } from '../account/accountRepository';
import { authenticateClerkRequest } from '../auth/authenticateRequest';
import { AGENT_NO_STORE, agentError, type AgentConsentEnvironment } from './consent';

export async function revokeAllAgentGrants(provider: OAuthHelpers, userId: string, db: AccountD1Database) {
  await db.prepare('delete from agent_consent_transactions where user_id = ?1').bind(userId).run();
  // Revocation removes listed records; restart from the first page to avoid stale cursors.
  for (let page = 0; page < 100; page++) {
    const grants = await provider.listUserGrants(userId, { limit: 100 });
    if (!grants.items.length) return;
    for (const grant of grants.items) {
      await db.prepare('insert into agent_revoked_grants (grant_id, user_id, expires_at) values (?1, ?2, ?3) on conflict(grant_id, user_id) do update set expires_at = excluded.expires_at').bind(grant.id, userId, Math.floor(Date.now() / 1000) + 3600).run();
      await provider.revokeGrant(grant.id, userId);
    }
  }
  throw new Error('Agent grant cleanup incomplete');
}
export function createConnectionsHandler(authenticate = authenticateClerkRequest) {
  return async (request: Request, env: AgentConsentEnvironment) => {
    const auth = await authenticate(request, env);
    if (!auth.ok) return agentError('authentication_required', auth.status);
    if (!env.OAUTH_PROVIDER || !env.DB) return agentError('agent_authorization_unavailable', 503);
    try {
      if (request.method === 'GET') {
        const cursor = new URL(request.url).searchParams.get('cursor') ?? undefined;
        if (cursor && cursor.length > 2000) return agentError('invalid_request', 400);
        const grants = await env.OAUTH_PROVIDER.listUserGrants(auth.userId, { limit: 50, cursor });
        return Response.json({ items: grants.items.map(grant => ({ id: grant.id, name: typeof grant.metadata?.clientName === 'string' ? grant.metadata.clientName : 'Agent application', scopes: grant.scope, createdAt: grant.createdAt, expiresAt: grant.expiresAt })), cursor: grants.cursor }, { headers: AGENT_NO_STORE });
      }
      if (request.method !== 'POST') return agentError('method_not_allowed', 405);
      if (request.headers.get('Origin') !== new URL(request.url).origin || !request.headers.get('Authorization')?.startsWith('Bearer ')) return agentError('invalid_request', 403);
      const text = await boundedText(request, 200);
      if (text.length > 200) return agentError('invalid_request', 400);
      const body = JSON.parse(text);
      if (!body || Object.keys(body).length !== 1 || typeof body.grantId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.grantId)) return agentError('invalid_request', 400);
      const db = env.DB as AccountD1Database;
      const now = Math.floor(Date.now() / 1000);
      await db.prepare('delete from agent_revoked_grants where expires_at <= ?1').bind(now).run();
      await db.prepare('insert into agent_revoked_grants (grant_id, user_id, expires_at) values (?1, ?2, ?3) on conflict(grant_id, user_id) do update set expires_at = excluded.expires_at').bind(body.grantId, auth.userId, now + 3600).run();
      await env.OAUTH_PROVIDER.revokeGrant(body.grantId, auth.userId);
      return Response.json({ revoked: true }, { headers: AGENT_NO_STORE });
    } catch { return agentError('agent_authorization_unavailable', 503); }
  };
}
export const handleAgentConnections = createConnectionsHandler();
