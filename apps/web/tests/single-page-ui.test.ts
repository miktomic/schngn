import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import {
  createSinglePageUiTranslator,
  singlePageCatalogLengths,
  type SinglePageUiKey
} from '../src/lib/i18n/singlePageUi';

const keys: SinglePageUiKey[] = [
  'skipToContent',
  'jumpTo',
  'answer',
  'trips',
  'timeline',
  'plan',
  'details',
  'report',
  'account',
  'addPreviousTrip',
  'noPreviousTrips',
  'historyAssumption',
  'savedResult',
  'unsavedPreview',
  'currentTrips',
  'olderTrips',
  'showOlder',
  'hideOlder',
  'planNextTrip',
  'detailsSummary',
  'reportSummary',
  'accountSummary',
  'expand',
  'collapse'
];

describe('single-page app localization', () => {
  test('ships every single-page label in all supported locales', () => {
    const lengths = singlePageCatalogLengths();

    expect(new Set(Object.values(lengths))).toEqual(new Set([keys.length]));
    expect(Object.keys(lengths).sort()).toEqual([...SUPPORTED_LOCALES].sort());

    for (const locale of SUPPORTED_LOCALES) {
      const translate = createSinglePageUiTranslator(locale);
      for (const key of keys) {
        expect(translate(key).trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('localizes navigation, state, and disclosure copy', () => {
    expect(createSinglePageUiTranslator('en')('unsavedPreview')).toBe('Preview · not saved');
    expect(createSinglePageUiTranslator('fr')('planNextTrip')).toBe('Planifiez votre prochain voyage');
    expect(createSinglePageUiTranslator('de')('details')).toBe('Berechnungsdetails');
    expect(createSinglePageUiTranslator('he')('account')).toBe('חשבון ונתונים');
    expect(createSinglePageUiTranslator('ar')('collapse')).toBe('طيّ');
  });
});
