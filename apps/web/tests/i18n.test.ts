import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { reroute } from '../src/hooks';
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  intlLocale,
  localeDirection,
  localeFromPath,
  localizedPath,
  localizedUrl,
  stripLocalePrefix
} from '../src/lib/i18n';
import { createAppUiTranslator } from '../src/lib/i18n/appUi';
import { appDeepCatalogLengths, createAppDeepUiTranslator } from '../src/lib/i18n/appDeepUi';
import {
  appRuntimeCatalogLengths,
  createAppRuntimeUiTranslator,
  formatLocalizedCount,
  formatLocalizedOutsideDays,
  formatLocalizedSchengenDays
} from '../src/lib/i18n/appRuntimeUi';
import { createWhatIfUiTranslator, whatIfCatalogLengths } from '../src/lib/i18n/whatIfUi';
import { createTripOnboardingTranslator, tripOnboardingCatalogLengths } from '../src/lib/i18n/tripOnboardingUi';
import {
  localizeDashboardState,
  localizePdfState,
  localizeReturningForecast,
  localizeUnlockState,
  stateCatalogKeyCount
} from '../src/lib/i18n/stateUi';
import { buildDashboardState } from '../src/lib/dashboard/dashboardState';
import { createTranslator } from '../src/lib/i18n';
import { buildPdfReportFakeDoorState } from '../src/lib/fake-door/pdfReportFakeDoor';
import { buildUnlockFakeDoorState } from '../src/lib/fake-door/unlockFakeDoor';
import { buildReturningDaysForecast } from '../src/lib/returns/returningDays';
import { makeTrip } from './trip-fixtures';

