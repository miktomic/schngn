import { catalogs, type MessageKey } from './messages';
import { intlLocale, type Locale } from './locales';
import { translateExtended } from './extendedLocaleStrings';

export * from './locales';
export type { MessageKey } from './messages';

export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translate {
  return (key, values = {}) => {
    const template = catalogs[locale]?.[key] ?? translateExtended(locale, catalogs.en[key]);
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => String(values[name] ?? match));
  };
}

export function formatDate(locale: Locale, isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00.000Z`));
}

export function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(intlLocale(locale)).select(count);
}
