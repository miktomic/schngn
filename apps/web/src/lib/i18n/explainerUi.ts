import { SUPPORTED_LOCALES, type Locale } from './locales';
import { deepTranslateExtended } from './extendedLocaleStrings';
import { faqUi } from './faqUi';

export interface ExplainerStepCopy {
  title: string;
  body: string;
  emphasis?: string;
}

interface ExplainerCatalog {
  heroTitle: string;
  heroIntro: string;
  stepLabel: string;
  visualLabel: string;
  sampleOne: string;
  sampleTwo: string;
  tryTitle: string;
  tryBody: string;
  steps: readonly ExplainerStepCopy[];
}

const overstayQuestion: Record<Locale, string> = {
  en: 'What happens if I exceed 90 days?',
  fr: 'Que se passe-t-il si je dépasse 90 jours ?',
  de: 'Was passiert, wenn ich 90 Tage überschreite?',
  es: '¿Qué ocurre si supero los 90 días?',
  it: 'Cosa succede se supero i 90 giorni?',
  'pt-br': 'O que acontece se eu ultrapassar 90 dias?',
  ru: 'Что произойдёт, если я превышу 90 дней?',
  uk: 'Що станеться, якщо я перевищу 90 днів?',
  tr: '90 günü aşarsam ne olur?',
  sr: 'Šta se dešava ako prekoračim 90 dana?',
  sq: 'Çfarë ndodh nëse i kaloj 90 ditë?',
  ka: 'რა მოხდება, თუ 90 დღეს გადავაჭარბებ?',
  'zh-cn': '如果我超过90天会怎样？',
  ja: '90日を超えるとどうなりますか？',
  ko: '90일을 초과하면 어떻게 되나요?',
  he: 'מה קורה אם אני חורג מ־90 ימים?',
  ar: 'ماذا يحدث إذا تجاوزت 90 يومًا؟'
};

const overstayPurpose: Record<Locale, string> = {
  en: 'This site exists to help you make sure you never overstay.',
  fr: 'Ce site existe pour vous aider à ne jamais dépasser votre durée de séjour autorisée.',
  de: 'Diese Website soll Ihnen helfen, Ihre erlaubte Aufenthaltsdauer niemals zu überschreiten.',
  es: 'Este sitio existe para ayudarte a asegurarte de no exceder nunca tu estancia autorizada.',
  it: 'Questo sito esiste per aiutarti a non superare mai il periodo di soggiorno autorizzato.',
  'pt-br': 'Este site existe para ajudar você a nunca ultrapassar o período de permanência autorizado.',
  ru: 'Этот сайт создан, чтобы помочь вам никогда не превышать разрешённый срок пребывания.',
  uk: 'Цей сайт створено, щоб допомогти вам ніколи не перевищувати дозволений строк перебування.',
  tr: 'Bu site, izin verilen kalış süresini asla aşmamanıza yardımcı olmak için var.',
  sr: 'Ovaj sajt postoji da vam pomogne da nikada ne prekoračite dozvoljeni boravak.',
  sq: 'Ky sajt ekziston për t’ju ndihmuar të mos e tejkaloni kurrë qëndrimin e lejuar.',
  ka: 'ეს საიტი შექმნილია იმისთვის, რომ არასოდეს გადააჭარბოთ ყოფნის ნებადართულ ვადას.',
  'zh-cn': '本网站旨在帮助你确保永不逾期停留。',
  ja: 'このサイトは、許可された滞在期間を決して超えないよう確認するためにあります。',
  ko: '이 사이트는 허용된 체류 기간을 절대 넘기지 않도록 돕기 위해 존재합니다.',
  he: 'האתר הזה נועד לעזור לכם לוודא שלעולם לא תחרגו מתקופת השהייה המותרת.',
  ar: 'هذا الموقع موجود لمساعدتك على التأكد من عدم تجاوز مدة الإقامة المسموح بها أبدًا.'
};

