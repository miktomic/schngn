import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const ciDocs = readFileSync('docs/ci-cd.md', 'utf8');

describe('post-deploy smoke and privacy-safe operations', () => {
  test('root package exposes a production smoke command', () => {
    expect(packageJson.scripts['smoke:production']).toBe('node scripts/post-deploy-smoke.mjs');
  });

  test('production smoke script checks public routes, PWA assets, canonical domain, and privacy-safe waitlist payload', () => {
    expect(existsSync('scripts/post-deploy-smoke.mjs')).toBe(true);
    const source = readFileSync('scripts/post-deploy-smoke.mjs', 'utf8');

    for (const path of ['/', '/app', '/accuracy', '/manifest.json', '/service-worker.js', '/robots.txt', '/sitemap.xml']) {
      expect(source).toContain(path);
    }

    expect(source).toContain('smoke+');
    expect(source).toContain('@schngn.invalid');
    expect(source).toContain('tripDates');
    expect(source).toContain('www.schngn.com');
    expect(source).toContain('Sitemap: https://schngn.com/sitemap.xml');
  });

  test('GitHub Actions runs smoke checks after a production deploy', () => {
    expect(ci).toContain('Run production smoke checks');
    expect(ci).toContain('bun run smoke:production');
    expect(ci.indexOf('Deploy to Cloudflare Workers')).toBeLessThan(ci.indexOf('Run production smoke checks'));
  });

  test('CI/CD docs include the privacy-safe post-deploy runbook and rollback notes', () => {
    expect(ciDocs).toContain('## Post-deploy smoke and privacy-safe operations');
    expect(ciDocs).toContain('bun run smoke:production');
    expect(ciDocs).toContain('does not submit trip dates');
    expect(ciDocs).toContain('Rollback');
    expect(ciDocs).toContain('Cloudflare logs');
  });
});
