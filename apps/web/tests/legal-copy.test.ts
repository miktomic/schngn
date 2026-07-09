import { describe, expect, test } from 'bun:test';
import { FULL_DISCLAIMER_COPY, FOOTER_DISCLAIMER_COPY, OFFICIAL_SOURCE_LINKS } from '../src/lib/legal/legalCopy';

describe('fixed legal/disclaimer copy', () => {
  test('uses the approved fixed planning-aid copy without runtime legal advice language', () => {
    expect(FULL_DISCLAIMER_COPY).toContain('SCHNGN is a planning calculator, not legal advice and not a guarantee of entry.');
    expect(FULL_DISCLAIMER_COPY).toContain('residence permits, long-stay or national visas, bilateral waiver agreements');
    expect(FULL_DISCLAIMER_COPY).toContain('Always verify with official sources before booking or travelling.');
    expect(FOOTER_DISCLAIMER_COPY).toBe('Planning aid only. Not legal advice or a guarantee of entry. Verify with official sources.');
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
  });
});
