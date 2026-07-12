import { deepTranslateExtended } from './extendedLocaleStrings';
import { SUPPORTED_LOCALES, type Locale } from './locales';

export interface CountryGuideCatalog {
  trigger: string;
  close: string;
  title: string;
  intro: string;
  countLabel: string;
  euTitle: string;
  euCopy: string;
  newestCopy: string;
  nonEuTitle: string;
  nonEuCopy: string;
  outsideTitle: string;
  outsideCopy: string;
  countedLabel: string;
  notCountedLabel: string;
  officialSource: string;
}

const en: CountryGuideCatalog = {
  trigger: 'Which countries count?',
  close: 'Close country list',
  title: 'Countries in the Schengen Area',
  intro: 'These 29 countries share one 90/180-day short-stay allowance. Moving between them does not reset the count.',
  countLabel: '29 Schengen countries',
  euTitle: '25 EU countries in Schengen',
  euCopy: 'These EU countries are part of the shared Schengen short-stay area.',
  newestCopy: 'Bulgaria and Romania became full members on 1 January 2025.',
  nonEuTitle: 'Not in the EU, but in Schengen',
  nonEuCopy: 'Iceland, Liechtenstein, Norway, and Switzerland still use the same shared Schengen allowance.',
  outsideTitle: 'In the EU, but outside Schengen',
  outsideCopy: 'Ireland and Cyprus do not use the ordinary shared Schengen short-stay count. Check their national entry rules separately.',
  countedLabel: 'Counts as Schengen',
  notCountedLabel: 'Outside the Schengen count',
  officialSource: 'Check the current European Commission list'
};

