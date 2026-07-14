import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const wrangler = readFileSync('apps/web/wrangler.jsonc', 'utf8');
const robots = readFileSync('apps/web/static/robots.txt', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };

describe('canonical domain hygiene', () => {
  test('Cloudflare custom domains include apex and www', () => {
    expect(wrangler).toContain('"pattern": "schngn.com"');
    expect(wrangler).toContain('"pattern": "www.schngn.com"');
  });

  test('CI can configure Cloudflare-side www DNS and dynamic redirect idempotently', () => {
    expect(packageJson.scripts['cloudflare:canonical-www']).toBe('node scripts/configure-cloudflare-canonical-www.mjs');
    expect(existsSync('scripts/configure-cloudflare-canonical-www.mjs')).toBe(true);
    const source = readFileSync('scripts/configure-cloudflare-canonical-www.mjs', 'utf8');

    expect(source).toContain('CLOUDFLARE_API_TOKEN');
    expect(source).toContain("type: 'CNAME'");
    expect(source).toContain('proxied: true');
    expect(source).toContain('Workers-managed DNS for');
    expect(source).toContain('http_request_dynamic_redirect');
    expect(source).toContain('status_code: 308');
    expect(source).toContain('preserve_query_string: true');
    expect(source).toContain('http.request.uri.path');
    expect(source).not.toContain('console.log(token');
    expect(source).not.toContain('console.error(token');
  });

  test('server hook redirects www requests to the apex URL', () => {
    expect(existsSync('apps/web/src/hooks.server.ts')).toBe(true);
    const hook = readFileSync('apps/web/src/hooks.server.ts', 'utf8');

    expect(hook).toContain("event.url.hostname === 'www.schngn.com'");
    expect(hook).toContain("redirect(308");
    expect(hook).toContain("event.url.hostname = 'schngn.com'");

    const svelteConfig = readFileSync('apps/web/svelte.config.js', 'utf8');
    expect(svelteConfig).toContain("exclude: ['<build>', '<files>']");
    expect(svelteConfig).not.toContain("'<prerendered>'");
  });

  test('robots and sitemap advertise only apex canonical URLs', () => {
    expect(robots).toContain('Sitemap: https://schngn.com/sitemap.xml');
    expect(existsSync('apps/web/static/sitemap.xml')).toBe(true);

    const sitemap = readFileSync('apps/web/static/sitemap.xml', 'utf8');
    expect(sitemap).toContain('<loc>https://schngn.com/</loc>');
    expect(sitemap).toContain('<loc>https://schngn.com/app</loc>');
    expect(sitemap).toContain('<loc>https://schngn.com/accuracy</loc>');
    expect(sitemap).toContain('<loc>https://schngn.com/explainer</loc>');
    expect(sitemap).toContain('<loc>https://schngn.com/faq</loc>');
    expect(sitemap).toContain('<loc>https://schngn.com/contact</loc>');
    expect(sitemap).toContain('<loc>https://schngn.com/agents</loc>');
    expect(sitemap).not.toContain('www.schngn.com');
  });
});
