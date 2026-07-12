import { addDays, calculateUsageOnDate, formatISODate, parseISODate } from '@schngn/engine';
import { intlLocale, type Locale } from '../i18n';
import { translateExtended, translateExtendedTemplate } from '../i18n/extendedLocaleStrings';
import { formatLocalizedCount } from '../i18n/countUi';
import { sortTrips, toEngineTrips, tripEntryDate, tripExitDate, type EditableTrip } from '../trips/tripCrud';

export interface CountedTripRow {
  label: string;
  rangeLabel: string;
  daysLabel: string;
}

export interface ExplanationState {
  countedTripRows: CountedTripRow[];
  heading: string;
  ruleBullets: string[];
  summary: string;
  verdictLine: string;
  windowLabel: string;
}

interface ExplanationCopy {
  countedSummary: (days: string, start: string, end: string) => string;
  continuityRule: string;
  enteredVia: (countryCode: string) => string;
  heading: string;
  inclusiveRule: string;
  leftVia: (countryCode: string) => string;
  lookbackRule: (referenceDate: string, windowDays: string) => string;
  overSummary: (daysOver: string, allowanceDays: string) => string;
  rangeConnector: string;
  safeSummary: (safeBuffer: string) => string;
  schengenStay: string;
  verdictOver: string;
  verdictSafe: string;
}

