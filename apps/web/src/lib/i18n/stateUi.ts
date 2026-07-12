import type { DashboardState } from '../dashboard/dashboardState';
import type { TripSimulationState } from '../simulator/tripSimulator';
import type { ReturningDaysForecast } from '../returns/returningDays';
import type { UnlockFakeDoorState } from '../fake-door/unlockFakeDoor';
import { formatDate, intlLocale } from './index';
import type { Locale } from './locales';
import { formatLocalizedCount, formatLocalizedNumber, localizedPluralCategory } from './countUi';
import { createOngoingStayUiTranslator } from './ongoingStayUi';
import { deepTranslateExtended, translateExtended, translateExtendedTemplate } from './extendedLocaleStrings';
import { SUPPORTED_LOCALES } from './locales';

interface StateLabels {
  addDates: string; addTrip: string; atLimit: string; countedDays: string; countedDayLeaves: string;
  currentExit: string; day: string; days: string; daysAcrossTrip: string; daysOver: string; daysRemain: string;
  daysReturn: string; firstOverLimit: string; fits: string; fixPlan: string; highestWindow: string;
  laterTripAffected: string; latestSafeExit: string; needsChanges: string; nextReturn: string; noDaysReturn: string;
  noReturning: string; noSafeContinuous: string; noSafeStay: string; notApplicable: string; proposalPrompt: string;
  safeBuffer: string; safeUntil: string; simulateDetails: string; thisTrip: string; trip: string; used: string;
  pdfButton: string; pdfHelper: string; pdfTitle: string; pdfMessage: string;
  unlockButton: string; unlockHelper: string; unlockTitle: string; unlockMessage: string;
}

