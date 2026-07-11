import type { Locale } from './locales';

const catalogs = {
  en: { label: "I'm currently in Schengen", help: 'Leave the departure date open and calculate when I need to leave.', leaveBy: 'Leave by', calculating: 'Add a valid arrival date to calculate your latest departure.', ongoing: 'Currently in Schengen' },
  fr: { label: 'Je suis actuellement dans l’espace Schengen', help: 'Laissez la date de départ ouverte pour calculer quand vous devez partir.', leaveBy: 'Partir au plus tard le', calculating: 'Ajoutez une date d’arrivée valide pour calculer votre dernier jour de départ.', ongoing: 'Actuellement dans l’espace Schengen' },
  de: { label: 'Ich bin derzeit im Schengen-Raum', help: 'Lassen Sie das Abreisedatum offen, um den spätesten Abreisetag zu berechnen.', leaveBy: 'Späteste Abreise', calculating: 'Geben Sie ein gültiges Ankunftsdatum ein, um die späteste Abreise zu berechnen.', ongoing: 'Derzeit im Schengen-Raum' },
  es: { label: 'Actualmente estoy en el espacio Schengen', help: 'Deja abierta la fecha de salida para calcular cuándo debes salir.', leaveBy: 'Salir como máximo el', calculating: 'Añade una fecha de llegada válida para calcular tu última salida.', ongoing: 'Actualmente en Schengen' },
  it: { label: 'Sono attualmente nell’area Schengen', help: 'Lascia aperta la data di partenza per calcolare quando devi uscire.', leaveBy: 'Partenza entro il', calculating: 'Aggiungi una data di arrivo valida per calcolare l’ultima partenza.', ongoing: 'Attualmente nell’area Schengen' },
  ru: { label: 'Я сейчас нахожусь в Шенгенской зоне', help: 'Оставьте дату выезда открытой, чтобы рассчитать, когда нужно уехать.', leaveBy: 'Выехать не позднее', calculating: 'Укажите корректную дату въезда, чтобы рассчитать последний день выезда.', ongoing: 'Сейчас в Шенгенской зоне' },
  tr: { label: 'Şu anda Schengen bölgesindeyim', help: 'Ne zaman ayrılmanız gerektiğini hesaplamak için çıkış tarihini açık bırakın.', leaveBy: 'En geç çıkış', calculating: 'En geç çıkışınızı hesaplamak için geçerli bir giriş tarihi ekleyin.', ongoing: 'Şu anda Schengen bölgesinde' },
  he: { label: 'אני נמצא/ת כעת באזור שנגן', help: 'השאירו את תאריך היציאה פתוח כדי לחשב מתי צריך לצאת.', leaveBy: 'יש לצאת עד', calculating: 'הוסיפו תאריך כניסה תקין כדי לחשב את מועד היציאה האחרון.', ongoing: 'כעת באזור שנגן' },
  ar: { label: 'أنا موجود حاليًا في منطقة شنغن', help: 'اترك تاريخ الخروج مفتوحًا لحساب موعد المغادرة المطلوب.', leaveBy: 'المغادرة في موعد أقصاه', calculating: 'أضف تاريخ دخول صالحًا لحساب آخر موعد للمغادرة.', ongoing: 'موجود حاليًا في شنغن' }
} satisfies Record<Locale, Record<'label' | 'help' | 'leaveBy' | 'calculating' | 'ongoing', string>>;

export type OngoingStayUiKey = keyof (typeof catalogs)['en'];

export function createOngoingStayUiTranslator(locale: Locale): (key: OngoingStayUiKey) => string {
  return (key) => catalogs[locale][key];
}

export function ongoingStayCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(Object.entries(catalogs).map(([locale, catalog]) => [locale, Object.keys(catalog).length])) as Record<Locale, number>;
}