const copy: Partial<Record<Locale, ExplanationCopy>> & { en: ExplanationCopy } = {
  en: {
    countedSummary: (days, start, end) => `${days} between ${start} and ${end}.`,
    continuityRule: 'Travel between Schengen countries is one continuous stay. Full calendar days outside Schengen are not counted.',
    enteredVia: (countryCode) => `Entered via ${countryCode}`,
    heading: 'Why this number?',
    inclusiveRule: 'Entry and exit dates both count.',
    leftVia: (countryCode) => `Left via ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `The app looks back ${windowDays} calendar days from ${referenceDate}, including ${referenceDate} itself.`,
    overSummary: (daysOver, allowanceDays) => `That is ${daysOver} over the ${allowanceDays}-day limit.`,
    rangeConnector: 'to',
    safeSummary: (safeBuffer) => `That leaves ${safeBuffer}.`,
    schengenStay: 'Schengen stay',
    verdictOver: 'Calculation result: over the ordinary short-stay allowance. Check official sources before booking or travelling.',
    verdictSafe: 'Calculation result: within the ordinary short-stay allowance. Check official sources before booking or travelling.'
  },
  fr: {
    countedSummary: (days, start, end) => `${days} entre le ${start} et le ${end}.`,
    continuityRule: 'Les déplacements entre les pays de l’espace Schengen forment un seul séjour continu. Les journées civiles complètes passées hors de l’espace Schengen ne sont pas comptées.',
    enteredVia: (countryCode) => `Entrée par ${countryCode}`,
    heading: 'Pourquoi ce nombre ?',
    inclusiveRule: 'Les dates d’entrée et de sortie comptent toutes les deux.',
    leftVia: (countryCode) => `Sortie par ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `L’application examine les ${windowDays} jours civils précédant le ${referenceDate}, cette date comprise.`,
    overSummary: (daysOver, allowanceDays) => `Cela dépasse de ${daysOver} la limite de ${allowanceDays} jours.`,
    rangeConnector: 'au',
    safeSummary: (safeBuffer) => `Il reste ${safeBuffer}.`,
    schengenStay: 'Séjour dans l’espace Schengen',
    verdictOver: 'Résultat du calcul : au-delà de la durée de court séjour ordinaire. Vérifiez les sources officielles avant de réserver ou de voyager.',
    verdictSafe: 'Résultat du calcul : dans la durée de court séjour ordinaire. Vérifiez les sources officielles avant de réserver ou de voyager.'
  },
  de: {
    countedSummary: (days, start, end) => `${days} zwischen dem ${start} und dem ${end}.`,
    continuityRule: 'Reisen zwischen Schengen-Staaten gelten als ein durchgehender Aufenthalt. Volle Kalendertage außerhalb des Schengen-Raums werden nicht gezählt.',
    enteredVia: (countryCode) => `Einreise über ${countryCode}`,
    heading: 'Wie kommt diese Zahl zustande?',
    inclusiveRule: 'Einreise- und Ausreisedatum werden beide gezählt.',
    leftVia: (countryCode) => `Ausreise über ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `Die App betrachtet vom ${referenceDate} aus ${windowDays} Kalendertage rückwärts, einschließlich dieses Tages.`,
    overSummary: (daysOver, allowanceDays) => `Das sind ${daysOver} über der Grenze von ${allowanceDays} Tagen.`,
    rangeConnector: 'bis',
    safeSummary: (safeBuffer) => `Damit bleiben ${safeBuffer}.`,
    schengenStay: 'Schengen-Aufenthalt',
    verdictOver: 'Berechnungsergebnis: über der gewöhnlichen Kurzaufenthaltsdauer. Prüfen Sie vor der Buchung oder Reise offizielle Quellen.',
    verdictSafe: 'Berechnungsergebnis: innerhalb der gewöhnlichen Kurzaufenthaltsdauer. Prüfen Sie vor der Buchung oder Reise offizielle Quellen.'
  },
  es: {
    countedSummary: (days, start, end) => `${days} entre el ${start} y el ${end}.`,
    continuityRule: 'Los viajes entre países del espacio Schengen forman una sola estancia continua. Los días naturales completos fuera del espacio Schengen no se cuentan.',
    enteredVia: (countryCode) => `Entrada por ${countryCode}`,
    heading: '¿De dónde sale este número?',
    inclusiveRule: 'Las fechas de entrada y salida cuentan.',
    leftVia: (countryCode) => `Salida por ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `La aplicación cuenta ${windowDays} días naturales hacia atrás desde el ${referenceDate}, incluido ese mismo día.`,
    overSummary: (daysOver, allowanceDays) => `Son ${daysOver} por encima del límite de ${allowanceDays} días.`,
    rangeConnector: 'a',
    safeSummary: (safeBuffer) => `Quedan ${safeBuffer}.`,
    schengenStay: 'Estancia en el espacio Schengen',
    verdictOver: 'Resultado del cálculo: supera la estancia corta ordinaria. Consulta fuentes oficiales antes de reservar o viajar.',
    verdictSafe: 'Resultado del cálculo: dentro de la estancia corta ordinaria. Consulta fuentes oficiales antes de reservar o viajar.'
  },
  it: {
    countedSummary: (days, start, end) => `${days} tra il ${start} e il ${end}.`,
    continuityRule: 'Gli spostamenti tra paesi dell’area Schengen costituiscono un unico soggiorno continuo. I giorni di calendario interi trascorsi fuori dall’area Schengen non vengono conteggiati.',
    enteredVia: (countryCode) => `Ingresso da ${countryCode}`,
    heading: 'Da dove viene questo numero?',
    inclusiveRule: 'Le date di ingresso e di uscita vengono conteggiate entrambe.',
    leftVia: (countryCode) => `Uscita da ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `L’app considera i ${windowDays} giorni di calendario precedenti al ${referenceDate}, includendo anche tale data.`,
    overSummary: (daysOver, allowanceDays) => `Sono ${daysOver} oltre il limite di ${allowanceDays} giorni.`,
    rangeConnector: 'al',
    safeSummary: (safeBuffer) => `Restano ${safeBuffer}.`,
    schengenStay: 'Soggiorno nell’area Schengen',
    verdictOver: 'Risultato del calcolo: oltre il soggiorno breve ordinario. Verifica le fonti ufficiali prima di prenotare o viaggiare.',
    verdictSafe: 'Risultato del calcolo: entro il soggiorno breve ordinario. Verifica le fonti ufficiali prima di prenotare o viaggiare.'
  },
  ru: {
    countedSummary: (days, start, end) => `${days} в период с ${start} по ${end}.`,
    continuityRule: 'Поездки между странами Шенгенской зоны считаются одним непрерывным пребыванием. Полные календарные дни за пределами Шенгенской зоны не учитываются.',
    enteredVia: (countryCode) => `Въезд через ${countryCode}`,
    heading: 'Как получено это число?',
    inclusiveRule: 'Дни въезда и выезда учитываются.',
    leftVia: (countryCode) => `Выезд через ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `Приложение отсчитывает ${windowDays} календарных дней назад от ${referenceDate}, включая эту дату.`,
    overSummary: (daysOver, allowanceDays) => `Это на ${daysOver} больше лимита в ${allowanceDays} дней.`,
    rangeConnector: '—',
    safeSummary: (safeBuffer) => `Остаётся ${safeBuffer}.`,
    schengenStay: 'Пребывание в Шенгенской зоне',
    verdictOver: 'Результат расчёта: превышена обычная продолжительность краткосрочного пребывания. Перед бронированием или поездкой сверьтесь с официальными источниками.',
    verdictSafe: 'Результат расчёта: в пределах обычной продолжительности краткосрочного пребывания. Перед бронированием или поездкой сверьтесь с официальными источниками.'
  },
  tr: {
    countedSummary: (days, start, end) => `${start} ile ${end} arasında ${days}.`,
    continuityRule: 'Schengen ülkeleri arasındaki seyahatler tek bir kesintisiz kalış sayılır. Schengen dışında geçirilen tam takvim günleri sayılmaz.',
    enteredVia: (countryCode) => `${countryCode} üzerinden giriş`,
    heading: 'Bu sayı nasıl hesaplandı?',
    inclusiveRule: 'Giriş ve çıkış tarihleri sayılır.',
    leftVia: (countryCode) => `${countryCode} üzerinden çıkış`,
    lookbackRule: (referenceDate, windowDays) => `Uygulama, ${referenceDate} tarihinden geriye doğru bu tarih dâhil ${windowDays} takvim gününe bakar.`,
    overSummary: (daysOver, allowanceDays) => `Bu, ${allowanceDays} günlük sınırın ${daysOver} üzerindedir.`,
    rangeConnector: '–',
    safeSummary: (safeBuffer) => `${safeBuffer} kalır.`,
    schengenStay: 'Schengen kalışı',
    verdictOver: 'Hesaplama sonucu: olağan kısa süreli kalış hakkının üzerinde. Rezervasyon yapmadan veya seyahat etmeden önce resmî kaynakları kontrol edin.',
    verdictSafe: 'Hesaplama sonucu: olağan kısa süreli kalış hakkı içinde. Rezervasyon yapmadan veya seyahat etmeden önce resmî kaynakları kontrol edin.'
  },
  he: {
    countedSummary: (days, start, end) => `${days} בין ${start} ל־${end}.`,
    continuityRule: 'נסיעה בין מדינות שנגן נחשבת לשהייה רצופה אחת. ימים קלנדריים מלאים מחוץ לאזור שנגן אינם נספרים.',
    enteredVia: (countryCode) => `כניסה דרך ${countryCode}`,
    heading: 'איך התקבל המספר הזה?',
    inclusiveRule: 'גם תאריך הכניסה וגם תאריך היציאה נספרים.',
    leftVia: (countryCode) => `יציאה דרך ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `האפליקציה בוחנת ${windowDays} ימים קלנדריים לאחור מתאריך ${referenceDate}, כולל תאריך זה.`,
    overSummary: (daysOver, allowanceDays) => `זוהי חריגה של ${daysOver} ממגבלת ${allowanceDays} הימים.`,
    rangeConnector: 'עד',
    safeSummary: (safeBuffer) => `נותרו ${safeBuffer}.`,
    schengenStay: 'שהייה באזור שנגן',
    verdictOver: 'תוצאת החישוב: מעבר למשך השהייה הקצרה הרגילה. יש לבדוק מקורות רשמיים לפני הזמנה או נסיעה.',
    verdictSafe: 'תוצאת החישוב: במסגרת משך השהייה הקצרה הרגילה. יש לבדוק מקורות רשמיים לפני הזמנה או נסיעה.'
  },
  ar: {
    countedSummary: (days, start, end) => `${days} بين ${start} و${end}.`,
    continuityRule: 'يُعدّ السفر بين دول منطقة شنغن إقامة واحدة متصلة. ولا تُحتسب أيام التقويم الكاملة التي تُقضى خارج منطقة شنغن.',
    enteredVia: (countryCode) => `الدخول عبر ${countryCode}`,
    heading: 'كيف حُسب هذا الرقم؟',
    inclusiveRule: 'يُحتسب كل من تاريخ الدخول وتاريخ الخروج.',
    leftVia: (countryCode) => `الخروج عبر ${countryCode}`,
    lookbackRule: (referenceDate, windowDays) => `ينظر التطبيق إلى ${windowDays} يومًا تقويميًا قبل ${referenceDate}، مع احتساب هذا التاريخ نفسه.`,
    overSummary: (daysOver, allowanceDays) => `وهذا يزيد بمقدار ${daysOver} على حد ${allowanceDays} يومًا.`,
    rangeConnector: 'إلى',
    safeSummary: (safeBuffer) => `يتبقى ${safeBuffer}.`,
    schengenStay: 'إقامة في منطقة شنغن',
    verdictOver: 'نتيجة الحساب: تجاوز مدة الإقامة القصيرة العادية. تحقّق من المصادر الرسمية قبل الحجز أو السفر.',
    verdictSafe: 'نتيجة الحساب: ضمن مدة الإقامة القصيرة العادية. تحقّق من المصادر الرسمية قبل الحجز أو السفر.'
  }
};

function copyFor(locale: Locale): ExplanationCopy {
  return copy[locale] ?? {
    countedSummary: (days, start, end) => translateExtendedTemplate(locale, '{days} between {start} and {end}.', { days, start, end }),
    continuityRule: translateExtended(locale, copy.en.continuityRule),
    enteredVia: (countryCode) => translateExtendedTemplate(locale, 'Entered via {country}', { country: countryCode }),
    heading: translateExtended(locale, copy.en.heading),
    inclusiveRule: translateExtended(locale, copy.en.inclusiveRule),
    leftVia: (countryCode) => translateExtendedTemplate(locale, 'Left via {country}', { country: countryCode }),
    lookbackRule: (referenceDate, windowDays) => translateExtendedTemplate(locale, 'The app looks back {windowDays} calendar days from {referenceDate}, including {referenceDate} itself.', { referenceDate, windowDays }),
    overSummary: (daysOver, allowanceDays) => translateExtendedTemplate(locale, 'That is {daysOver} over the {allowanceDays}-day limit.', { daysOver, allowanceDays }),
    rangeConnector: translateExtended(locale, copy.en.rangeConnector),
    safeSummary: (safeBuffer) => translateExtendedTemplate(locale, 'That leaves {safeBuffer}.', { safeBuffer }),
    schengenStay: translateExtended(locale, copy.en.schengenStay),
    verdictOver: translateExtended(locale, copy.en.verdictOver),
    verdictSafe: translateExtended(locale, copy.en.verdictSafe)
  };
}

export function buildExplanationState(
  trips: EditableTrip[],
  referenceDate: string,
  locale: Locale = 'en'
): ExplanationState {
  const sortedTrips = sortTrips(trips);
  const usage = calculateUsageOnDate(toEngineTrips(sortedTrips), referenceDate);
  const countedDays = new Set(usage.countedDays);
  const localizedCopy = copyFor(locale);
  const referenceLabel = formatShortDate(locale, usage.referenceDate);
  const windowStartLabel = formatShortDate(locale, usage.windowStart);
  const windowEndLabel = formatShortDate(locale, usage.windowEnd);
  const countedSummary = localizedCopy
    .countedSummary(formatCountedDays(locale, usage.daysUsed), windowStartLabel, windowEndLabel)
    .replace(/\.\.$/u, '.');

  return {
    countedTripRows: buildCountedTripRows(sortedTrips, countedDays, locale, referenceDate),
    heading: localizedCopy.heading,
    ruleBullets: [
      localizedCopy.inclusiveRule,
      localizedCopy.lookbackRule(referenceLabel, formatNumber(locale, 180)),
      localizedCopy.continuityRule
    ],
    summary: usage.overLimit
      ? `${countedSummary} ${localizedCopy.overSummary(formatPlainDays(locale, usage.overBy), formatNumber(locale, 90))}`
      : `${countedSummary} ${localizedCopy.safeSummary(formatSafeBufferDays(locale, usage.daysRemaining))}`,
    verdictLine: usage.overLimit ? localizedCopy.verdictOver : localizedCopy.verdictSafe,
    windowLabel: formatDateRange(locale, usage.windowStart, usage.windowEnd)
  };
}

function buildCountedTripRows(trips: EditableTrip[], countedDays: Set<string>, locale: Locale, referenceDate: string): CountedTripRow[] {
  return trips
    .map((trip) => {
      const days = countTripDaysInSet(trip, countedDays, referenceDate);
      if (days <= 0) return null;
      return {
        label: trip.label ?? formatTripRouteLabel(trip, locale),
        rangeLabel: formatDateRange(locale, tripEntryDate(trip), tripExitDate(trip, referenceDate)),
        daysLabel: formatCountedRowDays(locale, days)
      } satisfies CountedTripRow;
    })
    .filter((row): row is CountedTripRow => row !== null);
}

function countTripDaysInSet(trip: EditableTrip, countedDays: Set<string>, referenceDate: string): number {
  let count = 0;
  const tripDays = new Set<string>();
  for (const stay of toEngineTrips([trip], referenceDate)) {
    const exit = parseISODate(stay.exitDate);
    for (let current = parseISODate(stay.entryDate); current <= exit; current = addDays(current, 1)) {
      tripDays.add(formatISODate(current));
    }
  }
  for (const day of tripDays) if (countedDays.has(day)) count += 1;
  return count;
}

function formatShortDate(locale: Locale, isoDate: string): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(parseISODate(isoDate));
}

function formatDateRange(locale: Locale, startDate: string, endDate: string): string {
  return `${formatShortDate(locale, startDate)} ${copyFor(locale).rangeConnector} ${formatShortDate(locale, endDate)}`;
}

function formatTripRouteLabel(
  trip: Pick<EditableTrip, 'entryCountryCode' | 'exitCountryCode'>,
  locale: Locale
): string {
  if (trip.entryCountryCode && trip.exitCountryCode) return `${trip.entryCountryCode} → ${trip.exitCountryCode}`;
  if (trip.entryCountryCode) return copyFor(locale).enteredVia(trip.entryCountryCode);
  if (trip.exitCountryCode) return copyFor(locale).leftVia(trip.exitCountryCode);
  return copyFor(locale).schengenStay;
}

function formatCountedDays(locale: Locale, count: number): string {
  const number = formatNumber(locale, count);
  const category = pluralCategory(locale, count);
  switch (locale) {
    case 'en': return `${number} counted ${category === 'one' ? 'day' : 'days'}`;
    case 'fr': return `${number} ${category === 'one' ? 'jour compté' : 'jours comptés'}`;
    case 'de': return `${number} ${category === 'one' ? 'gezählter Tag' : 'gezählte Tage'}`;
    case 'es': return `${number} ${category === 'one' ? 'día contabilizado' : 'días contabilizados'}`;
    case 'it': return `${number} ${category === 'one' ? 'giorno conteggiato' : 'giorni conteggiati'}`;
    case 'ru': return `${number} ${category === 'one' ? 'учтённый день' : category === 'few' ? 'учтённых дня' : 'учтённых дней'}`;
    case 'tr': return `${number} gün sayıldı`;
    case 'he': return `${number} ${category === 'one' ? 'יום שנספר' : 'ימים שנספרו'}`;
    case 'ar': return formatArabicCountedDays(number, category);
    default: return translateExtendedTemplate(locale, category === 'one' ? '{count} counted day' : '{count} counted days', { count: number });
  }
}

function formatCountedRowDays(locale: Locale, count: number): string {
  if (locale === 'en') return `${formatPlainDays(locale, count)} counted`;
  return formatCountedDays(locale, count);
}

function formatSafeBufferDays(locale: Locale, count: number): string {
  const number = formatNumber(locale, count);
  const category = pluralCategory(locale, count);
  switch (locale) {
    case 'en': return `${number} safe buffer ${category === 'one' ? 'day' : 'days'}`;
    case 'fr': return `${number} ${category === 'one' ? 'jour' : 'jours'} de marge de sécurité`;
    case 'de': return `${number} ${category === 'one' ? 'sicherer Puffertag' : 'sichere Puffertage'}`;
    case 'es': return `${number} ${category === 'one' ? 'día' : 'días'} de margen seguro`;
    case 'it': return `${number} ${category === 'one' ? 'giorno' : 'giorni'} di margine sicuro`;
    case 'ru': return `${formatPlainDays(locale, count)} безопасного запаса`;
    case 'tr': return `${number} günlük güvenli pay`;
    case 'he': return `${formatPlainDays(locale, count)} של מרווח בטוח`;
    case 'ar': return `هامش أمان قدره ${formatPlainDays(locale, count)}`;
    default: return translateExtendedTemplate(locale, category === 'one' ? '{count} safe buffer day' : '{count} safe buffer days', { count: number });
  }
}

function formatPlainDays(locale: Locale, count: number): string {
  const number = formatNumber(locale, count);
  const category = pluralCategory(locale, count);
  switch (locale) {
    case 'en': return `${number} ${category === 'one' ? 'day' : 'days'}`;
    case 'fr': return `${number} ${category === 'one' ? 'jour' : 'jours'}`;
    case 'de': return `${number} ${category === 'one' ? 'Tag' : 'Tage'}`;
    case 'es': return `${number} ${category === 'one' ? 'día' : 'días'}`;
    case 'it': return `${number} ${category === 'one' ? 'giorno' : 'giorni'}`;
    case 'ru': return `${number} ${category === 'one' ? 'день' : category === 'few' ? 'дня' : 'дней'}`;
    case 'tr': return `${number} gün`;
    case 'he': return `${number} ${category === 'one' ? 'יום' : 'ימים'}`;
    case 'ar': return formatArabicPlainDays(number, category);
    default: return formatLocalizedCount(locale, count, 'day').text;
  }
}

function formatArabicCountedDays(number: string, category: Intl.LDMLPluralRule): string {
  if (category === 'one') return `${number} يوم محتسب`;
  if (category === 'two') return `${number} يومان محتسبان`;
  if (category === 'few') return `${number} أيام محتسبة`;
  return `${number} يومًا محتسبًا`;
}

function formatArabicPlainDays(number: string, category: Intl.LDMLPluralRule): string {
  if (category === 'one') return `${number} يوم`;
  if (category === 'two') return `${number} يومان`;
  if (category === 'few') return `${number} أيام`;
  return `${number} يومًا`;
}

function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

function pluralCategory(locale: Locale, value: number): Intl.LDMLPluralRule {
  return new Intl.PluralRules(intlLocale(locale)).select(value);
}

function dateLocale(locale: Locale): string {
  return locale === 'en' ? 'en-US' : intlLocale(locale);
}
