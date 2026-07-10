import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { reroute } from '../src/hooks';
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  localeDirection,
  localeFromPath,
  localizedPath,
  localizedUrl,
  stripLocalePrefix
} from '../src/lib/i18n';
import { createAppUiTranslator } from '../src/lib/i18n/appUi';
import { appDeepCatalogLengths, createAppDeepUiTranslator } from '../src/lib/i18n/appDeepUi';
import { createTranslator } from '../src/lib/i18n';

describe('whole-site localization', () => {
  test('supports all approved locales and both RTL languages', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'fr', 'de', 'es', 'it', 'ru', 'tr', 'he', 'ar']);
    expect(localeDirection('he')).toBe('rtl');
    expect(localeDirection('ar')).toBe('rtl');
    for (const locale of SUPPORTED_LOCALES.filter((candidate) => !['he', 'ar'].includes(candidate))) {
      expect(localeDirection(locale)).toBe('ltr');
    }
    expect(Object.keys(LOCALE_LABELS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  test('builds shareable localized URLs without changing queries or hashes', () => {
    expect(localeFromPath('/he/app')).toBe('he');
    expect(localeFromPath('/app')).toBe('en');
    expect(stripLocalePrefix('/ar/accuracy')).toBe('/accuracy');
    expect(localizedPath('/ru/app', 'fr')).toBe('/fr/app');
    expect(localizedPath('/de', 'en')).toBe('/');
    expect(localizedUrl(new URL('https://schngn.com/he/app?section=planner#result'), 'tr')).toBe('/tr/app?section=planner#result');
  });

  test('reroutes locale-prefixed pages to the existing SvelteKit routes', async () => {
    expect(await reroute({ url: new URL('https://schngn.com/fr/app?section=planner'), fetch } as never)).toBe('/app');
    expect(await reroute({ url: new URL('https://schngn.com/ar/accuracy'), fetch } as never)).toBe('/accuracy');
  });

  test('keeps hooks resolvable before SvelteKit generates path aliases in clean CI', () => {
    for (const hookPath of ['apps/web/src/hooks.ts', 'apps/web/src/hooks.server.ts']) {
      const source = readFileSync(hookPath, 'utf8');
      expect(source).toContain("from './lib/i18n'");
      expect(source).not.toContain("from '$lib/i18n'");
    }
  });

  test('ships complete public, core, and deep app catalogs for every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(createTranslator(locale)('landing.primaryAction').trim().length).toBeGreaterThan(0);
      expect(createTranslator(locale)('accuracy.hero').trim().length).toBeGreaterThan(0);
      expect(createAppUiTranslator(locale)('navOverview').trim().length).toBeGreaterThan(0);
      expect(createAppUiTranslator(locale)('accountReady').trim().length).toBeGreaterThan(0);
      expect(createAppDeepUiTranslator(locale)('waitlistTitle').trim().length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(appDeepCatalogLengths())).size).toBe(1);
    expect(appDeepCatalogLengths().en).toBeGreaterThan(80);
  });

  test('keeps localized navigation offline-safe and declares language alternates', () => {
    const worker = readFileSync('apps/web/static/service-worker.js', 'utf8');
    const landing = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');
    expect(worker).toContain("'he', 'ar'");
    expect(worker).toContain('localizedAppPath');
    expect(landing).toContain('hreflang="x-default"');
  });
});
