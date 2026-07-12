import { describe, expect, test } from 'bun:test';
import {
  EU_COUNTRIES_OUTSIDE_SCHENGEN,
  EU_SCHENGEN_COUNTRY_CODES,
  NEWEST_SCHENGEN_COUNTRY_CODES,
  NON_EU_SCHENGEN_COUNTRY_CODES,
  SCHENGEN_SHORT_STAY_COUNTRY_CODES
} from '../src/lib/trips/countries';
import { SUPPORTED_LOCALES } from '../src/lib/i18n/locales';
import { countryGuideUi, countryGuideUiFieldCounts } from '../src/lib/i18n/countryGuideUi';

describe('Schengen country guide', () => {
  test('classifies every current member without confusing EU and Schengen membership', () => {
    expect(SCHENGEN_SHORT_STAY_COUNTRY_CODES).toHaveLength(29);
    expect(EU_SCHENGEN_COUNTRY_CODES).toHaveLength(25);
    expect(NON_EU_SCHENGEN_COUNTRY_CODES).toEqual(['IS', 'LI', 'NO', 'CH']);
    expect(EU_COUNTRIES_OUTSIDE_SCHENGEN).toEqual(['IE', 'CY']);
    expect(NEWEST_SCHENGEN_COUNTRY_CODES).toEqual(['BG', 'RO']);

    expect(new Set([...EU_SCHENGEN_COUNTRY_CODES, ...NON_EU_SCHENGEN_COUNTRY_CODES])).toEqual(
      new Set(SCHENGEN_SHORT_STAY_COUNTRY_CODES)
    );
  });

  test('ships the complete guide copy in every supported locale', () => {
    const expectedFieldCount = countryGuideUiFieldCounts().en;

    for (const locale of SUPPORTED_LOCALES) {
      expect(countryGuideUiFieldCounts()[locale]).toBe(expectedFieldCount);
      const copy = countryGuideUi(locale);
      expect(copy.title.trim()).not.toBe('');
      expect(copy.nonEuTitle.trim()).not.toBe('');
      expect(copy.outsideTitle.trim()).not.toBe('');
      expect(copy.officialSource.trim()).not.toBe('');
    }
  });
});
