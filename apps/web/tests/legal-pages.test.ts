import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { legalFooterUi } from '../src/lib/i18n/legalFooterUi';
import { privacyUi, termsUi } from '../src/lib/i18n/legalUi';

const privacyPath = 'apps/web/src/routes/privacy/+page.svelte';
const termsPath = 'apps/web/src/routes/terms/+page.svelte';

function flattenCopy(copy: ReturnType<typeof privacyUi>): string {
  return [
    copy.title,
    copy.intro,
    ...copy.summaryItems,
    ...copy.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.items ?? [])
    ])
  ].join(' ');
}

describe('privacy policy and terms', () => {
  test('ships public localized legal pages with canonical metadata', () => {
    expect(existsSync(privacyPath)).toBe(true);
    expect(existsSync(termsPath)).toBe(true);

    for (const [path, route] of [[privacyPath, '/privacy'], [termsPath, '/terms']] as const) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('rel="canonical"');
      expect(source).toContain('hreflang="x-default"');
      expect(source).toContain('SUPPORTED_LOCALES');
      expect(source).toContain(`localizedPath('${route}', locale)`);
      expect(source).toContain('localeFromPath(page.url.pathname)');
      expect(source).toContain('<SiteHeader');
      expect(source).toContain('<LegalDocument');
    }
  });

  test('keeps legal links in the shared footer and out of the header', () => {
    const layout = readFileSync('apps/web/src/routes/+layout.svelte', 'utf8');
    const footer = readFileSync('apps/web/src/lib/design/SiteFooter.svelte', 'utf8');
    const header = readFileSync('apps/web/src/lib/design/SiteHeader.svelte', 'utf8');

    expect(layout).toContain('<SiteFooter');
    expect(footer).toContain("localizedPath('/privacy', locale)");
    expect(footer).toContain("localizedPath('/terms', locale)");
    expect(footer).toContain("localizedPath('/contact', locale)");
    expect(footer).toContain("from '$lib/i18n/legalFooterUi'");
    expect(footer).not.toContain("from '$lib/i18n/legalUi'");
    expect(footer).toContain('class="footer-main"');
    expect(footer).toContain('background: var(--ink)');
    expect(footer).not.toContain('Cookie Preferences');
    expect(header).not.toContain("localizedPath('/privacy', locale)");
    expect(header).not.toContain("localizedPath('/terms', locale)");

    expect(legalFooterUi('en')).toMatchObject({
      contact: 'Support center',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      copyright: '© 2026 SCHNGN. All rights reserved.'
    });

    for (const locale of SUPPORTED_LOCALES) {
      const copy = legalFooterUi(locale);
      expect(copy.navigation.trim().length).toBeGreaterThan(0);
      expect(copy.privacy.trim().length).toBeGreaterThan(0);
      expect(copy.terms.trim().length).toBeGreaterThan(0);
      expect(copy.contact.trim().length).toBeGreaterThan(0);
    }
  });

  test('provides complete fixed policy copy in every supported locale', () => {
    const englishPrivacy = privacyUi('en');
    const englishTerms = termsUi('en');

    expect(englishPrivacy.sections).toHaveLength(10);
    expect(englishTerms.sections).toHaveLength(9);

    for (const locale of SUPPORTED_LOCALES) {
      const privacy = privacyUi(locale);
      const terms = termsUi(locale);

      expect(privacy.sections.map((section) => section.id)).toEqual(
        englishPrivacy.sections.map((section) => section.id)
      );
      expect(terms.sections.map((section) => section.id)).toEqual(
        englishTerms.sections.map((section) => section.id)
      );
      expect(privacy.updatedDate).toBe('2026-07-14');
      expect(terms.updatedDate).toBe('2026-07-14');
      expect(privacy.providerLinks?.map((provider) => provider.url)).toEqual(
        englishPrivacy.providerLinks?.map((provider) => provider.url)
      );

      for (const copy of [privacy, terms]) {
        expect(copy.title.trim().length).toBeGreaterThan(0);
        expect(copy.metaDescription.trim().length).toBeGreaterThan(40);
        expect(copy.intro.trim().length).toBeGreaterThan(60);
        expect(copy.summaryItems.length).toBeGreaterThanOrEqual(3);
        for (const section of copy.sections) {
          expect(section.title.trim().length).toBeGreaterThan(0);
          expect(section.paragraphs.length).toBeGreaterThan(0);
          for (const paragraph of section.paragraphs) {
            expect(paragraph.trim().length).toBeGreaterThan(30);
          }
        }
      }

      if (locale !== 'en') {
        expect(privacy.title).not.toBe(englishPrivacy.title);
        expect(terms.title).not.toBe(englishTerms.title);
      }
    }
  });

  test('discloses the real account, Google, storage, analytics, and support boundaries', () => {
    const privacy = flattenCopy(privacyUi('en'));
    for (const required of [
      'Google',
      'Clerk',
      'Cloudflare D1',
      'Plausible',
      'Turnstile',
      'support@schngn.com',
      'trip dates',
      'delete',
      'export'
    ]) {
      expect(privacy).toContain(required);
    }
    expect(privacy).toContain('does not sell');
    expect(privacy).toContain('Gmail');
    expect(privacy).toContain('Google Drive');
    expect(privacy).toContain('Only the Clerk user ID');
    expect(privacy).toContain('Clerk loads on public SCHNGN pages');
    expect(privacy).toContain('not included in the support email');
    expect(privacy).toContain('active for 30 days');
    expect(privacy).toContain('no fixed deletion period is currently promised');
    expect(privacy).toContain('trip fingerprint');
    expect(privacy).not.toContain('used only to create, secure and authenticate');

    const terms = flattenCopy(termsUi('en'));
    expect(terms).toContain('not legal advice');
    expect(terms).toContain('not a guarantee of entry');
    expect(terms).toContain('official sources');
    expect(terms).toContain('mandatory consumer rights');
  });
});
