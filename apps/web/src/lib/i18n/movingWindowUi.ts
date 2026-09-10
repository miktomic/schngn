import type { Locale } from './locales';

// Product controls only. Rule explanations continue to use the reviewed catalog.
type Labels = readonly [string, string, string, string, string, string, string, string, string, string];
const labels: Record<Locale, Labels> = {
  en: ['Explore the moving window', 'Checking date', 'Back to result', 'Saved result', 'Include what-if stay', 'Example trips', 'Open-ended · projected', 'Counted days', 'What-if stay', 'Planned stay'],
  fr: ['Explorer la fenêtre mobile', 'Date examinée', 'Revenir au résultat', 'Résultat enregistré', 'Inclure le séjour simulé', 'Voyages d’exemple', 'Sans date de fin · projection', 'Jours comptés', 'Séjour simulé', 'Séjour prévu'],
  de: ['Das rollierende Fenster erkunden', 'Geprüftes Datum', 'Zurück zum Ergebnis', 'Gespeichertes Ergebnis', 'Was-wäre-wenn-Aufenthalt einbeziehen', 'Beispielreisen', 'Ohne Enddatum · Prognose', 'Gezählte Tage', 'Was-wäre-wenn-Aufenthalt', 'Geplanter Aufenthalt'],
  es: ['Explora la ventana móvil', 'Fecha consultada', 'Volver al resultado', 'Resultado guardado', 'Incluir estancia hipotética', 'Viajes de ejemplo', 'Sin fecha de salida · proyección', 'Días contados', 'Estancia hipotética', 'Estancia prevista'],
  it: ['Esplora la finestra mobile', 'Data esaminata', 'Torna al risultato', 'Risultato salvato', 'Includi soggiorno ipotetico', 'Viaggi di esempio', 'Senza data di uscita · proiezione', 'Giorni conteggiati', 'Soggiorno ipotetico', 'Soggiorno previsto'],
  'pt-br': ['Explore a janela móvel', 'Data consultada', 'Voltar ao resultado', 'Resultado salvo', 'Incluir estadia hipotética', 'Viagens de exemplo', 'Sem data de saída · projeção', 'Dias contados', 'Estadia hipotética', 'Estadia planejada'],
  ru: ['Исследуйте скользящее окно', 'Проверяемая дата', 'Вернуться к результату', 'Сохранённый результат', 'Включить пробную поездку', 'Примеры поездок', 'Без даты выезда · прогноз', 'Учтённые дни', 'Пробная поездка', 'Запланированная поездка'],
  uk: ['Дослідіть рухоме вікно', 'Дата перевірки', 'Повернутися до результату', 'Збережений результат', 'Включити пробну поїздку', 'Приклади поїздок', 'Без дати виїзду · прогноз', 'Враховані дні', 'Пробна поїздка', 'Запланована поїздка'],
  tr: ['Hareketli pencereyi keşfedin', 'Kontrol tarihi', 'Sonuca dön', 'Kaydedilen sonuç', 'Varsayımsal kalışı dahil et', 'Örnek seyahatler', 'Çıkış tarihi yok · tahmin', 'Sayılan günler', 'Varsayımsal kalış', 'Planlanan kalış'],
  sr: ['Istražite pomerajući prozor', 'Datum provere', 'Nazad na rezultat', 'Sačuvani rezultat', 'Uključi probni boravak', 'Primeri putovanja', 'Bez datuma izlaska · projekcija', 'Izbrojani dani', 'Probni boravak', 'Planirani boravak'],
  sq: ['Eksploroni dritaren lëvizëse', 'Data e kontrollit', 'Kthehu te rezultati', 'Rezultati i ruajtur', 'Përfshi qëndrimin hipotetik', 'Udhëtime shembull', 'Pa datë daljeje · parashikim', 'Ditët e numëruara', 'Qëndrim hipotetik', 'Qëndrim i planifikuar'],
  ka: ['მოძრავი ფანჯრის დათვალიერება', 'შესამოწმებელი თარიღი', 'შედეგზე დაბრუნება', 'შენახული შედეგი', 'ჰიპოთეტური ყოფნის ჩართვა', 'მოგზაურობის მაგალითები', 'გასვლის თარიღის გარეშე · პროგნოზი', 'დათვლილი დღეები', 'ჰიპოთეტური ყოფნა', 'დაგეგმილი ყოფნა'],
  'zh-cn': ['探索滚动窗口', '查看日期', '返回结果', '已保存的结果', '包含假设行程', '示例行程', '未定离境日期 · 预测', '已计入天数', '假设行程', '计划行程'],
  ja: ['移動する期間を確認', '確認する日付', '結果に戻る', '保存済みの結果', '仮の滞在を含める', '旅行の例', '出国日未定 · 予測', '算入日数', '仮の滞在', '予定の滞在'],
  ko: ['이동하는 기간 살펴보기', '확인 날짜', '결과로 돌아가기', '저장된 결과', '가상 체류 포함', '여행 예시', '출국일 미정 · 예상', '계산된 일수', '가상 체류', '예정된 체류'],
  he: ['בדיקת החלון הנע', 'תאריך לבדיקה', 'חזרה לתוצאה', 'התוצאה השמורה', 'כלול שהייה לדוגמה', 'נסיעות לדוגמה', 'ללא תאריך יציאה · תחזית', 'ימים שנספרו', 'שהייה לדוגמה', 'שהייה מתוכננת'],
  ar: ['استكشف النافذة المتحركة', 'تاريخ التحقق', 'العودة إلى النتيجة', 'النتيجة المحفوظة', 'تضمين الإقامة الافتراضية', 'رحلات توضيحية', 'دون تاريخ مغادرة · توقع', 'الأيام المحتسبة', 'إقامة افتراضية', 'إقامة مخططة']
};

