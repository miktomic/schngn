import { intlLocale, type Locale } from './locales';

export type CountUnit = 'trip' | 'day';

interface CountFormat {
  count: number;
  label: string;
  text: string;
}

const simpleForms: Partial<Record<Locale, Record<CountUnit, [string, string]>>> = {
  en: { trip: ['trip', 'trips'], day: ['day', 'days'] },
  fr: { trip: ['voyage', 'voyages'], day: ['jour', 'jours'] },
  de: { trip: ['Reise', 'Reisen'], day: ['Tag', 'Tage'] },
  es: { trip: ['viaje', 'viajes'], day: ['día', 'días'] },
  it: { trip: ['viaggio', 'viaggi'], day: ['giorno', 'giorni'] },
  'pt-br': { trip: ['viagem', 'viagens'], day: ['dia', 'dias'] },
  tr: { trip: ['seyahat', 'seyahat'], day: ['gün', 'gün'] },
  sq: { trip: ['udhëtim', 'udhëtime'], day: ['ditë', 'ditë'] },
  ka: { trip: ['მოგზაურობა', 'მოგზაურობა'], day: ['დღე', 'დღე'] },
  'zh-cn': { trip: ['次旅行', '次旅行'], day: ['天', '天'] },
  ja: { trip: ['件の旅行', '件の旅行'], day: ['日', '日'] },
  ko: { trip: ['개 여행', '개 여행'], day: ['일', '일'] }
};

export function formatLocalizedNumber(locale: Locale, count: number): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(count);
}

export function localizedPluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(intlLocale(locale)).select(count);
}

export function formatLocalizedCount(locale: Locale, count: number, unit: CountUnit): CountFormat {
  const number = formatLocalizedNumber(locale, count);
  const category = localizedPluralCategory(locale, count);

  if (locale === 'ru') {
    const forms = unit === 'trip' ? ['поездка', 'поездки', 'поездок'] : ['день', 'дня', 'дней'];
    const label = forms[category === 'one' ? 0 : category === 'few' ? 1 : 2];
    return { count, label, text: `${number} ${label}` };
  }

  if (locale === 'uk') {
    const forms = unit === 'trip' ? ['поїздка', 'поїздки', 'поїздок'] : ['день', 'дні', 'днів'];
    const label = forms[category === 'one' ? 0 : category === 'few' ? 1 : 2];
    return { count, label, text: `${number} ${label}` };
  }

  if (locale === 'sr') {
    const forms = unit === 'trip' ? ['putovanje', 'putovanja', 'putovanja'] : ['dan', 'dana', 'dana'];
    const label = forms[category === 'one' ? 0 : category === 'few' ? 1 : 2];
    return { count, label, text: `${number} ${label}` };
  }

  if (locale === 'he') {
    if (unit === 'day' && count === 2) return { count, label: 'יומיים', text: 'יומיים' };
    const label = unit === 'trip'
      ? (category === 'one' ? 'נסיעה' : 'נסיעות')
      : (category === 'one' ? 'יום' : 'ימים');
    return { count, label, text: `${number} ${label}` };
  }

  if (locale === 'ar') {
    const dual = unit === 'trip' ? 'رحلتان' : 'يومان';
    if (count === 2) return { count, label: dual, text: dual };

    const singular = unit === 'trip' ? 'رحلة' : 'يوم';
    const plural = unit === 'trip' ? 'رحلات' : 'أيام';
    const many = unit === 'trip' ? 'رحلةً' : 'يومًا';
    const label = category === 'zero' || category === 'few'
      ? plural
      : category === 'many'
        ? many
        : singular;
    return { count, label, text: `${number} ${label}` };
  }

  const forms = simpleForms[locale]?.[unit] ?? simpleForms.en![unit];
  const label = forms[category === 'one' ? 0 : 1];
  const separator = ['zh-cn', 'ja'].includes(locale) ? '' : ' ';
  return { count, label, text: `${number}${separator}${label}` };
}