const catalogs: Partial<Record<Locale, ExplainerCatalog>> & { en: ExplainerCatalog } = {
  en: {
    heroTitle: 'Understand the Schengen 90/180-day rule',
    heroIntro: 'If you visit the Schengen Area for a short stay, this walkthrough shows how long you may stay, which travel days count, and when older days stop counting.',
    stepLabel: 'Schengen rule walkthrough', visualLabel: 'Rule on the timeline',
    sampleOne: 'Earlier stay', sampleTwo: 'Recent stay',
    tryTitle: 'Check the rule against your own dates',
    tryBody: 'Enter past, current, and future stays. SCHNGN applies the same rolling-window calculation shown above.',
    steps: [
      { title: 'The basic rule: up to 90 days in any 180 days', body: 'For an ordinary short stay, you can generally spend no more than 90 days total in the Schengen Area during any 180-day period. Those 90 days are shared across all Schengen countries.' },
      { title: 'Start with today and look back 179 days', body: 'Today plus the previous 179 calendar days make the 180-day window. Tomorrow, the whole window moves forward by one day.' },
      { title: 'Arrival and departure days both count', body: 'Every calendar day you are inside the Schengen Area counts. Arriving late or leaving early does not create a partial day; a same-day visit uses one full day.' },
      { title: 'Changing Schengen countries does not reset the count', body: 'A trip from Italy to Austria is still one continuous Schengen stay. The count pauses only for full calendar days spent outside the Schengen Area.' },
      { title: 'Older days stop counting one by one', body: 'When a travel day becomes more than 179 days old, it falls outside today’s window. That gives one day back; there is no fixed six-month reset.' },
      { title: 'Day 91 is beyond the ordinary limit', body: 'In the final example, the trips add up to 100 days inside today’s window. The first 90 are within the ordinary allowance; the remaining 10 are over the limit.' }
    ]
  },
  fr: {
    heroTitle:'Comprendre la règle Schengen des 90/180 jours',heroIntro:'Pour un court séjour dans l’espace Schengen, ce guide explique combien de temps vous pouvez rester, quels jours comptent et quand les anciens jours cessent de compter.',stepLabel:'Explication de la règle Schengen',visualLabel:'La règle sur la chronologie',sampleOne:'Séjour antérieur',sampleTwo:'Séjour récent',tryTitle:'Vérifiez la règle avec vos propres dates',tryBody:'Saisissez vos séjours passés, actuels et futurs. SCHNGN applique le même calcul de fenêtre mobile présenté ci-dessus.',steps:[
      {title:'La règle de base : jusqu’à 90 jours sur toute période de 180 jours',body:'Pour un court séjour ordinaire, vous pouvez généralement passer au maximum 90 jours au total dans l’espace Schengen sur toute période de 180 jours. Ces 90 jours sont partagés entre tous les pays Schengen.'},
      {title:'Partez d’aujourd’hui et remontez de 179 jours',body:'Aujourd’hui et les 179 jours civils précédents forment la fenêtre de 180 jours. Demain, toute la fenêtre avancera d’un jour.'},
      {title:'Les jours d’arrivée et de départ comptent',body:'Chaque jour civil passé dans l’espace Schengen compte. Arriver tard ou partir tôt ne crée pas une fraction de journée ; un aller-retour le même jour utilise une journée entière.'},
      {title:'Changer de pays Schengen ne remet pas le compteur à zéro',body:'Un trajet d’Italie en Autriche reste un seul séjour Schengen continu. Le décompte s’interrompt uniquement pendant les jours civils complets passés hors de l’espace Schengen.'},
      {title:'Les anciens jours cessent de compter un par un',body:'Lorsqu’un jour de voyage date de plus de 179 jours, il sort de la fenêtre d’aujourd’hui. Vous récupérez alors un jour ; il n’existe pas de remise à zéro fixe tous les six mois.'},
      {title:'Le 91e jour dépasse la limite ordinaire',body:'Dans le dernier exemple, les séjours totalisent 100 jours dans la fenêtre d’aujourd’hui. Les 90 premiers respectent le quota ordinaire ; les 10 autres dépassent la limite.'}
    ]
  },
  de: {
    heroTitle:'Die Schengen-90/180-Tage-Regel verstehen',heroIntro:'Für einen Kurzaufenthalt im Schengen-Raum zeigt dieser Leitfaden, wie lange Sie bleiben dürfen, welche Reisetage zählen und wann ältere Tage nicht mehr zählen.',stepLabel:'Erklärung der Schengen-Regel',visualLabel:'Die Regel auf der Zeitleiste',sampleOne:'Früherer Aufenthalt',sampleTwo:'Kürzlicher Aufenthalt',tryTitle:'Prüfen Sie die Regel mit Ihren Daten',tryBody:'Geben Sie vergangene, aktuelle und zukünftige Aufenthalte ein. SCHNGN verwendet dieselbe oben gezeigte Berechnung des rollierenden Fensters.',steps:[
      {title:'Die Grundregel: bis zu 90 Tage in jedem Zeitraum von 180 Tagen',body:'Bei einem gewöhnlichen Kurzaufenthalt dürfen Sie sich in der Regel insgesamt höchstens 90 Tage innerhalb eines beliebigen 180-Tage-Zeitraums im Schengen-Raum aufhalten. Diese 90 Tage gelten gemeinsam für alle Schengen-Länder.'},
      {title:'Beginnen Sie mit heute und blicken Sie 179 Tage zurück',body:'Heute und die vorherigen 179 Kalendertage bilden das 180-Tage-Fenster. Morgen rückt das gesamte Fenster um einen Tag weiter.'},
      {title:'Ankunfts- und Abreisetag zählen beide',body:'Jeder Kalendertag im Schengen-Raum zählt. Eine späte Ankunft oder frühe Abreise ergibt keinen Teil-Tag; ein Besuch am selben Tag verbraucht einen ganzen Tag.'},
      {title:'Ein Wechsel des Schengen-Landes setzt den Zähler nicht zurück',body:'Eine Reise von Italien nach Österreich bleibt ein zusammenhängender Schengen-Aufenthalt. Der Zähler pausiert nur an vollständigen Kalendertagen außerhalb des Schengen-Raums.'},
      {title:'Ältere Tage fallen einzeln aus der Zählung',body:'Sobald ein Reisetag mehr als 179 Tage zurückliegt, fällt er aus dem heutigen Fenster. Dadurch wird ein Tag wieder frei; es gibt keinen festen Sechsmonats-Reset.'},
      {title:'Tag 91 liegt über der gewöhnlichen Grenze',body:'Im letzten Beispiel ergeben die Reisen 100 Tage im heutigen Fenster. Die ersten 90 liegen innerhalb des gewöhnlichen Kontingents; die übrigen 10 überschreiten die Grenze.'}
    ]
  },
  es: {
    heroTitle:'Entender la regla Schengen de 90/180 días',heroIntro:'Para una estancia corta en el espacio Schengen, esta guía explica cuánto tiempo puedes permanecer, qué días cuentan y cuándo dejan de contar los días antiguos.',stepLabel:'Explicación de la regla Schengen',visualLabel:'La regla en la cronología',sampleOne:'Estancia anterior',sampleTwo:'Estancia reciente',tryTitle:'Comprueba la regla con tus fechas',tryBody:'Introduce estancias pasadas, actuales y futuras. SCHNGN aplica el mismo cálculo de ventana móvil mostrado arriba.',steps:[
      {title:'La regla básica: hasta 90 días en cualquier período de 180 días',body:'Para una estancia corta ordinaria, normalmente puedes pasar un máximo de 90 días en total dentro del espacio Schengen durante cualquier período de 180 días. Esos 90 días se comparten entre todos los países Schengen.'},
      {title:'Empieza por hoy y mira 179 días atrás',body:'Hoy y los 179 días naturales anteriores forman la ventana de 180 días. Mañana, toda la ventana avanzará un día.'},
      {title:'Los días de llegada y salida cuentan',body:'Cuenta cada día natural dentro del espacio Schengen. Llegar tarde o salir temprano no crea una fracción de día; una visita de ida y vuelta en el mismo día utiliza un día entero.'},
      {title:'Cambiar de país Schengen no reinicia el cómputo',body:'Un viaje de Italia a Austria sigue siendo una estancia Schengen continua. El cómputo solo se detiene durante días naturales completos fuera del espacio Schengen.'},
      {title:'Los días antiguos dejan de contar uno a uno',body:'Cuando un día de viaje tiene más de 179 días, queda fuera de la ventana de hoy. Así recuperas un día; no existe un reinicio fijo cada seis meses.'},
      {title:'El día 91 supera el límite ordinario',body:'En el último ejemplo, los viajes suman 100 días dentro de la ventana de hoy. Los primeros 90 están dentro del límite ordinario; los 10 restantes lo superan.'}
    ]
  },
  it: {
    heroTitle:'Capire la regola Schengen dei 90/180 giorni',heroIntro:'Per un soggiorno breve nell’area Schengen, questa guida spiega quanto puoi restare, quali giorni contano e quando i giorni più vecchi smettono di contare.',stepLabel:'Spiegazione della regola Schengen',visualLabel:'La regola sulla cronologia',sampleOne:'Soggiorno precedente',sampleTwo:'Soggiorno recente',tryTitle:'Verifica la regola con le tue date',tryBody:'Inserisci soggiorni passati, attuali e futuri. SCHNGN applica lo stesso calcolo della finestra mobile mostrato sopra.',steps:[
      {title:'La regola di base: fino a 90 giorni in qualsiasi periodo di 180 giorni',body:'Per un soggiorno breve ordinario, in genere puoi trascorrere al massimo 90 giorni complessivi nell’area Schengen durante qualsiasi periodo di 180 giorni. Questi 90 giorni sono condivisi tra tutti i paesi Schengen.'},
      {title:'Parti da oggi e torna indietro di 179 giorni',body:'Oggi e i 179 giorni di calendario precedenti formano la finestra di 180 giorni. Domani l’intera finestra avanzerà di un giorno.'},
      {title:'I giorni di arrivo e partenza contano entrambi',body:'Conta ogni giorno di calendario trascorso nell’area Schengen. Arrivare tardi o partire presto non crea una frazione di giorno; una visita in giornata utilizza un giorno intero.'},
      {title:'Cambiare paese Schengen non azzera il conteggio',body:'Un viaggio dall’Italia all’Austria resta un unico soggiorno Schengen continuo. Il conteggio si ferma solo durante giorni di calendario completi fuori dall’area Schengen.'},
      {title:'I giorni più vecchi smettono di contare uno alla volta',body:'Quando un giorno di viaggio supera i 179 giorni, esce dalla finestra di oggi. In questo modo recuperi un giorno; non esiste un azzeramento fisso ogni sei mesi.'},
      {title:'Il giorno 91 supera il limite ordinario',body:'Nell’ultimo esempio, i viaggi totalizzano 100 giorni nella finestra di oggi. I primi 90 rientrano nel limite ordinario; i 10 restanti lo superano.'}
    ]
  },
  ru: {
    heroTitle:'Понять шенгенское правило 90/180 дней',heroIntro:'Для краткосрочной поездки в Шенгенскую зону это объяснение показывает, как долго можно оставаться, какие дни учитываются и когда старые дни перестают считаться.',stepLabel:'Объяснение шенгенского правила',visualLabel:'Правило на временной шкале',sampleOne:'Предыдущая поездка',sampleTwo:'Недавняя поездка',tryTitle:'Проверьте правило на своих датах',tryBody:'Введите прошлые, текущие и будущие поездки. SCHNGN применит тот же расчёт скользящего окна, который показан выше.',steps:[
      {title:'Основное правило: до 90 дней в любом периоде из 180 дней',body:'Для обычной краткосрочной поездки, как правило, можно провести в Шенгенской зоне не более 90 дней суммарно в любом 180-дневном периоде. Эти 90 дней общие для всех стран Шенгена.'},
      {title:'Начните с сегодняшнего дня и отсчитайте 179 дней назад',body:'Сегодняшний день и предыдущие 179 календарных дней образуют 180-дневное окно. Завтра всё окно сдвинется вперёд на один день.'},
      {title:'Дни прибытия и отъезда учитываются',body:'Учитывается каждый календарный день в Шенгенской зоне. Поздний приезд или ранний отъезд не создаёт неполный день; поездка с возвращением в тот же день использует целый день.'},
      {title:'Смена страны Шенгена не обнуляет счётчик',body:'Поездка из Италии в Австрию остаётся одним непрерывным пребыванием в Шенгене. Счётчик приостанавливается только на полные календарные дни вне Шенгенской зоны.'},
      {title:'Старые дни перестают учитываться по одному',body:'Когда со дня поездки проходит более 179 дней, он выходит из сегодняшнего окна. Так возвращается один день; фиксированного сброса раз в шесть месяцев нет.'},
      {title:'91-й день превышает обычный лимит',body:'В последнем примере поездки дают 100 дней в сегодняшнем окне. Первые 90 входят в обычный лимит, а оставшиеся 10 превышают его.'}
    ]
  },
  tr: {
    heroTitle:'Schengen 90/180 gün kuralını anlayın',heroIntro:'Schengen Bölgesi’ndeki kısa bir kalış için bu açıklama ne kadar kalabileceğinizi, hangi seyahat günlerinin sayıldığını ve eski günlerin ne zaman sayımdan çıktığını gösterir.',stepLabel:'Schengen kuralı açıklaması',visualLabel:'Kuralın zaman çizelgesindeki görünümü',sampleOne:'Önceki kalış',sampleTwo:'Yakın tarihli kalış',tryTitle:'Kuralı kendi tarihlerinizle kontrol edin',tryBody:'Geçmiş, mevcut ve gelecekteki kalışları girin. SCHNGN yukarıda gösterilen aynı kayan pencere hesabını uygular.',steps:[
      {title:'Temel kural: herhangi 180 günde en fazla 90 gün',body:'Olağan bir kısa kalışta, herhangi bir 180 günlük dönem içinde Schengen Bölgesi’nde genellikle toplam en fazla 90 gün geçirebilirsiniz. Bu 90 gün tüm Schengen ülkeleri arasında ortaktır.'},
      {title:'Bugünden başlayın ve 179 gün geriye bakın',body:'Bugün ve önceki 179 takvim günü 180 günlük pencereyi oluşturur. Yarın tüm pencere bir gün ileri kayar.'},
      {title:'Varış ve ayrılış günlerinin ikisi de sayılır',body:'Schengen Bölgesi’nde bulunduğunuz her takvim günü sayılır. Geç varmak veya erken ayrılmak kısmi gün oluşturmaz; aynı gün gidip dönmek bir tam gün kullanır.'},
      {title:'Schengen ülkesi değiştirmek sayımı sıfırlamaz',body:'İtalya’dan Avusturya’ya yapılan bir yolculuk tek ve kesintisiz bir Schengen kalışı olarak devam eder. Sayım yalnızca Schengen Bölgesi dışında geçirilen tam takvim günlerinde durur.'},
      {title:'Eski günler birer birer sayımdan çıkar',body:'Bir seyahat günü 179 günden daha eski olduğunda bugünkü pencerenin dışına çıkar. Böylece bir gün geri kazanılır; altı ayda bir sabit sıfırlama yoktur.'},
      {title:'91. gün olağan sınırın ötesindedir',body:'Son örnekte seyahatler bugünkü pencere içinde toplam 100 gündür. İlk 90 gün olağan kotadadır; kalan 10 gün sınırı aşar.'}
    ]
  },
  he: {
    heroTitle:'הבנת כלל 90/180 הימים של שנגן',heroIntro:'לשהייה קצרה באזור שנגן, ההסבר הזה מראה כמה זמן אפשר להישאר, אילו ימי נסיעה נספרים ומתי ימים ישנים מפסיקים להיספר.',stepLabel:'הסבר כלל שנגן',visualLabel:'הכלל על ציר הזמן',sampleOne:'שהייה קודמת',sampleTwo:'שהייה אחרונה',tryTitle:'בדקו את הכלל לפי התאריכים שלכם',tryBody:'הזינו שהיות קודמות, נוכחיות ועתידיות. SCHNGN מפעיל את אותו חישוב חלון נע שמוצג למעלה.',steps:[
      {title:'הכלל הבסיסי: עד 90 ימים בכל 180 ימים',body:'בשהייה קצרה רגילה אפשר בדרך כלל לשהות באזור שנגן לא יותר מ־90 ימים בסך הכול בתוך כל תקופה של 180 ימים. 90 הימים משותפים לכל מדינות שנגן.'},
      {title:'מתחילים מהיום ומביטים 179 ימים אחורה',body:'היום ו־179 הימים הקלנדריים שלפניו יוצרים את חלון 180 הימים. מחר כל החלון יתקדם ביום אחד.'},
      {title:'גם יום ההגעה וגם יום העזיבה נספרים',body:'כל יום קלנדרי באזור שנגן נספר. הגעה מאוחרת או יציאה מוקדמת אינן יוצרות חלק מיום; ביקור הלוך ושוב באותו יום משתמש ביום מלא.'},
      {title:'מעבר בין מדינות שנגן אינו מאפס את הספירה',body:'נסיעה מאיטליה לאוסטריה היא עדיין שהייה רצופה אחת בשנגן. הספירה נעצרת רק בימים קלנדריים מלאים מחוץ לאזור שנגן.'},
      {title:'ימים ישנים מפסיקים להיספר אחד אחד',body:'כאשר יום נסיעה נעשה ישן מ־179 ימים, הוא יוצא מהחלון של היום. כך יום אחד חוזר; אין איפוס קבוע אחת לשישה חודשים.'},
      {title:'היום ה־91 חורג מהמגבלה הרגילה',body:'בדוגמה האחרונה הנסיעות מסתכמות ב־100 ימים בחלון של היום. 90 הימים הראשונים במסגרת המכסה הרגילה; 10 הנותרים חורגים מהמגבלה.'}
    ]
  },
  ar: {
    heroTitle:'فهم قاعدة شنغن 90/180 يومًا',heroIntro:'للإقامة القصيرة في منطقة شنغن، يوضح هذا الشرح مدة البقاء الممكنة، وأيام السفر المحتسبة، ومتى تتوقف الأيام القديمة عن الاحتساب.',stepLabel:'شرح قاعدة شنغن',visualLabel:'القاعدة على المخطط الزمني',sampleOne:'إقامة سابقة',sampleTwo:'إقامة حديثة',tryTitle:'اختبر القاعدة باستخدام تواريخك',tryBody:'أدخل الإقامات السابقة والحالية والمستقبلية. يطبق SCHNGN حساب النافذة المتحركة نفسه الموضح أعلاه.',steps:[
      {title:'القاعدة الأساسية: حتى 90 يومًا في أي 180 يومًا',body:'في الإقامة القصيرة العادية، يمكنك عمومًا قضاء ما لا يزيد على 90 يومًا إجمالًا في منطقة شنغن خلال أي فترة من 180 يومًا. تشترك جميع دول شنغن في هذه الأيام التسعين.'},
      {title:'ابدأ من اليوم وارجع 179 يومًا',body:'يشكّل اليوم والأيام التقويمية الـ179 السابقة نافذة الـ180 يومًا. غدًا تتحرك النافذة كلها يومًا واحدًا إلى الأمام.'},
      {title:'يُحتسب يوم الوصول ويوم المغادرة',body:'يُحتسب كل يوم تقويمي تقضيه داخل منطقة شنغن. لا يؤدي الوصول المتأخر أو المغادرة المبكرة إلى جزء من يوم؛ فالزيارة ذهابًا وإيابًا في اليوم نفسه تستخدم يومًا كاملًا.'},
      {title:'الانتقال بين دول شنغن لا يعيد ضبط العدّ',body:'تظل الرحلة من إيطاليا إلى النمسا إقامة شنغن واحدة متصلة. يتوقف العد فقط خلال الأيام التقويمية الكاملة التي تقضيها خارج منطقة شنغن.'},
      {title:'تتوقف الأيام القديمة عن الاحتساب واحدًا تلو الآخر',body:'عندما يصبح يوم السفر أقدم من 179 يومًا، يخرج من نافذة اليوم. وبذلك يعود يوم واحد؛ ولا توجد إعادة ضبط ثابتة كل ستة أشهر.'},
      {title:'اليوم 91 يتجاوز الحد العادي',body:'في المثال الأخير يبلغ مجموع الرحلات 100 يوم داخل نافذة اليوم. تقع الأيام التسعون الأولى ضمن الرصيد العادي؛ أما الأيام العشرة المتبقية فتتجاوز الحد.'}
    ]
  }
};

export function explainerUi(locale: Locale): ExplainerCatalog {
  const base = catalogs[locale] ?? deepTranslateExtended(locale, catalogs.en);
  const overstay = faqUi(locale).groups
    .flatMap((group) => group.items)
    .find((item) => item.id === 'overstay');
  const fallback = faqUi('en').groups
    .flatMap((group) => group.items)
    .find((item) => item.id === 'overstay');

  return {
    ...base,
    steps: [
      ...base.steps,
      {
        title: overstayQuestion[locale],
        body: overstay?.answer ?? fallback?.answer ?? '',
        emphasis: overstayPurpose[locale]
      }
    ]
  };
}

export function explainerCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(catalogs.en).length])) as Record<Locale, number>;
}