const catalogs: Partial<Record<Locale, CountryGuideCatalog>> & { en: CountryGuideCatalog } = {
  en,
  fr: {
    trigger:'Quels pays comptent ?',close:'Fermer la liste des pays',title:'Pays de l’espace Schengen',intro:'Ces 29 pays partagent le même quota de court séjour de 90/180 jours. Passer de l’un à l’autre ne remet pas le compteur à zéro.',countLabel:'29 pays Schengen',euTitle:'25 pays de l’UE dans Schengen',euCopy:'Ces pays de l’UE font partie de l’espace commun de court séjour Schengen.',newestCopy:'La Bulgarie et la Roumanie sont devenues membres à part entière le 1er janvier 2025.',nonEuTitle:'Hors UE, mais dans Schengen',nonEuCopy:'L’Islande, le Liechtenstein, la Norvège et la Suisse utilisent le même quota Schengen commun.',outsideTitle:'Dans l’UE, mais hors Schengen',outsideCopy:'L’Irlande et Chypre n’utilisent pas le décompte ordinaire commun de Schengen. Vérifiez séparément leurs règles nationales.',countedLabel:'Compte comme Schengen',notCountedLabel:'Hors du décompte Schengen',officialSource:'Consulter la liste actuelle de la Commission européenne'
  },
  de: {
    trigger:'Welche Länder zählen?',close:'Länderliste schließen',title:'Länder im Schengen-Raum',intro:'Diese 29 Länder teilen sich ein Kurzaufenthaltskontingent von 90/180 Tagen. Ein Wechsel zwischen ihnen setzt den Zähler nicht zurück.',countLabel:'29 Schengen-Länder',euTitle:'25 EU-Länder in Schengen',euCopy:'Diese EU-Länder gehören zum gemeinsamen Schengen-Kurzaufenthaltsraum.',newestCopy:'Bulgarien und Rumänien wurden am 1. Januar 2025 Vollmitglieder.',nonEuTitle:'Nicht in der EU, aber in Schengen',nonEuCopy:'Island, Liechtenstein, Norwegen und die Schweiz nutzen dasselbe gemeinsame Schengen-Kontingent.',outsideTitle:'In der EU, aber außerhalb Schengens',outsideCopy:'Irland und Zypern verwenden nicht die gewöhnliche gemeinsame Schengen-Kurzaufenthaltszählung. Prüfen Sie ihre nationalen Einreiseregeln separat.',countedLabel:'Zählt als Schengen',notCountedLabel:'Außerhalb der Schengen-Zählung',officialSource:'Aktuelle Liste der Europäischen Kommission prüfen'
  },
  es: {
    trigger:'¿Qué países cuentan?',close:'Cerrar la lista de países',title:'Países del espacio Schengen',intro:'Estos 29 países comparten un único límite de estancia corta de 90/180 días. Moverse entre ellos no reinicia el cómputo.',countLabel:'29 países Schengen',euTitle:'25 países de la UE en Schengen',euCopy:'Estos países de la UE forman parte del espacio común Schengen para estancias cortas.',newestCopy:'Bulgaria y Rumanía se convirtieron en miembros plenos el 1 de enero de 2025.',nonEuTitle:'Fuera de la UE, pero dentro de Schengen',nonEuCopy:'Islandia, Liechtenstein, Noruega y Suiza utilizan el mismo límite compartido de Schengen.',outsideTitle:'En la UE, pero fuera de Schengen',outsideCopy:'Irlanda y Chipre no utilizan el cómputo ordinario compartido de estancias cortas de Schengen. Consulta sus normas nacionales por separado.',countedLabel:'Cuenta como Schengen',notCountedLabel:'Fuera del cómputo Schengen',officialSource:'Consultar la lista actual de la Comisión Europea'
  },
  it: {
    trigger:'Quali paesi contano?',close:'Chiudi l’elenco dei paesi',title:'Paesi dell’area Schengen',intro:'Questi 29 paesi condividono un unico limite di 90/180 giorni per i soggiorni brevi. Spostarsi tra loro non azzera il conteggio.',countLabel:'29 paesi Schengen',euTitle:'25 paesi UE in Schengen',euCopy:'Questi paesi dell’UE fanno parte dell’area comune Schengen per soggiorni brevi.',newestCopy:'Bulgaria e Romania sono diventate membri a pieno titolo il 1º gennaio 2025.',nonEuTitle:'Fuori dall’UE, ma dentro Schengen',nonEuCopy:'Islanda, Liechtenstein, Norvegia e Svizzera usano lo stesso limite Schengen condiviso.',outsideTitle:'Nell’UE, ma fuori da Schengen',outsideCopy:'Irlanda e Cipro non usano il normale conteggio condiviso dei soggiorni brevi Schengen. Verifica separatamente le loro regole nazionali.',countedLabel:'Conta come Schengen',notCountedLabel:'Fuori dal conteggio Schengen',officialSource:'Consulta l’elenco aggiornato della Commissione europea'
  },
  ru: {
    trigger:'Какие страны учитываются?',close:'Закрыть список стран',title:'Страны Шенгенской зоны',intro:'Эти 29 стран используют общий лимит краткосрочного пребывания 90/180 дней. Переезд между ними не обнуляет счётчик.',countLabel:'29 стран Шенгена',euTitle:'25 стран ЕС в Шенгене',euCopy:'Эти страны ЕС входят в общую Шенгенскую зону краткосрочного пребывания.',newestCopy:'Болгария и Румыния стали полноправными участниками 1 января 2025 года.',nonEuTitle:'Не в ЕС, но в Шенгене',nonEuCopy:'Исландия, Лихтенштейн, Норвегия и Швейцария используют тот же общий шенгенский лимит.',outsideTitle:'В ЕС, но вне Шенгена',outsideCopy:'Ирландия и Кипр не используют общий шенгенский подсчёт краткосрочного пребывания. Проверяйте их национальные правила отдельно.',countedLabel:'Учитывается как Шенген',notCountedLabel:'Вне шенгенского подсчёта',officialSource:'Проверить актуальный список Еврокомиссии'
  },
  tr: {
    trigger:'Hangi ülkeler sayılır?',close:'Ülke listesini kapat',title:'Schengen Bölgesi ülkeleri',intro:'Bu 29 ülke ortak 90/180 günlük kısa kalış hakkını paylaşır. Aralarında seyahat etmek sayımı sıfırlamaz.',countLabel:'29 Schengen ülkesi',euTitle:'Schengen’deki 25 AB ülkesi',euCopy:'Bu AB ülkeleri ortak Schengen kısa kalış alanının parçasıdır.',newestCopy:'Bulgaristan ve Romanya 1 Ocak 2025’te tam üye oldu.',nonEuTitle:'AB’de değil, ancak Schengen’de',nonEuCopy:'İzlanda, Lihtenştayn, Norveç ve İsviçre aynı ortak Schengen hakkını kullanır.',outsideTitle:'AB’de, ancak Schengen dışında',outsideCopy:'İrlanda ve Kıbrıs ortak Schengen kısa kalış hesabını kullanmaz. Ulusal giriş kurallarını ayrıca kontrol edin.',countedLabel:'Schengen olarak sayılır',notCountedLabel:'Schengen hesabının dışında',officialSource:'Avrupa Komisyonunun güncel listesini kontrol edin'
  },
  he: {
    trigger:'אילו מדינות נספרות?',close:'סגירת רשימת המדינות',title:'המדינות באזור שנגן',intro:'29 המדינות האלה חולקות מכסת שהייה קצרה אחת של 90/180 ימים. מעבר ביניהן אינו מאפס את הספירה.',countLabel:'29 מדינות שנגן',euTitle:'25 מדינות האיחוד בשנגן',euCopy:'מדינות אלה באיחוד האירופי הן חלק מאזור השהייה הקצרה המשותף של שנגן.',newestCopy:'בולגריה ורומניה הפכו לחברות מלאות ב־1 בינואר 2025.',nonEuTitle:'לא באיחוד האירופי, אבל בשנגן',nonEuCopy:'איסלנד, ליכטנשטיין, נורווגיה ושווייץ משתמשות באותה מכסת שנגן משותפת.',outsideTitle:'באיחוד האירופי, אבל מחוץ לשנגן',outsideCopy:'אירלנד וקפריסין אינן משתמשות בספירת השהייה הקצרה המשותפת של שנגן. יש לבדוק בנפרד את כללי הכניסה הלאומיים שלהן.',countedLabel:'נספר כשנגן',notCountedLabel:'מחוץ לספירת שנגן',officialSource:'בדיקת הרשימה העדכנית של הנציבות האירופית'
  },
  ar: {
    trigger:'ما الدول التي تُحتسب؟',close:'إغلاق قائمة الدول',title:'دول منطقة شنغن',intro:'تشترك هذه الدول الـ29 في رصيد واحد للإقامة القصيرة وفق قاعدة 90/180 يومًا. التنقل بينها لا يعيد ضبط العدّ.',countLabel:'29 دولة في شنغن',euTitle:'25 دولة من الاتحاد الأوروبي في شنغن',euCopy:'هذه الدول الأعضاء في الاتحاد الأوروبي جزء من منطقة شنغن المشتركة للإقامة القصيرة.',newestCopy:'أصبحت بلغاريا ورومانيا عضوين كاملين في 1 يناير 2025.',nonEuTitle:'خارج الاتحاد الأوروبي ولكن داخل شنغن',nonEuCopy:'تستخدم آيسلندا وليختنشتاين والنرويج وسويسرا رصيد شنغن المشترك نفسه.',outsideTitle:'داخل الاتحاد الأوروبي ولكن خارج شنغن',outsideCopy:'لا تستخدم أيرلندا وقبرص حساب الإقامة القصيرة المشترك لشنغن. تحقق من قواعد الدخول الوطنية لكل منهما بشكل منفصل.',countedLabel:'تُحتسب ضمن شنغن',notCountedLabel:'خارج حساب شنغن',officialSource:'تحقق من القائمة الحالية للمفوضية الأوروبية'
  }
};

export function countryGuideUi(locale: Locale): CountryGuideCatalog {
  return catalogs[locale] ?? deepTranslateExtended(locale, en);
}

export function countryGuideUiFieldCounts(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(catalogs[locale] ?? en).length])) as Record<Locale, number>;
}