const labels: Partial<Record<Locale, StateLabels>> & { en: StateLabels } = {
  en: {addDates:'Add dates',addTrip:'Add a trip',atLimit:'At limit',countedDays:'counted days',countedDayLeaves:'A counted day leaves the window',currentExit:'Current exit',day:'day',days:'days',daysAcrossTrip:'across this trip',daysOver:'days over the limit',daysRemain:'days remaining',daysReturn:'days return',firstOverLimit:'First over-limit day',fits:'Fits',fixPlan:'Shorten or move this trip, then recalculate',highestWindow:'Highest affected window',laterTripAffected:'A later trip would be affected',latestSafeExit:'Latest safe exit',needsChanges:'Needs changes',nextReturn:'Next return',noDaysReturn:'No counted days return',noReturning:'No returning days in this window',noSafeContinuous:'No safe continuous final stay is available from this entry date',noSafeStay:'No safe stay',notApplicable:'Not applicable',proposalPrompt:'Add a proposed trip to check it against later commitments',safeBuffer:'safe buffer days',safeUntil:'Safe through',simulateDetails:'Enter valid Schengen stay details',thisTrip:'This trip',trip:'Trip',used:'used',pdfButton:'Generate border-ready PDF',pdfHelper:'PDF export is not live yet. Sign up to save your trips; no payment is taken.',pdfTitle:'PDF export is not live yet',pdfMessage:'Sign up to keep your trips for repeat visits. SCHNGN records aggregate PDF interest only and does not charge you.',unlockButton:'Unlock full trip planner',unlockHelper:'The full planner is not live yet. Sign up to save your trips; no payment is taken.',unlockTitle:'Full planner is not live yet',unlockMessage:'Sign up to keep your trips for repeat visits. SCHNGN records the selected price only and does not charge you.'},
  fr: {addDates:'Ajouter des dates',addTrip:'Ajouter un voyage',atLimit:'À la limite',countedDays:'jours comptés',countedDayLeaves:'Un jour compté quitte la fenêtre',currentExit:'Sortie actuelle',day:'jour',days:'jours',daysAcrossTrip:'sur ce voyage',daysOver:'jours au-dessus de la limite',daysRemain:'jours restants',daysReturn:'jours reviennent',firstOverLimit:'Premier jour au-dessus de la limite',fits:'Possible',fixPlan:'Raccourcissez ou déplacez ce voyage, puis recalculez',highestWindow:'Fenêtre la plus chargée',laterTripAffected:'Un voyage ultérieur serait affecté',latestSafeExit:'Dernière sortie sûre',needsChanges:'Modifications nécessaires',nextReturn:'Prochain retour',noDaysReturn:'Aucun jour compté ne revient',noReturning:'Aucun jour ne revient dans cette fenêtre',noSafeContinuous:'Aucun séjour final continu sûr depuis cette date d’entrée',noSafeStay:'Aucun séjour sûr',notApplicable:'Non applicable',proposalPrompt:'Ajoutez un projet de voyage pour vérifier les engagements ultérieurs',safeBuffer:'jours de marge sûre',safeUntil:'Sûr jusqu’au',simulateDetails:'Saisissez des informations de séjour Schengen valides',thisTrip:'Ce voyage',trip:'Voyage',used:'utilisés',pdfButton:'Générer le PDF frontière',pdfHelper:'L’export PDF n’est pas encore disponible. Inscrivez-vous pour enregistrer vos voyages ; aucun paiement.',pdfTitle:'L’export PDF n’est pas encore disponible',pdfMessage:'Inscrivez-vous pour retrouver vos voyages lors de prochaines visites. SCHNGN enregistre uniquement un intérêt agrégé pour le PDF et ne vous facture pas.',unlockButton:'Débloquer le planificateur complet',unlockHelper:'Le planificateur complet n’est pas encore disponible. Inscrivez-vous pour enregistrer vos voyages ; aucun paiement.',unlockTitle:'Le planificateur complet arrive bientôt',unlockMessage:'Inscrivez-vous pour retrouver vos voyages lors de prochaines visites. SCHNGN enregistre uniquement le prix sélectionné et ne vous facture pas.'},
  de: {addDates:'Daten hinzufügen',addTrip:'Reise hinzufügen',atLimit:'Am Limit',countedDays:'gezählte Tage',countedDayLeaves:'Ein gezählter Tag verlässt das Fenster',currentExit:'Aktuelle Ausreise',day:'Tag',days:'Tage',daysAcrossTrip:'auf dieser Reise',daysOver:'Tage über dem Limit',daysRemain:'Tage verbleiben',daysReturn:'Tage kehren zurück',firstOverLimit:'Erster Tag über dem Limit',fits:'Passt',fixPlan:'Reise verkürzen oder verschieben und neu berechnen',highestWindow:'Höchstes betroffenes Fenster',laterTripAffected:'Eine spätere Reise wäre betroffen',latestSafeExit:'Späteste sichere Ausreise',needsChanges:'Änderungen nötig',nextReturn:'Nächste Rückkehr',noDaysReturn:'Keine gezählten Tage kehren zurück',noReturning:'Keine zurückkehrenden Tage in diesem Fenster',noSafeContinuous:'Kein sicherer durchgehender Endaufenthalt ab diesem Einreisetag',noSafeStay:'Kein sicherer Aufenthalt',notApplicable:'Nicht zutreffend',proposalPrompt:'Reisevorschlag hinzufügen und spätere Buchungen prüfen',safeBuffer:'sichere Puffertage',safeUntil:'Sicher bis',simulateDetails:'Gültige Schengen-Aufenthaltsdaten eingeben',thisTrip:'Diese Reise',trip:'Reise',used:'genutzt',pdfButton:'Grenzfertiges PDF erstellen',pdfHelper:'Der PDF-Export ist noch nicht verfügbar. Registrieren Sie sich, um Ihre Reisen zu speichern; es erfolgt keine Zahlung.',pdfTitle:'PDF-Export ist noch nicht verfügbar',pdfMessage:'Registrieren Sie sich, um Ihre Reisen bei späteren Besuchen wiederzufinden. SCHNGN speichert nur aggregiertes PDF-Interesse und berechnet nichts.',unlockButton:'Vollständigen Planer freischalten',unlockHelper:'Der vollständige Planer ist noch nicht verfügbar. Registrieren Sie sich, um Ihre Reisen zu speichern; es erfolgt keine Zahlung.',unlockTitle:'Vollständiger Planer kommt bald',unlockMessage:'Registrieren Sie sich, um Ihre Reisen bei späteren Besuchen wiederzufinden. SCHNGN speichert nur den ausgewählten Preis und berechnet nichts.'},
  es: {addDates:'Añadir fechas',addTrip:'Añadir viaje',atLimit:'En el límite',countedDays:'días contados',countedDayLeaves:'Un día contado sale de la ventana',currentExit:'Salida actual',day:'día',days:'días',daysAcrossTrip:'en este viaje',daysOver:'días sobre el límite',daysRemain:'días restantes',daysReturn:'días vuelven',firstOverLimit:'Primer día sobre el límite',fits:'Encaja',fixPlan:'Acorta o mueve este viaje y vuelve a calcular',highestWindow:'Ventana afectada más alta',laterTripAffected:'Un viaje posterior se vería afectado',latestSafeExit:'Última salida segura',needsChanges:'Necesita cambios',nextReturn:'Próxima devolución',noDaysReturn:'No vuelve ningún día contado',noReturning:'No hay días que vuelvan en esta ventana',noSafeContinuous:'No hay una estancia final continua segura desde esta entrada',noSafeStay:'No hay estancia segura',notApplicable:'No aplicable',proposalPrompt:'Añade un viaje propuesto para comprobar compromisos posteriores',safeBuffer:'días de margen seguro',safeUntil:'Seguro hasta',simulateDetails:'Introduce datos válidos de estancia Schengen',thisTrip:'Este viaje',trip:'Viaje',used:'usados',pdfButton:'Generar PDF para la frontera',pdfHelper:'La exportación PDF aún no está disponible. Regístrate para guardar tus viajes; no se realiza ningún pago.',pdfTitle:'La exportación PDF aún no está disponible',pdfMessage:'Regístrate para conservar tus viajes en próximas visitas. SCHNGN solo registra el interés agregado por el PDF y no te cobra.',unlockButton:'Desbloquear planificador completo',unlockHelper:'El planificador completo aún no está disponible. Regístrate para guardar tus viajes; no se realiza ningún pago.',unlockTitle:'El planificador completo llegará pronto',unlockMessage:'Regístrate para conservar tus viajes en próximas visitas. SCHNGN solo registra el precio elegido y no te cobra.'},
  it: {addDates:'Aggiungi date',addTrip:'Aggiungi viaggio',atLimit:'Al limite',countedDays:'giorni conteggiati',countedDayLeaves:'Un giorno conteggiato esce dalla finestra',currentExit:'Uscita attuale',day:'giorno',days:'giorni',daysAcrossTrip:'in questo viaggio',daysOver:'giorni oltre il limite',daysRemain:'giorni rimanenti',daysReturn:'giorni tornano',firstOverLimit:'Primo giorno oltre il limite',fits:'Possibile',fixPlan:'Accorcia o sposta il viaggio e ricalcola',highestWindow:'Finestra interessata più alta',laterTripAffected:'Un viaggio successivo sarebbe interessato',latestSafeExit:'Ultima uscita sicura',needsChanges:'Richiede modifiche',nextReturn:'Prossimo rientro',noDaysReturn:'Nessun giorno conteggiato torna',noReturning:'Nessun giorno torna in questa finestra',noSafeContinuous:'Nessun soggiorno finale continuo sicuro da questo ingresso',noSafeStay:'Nessun soggiorno sicuro',notApplicable:'Non applicabile',proposalPrompt:'Aggiungi un viaggio proposto per verificare gli impegni successivi',safeBuffer:'giorni di margine sicuro',safeUntil:'Sicuro fino al',simulateDetails:'Inserisci dati validi del soggiorno Schengen',thisTrip:'Questo viaggio',trip:'Viaggio',used:'usati',pdfButton:'Genera PDF per la frontiera',pdfHelper:'L’esportazione PDF non è ancora disponibile. Registrati per salvare i viaggi; non viene addebitato alcun pagamento.',pdfTitle:'L’esportazione PDF non è ancora disponibile',pdfMessage:'Registrati per ritrovare i viaggi nelle visite successive. SCHNGN registra solo l’interesse aggregato per il PDF e non effettua addebiti.',unlockButton:'Sblocca il pianificatore completo',unlockHelper:'Il pianificatore completo non è ancora disponibile. Registrati per salvare i viaggi; non viene addebitato alcun pagamento.',unlockTitle:'Il pianificatore completo arriverà presto',unlockMessage:'Registrati per ritrovare i viaggi nelle visite successive. SCHNGN registra solo il prezzo scelto e non effettua addebiti.'},
  ru: {addDates:'Добавить даты',addTrip:'Добавить поездку',atLimit:'На пределе',countedDays:'учтённых дней',countedDayLeaves:'Учтённый день выходит из окна',currentExit:'Текущий выезд',day:'день',days:'дней',daysAcrossTrip:'за эту поездку',daysOver:'дней сверх лимита',daysRemain:'дней осталось',daysReturn:'дней вернётся',firstOverLimit:'Первый день сверх лимита',fits:'Подходит',fixPlan:'Сократите или перенесите поездку и пересчитайте',highestWindow:'Максимальное затронутое окно',laterTripAffected:'Будет затронута более поздняя поездка',latestSafeExit:'Последний безопасный выезд',needsChanges:'Нужны изменения',nextReturn:'Следующий возврат',noDaysReturn:'Учтённые дни не возвращаются',noReturning:'В этом окне дни не возвращаются',noSafeContinuous:'С этой даты въезда нет безопасной непрерывной финальной поездки',noSafeStay:'Нет безопасной поездки',notApplicable:'Не применимо',proposalPrompt:'Добавьте план поездки, чтобы проверить более поздние обязательства',safeBuffer:'дней безопасного запаса',safeUntil:'Безопасно до',simulateDetails:'Введите корректные данные поездки в Шенген',thisTrip:'Эта поездка',trip:'Поездка',used:'использовано',pdfButton:'Создать PDF для границы',pdfHelper:'Экспорт PDF пока недоступен. Зарегистрируйтесь, чтобы сохранить поездки; оплата не взимается.',pdfTitle:'Экспорт PDF пока недоступен',pdfMessage:'Зарегистрируйтесь, чтобы сохранить поездки для следующих посещений. SCHNGN учитывает только совокупный интерес к PDF и не взимает оплату.',unlockButton:'Открыть полный планировщик',unlockHelper:'Полный планировщик пока недоступен. Зарегистрируйтесь, чтобы сохранить поездки; оплата не взимается.',unlockTitle:'Полный планировщик скоро появится',unlockMessage:'Зарегистрируйтесь, чтобы сохранить поездки для следующих посещений. SCHNGN учитывает только выбранную цену и не взимает оплату.'},
  tr: {addDates:'Tarih ekle',addTrip:'Seyahat ekle',atLimit:'Sınırda',countedDays:'sayılan gün',countedDayLeaves:'Sayılan bir gün pencereden çıkıyor',currentExit:'Mevcut çıkış',day:'gün',days:'gün',daysAcrossTrip:'bu seyahat boyunca',daysOver:'gün sınırın üzerinde',daysRemain:'gün kaldı',daysReturn:'gün geri döner',firstOverLimit:'Sınırı aşan ilk gün',fits:'Uygun',fixPlan:'Seyahati kısaltın veya taşıyın ve yeniden hesaplayın',highestWindow:'En yüksek etkilenen pencere',laterTripAffected:'Daha sonraki bir seyahat etkilenir',latestSafeExit:'En geç güvenli çıkış',needsChanges:'Değişiklik gerekli',nextReturn:'Sonraki dönüş',noDaysReturn:'Sayılan gün geri dönmüyor',noReturning:'Bu pencerede geri dönen gün yok',noSafeContinuous:'Bu girişten itibaren güvenli kesintisiz son konaklama yok',noSafeStay:'Güvenli konaklama yok',notApplicable:'Uygulanamaz',proposalPrompt:'Sonraki planları kontrol etmek için bir seyahat önerisi ekleyin',safeBuffer:'güvenli tampon gün',safeUntil:'Şu tarihe kadar güvenli',simulateDetails:'Geçerli Schengen konaklama bilgileri girin',thisTrip:'Bu seyahat',trip:'Seyahat',used:'kullanıldı',pdfButton:'Sınır için PDF oluştur',pdfHelper:'PDF dışa aktarma henüz kullanılamıyor. Seyahatlerinizi kaydetmek için kaydolun; ödeme alınmaz.',pdfTitle:'PDF dışa aktarma henüz kullanılamıyor',pdfMessage:'Sonraki ziyaretlerde seyahatlerinizi korumak için kaydolun. SCHNGN yalnızca toplu PDF ilgisini kaydeder ve ücret almaz.',unlockButton:'Tam planlayıcıyı aç',unlockHelper:'Tam planlayıcı henüz kullanılamıyor. Seyahatlerinizi kaydetmek için kaydolun; ödeme alınmaz.',unlockTitle:'Tam planlayıcı yakında',unlockMessage:'Sonraki ziyaretlerde seyahatlerinizi korumak için kaydolun. SCHNGN yalnızca seçilen fiyatı kaydeder ve ücret almaz.'},
  he: {addDates:'הוספת תאריכים',addTrip:'הוספת נסיעה',atLimit:'במגבלה',countedDays:'ימים שנספרו',countedDayLeaves:'יום שנספר יוצא מהחלון',currentExit:'יציאה נוכחית',day:'יום',days:'ימים',daysAcrossTrip:'במהלך הנסיעה',daysOver:'ימים מעל למגבלה',daysRemain:'ימים נותרו',daysReturn:'ימים חוזרים',firstOverLimit:'היום הראשון מעל למגבלה',fits:'מתאים',fixPlan:'קצרו או הזיזו את הנסיעה וחשבו מחדש',highestWindow:'החלון המושפע הגבוה ביותר',laterTripAffected:'נסיעה מאוחרת יותר תושפע',latestSafeExit:'יציאה בטוחה אחרונה',needsChanges:'נדרשים שינויים',nextReturn:'החזרה הבאה',noDaysReturn:'אין ימים שנספרו שחוזרים',noReturning:'אין ימים חוזרים בחלון הזה',noSafeContinuous:'אין שהייה סופית רצופה ובטוחה מתאריך כניסה זה',noSafeStay:'אין שהייה בטוחה',notApplicable:'לא רלוונטי',proposalPrompt:'הוסיפו נסיעה מוצעת כדי לבדוק התחייבויות מאוחרות',safeBuffer:'ימי מרווח בטוח',safeUntil:'בטוח עד',simulateDetails:'הזינו פרטי שהייה תקינים בשנגן',thisTrip:'הנסיעה הזו',trip:'נסיעה',used:'נוצלו',pdfButton:'יצירת PDF לגבול',pdfHelper:'ייצוא PDF עדיין לא זמין. הירשמו כדי לשמור את הנסיעות; לא נגבה תשלום.',pdfTitle:'ייצוא PDF עדיין לא זמין',pdfMessage:'הירשמו כדי לשמור את הנסיעות לביקורים חוזרים. SCHNGN שומר רק עניין מצטבר ב־PDF ואינו גובה תשלום.',unlockButton:'פתיחת המתכנן המלא',unlockHelper:'המתכנן המלא עדיין לא זמין. הירשמו כדי לשמור את הנסיעות; לא נגבה תשלום.',unlockTitle:'המתכנן המלא יגיע בקרוב',unlockMessage:'הירשמו כדי לשמור את הנסיעות לביקורים חוזרים. SCHNGN שומר רק את המחיר שנבחר ואינו גובה תשלום.'},
  ar: {addDates:'إضافة تواريخ',addTrip:'إضافة رحلة',atLimit:'عند الحد',countedDays:'أيام محتسبة',countedDayLeaves:'يخرج يوم محتسب من النافذة',currentExit:'الخروج الحالي',day:'يوم',days:'أيام',daysAcrossTrip:'خلال هذه الرحلة',daysOver:'أيام فوق الحد',daysRemain:'أيام متبقية',daysReturn:'أيام تعود',firstOverLimit:'أول يوم فوق الحد',fits:'مناسبة',fixPlan:'قصّر الرحلة أو انقلها ثم أعد الحساب',highestWindow:'أعلى نافذة متأثرة',laterTripAffected:'ستتأثر رحلة لاحقة',latestSafeExit:'آخر خروج آمن',needsChanges:'تحتاج إلى تعديل',nextReturn:'العودة التالية',noDaysReturn:'لا تعود أيام محتسبة',noReturning:'لا توجد أيام عائدة في هذه النافذة',noSafeContinuous:'لا توجد إقامة نهائية متصلة وآمنة من تاريخ الدخول هذا',noSafeStay:'لا توجد إقامة آمنة',notApplicable:'غير منطبق',proposalPrompt:'أضف رحلة مقترحة للتحقق من الالتزامات اللاحقة',safeBuffer:'أيام كهامش آمن',safeUntil:'آمن حتى',simulateDetails:'أدخل بيانات إقامة شنغن صالحة',thisTrip:'هذه الرحلة',trip:'رحلة',used:'مستخدمة',pdfButton:'إنشاء PDF للحدود',pdfHelper:'تصدير PDF غير متاح بعد. أنشئ حسابًا لحفظ رحلاتك؛ لن يُحصّل أي دفع.',pdfTitle:'تصدير PDF غير متاح بعد',pdfMessage:'أنشئ حسابًا للاحتفاظ برحلاتك للزيارات المتكررة. يسجل SCHNGN الاهتمام المجمع بميزة PDF فقط ولا يفرض رسومًا.',unlockButton:'فتح المخطط الكامل',unlockHelper:'المخطط الكامل غير متاح بعد. أنشئ حسابًا لحفظ رحلاتك؛ لن يُحصّل أي دفع.',unlockTitle:'المخطط الكامل قريبًا',unlockMessage:'أنشئ حسابًا للاحتفاظ برحلاتك للزيارات المتكررة. يسجل SCHNGN السعر المختار فقط ولا يفرض رسومًا.'}
};

