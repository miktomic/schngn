import type { Locale } from '$lib/i18n';
import { translateExtended } from '../i18n/extendedLocaleStrings';

const FULL_DISCLAIMER_COPY =
  'SCHNGN is a planning calculator, not legal advice and not a guarantee of entry. It estimates ordinary short stays under the Schengen 90/180-day rule. It does not account for residence permits, long-stay or national visas, bilateral waiver agreements, nationality-specific exceptions, work/study/asylum status, EES/ETIAS transition issues, or border-officer discretion. Always verify with official sources before booking or travelling.';

const FOOTER_DISCLAIMER_COPY = 'Planning aid only. Not legal advice or a guarantee of entry. Verify with official sources.';

export const OFFICIAL_SOURCE_LINKS = [
  {
    label: 'European Commission short-stay calculator',
    href: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en'
  },
  { label: 'Entry/Exit System information', href: 'https://travel-europe.europa.eu/en/ees' },
  { label: 'ETIAS information', href: 'https://travel-europe.europa.eu/en/etias' }
] as const;

const legalCopy: Partial<Record<Locale, { full: string; footer: string }>> & { en: { full: string; footer: string } } = {
  en: { full: FULL_DISCLAIMER_COPY, footer: FOOTER_DISCLAIMER_COPY },
  fr: { full: 'SCHNGN est un calculateur de planification, pas un conseil juridique ni une garantie d’entrée. Il estime les courts séjours ordinaires selon la règle Schengen des 90 jours sur 180. Il ne tient pas compte des titres de séjour, visas de long séjour ou visas nationaux, accords bilatéraux d’exemption, exceptions liées à la nationalité, statuts de travail, d’études ou d’asile, transitions EES/ETIAS ni du pouvoir d’appréciation des autorités frontalières. Vérifiez toujours les sources officielles avant de réserver ou de voyager.', footer: 'Outil de planification uniquement. Ni conseil juridique ni garantie d’entrée. Vérifiez les sources officielles.' },
  de: { full: 'SCHNGN ist ein Planungsrechner, keine Rechtsberatung und keine Garantie für die Einreise. Er schätzt gewöhnliche Kurzaufenthalte nach der Schengen-Regel 90 Tage in 180 Tagen. Aufenthaltstitel, Langzeit- oder nationale Visa, bilaterale Befreiungsabkommen, nationalitätsspezifische Ausnahmen, Arbeits-, Studien- oder Asylstatus, EES/ETIAS-Übergangsfragen und das Ermessen der Grenzbehörden werden nicht berücksichtigt. Prüfen Sie vor Buchung oder Reise immer die offiziellen Quellen.', footer: 'Nur Planungshilfe. Keine Rechtsberatung oder Einreisegarantie. Prüfen Sie offizielle Quellen.' },
  es: { full: 'SCHNGN es una calculadora de planificación, no asesoramiento jurídico ni una garantía de entrada. Estima estancias cortas ordinarias según la regla Schengen de 90 días en 180. No contempla permisos de residencia, visados nacionales o de larga duración, acuerdos bilaterales de exención, excepciones por nacionalidad, situaciones de trabajo, estudios o asilo, transiciones EES/ETIAS ni la discreción de las autoridades fronterizas. Consulta siempre fuentes oficiales antes de reservar o viajar.', footer: 'Solo como ayuda de planificación. No es asesoramiento jurídico ni garantiza la entrada. Consulta fuentes oficiales.' },
  it: { full: 'SCHNGN è un calcolatore di pianificazione, non una consulenza legale né una garanzia di ingresso. Stima i normali soggiorni brevi secondo la regola Schengen dei 90 giorni su 180. Non considera permessi di soggiorno, visti nazionali o di lunga durata, accordi bilaterali di esenzione, eccezioni legate alla nazionalità, status di lavoro, studio o asilo, transizioni EES/ETIAS né la discrezionalità delle autorità di frontiera. Verifica sempre le fonti ufficiali prima di prenotare o viaggiare.', footer: 'Solo strumento di pianificazione. Non è consulenza legale né garanzia di ingresso. Verifica le fonti ufficiali.' },
  ru: { full: 'SCHNGN — это калькулятор для планирования, а не юридическая консультация и не гарантия въезда. Он оценивает обычные краткосрочные пребывания по шенгенскому правилу 90 дней из 180. Он не учитывает виды на жительство, долгосрочные или национальные визы, двусторонние соглашения об освобождении, исключения по гражданству, статус работы, учёбы или убежища, переходные вопросы EES/ETIAS и усмотрение пограничных органов. Перед бронированием или поездкой всегда сверяйтесь с официальными источниками.', footer: 'Только для планирования. Не является юридической консультацией или гарантией въезда. Проверяйте официальные источники.' },
  tr: { full: 'SCHNGN bir planlama hesaplayıcısıdır; hukuki tavsiye veya giriş garantisi değildir. Schengen 90/180 gün kuralı kapsamındaki olağan kısa süreli kalışları tahmin eder. Oturma izinlerini, uzun süreli veya ulusal vizeleri, ikili muafiyet anlaşmalarını, vatandaşlığa özgü istisnaları, çalışma, öğrenim veya iltica durumunu, EES/ETIAS geçiş konularını ya da sınır görevlilerinin takdir yetkisini hesaba katmaz. Rezervasyon yapmadan veya seyahat etmeden önce daima resmî kaynakları kontrol edin.', footer: 'Yalnızca planlama yardımıdır. Hukuki tavsiye veya giriş garantisi değildir. Resmî kaynakları kontrol edin.' },
  he: { full: 'SCHNGN הוא מחשבון לתכנון בלבד, ולא ייעוץ משפטי או הבטחה לכניסה. הוא מעריך שהיות קצרות רגילות לפי כלל שנגן של 90 ימים מתוך 180. הוא אינו מתחשב בהיתרי שהייה, באשרות ארוכות־טווח או לאומיות, בהסכמי פטור דו־צדדיים, בחריגים לפי אזרחות, במעמד עבודה, לימודים או מקלט, בתקופות מעבר של EES/ETIAS או בשיקול הדעת של רשויות הגבול. לפני הזמנה או נסיעה יש לבדוק תמיד מקורות רשמיים.', footer: 'כלי לתכנון בלבד. אינו ייעוץ משפטי או הבטחה לכניסה. יש לבדוק מקורות רשמיים.' },
  ar: { full: 'SCHNGN حاسبة للتخطيط فقط، وليست مشورة قانونية ولا ضمانًا للدخول. وهي تقدّر الإقامات القصيرة العادية وفق قاعدة شنغن 90 يومًا من أصل 180. ولا تأخذ في الحسبان تصاريح الإقامة أو التأشيرات الطويلة أو الوطنية أو اتفاقيات الإعفاء الثنائية أو الاستثناءات المرتبطة بالجنسية أو أوضاع العمل أو الدراسة أو اللجوء أو مراحل انتقال EES/ETIAS أو السلطة التقديرية لمسؤولي الحدود. تحقّق دائمًا من المصادر الرسمية قبل الحجز أو السفر.', footer: 'أداة للتخطيط فقط. ليست مشورة قانونية ولا ضمانًا للدخول. تحقّق من المصادر الرسمية.' }
};

