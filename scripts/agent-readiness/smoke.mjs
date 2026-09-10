import { assertAgentServicesHttp } from './services.mjs';
const VARY_ACCEPT = /(?:^|,)\s*accept\s*(?:,|$)/i;
import assert from 'node:assert/strict';
import { assertPublicHttp } from './http-contract.mjs';
import { createHash } from 'node:crypto';

const input = process.argv.slice(2).find((arg) => arg !== '--');
if (!input) throw new Error('Usage: bun run smoke:agent-readiness -- https://site.example');
const base = new URL(input);
async function get(path, options = {}) {
  return fetch(new URL(path, base), { redirect: 'follow', signal: AbortSignal.timeout(20000), ...options });
}
await assertPublicHttp(get);
const robotsResponse = await get('/robots.txt');
assert.equal(robotsResponse.status, 200);
assert.match(robotsResponse.headers.get('content-type') || '', /text\/plain/);
const robots = await robotsResponse.text();
assert.match(robots, /User-agent:/i);
assert.match(robots, /ai-input=yes/);
assert.match(robots, /Sitemap: https:\/\//);
assert.doesNotMatch(robots, /<!doctype|<html/i);
const sitemap = await get('/sitemap.xml');
assert.equal(sitemap.status, 200);
assert.match(sitemap.headers.get('content-type') || '', /xml/);
const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]));
assert.ok(urls.length > 0);
const indexResponse = await get('/.well-known/agent-skills/index.json');
assert.equal(indexResponse.status, 200);
assert.match(indexResponse.headers.get('content-type') || '', /application\/json/);
assert.equal(indexResponse.headers.get('access-control-allow-origin'), '*');
const index = await indexResponse.json();
assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
assert.ok(index.skills.length > 0);
for (const skill of index.skills) {
  const artifact = await get(skill.url);
  assert.equal(artifact.status, 200);
  assert.match(artifact.headers.get('content-type') || '', skill.type === 'archive' ? /gzip|octet-stream/ : /text\/(markdown|plain)/);
  assert.equal(skill.digest, `sha256:${createHash('sha256').update(Buffer.from(await artifact.arrayBuffer())).digest('hex')}`);
}
const catalog = await get('/.well-known/ai-catalog.json');
assert.equal(catalog.status, 200);
assert.equal(catalog.headers.get('access-control-allow-origin'), '*');
assert.ok((await catalog.json()).entries.length > 0);
// Check every public document. The SCHNGN client-only calculator is intentionally excluded.
const paths = ['/', ...urls.map((url) => url.pathname).filter((path) => !path.endsWith('/app'))];
for (const path of new Set(paths)) {
  const markdown = await get(path, { headers: { Accept: 'text/markdown' } });
  assert.equal(markdown.status, 200, path);
  assert.match(markdown.headers.get('content-type') || '', /text\/markdown/, path);
  assert.match(markdown.headers.get('vary') || '', VARY_ACCEPT, path);
  const body = await markdown.text();
  assert.ok(body.length > 100, path);
  assert.doesNotMatch(body, /<script|<!doctype html/i, path);
  const html = await get(path, { headers: { Accept: 'text/html' } });
  assert.equal(html.status, 200, path);
  assert.match(html.headers.get('content-type') || '', /text\/html/, path);
  assert.match(html.headers.get('vary') || '', VARY_ACCEPT, path);
}
for (const accept of ['text/html', 'text/markdown;q=0,text/html', 'text/markdown;q=0.1,text/html;q=1']) {
  const html = await get('/', { headers: { Accept: accept } });
  assert.match(html.headers.get('content-type') || '', /text\/html/);
  assert.match(html.headers.get('link') || '', /service-doc/);
}
// Runtime assets and account routes must still reach SvelteKit after dispatch changes.
const runtime = await get('/_app/env.js');
assert.equal(runtime.status, 200);
assert.match(runtime.headers.get('content-type') || '', /javascript/);
const account = await get('/api/account/trips', { headers: { Accept: 'text/markdown' } });
const local = ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
assert.ok(account.status === 401 || (local && account.status === 503));
assert.match(account.headers.get('content-type') || '', /application\/json/);
const denial = await account.json();
assert.equal(denial.error, account.status === 401 ? 'authentication_required' : 'authentication_unavailable');
const head = await get('/', { method: 'HEAD', headers: { Accept: 'text/markdown' } });
assert.equal(head.status, 200);
assert.match(head.headers.get('content-type') || '', /text\/markdown/);
assert.equal(await head.text(), '');
assert.equal((await get('/.well-known/agent-skills/not-a-real-skill/SKILL.md')).status, 404);
assert.equal((await get('/definitely-not-a-real-page-agent-audit')).status, 404);
await assertAgentServicesHttp(get, local);
console.log(`Agent readiness HTTP smoke passed: ${base.origin}, ${new Set(paths).size} public documents, HTML/Markdown/HEAD, discovery, CORS, integrity, and 404s.`);
