import { boundedText } from '../../../agent-readiness/body.mjs';
import type { OAuthHelpers, AuthRequest } from '@cloudflare/workers-oauth-provider';
import { authenticateClerkRequest, type ClerkAuthEnvironment } from '../auth/authenticateRequest';
import type { AccountD1Database } from '../account/accountRepository';
import { consentStore, type ConsentStore } from './consentStore';

export const AGENT_SCOPES = ['docs:read', 'trips:read'] as const;
export const AGENT_RESOURCE = 'https://schngn.com';
export const AGENT_NO_STORE = { 'Cache-Control': 'no-store', Vary: '*', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
export interface AgentAuthProps { userId: string; scopes: string[]; clientId: string; grantId: string; }
export interface AgentConsentEnvironment extends ClerkAuthEnvironment { OAUTH_PROVIDER?: OAuthHelpers; DB?: unknown; }
export function agentError(error: string, status: number) { return Response.json({ error }, { status, headers: AGENT_NO_STORE }); }
export function agentAccessError(error: 'invalid_token' | 'insufficient_scope', scope?: string) {
  const challenge = `Bearer error="${error}", resource_metadata="https://schngn.com/.well-known/oauth-protected-resource"${scope ? `, scope="${scope}"` : ''}`;
  return Response.json({ error }, { status: error === 'invalid_token' ? 401 : 403, headers: { ...AGENT_NO_STORE, 'WWW-Authenticate': challenge } });
}

function validScopes(oauth: AuthRequest) {
  return oauth.responseType === 'code' && oauth.codeChallengeMethod === 'S256' && !!oauth.codeChallenge && oauth.scope.length > 0 && oauth.scope.every(scope => AGENT_SCOPES.includes(scope as typeof AGENT_SCOPES[number]));
}
export function createConsentHandler(authenticate = authenticateClerkRequest, createStore: (db: AccountD1Database) => ConsentStore = consentStore) {
  return async (request: Request, env: AgentConsentEnvironment): Promise<Response> => {
    if (request.url.length > 8192) return agentError('invalid_authorization_request', 400);
    if (!env.OAUTH_PROVIDER) return agentError('agent_authorization_unavailable', 503);
    if (!['GET', 'POST'].includes(request.method)) return agentError('method_not_allowed', 405);
    try {
      if (request.method === 'GET') {
        const oauth = await env.OAUTH_PROVIDER.parseAuthRequest(request);
        if (!validScopes(oauth)) return agentError('invalid_authorization_request', 400);
        const client = await env.OAUTH_PROVIDER.lookupClient(oauth.clientId);
        if (!client) return agentError('invalid_authorization_request', 400);
        let transactionId: string | undefined;
        if (request.headers.has('Authorization')) {
          const auth = await authenticate(request, env);
          if (!auth.ok) return agentError('authentication_required', auth.status);
          if (!env.DB) return agentError('agent_authorization_unavailable', 503);
          transactionId = await createStore(env.DB as AccountD1Database).create(auth.userId, auth.sessionId, request.url);
        }
        return Response.json({ clientName: client.clientName || 'Agent application', redirectOrigin: new URL(oauth.redirectUri).origin, resource: AGENT_RESOURCE, scopes: oauth.scope, transactionId }, { headers: AGENT_NO_STORE });
      }
      if (request.headers.get('Origin') !== new URL(request.url).origin || !request.headers.get('Authorization')?.startsWith('Bearer ')) return agentError('invalid_consent_request', 403);
      const auth = await authenticate(request, env);
      if (!auth.ok) return agentError('authentication_required', auth.status);
      if (!env.DB) return agentError('agent_authorization_unavailable', 503);
      const text = await boundedText(request, 200);
      if (text.length > 200) return agentError('invalid_consent_request', 400);
      const body = JSON.parse(text);
      if (!body || Object.keys(body).some(key => !['allow', 'transactionId'].includes(key)) || typeof body.allow !== 'boolean' || typeof body.transactionId !== 'string') return agentError('invalid_consent_request', 400);
      const original = await createStore(env.DB as AccountD1Database).consume(body.transactionId, auth.userId, auth.sessionId);
      if (!original) return agentError('consent_expired', 400);
      const oauth = await env.OAUTH_PROVIDER.parseAuthRequest(new Request(original));
      if (!validScopes(oauth)) return agentError('invalid_authorization_request', 400);
      const client = await env.OAUTH_PROVIDER.lookupClient(oauth.clientId);
      if (!client) return agentError('invalid_authorization_request', 400);
      if (!body.allow) {
        const redirect = new URL(oauth.redirectUri);
        redirect.searchParams.set('error', 'access_denied');
        if (oauth.state) redirect.searchParams.set('state', oauth.state);
        if (oauth.issuer) redirect.searchParams.set('iss', oauth.issuer);
        return Response.json({ redirectTo: redirect.href }, { headers: AGENT_NO_STORE });
      }
      const result = await env.OAUTH_PROVIDER.completeAuthorization({ revokeExistingGrants: false, request: oauth, userId: auth.userId, scope: oauth.scope, metadata: { clientName: client.clientName || 'Agent application' }, props: { userId: auth.userId, scopes: oauth.scope, clientId: oauth.clientId } });
      return Response.json(result, { headers: AGENT_NO_STORE });
    } catch { return agentError('invalid_authorization_request', 400); }
  };
}
export const handleAgentConsent = createConsentHandler();
