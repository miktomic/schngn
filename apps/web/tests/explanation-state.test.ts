import { describe, expect, test } from 'bun:test';
import { buildExplanationState } from '../src/lib/explanation/explanationState';
import { SUPPORTED_LOCALES, intlLocale } from '../src/lib/i18n';
import { makeTrip } from './trip-fixtures';

const sampleTrips = [
  makeTrip('france', 'France', '2026-05-01', '2026-05-12', 'past', 'FR'),
  makeTrip('germany', 'Germany', '2026-06-03', '2026-06-20', 'past', 'DE'),
  makeTrip('greece', 'Greece', '2026-08-02', '2026-08-17', 'past', 'GR'),
  makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT')
];

describe('plain-English calculation explanation', () => {
  test('explains used days, inclusive counting, the rolling window, and outside gaps', () => {
    const state = buildExplanationState(sampleTrips, '2026-10-13');
    expect(state.summary).toBe('75 counted days between Apr 17 and Oct 13. That leaves 15 safe buffer days.');
    expect(state.ruleBullets).toContain('Travel between Schengen countries is one continuous stay. Full calendar days outside Schengen are not counted.');
    expect(state.countedTripRows.at(-1)).toEqual({ label: 'Italy', rangeLabel: 'Sep 15 to Oct 13', daysLabel: '29 days counted' });
  });

  test('explains over-limit states without legal advice', () => {
    const state = buildExplanationState([
      makeTrip('past', 'Prior Schengen', '2026-01-01', '2026-03-31'),
      makeTrip('italy', 'Italy', '2026-06-29', '2026-06-29', 'booked', 'IT')
    ], '2026-06-29');
    expect(state.summary).toBe('91 counted days between Jan 1 and Jun 29. That is 1 day over the 90-day limit.');
  });
});

describe('localized calculation explanation', () => {
  test('localizes every generated field for all approved non-English locales', () => {
    const english = buildExplanationState(sampleTrips, '2026-10-13');

    for (const locale of SUPPORTED_LOCALES.filter((candidate) => candidate !== 'en')) {
      const state = buildExplanationState(sampleTrips, '2026-10-13', locale);
      const output = [
        state.heading,
        state.summary,
        state.verdictLine,
        state.windowLabel,
        ...state.ruleBullets,
        ...state.countedTripRows.flatMap((row) => [row.rangeLabel, row.daysLabel])
      ].join(' ');

      expect(state.heading).not.toBe(english.heading);
      expect(state.summary).not.toContain('counted days');
      expect(state.summary).not.toContain('safe buffer');
      expect(state.verdictLine).not.toContain('Calculation result');
      expect(state.ruleBullets).not.toContain(english.ruleBullets[0]);
      expect(state.countedTripRows.at(-1)?.rangeLabel).not.toContain(' to ');
      expect(state.countedTripRows.at(-1)?.daysLabel).not.toContain('counted');
      expect(output).toContain(new Intl.NumberFormat(intlLocale(locale)).format(75));
    }
  });

  test('uses locale-aware dates, numbers, plural forms, and fallback trip labels', () => {
    const unlabeledTrip = makeTrip('unlabeled', '', '2026-06-29', '2026-06-29', 'booked', 'IT');
    delete unlabeledTrip.label;
    unlabeledTrip.exitCountryCode = undefined;

    const french = buildExplanationState(sampleTrips, '2026-10-13', 'fr');
    expect(french.heading).toBe('Pourquoi ce nombre ?');
    expect(french.summary).toBe('75 jours comptés entre le 17 avr. et le 13 oct. Il reste 15 jours de marge de sécurité.');
    expect(french.countedTripRows.at(-1)).toEqual({
      label: 'Italy',
      rangeLabel: '15 sept. au 13 oct.',
      daysLabel: '29 jours comptés'
    });

    const hebrew = buildExplanationState([unlabeledTrip], '2026-06-29', 'he');
    expect(hebrew.heading).toBe('איך התקבל המספר הזה?');
    expect(hebrew.countedTripRows[0]?.label).toBe('כניסה דרך IT');
    expect(hebrew.countedTripRows[0]?.daysLabel).toBe('1 יום שנספר');

    const arabic = buildExplanationState(sampleTrips, '2026-10-13', 'ar');
    expect(arabic.summary).toContain(`${new Intl.NumberFormat(intlLocale('ar')).format(75)} يومًا محتسبًا`);
    expect(arabic.summary).toContain(`${new Intl.NumberFormat(intlLocale('ar')).format(15)} يومًا`);
    expect(arabic.countedTripRows.at(-1)?.rangeLabel).toContain('سبتمبر');
    expect(arabic.verdictLine).toContain('المصادر الرسمية');
  });

  test('localizes over-limit summaries while keeping the official-source caution', () => {
    const trips = [
      makeTrip('past', 'Prior Schengen', '2026-01-01', '2026-03-31'),
      makeTrip('italy', 'Italy', '2026-06-29', '2026-06-29', 'booked', 'IT')
    ];
    const russianDate = new Intl.DateTimeFormat(intlLocale('ru'), {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
    const windowStart = russianDate.format(new Date('2026-01-01T00:00:00.000Z'));
    const windowEnd = russianDate.format(new Date('2026-06-29T00:00:00.000Z')).replace(/\.$/u, '');

    expect(buildExplanationState(trips, '2026-06-29', 'ru').summary)
      .toBe(`91 учтённый день в период с ${windowStart} по ${windowEnd}. Это на 1 день больше лимита в 90 дней.`);
    expect(buildExplanationState(trips, '2026-06-29', 'tr').verdictLine).toContain('resmî kaynakları');
    expect(buildExplanationState(trips, '2026-06-29', 'de').verdictLine).toContain('offizielle Quellen');
  });
});
