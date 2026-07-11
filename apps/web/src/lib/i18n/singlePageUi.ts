import type { Locale } from './locales';

export type SinglePageUiKey =
  | 'skipToContent'
  | 'jumpTo'
  | 'answer'
  | 'trips'
  | 'timeline'
  | 'plan'
  | 'details'
  | 'report'
  | 'account'
  | 'addPreviousTrip'
  | 'noPreviousTrips'
  | 'historyAssumption'
  | 'savedResult'
  | 'unsavedPreview'
  | 'currentTrips'
  | 'olderTrips'
  | 'showOlder'
  | 'hideOlder'
  | 'planNextTrip'
  | 'detailsSummary'
  | 'reportSummary'
  | 'accountSummary'
  | 'expand'
  | 'collapse';

type SinglePageUiCatalog = Record<SinglePageUiKey, string>;

const en: SinglePageUiCatalog = {
  skipToContent: 'Skip to main content',
  jumpTo: 'Jump to',
  answer: 'Your answer',
  trips: 'Trips',
  timeline: 'Timeline',
  plan: 'Plan',
  details: 'Calculation details',
  report: 'Report',
  account: 'Account & data',
  addPreviousTrip: 'Add a previous trip',
  noPreviousTrips: 'I have no previous Schengen trips',
  historyAssumption: 'We’ll calculate as if you spent no days in Schengen during the last 180 days.',
  savedResult: 'Based on your saved trips',
  unsavedPreview: 'Preview · not saved',
  currentTrips: 'Current trips',
  olderTrips: 'Older trips',
  showOlder: 'Show older trips',
  hideOlder: 'Hide older trips',
  planNextTrip: 'Plan your next trip',
  detailsSummary: 'See how your 90/180-day result was calculated.',
  reportSummary: 'Create a clear summary of your trips and result.',
  accountSummary: 'Sign in, sync, export, or delete your data.',
  expand: 'Expand',
  collapse: 'Collapse'
};

