import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { rulesCatalogLengths, rulesUi } from '../src/lib/i18n/rulesUi';

describe('rules guidance', () => {
  test('ships complete guidance and four scenarios in every language', () => {
    const lengths = rulesCatalogLengths();
    expect(Object.keys(lengths).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    expect(new Set(Object.values(lengths)).size).toBe(1);
    for (const locale of SUPPORTED_LOCALES) {
      const copy = rulesUi(locale);
      expect(copy.scenarios).toHaveLength(4);
      expect(copy.scopeCopy.trim().length).toBeGreaterThan(40);
      for (const scenario of copy.scenarios) {
        expect(scenario.title.trim().length).toBeGreaterThan(0);
        expect(scenario.body.trim().length).toBeGreaterThan(20);
        expect(scenario.result.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('states the engine boundaries without presenting legal advice', () => {
    const copy = rulesUi('en');
    expect(copy.ordinaryCopy).toContain('previous 179 days');
    expect(copy.windowCopy).toContain('same-day visit');
    expect(copy.countingCopy).toContain('complete calendar days');
    expect(copy.overlapCopy).toContain('de-duplicated');
    expect(copy.scopeCopy).toContain('Residence permits');
    expect(copy.scopeCopy).toContain('official sources');
  });
});
