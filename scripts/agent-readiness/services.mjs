import assert from 'node:assert/strict';
// Invoked against the final deployable Worker and the live canonical origin.
export async function assertAgentServicesHttp(get, local) {
  const server = await get('/.well-known/oauth-authorization-server');
  assert.equal(server.status, 200); assert.match(server.headers.get('content-type') || '', /application\/json/);
  const auth = await server.json();
  assert.equal(auth.issuer, 'https://schngn.com');
  assert.equal(auth.authorization_endpoint, 'https://schngn.com/agent/authorize');
  assert.equal(auth.token_endpoint, 'https://schngn.com/oauth/token');
  assert.equal(auth.registration_endpoint, 'https://schngn.com/oauth/register');
  assert.ok(auth.code_challenge_methods_supported.includes('S256'));
  assert.ok(!auth.code_challenge_methods_supported.includes('plain'));
  assert.equal(auth.agent_auth, undefined, 'Do not advertise unimplemented WorkOS grants');
  const resource = await (await get('/.well-known/oauth-protected-resource')).json();
  assert.equal(resource.resource, 'https://schngn.com'); assert.deepEqual(resource.scopes_supported, ['docs:read', 'trips:read']);
  const catalogResponse = await get('/.well-known/api-catalog');
  assert.match(catalogResponse.headers.get('content-type') || '', /application\/linkset\+json/);
  const catalog = await catalogResponse.json();
  for (const entry of catalog.linkset) {
    assert.equal(new URL(entry.anchor).origin, 'https://schngn.com');
    for (const relation of ['service-desc', 'service-doc']) for (const link of entry[relation]) {
      const url = new URL(link.href); assert.equal(url.origin, 'https://schngn.com');
      const response = await get(url.pathname); assert.equal(response.status, 200, link.href); assert.match(response.headers.get('content-type') || '', /json|markdown/);
      assert.doesNotMatch(await response.text(), /<!doctype html|<html/i);
    }
  }
  const mcp = await (await get('/mcp/server-card')).json(); const legacy = await (await get('/.well-known/mcp/server-card.json')).json();
  assert.deepEqual(legacy.serverInfo, { name: mcp.name, version: mcp.version }); assert.equal(legacy.endpoint, mcp.remotes[0].url); assert.deepEqual(legacy.capabilities, { tools: {}, resources: {} }); assert.equal(mcp.name, 'com.schngn/account'); assert.equal(mcp.remotes[0].url, 'https://schngn.com/mcp');
  assert.ok(mcp.remotes[0].supportedProtocolVersions.includes('2025-11-25'));
  const a2a = await (await get('/.well-known/agent-card.json')).json(); assert.equal(a2a.supportedInterfaces[0].url, 'https://schngn.com/a2a'); assert.equal(a2a.supportedInterfaces[0].protocolVersion, '1.0'); assert.equal(a2a.capabilities.streaming, false);
  assert.deepEqual(a2a.securityRequirements, [{ schemes: { oauth: { list: ['docs:read'] } } }, { schemes: { oauth: { list: ['trips:read'] } } }]);
  assert.equal(a2a.securitySchemes.oauth.oauth2SecurityScheme.flows.authorizationCode.pkceRequired, true);
  assert.equal((await get('/mcp', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  const openapi = await (await get('/openapi.json')).json(); assert.equal(openapi.openapi, '3.1.0'); assert.deepEqual(Object.keys(openapi.paths['/api/agent/trips']), ['get']);
  for (const endpoint of ['/mcp', '/api/agent/trips', '/a2a']) {
    const response = await get(endpoint, { headers: { Accept: 'application/json' } }); assert.equal(response.status, 401, endpoint); assert.match(response.headers.get('www-authenticate') || '', /oauth-protected-resource/); assert.match(response.headers.get('cache-control') || '', /no-store/);
  }
  for (const path of ['/agent/authorize', '/agent/connections', '/fr/agent/authorize', '/ar/agent/connections']) {
    const page = await get(path); assert.equal(page.status, 200, path); assert.match(page.headers.get('cache-control') || '', /no-store/); assert.match(page.headers.get('x-robots-tag') || '', /noindex/); assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  }
  const authDoc = await get('/auth.md'); assert.equal(authDoc.status, 200); assert.match(authDoc.headers.get('content-type') || '', /text\/markdown/); assert.match(await authDoc.text(), /S256 PKCE/);
  if (local) {
    // Synthetic ephemeral public client exercises the production provider/KV in workerd, never a live account.
    const registered = await get('/oauth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'Local final-build check', redirect_uris: ['http://127.0.0.1:8799/callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code'], response_types: ['code'] }) });
    assert.equal(registered.status, 201); const client = await registered.json(); assert.equal(typeof client.client_id, 'string'); assert.equal(client.client_secret, undefined);
  }
}
