import { intlLocale, type Locale } from './locales';

export type DateRangeCalendarUiKey =
  | 'chooseRange'
  | 'instructions'
  | 'nextMonth'
  | 'previousMonth'
  | 'chooseExit';

const translations: Record<Locale, Record<DateRangeCalendarUiKey, string>> = {
  en: {
    chooseRange: 'Choose entry and exit dates',
    instructions: 'Drag across dates, or choose an entry and exit date.',
    nextMonth: 'Next month',
    previousMonth: 'Previous month',
    chooseExit: 'Entry selected. Choose an exit date.'
  },
  fr: {
    chooseRange: 'Choisir les dates d’entrée et de sortie',
    instructions: 'Faites glisser sur les dates, ou choisissez une date d’entrée puis de sortie.',
    nextMonth: 'Mois suivant',
    previousMonth: 'Mois précédent',
    chooseExit: 'Entrée sélectionnée. Choisissez une date de sortie.'
  },
  de: {
    chooseRange: 'Einreise- und Ausreisedatum wählen',
    instructions: 'Ziehen Sie über die Daten oder wählen Sie Einreise und Ausreise nacheinander.',
    nextMonth: 'Nächster Monat',
    previousMonth: 'Vorheriger Monat',
    chooseExit: 'Einreise gewählt. Wählen Sie das Ausreisedatum.'
  },
  es: {
    chooseRange: 'Elegir fechas de entrada y salida',
    instructions: 'Arrastra por las fechas o elige primero la entrada y luego la salida.',
    nextMonth: 'Mes siguiente',
    previousMonth: 'Mes anterior',
    chooseExit: 'Entrada seleccionada. Elige una fecha de salida.'
  },
  it: {
    chooseRange: 'Scegli le date di ingresso e uscita',
    instructions: 'Trascina sulle date oppure scegli prima l’ingresso e poi l’uscita.',
    nextMonth: 'Mese successivo',
    previousMonth: 'Mese precedente',
    chooseExit: 'Ingresso selezionato. Scegli una data di uscita.'
  },
  'pt-br': {
    chooseRange: 'Escolher datas de entrada e saída',
    instructions: 'Arraste pelas datas ou escolha primeiro a entrada e depois a saída.',
    nextMonth: 'Próximo mês',
    previousMonth: 'Mês anterior',
    chooseExit: 'Entrada selecionada. Escolha uma data de saída.'
  },
  ru: {
    chooseRange: 'Выберите даты въезда и выезда',
    instructions: 'Проведите по датам или выберите сначала въезд, затем выезд.',
    nextMonth: 'Следующий месяц',
    previousMonth: 'Предыдущий месяц',
    chooseExit: 'Дата въезда выбрана. Выберите дату выезда.'
  },
  uk: {
    chooseRange: 'Виберіть дати в’їзду та виїзду',
    instructions: 'Проведіть по датах або виберіть спочатку в’їзд, а потім виїзд.',
    nextMonth: 'Наступний місяць',
    previousMonth: 'Попередній місяць',
    chooseExit: 'Дату в’їзду вибрано. Виберіть дату виїзду.'
  },
  tr: {
    chooseRange: 'Giriş ve çıkış tarihlerini seçin',
    instructions: 'Tarihlerin üzerinde sürükleyin veya önce giriş, sonra çıkış tarihini seçin.',
    nextMonth: 'Sonraki ay',
    previousMonth: 'Önceki ay',
    chooseExit: 'Giriş seçildi. Çıkış tarihini seçin.'
  },
  sr: {
    chooseRange: 'Izaberite datume ulaska i izlaska',
    instructions: 'Prevucite preko datuma ili prvo izaberite ulazak, pa izlazak.',
    nextMonth: 'Sledeći mesec',
    previousMonth: 'Prethodni mesec',
    chooseExit: 'Ulazak je izabran. Izaberite datum izlaska.'
  },
  sq: {
    chooseRange: 'Zgjidhni datat e hyrjes dhe daljes',
    instructions: 'Zvarritni mbi data ose zgjidhni fillimisht hyrjen dhe më pas daljen.',
    nextMonth: 'Muaji tjetër',
    previousMonth: 'Muaji i mëparshëm',
    chooseExit: 'Hyrja u zgjodh. Zgjidhni datën e daljes.'
  },
  ka: {
    chooseRange: 'აირჩიეთ შესვლისა და გასვლის თარიღები',
    instructions: 'გადაატარეთ თარიღებზე ან ჯერ შესვლა, შემდეგ გასვლა აირჩიეთ.',
    nextMonth: 'შემდეგი თვე',
    previousMonth: 'წინა თვე',
    chooseExit: 'შესვლა არჩეულია. აირჩიეთ გასვლის თარიღი.'
  },
  'zh-cn': {
    chooseRange: '选择入境和出境日期',
    instructions: '在日期上拖动，或依次选择入境和出境日期。',
    nextMonth: '下个月',
    previousMonth: '上个月',
    chooseExit: '已选择入境日期。请选择出境日期。'
  },
  ja: {
    chooseRange: '入域日と出域日を選択',
    instructions: '日付をドラッグするか、入域日と出域日を順に選択してください。',
    nextMonth: '翌月',
    previousMonth: '前月',
    chooseExit: '入域日を選択しました。出域日を選択してください。'
  },
  ko: {
    chooseRange: '입국일과 출국일 선택',
    instructions: '날짜 위로 드래그하거나 입국일과 출국일을 차례로 선택하세요.',
    nextMonth: '다음 달',
    previousMonth: '이전 달',
    chooseExit: '입국일을 선택했습니다. 출국일을 선택하세요.'
  },
  he: {
    chooseRange: 'בחירת תאריכי כניסה ויציאה',
    instructions: 'גררו על פני התאריכים, או בחרו תחילה כניסה ולאחר מכן יציאה.',
    nextMonth: 'החודש הבא',
    previousMonth: 'החודש הקודם',
    chooseExit: 'תאריך הכניסה נבחר. בחרו תאריך יציאה.'
  },
  ar: {
    chooseRange: 'اختر تاريخي الدخول والخروج',
    instructions: 'اسحب عبر التواريخ، أو اختر تاريخ الدخول ثم تاريخ الخروج.',
    nextMonth: 'الشهر التالي',
    previousMonth: 'الشهر السابق',
    chooseExit: 'تم اختيار تاريخ الدخول. اختر تاريخ الخروج.'
  }
};

