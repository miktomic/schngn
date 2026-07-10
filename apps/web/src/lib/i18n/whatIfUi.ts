import type { Locale } from './locales';

const en = { adjust:'Adjust this trip',title:'Adjust what-if trip',hint:'Drag the trip to move it. Drag either edge to change arrival or departure.',move:'Move trip',entry:'Arrival',exit:'Departure',exact:'Exact dates',close:'Close adjuster',live:'Live what-if result' } as const;
type Key = keyof typeof en;
type Catalog = Record<Key,string>;
const catalogs: Record<Locale,Catalog> = {
  en,
  fr:{adjust:'Ajuster ce voyage',title:'Ajuster la simulation',hint:'Faites glisser le voyage pour le déplacer, ou ses bords pour changer l’arrivée ou le départ.',move:'Déplacer le voyage',entry:'Arrivée',exit:'Départ',exact:'Dates exactes',close:'Fermer le réglage',live:'Résultat de simulation en direct'},
  de:{adjust:'Diese Reise anpassen',title:'Was-wäre-wenn-Reise anpassen',hint:'Ziehen Sie die Reise zum Verschieben oder die Ränder für Ankunft und Abreise.',move:'Reise verschieben',entry:'Ankunft',exit:'Abreise',exact:'Genaue Daten',close:'Anpassung schließen',live:'Live-Ergebnis'},
  es:{adjust:'Ajustar este viaje',title:'Ajustar viaje simulado',hint:'Arrastra el viaje para moverlo o sus bordes para cambiar llegada o salida.',move:'Mover viaje',entry:'Llegada',exit:'Salida',exact:'Fechas exactas',close:'Cerrar ajuste',live:'Resultado en directo'},
  it:{adjust:'Modifica questo viaggio',title:'Modifica il viaggio simulato',hint:'Trascina il viaggio per spostarlo o i bordi per cambiare arrivo e partenza.',move:'Sposta viaggio',entry:'Arrivo',exit:'Partenza',exact:'Date esatte',close:'Chiudi regolazione',live:'Risultato in tempo reale'},
  ru:{adjust:'Изменить эту поездку',title:'Изменить сценарий поездки',hint:'Перетащите поездку целиком или её края, чтобы изменить въезд и выезд.',move:'Переместить поездку',entry:'Въезд',exit:'Выезд',exact:'Точные даты',close:'Закрыть настройку',live:'Результат в реальном времени'},
  tr:{adjust:'Bu seyahati ayarla',title:'Senaryo seyahatini ayarla',hint:'Seyahati taşımak için bloğu, giriş veya çıkışı değiştirmek için kenarları sürükleyin.',move:'Seyahati taşı',entry:'Giriş',exit:'Çıkış',exact:'Kesin tarihler',close:'Ayarlayıcıyı kapat',live:'Canlı senaryo sonucu'},
  he:{adjust:'התאמת הנסיעה',title:'התאמת נסיעת תרחיש',hint:'גררו את הנסיעה כדי להזיז אותה, או את הקצוות כדי לשנות כניסה ויציאה.',move:'הזזת הנסיעה',entry:'כניסה',exit:'יציאה',exact:'תאריכים מדויקים',close:'סגירת ההתאמה',live:'תוצאת תרחיש בזמן אמת'},
  ar:{adjust:'تعديل هذه الرحلة',title:'تعديل رحلة السيناريو',hint:'اسحب الرحلة لنقلها أو اسحب الحافتين لتغيير الدخول أو الخروج.',move:'نقل الرحلة',entry:'الدخول',exit:'الخروج',exact:'التواريخ الدقيقة',close:'إغلاق أداة التعديل',live:'نتيجة مباشرة للسيناريو'}
};

export function createWhatIfUiTranslator(locale:Locale):(key:Key)=>string { return (key)=>catalogs[locale][key]; }
export function whatIfCatalogLengths():Record<Locale,number>{return Object.fromEntries(Object.entries(catalogs).map(([locale,value])=>[locale,Object.keys(value).length])) as Record<Locale,number>;}
