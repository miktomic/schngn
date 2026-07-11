import type { Locale } from './locales';

type TripOnboardingKey =
  | 'step'
  | 'title'
  | 'copy'
  | 'pastAction'
  | 'bookedAction'
  | 'noHistory'
  | 'addNew'
  | 'nav'
  | 'timelineTitle'
  | 'timelineHelp'
  | 'plannerTitle'
  | 'saveBooked'
  | 'savePast'
  | 'keepExperimenting'
  | 'savedBooked'
  | 'savedPast';

const en: Record<TripOnboardingKey, string> = {
  step: 'Add your trips',
  title: 'Add your Schengen trips',
  copy: 'Enter each Schengen trip once. Its dates determine the calculation automatically.',
  pastAction: 'Add trips you already completed',
  bookedAction: 'Then add any trips you already booked',
  noHistory: 'I don’t have a trip to add yet.',
  addNew: 'Add new trip',
  nav: 'Your trips',
  timelineTitle: 'Your 180-day timeline',
  timelineHelp: 'This timeline updates whenever you add, edit, or remove a trip.',
  plannerTitle: 'Plan a future trip',
  saveBooked: 'Save as booked trip',
  savePast: 'Save as past trip',
  keepExperimenting: 'Keep experimenting',
  savedBooked: 'Saved as a booked trip.',
  savedPast: 'Saved as a past trip.'
};