const completedCopy: Partial<Record<Locale, { history: string; label: string }>> & { en: { history: string; label: string } } = {
  en: {
    history: 'This completed trip is included in your history. Review the counted days against your travel records.',
    label: 'Completed'
  },
  fr: {
    history: 'Ce voyage terminé est inclus dans votre historique. Vérifiez les jours comptés par rapport à vos documents de voyage.',
    label: 'Terminé'
  },
  de: {
    history: 'Diese abgeschlossene Reise ist in Ihrem Verlauf enthalten. Gleichen Sie die gezählten Tage mit Ihren Reiseunterlagen ab.',
    label: 'Abgeschlossen'
  },
  es: {
    history: 'Este viaje completado está incluido en tu historial. Contrasta los días contados con tus documentos de viaje.',
    label: 'Completado'
  },
  it: {
    history: 'Questo viaggio completato è incluso nella cronologia. Verifica i giorni conteggiati rispetto ai documenti di viaggio.',
    label: 'Completato'
  },
  ru: {
    history: 'Эта завершённая поездка включена в вашу историю. Сверьте учтённые дни с данными о поездке.',
    label: 'Завершена'
  },
  tr: {
    history: 'Bu tamamlanmış seyahat geçmişinize dahildir. Sayılan günleri seyahat kayıtlarınızla karşılaştırın.',
    label: 'Tamamlandı'
  },
  he: {
    history: 'הנסיעה שהושלמה נכללת בהיסטוריה שלכם. השוו את הימים שנספרו לרישומי הנסיעה שלכם.',
    label: 'הושלמה'
  },
  ar: {
    history: 'هذه الرحلة المكتملة مدرجة في سجلك. راجع الأيام المحتسبة مقابل سجلات سفرك.',
    label: 'مكتملة'
  }
};

