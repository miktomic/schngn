import { formatLocalizedCount } from './countUi';
import type { Locale } from './locales';

const en = { adjust:'Adjust this trip',title:'Adjust trip dates',hint:'Drag the trip to move it. Drag either edge to change arrival or departure.',move:'Move trip',entry:'Arrival',exit:'Departure',overFrom:'Over limit from',exact:'Exact dates',close:'Close adjuster',live:'Live what-if result',tripToAdjust:'Trip to adjust',chooseTrip:'Choose a saved trip to adjust its dates.',outsideWindow:'outside this window',saveChanges:'Save changes',keepOriginal:'Keep original',updated:'Trip dates updated.',unavailable:'That trip is no longer available. Choose it again.' } as const;
type Key = keyof typeof en;
type Catalog = Record<Key,string>;
const catalogs: Record<Locale,Catalog> = {
  en,
  fr:{adjust:'Ajuster ce voyage',title:'Ajuster les dates du voyage',hint:'Faites glisser le voyage pour le déplacer, ou ses bords pour changer l’arrivée ou le départ.',move:'Déplacer le voyage',entry:'Arrivée',exit:'Départ',overFrom:'Dépassement à partir du',exact:'Dates exactes',close:'Fermer le réglage',live:'Résultat de simulation en direct',tripToAdjust:'Voyage à ajuster',chooseTrip:'Choisissez un voyage enregistré pour modifier ses dates.',outsideWindow:'hors de cette fenêtre',saveChanges:'Enregistrer les modifications',keepOriginal:'Conserver l’original',updated:'Dates du voyage mises à jour.',unavailable:'Ce voyage n’est plus disponible. Sélectionnez-le à nouveau.'},
  de:{adjust:'Diese Reise anpassen',title:'Reisedaten anpassen',hint:'Ziehen Sie die Reise zum Verschieben oder die Ränder für Ankunft und Abreise.',move:'Reise verschieben',entry:'Ankunft',exit:'Abreise',overFrom:'Über dem Limit ab',exact:'Genaue Daten',close:'Anpassung schließen',live:'Live-Ergebnis',tripToAdjust:'Reise zum Anpassen',chooseTrip:'Wählen Sie eine gespeicherte Reise, um ihre Daten anzupassen.',outsideWindow:'außerhalb dieses Fensters',saveChanges:'Änderungen speichern',keepOriginal:'Original behalten',updated:'Reisedaten aktualisiert.',unavailable:'Diese Reise ist nicht mehr verfügbar. Wählen Sie sie erneut aus.'},
  es:{adjust:'Ajustar este viaje',title:'Ajustar las fechas del viaje',hint:'Arrastra el viaje para moverlo o sus bordes para cambiar llegada o salida.',move:'Mover viaje',entry:'Llegada',exit:'Salida',overFrom:'Sobre el límite desde',exact:'Fechas exactas',close:'Cerrar ajuste',live:'Resultado en directo',tripToAdjust:'Viaje que ajustar',chooseTrip:'Elige un viaje guardado para ajustar sus fechas.',outsideWindow:'fuera de esta ventana',saveChanges:'Guardar cambios',keepOriginal:'Conservar original',updated:'Fechas del viaje actualizadas.',unavailable:'Ese viaje ya no está disponible. Vuelve a seleccionarlo.'},
  it:{adjust:'Modifica questo viaggio',title:'Modifica le date del viaggio',hint:'Trascina il viaggio per spostarlo o i bordi per cambiare arrivo e partenza.',move:'Sposta viaggio',entry:'Arrivo',exit:'Partenza',overFrom:'Oltre il limite dal',exact:'Date esatte',close:'Chiudi regolazione',live:'Risultato in tempo reale',tripToAdjust:'Viaggio da modificare',chooseTrip:'Scegli un viaggio salvato per modificarne le date.',outsideWindow:'fuori da questa finestra',saveChanges:'Salva modifiche',keepOriginal:'Mantieni originale',updated:'Date del viaggio aggiornate.',unavailable:'Il viaggio non è più disponibile. Selezionalo di nuovo.'},
  ru:{adjust:'Изменить эту поездку',title:'Изменить даты поездки',hint:'Перетащите поездку целиком или её края, чтобы изменить въезд и выезд.',move:'Переместить поездку',entry:'Въезд',exit:'Выезд',overFrom:'Превышение с',exact:'Точные даты',close:'Закрыть настройку',live:'Результат в реальном времени',tripToAdjust:'Поездка для изменения',chooseTrip:'Выберите сохранённую поездку, чтобы изменить её даты.',outsideWindow:'вне этого окна',saveChanges:'Сохранить изменения',keepOriginal:'Оставить без изменений',updated:'Даты поездки обновлены.',unavailable:'Эта поездка больше недоступна. Выберите её снова.'},
  tr:{adjust:'Bu seyahati ayarla',title:'Seyahat tarihlerini ayarla',hint:'Seyahati taşımak için bloğu, giriş veya çıkışı değiştirmek için kenarları sürükleyin.',move:'Seyahati taşı',entry:'Giriş',exit:'Çıkış',overFrom:'Sınır aşımı başlangıcı',exact:'Kesin tarihler',close:'Ayarlayıcıyı kapat',live:'Canlı senaryo sonucu',tripToAdjust:'Ayarlanacak seyahat',chooseTrip:'Tarihlerini ayarlamak için kayıtlı bir seyahat seçin.',outsideWindow:'bu pencerenin dışında',saveChanges:'Değişiklikleri kaydet',keepOriginal:'Orijinali koru',updated:'Seyahat tarihleri güncellendi.',unavailable:'Bu seyahat artık kullanılamıyor. Yeniden seçin.'},
  he:{adjust:'התאמת הנסיעה',title:'התאמת תאריכי הנסיעה',hint:'גררו את הנסיעה כדי להזיז אותה, או את הקצוות כדי לשנות כניסה ויציאה.',move:'הזזת הנסיעה',entry:'כניסה',exit:'יציאה',overFrom:'חריגה מהמגבלה החל מ־',exact:'תאריכים מדויקים',close:'סגירת ההתאמה',live:'תוצאת תרחיש בזמן אמת',tripToAdjust:'נסיעה להתאמה',chooseTrip:'בחרו נסיעה שמורה כדי להתאים את התאריכים שלה.',outsideWindow:'מחוץ לחלון הזה',saveChanges:'שמירת השינויים',keepOriginal:'שמירת המקור',updated:'תאריכי הנסיעה עודכנו.',unavailable:'הנסיעה הזו אינה זמינה עוד. בחרו בה מחדש.'},
  ar:{adjust:'تعديل هذه الرحلة',title:'تعديل تواريخ الرحلة',hint:'اسحب الرحلة لنقلها أو اسحب الحافتين لتغيير الدخول أو الخروج.',move:'نقل الرحلة',entry:'الدخول',exit:'الخروج',overFrom:'تجاوز الحد ابتداءً من',exact:'التواريخ الدقيقة',close:'إغلاق أداة التعديل',live:'نتيجة مباشرة للسيناريو',tripToAdjust:'الرحلة المراد تعديلها',chooseTrip:'اختر رحلة محفوظة لتعديل تواريخها.',outsideWindow:'خارج هذه النافذة',saveChanges:'حفظ التغييرات',keepOriginal:'الاحتفاظ بالأصل',updated:'تم تحديث تواريخ الرحلة.',unavailable:'لم تعد هذه الرحلة متاحة. اخترها مرة أخرى.'}
};

