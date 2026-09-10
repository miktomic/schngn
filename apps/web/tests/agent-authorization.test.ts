import { test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';
import { consentStore } from '../src/lib/agent/consentStore';
import { createConsentHandler } from '../src/lib/agent/consent';
import { createConnectionsHandler } from '../src/lib/agent/connections';
import { handleA2a } from '../src/lib/agent/a2a';
import { handleRemoteMcp, readAgentTrips } from '../src/lib/agent/remote';
import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { AccountD1Database } from '../src/lib/account/accountRepository';

function database() {
  const sqlite = new Database(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0006_agent_authorization.sql', import.meta.url), 'utf8'));
  sqlite.exec("CREATE TABLE account_deletion_tombstones (clerk_user_id_hash TEXT, expires_at TEXT); CREATE TABLE account_trip_snapshots (clerk_user_id TEXT PRIMARY KEY, revision INTEGER, trips_json TEXT, updated_at TEXT, consent_version TEXT);");
  const db: AccountD1Database = { prepare(sql) {
    let values: any[] = [];
    return { bind(...args) { values = args; return this; }, async first<T>() { return sqlite.query(sql).get(...values) as T | null; }, async run() { sqlite.query(sql).run(...values); return { success: true }; } };
  } };
  return { db, sqlite };
}
const identity = async (request: Request) => ({ ok: true as const, userId: request.headers.get('X-Test-User') || 'user_alice', sessionId: request.headers.get('X-Test-Session') || 'session_a' });
const startUrl = 'https://schngn.com/api/agent/authorize?client_id=client_a&redirect_uri=https%3A%2F%2Fclient.example%2Fcallback&scope=docs%3Aread&state=original-state';
function provider() {
  const completed: any[] = [];
  const revoked: any[] = [];
  const helper = {
    async parseAuthRequest(request: Request) { const q = new URL(request.url).searchParams; return { clientId: q.get('client_id'), redirectUri: q.get('redirect_uri'), scope: (q.get('scope') || '').split(' '), state: q.get('state'), responseType: 'code', codeChallenge: 'test-challenge', codeChallengeMethod: 'S256' }; },
    async lookupClient() { return { clientName: '<script>untrusted client</script>' }; },
    async completeAuthorization(input: unknown) { completed.push(input); return { redirectTo: 'https://client.example/callback?code=synthetic' }; },
    async revokeGrant(...args: unknown[]) { revoked.push(args); },
    async listUserGrants() { return { items: [] }; }
  } as unknown as OAuthHelpers;
  return { helper, completed, revoked };
}
function post(body: unknown, extras: Record<string, string> = {}, url = startUrl) { return new Request(url, { method: 'POST', headers: { Origin: 'https://schngn.com', Authorization: 'Bearer synthetic-session', 'Content-Type': 'application/json', ...extras }, body: JSON.stringify(body) }); }

test('D1 consent is single use, expires, and is bound to both the account and session', async () => {
  const { db, sqlite } = database(); const store = consentStore(db);
  const id = await store.create('user_alice', 'session_a', startUrl);
  expect(await store.consume(id, 'user_bob', 'session_a')).toBeNull();
  expect(await store.consume(id, 'user_alice', 'session_b')).toBeNull();
  expect(await store.consume(id, 'user_alice', 'session_a')).toBe(startUrl);
  expect(await store.consume(id, 'user_alice', 'session_a')).toBeNull();
  const expired = await store.create('user_alice', 'session_a', startUrl);
  sqlite.exec('UPDATE agent_consent_transactions SET expires_at = 0');
  expect(await store.consume(expired, 'user_alice', 'session_a')).toBeNull();
  sqlite.close();
});

test('only explicit session-bound consent grants the original scopes, principal and redirect', async () => {
  const { db, sqlite } = database(); const { helper, completed } = provider();
  const handler = createConsentHandler(identity); const env = { DB: db, OAUTH_PROVIDER: helper };
  const anonymous = await (await handler(new Request(startUrl), env)).json();
  expect(anonymous.transactionId).toBeUndefined(); expect(completed).toHaveLength(0);
  const start = await (await handler(new Request(startUrl, { headers: { Authorization: 'Bearer synthetic' } }), env)).json();
  expect(completed).toHaveLength(0);
  expect((await handler(post({ allow: true, transactionId: start.transactionId }, { 'X-Test-User': 'user_bob' }), env)).status).toBe(400);
  expect((await handler(post({ allow: true, transactionId: start.transactionId }, { 'X-Test-Session': 'session_b' }), env)).status).toBe(400);
  expect((await handler(post({ allow: true, transactionId: start.transactionId }, { Origin: 'https://attacker.example' }), env)).status).toBe(403);
  const changed = startUrl.replace('docs%3Aread', 'trips%3Aread').replace('client.example', 'attacker.example');
  expect((await handler(post({ allow: true, transactionId: start.transactionId }, {}, changed), env)).status).toBe(200);
  expect(completed).toHaveLength(1);
  expect(completed[0].revokeExistingGrants).toBe(false);
  expect(completed[0].scope).toEqual(['docs:read']);
  expect(completed[0].userId).toBe('user_alice');
  expect(completed[0].request.redirectUri).toBe('https://client.example/callback');
  expect((await handler(post({ allow: true, transactionId: start.transactionId }), env)).status).toBe(400);
  sqlite.close();
});

test('denial returns state to the validated redirect and never mints a grant', async () => {
  const { db, sqlite } = database(); const { helper, completed } = provider();
  const handler = createConsentHandler(identity); const env = { DB: db, OAUTH_PROVIDER: helper };
  const { transactionId } = await (await handler(new Request(startUrl, { headers: { Authorization: 'Bearer synthetic' } }), env)).json();
  const response = await handler(post({ allow: false, transactionId }), env);
  const location = new URL((await response.json()).redirectTo);
  expect(location.origin).toBe('https://client.example'); expect(location.searchParams.get('error')).toBe('access_denied');
  expect(location.searchParams.get('state')).toBe('original-state'); expect(completed).toHaveLength(0);
  expect(response.headers.get('cache-control')).toBe('no-store'); sqlite.close();
});

test('read-only API separates session tokens from delegated tokens and checks current revocation and scopes', async () => {
  const { db, sqlite } = database();
  const auth = { userId: 'user_alice', clientId: 'client_a', grantId: 'grant_a', scopes: ['docs:read'] };
  expect((await readAgentTrips({ DB: db })).status).toBe(401);
  expect((await readAgentTrips({ DB: db, SCHNGN_AGENT_AUTH: auth })).status).toBe(403);
  auth.scopes = ['trips:read'];
  const response = await readAgentTrips({ DB: db, SCHNGN_AGENT_AUTH: auth });
  expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ trips: [] });
  const { helper, revoked } = provider();
  const revoke = createConnectionsHandler(identity);
  expect((await revoke(post({ grantId: 'grant_a' }), { DB: db, OAUTH_PROVIDER: helper })).status).toBe(200);
  expect(revoked).toEqual([['grant_a', 'user_alice']]);
  const revokedAccess = await readAgentTrips({ DB: db, SCHNGN_AGENT_AUTH: auth });
  expect(revokedAccess.status).toBe(401); expect(revokedAccess.headers.get('www-authenticate')).toContain('error="invalid_token"');
  expect((await readAgentTrips({ DB: db, SCHNGN_AGENT_AUTH: { ...auth, userId: 'user_bob' } })).status).toBe(200);
  const brokenDb = { prepare() { throw new Error('unavailable'); } };
  expect((await readAgentTrips({ DB: brokenDb, SCHNGN_AGENT_AUTH: auth })).status).toBe(503); sqlite.close();
});

