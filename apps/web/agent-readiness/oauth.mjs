import { OAuthProvider, getOAuthApi } from '@cloudflare/workers-oauth-provider';
import { boundedText } from './body.mjs';
const PRIVATE_PATHS = ['/mcp', '/api/agent/trips', '/a2a'];
const NO_STORE = { 'Cache-Control': 'no-store', Vary: '*', 'Referrer-Policy': 'no-referrer' };
const error = (code, status) => Response.json({ error: code }, { status, headers: NO_STORE });
async function digest(token) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), byte => byte.toString(16).padStart(2, '0')).join(''); }
export function agentOAuthOptions(app) {
  return {
    apiRoute: PRIVATE_PATHS,
    apiHandler: { fetch(request, env, ctx) { return app.fetch(request, { ...env, SCHNGN_AGENT_AUTH: ctx.props }, ctx); } },
    defaultHandler: app,
    authorizeEndpoint: 'https://schngn.com/agent/authorize',
    tokenEndpoint: 'https://schngn.com/oauth/token',
    clientRegistrationEndpoint: 'https://schngn.com/oauth/register',
    scopesSupported: ['docs:read', 'trips:read'],
    resourceMetadata: { resource: 'https://schngn.com', authorization_servers: ['https://schngn.com'], scopes_supported: ['docs:read', 'trips:read'], bearer_methods_supported: ['header'], resource_name: 'SCHNGN read-only agent access' },
    tokenExchangeCallback: ({ props, requestedScope, grantId }) => ({ accessTokenProps: { ...props, scopes: requestedScope, grantId } }),
    accessTokenTTL: 600, refreshTokenTTL: 0, clientRegistrationTTL: 86400,
    allowPlainPKCE: false, allowImplicitFlow: false, allowTokenExchangeGrant: false,
    clientIdMetadataDocumentEnabled: true,
    clientRegistrationCallback: ({ clientMetadata: metadata }) => {
      const redirects = metadata.redirect_uris;
      const validRedirect = value => { try { const url = new URL(value); return !url.username && !url.password && !url.hash && (url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname))); } catch { return false; } };
      if (metadata.token_endpoint_auth_method !== 'none' || !Array.isArray(redirects) || !redirects.length || redirects.length > 10 || !redirects.every(validRedirect) || typeof metadata.client_name !== 'string' || !metadata.client_name.trim() || metadata.client_name.length > 100 || metadata.software_statement || (metadata.grant_types && JSON.stringify(metadata.grant_types) !== '["authorization_code"]') || (metadata.response_types && JSON.stringify(metadata.response_types) !== '["code"]')) return { code: 'invalid_client_metadata', description: 'Register a public authorization-code client with PKCE and HTTPS or loopback redirects.' };
    },
    onError: ({ code, status, headers }) => Response.json({ error: code }, { status, headers: { ...headers, ...NO_STORE } })
  };
}
// Bound provider grant metadata even when refresh tokens are disabled. The provider
// rewrites successful code grants without a KV TTL; this adapter preserves a cap.
function expiringGrantKv(kv) {
  return {
    get: (...args) => kv.get(...args), list: (...args) => kv.list(...args), delete: (...args) => kv.delete(...args),
    put(key, value, settings = {}) {
      if (!key.startsWith('grant:')) return kv.put(key, value, settings);
      const { expiration, expirationTtl, ...rest } = settings;
      const ttl = Math.min(1200, expirationTtl ?? (expiration ? expiration - Math.floor(Date.now() / 1000) : 1200));
      return kv.put(key, value, { ...rest, expirationTtl: Math.max(60, ttl) });
    }
  };
}
export function withAgentAuthorization(app) {
  const options = agentOAuthOptions(app);
  const provider = new OAuthProvider(options);
  return {
    async fetch(request, env, ctx) {
      env = { ...env, OAUTH_KV: expiringGrantKv(env.OAUTH_KV) };
      const url = new URL(request.url);
      if (url.hostname === 'www.schngn.com') { url.hostname = 'schngn.com'; return Response.redirect(url, 308); }
      const path = url.pathname;
      if (path === '/mcp/server-card' && ['GET', 'HEAD'].includes(request.method)) return app.fetch(request, env, ctx);
      if (path === '/mcp' && request.headers.has('Origin') && request.headers.get('Origin') !== 'https://schngn.com') return error('invalid_origin', 403);
      const protectedPath = PRIVATE_PATHS.some(prefix => path === prefix || path.startsWith(prefix + '/'));
      const sensitive = protectedPath || path.startsWith('/oauth/') || path.startsWith('/api/agent/');
      if (!sensitive) return provider.fetch(request, env, ctx);
      try {
        const limiter = path === '/oauth/register' ? env.AGENT_REGISTRATION_LIMITER : env.AGENT_RATE_LIMITER;
        if (!limiter) return error('agent_authorization_unavailable', 503);
        if (!(await limiter.limit({ key: request.headers.get('CF-Connecting-IP') || 'local' })).success) return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { ...NO_STORE, 'Content-Type': 'application/json', 'Retry-After': '60' } });
        let body;
        if (request.method === 'POST') {
          try { body = await boundedText(request, path.startsWith('/api/agent/') && path !== '/api/agent/trips' ? 200 : 16384); }
          catch { return error('request_too_large', 413); }
          request = new Request(request, { body });
        }
        if (protectedPath) {
          const token = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
          if (token) {
            if (!env.DB) return error('authorization_unavailable', 503);
            const denied = await env.DB.prepare('select 1 from agent_revoked_tokens where token_hash = ?1 and expires_at > ?2').bind(await digest(token), Math.floor(Date.now() / 1000)).first();
            if (denied) return new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401, headers: { ...NO_STORE, 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer error="invalid_token", resource_metadata="https://schngn.com/.well-known/oauth-protected-resource"' } });
          }
        }
        // Bridge RFC 7009 KV propagation only after the provider validates client ownership.
        const form = path === '/oauth/token' && body ? new URLSearchParams(body) : null;
        const revoking = form?.get('token');
        const summary = revoking ? await getOAuthApi(options, env).unwrapToken(revoking) : null;
        const response = await provider.fetch(request, env, ctx);
        let revokingClient = form?.get('client_id');
        const basic = request.headers.get('Authorization')?.match(/^Basic (.+)$/i)?.[1];
        if (basic) { try { revokingClient = decodeURIComponent(atob(basic).split(':')[0]); } catch { revokingClient = null; } }
        if (summary && response.ok && summary.grant.clientId === revokingClient) {
          if (!env.DB) return error('authorization_unavailable', 503);
          await env.DB.prepare('insert into agent_revoked_tokens (token_hash, expires_at) values (?1, ?2) on conflict(token_hash) do update set expires_at = excluded.expires_at').bind(await digest(revoking), summary.expiresAt).run();
        }
        return response;
      } catch { return error('agent_authorization_unavailable', 503); }
    },
    async scheduled(event, env, ctx) {
      await provider.purgeExpiredData(env, { batchSize: 50 });
      const now = Math.floor(Date.now() / 1000);
      for (const table of ['agent_consent_transactions', 'agent_revoked_grants', 'agent_revoked_tokens']) await env.DB.prepare(`delete from ${table} where expires_at <= ?1`).bind(now).run();
    }
  };
}
