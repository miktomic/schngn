import { mock, test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
// Only Cloudflare's base class is substituted. The real provider, crypto, PKCE and KV operations execute.
mock.module('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
const { withAgentAuthorization, agentOAuthOptions } = await import('../agent-readiness/oauth.mjs');
const { getOAuthApi } = await import('@cloudflare/workers-oauth-provider');
const { boundedText } = await import('../agent-readiness/body.mjs');
class MemoryKV {
  rows = new Map<string, { value: string; expiry?: number }>();
  async get(key: string, options?: any) { const row = this.rows.get(key); if (!row || (row.expiry && row.expiry <= Date.now() / 1000)) return null; return options?.type === 'json' || options === 'json' ? JSON.parse(row.value) : row.value; }
  async put(key: string, value: string, options?: any) { this.rows.set(key, { value, expiry: options?.expiration ?? (options?.expirationTtl ? Date.now() / 1000 + options.expirationTtl : undefined) }); }
  async delete(key: string) { this.rows.delete(key); }
  async list(options: any = {}) { return { keys: [...this.rows.keys()].filter(key => key.startsWith(options.prefix || '')).map(name => ({ name })), list_complete: true, cursor: '' }; }
}
function setup() {
  const sqlite = new Database(':memory:'); sqlite.exec(readFileSync(new URL('../migrations/0006_agent_authorization.sql', import.meta.url), 'utf8'));
  const app = { async fetch(request: Request, env: any) { return Response.json({ path: new URL(request.url).pathname, principal: env.SCHNGN_AGENT_AUTH || null }); } };
  const env = { OAUTH_KV: new MemoryKV(), AGENT_RATE_LIMITER: { async limit() { return { success: true }; } }, AGENT_REGISTRATION_LIMITER: { async limit() { return { success: true }; } }, DB: { prepare(sql: string) { let values: any[] = []; return { bind(...args: any[]) { values = args; return this; }, async first() { return sqlite.query(sql).get(...values); }, async run() { sqlite.query(sql).run(...values); return { success: true }; } }; } } };
  const worker = withAgentAuthorization(app);
  const options = agentOAuthOptions(app);
  const helper = getOAuthApi(options, env as any);
  const fetch = (path: string, init?: RequestInit) => worker.fetch(new Request('https://schngn.com' + path, init), env, { waitUntil() {} });
  const form = (values: Record<string, string>) => fetch('/oauth/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values) });
  return { env, sqlite, helper, fetch, form };
}
async function client(f: ReturnType<typeof setup>, override = {}) {
  const response = await f.fetch('/oauth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'Synthetic regression client', redirect_uris: ['https://client.example/callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code'], response_types: ['code'], ...override }) });
  return { status: response.status, body: await response.json() };
}
async function authorize(f: ReturnType<typeof setup>, clientId: string, resource = 'https://schngn.com') {
  const verifier = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN';
  const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');
  const url = new URL('https://schngn.com/agent/authorize'); url.search = new URLSearchParams({ client_id: clientId, redirect_uri: 'https://client.example/callback', response_type: 'code', code_challenge: challenge, code_challenge_method: 'S256', scope: 'docs:read trips:read', resource, state: 'synthetic-state' }).toString();
  const request = await f.helper.parseAuthRequest(new Request(url));
  const { redirectTo } = await f.helper.completeAuthorization({ revokeExistingGrants: false, request, userId: 'user_alice', scope: ['docs:read', 'trips:read'], props: { userId: 'user_alice', scopes: ['docs:read', 'trips:read'], clientId }, metadata: {} });
  return { verifier, code: new URL(redirectTo).searchParams.get('code')! };
}

test('real OAuth code flow enforces PKCE, single-use code, exact resource and effective token scopes on every endpoint', async () => {
  const f = setup(); const registered = await client(f); expect(registered.status).toBe(201);
  const id = registered.body.client_id; const grant = await authorize(f, id);
  const fields = { grant_type: 'authorization_code', client_id: id, code: grant.code, code_verifier: grant.verifier, redirect_uri: 'https://client.example/callback', resource: 'https://schngn.com', scope: 'docs:read' };
  expect((await f.form({ ...fields, code_verifier: 'invalid' })).status).toBe(400);
  expect((await f.form({ ...fields, resource: 'https://attacker.example' })).status).toBe(400);
  const response = await f.form(fields); expect(response.status).toBe(200);
  for (const [key, row] of f.env.OAUTH_KV.rows) if (key.startsWith('grant:')) { expect(row.expiry).toBeDefined(); expect(row.expiry! - Date.now() / 1000).toBeLessThanOrEqual(1200); }
  const token = await response.json(); expect(token.expires_in).toBe(600); expect(token.refresh_token).toBeUndefined(); expect(token.scope).toBe('docs:read');
  for (const path of ['/mcp', '/api/agent/trips', '/a2a']) {
    const result = await f.fetch(path, { headers: { Authorization: `Bearer ${token.access_token}` } }); expect(result.status).toBe(200);
    const { principal } = await result.json(); expect(principal.userId).toBe('user_alice'); expect(principal.scopes).toEqual(['docs:read']); expect(principal.grantId).toBeTruthy();
  }
  const account = await (await f.fetch('/api/account', { headers: { Authorization: `Bearer ${token.access_token}` } })).json(); expect(account.principal).toBeNull();
  expect((await f.fetch('/mcp', { headers: { Authorization: 'Bearer synthetic-clerk-session' } })).status).toBe(401);
  await authorize(f, id); // A separate explicit approval does not silently revoke this connection.
  expect((await f.fetch('/mcp', { headers: { Authorization: `Bearer ${token.access_token}` } })).status).toBe(200);
  expect((await f.form(fields)).status).toBe(400);
  expect((await f.fetch('/mcp', { headers: { Authorization: `Bearer ${token.access_token}` } })).status).toBe(401);
  f.sqlite.close();
});

test('registration policy and limits reject unsafe clients; metadata and challenges stay public', async () => {
  const f = setup();
  for (const redirect of ['http://remote.example/callback', 'https://client.example/callback#fragment', 'https://user:password@client.example/callback', 'file:///tmp/callback']) expect((await client(f, { redirect_uris: [redirect] })).status).toBe(400);
  expect((await client(f, { grant_types: ['client_credentials'] })).status).toBe(400);
  expect((await client(f, { token_endpoint_auth_method: 'client_secret_post' })).status).toBe(400);
  expect((await client(f, { redirect_uris: ['http://127.0.0.1:8791/callback'] })).status).toBe(201);
  expect((await f.fetch('/.well-known/oauth-authorization-server')).status).toBe(200);
  expect((await f.fetch('/mcp', { headers: { Origin: 'https://attacker.example' } })).status).toBe(403);
  expect((await f.fetch('/mcp', { headers: { Origin: 'null' } })).status).toBe(403);
  expect((await f.fetch('/mcp', { headers: { Origin: 'https://schngn.com' } })).status).toBe(401);
  const challenge = await f.fetch('/mcp'); expect(challenge.status).toBe(401); expect(challenge.headers.get('www-authenticate')).toContain('oauth-protected-resource');
  f.env.AGENT_REGISTRATION_LIMITER.limit = async () => ({ success: false }); expect((await client(f)).status).toBe(429);
  f.sqlite.close();
});

test('RFC 7009 revocation remains effective when KV subsequently returns a stale token', async () => {
  const f = setup(); const { body } = await client(f); const grant = await authorize(f, body.client_id);
  const token = await (await f.form({ grant_type: 'authorization_code', client_id: body.client_id, code: grant.code, code_verifier: grant.verifier, redirect_uri: 'https://client.example/callback', resource: 'https://schngn.com' })).json();
  const before = new Map(f.env.OAUTH_KV.rows);
  expect((await f.form({ client_id: body.client_id, token: token.access_token, token_type_hint: 'access_token' })).status).toBe(200);
  f.env.OAUTH_KV.rows = before;
  expect((await f.fetch('/mcp', { headers: { Authorization: `Bearer ${token.access_token}` } })).status).toBe(401);
  f.sqlite.close();
});

test('body limit cancels chunked input before fully buffering it and handles forged length', async () => {
  let cancelled = false;
  const request = new Request('https://schngn.com/mcp', { method: 'POST', body: new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(100)); }, cancel() { cancelled = true; } }), duplex: 'half' } as RequestInit);
  await expect(boundedText(request, 200)).rejects.toThrow('request_too_large'); expect(cancelled).toBe(true);
  await expect(boundedText(new Request('https://schngn.com/mcp', { method: 'POST', headers: { 'Content-Length': '1000' }, body: 'x' }), 200)).rejects.toThrow('request_too_large');
});
