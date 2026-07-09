import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('apps/web/static/manifest.json', 'utf8')) as {
  name: string;
  short_name: string;
  start_url: string;
  scope?: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons?: { src: string; sizes: string; type: string; purpose?: string }[];
};

const layoutSource = readFileSync('apps/web/src/routes/+layout.svelte', 'utf8');

describe('installable offline PWA shell', () => {
  test('manifest has installable app metadata and maskable icons', () => {
    expect(manifest.name).toBe('SCHNGN — Schengen 90/180 Calculator');
    expect(manifest.short_name).toBe('SCHNGN');
    expect(manifest.start_url).toBe('/app');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0f2a4a');
    expect(manifest.background_color).toBe('#eef4f8');
    expect(manifest.icons?.some((icon) => icon.src === '/icons/icon-192.png' && icon.sizes === '192x192' && icon.purpose?.includes('maskable'))).toBe(true);
    expect(manifest.icons?.some((icon) => icon.src === '/icons/icon-512.png' && icon.sizes === '512x512' && icon.purpose?.includes('maskable'))).toBe(true);
    expect(existsSync('apps/web/static/icons/icon-192.png')).toBe(true);
    expect(existsSync('apps/web/static/icons/icon-512.png')).toBe(true);
  });

  test('layout registers the offline service worker only in browsers', () => {
    expect(layoutSource).toContain("import { browser } from '$app/environment'");
    expect(layoutSource).toContain('navigator.serviceWorker.register');
    expect(layoutSource).toContain('/service-worker.js');
  });

  test('service worker caches the calculator shell and uses runtime cache fallback', () => {
    const source = readFileSync('apps/web/static/service-worker.js', 'utf8');

    expect(source).toContain("'/app'");
    expect(source).toContain("'/manifest.json'");
    expect(source).toContain('SCHNGN_STATIC_CACHE');
    expect(source).toContain('SCHNGN_RUNTIME_CACHE');
    expect(source).toContain('event.respondWith');
    expect(source).toContain('caches.match(request)');
  });
});
