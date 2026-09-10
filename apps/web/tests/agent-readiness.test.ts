import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { agentResponse, wantsMarkdown } from '../agent-readiness/negotiate.mjs';
import { toMarkdown } from '../../../scripts/agent-readiness/markdown.mjs';

describe('public agent representations', () => {
  test('honors media preferences and explicit exclusions', () => {
    for (const accept of ['', '*/*', 'text/html', 'text/markdown;q=0', 'text/markdown;q=0.2,text/html', 'text/markdown;q=NaN']) expect(wantsMarkdown(accept)).toBe(false);
    expect(wantsMarkdown('text/markdown ; q=1, text/html;q=0')).toBe(true);
    expect(wantsMarkdown('text/markdown;q=0.5,text/html;q=0.1,text/html;q=1')).toBe(false);
    for (const accept of ['text/markdown', 'text/markdown,text/html;q=0.5', 'TEXT/MARKDOWN; q=1']) expect(wantsMarkdown(accept)).toBe(true);
  });
  test('preserves reviewed content and absolute links but removes executable/hidden content', () => {
    const result = toMarkdown('<html><head><title>Guide</title></head><body><main><h2>Reviewed</h2><p>Not legal advice.</p><a href="/faq">FAQ</a><script>private()</script><p hidden>hidden</p></main><footer>Footer limitation.</footer></body></html>', 'https://schngn.com/agents');
    expect(result).toContain('## Reviewed');
    expect(result).toContain('Not legal advice.');
    expect(result).toContain('Footer limitation.');
    expect(result).toContain('https://schngn.com/faq');
    expect(result).not.toContain('private()');
    expect(result).not.toContain('hidden');
  });
  test('fetches only public build artifacts, without forwarding private input', async () => {
    let assetRequest: Request | undefined;
    const env = { ASSETS: { fetch: async (request: Request) => { assetRequest = request; return new Response('# Public'); } } };
    const result = await agentResponse(new Request('https://schngn.com/?trip=private', { headers: { Accept: 'text/markdown', Cookie: 'private', Authorization: 'private' } }), env, () => new Response('HTML'), { '/': '/agent-content/index.md' });
    expect(assetRequest!.url).toBe('https://schngn.com/agent-content/index.md');
    expect([...assetRequest!.headers]).toEqual([]);
    expect(result.headers.get('Content-Type')).toContain('text/markdown');
    expect(result.headers.get('Vary')).toContain('Accept');
    expect(await result.text()).toBe('# Public');
  });
  test('never intercepts account, unknown routes, or write operations', async () => {
    const env = { ASSETS: { fetch: () => { throw new Error('must not read'); } } };
    for (const [path, method] of [['/api/account/trips', 'GET'], ['/app', 'GET'], ['/', 'POST'], ['/missing', 'GET']]) {
      const result = await agentResponse(new Request(`https://schngn.com${path}`, { method, headers: { Accept: 'text/markdown' } }), env, () => new Response('original', { status: 401 }), { '/': '/agent-content/index.md' });
      expect(result.status).toBe(401);
    }
  });
});


test('all public source routes remain discoverable in the sitemap', () => {
  const routes = resolve(import.meta.dir, '../src/routes');
  const sitemap = readFileSync(resolve(import.meta.dir, '../static/sitemap.xml'), 'utf8');
  for (const file of readdirSync(routes, { recursive: true })) {
    if (typeof file !== 'string' || !file.endsWith('+page.svelte')) continue;
    const path = '/' + file.replace(/\/?\+page\.svelte$/, '');
    // Private consent and connection-management screens must never enter the public sitemap.
    if (['/app', '/agent/authorize', '/agent/connections'].includes(path)) {
      if (path.startsWith('/agent/')) expect(sitemap).not.toContain(`<loc>https://schngn.com${path}</loc>`);
      continue;
    }
    expect(sitemap).toContain(`<loc>https://schngn.com${path}</loc>`);
  }
});