const labelsFor = (locale: Locale): StateLabels => labels[locale] ?? deepTranslateExtended(locale, labels.en);
const completedFor = (locale: Locale): { history: string; label: string } => completedCopy[locale] ?? deepTranslateExtended(locale, completedCopy.en);

const shortDate = (locale: Locale, iso: string) => formatDate(locale, iso, { day:'numeric', month:'short' });
const fullRange = (locale: Locale, start: string, end: string) => `${formatDate(locale,start,{day:'numeric',month:'short'})}–${formatDate(locale,end,{day:'numeric',month:'short',year:'numeric'})}`;

type DayMetric = 'plain' | 'counted' | 'over' | 'remaining' | 'returning' | 'safeBuffer';

function formatDayMetric(locale: Locale, count: number, metric: DayMetric): string {
  if (metric === 'plain') return formatLocalizedCount(locale, count, 'day').text;

  const number = formatLocalizedNumber(locale, count);
  const category = localizedPluralCategory(locale, count);
  const one = category === 'one';
  const simpleForms: Partial<Record<Locale, Record<DayMetric, [string, string]>>> = {
    en: {
      plain: ['day', 'days'], counted: ['counted day', 'counted days'], over: ['day over the limit', 'days over the limit'],
      remaining: ['day remaining', 'days remaining'], returning: ['day returns', 'days return'], safeBuffer: ['safe buffer day', 'safe buffer days']
    },
    fr: {
      plain: ['jour', 'jours'], counted: ['jour compté', 'jours comptés'], over: ['jour au-dessus de la limite', 'jours au-dessus de la limite'],
      remaining: ['jour restant', 'jours restants'], returning: ['jour revient', 'jours reviennent'], safeBuffer: ['jour de marge de sécurité', 'jours de marge de sécurité']
    },
    de: {
      plain: ['Tag', 'Tage'], counted: ['gezählter Tag', 'gezählte Tage'], over: ['Tag über dem Limit', 'Tage über dem Limit'],
      remaining: ['Tag verbleibt', 'Tage verbleiben'], returning: ['Tag kehrt zurück', 'Tage kehren zurück'], safeBuffer: ['sicherer Puffertag', 'sichere Puffertage']
    },
    es: {
      plain: ['día', 'días'], counted: ['día contabilizado', 'días contabilizados'], over: ['día sobre el límite', 'días sobre el límite'],
      remaining: ['día restante', 'días restantes'], returning: ['día vuelve', 'días vuelven'], safeBuffer: ['día de margen seguro', 'días de margen seguro']
    },
    it: {
      plain: ['giorno', 'giorni'], counted: ['giorno conteggiato', 'giorni conteggiati'], over: ['giorno oltre il limite', 'giorni oltre il limite'],
      remaining: ['giorno rimanente', 'giorni rimanenti'], returning: ['giorno torna', 'giorni tornano'], safeBuffer: ['giorno di margine sicuro', 'giorni di margine sicuro']
    },
    tr: {
      plain: ['gün', 'gün'], counted: ['sayılan gün', 'sayılan gün'], over: ['gün sınırın üzerinde', 'gün sınırın üzerinde'],
      remaining: ['gün kaldı', 'gün kaldı'], returning: ['gün geri döner', 'gün geri döner'], safeBuffer: ['günlük güvenli pay', 'günlük güvenli pay']
    },
    he: {
      plain: ['יום', 'ימים'], counted: ['יום שנספר', 'ימים שנספרו'], over: ['יום מעל למגבלה', 'ימים מעל למגבלה'],
      remaining: ['יום נותר', 'ימים נותרו'], returning: ['יום חוזר', 'ימים חוזרים'], safeBuffer: ['יום של מרווח בטוח', 'ימים של מרווח בטוח']
    }
  };

  if (locale === 'he' && count === 2) {
    const dual: Record<Exclude<DayMetric, 'plain'>, string> = {
      counted: 'יומיים שנספרו', over: 'יומיים מעל למגבלה', remaining: 'יומיים נותרו',
      returning: 'יומיים חוזרים', safeBuffer: 'יומיים של מרווח בטוח'
    };
    return dual[metric];
  }

  const simple = simpleForms[locale];
  if (simple) return `${number} ${simple[metric][one ? 0 : 1]}`;

  if (locale === 'ru') {
    const forms: Record<DayMetric, [string, string, string]> = {
      plain: ['день', 'дня', 'дней'], counted: ['учтённый день', 'учтённых дня', 'учтённых дней'],
      over: ['день сверх лимита', 'дня сверх лимита', 'дней сверх лимита'],
      remaining: ['день остался', 'дня осталось', 'дней осталось'],
      returning: ['день вернётся', 'дня вернутся', 'дней вернутся'],
      safeBuffer: ['день безопасного запаса', 'дня безопасного запаса', 'дней безопасного запаса']
    };
    const index = category === 'one' ? 0 : category === 'few' ? 1 : 2;
    return `${number} ${forms[metric][index]}`;
  }

  if (locale !== 'ar') {
    const english = simpleForms.en![metric][one ? 0 : 1];
    return `${number} ${translateExtended(locale, english)}`;
  }

  const arabicForms: Record<Exclude<DayMetric, 'plain'>, Record<'zero' | 'one' | 'two' | 'few' | 'many' | 'other', string>> = {
    counted: { zero: 'أيام محتسبة', one: 'يوم محتسب', two: 'يومان محتسبان', few: 'أيام محتسبة', many: 'يومًا محتسبًا', other: 'يوم محتسب' },
    over: { zero: 'أيام فوق الحد', one: 'يوم فوق الحد', two: 'يومان فوق الحد', few: 'أيام فوق الحد', many: 'يومًا فوق الحد', other: 'يوم فوق الحد' },
    remaining: { zero: 'أيام متبقية', one: 'يوم متبقٍ', two: 'يومان متبقيان', few: 'أيام متبقية', many: 'يومًا متبقيًا', other: 'يوم متبقٍ' },
    returning: { zero: 'أيام تعود', one: 'يوم يعود', two: 'يومان يعودان', few: 'أيام تعود', many: 'يومًا يعود', other: 'يوم يعود' },
    safeBuffer: { zero: 'أيام كهامش آمن', one: 'يوم كهامش آمن', two: 'يومان كهامش آمن', few: 'أيام كهامش آمن', many: 'يومًا كهامش آمن', other: 'يوم كهامش آمن' }
  };
  if (count === 2) return arabicForms[metric].two;
  const arabicCategory = category === 'zero' || category === 'one' || category === 'few' || category === 'many' ? category : 'other';
  return `${number} ${arabicForms[metric][arabicCategory]}`;
}

