import { SUPPORTED_LOCALES, type Locale } from './locales';
import { translateExtended } from './extendedLocaleStrings';

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
  title: 'Add any Schengen trip',
  copy: 'Add a trip from the past, a stay you are on now, or a future plan. Enter each continuous Schengen stay once and its dates update your 90/180-day timeline automatically.',
  pastAction: 'Add trips you already completed',
  bookedAction: 'Then add any trips you already booked',
  noHistory: 'I don’t have a trip to add yet.',
  addNew: 'Add new trip',
  nav: 'Your Trips',
  timelineTitle: 'Your 180-day timeline',
  timelineHelp: 'This timeline updates whenever you add, edit, or remove a trip.',
  plannerTitle: 'Plan a future trip',
  saveBooked: 'Save as booked trip',
  savePast: 'Save as past trip',
  keepExperimenting: 'Keep experimenting',
  savedBooked: 'Saved as a booked trip.',
  savedPast: 'Saved as a past trip.'
};

const catalogs: Partial<Record<Locale, Record<TripOnboardingKey, string>>> & { en: Record<TripOnboardingKey, string> } = {
  en,
  fr: { step:'Ajoutez vos voyages',title:'Ajoutez n’importe quel voyage Schengen',copy:'Ajoutez un voyage passé, un séjour en cours ou un projet futur. Saisissez chaque séjour Schengen continu une seule fois : ses dates mettent automatiquement à jour votre chronologie 90/180 jours.',pastAction:'Ajoutez les voyages déjà terminés',bookedAction:'Ajoutez ensuite les voyages déjà réservés',noHistory:'Je n’ai pas encore de voyage à ajouter.',addNew:'Ajouter un voyage',nav:'Vos voyages',timelineTitle:'Votre chronologie sur 180 jours',timelineHelp:'Cette chronologie se met à jour quand vous ajoutez, modifiez ou supprimez un voyage.',plannerTitle:'Planifier un futur voyage',saveBooked:'Enregistrer comme voyage réservé',savePast:'Enregistrer comme voyage passé',keepExperimenting:'Continuer les essais',savedBooked:'Enregistré comme voyage réservé.',savedPast:'Enregistré comme voyage passé.' },
  de: { step:'Reisen hinzufügen',title:'Beliebige Schengen-Reise hinzufügen',copy:'Fügen Sie eine vergangene Reise, einen laufenden Aufenthalt oder einen Zukunftsplan hinzu. Geben Sie jeden durchgehenden Schengen-Aufenthalt einmal ein; seine Daten aktualisieren automatisch Ihre 90/180-Tage-Zeitleiste.',pastAction:'Bereits abgeschlossene Reisen hinzufügen',bookedAction:'Danach bereits gebuchte Reisen hinzufügen',noHistory:'Ich habe noch keine Reise hinzuzufügen.',addNew:'Neue Reise hinzufügen',nav:'Ihre Reisen',timelineTitle:'Ihre 180-Tage-Zeitleiste',timelineHelp:'Diese Zeitleiste wird nach jedem Hinzufügen, Bearbeiten oder Löschen aktualisiert.',plannerTitle:'Künftige Reise planen',saveBooked:'Als gebuchte Reise speichern',savePast:'Als vergangene Reise speichern',keepExperimenting:'Weiter ausprobieren',savedBooked:'Als gebuchte Reise gespeichert.',savedPast:'Als vergangene Reise gespeichert.' },
  es: { step:'Añade tus viajes',title:'Añade cualquier viaje Schengen',copy:'Añade un viaje pasado, una estancia actual o un plan futuro. Introduce cada estancia continua en Schengen una sola vez y sus fechas actualizarán automáticamente tu cronología 90/180.',pastAction:'Añade los viajes que ya terminaste',bookedAction:'Después añade los viajes ya reservados',noHistory:'Todavía no tengo ningún viaje que añadir.',addNew:'Añadir un viaje nuevo',nav:'Tus viajes',timelineTitle:'Tu cronología de 180 días',timelineHelp:'La cronología se actualiza al añadir, editar o eliminar un viaje.',plannerTitle:'Planifica un viaje futuro',saveBooked:'Guardar como viaje reservado',savePast:'Guardar como viaje pasado',keepExperimenting:'Seguir probando',savedBooked:'Guardado como viaje reservado.',savedPast:'Guardado como viaje pasado.' },
  it: { step:'Aggiungi i tuoi viaggi',title:'Aggiungi qualsiasi viaggio Schengen',copy:'Aggiungi un viaggio passato, un soggiorno in corso o un piano futuro. Inserisci una sola volta ogni soggiorno Schengen continuativo: le date aggiornano automaticamente la cronologia 90/180.',pastAction:'Aggiungi i viaggi già conclusi',bookedAction:'Poi aggiungi i viaggi già prenotati',noHistory:'Non ho ancora un viaggio da aggiungere.',addNew:'Aggiungi un nuovo viaggio',nav:'I tuoi viaggi',timelineTitle:'La tua cronologia di 180 giorni',timelineHelp:'La cronologia si aggiorna quando aggiungi, modifichi o elimini un viaggio.',plannerTitle:'Pianifica un viaggio futuro',saveBooked:'Salva come viaggio prenotato',savePast:'Salva come viaggio passato',keepExperimenting:'Continua a provare',savedBooked:'Salvato come viaggio prenotato.',savedPast:'Salvato come viaggio passato.' },
  ru: { step:'Добавьте поездки',title:'Добавьте любую поездку в Шенген',copy:'Добавьте прошедшую поездку, текущую поездку или будущий план. Введите каждое непрерывное пребывание в Шенгене один раз — даты автоматически обновят шкалу правила 90/180.',pastAction:'Добавьте уже завершённые поездки',bookedAction:'Затем добавьте уже забронированные поездки',noHistory:'Мне пока нечего добавлять.',addNew:'Добавить новую поездку',nav:'Ваши поездки',timelineTitle:'Ваша шкала за 180 дней',timelineHelp:'Шкала обновляется при добавлении, изменении или удалении поездки.',plannerTitle:'Спланировать будущую поездку',saveBooked:'Сохранить как забронированную',savePast:'Сохранить как прошедшую',keepExperimenting:'Продолжить подбор',savedBooked:'Сохранено как забронированная поездка.',savedPast:'Сохранено как прошедшая поездка.' },
  tr: { step:'Seyahatlerinizi ekleyin',title:'Herhangi bir Schengen seyahati ekleyin',copy:'Geçmiş bir seyahati, şu anki bir kalışı veya gelecekteki bir planı ekleyin. Her kesintisiz Schengen kalışını bir kez girin; tarihler 90/180 günlük zaman çizelgenizi otomatik günceller.',pastAction:'Tamamladığınız seyahatleri ekleyin',bookedAction:'Ardından rezerve ettiğiniz seyahatleri ekleyin',noHistory:'Henüz ekleyecek bir seyahatim yok.',addNew:'Yeni seyahat ekle',nav:'Seyahatleriniz',timelineTitle:'180 günlük zaman çizelgeniz',timelineHelp:'Bir seyahat eklediğinizde, düzenlediğinizde veya sildiğinizde bu çizelge güncellenir.',plannerTitle:'Gelecek bir seyahat planla',saveBooked:'Rezerve seyahat olarak kaydet',savePast:'Geçmiş seyahat olarak kaydet',keepExperimenting:'Denemeye devam et',savedBooked:'Rezerve seyahat olarak kaydedildi.',savedPast:'Geçmiş seyahat olarak kaydedildi.' },
  he: { step:'הוספת הנסיעות שלכם',title:'הוסיפו כל נסיעת שנגן',copy:'הוסיפו נסיעה מהעבר, שהייה נוכחית או תוכנית עתידית. הזינו כל שהייה רצופה בשנגן פעם אחת, והתאריכים יעדכנו אוטומטית את ציר הזמן של כלל 90/180.',pastAction:'הוסיפו נסיעות שכבר הסתיימו',bookedAction:'לאחר מכן הוסיפו נסיעות שכבר הוזמנו',noHistory:'אין לי עדיין נסיעה להוסיף.',addNew:'הוספת נסיעה חדשה',nav:'הנסיעות שלכם',timelineTitle:'ציר הזמן שלכם ל־180 יום',timelineHelp:'ציר הזמן מתעדכן בכל הוספה, עריכה או מחיקה של נסיעה.',plannerTitle:'תכנון נסיעה עתידית',saveBooked:'שמירה כנסיעה מוזמנת',savePast:'שמירה כנסיעת עבר',keepExperimenting:'המשך ניסוי',savedBooked:'נשמר כנסיעה מוזמנת.',savedPast:'נשמר כנסיעת עבר.' },
  ar: { step:'أضف رحلاتك',title:'أضف أي رحلة إلى شنغن',copy:'أضف رحلة سابقة أو إقامة حالية أو خطة مستقبلية. أدخل كل إقامة متصلة في شنغن مرة واحدة، وستحدّث تواريخها مخطط قاعدة 90/180 تلقائيًا.',pastAction:'أضف الرحلات التي أكملتها',bookedAction:'ثم أضف الرحلات التي حجزتها',noHistory:'ليس لدي رحلة لإضافتها بعد.',addNew:'إضافة رحلة جديدة',nav:'رحلاتك',timelineTitle:'مخططك الزمني لمدة 180 يومًا',timelineHelp:'يتحدث المخطط عند إضافة رحلة أو تعديلها أو حذفها.',plannerTitle:'خطط لرحلة مستقبلية',saveBooked:'الحفظ كرحلة محجوزة',savePast:'الحفظ كرحلة سابقة',keepExperimenting:'متابعة التجربة',savedBooked:'حُفظت كرحلة محجوزة.',savedPast:'حُفظت كرحلة سابقة.' }
};

export function createTripOnboardingTranslator(locale: Locale): (key: TripOnboardingKey) => string {
  return (key) => catalogs[locale]?.[key] ?? translateExtended(locale, en[key]);
}

export function tripOnboardingCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(en).length])) as Record<Locale, number>;
}
