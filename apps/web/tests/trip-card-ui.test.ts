import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES, intlLocale } from '../src/lib/i18n';
import {
  createTripCardUiTranslator,
  formatTripCardOverage,
  formatTripCardToggleLabel,
  tripCardCatalogLengths
} from '../src/lib/i18n/tripCardUi';

describe('trip card localization', () => {
  test('ships the complete card catalog in every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const translate = createTripCardUiTranslator(locale);
      expect(translate('timelineLabel').trim().length).toBeGreaterThan(0);
      expect(translate('completed').trim().length).toBeGreaterThan(0);
      expect(translate('expandAction').trim().length).toBeGreaterThan(0);
      expect(translate('collapseAction').trim().length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(tripCardCatalogLengths())).size).toBe(1);
  });

  test('describes completed overages as historical facts, not future warnings', () => {
    expect(formatTripCardOverage('en', 1, true)).toBe('Completed · 1 day over at the time');
    expect(formatTripCardOverage('en', 2, true)).toBe('Completed · 2 days over at the time');
    expect(formatTripCardOverage('fr', 2, true)).toContain('à ce moment-là');
    expect(formatTripCardOverage('de', 2, true)).toContain('damals');
    expect(formatTripCardOverage('es', 2, true)).toContain('en ese momento');
    expect(formatTripCardOverage('it', 2, true)).toContain('in quel momento');
    expect(formatTripCardOverage('ru', 2, true)).toContain('на тот момент');
    expect(formatTripCardOverage('tr', 2, true)).toContain('o tarihte');
    expect(formatTripCardOverage('he', 2, true)).toContain('באותו זמן');
    expect(formatTripCardOverage('ar', 2, true)).toContain('في ذلك الوقت');
  });

  test('keeps current and future overages direct and localizes their counts', () => {
    expect(formatTripCardOverage('en', 1, false)).toBe('1 day over the limit');
    expect(formatTripCardOverage('en', 2, false)).toBe('2 days over the limit');
    expect(formatTripCardOverage('he', 2, false)).toContain('יומיים');
    expect(formatTripCardOverage('ar', 2, false)).toContain('يومان');
    expect(formatTripCardOverage('ar', 3, false)).toContain(new Intl.NumberFormat(intlLocale('ar')).format(3));
  });

  test('uses completed alone for an in-limit completed trip and no warning for an in-limit active trip', () => {
    expect(formatTripCardOverage('en', 0, true)).toBe('Completed');
    expect(formatTripCardOverage('en', 0, false)).toBe('');
  });

  test('provides localized expand and collapse labels that retain the trip name', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(formatTripCardToggleLabel(locale, 'Barcelona', false)).toContain('Barcelona');
      expect(formatTripCardToggleLabel(locale, 'Barcelona', true)).toContain('Barcelona');
      expect(formatTripCardToggleLabel(locale, 'Barcelona', false))
        .not.toBe(formatTripCardToggleLabel(locale, 'Barcelona', true));
    }
    expect(formatTripCardToggleLabel('en', 'Barcelona', false)).toBe('Expand Barcelona to edit this trip');
    expect(formatTripCardToggleLabel('en', 'Barcelona', true)).toBe('Collapse Barcelona trip editor');
    expect(createTripCardUiTranslator('en')('expandAction')).toBe('Expand');
    expect(createTripCardUiTranslator('en')('collapseAction')).toBe('Collapse');
  });
});