const catalogs: Record<Locale, Record<TripOnboardingKey, string>> = {
  en,
  fr: { step:'Ajoutez vos voyages',title:'Ajoutez vos voyages Schengen',copy:'Saisissez chaque voyage Schengen une seule fois. Ses dates déterminent automatiquement le calcul.',pastAction:'Ajoutez les voyages déjà terminés',bookedAction:'Ajoutez ensuite les voyages déjà réservés',noHistory:'Je n’ai pas encore de voyage à ajouter.',addNew:'Ajouter un voyage',nav:'Vos voyages',timelineTitle:'Votre chronologie sur 180 jours',timelineHelp:'Cette chronologie se met à jour quand vous ajoutez, modifiez ou supprimez un voyage.',plannerTitle:'Planifier un futur voyage',saveBooked:'Enregistrer comme voyage réservé',savePast:'Enregistrer comme voyage passé',keepExperimenting:'Continuer les essais',savedBooked:'Enregistré comme voyage réservé.',savedPast:'Enregistré comme voyage passé.' },
  de: { step:'Reisen hinzufügen',title:'Schengen-Reisen hinzufügen',copy:'Geben Sie jede Schengen-Reise einmal ein. Die Daten bestimmen die Berechnung automatisch.',pastAction:'Bereits abgeschlossene Reisen hinzufügen',bookedAction:'Danach bereits gebuchte Reisen hinzufügen',noHistory:'Ich habe noch keine Reise hinzuzufügen.',addNew:'Neue Reise hinzufügen',nav:'Ihre Reisen',timelineTitle:'Ihre 180-Tage-Zeitleiste',timelineHelp:'Diese Zeitleiste wird nach jedem Hinzufügen, Bearbeiten oder Löschen aktualisiert.',plannerTitle:'Künftige Reise planen',saveBooked:'Als gebuchte Reise speichern',savePast:'Als vergangene Reise speichern',keepExperimenting:'Weiter ausprobieren',savedBooked:'Als gebuchte Reise gespeichert.',savedPast:'Als vergangene Reise gespeichert.' },
  es: { step:'Añade tus viajes',title:'Añade tus viajes Schengen',copy:'Introduce cada viaje Schengen una sola vez. Sus fechas determinan el cálculo automáticamente.',pastAction:'Añade los viajes que ya terminaste',bookedAction:'Después añade los viajes ya reservados',noHistory:'Todavía no tengo ningún viaje que añadir.',addNew:'Añadir un viaje nuevo',nav:'Tus viajes',timelineTitle:'Tu cronología de 180 días',timelineHelp:'La cronología se actualiza al añadir, editar o eliminar un viaje.',plannerTitle:'Planifica un viaje futuro',saveBooked:'Guardar como viaje reservado',savePast:'Guardar como viaje pasado',keepExperimenting:'Seguir probando',savedBooked:'Guardado como viaje reservado.',savedPast:'Guardado como viaje pasado.' },
  it: { step:'Aggiungi i tuoi viaggi',title:'Aggiungi i tuoi viaggi Schengen',copy:'Inserisci ogni viaggio Schengen una sola volta. Le date determinano automaticamente il calcolo.',pastAction:'Aggiungi i viaggi già conclusi',bookedAction:'Poi aggiungi i viaggi già prenotati',noHistory:'Non ho ancora un viaggio da aggiungere.',addNew:'Aggiungi un nuovo viaggio',nav:'I tuoi viaggi',timelineTitle:'La tua cronologia di 180 giorni',timelineHelp:'La cronologia si aggiorna quando aggiungi, modifichi o elimini un viaggio.',plannerTitle:'Pianifica un viaggio futuro',saveBooked:'Salva come viaggio prenotato',savePast:'Salva come viaggio passato',keepExperimenting:'Continua a provare',savedBooked:'Salvato come viaggio prenotato.',savedPast:'Salvato come viaggio passato.' },
  ru: { step:'Добавьте поездки',title:'Добавьте поездки в Шенген',copy:'Введите каждую поездку в Шенген один раз. Даты автоматически определят расчёт.',pastAction:'Добавьте уже завершённые поездки',bookedAction:'Затем добавьте уже забронированные поездки',noHistory:'Мне пока нечего добавлять.',addNew:'Добавить новую поездку',nav:'Ваши поездки',timelineTitle:'Ваша шкала за 180 дней',timelineHelp:'Шкала обновляется при добавлении, изменении или удалении поездки.',plannerTitle:'Спланировать будущую поездку',saveBooked:'Сохранить как забронированную',savePast:'Сохранить как прошедшую',keepExperimenting:'Продолжить подбор',savedBooked:'Сохранено как забронированная поездка.',savedPast:'Сохранено как прошедшая поездка.' },
  tr: { step:'Seyahatlerinizi ekleyin',title:'Schengen seyahatlerinizi ekleyin',copy:'Her Schengen seyahatini bir kez girin. Tarihler hesabı otomatik olarak belirler.',pastAction:'Tamamladığınız seyahatleri ekleyin',bookedAction:'Ardından rezerve ettiğiniz seyahatleri ekleyin',noHistory:'Henüz ekleyecek bir seyahatim yok.',addNew:'Yeni seyahat ekle',nav:'Seyahatleriniz',timelineTitle:'180 günlük zaman çizelgeniz',timelineHelp:'Bir seyahat eklediğinizde, düzenlediğinizde veya sildiğinizde bu çizelge güncellenir.',plannerTitle:'Gelecek bir seyahat planla',saveBooked:'Rezerve seyahat olarak kaydet',savePast:'Geçmiş seyahat olarak kaydet',keepExperimenting:'Denemeye devam et',savedBooked:'Rezerve seyahat olarak kaydedildi.',savedPast:'Geçmiş seyahat olarak kaydedildi.' },
  he: { step:'הוספת הנסיעות שלכם',title:'הוסיפו את נסיעות שנגן שלכם',copy:'הזינו כל נסיעת שנגן פעם אחת. התאריכים קובעים את החישוב אוטומטית.',pastAction:'הוסיפו נסיעות שכבר הסתיימו',bookedAction:'לאחר מכן הוסיפו נסיעות שכבר הוזמנו',noHistory:'אין לי עדיין נסיעה להוסיף.',addNew:'הוספת נסיעה חדשה',nav:'הנסיעות שלכם',timelineTitle:'ציר הזמן שלכם ל־180 יום',timelineHelp:'ציר הזמן מתעדכן בכל הוספה, עריכה או מחיקה של נסיעה.',plannerTitle:'תכנון נסיעה עתידית',saveBooked:'שמירה כנסיעה מוזמנת',savePast:'שמירה כנסיעת עבר',keepExperimenting:'המשך ניסוי',savedBooked:'נשמר כנסיעה מוזמנת.',savedPast:'נשמר כנסיעת עבר.' },
  ar: { step:'أضف رحلاتك',title:'أضف رحلات شنغن الخاصة بك',copy:'أدخل كل رحلة شنغن مرة واحدة. تحدد التواريخ الحساب تلقائيًا.',pastAction:'أضف الرحلات التي أكملتها',bookedAction:'ثم أضف الرحلات التي حجزتها',noHistory:'ليس لدي رحلة لإضافتها بعد.',addNew:'إضافة رحلة جديدة',nav:'رحلاتك',timelineTitle:'مخططك الزمني لمدة 180 يومًا',timelineHelp:'يتحدث المخطط عند إضافة رحلة أو تعديلها أو حذفها.',plannerTitle:'خطط لرحلة مستقبلية',saveBooked:'الحفظ كرحلة محجوزة',savePast:'الحفظ كرحلة سابقة',keepExperimenting:'متابعة التجربة',savedBooked:'حُفظت كرحلة محجوزة.',savedPast:'حُفظت كرحلة سابقة.' }
};

export function createTripOnboardingTranslator(locale: Locale): (key: TripOnboardingKey) => string {
  return (key) => catalogs[locale][key];
}

export function tripOnboardingCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(Object.entries(catalogs).map(([locale, catalog]) => [locale, Object.keys(catalog).length])) as Record<Locale, number>;
}
