import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { resourceTopbarUi } from '../src/lib/i18n/resourceTopbarUi';

describe('resource topbar localization', () => {
  test('uses a compact Day Calculator label in every language', () => {
    expect(resourceTopbarUi('en').dayCalculator).toBe('Day Calculator');

    for (const locale of SUPPORTED_LOCALES) {
      expect(resourceTopbarUi(locale).dayCalculator.trim().length).toBeGreaterThan(0);
      if (locale !== 'en') expect(resourceTopbarUi(locale).dayCalculator).not.toBe('Day Calculator');
    }
  });
});
