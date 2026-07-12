import { deepTranslateExtended } from './extendedLocaleStrings';
import type { Locale } from './locales';

export type FaqSourceId =
  | 'calculator'
  | 'schengenArea'
  | 'travelDocuments'
  | 'visa'
  | 'family'
  | 'eesEtias'
  | 'eesFaq';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  source?: FaqSourceId;
  productGuidance?: boolean;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: readonly FaqItem[];
}

interface FaqCatalog {
  title: string;
  intro: string;
  reviewedCopy: string;
  officialSource: string;
  productGuidance: string;
  sourceNames: Record<FaqSourceId, string>;
  groups: readonly FaqGroup[];
}

export const FAQ_SOURCE_URLS: Record<FaqSourceId, string> = {
  calculator: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en',
  schengenArea: 'https://home-affairs.ec.europa.eu/policies/schengen/schengen-area_en',
  travelDocuments: 'https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm',
  visa: 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en',
  family: 'https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-family/index_en.htm',
  eesEtias: 'https://home-affairs.ec.europa.eu/news/main-differences-between-ees-and-etias-what-travellers-need-know-2026-04-28_en',
  eesFaq: 'https://travel-europe.europa.eu/ees/faq'
};

const sourceNames = {
  en: {
    calculator: 'European Commission short-stay calculator', schengenArea: 'European Commission Schengen Area guide', travelDocuments: 'Your Europe travel-document guide', visa: 'European Commission Schengen visa guide', family: 'Your Europe guide for non-EU family members', eesEtias: 'European Commission EES and ETIAS guide', eesFaq: 'Official EES frequently asked questions'
  },
  fr: {
    calculator: 'calculateur de court séjour de la Commission européenne', schengenArea: 'guide de la Commission européenne sur l’espace Schengen', travelDocuments: 'guide Your Europe sur les documents de voyage', visa: 'guide de la Commission européenne sur le visa Schengen', family: 'guide Your Europe pour les membres de famille non-UE', eesEtias: 'guide de la Commission européenne sur l’EES et l’ETIAS', eesFaq: 'questions officielles sur l’EES'
  },
  de: {
    calculator: 'Kurzaufenthaltsrechner der Europäischen Kommission', schengenArea: 'Schengen-Leitfaden der Europäischen Kommission', travelDocuments: 'Your-Europe-Leitfaden zu Reisedokumenten', visa: 'Schengen-Visum-Leitfaden der Europäischen Kommission', family: 'Your-Europe-Leitfaden für Nicht-EU-Familienangehörige', eesEtias: 'EES- und ETIAS-Leitfaden der Europäischen Kommission', eesFaq: 'offizielle Fragen und Antworten zum EES'
  },
  es: {
    calculator: 'calculadora de estancias cortas de la Comisión Europea', schengenArea: 'guía de la Comisión Europea sobre el espacio Schengen', travelDocuments: 'guía de Your Europe sobre documentos de viaje', visa: 'guía de la Comisión Europea sobre el visado Schengen', family: 'guía de Your Europe para familiares no comunitarios', eesEtias: 'guía de la Comisión Europea sobre EES y ETIAS', eesFaq: 'preguntas oficiales sobre el EES'
  },
  it: {
    calculator: 'calcolatore per soggiorni brevi della Commissione europea', schengenArea: 'guida della Commissione europea allo spazio Schengen', travelDocuments: 'guida Your Europe sui documenti di viaggio', visa: 'guida della Commissione europea al visto Schengen', family: 'guida Your Europe per familiari non UE', eesEtias: 'guida della Commissione europea su EES ed ETIAS', eesFaq: 'domande ufficiali sull’EES'
  },
  ru: {
    calculator: 'калькулятор краткосрочного пребывания Еврокомиссии', schengenArea: 'справочник Еврокомиссии по Шенгенской зоне', travelDocuments: 'справочник Your Europe о проездных документах', visa: 'справочник Еврокомиссии по шенгенской визе', family: 'справочник Your Europe для членов семьи не из ЕС', eesEtias: 'справочник Еврокомиссии по EES и ETIAS', eesFaq: 'официальные вопросы и ответы об EES'
  },
  tr: {
    calculator: 'Avrupa Komisyonu kısa kalış hesaplayıcısı', schengenArea: 'Avrupa Komisyonu Schengen Bölgesi rehberi', travelDocuments: 'Your Europe seyahat belgesi rehberi', visa: 'Avrupa Komisyonu Schengen vizesi rehberi', family: 'AB dışı aile üyeleri için Your Europe rehberi', eesEtias: 'Avrupa Komisyonu EES ve ETIAS rehberi', eesFaq: 'resmî EES sık sorulan soruları'
  },
  he: {
    calculator: 'מחשבון השהייה הקצרה של הנציבות האירופית', schengenArea: 'מדריך הנציבות האירופית לאזור שנגן', travelDocuments: 'מדריך Your Europe למסמכי נסיעה', visa: 'מדריך הנציבות האירופית לאשרת שנגן', family: 'מדריך Your Europe לבני משפחה שאינם אזרחי האיחוד', eesEtias: 'מדריך הנציבות האירופית ל-EES ול-ETIAS', eesFaq: 'שאלות ותשובות רשמיות על EES'
  },
  ar: {
    calculator: 'حاسبة الإقامة القصيرة للمفوضية الأوروبية', schengenArea: 'دليل المفوضية الأوروبية لمنطقة شنغن', travelDocuments: 'دليل Your Europe لوثائق السفر', visa: 'دليل المفوضية الأوروبية لتأشيرة شنغن', family: 'دليل Your Europe لأفراد الأسرة من خارج الاتحاد', eesEtias: 'دليل المفوضية الأوروبية لنظامي EES وETIAS', eesFaq: 'الأسئلة الرسمية الشائعة عن EES'
  }
} satisfies Partial<Record<Locale, Record<FaqSourceId, string>>>;

