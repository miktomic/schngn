import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { handleMissingClientOnlyAnchor } from '../svelte.config.js';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { siteHeaderUi } from '../src/lib/i18n/siteHeaderUi';

const routePaths = [
  'apps/web/src/routes/+page.svelte',
  'apps/web/src/routes/app/+page.svelte',
  'apps/web/src/routes/accuracy/+page.svelte',
  'apps/web/src/routes/explainer/+page.svelte',
  'apps/web/src/routes/faq/+page.svelte',
  'apps/web/src/routes/contact/+page.svelte'
];

describe('common site header', () => {
  test('localizes every persistent navigation and account action', () => {
    expect(siteHeaderUi('en')).toEqual({
      navigation: 'Main navigation',
      calculator: 'Calculator',
      explainer: 'Explainer',
      faq: 'FAQs',
      contact: 'Contact',
      account: 'Account',
      signUp: 'Sign up',
      signUpAndSave: 'Sign up & save',
      login: 'Log in',
      logout: 'Log out',
      accountError: 'Account controls are temporarily unavailable.'
    });

    for (const locale of SUPPORTED_LOCALES) {
      for (const label of Object.values(siteHeaderUi(locale))) {
        expect(label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('is the one shared top-level header on every user-facing route', () => {
    const header = readFileSync('apps/web/src/lib/design/SiteHeader.svelte', 'utf8');
    for (const destination of ["'/app'", "'/explainer'", "'/faq'", "'/contact'"]) {
      expect(header).toContain(destination);
    }
    expect(header).toContain('accountPath');
    expect(header).toContain('<LanguageSelector');
    expect(header).toContain('copy.signUp');
    expect(header).toContain('copy.login');
    expect(header).toContain('copy.logout');

    for (const path of routePaths) {
      expect(readFileSync(path, 'utf8')).toContain('<SiteHeader');
    }
  });

  test('uses the global header as the calculator navigation without a second jump menu', () => {
    const app = readFileSync('apps/web/src/routes/app/+page.svelte', 'utf8');

    expect(app).not.toContain('<nav class="anchor-nav"');
    expect(app).not.toContain('id="app-anchor-select"');
    expect(app).toContain('id="timeline"');
    expect(app).toContain('id="trips"');
    expect(app).toContain('id="account"');
    expect(app).toContain("current={currentAnchor === 'account' ? 'account' : 'calculator'}");
  });

  test('keeps prerender anchor validation strict outside the hydrated account view', () => {
    const details = { id: 'account', referrers: ['/'], message: 'missing anchor' };

    expect(() => handleMissingClientOnlyAnchor({ ...details, path: '/app' })).not.toThrow();
    for (const locale of SUPPORTED_LOCALES.filter((candidate) => candidate !== 'en')) {
      expect(() => handleMissingClientOnlyAnchor({ ...details, path: `/${locale}/app` })).not.toThrow();
    }
    expect(() => handleMissingClientOnlyAnchor({ ...details, path: '/faq' })).toThrow('missing anchor');
    expect(() => handleMissingClientOnlyAnchor({ ...details, id: 'timeline', path: '/app' })).toThrow('missing anchor');
  });
});
