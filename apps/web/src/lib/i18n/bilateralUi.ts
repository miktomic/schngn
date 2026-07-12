import { SUPPORTED_LOCALES, type Locale } from './locales';

type BilateralUiKey =
  | 'passportLabel'
  | 'passportHelp'
  | 'choosePassport'
  | 'confirmExitCountry'
  | 'potentialTitle'
  | 'cautionTitle'
  | 'matchCopy'
  | 'conditionsCopy'
  | 'authorityCaution'
  | 'unchangedCopy'
  | 'officialSource'
  | 'opensNewTab';

type BilateralUiCatalog = Record<BilateralUiKey, string>;

const catalogs: Record<Locale, BilateralUiCatalog> = {
  en: {
    passportLabel: 'Which ordinary passport will you use?',
    passportHelp: 'Choose the country or jurisdiction that issued the passport. This answer is used only for this preview and is not saved.',
    choosePassport: 'Choose if useful',
    confirmExitCountry: 'I plan to leave Schengen through this country',
    potentialTitle: 'A country-specific stay may apply',
    cautionTitle: 'A possible stay needs an authority check',
    matchCopy: 'Official guidance identifies a possible match: ordinary passport — {passportCountry}; exit country — {exitCountry}.',
    conditionsCopy: 'Relevant only if you remain in that country, complete any required procedure, and leave Schengen directly through that country’s external border.',
    authorityCaution: 'Other eligibility, duration, and procedural conditions may apply. Confirm them with the competent authority before relying on this.',
    unchangedCopy: 'SCHNGN has not added any days. Your ordinary 90/180 result is unchanged.',
    officialSource: 'Open official guidance',
    opensNewTab: 'opens in a new tab'
  },
  fr: {
    passportLabel: 'Quel passeport ordinaire utiliserez-vous ?',
    passportHelp: 'Choisissez le pays ou le territoire qui a délivré le passeport. Cette réponse sert uniquement à cet aperçu et n’est pas enregistrée.',
    choosePassport: 'Choisir si utile',
    confirmExitCountry: 'Je prévois de quitter l’espace Schengen par ce pays',
    potentialTitle: 'Un séjour propre à ce pays peut s’appliquer',
    cautionTitle: 'Un séjour possible doit être confirmé auprès de l’autorité',
    matchCopy: 'Les indications officielles signalent une correspondance possible : passeport ordinaire — {passportCountry} ; pays de sortie — {exitCountry}.',
    conditionsCopy: 'Cela n’est pertinent que si vous restez dans ce pays, accomplissez toute procédure requise et quittez directement l’espace Schengen par la frontière extérieure de ce pays.',
    authorityCaution: 'D’autres conditions d’admissibilité, de durée et de procédure peuvent s’appliquer. Confirmez-les auprès de l’autorité compétente avant de vous y fier.',
    unchangedCopy: 'SCHNGN n’a ajouté aucun jour. Votre résultat ordinaire 90/180 reste inchangé.',
    officialSource: 'Ouvrir les indications officielles',
    opensNewTab: 's’ouvre dans un nouvel onglet'
  },
  de: {
    passportLabel: 'Welchen gewöhnlichen Reisepass werden Sie verwenden?',
    passportHelp: 'Wählen Sie das Land oder Hoheitsgebiet, das den Pass ausgestellt hat. Diese Angabe wird nur für diese Vorschau verwendet und nicht gespeichert.',
    choosePassport: 'Auswählen, falls hilfreich',
    confirmExitCountry: 'Ich plane, den Schengen-Raum über dieses Land zu verlassen',
    potentialTitle: 'Ein länderspezifischer Aufenthalt könnte möglich sein',
    cautionTitle: 'Ein möglicher Aufenthalt muss mit der Behörde geklärt werden',
    matchCopy: 'Offizielle Hinweise nennen eine mögliche Übereinstimmung: gewöhnlicher Reisepass — {passportCountry}; Ausreiseland — {exitCountry}.',
    conditionsCopy: 'Dies ist nur relevant, wenn Sie in diesem Land bleiben, alle erforderlichen Verfahren erledigen und den Schengen-Raum direkt über die Außengrenze dieses Landes verlassen.',
    authorityCaution: 'Weitere Voraussetzungen zu Berechtigung, Dauer und Verfahren können gelten. Klären Sie diese mit der zuständigen Behörde, bevor Sie sich darauf verlassen.',
    unchangedCopy: 'SCHNGN hat keine Tage hinzugefügt. Ihr gewöhnliches 90/180-Ergebnis bleibt unverändert.',
    officialSource: 'Offizielle Hinweise öffnen',
    opensNewTab: 'wird in einem neuen Tab geöffnet'
  },
  es: {
    passportLabel: '¿Qué pasaporte ordinario utilizarás?',
    passportHelp: 'Elige el país o territorio que expidió el pasaporte. Esta respuesta se usa solo en esta vista previa y no se guarda.',
    choosePassport: 'Elegir si resulta útil',
    confirmExitCountry: 'Planeo salir de Schengen a través de este país',
    potentialTitle: 'Puede aplicarse una estancia específica del país',
    cautionTitle: 'Una posible estancia requiere confirmación de la autoridad',
    matchCopy: 'La información oficial señala una posible coincidencia: pasaporte ordinario — {passportCountry}; país de salida — {exitCountry}.',
    conditionsCopy: 'Solo es relevante si permaneces en ese país, completas cualquier trámite requerido y sales de Schengen directamente por la frontera exterior de ese país.',
    authorityCaution: 'Pueden aplicarse otras condiciones de elegibilidad, duración y procedimiento. Confírmalas con la autoridad competente antes de basarte en esta posibilidad.',
    unchangedCopy: 'SCHNGN no ha añadido días. Tu resultado ordinario 90/180 no cambia.',
    officialSource: 'Abrir la información oficial',
    opensNewTab: 'se abre en una pestaña nueva'
  },
  it: {
    passportLabel: 'Quale passaporto ordinario userai?',
    passportHelp: 'Scegli il paese o territorio che ha rilasciato il passaporto. La risposta serve solo per questa anteprima e non viene salvata.',
    choosePassport: 'Scegli se utile',
    confirmExitCountry: 'Prevedo di uscire da Schengen attraverso questo paese',
    potentialTitle: 'Potrebbe applicarsi un soggiorno specifico del paese',
    cautionTitle: 'Un possibile soggiorno richiede conferma dall’autorità',
    matchCopy: 'Le indicazioni ufficiali segnalano una possibile corrispondenza: passaporto ordinario — {passportCountry}; paese di uscita — {exitCountry}.',
    conditionsCopy: 'È rilevante solo se rimani in quel paese, completi ogni procedura richiesta ed esci da Schengen direttamente attraverso la frontiera esterna di quel paese.',
    authorityCaution: 'Potrebbero applicarsi altre condizioni di idoneità, durata e procedura. Verificale con l’autorità competente prima di fare affidamento su questa possibilità.',
    unchangedCopy: 'SCHNGN non ha aggiunto giorni. Il risultato ordinario 90/180 resta invariato.',
    officialSource: 'Apri le indicazioni ufficiali',
    opensNewTab: 'si apre in una nuova scheda'
  },
  'pt-br': {
    passportLabel: 'Qual passaporte comum você usará?',
    passportHelp: 'Escolha o país ou território que emitiu o passaporte. A resposta é usada apenas nesta prévia e não é salva.',
    choosePassport: 'Escolher se for útil',
    confirmExitCountry: 'Pretendo sair de Schengen por este país',
    potentialTitle: 'Uma estadia específica do país pode se aplicar',
    cautionTitle: 'Uma possível estadia precisa ser confirmada pela autoridade',
    matchCopy: 'A orientação oficial indica uma possível correspondência: passaporte comum — {passportCountry}; país de saída — {exitCountry}.',
    conditionsCopy: 'Só é relevante se você permanecer nesse país, concluir os procedimentos exigidos e sair de Schengen diretamente pela fronteira externa desse país.',
    authorityCaution: 'Outras condições de elegibilidade, duração e procedimento podem se aplicar. Confirme-as com a autoridade competente antes de contar com essa possibilidade.',
    unchangedCopy: 'O SCHNGN não acrescentou dias. Seu resultado comum de 90/180 permanece igual.',
    officialSource: 'Abrir orientação oficial',
    opensNewTab: 'abre em uma nova guia'
  },
  ru: {
    passportLabel: 'Какой обычный паспорт вы будете использовать?',
    passportHelp: 'Выберите страну или юрисдикцию, выдавшую паспорт. Ответ используется только для этой предварительной проверки и не сохраняется.',
    choosePassport: 'Выбрать при необходимости',
    confirmExitCountry: 'Я планирую выехать из Шенгена через эту страну',
    potentialTitle: 'Может применяться правило пребывания конкретной страны',
    cautionTitle: 'Возможность пребывания нужно подтвердить у компетентного органа',
    matchCopy: 'Официальные разъяснения указывают на возможное совпадение: обычный паспорт — {passportCountry}; страна выезда — {exitCountry}.',
    conditionsCopy: 'Это имеет значение только если вы остаётесь в этой стране, выполняете необходимую процедуру и покидаете Шенген напрямую через внешнюю границу этой страны.',
    authorityCaution: 'Могут действовать и другие условия: право на такой режим, срок пребывания и порядок оформления. Уточните их в компетентном органе, прежде чем рассчитывать на эту возможность.',
    unchangedCopy: 'SCHNGN не добавил дни. Обычный результат 90/180 не изменился.',
    officialSource: 'Открыть официальные разъяснения',
    opensNewTab: 'откроется в новой вкладке'
  },
  uk: {
    passportLabel: 'Який звичайний паспорт ви використовуватимете?',
    passportHelp: 'Виберіть країну або юрисдикцію, яка видала паспорт. Відповідь використовується лише для цього попереднього перегляду й не зберігається.',
    choosePassport: 'Вибрати за потреби',
    confirmExitCountry: 'Я планую виїхати із Шенгену через цю країну',
    potentialTitle: 'Може застосовуватися правило перебування окремої країни',
    cautionTitle: 'Можливість перебування треба підтвердити в компетентного органу',
    matchCopy: 'Офіційні роз’яснення вказують на можливий збіг: звичайний паспорт — {passportCountry}; країна виїзду — {exitCountry}.',
    conditionsCopy: 'Це стосується лише випадку, коли ви залишаєтеся в цій країні, виконуєте потрібну процедуру та виїжджаєте із Шенгену безпосередньо через зовнішній кордон цієї країни.',
    authorityCaution: 'Можуть діяти й інші умови щодо права на такий режим, тривалості та процедури. Уточніть їх у компетентного органу, перш ніж покладатися на цю можливість.',
    unchangedCopy: 'SCHNGN не додав жодного дня. Звичайний результат 90/180 не змінився.',
    officialSource: 'Відкрити офіційні роз’яснення',
    opensNewTab: 'відкриється в новій вкладці'
  },
  tr: {
    passportLabel: 'Hangi umuma mahsus pasaportu kullanacaksınız?',
    passportHelp: 'Pasaportu düzenleyen ülke veya yetki alanını seçin. Bu yanıt yalnızca bu önizlemede kullanılır ve kaydedilmez.',
    choosePassport: 'Yararlıysa seçin',
    confirmExitCountry: 'Schengen’den bu ülke üzerinden ayrılmayı planlıyorum',
    potentialTitle: 'Ülkeye özgü bir kalış uygulanabilir',
    cautionTitle: 'Olası kalış yetkili makamla doğrulanmalıdır',
    matchCopy: 'Resmî rehber olası bir eşleşme gösteriyor: umuma mahsus pasaport — {passportCountry}; çıkış ülkesi — {exitCountry}.',
    conditionsCopy: 'Yalnızca o ülkede kalmanız, gerekli işlemleri tamamlamanız ve Schengen’den doğrudan o ülkenin dış sınırından çıkmanız halinde geçerlidir.',
    authorityCaution: 'Uygunluk, süre ve usule ilişkin başka koşullar da geçerli olabilir. Buna güvenmeden önce yetkili makamla doğrulayın.',
    unchangedCopy: 'SCHNGN hiçbir gün eklemedi. Olağan 90/180 sonucunuz değişmedi.',
    officialSource: 'Resmî rehberi aç',
    opensNewTab: 'yeni sekmede açılır'
  },
  sr: {
    passportLabel: 'Koji običan pasoš ćete koristiti?',
    passportHelp: 'Izaberite zemlju ili jurisdikciju koja je izdala pasoš. Odgovor se koristi samo za ovaj pregled i ne čuva se.',
    choosePassport: 'Izaberite ako je korisno',
    confirmExitCountry: 'Planiram da napustim Šengen preko ove zemlje',
    potentialTitle: 'Možda se primenjuje boravak prema pravilu određene zemlje',
    cautionTitle: 'Mogući boravak treba proveriti kod nadležnog organa',
    matchCopy: 'Zvanične smernice ukazuju na moguće podudaranje: običan pasoš — {passportCountry}; zemlja izlaska — {exitCountry}.',
    conditionsCopy: 'Relevantno je samo ako ostanete u toj zemlji, završite potrebni postupak i napustite Šengen direktno preko spoljne granice te zemlje.',
    authorityCaution: 'Mogu važiti i drugi uslovi podobnosti, trajanja i postupka. Potvrdite ih kod nadležnog organa pre nego što se oslonite na ovu mogućnost.',
    unchangedCopy: 'SCHNGN nije dodao nijedan dan. Vaš redovni rezultat 90/180 ostaje nepromenjen.',
    officialSource: 'Otvori zvanične smernice',
    opensNewTab: 'otvara se u novoj kartici'
  },
  sq: {
    passportLabel: 'Cilën pasaportë të zakonshme do të përdorni?',
    passportHelp: 'Zgjidhni vendin ose juridiksionin që ka lëshuar pasaportën. Përgjigjja përdoret vetëm për këtë pamje paraprake dhe nuk ruhet.',
    choosePassport: 'Zgjidhni nëse ju ndihmon',
    confirmExitCountry: 'Planifikoj të largohem nga Shengeni përmes këtij vendi',
    potentialTitle: 'Mund të zbatohet një qëndrim i posaçëm për vendin',
    cautionTitle: 'Qëndrimi i mundshëm duhet konfirmuar me autoritetin',
    matchCopy: 'Udhëzimi zyrtar tregon një përputhje të mundshme: pasaportë e zakonshme — {passportCountry}; vendi i daljes — {exitCountry}.',
    conditionsCopy: 'Vlen vetëm nëse qëndroni në atë vend, kryeni procedurën e kërkuar dhe largoheni nga Shengeni drejtpërdrejt përmes kufirit të jashtëm të atij vendi.',
    authorityCaution: 'Mund të zbatohen kushte të tjera për të drejtën, kohëzgjatjen dhe procedurën. Konfirmojini me autoritetin kompetent para se të mbështeteni te kjo mundësi.',
    unchangedCopy: 'SCHNGN nuk ka shtuar asnjë ditë. Rezultati i zakonshëm 90/180 mbetet i pandryshuar.',
    officialSource: 'Hap udhëzimin zyrtar',
    opensNewTab: 'hapet në një skedë të re'
  },
  ka: {
    passportLabel: 'რომელ ჩვეულებრივ პასპორტს გამოიყენებთ?',
    passportHelp: 'აირჩიეთ ქვეყანა ან იურისდიქცია, რომელმაც პასპორტი გასცა. პასუხი გამოიყენება მხოლოდ ამ წინასწარი შემოწმებისთვის და არ ინახება.',
    choosePassport: 'აირჩიეთ, თუ საჭიროა',
    confirmExitCountry: 'ვგეგმავ შენგენის დატოვებას ამ ქვეყნის გავლით',
    potentialTitle: 'შეიძლება მოქმედებდეს კონკრეტული ქვეყნის ყოფნის წესი',
    cautionTitle: 'შესაძლო ყოფნა უნდა გადაამოწმოთ უფლებამოსილ ორგანოსთან',
    matchCopy: 'ოფიციალური მითითება შესაძლო შესაბამისობას აჩვენებს: ჩვეულებრივი პასპორტი — {passportCountry}; გასვლის ქვეყანა — {exitCountry}.',
    conditionsCopy: 'ეს მნიშვნელოვანია მხოლოდ მაშინ, თუ რჩებით ამ ქვეყანაში, ასრულებთ საჭირო პროცედურას და შენგენს პირდაპირ ამ ქვეყნის გარე საზღვრიდან ტოვებთ.',
    authorityCaution: 'შეიძლება მოქმედებდეს უფლებამოსილების, ხანგრძლივობისა და პროცედურის სხვა პირობებიც. ამ შესაძლებლობაზე დაყრდნობამდე გადაამოწმეთ ისინი კომპეტენტურ ორგანოსთან.',
    unchangedCopy: 'SCHNGN-ს დღეები არ დაუმატებია. ჩვეულებრივი 90/180 შედეგი უცვლელია.',
    officialSource: 'ოფიციალური მითითების გახსნა',
    opensNewTab: 'იხსნება ახალ ჩანართში'
  },
  'zh-cn': {
    passportLabel: '您将使用哪一本普通护照？',
    passportHelp: '请选择签发该护照的国家或司法管辖区。此答案仅用于本次预览，不会保存。',
    choosePassport: '如有需要请选择',
    confirmExitCountry: '我计划经由该国离开申根区',
    potentialTitle: '可能适用特定国家的停留安排',
    cautionTitle: '可能的停留安排需要向主管机关确认',
    matchCopy: '官方指引显示可能匹配：普通护照 — {passportCountry}；离境国家 — {exitCountry}。',
    conditionsCopy: '仅当您留在该国、完成所有必要程序，并直接从该国的申根外部边境离境时才可能相关。',
    authorityCaution: '还可能适用其他资格、停留期限和程序条件。在据此安排行程前，请向主管机关确认。',
    unchangedCopy: 'SCHNGN 未增加任何天数。普通的 90/180 结果保持不变。',
    officialSource: '打开官方指引',
    opensNewTab: '在新标签页中打开'
  },
  ja: {
    passportLabel: 'どの一般旅券を使用しますか？',
    passportHelp: '旅券を発行した国または法域を選んでください。この回答は今回のプレビューにのみ使用され、保存されません。',
    choosePassport: '必要な場合に選択',
    confirmExitCountry: 'この国からシェンゲン圏を出る予定です',
    potentialTitle: '国別の滞在制度が適用される可能性があります',
    cautionTitle: '滞在の可能性は当局への確認が必要です',
    matchCopy: '公式案内に該当する可能性があります：一般旅券 — {passportCountry}、出国する国 — {exitCountry}。',
    conditionsCopy: 'その国にとどまり、必要な手続きを完了し、その国のシェンゲン外部国境から直接出国する場合にのみ関係します。',
    authorityCaution: 'このほかにも、資格、期間、手続きに関する条件が適用される場合があります。これを前提にする前に、所管当局へ確認してください。',
    unchangedCopy: 'SCHNGN は日数を追加していません。通常の 90/180 の結果は変わりません。',
    officialSource: '公式案内を開く',
    opensNewTab: '新しいタブで開きます'
  },
  ko: {
    passportLabel: '어떤 일반 여권을 사용하시나요?',
    passportHelp: '여권을 발급한 국가 또는 관할권을 선택하세요. 이 답변은 이번 미리보기에만 사용되며 저장되지 않습니다.',
    choosePassport: '필요한 경우 선택',
    confirmExitCountry: '이 국가를 통해 솅겐 지역을 떠날 예정입니다',
    potentialTitle: '국가별 체류 제도가 적용될 수 있습니다',
    cautionTitle: '가능한 체류는 관계 당국의 확인이 필요합니다',
    matchCopy: '공식 안내상 일치 가능성이 있습니다: 일반 여권 — {passportCountry}; 출국 국가 — {exitCountry}.',
    conditionsCopy: '그 국가에 머물고 필요한 절차를 완료한 뒤 해당 국가의 솅겐 외부 국경을 통해 직접 출국하는 경우에만 관련됩니다.',
    authorityCaution: '그 밖의 자격, 기간 및 절차 조건이 적용될 수 있습니다. 이에 의존하기 전에 관계 당국에 확인하세요.',
    unchangedCopy: 'SCHNGN은 어떤 일수도 추가하지 않았습니다. 일반 90/180 결과는 그대로입니다.',
    officialSource: '공식 안내 열기',
    opensNewTab: '새 탭에서 열림'
  },
  he: {
    passportLabel: 'באיזה דרכון רגיל תשתמשו?',
    passportHelp: 'בחרו את המדינה או את תחום השיפוט שבהם הונפק הדרכון. התשובה משמשת רק לתצוגה המקדימה הזאת ואינה נשמרת.',
    choosePassport: 'בחרו אם שימושי',
    confirmExitCountry: 'בכוונתי לצאת מאזור שנגן דרך המדינה הזאת',
    potentialTitle: 'ייתכן שיחול הסדר שהייה של מדינה מסוימת',
    cautionTitle: 'יש לאשר את אפשרות השהייה מול הרשות המוסמכת',
    matchCopy: 'ההנחיות הרשמיות מצביעות על התאמה אפשרית: דרכון רגיל — {passportCountry}; מדינת יציאה — {exitCountry}.',
    conditionsCopy: 'הדבר רלוונטי רק אם נשארים באותה מדינה, משלימים כל הליך נדרש ויוצאים משנגן ישירות דרך הגבול החיצוני של אותה מדינה.',
    authorityCaution: 'ייתכנו תנאים נוספים בנוגע לזכאות, למשך השהייה ולהליך. לפני שמסתמכים על האפשרות הזאת, יש לאשר אותם מול הרשות המוסמכת.',
    unchangedCopy: 'SCHNGN לא הוסיף ימים. תוצאת 90/180 הרגילה לא השתנתה.',
    officialSource: 'פתיחת ההנחיות הרשמיות',
    opensNewTab: 'נפתח בכרטיסייה חדשה'
  },
  ar: {
    passportLabel: 'أي جواز سفر عادي ستستخدم؟',
    passportHelp: 'اختر الدولة أو الإقليم الذي أصدر جواز السفر. تُستخدم الإجابة لهذه المعاينة فقط ولا تُحفظ.',
    choosePassport: 'اختر إذا كان ذلك مفيدًا',
    confirmExitCountry: 'أخطط لمغادرة منطقة شنغن عبر هذه الدولة',
    potentialTitle: 'قد ينطبق ترتيب إقامة خاص بالدولة',
    cautionTitle: 'يجب تأكيد الإقامة المحتملة مع السلطة المختصة',
    matchCopy: 'تشير الإرشادات الرسمية إلى تطابق محتمل: جواز السفر العادي — {passportCountry}؛ دولة المغادرة — {exitCountry}.',
    conditionsCopy: 'يكون ذلك ذا صلة فقط إذا بقيت في تلك الدولة، وأكملت أي إجراء مطلوب، وغادرت شنغن مباشرة عبر الحدود الخارجية لتلك الدولة.',
    authorityCaution: 'قد تنطبق شروط أخرى للأهلية والمدة والإجراءات. أكّدها مع السلطة المختصة قبل الاعتماد على هذه الإمكانية.',
    unchangedCopy: 'لم يضف SCHNGN أي أيام. تظل نتيجة 90/180 العادية دون تغيير.',
    officialSource: 'فتح الإرشادات الرسمية',
    opensNewTab: 'يفتح في علامة تبويب جديدة'
  }
};

export function createBilateralUiTranslator(
  locale: Locale
): (key: BilateralUiKey, values?: Record<string, string | number>) => string {
  return (key, values = {}) =>
    catalogs[locale][key].replace(
      /\{([a-zA-Z0-9_]+)\}/g,
      (match, name: string) => String(values[name] ?? match)
    );
}

export function bilateralUiCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(catalogs[locale]).length])
  ) as Record<Locale, number>;
}