test('MCP initializes through the real transport and never accepts hosted calculation tools', async () => {
  const { db, sqlite } = database();
  const env = { DB: db, SCHNGN_AGENT_AUTH: { userId: 'user_alice', clientId: 'client_a', grantId: 'grant_a', scopes: ['docs:read'] }, ASSETS: { async fetch(request: Request) { expect(request.url).toBe('https://schngn.com/agent-content/faq.md'); expect([...request.headers]).toEqual([]); return new Response('# Reviewed FAQ'); } } };
  const rpc = async (method: string, params: unknown) => handleRemoteMcp(new Request('https://schngn.com/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }), env);
  expect((await handleRemoteMcp(new Request('https://schngn.com/mcp', { headers: { Origin: 'https://attacker.example' } }), env)).status).toBe(403);
  const init = await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'security-test', version: '1' } });
  expect(init.status).toBe(200); expect((await init.json()).result.serverInfo.name).toBe('com.schngn/account');
  const docs = await (await rpc('tools/call', { name: 'read_schngn_guide', arguments: { topic: 'faq' } })).json();
  expect(docs.result.content[0].text).toBe('# Reviewed FAQ');
  const denied = await rpc('tools/call', { name: 'read_saved_schngn_trips', arguments: {} });
  expect(denied.status).toBe(403); expect(denied.headers.get('www-authenticate')).toContain('scope="trips:read"');
  const hosted = await (await rpc('tools/call', { name: 'calculate_schengen_usage', arguments: { trips: ['private-marker'] } })).json();
  expect(hosted.result.isError).toBe(true); expect(JSON.stringify(hosted)).not.toContain('private-marker');
  const invalid = await (await rpc('tools/call', { name: 'read_schngn_guide', arguments: { topic: 'https://attacker.example/private-marker' } })).json();
  expect(invalid.result.isError).toBe(true); expect(JSON.stringify(invalid)).not.toContain('private-marker'); sqlite.close();
});


