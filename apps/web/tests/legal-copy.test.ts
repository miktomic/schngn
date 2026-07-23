import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { OFFICIAL_SOURCE_LINKS, localizedLegalCopy, localizedOfficialSourceLinks } from '../src/lib/legal/legalCopy';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';

describe('fixed legal/disclaimer copy', () => {
  test('uses the approved fixed planning-aid copy without runtime legal advice language', () => {
    const english = localizedLegalCopy('en');
    expect(english.full).toContain('SCHNGN is a planning calculator, not legal advice and not a guarantee of entry.');
    expect(english.full).toContain('residence permits, long-stay or national visas, bilateral waiver agreements');
    expect(english.full).toContain('Always verify with official sources before booking or travelling.');
    expect(english.footer).toBe('Planning aid only. Not legal advice or a guarantee of entry. Verify with official sources.');
    expect(localizedLegalCopy('he').full).toContain('ולא ייעוץ משפטי או הבטחה לכניסה');
    for (const locale of SUPPORTED_LOCALES) {
      expect(localizedLegalCopy(locale).full.trim().length).toBeGreaterThan(80);
      expect(localizedLegalCopy(locale).footer.trim().length).toBeGreaterThan(10);
    }
    expect(localizedLegalCopy('uk').full).toContain('Тимчасовий захист');
  });

  test('keeps official source links explicit and non-endorsement-safe', () => {
    expect(OFFICIAL_SOURCE_LINKS).toEqual([
      {
        label: 'European Commission short-stay calculator',
        href: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en'
      },
      { label: 'Entry/Exit System information', href: 'https://travel-europe.europa.eu/en/ees' },
      { label: 'ETIAS information', href: 'https://travel-europe.europa.eu/en/etias' }
    ]);
    expect(localizedOfficialSourceLinks('he').map((source) => source.label)).toEqual([
      'מחשבון השהייה הקצרה של הנציבות האירופית',
      'מידע על מערכת הכניסה והיציאה',
      'מידע על ETIAS'
    ]);
    for (const locale of SUPPORTED_LOCALES) {
      expect(localizedOfficialSourceLinks(locale)).toHaveLength(3);
    }
  });

  test('keeps one shared footer disclaimer instead of repeating it inside the workspace', () => {
    const app = readFileSync('apps/web/src/routes/app/+page.svelte', 'utf8');
    const footer = readFileSync('apps/web/src/lib/design/SiteFooter.svelte', 'utf8');
    expect(app).not.toContain('class="disclaimer-notice"');
    expect(app).not.toContain('disclaimerNoticeVisible');
    expect(app).not.toContain('class="legal-footer"');
    expect(footer).toContain('class="footer-disclaimer"');
    expect(app).not.toContain("rt('officialSources')");
    expect(app).not.toContain('officialSourceLinks');
  });
});