const catalogs: Record<Locale, SinglePageUiCatalog> = {
  en,
  fr: {
    skipToContent: 'Aller au contenu principal',
    jumpTo: 'Accéder à',
    answer: 'Votre résultat',
    trips: 'Voyages',
    timeline: 'Chronologie',
    plan: 'Planifier',
    details: 'Détails du calcul',
    report: 'Rapport',
    account: 'Compte et données',
    addPreviousTrip: 'Ajouter un voyage précédent',
    noPreviousTrips: 'Je n’ai effectué aucun voyage Schengen auparavant',
    historyAssumption: 'Le calcul supposera que vous n’avez passé aucun jour dans l’espace Schengen au cours des 180 derniers jours.',
    savedResult: 'D’après vos voyages enregistrés',
    unsavedPreview: 'Aperçu · non enregistré',
    currentTrips: 'Voyages actuels',
    olderTrips: 'Voyages plus anciens',
    showOlder: 'Afficher les voyages plus anciens',
    hideOlder: 'Masquer les voyages plus anciens',
    planNextTrip: 'Planifiez votre prochain voyage',
    detailsSummary: 'Découvrez comment votre résultat selon la règle des 90/180 jours a été calculé.',
    reportSummary: 'Créez un récapitulatif clair de vos voyages et de votre résultat.',
    accountSummary: 'Connectez-vous, synchronisez, exportez ou supprimez vos données.',
    expand: 'Développer',
    collapse: 'Réduire'
  },
  de: {
    skipToContent: 'Zum Hauptinhalt springen',
    jumpTo: 'Springen zu',
    answer: 'Ihr Ergebnis',
    trips: 'Reisen',
    timeline: 'Zeitleiste',
    plan: 'Planen',
    details: 'Berechnungsdetails',
    report: 'Bericht',
    account: 'Konto & Daten',
    addPreviousTrip: 'Frühere Reise hinzufügen',
    noPreviousTrips: 'Ich habe keine früheren Schengen-Reisen',
    historyAssumption: 'Wir berechnen Ihr Ergebnis unter der Annahme, dass Sie in den letzten 180 Tagen keine Tage im Schengen-Raum verbracht haben.',
    savedResult: 'Basierend auf Ihren gespeicherten Reisen',
    unsavedPreview: 'Vorschau · nicht gespeichert',
    currentTrips: 'Aktuelle Reisen',
    olderTrips: 'Ältere Reisen',
    showOlder: 'Ältere Reisen anzeigen',
    hideOlder: 'Ältere Reisen ausblenden',
    planNextTrip: 'Planen Sie Ihre nächste Reise',
    detailsSummary: 'Sehen Sie, wie Ihr Ergebnis nach der 90/180-Tage-Regel berechnet wurde.',
    reportSummary: 'Erstellen Sie eine klare Zusammenfassung Ihrer Reisen und Ihres Ergebnisses.',
    accountSummary: 'Anmelden, synchronisieren, Daten exportieren oder löschen.',
    expand: 'Aufklappen',
    collapse: 'Zuklappen'
  },
  es: {
    skipToContent: 'Ir al contenido principal',
    jumpTo: 'Ir a',
    answer: 'Tu resultado',
    trips: 'Viajes',
    timeline: 'Cronología',
    plan: 'Planificar',
    details: 'Detalles del cálculo',
    report: 'Informe',
    account: 'Cuenta y datos',
    addPreviousTrip: 'Añadir un viaje anterior',
    noPreviousTrips: 'No tengo viajes Schengen anteriores',
    historyAssumption: 'Calcularemos como si no hubieras pasado ningún día en el espacio Schengen durante los últimos 180 días.',
    savedResult: 'Basado en tus viajes guardados',
    unsavedPreview: 'Vista previa · sin guardar',
    currentTrips: 'Viajes actuales',
    olderTrips: 'Viajes anteriores',
    showOlder: 'Mostrar viajes anteriores',
    hideOlder: 'Ocultar viajes anteriores',
    planNextTrip: 'Planifica tu próximo viaje',
    detailsSummary: 'Consulta cómo se ha calculado tu resultado según la regla de 90/180 días.',
    reportSummary: 'Crea un resumen claro de tus viajes y tu resultado.',
    accountSummary: 'Inicia sesión, sincroniza, exporta o elimina tus datos.',
    expand: 'Ampliar',
    collapse: 'Contraer'
  },
  it: {
    skipToContent: 'Vai al contenuto principale',
    jumpTo: 'Vai a',
    answer: 'Il tuo risultato',
    trips: 'Viaggi',
    timeline: 'Cronologia',
    plan: 'Pianifica',
    details: 'Dettagli del calcolo',
    report: 'Rapporto',
    account: 'Account e dati',
    addPreviousTrip: 'Aggiungi un viaggio precedente',
    noPreviousTrips: 'Non ho effettuato viaggi Schengen in precedenza',
    historyAssumption: 'Calcoleremo come se non avessi trascorso alcun giorno nello spazio Schengen negli ultimi 180 giorni.',
    savedResult: 'In base ai viaggi salvati',
    unsavedPreview: 'Anteprima · non salvata',
    currentTrips: 'Viaggi attuali',
    olderTrips: 'Viaggi precedenti',
    showOlder: 'Mostra i viaggi precedenti',
    hideOlder: 'Nascondi i viaggi precedenti',
    planNextTrip: 'Pianifica il tuo prossimo viaggio',
    detailsSummary: 'Scopri come è stato calcolato il risultato secondo la regola dei 90/180 giorni.',
    reportSummary: 'Crea un riepilogo chiaro dei viaggi e del risultato.',
    accountSummary: 'Accedi, sincronizza, esporta o elimina i tuoi dati.',
    expand: 'Espandi',
    collapse: 'Comprimi'
  },
  ru: {
    skipToContent: 'Перейти к основному содержанию',
    jumpTo: 'Перейти к разделу',
    answer: 'Ваш результат',
    trips: 'Поездки',
    timeline: 'Шкала времени',
    plan: 'Планирование',
    details: 'Подробности расчёта',
    report: 'Отчёт',
    account: 'Аккаунт и данные',
    addPreviousTrip: 'Добавить предыдущую поездку',
    noPreviousTrips: 'У меня не было предыдущих поездок в Шенген',
    historyAssumption: 'При расчёте будем считать, что за последние 180 дней вы не провели ни одного дня в Шенгенской зоне.',
    savedResult: 'На основе сохранённых поездок',
    unsavedPreview: 'Предварительный результат · не сохранён',
    currentTrips: 'Текущие поездки',
    olderTrips: 'Более ранние поездки',
    showOlder: 'Показать более ранние поездки',
    hideOlder: 'Скрыть более ранние поездки',
    planNextTrip: 'Спланируйте следующую поездку',
    detailsSummary: 'Посмотрите, как рассчитан результат по правилу 90/180 дней.',
    reportSummary: 'Создайте понятную сводку поездок и результата.',
    accountSummary: 'Войдите, синхронизируйте, экспортируйте или удалите свои данные.',
    expand: 'Развернуть',
    collapse: 'Свернуть'
  },
  tr: {
    skipToContent: 'Ana içeriğe geç',
    jumpTo: 'Bölüme git',
    answer: 'Sonucunuz',
    trips: 'Seyahatler',
    timeline: 'Zaman çizelgesi',
    plan: 'Planla',
    details: 'Hesaplama ayrıntıları',
    report: 'Rapor',
    account: 'Hesap ve veriler',
    addPreviousTrip: 'Önceki bir seyahati ekle',
    noPreviousTrips: 'Daha önce Schengen seyahati yapmadım',
    historyAssumption: 'Hesaplamayı, son 180 günde Schengen Bölgesi’nde hiç gün geçirmediğinizi varsayarak yapacağız.',
    savedResult: 'Kaydedilmiş seyahatlerinize göre',
    unsavedPreview: 'Önizleme · kaydedilmedi',
    currentTrips: 'Güncel seyahatler',
    olderTrips: 'Daha eski seyahatler',
    showOlder: 'Daha eski seyahatleri göster',
    hideOlder: 'Daha eski seyahatleri gizle',
    planNextTrip: 'Sonraki seyahatinizi planlayın',
    detailsSummary: '90/180 gün kuralına göre sonucunuzun nasıl hesaplandığını görün.',
    reportSummary: 'Seyahatlerinizin ve sonucunuzun anlaşılır bir özetini oluşturun.',
    accountSummary: 'Oturum açın, eşitleyin, verilerinizi dışa aktarın veya silin.',
    expand: 'Genişlet',
    collapse: 'Daralt'
  },
  he: {
    skipToContent: 'דילוג לתוכן הראשי',
    jumpTo: 'מעבר אל',
    answer: 'התוצאה שלכם',
    trips: 'נסיעות',
    timeline: 'ציר זמן',
    plan: 'תכנון',
    details: 'פרטי החישוב',
    report: 'דוח',
    account: 'חשבון ונתונים',
    addPreviousTrip: 'הוספת נסיעה קודמת',
    noPreviousTrips: 'לא היו לי נסיעות קודמות באזור שנגן',
    historyAssumption: 'החישוב יתבסס על ההנחה שלא שהיתם באזור שנגן כלל במהלך 180 הימים האחרונים.',
    savedResult: 'מבוסס על הנסיעות השמורות שלכם',
    unsavedPreview: 'תצוגה מקדימה · לא נשמרה',
    currentTrips: 'נסיעות נוכחיות',
    olderTrips: 'נסיעות קודמות',
    showOlder: 'הצגת נסיעות קודמות',
    hideOlder: 'הסתרת נסיעות קודמות',
    planNextTrip: 'תכנון הנסיעה הבאה',
    detailsSummary: 'ראו כיצד חושבה התוצאה לפי כלל 90/180 הימים.',
    reportSummary: 'צרו סיכום ברור של הנסיעות ושל התוצאה.',
    accountSummary: 'התחברו, סנכרנו, ייצאו או מחקו את הנתונים שלכם.',
    expand: 'הרחבה',
    collapse: 'צמצום'
  },
  ar: {
    skipToContent: 'الانتقال إلى المحتوى الرئيسي',
    jumpTo: 'الانتقال إلى',
    answer: 'نتيجتك',
    trips: 'الرحلات',
    timeline: 'المخطط الزمني',
    plan: 'التخطيط',
    details: 'تفاصيل الحساب',
    report: 'التقرير',
    account: 'الحساب والبيانات',
    addPreviousTrip: 'إضافة رحلة سابقة',
    noPreviousTrips: 'ليست لدي رحلات سابقة إلى منطقة شنغن',
    historyAssumption: 'سنحسب على أساس أنك لم تقضِ أي يوم في منطقة شنغن خلال آخر 180 يومًا.',
    savedResult: 'استنادًا إلى رحلاتك المحفوظة',
    unsavedPreview: 'معاينة · غير محفوظة',
    currentTrips: 'الرحلات الحالية',
    olderTrips: 'الرحلات الأقدم',
    showOlder: 'عرض الرحلات الأقدم',
    hideOlder: 'إخفاء الرحلات الأقدم',
    planNextTrip: 'خطط لرحلتك القادمة',
    detailsSummary: 'اطّلع على كيفية حساب نتيجتك وفق قاعدة 90/180 يومًا.',
    reportSummary: 'أنشئ ملخصًا واضحًا لرحلاتك ونتيجتك.',
    accountSummary: 'سجّل الدخول أو زامن بياناتك أو صدّرها أو احذفها.',
    expand: 'توسيع',
    collapse: 'طيّ'
  }
};

export function createSinglePageUiTranslator(locale: Locale): (key: SinglePageUiKey) => string {
  return (key) => catalogs[locale][key];
}

export function singlePageCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(
    Object.entries(catalogs).map(([locale, catalog]) => [locale, Object.keys(catalog).length])
  ) as Record<Locale, number>;
}