test('saved-trip pages derive ownership from the grant and omit internal snapshot metadata', async () => {
  const { db, sqlite } = database();
  const trip = (id: string) => ({ id, label: id, status: 'booked', stays: [{ entryDate: '2026-09-01', exitDate: '2026-09-03' }] });
  const insert = sqlite.query("INSERT INTO account_trip_snapshots VALUES (?, 1, ?, '2026-09-10T10:00:00.000Z', 'account-sync-v2')");
  insert.run('user_alice', JSON.stringify(Array.from({ length: 26 }, (_, index) => trip(`alice-${index}`))));
  insert.run('user_bob', JSON.stringify([trip('bob-private')]));
  const env = { DB: db, SCHNGN_AGENT_AUTH: { userId: 'user_alice', clientId: 'client_a', grantId: 'grant_a', scopes: ['trips:read'] } };
  const first = await (await readAgentTrips(env)).json(); expect(first.trips).toHaveLength(25); expect(first.nextOffset).toBe(25);
  expect(Object.keys(first).sort()).toEqual(['nextOffset', 'trips']); expect(JSON.stringify(first)).not.toContain('bob-private');
  const last = await (await readAgentTrips(env, first.nextOffset)).json(); expect(last.trips).toHaveLength(1); expect(last.nextOffset).toBeUndefined();
  expect((await readAgentTrips(env, -1)).status).toBe(400); sqlite.close();
});

test('A2A returns stateless read-only messages and validates version, scope, data and capabilities', async () => {
  const { db, sqlite } = database();
  const env = { DB: db, SCHNGN_AGENT_AUTH: { userId: 'user_alice', clientId: 'client_a', grantId: 'grant_a', scopes: ['docs:read'] }, ASSETS: { async fetch() { return new Response('# Reviewed guide'); } } };
  const rpc = async (method: string, params: unknown = {}, version = '1.0') => (await handleA2a(new Request('https://schngn.com/a2a', { method: 'POST', headers: { 'Content-Type': 'application/json', 'A2A-Version': version }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }), env)).json();
  const message = { role: 'ROLE_USER', messageId: 'test', parts: [{ data: { operation: 'read_guide', topic: 'faq' } }] };
  const result = await rpc('SendMessage', { message }); expect(result.result.message.role).toBe('ROLE_AGENT'); expect(result.result.message.parts[0].data.markdown).toBe('# Reviewed guide');
  expect((await rpc('SendMessage', { message }, '0.3')).error.code).toBe(-32009);
  expect((await rpc('SendMessage', { message }, '')).error.code).toBe(-32009);
  const missing = await handleA2a(new Request('https://schngn.com/a2a?A2A-Version=1.0', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'SendMessage', params: { message } }) }), env);
  expect((await missing.json()).error.code).toBe(-32009);
  expect((await rpc('SendMessage', { message, configuration: { acceptedOutputModes: 9 } })).error.code).toBe(-32602);
  expect((await rpc('SendMessage', { message: { ...message, parts: [{ data: { operation: 'read_saved_trips' } }] } })).error).toBe('insufficient_scope');
  const rejected = await rpc('SendMessage', { message: { ...message, parts: [{ text: 'private dates 2026-01-01' }] } }); expect(rejected.error.code).toBe(-32005); expect(JSON.stringify(rejected)).not.toContain('2026-01-01');
  expect((await rpc('SendStreamingMessage')).error.code).toBe(-32004); expect((await rpc('GetTask', { id: 'unknown' })).error.code).toBe(-32001); expect((await rpc('ListTasks')).result.tasks).toEqual([]); sqlite.close();
});
