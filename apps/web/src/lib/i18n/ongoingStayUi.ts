import { SUPPORTED_LOCALES, type Locale } from './locales';
import { translateExtended } from './extendedLocaleStrings';

type OngoingCatalog = Record<'label' | 'help' | 'leaveBy' | 'calculating' | 'ongoing', string>;

const catalogs: Partial<Record<Locale, OngoingCatalog>> & { en: OngoingCatalog } = {
  en: { label: "I don't know the exit date yet", help: 'Use this for a current or future stay. SCHNGN will calculate the latest safe exit from your other trips.', leaveBy: 'Latest safe exit', calculating: 'Add a valid entry date to calculate the latest safe exit.', ongoing: 'Exit date open' },
  fr: { label: 'Je ne connais pas encore la date de sortie', help: 'Utilisez cette option pour un séjour actuel ou futur. SCHNGN calcule la dernière sortie sûre à partir de vos autres voyages.', leaveBy: 'Dernière sortie sûre', calculating: 'Ajoutez une date d’entrée valide pour calculer la dernière sortie sûre.', ongoing: 'Date de sortie ouverte' },
  de: { label: 'Ich kenne das Ausreisedatum noch nicht', help: 'Nutzen Sie dies für einen aktuellen oder künftigen Aufenthalt. SCHNGN berechnet die späteste sichere Ausreise aus Ihren anderen Reisen.', leaveBy: 'Späteste sichere Ausreise', calculating: 'Geben Sie ein gültiges Einreisedatum ein, um die späteste sichere Ausreise zu berechnen.', ongoing: 'Ausreisedatum offen' },
  es: { label: 'Todavía no sé la fecha de salida', help: 'Usa esta opción para una estancia actual o futura. SCHNGN calculará la última salida segura a partir de tus otros viajes.', leaveBy: 'Última salida segura', calculating: 'Añade una fecha de entrada válida para calcular la última salida segura.', ongoing: 'Fecha de salida abierta' },
  it: { label: 'Non conosco ancora la data di uscita', help: 'Usa questa opzione per un soggiorno attuale o futuro. SCHNGN calcolerà l’ultima uscita sicura in base agli altri viaggi.', leaveBy: 'Ultima uscita sicura', calculating: 'Aggiungi una data di ingresso valida per calcolare l’ultima uscita sicura.', ongoing: 'Data di uscita aperta' },
  ru: { label: 'Я пока не знаю дату выезда', help: 'Используйте эту опцию для текущей или будущей поездки. SCHNGN рассчитает последнюю безопасную дату выезда с учётом других поездок.', leaveBy: 'Последняя безопасная дата выезда', calculating: 'Укажите корректную дату въезда, чтобы рассчитать последнюю безопасную дату выезда.', ongoing: 'Дата выезда не указана' },
  tr: { label: 'Çıkış tarihini henüz bilmiyorum', help: 'Bunu mevcut veya gelecekteki bir kalış için kullanın. SCHNGN diğer seyahatlerinize göre en geç güvenli çıkışı hesaplar.', leaveBy: 'En geç güvenli çıkış', calculating: 'En geç güvenli çıkışı hesaplamak için geçerli bir giriş tarihi ekleyin.', ongoing: 'Çıkış tarihi açık' },
  he: { label: 'עדיין לא ידוע לי תאריך היציאה', help: 'אפשר להשתמש באפשרות הזו לשהייה נוכחית או עתידית. SCHNGN יחשב את תאריך היציאה הבטוח האחרון לפי הנסיעות האחרות.', leaveBy: 'תאריך היציאה הבטוח האחרון', calculating: 'הוסיפו תאריך כניסה תקין כדי לחשב את תאריך היציאה הבטוח האחרון.', ongoing: 'תאריך היציאה פתוח' },
  ar: { label: 'لا أعرف تاريخ الخروج بعد', help: 'استخدم هذا الخيار لإقامة حالية أو مستقبلية. سيحسب SCHNGN آخر تاريخ خروج آمن استنادًا إلى رحلاتك الأخرى.', leaveBy: 'آخر تاريخ خروج آمن', calculating: 'أضف تاريخ دخول صالحًا لحساب آخر تاريخ خروج آمن.', ongoing: 'تاريخ الخروج مفتوح' }
};

export type OngoingStayUiKey = keyof (typeof catalogs)['en'];

export function createOngoingStayUiTranslator(locale: Locale): (key: OngoingStayUiKey) => string {
  return (key) => catalogs[locale]?.[key] ?? translateExtended(locale, catalogs.en[key]);
}

export function ongoingStayCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(catalogs.en).length])) as Record<Locale, number>;
}
