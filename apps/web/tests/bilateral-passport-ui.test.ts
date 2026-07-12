import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import {
  bilateralUiCatalogLengths,
  createBilateralUiTranslator
} from '../src/lib/i18n/bilateralUi';

describe('optional bilateral passport question', () => {
  test('ships complete fixed copy in every supported locale', () => {
    expect(new Set(Object.values(bilateralUiCatalogLengths())).size).toBe(1);
    const english = createBilateralUiTranslator('en');

    for (const locale of SUPPORTED_LOCALES) {
      const bilateral = createBilateralUiTranslator(locale);
      for (const key of [
        'passportLabel',
        'passportHelp',
        'choosePassport',
        'confirmExitCountry',
        'potentialTitle',
        'cautionTitle',
        'matchCopy',
        'conditionsCopy',
        'authorityCaution',
        'unchangedCopy',
        'officialSource',
        'opensNewTab'
      ] as const) {
        expect(bilateral(key, { passportCountry: 'Israel', exitCountry: 'France' }).trim().length).toBeGreaterThan(0);
      }
    }

    for (const locale of SUPPORTED_LOCALES.filter((candidate) => candidate !== 'en')) {
      const bilateral = createBilateralUiTranslator(locale);
      expect(bilateral('passportLabel')).not.toBe(english('passportLabel'));
      expect(bilateral('unchangedCopy')).not.toBe(english('unchangedCopy'));
    }
    expect(createBilateralUiTranslator('sr')('passportLabel')).not.toMatch(/[\u0400-\u04ff]/u);
    expect(
      createBilateralUiTranslator('fr')('matchCopy', {
        passportCountry: 'Israël',
        exitCountry: 'France'
      })
    ).toContain('pays de sortie — France');
    expect(createBilateralUiTranslator('fr')('conditionsCopy', { exitCountry: 'France' })).not.toContain('France');
  });

  test('keeps the passport answer ephemeral and official links direct', () => {
    const component = readFileSync('apps/web/src/lib/design/BilateralPassportCheck.svelte', 'utf8');
    expect(component).toContain('findPotentialBilateralNotice');
    expect(component).toContain('target="_blank"');
    expect(component).toContain('rel="noopener noreferrer"');
    expect(component).toContain('referrerpolicy="no-referrer"');
    expect(component).not.toContain('localStorage');
    expect(component).not.toContain('sessionStorage');
    expect(component).not.toContain('trackAnalyticsEvent');
    expect(component).not.toContain('fetch(');

    const tripModel = readFileSync('apps/web/src/lib/trips/tripCrud.ts', 'utf8');
    expect(tripModel).not.toContain('passportCountryCode');
    const accountClient = readFileSync('apps/web/src/lib/account/accountClient.ts', 'utf8');
    expect(accountClient).not.toContain('passportCountryCode');
  });

  test('asks only after an exit country is explicitly selected in the add-trip dialog', () => {
    const app = readFileSync('apps/web/src/routes/app/+page.svelte', 'utf8');
    expect(app).toContain('<BilateralPassportCheck');
    expect(app).toContain(
      "{#if !tripForm.ongoing && resolvedTripFormStatus !== 'past' && tripExitCountryExplicit && tripForm.exitCountryCode}"
    );

    const exitCountryHandler = app.slice(
      app.indexOf('function updateTripExitCountry'),
      app.indexOf('function requestDeleteTrip')
    );
    expect(exitCountryHandler).toContain('tripExitCountryExplicit = Boolean(exitCountryCode)');

    const entryCountryHandler = app.slice(
      app.indexOf('function updateTripEntryCountry'),
      app.indexOf('function updateTripExitCountry')
    );
    expect(entryCountryHandler).toContain(
      'exitCountryCode: tripExitCountryExplicit ? tripForm.exitCountryCode : entryCountryCode'
    );
    expect(app).toContain("bilateralUi('confirmExitCountry')");
    expect(app).toContain("focusElementAfterRender('trip-passport-country', 'trip-exit-country')");
  });
});