export function movingWindowUi(locale: Locale) {
  const [explore, checking, reset, savedResult, include, example, ongoing, counted, whatIf, planned] = labels[locale];
  const [moveDate, today, plannedExit, outside, entry, countedTemplate, savedForecast] = details[locale];
  return { explore, checking, reset, savedResult, include, example, ongoing, counted, whatIf, planned, moveDate, today, plannedExit, outside, entry, savedForecast,
    countedInWindow: (count: string, total: string) => countedTemplate.replace('{count}', count).replace('{total}', total) };
}

// Explicit legend and navigation labels for the moving-window evidence.
const details: Record<Locale, readonly [string, string, string, string, string, string, string]> = {
  en: ['Move the checking date', 'Today', 'Planned exit', 'Outside this window', 'Entry date', '{count} of {total} days counted in this window', 'Forecast from the saved result'],
  fr: ['Déplacer la date examinée', 'Aujourd’hui', 'Sortie prévue', 'Hors de cette fenêtre', 'Date d’entrée', '{count} jours sur {total} comptés dans cette fenêtre', 'Prévision depuis le résultat enregistré'],
  de: ['Prüfdatum verschieben', 'Heute', 'Geplante Ausreise', 'Außerhalb dieses Fensters', 'Einreisedatum', '{count} von {total} Tagen in diesem Fenster gezählt', 'Prognose ab dem gespeicherten Ergebnis'],
  es: ['Mueve la fecha consultada', 'Hoy', 'Salida prevista', 'Fuera de esta ventana', 'Fecha de entrada', '{count} de {total} días contados en esta ventana', 'Previsión desde el resultado guardado'],
  it: ['Sposta la data esaminata', 'Oggi', 'Uscita prevista', 'Fuori da questa finestra', 'Data di ingresso', '{count} giorni su {total} conteggiati in questa finestra', 'Previsione dal risultato salvato'],
  'pt-br': ['Mova a data consultada', 'Hoje', 'Saída planejada', 'Fora desta janela', 'Data de entrada', '{count} de {total} dias contados nesta janela', 'Previsão a partir do resultado salvo'],
  ru: ['Переместить проверяемую дату', 'Сегодня', 'Планируемый выезд', 'Вне этого окна', 'Дата въезда', 'В этом окне учтено {count} из {total} дней', 'Прогноз от сохранённого результата'],
  uk: ['Змінити дату перевірки', 'Сьогодні', 'Запланований виїзд', 'Поза цим вікном', 'Дата в’їзду', 'У цьому вікні враховано {count} із {total} днів', 'Прогноз від збереженого результату'],
  tr: ['Kontrol tarihini kaydırın', 'Bugün', 'Planlanan çıkış', 'Bu pencerenin dışında', 'Giriş tarihi', 'Bu pencerede {total} günün {count} günü sayıldı', 'Kaydedilen sonuçtan başlayan tahmin'],
  sr: ['Pomerite datum provere', 'Danas', 'Planirani izlazak', 'Van ovog prozora', 'Datum ulaska', 'U ovom prozoru je izbrojano {count} od {total} dana', 'Prognoza od sačuvanog rezultata'],
  sq: ['Lëvizni datën e kontrollit', 'Sot', 'Dalja e planifikuar', 'Jashtë kësaj dritareje', 'Data e hyrjes', '{count} nga {total} ditë numërohen në këtë dritare', 'Parashikimi nga rezultati i ruajtur'],
  ka: ['შესამოწმებელი თარიღის შეცვლა', 'დღეს', 'დაგეგმილი გასვლა', 'ამ ფანჯრის გარეთ', 'შესვლის თარიღი', 'ამ ფანჯარაში დათვლილია {count} დღე {total}-დან', 'პროგნოზი შენახული შედეგიდან'],
  'zh-cn': ['移动查看日期', '今天', '计划离境', '此窗口之外', '入境日期', '此窗口内计入 {count} 天，共 {total} 天', '基于已保存结果的预测'],
  ja: ['確認する日付を動かす', '今日', '出国予定日', 'この期間の外', '入国日', '全{total}日のうち{count}日がこの期間に算入', '保存済みの結果からの予測'],
  ko: ['확인 날짜 이동', '오늘', '예정 출국일', '이 기간 밖', '입국일', '전체 {total}일 중 이 기간에 {count}일 포함', '저장된 결과 기준 예상'],
  he: ['הזזת תאריך הבדיקה', 'היום', 'יציאה מתוכננת', 'מחוץ לחלון הזה', 'תאריך כניסה', '{count} מתוך {total} ימים נספרים בחלון הזה', 'תחזית מהתוצאה השמורה'],
  ar: ['حرّك تاريخ التحقق', 'اليوم', 'المغادرة المخططة', 'خارج هذه النافذة', 'تاريخ الدخول', 'يُحتسب {count} من أصل {total} يومًا في هذه النافذة', 'التوقع انطلاقًا من النتيجة المحفوظة']
};