function formatCountedRatio(locale: Locale, count: number): string {
  const used = formatLocalizedNumber(locale, count);
  const limit = formatLocalizedNumber(locale, 90);
  return ({
    en: `${used}/${limit} counted days`,
    fr: `${used} jours comptés sur ${limit}`,
    de: `${used} von ${limit} Tagen gezählt`,
    es: `${used} de ${limit} días contabilizados`,
    it: `${used} giorni conteggiati su ${limit}`,
    ru: `${used} из ${limit} учтённых дней`,
    tr: `${limit} günün ${used} günü sayıldı`,
    he: `${used} מתוך ${limit} ימים שנספרו`,
    ar: `${used} من أصل ${limit} يومًا محتسبًا`
  } as Partial<Record<Locale, string>>)[locale] ?? translateExtendedTemplate(locale, '{used}/{limit} counted days', { used, limit });
}

function localizeMaxStayLabel(locale: Locale, label: string, l: StateLabels): string {
  if (label === 'Not applicable') return l.notApplicable;
  const match = /^(\d+) days? across this trip$/u.exec(label);
  return match ? `${formatDayMetric(locale, Number(match[1]), 'plain')} ${l.daysAcrossTrip}` : label;
}

export function localizeDashboardState(locale: Locale, state: DashboardState): DashboardState {
  if (state.targetTrip?.ongoing) {
    const ongoing = createOngoingStayUiTranslator(locale);
    const latest = state.latestSafeExitDate ? shortDate(locale, state.latestSafeExitDate) : labelsFor(locale).noSafeStay;
    if (locale === 'en') {
      return { ...state, actionCopy: `${ongoing('leaveBy')}: ${latest}`, latestSafeExitLabel: latest, statusLabel: ongoing('ongoing') };
    }
    const l = labelsFor(locale);
    const over = state.usage.overLimit;
    return { ...state,
      actionCopy: `${ongoing('leaveBy')}: ${latest}`,
      heroMetric: formatDayMetric(locale, over ? state.usage.overBy : state.usage.daysRemaining, over ? 'over' : 'safeBuffer'),
      latestSafeExitLabel: latest,
      statusLabel: ongoing('ongoing'),
      whyCopy: `${shortDate(locale,state.referenceDate)} · ${formatCountedRatio(locale,state.usage.daysUsed)} · ${formatDayMetric(locale,over ? state.usage.overBy : state.usage.daysRemaining,over ? 'over' : 'remaining')}`,
      windowLabel: fullRange(locale,state.usage.windowStart,state.usage.windowEnd)
    };
  }
  if (locale === 'en') return state;
  const l = labelsFor(locale);
  const completed = completedFor(locale);
  const name = state.targetTrip?.label || l.trip;
  const over = state.usage.overLimit;
  return {...state,
    actionCopy: !state.targetTrip ? l.proposalPrompt : state.completed ? completed.history : over ? l.fixPlan : state.latestSafeExitDate ? `${l.currentExit}: ${shortDate(locale,state.targetTrip.stays.at(-1)?.exitDate ?? state.referenceDate)} · ${l.latestSafeExit}: ${shortDate(locale,state.latestSafeExitDate)}` : l.noSafeContinuous,
    heroMetric: formatDayMetric(locale, over ? state.usage.overBy : state.usage.daysRemaining, over ? 'over' : 'safeBuffer'),
    latestSafeExitLabel: state.latestSafeExitDate ? shortDate(locale,state.latestSafeExitDate) : state.targetTrip ? l.noSafeStay : l.addDates,
    statusLabel: !state.targetTrip ? l.addTrip : `${name} · ${state.completed ? completed.label : over ? l.needsChanges : state.statusTone === 'close' ? l.atLimit : l.fits}`,
    whyCopy: `${shortDate(locale,state.referenceDate)} · ${formatCountedRatio(locale,state.usage.daysUsed)} · ${formatDayMetric(locale,over ? state.usage.overBy : state.usage.daysRemaining,over ? 'over' : 'remaining')}`,
    windowLabel: fullRange(locale,state.usage.windowStart,state.usage.windowEnd)
  };
}