describe('whole-site localization', () => {
  test('supports all approved locales and both RTL languages', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'fr', 'de', 'es', 'it', 'ru', 'tr', 'he', 'ar']);
    expect(localeDirection('he')).toBe('rtl');
    expect(localeDirection('ar')).toBe('rtl');
    for (const locale of SUPPORTED_LOCALES.filter((candidate) => !['he', 'ar'].includes(candidate))) {
      expect(localeDirection(locale)).toBe('ltr');
    }
    expect(Object.keys(LOCALE_LABELS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  test('builds shareable localized URLs without changing queries or hashes', () => {
    expect(localeFromPath('/he/app')).toBe('he');
    expect(localeFromPath('/app')).toBe('en');
    expect(stripLocalePrefix('/ar/accuracy')).toBe('/accuracy');
    expect(localizedPath('/ru/app', 'fr')).toBe('/fr/app');
    expect(localizedPath('/de', 'en')).toBe('/');
    expect(localizedUrl(new URL('https://schngn.com/he/app?section=planner#result'), 'tr')).toBe('/tr/app?section=planner#result');
  });

  test('reroutes locale-prefixed pages to the existing SvelteKit routes', async () => {
    expect(await reroute({ url: new URL('https://schngn.com/fr/app?section=planner'), fetch } as never)).toBe('/app');
    expect(await reroute({ url: new URL('https://schngn.com/ar/accuracy'), fetch } as never)).toBe('/accuracy');
  });

  test('keeps hooks resolvable before SvelteKit generates path aliases in clean CI', () => {
    for (const hookPath of ['apps/web/src/hooks.ts', 'apps/web/src/hooks.server.ts']) {
      const source = readFileSync(hookPath, 'utf8');
      expect(source).toContain("from './lib/i18n'");
      expect(source).not.toContain("from '$lib/i18n'");
    }
  });

  test('ships complete public, core, and deep app catalogs for every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(createTranslator(locale)('landing.primaryAction').trim().length).toBeGreaterThan(0);
      expect(createTranslator(locale)('accuracy.hero').trim().length).toBeGreaterThan(0);
      expect(createTranslator(locale)('accuracy.noticeTitle').trim().length).toBeGreaterThan(0);
      expect(createTranslator(locale)('accuracy.noticeCopy').trim().length).toBeGreaterThan(0);
      expect(createAppUiTranslator(locale)('navOverview').trim().length).toBeGreaterThan(0);
      expect(createAppUiTranslator(locale)('accountReady').trim().length).toBeGreaterThan(0);
      expect(createAppDeepUiTranslator(locale)('signUp').trim().length).toBeGreaterThan(0);
      expect(createAppRuntimeUiTranslator(locale)('browserData').trim().length).toBeGreaterThan(0);
      expect(createAppRuntimeUiTranslator(locale)('guestCopy').trim().length).toBeGreaterThan(0);
      expect(createWhatIfUiTranslator(locale)('adjust').trim().length).toBeGreaterThan(0);
      expect(createTripOnboardingTranslator(locale)('title').trim().length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(appDeepCatalogLengths())).size).toBe(1);
    expect(appDeepCatalogLengths().en).toBeGreaterThan(70);
    expect(new Set(Object.values(appRuntimeCatalogLengths())).size).toBe(1);
    expect(appRuntimeCatalogLengths().en).toBeGreaterThan(90);
    expect(new Set(Object.values(stateCatalogKeyCount())).size).toBe(1);
    expect(new Set(Object.values(whatIfCatalogLengths())).size).toBe(1);
    expect(new Set(Object.values(tripOnboardingCatalogLengths())).size).toBe(1);
  });

  test('renders public safety and evidence copy in the selected locale without English-only fallback blocks', () => {
    const english = createTranslator('en');
    for (const locale of SUPPORTED_LOCALES.filter((candidate) => candidate !== 'en')) {
      const localized = createTranslator(locale);
      expect(localized('landing.trust')).not.toBe(english('landing.trust'));
      expect(localized('accuracy.noticeTitle')).not.toBe(english('accuracy.noticeTitle'));
      expect(localized('accuracy.noticeCopy')).not.toBe(english('accuracy.noticeCopy'));
      expect(localized('accuracy.caseInclusiveCopy')).not.toBe(english('accuracy.caseInclusiveCopy'));
    }

    for (const routePath of ['apps/web/src/routes/+page.svelte', 'apps/web/src/routes/accuracy/+page.svelte']) {
      const source = readFileSync(routePath, 'utf8');
      expect(source).not.toContain('const english =');
      expect(source).not.toContain("english('");
      expect(source).not.toContain("t('common.reviewedEnglishNotice')");
      expect(source).not.toContain('lang="en"');
    }
  });

  test('localizes calculated state labels and dates instead of leaking English formatting', () => {
    const raw = buildDashboardState([]);
    expect(localizeDashboardState('fr', raw).statusLabel).toBe('Ajouter un voyage');
    expect(localizeDashboardState('ar', raw).statusLabel).toBe('إضافة رحلة');
    expect(createAppRuntimeUiTranslator('de')('checkingSignIn')).toBe('Anmeldung wird geprüft…');
    expect(createAppRuntimeUiTranslator('he')('needPlanningPower')).toContain('תכנון');
    expect(localizePdfState('he', buildPdfReportFakeDoorState(true)).messageCopy).toContain('הירשמו');
    expect(
      localizeUnlockState(
        'ar',
        buildUnlockFakeDoorState({ bucket: 'eur_9', label: '€9' }, true),
        '€9'
      ).messageCopy
    ).toContain('أنشئ حسابًا');

    const overByOne = buildDashboardState([
      makeTrip('past', 'Prior Schengen', '2026-01-01', '2026-03-31'),
      makeTrip('italy', 'Italy', '2026-06-29', '2026-06-29', 'booked', 'IT')
    ]);
    expect(localizeDashboardState('fr', overByOne).heroMetric).toBe('1 jour au-dessus de la limite');
    expect(localizeDashboardState('ru', overByOne).heroMetric).toBe('1 день сверх лимита');
    expect(localizeDashboardState('he', overByOne).heroMetric).toBe('1 יום מעל למגבלה');
    expect(localizeDashboardState('ar', overByOne).heroMetric)
      .toBe(`${new Intl.NumberFormat(intlLocale('ar')).format(1)} يوم فوق الحد`);
    expect(localizeDashboardState('fr', overByOne).whyCopy).toContain('91 jours comptés sur 90');
    expect(localizeDashboardState('he', overByOne).whyCopy).toContain('91 מתוך 90 ימים שנספרו');

    const overByTwo = buildDashboardState([
      makeTrip('past', 'Prior Schengen', '2026-01-01', '2026-03-31'),
      makeTrip('italy', 'Italy', '2026-06-28', '2026-06-29', 'booked', 'IT')
    ], '2026-06-29');
    expect(localizeDashboardState('he', overByTwo).heroMetric).toBe('יומיים מעל למגבלה');
    expect(localizeDashboardState('ar', overByTwo).heroMetric).toBe('يومان فوق الحد');

    expect(createAppRuntimeUiTranslator('ru')('schengen')).toBe('Шенген');
    expect(createAppRuntimeUiTranslator('he')('schengen')).toBe('שנגן');
    expect(createAppRuntimeUiTranslator('ar')('schengen')).toBe('شنغن');

    const oneDayReturns = buildReturningDaysForecast(
      [makeTrip('returning', 'Returning day', '2026-05-01', '2026-05-01')],
      { referenceDate: '2026-10-27', horizonDays: 1 }
    );
    expect(localizeReturningForecast('ru', oneDayReturns).summaryLabel).toBe('1 день вернётся · 1 день');
    expect(localizeReturningForecast('he', oneDayReturns).summaryLabel).toBe('1 יום חוזר · 1 יום');
    expect(localizeReturningForecast('ar', oneDayReturns).summaryLabel)
      .toBe(`${new Intl.NumberFormat(intlLocale('ar')).format(1)} يوم يعود · ${new Intl.NumberFormat(intlLocale('ar')).format(1)} يوم`);
  });

  test('keeps app copy behind translators without reviewed-English fallback notices', () => {
    const source = readFileSync('apps/web/src/routes/app/+page.svelte', 'utf8');
    for (const literal of ['Checking sign-in…', 'Need more planning power?', 'No days return during this forecast', 'Browser trip data', 'Analytics never include trip dates']) {
      expect(source).not.toContain(`>${literal}<`);
    }
    expect(source).not.toContain("t('common.reviewedEnglishNotice')");
  });

  test('pluralizes day and trip counts with complete localized travel phrases', () => {
    expect(formatLocalizedSchengenDays('en', 10)).toBe('10 Schengen days');
    expect(formatLocalizedOutsideDays('en', 2)).toBe('2 days outside');
    expect(formatLocalizedCount('ru', 1, 'day').text).toBe('1 день');
    expect(formatLocalizedCount('ru', 2, 'day').text).toBe('2 дня');
    expect(formatLocalizedCount('ru', 5, 'day').text).toBe('5 дней');
    expect(formatLocalizedCount('ru', 21, 'trip').text).toBe('21 поездка');
    expect(formatLocalizedCount('ru', 22, 'trip').text).toBe('22 поездки');
    expect(formatLocalizedCount('ru', 25, 'trip').text).toBe('25 поездок');

    const arabicOne = new Intl.NumberFormat(intlLocale('ar')).format(1);
    const arabicThree = new Intl.NumberFormat(intlLocale('ar')).format(3);
    const arabicEleven = new Intl.NumberFormat(intlLocale('ar')).format(11);
    const arabicZero = new Intl.NumberFormat(intlLocale('ar')).format(0);
    const arabicHundred = new Intl.NumberFormat(intlLocale('ar')).format(100);
    expect(formatLocalizedCount('ar', 0, 'day').text).toBe(`${arabicZero} أيام`);
    expect(formatLocalizedCount('ar', 1, 'day').text).toBe(`${arabicOne} يوم`);
    expect(formatLocalizedCount('ar', 2, 'day').text).toBe('يومان');
    expect(formatLocalizedCount('ar', 3, 'day').text).toBe(`${arabicThree} أيام`);
    expect(formatLocalizedCount('ar', 11, 'day').text).toBe(`${arabicEleven} يومًا`);
    expect(formatLocalizedCount('ar', 100, 'day').text).toBe(`${arabicHundred} يوم`);

    expect(formatLocalizedSchengenDays('he', 1)).toBe('1 יום בשנגן');
    expect(formatLocalizedOutsideDays('he', 2)).toBe('יומיים מחוץ לשנגן');
    expect(formatLocalizedSchengenDays('ru', 2)).toBe('2 дня в Шенгене');
    expect(formatLocalizedOutsideDays('ar', 3)).toBe(`${arabicThree} أيام خارج شنغن`);
  });

  test('keeps localized navigation offline-safe and declares language alternates', () => {
    const worker = readFileSync('apps/web/static/service-worker.js', 'utf8');
    const landing = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');
    const selector = readFileSync('apps/web/src/lib/i18n/LanguageSelector.svelte', 'utf8');
    const config = readFileSync('apps/web/svelte.config.js', 'utf8');
    const accuracyRoute = readFileSync('apps/web/src/routes/accuracy/+page.ts', 'utf8');
    expect(worker).toContain("'he', 'ar'");
    expect(worker).toContain('localizedAppPath');
    expect(landing).toContain('hreflang="x-default"');
    expect(selector).toContain('window.location.assign');
    expect(config).toContain('localizedPrerenderEntries');
    expect(accuracyRoute).toContain('prerender = true');
    for (const locale of SUPPORTED_LOCALES.filter((candidate) => candidate !== 'en')) {
      expect(config).toContain(`'${locale}'`);
    }
  });

  test('passes the active locale into generated timeline copy and isolates RTL date ranges', () => {
    const timeline = readFileSync('apps/web/src/lib/design/TimelineLedger.svelte', 'utf8');
    expect(timeline).toContain('horizonDays,\n    locale,\n    mode');
    expect(timeline).toContain('dateRangeLabel[locale]');
    expect(timeline).toContain('<bdi>{model.rangeLabel}</bdi>');
  });
});
