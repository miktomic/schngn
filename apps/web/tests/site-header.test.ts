import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
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
    expect(header).toContain('<LanguageSelector');
    expect(header).toContain('copy.signUp');
    expect(header).toContain('copy.login');
    expect(header).toContain('copy.logout');

    for (const path of routePaths) {
      expect(readFileSync(path, 'utf8')).toContain('<SiteHeader');
    }
  });

  test('keeps resource links in the global header and only workspace anchors in the calculator jump navigation', () => {
    const app = readFileSync('apps/web/src/routes/app/+page.svelte', 'utf8');
    const anchorNav = app.match(/<nav class="anchor-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';

    expect(anchorNav).toContain("singlePage('timeline')");
    expect(anchorNav).toContain("singlePage('trips')");
    expect(anchorNav).toContain("singlePage('account')");
    expect(anchorNav).not.toContain("singlePage('explainer')");
    expect(anchorNav).not.toContain("singlePage('faq')");
    expect(anchorNav).not.toContain('contactCopy.nav');
  });
});