export function localizeSimulationState(locale: Locale, state: TripSimulationState): TripSimulationState {
  if (locale === 'en') return state;
  const l = labelsFor(locale);
  const completed = completedFor(locale);
  const errors = Object.fromEntries(Object.entries(state.errors).map(([key,value]) => [key, key === 'breakFields' && value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([id,fields]) => [id,Object.fromEntries(Object.keys(fields as object).map((field)=>[field,l.simulateDetails]))]))
    : l.simulateDetails])) as TripSimulationState['errors'];
  if (!state.valid || !state.usage) return {...state,errors,firstFixCopy:l.simulateDetails,latestSafeExitLabel:l.addDates,maxStayLabel:l.addDates,statusLabel:l.addDates,summaryCopy:l.proposalPrompt};
  const name = state.simulatedTrip?.label || l.thisTrip;
  const over = state.statusTone === 'risk';
  const laterConflict = state.completed && Boolean(state.conflict && state.conflict.tripStatus !== 'proposal');
  const latest = state.latestSafeExitDate ? shortDate(locale,state.latestSafeExitDate) : l.noSafeStay;
  return {...state,
    firstFixCopy: laterConflict ? `${l.laterTripAffected}. ${completed.history}` : state.completed ? completed.history : over ? l.fixPlan : `${l.safeUntil}: ${latest}`,
    latestSafeExitLabel: latest,
    maxStayLabel: localizeMaxStayLabel(locale,state.maxStayLabel,l),
    statusLabel: `${name} · ${state.completed ? completed.label : over ? l.needsChanges : state.statusTone === 'close' ? l.atLimit : l.fits}`,
    summaryCopy: `${laterConflict ? `${l.laterTripAffected} · ` : ''}${formatCountedRatio(locale,state.usage.daysUsed)} · ${over ? l.firstOverLimit : formatDayMetric(locale,state.usage.daysRemaining,'remaining')}`
  };
}

