import type { Locale } from './locales';
import { formatLocalizedCount, formatLocalizedNumber } from './countUi';
import { translateExtended, translateExtendedTemplate } from './extendedLocaleStrings';

const returnStartLabels: Partial<Record<Locale, string>> & { en: string } = {
  en: 'Days start returning',
  fr: 'Les jours commencent à revenir',
  de: 'Tage werden wieder frei',
  es: 'Empiezas a recuperar días',
  it: 'Inizi a recuperare giorni',
  ru: 'Дни начинают возвращаться',
  tr: 'Günler geri dönmeye başlar',
  he: 'ימים מתחילים לחזור',
  ar: 'تبدأ الأيام بالعودة'
};

export function returnStartLabel(locale: Locale): string {
  return returnStartLabels[locale] ?? translateExtended(locale, returnStartLabels.en);
}

export function formatReturnStartAria(locale: Locale, dateLabel: string): string {
  const values: Partial<Record<Locale, string>> = {
    en: `First counted day returns on ${dateLabel}.`,
    fr: `Le premier jour compté revient le ${dateLabel}.`,
    de: `Der erste gezählte Tag wird am ${dateLabel} wieder frei.`,
    es: `El primer día contado se recupera el ${dateLabel}.`,
    it: `Il primo giorno conteggiato torna disponibile il ${dateLabel}.`,
    ru: `Первый учтённый день вернётся ${dateLabel}.`,
    tr: `İlk sayılan gün ${dateLabel} tarihinde geri döner.`,
    he: `היום הראשון שנספר חוזר ב־${dateLabel}.`,
    ar: `يعود أول يوم محتسب في ${dateLabel}.`
  };
  return values[locale] ?? translateExtendedTemplate(locale, 'First counted day returns on {date}.', { date: dateLabel });
}

export function formatRollingTimelineSummary(
  locale: Locale,
  used: number,
  remaining: number,
  overBy: number
): string {
  const usedNumber = formatLocalizedNumber(locale, used);
  const remainingNumber = formatLocalizedNumber(locale, remaining);
  const overNumber = formatLocalizedNumber(locale, overBy);
  const usedDays = formatLocalizedCount(locale, used, 'day');
  const remainingDays = formatLocalizedCount(locale, remaining, 'day');
  const overDays = formatLocalizedCount(locale, overBy, 'day');

  const values: Partial<Record<Locale, string>> = {
    en: `${usedNumber} counted ${usedDays.label} in this inclusive 180-day window. ${overBy > 0 ? `${overNumber} ${overBy === 1 ? 'day is' : 'days are'} over the 90-day limit.` : `${remainingNumber} safe buffer ${remaining === 1 ? 'day remains' : 'days remain'}.`}`,
    fr: `${usedNumber} ${used === 1 ? 'jour compté' : 'jours comptés'} dans cette fenêtre inclusive de 180 jours. ${overBy > 0 ? `${overNumber} au-delà de la limite de 90 jours.` : `${remainingNumber} ${remaining === 1 ? 'jour de marge sûre restant' : 'jours de marge sûre restants'}.`}`,
    de: `${usedNumber} ${used === 1 ? 'gezählter Tag' : 'gezählte Tage'} in diesem inklusiven 180-Tage-Fenster. ${overBy > 0 ? `${overNumber} über dem 90-Tage-Limit.` : `${remainingNumber} ${remaining === 1 ? 'sicherer Puffertag verbleibt' : 'sichere Puffertage verbleiben'}.`}`,
    es: `${usedNumber} ${used === 1 ? 'día contado' : 'días contados'} en esta ventana inclusiva de 180 días. ${overBy > 0 ? `${overNumber} por encima del límite de 90 días.` : `Quedan ${remainingNumber} ${remaining === 1 ? 'día de margen seguro' : 'días de margen seguro'}.`}`,
    it: `${usedNumber} ${used === 1 ? 'giorno conteggiato' : 'giorni conteggiati'} nella finestra inclusiva di 180 giorni. ${overBy > 0 ? `${overNumber} oltre il limite di 90 giorni.` : `Restano ${remainingNumber} ${remaining === 1 ? 'giorno di margine sicuro' : 'giorni di margine sicuro'}.`}`,
    ru: `В этом 180-дневном окне учтено ${usedDays.text}. ${overBy > 0 ? `Превышение лимита 90 дней: ${overDays.text}.` : `Безопасный запас: ${remainingDays.text}.`}`,
    tr: `Bu 180 günlük pencerede ${usedNumber} gün sayıldı. ${overBy > 0 ? `90 günlük sınır ${overNumber} gün aşıldı.` : `${remainingNumber} güvenli tampon gün kaldı.`}`,
    he: `${usedDays.text} ${used === 1 ? 'נספר' : 'נספרו'} בחלון הכולל של 180 יום. ${overBy > 0 ? `חריגה של ${overDays.text} ממגבלת 90 הימים.` : `${remaining === 1 ? 'נותר' : 'נותרו'} ${remainingDays.text} של מרווח בטוח.`}`,
    ar: `احتُسب ${usedDays.text} في نافذة 180 يومًا الشاملة. ${overBy > 0 ? `تجاوز حد 90 يومًا بمقدار ${overDays.text}.` : `يتبقى هامش آمن قدره ${remainingDays.text}.`}`
  };
  if (values[locale]) return values[locale];
  return overBy > 0
    ? translateExtendedTemplate(locale, '{used} counted days in this inclusive 180-day window. {over} days are over the 90-day limit.', { used: usedNumber, over: overNumber })
    : translateExtendedTemplate(locale, '{used} counted days in this inclusive 180-day window. {remaining} safe buffer days remain.', { used: usedNumber, remaining: remainingNumber });
}