const feedbackCatalog: Record<Locale, { atLimit: string; over: (days: string) => string; spare: (days: string) => string }> = {
  en: { atLimit:'At the limit', over:(days)=>`Over by ${days}`, spare:(days)=>`Fits · ${days} spare` },
  fr: { atLimit:'À la limite', over:(days)=>`Dépassement de ${days}`, spare:(days)=>`Possible · marge de ${days}` },
  de: { atLimit:'Am Limit', over:(days)=>`${days} über dem Limit`, spare:(days)=>`Passt · ${days} Puffer` },
  es: { atLimit:'En el límite', over:(days)=>`${days} sobre el límite`, spare:(days)=>`Cabe · margen de ${days}` },
  it: { atLimit:'Al limite', over:(days)=>`${days} oltre il limite`, spare:(days)=>`Rientra · margine di ${days}` },
  ru: { atLimit:'На пределе', over:(days)=>`Сверх лимита: ${days}`, spare:(days)=>`Подходит · запас ${days}` },
  tr: { atLimit:'Sınırda', over:(days)=>`Sınır ${days} aşıldı`, spare:(days)=>`Uygun · ${days} pay` },
  he: { atLimit:'בדיוק במגבלה', over:(days)=>`${days} מעל למגבלה`, spare:(days)=>`מתאים · מרווח של ${days}` },
  ar: { atLimit:'عند الحد تمامًا', over:(days)=>`فوق الحد بمقدار ${days}`, spare:(days)=>`مناسبة · هامش ${days}` }
};

export function createWhatIfUiTranslator(locale:Locale):(key:Key)=>string { return (key)=>catalogs[locale][key]; }
export function formatAdjusterFeedback(locale:Locale,overBy:number,remaining:number):string {
  const feedback=feedbackCatalog[locale];
  if(overBy>0) return feedback.over(formatLocalizedCount(locale,overBy,'day').text);
  if(remaining===0) return feedback.atLimit;
  return feedback.spare(formatLocalizedCount(locale,remaining,'day').text);
}
export function whatIfCatalogLengths():Record<Locale,number>{return Object.fromEntries(Object.entries(catalogs).map(([locale,value])=>[locale,Object.keys(value).length])) as Record<Locale,number>;}