export function localizeReturningForecast(locale: Locale, forecast: ReturningDaysForecast): ReturningDaysForecast {
  if (locale === 'en') return forecast;
  const l = labelsFor(locale);
  const rows = forecast.rows.map((row) => ({...row,dateLabel:shortDate(locale,row.date),daysLabel:`+${formatDayMetric(locale,row.daysReturned,'plain')}`,source:l.countedDayLeaves}));
  const returningDays = rows.reduce((total,row)=>total+row.daysReturned,0);
  const horizon = formatDayMetric(locale,forecast.horizonDays,'plain');
  return {...forecast,rows,currentUsedLabel:formatCountedRatio(locale,forecast.currentUsed),summaryLabel:rows.length ? `${formatDayMetric(locale,returningDays,'returning')} · ${horizon}` : `${l.noDaysReturn} · ${horizon}`,nextReturnLabel:rows[0] ? `${l.nextReturn}: ${rows[0].dateLabel}` : l.noReturning};
}

export function localizeUnlockState(locale: Locale, state: UnlockFakeDoorState, price: string): UnlockFakeDoorState {
  if (locale === 'en') return state;
  const l=labelsFor(locale); return {...state,buttonLabel:`${l.unlockButton} — ${price}`,helperCopy:l.unlockHelper,messageTitle:l.unlockTitle,messageCopy:l.unlockMessage};
}

export function stateCatalogKeyCount(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale)=>[locale,Object.keys(labels.en).length])) as Record<Locale,number>;
}
