import type { Locale } from './locales';

type TripOnboardingKey =
  | 'step'
  | 'title'
  | 'copy'
  | 'pastAction'
  | 'bookedAction'
  | 'noHistory'
  | 'timelineTitle'
  | 'timelineHelp';

const en: Record<TripOnboardingKey, string> = {
  step: 'Step 1 · Add your travel history',
  title: 'First, add your previous Schengen trips',
  copy: 'Your earlier travel determines how many days you have available now. Start with Schengen stays from the last 180 days.',
  pastAction: 'Add trips you already completed',
  bookedAction: 'Then add any trips you already booked',
  noHistory: 'No previous Schengen trips? Go straight to planning.',
  timelineTitle: 'Your 180-day timeline',
  timelineHelp: 'This timeline updates whenever you add, edit, or remove a trip.'
};

const catalogs: Record<Locale, Record<TripOnboardingKey, string>> = {
  en,
  fr: { step:'Étape 1 · Ajoutez votre historique',title:'Commencez par vos précédents voyages Schengen',copy:'Vos voyages précédents déterminent les jours disponibles aujourd’hui. Commencez par les séjours Schengen des 180 derniers jours.',pastAction:'Ajoutez les voyages déjà terminés',bookedAction:'Ajoutez ensuite les voyages déjà réservés',noHistory:'Aucun voyage Schengen précédent ? Passez directement à la planification.',timelineTitle:'Votre chronologie sur 180 jours',timelineHelp:'Cette chronologie se met à jour quand vous ajoutez, modifiez ou supprimez un voyage.' },
  de: { step:'Schritt 1 · Reiseverlauf hinzufügen',title:'Fügen Sie zuerst frühere Schengen-Reisen hinzu',copy:'Frühere Reisen bestimmen, wie viele Tage jetzt verfügbar sind. Beginnen Sie mit Schengen-Aufenthalten der letzten 180 Tage.',pastAction:'Bereits abgeschlossene Reisen hinzufügen',bookedAction:'Danach bereits gebuchte Reisen hinzufügen',noHistory:'Keine früheren Schengen-Reisen? Gehen Sie direkt zur Planung.',timelineTitle:'Ihre 180-Tage-Zeitleiste',timelineHelp:'Diese Zeitleiste wird nach jedem Hinzufügen, Bearbeiten oder Löschen aktualisiert.' },
  es: { step:'Paso 1 · Añade tu historial',title:'Primero, añade tus viajes Schengen anteriores',copy:'Tus viajes anteriores determinan cuántos días tienes disponibles ahora. Empieza con las estancias Schengen de los últimos 180 días.',pastAction:'Añade los viajes que ya terminaste',bookedAction:'Después añade los viajes ya reservados',noHistory:'¿No tienes viajes Schengen anteriores? Pasa directamente a planificar.',timelineTitle:'Tu cronología de 180 días',timelineHelp:'La cronología se actualiza al añadir, editar o eliminar un viaje.' },
  it: { step:'Passaggio 1 · Aggiungi la cronologia',title:'Per prima cosa, aggiungi i viaggi Schengen precedenti',copy:'I viaggi precedenti determinano i giorni disponibili ora. Inizia dai soggiorni Schengen degli ultimi 180 giorni.',pastAction:'Aggiungi i viaggi già conclusi',bookedAction:'Poi aggiungi i viaggi già prenotati',noHistory:'Nessun viaggio Schengen precedente? Vai direttamente alla pianificazione.',timelineTitle:'La tua cronologia di 180 giorni',timelineHelp:'La cronologia si aggiorna quando aggiungi, modifichi o elimini un viaggio.' },
  ru: { step:'Шаг 1 · Добавьте историю поездок',title:'Сначала добавьте предыдущие поездки в Шенген',copy:'Предыдущие поездки определяют, сколько дней доступно сейчас. Начните с пребываний в Шенгене за последние 180 дней.',pastAction:'Добавьте уже завершённые поездки',bookedAction:'Затем добавьте уже забронированные поездки',noHistory:'Раньше не были в Шенгене? Сразу переходите к планированию.',timelineTitle:'Ваша шкала за 180 дней',timelineHelp:'Шкала обновляется при добавлении, изменении или удалении поездки.' },
  tr: { step:'1. adım · Seyahat geçmişinizi ekleyin',title:'Önce önceki Schengen seyahatlerinizi ekleyin',copy:'Önceki seyahatleriniz bugün kaç gününüz kaldığını belirler. Son 180 gündeki Schengen konaklamalarıyla başlayın.',pastAction:'Tamamladığınız seyahatleri ekleyin',bookedAction:'Ardından rezerve ettiğiniz seyahatleri ekleyin',noHistory:'Önceki Schengen seyahatiniz yok mu? Doğrudan planlamaya geçin.',timelineTitle:'180 günlük zaman çizelgeniz',timelineHelp:'Bir seyahat eklediğinizde, düzenlediğinizde veya sildiğinizde bu çizelge güncellenir.' },
  he: { step:'שלב 1 · הוספת היסטוריית הנסיעות',title:'תחילה הוסיפו את נסיעות שנגן הקודמות',copy:'הנסיעות הקודמות קובעות כמה ימים זמינים לכם כעת. התחילו בשהיות בשנגן מ־180 הימים האחרונים.',pastAction:'הוסיפו נסיעות שכבר הסתיימו',bookedAction:'לאחר מכן הוסיפו נסיעות שכבר הוזמנו',noHistory:'אין נסיעות שנגן קודמות? עברו ישירות לתכנון.',timelineTitle:'ציר הזמן שלכם ל־180 יום',timelineHelp:'ציר הזמן מתעדכן בכל הוספה, עריכה או מחיקה של נסיעה.' },
  ar: { step:'الخطوة 1 · أضف سجل سفرك',title:'أضف أولًا رحلات شنغن السابقة',copy:'تحدد رحلاتك السابقة عدد الأيام المتاحة لك الآن. ابدأ بإقامات شنغن خلال آخر 180 يومًا.',pastAction:'أضف الرحلات التي أكملتها',bookedAction:'ثم أضف الرحلات التي حجزتها',noHistory:'لا توجد رحلات شنغن سابقة؟ انتقل مباشرة إلى التخطيط.',timelineTitle:'مخططك الزمني لمدة 180 يومًا',timelineHelp:'يتحدث المخطط عند إضافة رحلة أو تعديلها أو حذفها.' }
};

export function createTripOnboardingTranslator(locale: Locale): (key: TripOnboardingKey) => string {
  return (key) => catalogs[locale][key];
}

export function tripOnboardingCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(Object.entries(catalogs).map(([locale, catalog]) => [locale, Object.keys(catalog).length])) as Record<Locale, number>;
}
