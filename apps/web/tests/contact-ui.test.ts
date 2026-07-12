import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { contactUi, contactUiCatalogLengths } from '../src/lib/i18n/contactUi';

describe('contact page localization', () => {
  test('ships a complete contact form in every supported language', () => {
    expect(new Set(Object.values(contactUiCatalogLengths()))).toEqual(new Set([25]));
    for (const locale of SUPPORTED_LOCALES) {
      const copy = contactUi(locale);
      for (const value of Object.values(copy)) expect(value.trim().length).toBeGreaterThan(0);
      if (locale !== 'en') expect(copy.intro).not.toBe(contactUi('en').intro);
    }
  });

  test('explains the narrow data boundary and sensitive-data warning', () => {
    const copy = contactUi('en');
    expect(copy.privacy).toContain('Trip history is never attached automatically');
    expect(copy.messageHelp).toContain('Do not send passport, visa');
  });
});