const catalogs: Partial<Record<Locale, FaqCatalog>> & { en: FaqCatalog } = {
  en: {
    title: 'Frequently asked questions',
    intro: 'Plain-language answers to the questions that most often change a Schengen calculation. Open only what you need.',
    reviewedCopy: 'Reviewed 12 July 2026. Rule answers are based on European Commission and EU guidance. SCHNGN guidance explains how this app handles your dates; it is not legal advice.',
    officialSource: 'Official source', productGuidance: 'How SCHNGN handles this', sourceNames: sourceNames.en,
    groups: [
      { id: 'rule', title: 'How the 90/180-day rule works', items: [
        { id: 'meaning', question: 'What does “90 days in any 180 days” mean?', answer: 'On every day of a short stay, look back at that day and the previous 179 days. No more than 90 days of presence may fall inside that moving 180-day window.', source: 'calculator' },
        { id: 'reset', question: 'Does the allowance reset every six months or on 1 January?', answer: 'No. There is no fixed reset date. The window moves forward one day at a time, so older presence days become available individually as they fall outside the look-back period.', source: 'calculator' },
        { id: 'boundaries', question: 'Do arrival and departure days both count?', answer: 'Yes. Entry is the first day of stay and exit is the last. Arriving late, leaving early or entering and exiting on the same date still uses that calendar day.', source: 'calculator' },
        { id: 'countries', question: 'Does moving to another Schengen country reset the count?', answer: 'No. The 29 Schengen countries share one allowance. Travel from Italy to Austria, for example, remains continuous Schengen presence unless you actually leave the Schengen Area.', source: 'schengenArea' },
        { id: 'outside', question: 'How long must I stay outside Schengen to get days back?', answer: 'Days usually return one by one as old stay dates leave the rolling window. A continuous absence of 90 days guarantees that the earlier 90-day stay has fully aged out, but shorter gaps can also return some days.', source: 'calculator' }
      ] },
      { id: 'documents', title: 'Documents, borders and exceptions', items: [
        { id: 'who', question: 'Who is the ordinary 90/180-day rule for?', answer: 'It generally applies to non-EU nationals making short stays, whether visa-free or using a short-stay visa. Free-movement rights, residence status and nationality-specific rules can create different outcomes.', source: 'travelDocuments' },
        { id: 'visa', question: 'Does a Schengen visa always allow 90 days?', answer: 'No. Ninety days is the general maximum. A visa sticker can authorize fewer days, fewer entries or a narrower validity period, and those limits also apply.', source: 'visa' },
        { id: 'permit', question: 'What if I have a residence permit or long-stay visa?', answer: 'Time authorized by a Schengen residence permit or D-type long-stay visa is not entered as an ordinary short stay in the EU calculator. Travel in other Schengen countries may still have a separate 90/180 limit, so check the issuing authority’s rules.', source: 'calculator' },
        { id: 'family', question: 'Do non-EU family members of EU citizens always use this calculation?', answer: 'Not always. EU free-movement rules can give qualifying family members different rights when accompanying or joining an EU citizen. Do not rely on this calculator for that exception without checking the official conditions.', source: 'family' },
        { id: 'area', question: 'Are every EU country and every European country in Schengen?', answer: 'No. The Schengen Area currently has 29 countries, including Bulgaria and Romania since 1 January 2025. Cyprus and Ireland are not in the border-free Schengen Area and apply different rules.', source: 'schengenArea' },
        { id: 'transit', question: 'Does an airport connection count as a Schengen day?', answer: 'Remaining in an international airport transit area without entering Schengen is not a short stay. If you cross border control and enter the Schengen Area, that calendar day counts.', source: 'visa' },
        { id: 'systems', question: 'Do EES or ETIAS change the 90/180-day calculation?', answer: 'No. EES records external-border entries and exits, while ETIAS is a travel authorization for eligible visa-free travelers. Neither replaces or increases the 90/180-day allowance.', source: 'eesEtias' }
      ] },
      { id: 'problems', title: 'Overstays and difficult cases', items: [
        { id: 'overstay', question: 'What can happen if I overstay?', answer: 'Consequences depend on the facts and national procedure. They can include refusal of entry, return procedures and, in some cases, an entry ban recorded in the Schengen Information System.', source: 'eesFaq' },
        { id: 'bilateral', question: 'Can a bilateral agreement or national rule allow extra time?', answer: 'Sometimes a country-specific agreement or national permission may apply, but it does not simply add days to the shared Schengen calculation. Confirm the exact territory, exit route and conditions with the relevant authority.', source: 'calculator' },
        { id: 'authority', question: 'Is a calculator result binding on border authorities?', answer: 'No. Even the European Commission calculator is a helping tool. Competent authorities decide the authorized stay, and they may consider visa validity, documents, residence rights and other facts that SCHNGN does not model.', source: 'calculator' }
      ] },
      { id: 'product', title: 'Using SCHNGN', items: [
        { id: 'ongoing', question: 'Can I add a current or future stay without choosing an exit date?', answer: 'Yes. Select “I don’t know the exit date yet.” For a current stay, SCHNGN counts through today; for a future stay, it projects the latest safe exit from your other trips. The exit remains open until you enter the actual date.', productGuidance: true },
        { id: 'records', question: 'How does SCHNGN handle overlapping or old trips?', answer: 'Overlapping dates are counted once, because one physical day cannot use two allowance days. Trips outside today’s 180-day window remain in your history but are hidden behind “Show trips outside 180” and do not affect today’s result.', productGuidance: true },
        { id: 'privacy', question: 'Where are my trip dates stored?', answer: 'Guest trips stay in this browser. Choosing “Sign up & save” or “Create account & save trips” opens secure account creation; after you create an account, SCHNGN automatically saves your current trip history to your account. Trip dates are never sent to analytics.', productGuidance: true }
      ] }
    ]
  },
  fr: {
    title: 'Questions fréquentes', intro: 'Des réponses claires aux questions qui modifient le plus souvent un calcul Schengen. Ouvrez uniquement ce dont vous avez besoin.', reviewedCopy: 'Vérifié le 12 juillet 2026. Les réponses reposent sur les indications de la Commission européenne et de l’UE. Les indications SCHNGN expliquent l’application et ne constituent pas un avis juridique.', officialSource: 'Source officielle', productGuidance: 'Traitement par SCHNGN', sourceNames: sourceNames.fr,
    groups: [
      { id:'rule',title:'Comprendre la règle des 90/180 jours',items:[
        {id:'meaning',question:'Que signifie « 90 jours sur toute période de 180 jours » ?',answer:'Chaque jour de court séjour, comptez ce jour et les 179 jours précédents. Cette fenêtre glissante de 180 jours ne peut contenir plus de 90 jours de présence.',source:'calculator'},
        {id:'reset',question:'Le quota est-il remis à zéro tous les six mois ou le 1er janvier ?',answer:'Non. Il n’existe aucune date fixe de remise à zéro. La fenêtre avance chaque jour et les anciens jours redeviennent disponibles un par un lorsqu’ils en sortent.',source:'calculator'},
        {id:'boundaries',question:'Les jours d’arrivée et de départ comptent-ils tous les deux ?',answer:'Oui. L’entrée est le premier jour et la sortie le dernier. Une arrivée tardive, un départ matinal ou un aller-retour le même jour utilise tout de même ce jour civil.',source:'calculator'},
        {id:'countries',question:'Passer dans un autre pays Schengen remet-il le compteur à zéro ?',answer:'Non. Les 29 pays Schengen partagent le même quota. Un trajet d’Italie en Autriche reste une présence continue tant que vous ne quittez pas réellement l’espace Schengen.',source:'schengenArea'},
        {id:'outside',question:'Combien de temps faut-il rester hors Schengen pour récupérer des jours ?',answer:'Les jours reviennent généralement un par un lorsque les anciens séjours sortent de la fenêtre. Une absence continue de 90 jours garantit que les 90 jours antérieurs ont entièrement expiré, mais une pause plus courte peut déjà rendre certains jours.',source:'calculator'}]},
      {id:'documents',title:'Documents, frontières et exceptions',items:[
        {id:'who',question:'À qui s’applique la règle ordinaire des 90/180 jours ?',answer:'Elle s’applique généralement aux ressortissants de pays tiers en court séjour, avec ou sans visa. La libre circulation, le statut de résident et certaines règles liées à la nationalité peuvent produire un autre résultat.',source:'travelDocuments'},
        {id:'visa',question:'Un visa Schengen accorde-t-il toujours 90 jours ?',answer:'Non. Quatre-vingt-dix jours est le maximum général. La vignette visa peut autoriser moins de jours, moins d’entrées ou une période de validité plus courte, et ces limites s’appliquent aussi.',source:'visa'},
        {id:'permit',question:'Et si je possède un titre de séjour ou un visa de long séjour ?',answer:'Les périodes autorisées par un titre de séjour Schengen ou un visa D ne sont pas saisies comme courts séjours ordinaires dans le calculateur de l’UE. Les voyages dans d’autres pays Schengen peuvent rester soumis à une limite distincte de 90/180 jours.',source:'calculator'},
        {id:'family',question:'Les membres de famille non-UE d’un citoyen de l’UE utilisent-ils toujours ce calcul ?',answer:'Pas toujours. La libre circulation européenne peut donner des droits différents aux membres de famille qui accompagnent ou rejoignent un citoyen de l’UE. Vérifiez les conditions officielles avant d’utiliser ce calcul.',source:'family'},
        {id:'area',question:'Tous les pays de l’UE ou d’Europe appartiennent-ils à Schengen ?',answer:'Non. L’espace Schengen compte actuellement 29 pays, dont la Bulgarie et la Roumanie depuis le 1er janvier 2025. Chypre et l’Irlande n’en font pas partie et appliquent d’autres règles.',source:'schengenArea'},
        {id:'transit',question:'Une correspondance à l’aéroport compte-t-elle comme un jour Schengen ?',answer:'Rester dans la zone internationale de transit sans entrer dans Schengen ne constitue pas un court séjour. Si vous franchissez le contrôle frontalier, ce jour civil compte.',source:'visa'},
        {id:'systems',question:'L’EES ou l’ETIAS modifient-ils le calcul 90/180 ?',answer:'Non. L’EES enregistre les entrées et sorties aux frontières extérieures ; l’ETIAS est une autorisation de voyage pour certains voyageurs sans visa. Aucun des deux n’augmente le quota.',source:'eesEtias'}]},
      {id:'problems',title:'Dépassements et cas complexes',items:[
        {id:'overstay',question:'Que peut-il se passer en cas de dépassement ?',answer:'Les conséquences dépendent des faits et de la procédure nationale. Elles peuvent inclure un refus d’entrée, une procédure de retour et parfois une interdiction d’entrée inscrite dans le système d’information Schengen.',source:'eesFaq'},
        {id:'bilateral',question:'Un accord bilatéral ou une règle nationale peut-il accorder plus de temps ?',answer:'Parfois, un accord ou une autorisation propre à un pays peut s’appliquer, mais cela n’ajoute pas simplement des jours au calcul Schengen commun. Confirmez le territoire, la sortie et les conditions auprès de l’autorité compétente.',source:'calculator'},
        {id:'authority',question:'Le résultat d’un calculateur lie-t-il les autorités frontalières ?',answer:'Non. Même le calculateur de la Commission européenne est un outil d’aide. Les autorités compétentes décident du séjour autorisé et peuvent examiner des éléments que SCHNGN ne modélise pas.',source:'calculator'}]},
      {id:'product',title:'Utiliser SCHNGN',items:[
        {id:'ongoing',question:'Puis-je ajouter un séjour actuel ou futur sans choisir de date de sortie ?',answer:'Oui. Sélectionnez « Je ne connais pas encore la date de sortie ». Pour un séjour actuel, SCHNGN compte jusqu’à aujourd’hui ; pour un séjour futur, il projette la dernière sortie sûre à partir de vos autres voyages. La sortie reste ouverte jusqu’à ce que vous saisissiez la date réelle.',productGuidance:true},
        {id:'records',question:'Comment SCHNGN traite-t-il les voyages qui se chevauchent ou sont anciens ?',answer:'Les dates qui se chevauchent ne comptent qu’une fois. Les voyages hors de la fenêtre actuelle restent dans l’historique, sont masqués derrière « Afficher les voyages hors des 180 jours » et n’affectent pas le résultat du jour.',productGuidance:true},
        {id:'privacy',question:'Où mes dates de voyage sont-elles enregistrées ?',answer:'En mode invité, elles restent dans ce navigateur. « S’inscrire et enregistrer » ou « Créer un compte et enregistrer » ouvre la création sécurisée du compte ; après sa création, SCHNGN enregistre automatiquement votre historique actuel dans votre compte. Les dates ne sont jamais envoyées aux outils d’analyse.',productGuidance:true}]}
    ]
  },
  de: {
    title:'Häufige Fragen',intro:'Klare Antworten auf Fragen, die eine Schengen-Berechnung besonders häufig verändern. Öffnen Sie nur, was Sie brauchen.',reviewedCopy:'Geprüft am 12. Juli 2026. Die Antworten beruhen auf Hinweisen der Europäischen Kommission und der EU. SCHNGN-Hinweise erklären die App und sind keine Rechtsberatung.',officialSource:'Offizielle Quelle',productGuidance:'So behandelt SCHNGN dies',sourceNames:sourceNames.de,
    groups:[
      {id:'rule',title:'So funktioniert die 90/180-Tage-Regel',items:[
        {id:'meaning',question:'Was bedeutet „90 Tage in jedem 180-Tage-Zeitraum“?',answer:'An jedem Tag eines Kurzaufenthalts werden dieser Tag und die 179 vorherigen Tage betrachtet. In diesem rollierenden 180-Tage-Fenster dürfen höchstens 90 Anwesenheitstage liegen.',source:'calculator'},
        {id:'reset',question:'Wird das Kontingent alle sechs Monate oder am 1. Januar zurückgesetzt?',answer:'Nein. Es gibt kein festes Rücksetzdatum. Das Fenster rückt täglich weiter; alte Anwesenheitstage werden einzeln wieder verfügbar, sobald sie herausfallen.',source:'calculator'},
        {id:'boundaries',question:'Zählen Einreise- und Ausreisetag beide?',answer:'Ja. Die Einreise ist der erste, die Ausreise der letzte Aufenthaltstag. Auch späte Ankunft, frühe Abreise oder Ein- und Ausreise am selben Datum verbrauchen diesen Kalendertag.',source:'calculator'},
        {id:'countries',question:'Setzt ein Wechsel in ein anderes Schengen-Land den Zähler zurück?',answer:'Nein. Die 29 Schengen-Länder teilen ein Kontingent. Italien und danach Österreich bleiben durchgehende Schengen-Anwesenheit, solange Sie den Schengen-Raum nicht verlassen.',source:'schengenArea'},
        {id:'outside',question:'Wie lange muss ich außerhalb Schengens bleiben, um Tage zurückzubekommen?',answer:'Tage kehren meist einzeln zurück, wenn alte Aufenthalte aus dem Fenster fallen. Eine ununterbrochene Abwesenheit von 90 Tagen lässt einen früheren 90-Tage-Aufenthalt vollständig altern; kürzere Pausen können bereits einzelne Tage freigeben.',source:'calculator'}]},
      {id:'documents',title:'Dokumente, Grenzen und Ausnahmen',items:[
        {id:'who',question:'Für wen gilt die gewöhnliche 90/180-Tage-Regel?',answer:'Sie gilt grundsätzlich für Nicht-EU-Staatsangehörige bei Kurzaufenthalten, visumfrei oder mit Kurzzeitvisum. Freizügigkeitsrechte, Aufenthaltsstatus und staatsangehörigkeitsspezifische Regeln können abweichen.',source:'travelDocuments'},
        {id:'visa',question:'Erlaubt ein Schengen-Visum immer 90 Tage?',answer:'Nein. 90 Tage sind nur das allgemeine Maximum. Der Visumaufkleber kann weniger Tage, Einreisen oder einen kürzeren Gültigkeitszeitraum erlauben; diese Grenzen gelten ebenfalls.',source:'visa'},
        {id:'permit',question:'Was gilt mit Aufenthaltstitel oder Langzeitvisum?',answer:'Zeiten mit Schengen-Aufenthaltstitel oder D-Visum werden im EU-Rechner nicht als gewöhnlicher Kurzaufenthalt eingegeben. Reisen in andere Schengen-Länder können dennoch einer eigenen 90/180-Grenze unterliegen.',source:'calculator'},
        {id:'family',question:'Nutzen Nicht-EU-Familienangehörige von EU-Bürgern immer diese Berechnung?',answer:'Nicht immer. EU-Freizügigkeitsregeln können qualifizierten Angehörigen beim Begleiten oder Nachziehen andere Rechte geben. Prüfen Sie die offiziellen Voraussetzungen, bevor Sie sich auf diese Berechnung stützen.',source:'family'},
        {id:'area',question:'Gehören alle EU- oder europäischen Länder zu Schengen?',answer:'Nein. Der Schengen-Raum umfasst derzeit 29 Länder, darunter Bulgarien und Rumänien seit 1. Januar 2025. Zypern und Irland gehören nicht zum grenzenlosen Schengen-Raum und haben andere Regeln.',source:'schengenArea'},
        {id:'transit',question:'Zählt eine Flughafenverbindung als Schengen-Tag?',answer:'Wer im internationalen Transitbereich bleibt und nicht einreist, absolviert keinen Kurzaufenthalt. Sobald Sie die Grenzkontrolle passieren und einreisen, zählt dieser Kalendertag.',source:'visa'},
        {id:'systems',question:'Ändern EES oder ETIAS die 90/180-Berechnung?',answer:'Nein. EES erfasst Ein- und Ausreisen an Außengrenzen; ETIAS ist eine Reisegenehmigung für berechtigte visumfreie Reisende. Keines der Systeme erhöht das Kontingent.',source:'eesEtias'}]},
      {id:'problems',title:'Überschreitungen und schwierige Fälle',items:[
        {id:'overstay',question:'Was kann bei einer Überschreitung passieren?',answer:'Die Folgen hängen vom Einzelfall und nationalen Verfahren ab. Möglich sind Einreiseverweigerung, Rückkehrverfahren und in bestimmten Fällen ein im Schengener Informationssystem gespeichertes Einreiseverbot.',source:'eesFaq'},
        {id:'bilateral',question:'Kann ein bilaterales Abkommen oder nationales Recht zusätzliche Zeit geben?',answer:'Mitunter gilt eine länderspezifische Vereinbarung oder Erlaubnis. Sie addiert aber nicht einfach Tage zum gemeinsamen Schengen-Konto. Klären Sie Gebiet, Ausreiseweg und Bedingungen mit der zuständigen Behörde.',source:'calculator'},
        {id:'authority',question:'Ist ein Rechnerergebnis für Grenzbehörden verbindlich?',answer:'Nein. Auch der Rechner der Europäischen Kommission ist nur ein Hilfsmittel. Die zuständigen Behörden entscheiden und können Visa, Dokumente, Aufenthaltsrechte und weitere von SCHNGN nicht modellierte Umstände berücksichtigen.',source:'calculator'}]},
      {id:'product',title:'SCHNGN verwenden',items:[
        {id:'ongoing',question:'Kann ich einen aktuellen oder künftigen Aufenthalt ohne Ausreisedatum hinzufügen?',answer:'Ja. Wählen Sie „Ich kenne das Ausreisedatum noch nicht“. Bei einem aktuellen Aufenthalt zählt SCHNGN bis heute; bei einem künftigen Aufenthalt wird die späteste sichere Ausreise aus Ihren anderen Reisen berechnet. Die Ausreise bleibt offen, bis Sie das tatsächliche Datum eingeben.',productGuidance:true},
        {id:'records',question:'Wie behandelt SCHNGN überlappende oder alte Reisen?',answer:'Überlappende Daten zählen einmal. Reisen außerhalb des heutigen Fensters bleiben in der Historie, sind hinter „Reisen außerhalb der 180 Tage anzeigen“ verborgen und beeinflussen das heutige Ergebnis nicht.',productGuidance:true},
        {id:'privacy',question:'Wo werden meine Reisedaten gespeichert?',answer:'Gast-Reisen bleiben in diesem Browser. „Registrieren und speichern“ oder „Konto erstellen und Reisen speichern“ öffnet die sichere Kontoerstellung; danach speichert SCHNGN den aktuellen Reiseverlauf automatisch in Ihrem Konto. Reisedaten gelangen nie in die Analyse.',productGuidance:true}]}
    ]
  },
  es: {
    title:'Preguntas frecuentes',intro:'Respuestas claras a las dudas que más suelen cambiar un cálculo Schengen. Abre solo lo que necesites.',reviewedCopy:'Revisado el 12 de julio de 2026. Las respuestas se basan en la orientación de la Comisión Europea y la UE. La orientación de SCHNGN explica la aplicación y no es asesoramiento jurídico.',officialSource:'Fuente oficial',productGuidance:'Cómo lo gestiona SCHNGN',sourceNames:sourceNames.es,
    groups:[
      {id:'rule',title:'Cómo funciona la regla de 90/180 días',items:[
        {id:'meaning',question:'¿Qué significa «90 días en cualquier período de 180 días»?',answer:'En cada día de una estancia corta se cuentan ese día y los 179 anteriores. No puede haber más de 90 días de presencia dentro de esa ventana móvil de 180 días.',source:'calculator'},
        {id:'reset',question:'¿El cupo se reinicia cada seis meses o el 1 de enero?',answer:'No. No existe una fecha fija de reinicio. La ventana avanza día a día y los días antiguos se recuperan individualmente al salir del período retrospectivo.',source:'calculator'},
        {id:'boundaries',question:'¿Cuentan tanto el día de entrada como el de salida?',answer:'Sí. La entrada es el primer día y la salida el último. Llegar tarde, salir temprano o entrar y salir en la misma fecha sigue consumiendo ese día natural.',source:'calculator'},
        {id:'countries',question:'¿Ir a otro país Schengen reinicia el contador?',answer:'No. Los 29 países Schengen comparten un solo cupo. Viajar de Italia a Austria, por ejemplo, sigue siendo presencia continua mientras no salgas realmente del espacio Schengen.',source:'schengenArea'},
        {id:'outside',question:'¿Cuánto tiempo debo estar fuera de Schengen para recuperar días?',answer:'Los días suelen volver uno a uno cuando las estancias antiguas salen de la ventana. Una ausencia continua de 90 días hace que una estancia previa de 90 días caduque por completo, aunque pausas más cortas pueden devolver algunos días.',source:'calculator'}]},
      {id:'documents',title:'Documentos, fronteras y excepciones',items:[
        {id:'who',question:'¿A quién se aplica la regla ordinaria de 90/180 días?',answer:'Generalmente a nacionales de fuera de la UE en estancias cortas, sin visado o con visado de corta duración. La libre circulación, la residencia y reglas ligadas a la nacionalidad pueden cambiar el resultado.',source:'travelDocuments'},
        {id:'visa',question:'¿Un visado Schengen siempre concede 90 días?',answer:'No. Noventa días es el máximo general. La etiqueta del visado puede autorizar menos días, menos entradas o una validez más estrecha, y esos límites también se aplican.',source:'visa'},
        {id:'permit',question:'¿Qué ocurre con un permiso de residencia o visado de larga duración?',answer:'El tiempo autorizado por un permiso Schengen o visado D no se introduce como estancia corta ordinaria en la calculadora de la UE. Los viajes a otros países Schengen aún pueden tener un límite 90/180 separado.',source:'calculator'},
        {id:'family',question:'¿Los familiares no comunitarios de ciudadanos de la UE siempre usan este cálculo?',answer:'No siempre. La libre circulación de la UE puede otorgar derechos distintos cuando acompañan o se reúnen con un ciudadano de la UE. Comprueba las condiciones oficiales antes de usar este cálculo.',source:'family'},
        {id:'area',question:'¿Todos los países de la UE o de Europa pertenecen a Schengen?',answer:'No. Schengen tiene actualmente 29 países, incluidos Bulgaria y Rumanía desde el 1 de enero de 2025. Chipre e Irlanda no forman parte del espacio sin fronteras y aplican reglas distintas.',source:'schengenArea'},
        {id:'transit',question:'¿Una conexión aérea cuenta como día Schengen?',answer:'Permanecer en la zona internacional de tránsito sin entrar en Schengen no es una estancia corta. Si cruzas el control fronterizo y entras, ese día natural cuenta.',source:'visa'},
        {id:'systems',question:'¿EES o ETIAS cambian el cálculo 90/180?',answer:'No. EES registra entradas y salidas en fronteras exteriores; ETIAS es una autorización para determinados viajeros sin visado. Ninguno aumenta el cupo.',source:'eesEtias'}]},
      {id:'problems',title:'Excesos y casos difíciles',items:[
        {id:'overstay',question:'¿Qué puede ocurrir si excedo el plazo?',answer:'Las consecuencias dependen de los hechos y del procedimiento nacional. Pueden incluir denegación de entrada, procedimientos de retorno y, en algunos casos, una prohibición registrada en el Sistema de Información de Schengen.',source:'eesFaq'},
        {id:'bilateral',question:'¿Puede un acuerdo bilateral o una norma nacional conceder tiempo adicional?',answer:'A veces puede aplicarse un acuerdo o permiso de un país, pero no añade días sin más al cálculo Schengen compartido. Confirma territorio, ruta de salida y condiciones con la autoridad competente.',source:'calculator'},
        {id:'authority',question:'¿El resultado de una calculadora obliga a las autoridades fronterizas?',answer:'No. Incluso la calculadora de la Comisión Europea es solo una ayuda. Las autoridades deciden la estancia autorizada y pueden valorar visados, documentos, residencia y otros hechos que SCHNGN no modela.',source:'calculator'}]},
      {id:'product',title:'Usar SCHNGN',items:[
        {id:'ongoing',question:'¿Puedo añadir una estancia actual o futura sin elegir fecha de salida?',answer:'Sí. Selecciona «Todavía no sé la fecha de salida». Para una estancia actual, SCHNGN cuenta hasta hoy; para una futura, proyecta la última salida segura a partir de tus otros viajes. La salida queda abierta hasta que introduzcas la fecha real.',productGuidance:true},
        {id:'records',question:'¿Cómo trata SCHNGN los viajes solapados o antiguos?',answer:'Las fechas solapadas cuentan una vez. Los viajes fuera de la ventana actual permanecen en el historial, se ocultan tras «Mostrar viajes fuera de 180» y no afectan al resultado de hoy.',productGuidance:true},
        {id:'privacy',question:'¿Dónde se guardan las fechas de mis viajes?',answer:'Los viajes como invitado permanecen en este navegador. «Registrarse y guardar» o «Crear cuenta y guardar viajes» abre la creación segura de una cuenta; después, SCHNGN guarda automáticamente tu historial actual en tu cuenta. Las fechas nunca se envían a analítica.',productGuidance:true}]}
    ]
  },
  it: {
    title:'Domande frequenti',intro:'Risposte chiare alle domande che più spesso cambiano un calcolo Schengen. Apri solo ciò che ti serve.',reviewedCopy:'Revisionato il 12 luglio 2026. Le risposte si basano sulle indicazioni della Commissione europea e dell’UE. Le indicazioni SCHNGN spiegano l’app e non sono consulenza legale.',officialSource:'Fonte ufficiale',productGuidance:'Come lo gestisce SCHNGN',sourceNames:sourceNames.it,
    groups:[
      {id:'rule',title:'Come funziona la regola 90/180 giorni',items:[
        {id:'meaning',question:'Cosa significa «90 giorni in qualsiasi periodo di 180 giorni»?',answer:'In ogni giorno di un soggiorno breve si considerano quel giorno e i 179 precedenti. Nella finestra mobile di 180 giorni non possono cadere più di 90 giorni di presenza.',source:'calculator'},
        {id:'reset',question:'Il limite si azzera ogni sei mesi o il 1° gennaio?',answer:'No. Non esiste una data fissa di azzeramento. La finestra avanza ogni giorno e i vecchi giorni tornano disponibili singolarmente quando ne escono.',source:'calculator'},
        {id:'boundaries',question:'Contano sia il giorno di ingresso sia quello di uscita?',answer:'Sì. L’ingresso è il primo giorno e l’uscita l’ultimo. Arrivare tardi, partire presto o entrare e uscire nello stesso giorno usa comunque quel giorno di calendario.',source:'calculator'},
        {id:'countries',question:'Spostarsi in un altro paese Schengen azzera il conteggio?',answer:'No. I 29 paesi Schengen condividono un unico limite. Dall’Italia all’Austria, per esempio, la presenza resta continua finché non si esce davvero dallo spazio Schengen.',source:'schengenArea'},
        {id:'outside',question:'Quanto devo restare fuori da Schengen per recuperare giorni?',answer:'Di solito i giorni tornano uno alla volta quando i soggiorni vecchi escono dalla finestra. Un’assenza continua di 90 giorni fa scadere interamente un precedente soggiorno di 90 giorni, ma pause più brevi possono restituire alcuni giorni.',source:'calculator'}]},
      {id:'documents',title:'Documenti, frontiere ed eccezioni',items:[
        {id:'who',question:'A chi si applica la regola ordinaria 90/180?',answer:'In genere ai cittadini non UE per soggiorni brevi, senza visto o con visto di breve durata. Libera circolazione, residenza e regole legate alla nazionalità possono dare un risultato diverso.',source:'travelDocuments'},
        {id:'visa',question:'Un visto Schengen concede sempre 90 giorni?',answer:'No. Novanta giorni è il massimo generale. Il visto può autorizzare meno giorni, meno ingressi o una validità più breve, e anche questi limiti devono essere rispettati.',source:'visa'},
        {id:'permit',question:'E con un permesso di soggiorno o un visto di lunga durata?',answer:'Il tempo autorizzato da un permesso Schengen o visto D non va inserito come soggiorno breve ordinario nel calcolatore UE. I viaggi in altri paesi Schengen possono comunque avere un limite 90/180 separato.',source:'calculator'},
        {id:'family',question:'I familiari non UE di cittadini UE usano sempre questo calcolo?',answer:'Non sempre. La libera circolazione UE può attribuire diritti diversi ai familiari che accompagnano o raggiungono un cittadino UE. Verifica le condizioni ufficiali prima di usare questo calcolo.',source:'family'},
        {id:'area',question:'Tutti i paesi UE o europei fanno parte di Schengen?',answer:'No. Schengen comprende oggi 29 paesi, inclusi Bulgaria e Romania dal 1° gennaio 2025. Cipro e Irlanda non fanno parte dell’area senza frontiere e applicano regole diverse.',source:'schengenArea'},
        {id:'transit',question:'Uno scalo aeroportuale conta come giorno Schengen?',answer:'Restare nell’area internazionale di transito senza entrare in Schengen non è un soggiorno breve. Se superi il controllo di frontiera ed entri, quel giorno conta.',source:'visa'},
        {id:'systems',question:'EES o ETIAS cambiano il calcolo 90/180?',answer:'No. EES registra ingressi e uscite alle frontiere esterne; ETIAS è un’autorizzazione per viaggiatori esenti da visto idonei. Nessuno dei due aumenta il limite.',source:'eesEtias'}]},
      {id:'problems',title:'Sforamenti e casi difficili',items:[
        {id:'overstay',question:'Cosa può succedere se supero il limite?',answer:'Le conseguenze dipendono dai fatti e dalla procedura nazionale. Possono includere rifiuto d’ingresso, procedure di rimpatrio e, in alcuni casi, un divieto registrato nel Sistema d’informazione Schengen.',source:'eesFaq'},
        {id:'bilateral',question:'Un accordo bilaterale o una regola nazionale può dare più tempo?',answer:'Talvolta può valere un accordo o permesso specifico di un paese, ma non aggiunge semplicemente giorni al calcolo Schengen comune. Conferma territorio, uscita e condizioni con l’autorità competente.',source:'calculator'},
        {id:'authority',question:'Il risultato di un calcolatore vincola le autorità di frontiera?',answer:'No. Anche il calcolatore della Commissione europea è solo uno strumento di supporto. Le autorità decidono e possono valutare visti, documenti, diritti di soggiorno e fatti non modellati da SCHNGN.',source:'calculator'}]},
      {id:'product',title:'Usare SCHNGN',items:[
        {id:'ongoing',question:'Posso aggiungere un soggiorno attuale o futuro senza scegliere la data di uscita?',answer:'Sì. Seleziona «Non conosco ancora la data di uscita». Per un soggiorno attuale, SCHNGN conta fino a oggi; per uno futuro, proietta l’ultima uscita sicura in base agli altri viaggi. L’uscita resta aperta finché non inserisci la data reale.',productGuidance:true},
        {id:'records',question:'Come tratta SCHNGN i viaggi sovrapposti o vecchi?',answer:'Le date sovrapposte contano una volta. I viaggi fuori dalla finestra odierna restano nella cronologia, sono nascosti dietro «Mostra viaggi fuori dai 180 giorni» e non influenzano il risultato odierno.',productGuidance:true},
        {id:'privacy',question:'Dove vengono salvate le date dei miei viaggi?',answer:'I viaggi ospite restano in questo browser. «Registrati e salva» o «Crea account e salva i viaggi» apre la creazione sicura dell’account; dopo, SCHNGN salva automaticamente la cronologia attuale nel tuo account. Le date non vengono mai inviate agli strumenti di analisi.',productGuidance:true}]}
    ]
  },
  ru: {
    title:'Частые вопросы',intro:'Понятные ответы на вопросы, которые чаще всего меняют расчёт Шенгена. Открывайте только нужное.',reviewedCopy:'Проверено 12 июля 2026 года. Ответы основаны на материалах Еврокомиссии и ЕС. Пояснения SCHNGN описывают работу приложения и не являются юридической консультацией.',officialSource:'Официальный источник',productGuidance:'Как это обрабатывает SCHNGN',sourceNames:sourceNames.ru,
    groups:[
      {id:'rule',title:'Как работает правило 90/180 дней',items:[
        {id:'meaning',question:'Что значит «90 дней в любом 180-дневном периоде»?',answer:'В каждый день краткосрочного пребывания учитываются этот день и предыдущие 179 дней. В таком скользящем окне не должно быть более 90 дней присутствия.',source:'calculator'},
        {id:'reset',question:'Лимит обнуляется каждые полгода или 1 января?',answer:'Нет. Фиксированной даты обнуления нет. Окно сдвигается ежедневно, и старые дни возвращаются по одному, когда выходят за его пределы.',source:'calculator'},
        {id:'boundaries',question:'Считаются и день въезда, и день выезда?',answer:'Да. Въезд — первый день пребывания, выезд — последний. Поздний въезд, ранний выезд или поездка в один день всё равно используют этот календарный день.',source:'calculator'},
        {id:'countries',question:'Переезд в другую страну Шенгена обнуляет счётчик?',answer:'Нет. Все 29 стран Шенгена используют общий лимит. Например, поездка из Италии в Австрию остаётся непрерывным присутствием, пока вы фактически не покинете Шенгенскую зону.',source:'schengenArea'},
        {id:'outside',question:'Сколько нужно быть вне Шенгена, чтобы дни вернулись?',answer:'Обычно дни возвращаются по одному, когда старые поездки выходят из окна. Непрерывное отсутствие 90 дней полностью выводит прежнее 90-дневное пребывание из расчёта, но и более короткий перерыв может вернуть часть дней.',source:'calculator'}]},
      {id:'documents',title:'Документы, границы и исключения',items:[
        {id:'who',question:'Для кого действует обычное правило 90/180?',answer:'Как правило, для граждан стран вне ЕС при краткосрочных поездках — безвизовых или по краткосрочной визе. Свобода передвижения, вид на жительство и правила для отдельных гражданств могут менять результат.',source:'travelDocuments'},
        {id:'visa',question:'Шенгенская виза всегда даёт 90 дней?',answer:'Нет. 90 дней — общий максимум. Виза может разрешать меньше дней, въездов или более узкий срок действия; эти ограничения тоже обязательны.',source:'visa'},
        {id:'permit',question:'Что делать с видом на жительство или долгосрочной визой?',answer:'Периоды по шенгенскому ВНЖ или визе D не вводятся в калькулятор ЕС как обычные краткосрочные поездки. Для поездок в другие страны Шенгена может действовать отдельный лимит 90/180.',source:'calculator'},
        {id:'family',question:'Члены семьи граждан ЕС из третьих стран всегда используют этот расчёт?',answer:'Не всегда. Правила свободы передвижения ЕС могут давать иные права членам семьи, сопровождающим гражданина ЕС или присоединяющимся к нему. Сначала проверьте официальные условия.',source:'family'},
        {id:'area',question:'Все страны ЕС и Европы входят в Шенген?',answer:'Нет. Сейчас в Шенгене 29 стран, включая Болгарию и Румынию с 1 января 2025 года. Кипр и Ирландия не входят в безграничную Шенгенскую зону и применяют другие правила.',source:'schengenArea'},
        {id:'transit',question:'Считается ли пересадка в аэропорту шенгенским днём?',answer:'Пребывание в международной транзитной зоне без въезда в Шенген не является краткосрочным пребыванием. Если вы проходите пограничный контроль и въезжаете, этот день считается.',source:'visa'},
        {id:'systems',question:'Меняют ли EES или ETIAS расчёт 90/180?',answer:'Нет. EES фиксирует въезды и выезды через внешние границы, а ETIAS является разрешением на поездку для соответствующих безвизовых путешественников. Они не увеличивают лимит.',source:'eesEtias'}]},
      {id:'problems',title:'Превышения и сложные случаи',items:[
        {id:'overstay',question:'Что может произойти при превышении срока?',answer:'Последствия зависят от обстоятельств и национальной процедуры. Возможны отказ во въезде, процедура возвращения и в отдельных случаях запрет на въезд, внесённый в Шенгенскую информационную систему.',source:'eesFaq'},
        {id:'bilateral',question:'Может ли двустороннее соглашение или национальное правило дать дополнительное время?',answer:'Иногда действует соглашение или разрешение конкретной страны, но оно не просто добавляет дни к общему шенгенскому расчёту. Уточните территорию, маршрут выезда и условия у компетентного органа.',source:'calculator'},
        {id:'authority',question:'Обязателен ли результат калькулятора для пограничных органов?',answer:'Нет. Даже калькулятор Еврокомиссии — лишь вспомогательный инструмент. Компетентные органы принимают решение и могут учитывать визы, документы, права проживания и обстоятельства, которые SCHNGN не моделирует.',source:'calculator'}]},
      {id:'product',title:'Использование SCHNGN',items:[
        {id:'ongoing',question:'Можно добавить текущую или будущую поездку без даты выезда?',answer:'Да. Выберите «Я пока не знаю дату выезда». Для текущей поездки SCHNGN считает дни до сегодня, а для будущей рассчитывает последнюю безопасную дату выезда с учётом других поездок. Выезд остаётся открытым, пока вы не укажете фактическую дату.',productGuidance:true},
        {id:'records',question:'Как SCHNGN обрабатывает пересекающиеся или старые поездки?',answer:'Пересекающиеся даты считаются один раз. Поездки вне текущего окна остаются в истории, скрыты под «Показать поездки вне 180 дней» и не влияют на сегодняшний результат.',productGuidance:true},
        {id:'privacy',question:'Где хранятся даты моих поездок?',answer:'Гостевые поездки остаются в этом браузере. Кнопки «Регистрация и сохранение» и «Создать аккаунт и сохранить поездки» открывают защищённое создание аккаунта; после этого SCHNGN автоматически сохраняет текущую историю в вашем аккаунте. Даты поездок никогда не передаются в аналитику.',productGuidance:true}]}
    ]
  },
  tr: {
    title:'Sık sorulan sorular',intro:'Schengen hesabını en sık değiştiren sorulara sade yanıtlar. Yalnızca ihtiyacınız olanı açın.',reviewedCopy:'12 Temmuz 2026’da gözden geçirildi. Yanıtlar Avrupa Komisyonu ve AB yönlendirmelerine dayanır. SCHNGN açıklamaları uygulamayı anlatır; hukuki tavsiye değildir.',officialSource:'Resmî kaynak',productGuidance:'SCHNGN bunu nasıl işler',sourceNames:sourceNames.tr,
    groups:[
      {id:'rule',title:'90/180 gün kuralı nasıl çalışır?',items:[
        {id:'meaning',question:'“Herhangi bir 180 günde 90 gün” ne demektir?',answer:'Kısa kalışın her gününde o gün ve önceki 179 gün incelenir. Bu kayan 180 günlük pencere içinde en fazla 90 bulunma günü olabilir.',source:'calculator'},
        {id:'reset',question:'Hak altı ayda bir veya 1 Ocak’ta sıfırlanır mı?',answer:'Hayır. Sabit bir sıfırlama tarihi yoktur. Pencere her gün ilerler; eski bulunma günleri geriye bakış döneminden çıktıkça tek tek geri gelir.',source:'calculator'},
        {id:'boundaries',question:'Giriş ve çıkış günlerinin ikisi de sayılır mı?',answer:'Evet. Giriş ilk, çıkış son kalış günüdür. Geç gelmek, erken ayrılmak veya aynı gün girip çıkmak yine o takvim gününü kullanır.',source:'calculator'},
        {id:'countries',question:'Başka bir Schengen ülkesine geçmek sayacı sıfırlar mı?',answer:'Hayır. 29 Schengen ülkesi tek hakkı paylaşır. Örneğin İtalya’dan Avusturya’ya gitmek, Schengen Bölgesi’nden gerçekten çıkmadıkça kesintisiz bulunmadır.',source:'schengenArea'},
        {id:'outside',question:'Günleri geri kazanmak için Schengen dışında ne kadar kalmalıyım?',answer:'Günler genellikle eski kalışlar pencereden çıktıkça tek tek geri gelir. Kesintisiz 90 günlük yokluk önceki 90 günlük kalışı tamamen düşürür; daha kısa aralar da bazı günleri geri getirebilir.',source:'calculator'}]},
      {id:'documents',title:'Belgeler, sınırlar ve istisnalar',items:[
        {id:'who',question:'Olağan 90/180 kuralı kimlere uygulanır?',answer:'Genellikle AB dışı vatandaşların vizesiz veya kısa süreli vizeyle yaptığı kısa kalışlara uygulanır. Serbest dolaşım hakları, ikamet statüsü ve vatandaşlığa özgü kurallar sonucu değiştirebilir.',source:'travelDocuments'},
        {id:'visa',question:'Schengen vizesi her zaman 90 gün verir mi?',answer:'Hayır. 90 gün genel üst sınırdır. Vize etiketi daha az gün, daha az giriş veya daha dar bir geçerlilik süresi verebilir; bunlara da uyulmalıdır.',source:'visa'},
        {id:'permit',question:'Oturma iznim veya uzun süreli vizem varsa ne olur?',answer:'Schengen oturma izni veya D tipi vizenin izin verdiği süre, AB hesaplayıcısına olağan kısa kalış olarak girilmez. Diğer Schengen ülkelerine seyahat yine ayrı bir 90/180 sınırına tabi olabilir.',source:'calculator'},
        {id:'family',question:'AB vatandaşlarının AB dışı aile üyeleri her zaman bu hesabı mı kullanır?',answer:'Her zaman değil. AB serbest dolaşım kuralları, bir AB vatandaşına eşlik eden veya katılan uygun aile üyelerine farklı haklar verebilir. Bu hesabı kullanmadan önce resmî koşulları kontrol edin.',source:'family'},
        {id:'area',question:'Her AB veya Avrupa ülkesi Schengen’de mi?',answer:'Hayır. Schengen şu anda 29 ülkeden oluşur; Bulgaristan ve Romanya 1 Ocak 2025’ten beri dahildir. Kıbrıs ve İrlanda sınırsız Schengen alanında değildir ve farklı kurallar uygular.',source:'schengenArea'},
        {id:'transit',question:'Havaalanı aktarması Schengen günü sayılır mı?',answer:'Schengen’e girmeden uluslararası transit alanda kalmak kısa kalış değildir. Sınır kontrolünden geçip Schengen’e girerseniz o takvim günü sayılır.',source:'visa'},
        {id:'systems',question:'EES veya ETIAS 90/180 hesabını değiştirir mi?',answer:'Hayır. EES dış sınır giriş ve çıkışlarını kaydeder; ETIAS uygun vizesiz yolcular için seyahat iznidir. Hiçbiri hakkı artırmaz.',source:'eesEtias'}]},
      {id:'problems',title:'Süre aşımı ve zor durumlar',items:[
        {id:'overstay',question:'Süreyi aşarsam ne olabilir?',answer:'Sonuçlar olaylara ve ulusal usule bağlıdır. Giriş reddi, geri dönüş işlemleri ve bazı durumlarda Schengen Bilgi Sistemi’ne kaydedilen giriş yasağı olabilir.',source:'eesFaq'},
        {id:'bilateral',question:'İkili anlaşma veya ulusal kural ek süre verebilir mi?',answer:'Bazen ülkeye özgü bir anlaşma veya izin uygulanabilir; ancak ortak Schengen hesabına doğrudan gün eklemez. Bölgeyi, çıkış yolunu ve koşulları yetkili makamla doğrulayın.',source:'calculator'},
        {id:'authority',question:'Hesaplayıcı sonucu sınır makamlarını bağlar mı?',answer:'Hayır. Avrupa Komisyonu hesaplayıcısı bile yalnızca yardımcı araçtır. Yetkili makamlar vizeyi, belgeleri, ikamet haklarını ve SCHNGN’nin modellemediği diğer olguları değerlendirerek karar verir.',source:'calculator'}]},
      {id:'product',title:'SCHNGN kullanımı',items:[
        {id:'ongoing',question:'Çıkış tarihi seçmeden mevcut veya gelecekteki bir kalış ekleyebilir miyim?',answer:'Evet. “Çıkış tarihini henüz bilmiyorum” seçeneğini seçin. SCHNGN mevcut kalışta bugüne kadar sayar; gelecekteki kalışta diğer seyahatlerinize göre en geç güvenli çıkışı öngörür. Gerçek tarihi girene kadar çıkış açık kalır.',productGuidance:true},
        {id:'records',question:'SCHNGN çakışan veya eski seyahatleri nasıl işler?',answer:'Çakışan tarihler bir kez sayılır. Bugünkü pencerenin dışındaki seyahatler geçmişinizde kalır, “180 gün dışındaki seyahatleri göster” arkasında gizlenir ve bugünkü sonucu etkilemez.',productGuidance:true},
        {id:'privacy',question:'Seyahat tarihlerim nerede saklanır?',answer:'Misafir seyahatleri bu tarayıcıda kalır. “Kaydol ve kaydet” veya “Hesap oluştur ve seyahatleri kaydet” güvenli hesap oluşturma ekranını açar; ardından SCHNGN mevcut geçmişinizi hesabınıza otomatik kaydeder. Tarihler analitiğe hiçbir zaman gönderilmez.',productGuidance:true}]}
    ]
  },
  he: {
    title:'שאלות נפוצות',intro:'תשובות ברורות לשאלות שמשנות לרוב את חישוב שנגן. פתחו רק את מה שנחוץ לכם.',reviewedCopy:'נבדק ב-12 ביולי 2026. התשובות מבוססות על הנחיות הנציבות האירופית והאיחוד. הנחיות SCHNGN מסבירות את היישום ואינן ייעוץ משפטי.',officialSource:'מקור רשמי',productGuidance:'כיצד SCHNGN מטפל בכך',sourceNames:sourceNames.he,
    groups:[
      {id:'rule',title:'כיצד פועל כלל 90/180 הימים',items:[
        {id:'meaning',question:'מה פירוש „90 ימים בכל תקופה של 180 ימים” ?',answer:'בכל יום של שהייה קצרה בוחנים את אותו יום ואת 179 הימים שלפניו. בחלון הנע של 180 ימים יכולים להיות לכל היותר 90 ימי נוכחות.',source:'calculator'},
        {id:'reset',question:'האם המכסה מתאפסת כל חצי שנה או ב-1 בינואר?',answer:'לא. אין תאריך איפוס קבוע. החלון מתקדם יום אחר יום, וימי שהייה ישנים חוזרים בנפרד כשהם יוצאים מתקופת המבט לאחור.',source:'calculator'},
        {id:'boundaries',question:'האם גם יום הכניסה וגם יום היציאה נספרים?',answer:'כן. הכניסה היא יום השהייה הראשון והיציאה היא האחרון. גם הגעה מאוחרת, יציאה מוקדמת או כניסה ויציאה באותו תאריך משתמשות באותו יום קלנדרי.',source:'calculator'},
        {id:'countries',question:'האם מעבר למדינת שנגן אחרת מאפס את הספירה?',answer:'לא. 29 מדינות שנגן חולקות מכסה אחת. מעבר מאיטליה לאוסטריה, למשל, הוא נוכחות רצופה כל עוד לא יצאתם בפועל מאזור שנגן.',source:'schengenArea'},
        {id:'outside',question:'כמה זמן צריך לשהות מחוץ לשנגן כדי לקבל ימים בחזרה?',answer:'ימים חוזרים בדרך כלל אחד-אחד כשהשהיות הישנות יוצאות מהחלון. היעדרות רצופה של 90 ימים מוציאה לחלוטין שהייה קודמת של 90 ימים, אך גם הפסקה קצרה יותר יכולה להחזיר חלק מהימים.',source:'calculator'}]},
      {id:'documents',title:'מסמכים, גבולות וחריגים',items:[
        {id:'who',question:'על מי חל כלל 90/180 הימים הרגיל?',answer:'בדרך כלל על אזרחי מדינות שאינן באיחוד בשהיות קצרות, ללא אשרה או באשרת שהייה קצרה. חופש תנועה, מעמד תושבות וכללים לפי אזרחות עשויים לשנות את התוצאה.',source:'travelDocuments'},
        {id:'visa',question:'האם אשרת שנגן תמיד מעניקה 90 ימים?',answer:'לא. 90 ימים הם המקסימום הכללי. מדבקת האשרה יכולה לאשר פחות ימים, פחות כניסות או תקופת תוקף צרה יותר, וגם מגבלות אלה מחייבות.',source:'visa'},
        {id:'permit',question:'מה לגבי היתר שהייה או אשרה לטווח ארוך?',answer:'זמן המאושר בהיתר שהייה של שנגן או באשרת D אינו מוזן למחשבון האיחוד כשהייה קצרה רגילה. נסיעות למדינות שנגן אחרות עשויות עדיין להיות כפופות למגבלת 90/180 נפרדת.',source:'calculator'},
        {id:'family',question:'האם בני משפחה שאינם אזרחי האיחוד תמיד משתמשים בחישוב הזה?',answer:'לא תמיד. כללי חופש התנועה באיחוד יכולים להעניק זכויות שונות לבני משפחה המלווים אזרח האיחוד או מצטרפים אליו. בדקו את התנאים הרשמיים לפני הסתמכות על החישוב.',source:'family'},
        {id:'area',question:'האם כל מדינה באיחוד או באירופה שייכת לשנגן?',answer:'לא. אזור שנגן כולל כיום 29 מדינות, ובהן בולגריה ורומניה מאז 1 בינואר 2025. קפריסין ואירלנד אינן באזור שנגן ללא הגבולות ומחילות כללים אחרים.',source:'schengenArea'},
        {id:'transit',question:'האם קונקשן בשדה תעופה נספר כיום שנגן?',answer:'שהייה באזור המעבר הבינלאומי בלי להיכנס לשנגן אינה שהייה קצרה. אם עוברים ביקורת גבולות ונכנסים לשנגן, אותו יום קלנדרי נספר.',source:'visa'},
        {id:'systems',question:'האם EES או ETIAS משנים את חישוב 90/180?',answer:'לא. EES מתעד כניסות ויציאות בגבולות החיצוניים; ETIAS הוא אישור נסיעה לנוסעים פטורי אשרה הזכאים לכך. אף אחד מהם אינו מגדיל את המכסה.',source:'eesEtias'}]},
      {id:'problems',title:'חריגות ומקרים מורכבים',items:[
        {id:'overstay',question:'מה עלול לקרות אם חורגים מהזמן?',answer:'התוצאות תלויות בנסיבות ובהליך הלאומי. הן עשויות לכלול סירוב כניסה, הליכי החזרה ובמקרים מסוימים איסור כניסה הרשום במערכת המידע של שנגן.',source:'eesFaq'},
        {id:'bilateral',question:'האם הסכם דו-צדדי או כלל לאומי יכולים לתת זמן נוסף?',answer:'לעיתים חל הסכם או היתר של מדינה מסוימת, אך הוא אינו פשוט מוסיף ימים לחישוב שנגן המשותף. אשרו את השטח, נתיב היציאה והתנאים מול הרשות המוסמכת.',source:'calculator'},
        {id:'authority',question:'האם תוצאת מחשבון מחייבת את רשויות הגבול?',answer:'לא. גם מחשבון הנציבות האירופית הוא כלי עזר בלבד. הרשויות המוסמכות מחליטות ויכולות לשקול אשרות, מסמכים, זכויות שהייה ונסיבות ש-SCHNGN אינו מדמה.',source:'calculator'}]},
      {id:'product',title:'שימוש ב-SCHNGN',items:[
        {id:'ongoing',question:'אפשר להוסיף שהייה נוכחית או עתידית בלי לבחור תאריך יציאה?',answer:'כן. בחרו „עדיין לא ידוע לי תאריך היציאה”. בשהייה נוכחית SCHNGN סופר עד היום; בשהייה עתידית הוא חוזה את תאריך היציאה הבטוח האחרון לפי הנסיעות האחרות. היציאה נשארת פתוחה עד להזנת התאריך בפועל.',productGuidance:true},
        {id:'records',question:'כיצד SCHNGN מטפל בנסיעות חופפות או ישנות?',answer:'תאריכים חופפים נספרים פעם אחת. נסיעות מחוץ לחלון של היום נשארות בהיסטוריה, מוסתרות מאחורי „הצגת נסיעות מחוץ ל-180 ימים” ואינן משפיעות על התוצאה של היום.',productGuidance:true},
        {id:'privacy',question:'היכן נשמרים תאריכי הנסיעות שלי?',answer:'נסיעות אורח נשארות בדפדפן הזה. „הרשמה ושמירה” או „יצירת חשבון ושמירת נסיעות” פותח תהליך מאובטח ליצירת חשבון; לאחר מכן SCHNGN שומר אוטומטית את ההיסטוריה הנוכחית בחשבון. התאריכים לעולם אינם נשלחים לניתוח נתונים.',productGuidance:true}]}
    ]
  },
  ar: {
    title:'الأسئلة الشائعة',intro:'إجابات واضحة عن الأسئلة التي تغيّر حساب شنغن غالبًا. افتح ما تحتاج إليه فقط.',reviewedCopy:'تمت المراجعة في 12 يوليو 2026. تستند الإجابات إلى إرشادات المفوضية الأوروبية والاتحاد الأوروبي. تشرح إرشادات SCHNGN التطبيق وليست استشارة قانونية.',officialSource:'مصدر رسمي',productGuidance:'كيف يعالج SCHNGN ذلك',sourceNames:sourceNames.ar,
    groups:[
      {id:'rule',title:'كيف تعمل قاعدة 90/180 يومًا',items:[
        {id:'meaning',question:'ماذا تعني «90 يومًا ضمن أي 180 يومًا»؟',answer:'في كل يوم من الإقامة القصيرة يُنظر إلى ذلك اليوم والأيام الـ179 السابقة. لا يجوز أن يتجاوز مجموع أيام الوجود داخل هذه النافذة المتحركة 90 يومًا.',source:'calculator'},
        {id:'reset',question:'هل تتجدد المدة كل ستة أشهر أو في 1 يناير؟',answer:'لا. لا يوجد تاريخ ثابت للتجديد. تتحرك النافذة يومًا بيوم، وتعود أيام الوجود القديمة منفردة عندما تخرج من فترة النظر إلى الخلف.',source:'calculator'},
        {id:'boundaries',question:'هل يُحسب يوم الدخول ويوم الخروج معًا؟',answer:'نعم. الدخول هو أول يوم للإقامة والخروج هو آخرها. الوصول المتأخر أو المغادرة المبكرة أو الدخول والخروج في التاريخ نفسه يستهلك ذلك اليوم التقويمي.',source:'calculator'},
        {id:'countries',question:'هل الانتقال إلى دولة شنغن أخرى يعيد العداد إلى الصفر؟',answer:'لا. تشترك دول شنغن الـ29 في رصيد واحد. فالانتقال من إيطاليا إلى النمسا مثلًا يبقى وجودًا متصلًا ما لم تغادر منطقة شنغن فعليًا.',source:'schengenArea'},
        {id:'outside',question:'كم يجب أن أبقى خارج شنغن حتى تعود الأيام؟',answer:'تعود الأيام عادةً واحدًا تلو الآخر عندما تخرج الإقامات القديمة من النافذة. غياب متصل لمدة 90 يومًا يُخرج إقامة سابقة من 90 يومًا بالكامل، لكن فترات أقصر قد تعيد بعض الأيام.',source:'calculator'}]},
      {id:'documents',title:'الوثائق والحدود والاستثناءات',items:[
        {id:'who',question:'على من تنطبق قاعدة 90/180 العادية؟',answer:'تنطبق عادةً على مواطني الدول غير الأعضاء في الاتحاد خلال الإقامات القصيرة، سواء دون تأشيرة أو بتأشيرة قصيرة. قد تغيّر حقوق حرية التنقل أو الإقامة أو قواعد الجنسية النتيجة.',source:'travelDocuments'},
        {id:'visa',question:'هل تمنح تأشيرة شنغن دائمًا 90 يومًا؟',answer:'لا. 90 يومًا هو الحد الأقصى العام. قد تسمح ملصقة التأشيرة بأيام أو دخولات أقل أو مدة صلاحية أضيق، ويجب احترام تلك الحدود أيضًا.',source:'visa'},
        {id:'permit',question:'ماذا عن تصريح الإقامة أو التأشيرة الطويلة؟',answer:'لا تُدخل المدة المصرح بها بتصريح إقامة شنغن أو تأشيرة D في حاسبة الاتحاد كإقامة قصيرة عادية. وقد تبقى الرحلات إلى دول شنغن الأخرى خاضعة لحد 90/180 منفصل.',source:'calculator'},
        {id:'family',question:'هل يستخدم أفراد أسرة مواطن الاتحاد من غير مواطنيه هذا الحساب دائمًا؟',answer:'ليس دائمًا. قد تمنح قواعد حرية التنقل في الاتحاد حقوقًا مختلفة لأفراد الأسرة المؤهلين عند مرافقة مواطن الاتحاد أو الانضمام إليه. تحقق من الشروط الرسمية قبل الاعتماد على الحساب.',source:'family'},
        {id:'area',question:'هل كل دولة في الاتحاد أو أوروبا ضمن شنغن؟',answer:'لا. تضم شنغن حاليًا 29 دولة، ومنها بلغاريا ورومانيا منذ 1 يناير 2025. قبرص وأيرلندا ليستا ضمن منطقة شنغن الخالية من الحدود وتطبقان قواعد مختلفة.',source:'schengenArea'},
        {id:'transit',question:'هل رحلة الربط في المطار تُحسب يومًا في شنغن؟',answer:'البقاء في منطقة العبور الدولية دون دخول شنغن ليس إقامة قصيرة. إذا عبرت مراقبة الحدود ودخلت المنطقة، يُحسب ذلك اليوم التقويمي.',source:'visa'},
        {id:'systems',question:'هل يغيّر EES أو ETIAS حساب 90/180؟',answer:'لا. يسجل EES الدخول والخروج عبر الحدود الخارجية، وETIAS تصريح سفر للمسافرين المؤهلين المعفيين من التأشيرة. لا يزيد أي منهما الرصيد.',source:'eesEtias'}]},
      {id:'problems',title:'تجاوز المدة والحالات الصعبة',items:[
        {id:'overstay',question:'ماذا قد يحدث إذا تجاوزت المدة؟',answer:'تعتمد النتائج على الوقائع والإجراء الوطني. قد تشمل رفض الدخول وإجراءات العودة، وفي بعض الحالات حظر دخول مسجلًا في نظام معلومات شنغن.',source:'eesFaq'},
        {id:'bilateral',question:'هل تمنح اتفاقية ثنائية أو قاعدة وطنية وقتًا إضافيًا؟',answer:'قد ينطبق أحيانًا اتفاق أو إذن خاص بدولة، لكنه لا يضيف أيامًا ببساطة إلى الحساب المشترك. أكّد الإقليم وطريق الخروج والشروط مع السلطة المختصة.',source:'calculator'},
        {id:'authority',question:'هل تلزم نتيجة الحاسبة سلطات الحدود؟',answer:'لا. حتى حاسبة المفوضية الأوروبية أداة مساعدة فقط. تقرر السلطات المختصة مدة الإقامة وقد تنظر في التأشيرات والوثائق وحقوق الإقامة ووقائع لا يحاكيها SCHNGN.',source:'calculator'}]},
      {id:'product',title:'استخدام SCHNGN',items:[
        {id:'ongoing',question:'هل يمكن إضافة إقامة حالية أو مستقبلية من دون اختيار تاريخ خروج؟',answer:'نعم. اختر «لا أعرف تاريخ الخروج بعد». في الإقامة الحالية يحسب SCHNGN الأيام حتى اليوم، وفي الإقامة المستقبلية يتوقع آخر تاريخ خروج آمن استنادًا إلى رحلاتك الأخرى. يبقى الخروج مفتوحًا حتى تدخل التاريخ الفعلي.',productGuidance:true},
        {id:'records',question:'كيف يعالج SCHNGN الرحلات المتداخلة أو القديمة؟',answer:'تُحسب التواريخ المتداخلة مرة واحدة. تبقى الرحلات خارج نافذة اليوم في السجل، وتُخفى خلف «عرض الرحلات خارج 180 يومًا»، ولا تؤثر في نتيجة اليوم.',productGuidance:true},
        {id:'privacy',question:'أين تُحفظ تواريخ رحلاتي؟',answer:'تبقى رحلات الضيف في هذا المتصفح. يفتح «التسجيل والحفظ» أو «إنشاء حساب وحفظ الرحلات» عملية آمنة لإنشاء الحساب؛ وبعد ذلك يحفظ SCHNGN سجل رحلاتك الحالي تلقائيًا في حسابك. لا تُرسل تواريخ الرحلات إلى التحليلات أبدًا.',productGuidance:true}]}
    ]
  }
};

export function faqUi(locale: Locale): FaqCatalog {
  return catalogs[locale] ?? deepTranslateExtended(locale, catalogs.en);
}

export function faqCatalogShape(locale: Locale): { groups: string[]; items: string[] } {
  const catalog = faqUi(locale);
  return {
    groups: catalog.groups.map((group) => group.id),
    items: catalog.groups.flatMap((group) => group.items.map((item) => item.id))
  };
}
