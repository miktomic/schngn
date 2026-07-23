import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const ciDocs = readFileSync('docs/ci-cd.md', 'utf8');

describe('post-deploy smoke and privacy-safe operations', () => {
  test('root package exposes a production smoke command', () => {
    expect(packageJson.scripts['smoke:production']).toBe('node scripts/post-deploy-smoke.mjs');
  });

  test('production smoke script checks public routes, PWA assets, canonical domain, and anonymous account boundaries', () => {
    expect(existsSync('scripts/post-deploy-smoke.mjs')).toBe(true);
    const source = readFileSync('scripts/post-deploy-smoke.mjs', 'utf8');

    for (const path of [
      '/',
      '/app',
      '/accuracy',
      '/explainer',
      '/faq',
      '/contact',
      '/agents',
      '/privacy',
      '/terms',
      '/manifest.json',
      '/service-worker.js',
      '/favicon.png',
      '/brand/schngn-wordmark.png',
      '/brand/schngn-social.png',
      '/icons/icon-maskable-512.png',
      '/robots.txt',
      '/sitemap.xml'
    ]) {
      expect(source).toContain(path);
    }

    expect(source).toContain('SCHNGN_SMOKE_EXPECT_WWW_REDIRECT');
    expect(source).not.toContain('/api/waitlist');
    expect(source).not.toContain('SCHNGN_SMOKE_EXPECT_WAITLIST_STORAGE');
    expect(source).not.toContain('production-smoke@schngn.invalid');
    expect(source).toContain('www.schngn.com');
    expect(source).toContain('Sitemap: https://schngn.com/sitemap.xml');
    expect(source).toContain('x-content-type-options');
    expect(source).toContain('permissions-policy');
    expect(source).toContain("response.headers.get('content-security-policy')");
    expect(source).toContain('SvelteKit-generated document Content-Security-Policy');
    expect(source).toContain('script-src must contain a SvelteKit nonce or SHA-256 hash');
    expect(source).toContain('https://clerk.schngn.com');
    expect(source).toContain('https://plausible.io');
    expect(source).toContain('clerk.accounts.dev');
    expect(source).toContain("'/api/account/trips'");
    expect(source).toContain("'/api/account'");
    expect(source).toContain("method: 'PUT'");
    expect(source).toContain("method: 'DELETE'");
    expect(source).toContain('expected 401');
    expect(source).toContain("response.headers.get('cache-control')");
    expect(source).toContain("response.headers.get('vary')");
    expect(source).toContain('no-store and Vary: *');
    expect(source).toContain('consent: true');
    expect(source).toContain('trips: []');
    expect(source).not.toContain('clerkUserId');
  });

  test('GitHub Actions runs smoke checks after a production deploy', () => {
    expect(ci).toContain('Run production smoke checks');
    expect(ci).toContain('bun run smoke:production');
    expect(ci.indexOf('Deploy to Cloudflare Workers')).toBeLessThan(ci.indexOf('Run production smoke checks'));
  });

  test('GitHub Actions applies D1 migrations and gates changes with Playwright', () => {
    expect(ci).toContain('Install Playwright browser');
    expect(ci).toContain('bunx playwright install --with-deps chromium');
    expect(ci).toContain('bun run test:e2e');
    expect(ci).toContain('Provision Cloudflare resources without changing production traffic');
    expect(ci).toContain('wrangler versions upload');
    expect(ci).toContain('--secrets-file');
    expect(ci).toContain('Apply D1 migrations');
    expect(ci).toContain('bun run d1:migrate:remote');
    expect(ci).toContain('wrangler deploy');
    expect(ci).toContain('Remove inactive Worker bindings');
    expect(ci).toContain('Remove deployment Worker bindings');
    expect(ci.indexOf('Provision Cloudflare resources without changing production traffic')).toBeLessThan(ci.indexOf('Apply D1 migrations'));
    expect(ci.indexOf('Remove inactive Worker bindings')).toBeLessThan(ci.indexOf('Apply D1 migrations'));
    expect(ci.indexOf('Apply D1 migrations')).toBeLessThan(ci.indexOf('Deploy to Cloudflare Workers'));
    expect(ci.indexOf('Deploy to Cloudflare Workers')).toBeLessThan(ci.indexOf('Remove deployment Worker bindings'));
    expect(ci.indexOf('Apply D1 migrations')).toBeLessThan(ci.indexOf('Run production smoke checks'));
  });

  test('CI/CD docs include the privacy-safe post-deploy runbook and rollback notes', () => {
    expect(ciDocs).toContain('## Post-deploy smoke and privacy-safe operations');
    expect(ciDocs).toContain('bun run smoke:production');
    expect(ciDocs).toContain('contact endpoint accepts only user-entered support fields');
    expect(ciDocs).toContain('signup is delegated to Clerk');
    expect(ciDocs).toContain('Rollback');
    expect(ciDocs).toContain('Cloudflare logs');
  });
});
