import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const wrangler = readFileSync('apps/web/wrangler.jsonc', 'utf8');
const robots = readFileSync('apps/web/static/robots.txt', 'utf8');

describe('canonical domain hygiene', () => {
  test('Cloudflare custom domains include apex and www', () => {
    expect(wrangler).toContain('"pattern": "schngn.com"');
    expect(wrangler).toContain('"pattern": "www.schngn.com"');
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
    expect(sitemap).not.toContain('www.schngn.com');
  });
});
