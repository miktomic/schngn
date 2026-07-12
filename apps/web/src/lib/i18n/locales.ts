export const SUPPORTED_LOCALES = [
  'en', 'fr', 'de', 'es', 'it', 'pt-br', 'ru', 'uk', 'tr', 'sr', 'sq', 'ka',
  'zh-cn', 'ja', 'ko', 'he', 'ar'
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'schngn.locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  'pt-br': 'Português (Brasil)',
  ru: 'Русский',
  uk: 'Українська',
  tr: 'Türkçe',
  sr: 'Srpski (latinica)',
  sq: 'Shqip',
  ka: 'ქართული',
  'zh-cn': '简体中文',
  ja: '日本語',
  ko: '한국어',
  he: 'עברית',
  ar: 'العربية'
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}

export function localeFromPath(pathname: string): Locale {
  const candidate = pathname.split('/').filter(Boolean)[0];
  return isLocale(candidate) && candidate !== DEFAULT_LOCALE ? candidate : DEFAULT_LOCALE;
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0]) && segments[0] !== DEFAULT_LOCALE) segments.shift();
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function localizedPath(pathname: string, locale: Locale): string {
  const basePath = stripLocalePrefix(pathname);
  return locale === DEFAULT_LOCALE ? basePath : `/${locale}${basePath === '/' ? '' : basePath}`;
}

export function localizedUrl(url: URL, locale: Locale): string {
  return `${localizedPath(url.pathname, locale)}${url.search}${url.hash}`;
}

export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
}

export function intlLocale(locale: Locale): string {
  return ({
    en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT',
    'pt-br': 'pt-BR', ru: 'ru-RU', uk: 'uk-UA', tr: 'tr-TR', sr: 'sr-Latn-RS',
    sq: 'sq-AL', ka: 'ka-GE', 'zh-cn': 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
    he: 'he-IL', ar: 'ar'
  } as const)[locale];
}

export function isLocalizedNavigationPath(pathname: string): boolean {
  return ['/', '/app', '/accuracy', '/explainer', '/faq', '/contact'].includes(stripLocalePrefix(pathname));
}