// Alternate visual encodings of the same local calculation, not workspace tabs.
const viewLabels: Record<Locale, readonly [string, string, string, string, string, string, string]> = {
  en: ['Timeline view', 'Sliding window', 'Layered contributions', 'Earlier trips', '90-day limit', 'Each layer adds to the counted-day total.', 'Shared days appear once, under the earliest-starting trip.'],
  fr: ['Vue de la chronologie', 'Fenêtre mobile', 'Contributions empilées', 'Voyages antérieurs', 'Limite de 90 jours', 'Chaque couche contribue au total des jours comptés.', 'Les jours communs apparaissent une seule fois, dans le voyage commencé le plus tôt.'],
  de: ['Zeitachsenansicht', 'Rollierendes Fenster', 'Gestapelte Beiträge', 'Frühere Reisen', '90-Tage-Grenze', 'Jede Fläche trägt zur Summe der gezählten Tage bei.', 'Gemeinsame Tage erscheinen einmal bei der zuerst begonnenen Reise.'],
  es: ['Vista de la cronología', 'Ventana móvil', 'Contribuciones apiladas', 'Viajes anteriores', 'Límite de 90 días', 'Cada capa contribuye al total de días contados.', 'Los días compartidos aparecen una sola vez, en el viaje que empezó antes.'],
  it: ['Vista della cronologia', 'Finestra mobile', 'Contributi sovrapposti', 'Viaggi precedenti', 'Limite di 90 giorni', 'Ogni area contribuisce al totale dei giorni conteggiati.', 'I giorni condivisi appaiono una sola volta, nel viaggio iniziato per primo.'],
  'pt-br': ['Visualização da linha do tempo', 'Janela móvel', 'Contribuições empilhadas', 'Viagens anteriores', 'Limite de 90 dias', 'Cada camada contribui para o total de dias contados.', 'Os dias compartilhados aparecem uma única vez, na viagem que começou primeiro.'],
  ru: ['Вид временной шкалы', 'Скользящее окно', 'Вклад поездок', 'Предыдущие поездки', 'Лимит 90 дней', 'Каждый слой входит в общее число учтённых дней.', 'Общие дни показаны один раз в поездке, начавшейся раньше.'],
  uk: ['Вигляд часової шкали', 'Рухоме вікно', 'Внесок поїздок', 'Попередні поїздки', 'Ліміт 90 днів', 'Кожен шар входить до загальної кількості врахованих днів.', 'Спільні дні показано один раз у поїздці, що почалася раніше.'],
  tr: ['Zaman çizelgesi görünümü', 'Hareketli pencere', 'Katmanlı katkılar', 'Önceki seyahatler', '90 günlük sınır', 'Her katman, sayılan günlerin toplamına katkıda bulunur.', 'Ortak günler, önce başlayan seyahatte yalnızca bir kez gösterilir.'],
  sr: ['Prikaz vremenske linije', 'Pomerajući prozor', 'Slojevi boravaka', 'Ranija putovanja', 'Granica od 90 dana', 'Svaki sloj doprinosi ukupnom broju izbrojanih dana.', 'Zajednički dani prikazani su jednom, u putovanju koje je prvo počelo.'],
  sq: ['Pamja e kronologjisë', 'Dritarja lëvizëse', 'Kontributet me shtresa', 'Udhëtime të mëparshme', 'Kufiri prej 90 ditësh', 'Çdo shtresë kontribuon në totalin e ditëve të numëruara.', 'Ditët e përbashkëta shfaqen vetëm një herë, në udhëtimin që filloi më herët.'],
  ka: ['დროის ხაზის ხედი', 'მოძრავი ფანჯარა', 'მოგზაურობების წვლილი', 'წინა მოგზაურობები', '90-დღიანი ზღვარი', 'თითოეული ფენა დათვლილი დღეების ჯამს ემატება.', 'საერთო დღეები ერთხელ, უფრო ადრე დაწყებულ მოგზაურობაში ჩანს.'],
  'zh-cn': ['时间轴视图', '滚动窗口', '行程天数分层', '较早行程', '90天上限', '各层共同组成计入天数的总数。', '重叠日期仅计入一次，归于最早开始的行程。'],
  ja: ['タイムライン表示', '移動する期間', '旅行別の積み上げ', '以前の旅行', '90日の上限', '各層を合計すると算入日数になります。', '重なる日は、最も早く始まった旅行に一度だけ表示されます。'],
  ko: ['타임라인 보기', '이동 기간', '여행별 누적 일수', '이전 여행', '90일 한도', '각 영역을 합하면 계산된 총 일수가 됩니다.', '겹치는 날짜는 가장 먼저 시작한 여행에 한 번만 표시됩니다.'],
  he: ['תצוגת ציר הזמן', 'חלון נע', 'שכבות של נסיעות', 'נסיעות קודמות', 'מגבלת 90 יום', 'כל שכבה תורמת למספר הימים הכולל שנספר.', 'ימים משותפים מוצגים פעם אחת, בנסיעה שהתחילה מוקדם יותר.'],
  ar: ['عرض المخطط الزمني', 'النافذة المتحركة', 'مساهمات الرحلات', 'رحلات سابقة', 'حد 90 يومًا', 'تُضاف كل طبقة إلى إجمالي الأيام المحتسبة.', 'تظهر الأيام المشتركة مرة واحدة ضمن الرحلة التي بدأت أولًا.']
};

export function timelineViewUi(locale: Locale) {
  const [view, sliding, layered, earlierTrips, limit, layerHint, overlapHint] = viewLabels[locale];
  return { view, sliding, layered, earlierTrips, limit, layerHint, overlapHint };
}