const sourceLabels: Partial<Record<Locale, readonly [string, string, string]>> & { en: readonly [string, string, string] } = {
  en: ['European Commission short-stay calculator', 'Entry/Exit System information', 'ETIAS information'],
  fr: ['Calculateur de court séjour de la Commission européenne', 'Informations sur le système d’entrée/de sortie', 'Informations ETIAS'],
  de: ['Kurzaufenthaltsrechner der Europäischen Kommission', 'Informationen zum Einreise-/Ausreisesystem', 'ETIAS-Informationen'],
  es: ['Calculadora de estancias cortas de la Comisión Europea', 'Información del Sistema de Entradas y Salidas', 'Información sobre ETIAS'],
  it: ['Calcolatore per soggiorni brevi della Commissione europea', 'Informazioni sul sistema di ingressi/uscite', 'Informazioni ETIAS'],
  ru: ['Калькулятор краткосрочного пребывания Еврокомиссии', 'Информация о системе въезда/выезда', 'Информация ETIAS'],
  tr: ['Avrupa Komisyonu kısa süreli kalış hesaplayıcısı', 'Giriş/Çıkış Sistemi bilgileri', 'ETIAS bilgileri'],
  he: ['מחשבון השהייה הקצרה של הנציבות האירופית', 'מידע על מערכת הכניסה והיציאה', 'מידע על ETIAS'],
  ar: ['حاسبة الإقامة القصيرة للمفوضية الأوروبية', 'معلومات نظام الدخول والخروج', 'معلومات ETIAS']
};

export function localizedLegalCopy(locale: Locale): { full: string; footer: string } {
  const copy = legalCopy[locale] ?? {
    full: translateExtended(locale, FULL_DISCLAIMER_COPY),
    footer: translateExtended(locale, FOOTER_DISCLAIMER_COPY)
  };
  if (locale !== 'uk') return copy;
  return {
    ...copy,
    full: `${copy.full} Тимчасовий захист або інший статус проживання може змінити, які дні враховуються; SCHNGN розраховує лише звичайні короткострокові перебування.`
  };
}

export function localizedOfficialSourceLinks(locale: Locale) {
  const labels = sourceLabels[locale] ?? sourceLabels.en.map((label) => translateExtended(locale, label));
  return OFFICIAL_SOURCE_LINKS.map((source, index) => ({ ...source, label: labels[index] }));
}
