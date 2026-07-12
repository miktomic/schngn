import type { Locale } from './locales';

interface ResourceTopbarCatalog {
  dayCalculator: string;
}

const catalogs: Record<Locale, ResourceTopbarCatalog> = {
  en: { dayCalculator: 'Day Calculator' },
  fr: { dayCalculator: 'Calculateur de jours' },
  de: { dayCalculator: 'Tagesrechner' },
  es: { dayCalculator: 'Calculadora de días' },
  it: { dayCalculator: 'Calcolatore dei giorni' },
  'pt-br': { dayCalculator: 'Calculadora de dias' },
  ru: { dayCalculator: 'Калькулятор дней' },
  uk: { dayCalculator: 'Калькулятор днів' },
  tr: { dayCalculator: 'Gün hesaplayıcı' },
  sr: { dayCalculator: 'Kalkulator dana' },
  sq: { dayCalculator: 'Llogaritësi i ditëve' },
  ka: { dayCalculator: 'დღეების კალკულატორი' },
  'zh-cn': { dayCalculator: '天数计算器' },
  ja: { dayCalculator: '滞在日数計算' },
  ko: { dayCalculator: '체류 일수 계산기' },
  he: { dayCalculator: 'מחשבון ימים' },
  ar: { dayCalculator: 'حاسبة الأيام' }
};

export function resourceTopbarUi(locale: Locale): ResourceTopbarCatalog {
  return catalogs[locale];
}