export function createDateRangeCalendarUiTranslator(locale: Locale): (key: DateRangeCalendarUiKey) => string {
  return (key) => translations[locale][key];
}

export function formatDateRangeSelection(locale: Locale, count: number): string {
  const formatted = new Intl.NumberFormat(intlLocale(locale)).format(count);
  const phrases: Record<Locale, string> = {
    en: count === 1 ? `${formatted} day selected` : `${formatted} days selected`,
    fr: `${formatted} jours sélectionnés`,
    de: `${formatted} Tage ausgewählt`,
    es: `${formatted} días seleccionados`,
    it: `${formatted} giorni selezionati`,
    'pt-br': `${formatted} dias selecionados`,
    ru: `Выбрано дней: ${formatted}`,
    uk: `Вибрано днів: ${formatted}`,
    tr: `${formatted} gün seçildi`,
    sr: `Izabrano dana: ${formatted}`,
    sq: `${formatted} ditë të zgjedhura`,
    ka: `არჩეული დღეები: ${formatted}`,
    'zh-cn': `已选择 ${formatted} 天`,
    ja: `${formatted}日間を選択`,
    ko: `${formatted}일 선택됨`,
    he: `נבחרו ${formatted} ימים`,
    ar: `تم اختيار ${formatted} أيام`
  };
  return phrases[locale];
}