export function formatReturnsTimelineSummary(locale: Locale, returned: number, forecastDays: number): string {
  const returnedNumber = formatLocalizedNumber(locale, returned);
  const forecastNumber = formatLocalizedNumber(locale, forecastDays);
  const returnedDays = formatLocalizedCount(locale, returned, 'day');
  const forecast = formatLocalizedCount(locale, forecastDays, 'day');

  const values: Partial<Record<Locale, string>> = {
    en: returned > 0 ? `${returnedNumber} counted ${returned === 1 ? 'day returns' : 'days return'} to the allowance during this ${forecastNumber}-day forecast.` : `No counted days return to the allowance during this ${forecastNumber}-day forecast.`,
    fr: returned > 0 ? `${returnedNumber} ${returned === 1 ? 'jour revient' : 'jours reviennent'} pendant cette prévision de ${forecastNumber} jours.` : `Aucun jour ne revient pendant cette prévision de ${forecastNumber} jours.`,
    de: returned > 0 ? `${returnedNumber} ${returned === 1 ? 'Tag kehrt' : 'Tage kehren'} in dieser ${forecastNumber}-Tage-Prognose zurück.` : `In dieser ${forecastNumber}-Tage-Prognose kehren keine Tage zurück.`,
    es: returned > 0 ? `${returnedNumber} ${returned === 1 ? 'día vuelve' : 'días vuelven'} durante esta previsión de ${forecastNumber} días.` : `No vuelve ningún día durante esta previsión de ${forecastNumber} días.`,
    it: returned > 0 ? `${returnedNumber} ${returned === 1 ? 'giorno torna' : 'giorni tornano'} nella previsione di ${forecastNumber} giorni.` : `Nessun giorno torna nella previsione di ${forecastNumber} giorni.`,
    ru: returned > 0 ? `${returnedDays.text} ${returned === 1 ? 'вернётся' : 'вернутся'} в течение ${forecast.text}.` : `В течение ${forecast.text} учтённые дни не вернутся.`,
    tr: returned > 0 ? `${forecastNumber} günlük tahminde ${returnedNumber} gün geri döner.` : `${forecastNumber} günlük tahminde sayılan gün geri dönmez.`,
    he: returned > 0 ? `${returnedDays.text} ${returned === 1 ? 'חוזר' : 'חוזרים'} במהלך תחזית של ${forecast.text}.` : `לא חוזרים ימים במהלך תחזית של ${forecast.text}.`,
    ar: returned > 0 ? `يعود ${returnedDays.text} خلال توقع مدته ${forecast.text}.` : `لا تعود أيام خلال توقع مدته ${forecast.text}.`
  };
  return values[locale] ?? (returned > 0
    ? translateExtendedTemplate(locale, '{returned} counted days return to the allowance during this {forecast}-day forecast.', { returned: returnedNumber, forecast: forecastNumber })
    : translateExtendedTemplate(locale, 'No counted days return to the allowance during this {forecast}-day forecast.', { forecast: forecastNumber }));
}
