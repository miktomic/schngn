import type { Locale } from './locales';

export interface SiteHeaderCatalog {
  navigation: string;
  calculator: string;
  explainer: string;
  faq: string;
  contact: string;
  account: string;
  signUp: string;
  signUpAndSave: string;
  login: string;
  logout: string;
  accountError: string;
}

const catalogs: Record<Locale, SiteHeaderCatalog> = {
  en: { navigation: 'Main navigation', calculator: 'Calculator', explainer: 'Explainer', faq: 'FAQs', contact: 'Contact', account: 'Account', signUp: 'Sign up', signUpAndSave: 'Sign up & save', login: 'Log in', logout: 'Log out', accountError: 'Account controls are temporarily unavailable.' },
  fr: { navigation: 'Navigation principale', calculator: 'Calculateur', explainer: 'Explication', faq: 'FAQ', contact: 'Contact', account: 'Compte', signUp: 'Créer un compte', signUpAndSave: 'Créer un compte et enregistrer', login: 'Se connecter', logout: 'Se déconnecter', accountError: 'Les contrôles du compte sont temporairement indisponibles.' },
  de: { navigation: 'Hauptnavigation', calculator: 'Rechner', explainer: 'Erklärung', faq: 'FAQs', contact: 'Kontakt', account: 'Konto', signUp: 'Registrieren', signUpAndSave: 'Registrieren und speichern', login: 'Anmelden', logout: 'Abmelden', accountError: 'Die Kontofunktionen sind vorübergehend nicht verfügbar.' },
  es: { navigation: 'Navegación principal', calculator: 'Calculadora', explainer: 'Explicación', faq: 'Preguntas', contact: 'Contacto', account: 'Cuenta', signUp: 'Registrarse', signUpAndSave: 'Registrarse y guardar', login: 'Iniciar sesión', logout: 'Cerrar sesión', accountError: 'Los controles de la cuenta no están disponibles temporalmente.' },
  it: { navigation: 'Navigazione principale', calculator: 'Calcolatore', explainer: 'Spiegazione', faq: 'FAQ', contact: 'Contatti', account: 'Account', signUp: 'Registrati', signUpAndSave: 'Registrati e salva', login: 'Accedi', logout: 'Esci', accountError: 'I controlli dell’account non sono temporaneamente disponibili.' },
  'pt-br': { navigation: 'Navegação principal', calculator: 'Calculadora', explainer: 'Explicação', faq: 'Perguntas', contact: 'Contato', account: 'Conta', signUp: 'Criar conta', signUpAndSave: 'Criar conta e salvar', login: 'Entrar', logout: 'Sair', accountError: 'Os controles da conta estão temporariamente indisponíveis.' },
  ru: { navigation: 'Основная навигация', calculator: 'Калькулятор', explainer: 'Объяснение', faq: 'Вопросы', contact: 'Контакты', account: 'Аккаунт', signUp: 'Регистрация', signUpAndSave: 'Регистрация и сохранение', login: 'Войти', logout: 'Выйти', accountError: 'Управление аккаунтом временно недоступно.' },
  uk: { navigation: 'Основна навігація', calculator: 'Калькулятор', explainer: 'Пояснення', faq: 'Запитання', contact: 'Контакти', account: 'Обліковий запис', signUp: 'Реєстрація', signUpAndSave: 'Зареєструватися і зберегти', login: 'Увійти', logout: 'Вийти', accountError: 'Керування обліковим записом тимчасово недоступне.' },
  tr: { navigation: 'Ana gezinme', calculator: 'Hesaplayıcı', explainer: 'Açıklama', faq: 'SSS', contact: 'İletişim', account: 'Hesap', signUp: 'Kaydol', signUpAndSave: 'Kaydol ve kaydet', login: 'Giriş yap', logout: 'Çıkış yap', accountError: 'Hesap kontrolleri geçici olarak kullanılamıyor.' },
  sr: { navigation: 'Glavna navigacija', calculator: 'Kalkulator', explainer: 'Objašnjenje', faq: 'Pitanja', contact: 'Kontakt', account: 'Nalog', signUp: 'Registruj se', signUpAndSave: 'Registruj se i sačuvaj', login: 'Prijavi se', logout: 'Odjavi se', accountError: 'Kontrole naloga trenutno nisu dostupne.' },
  sq: { navigation: 'Navigimi kryesor', calculator: 'Llogaritësi', explainer: 'Shpjegimi', faq: 'Pyetje', contact: 'Kontakt', account: 'Llogaria', signUp: 'Regjistrohu', signUpAndSave: 'Regjistrohu dhe ruaj', login: 'Hyr', logout: 'Dil', accountError: 'Kontrollet e llogarisë nuk janë përkohësisht të disponueshme.' },
  ka: { navigation: 'მთავარი ნავიგაცია', calculator: 'კალკულატორი', explainer: 'განმარტება', faq: 'კითხვები', contact: 'კონტაქტი', account: 'ანგარიში', signUp: 'რეგისტრაცია', signUpAndSave: 'რეგისტრაცია და შენახვა', login: 'შესვლა', logout: 'გასვლა', accountError: 'ანგარიშის მართვა დროებით მიუწვდომელია.' },
  'zh-cn': { navigation: '主导航', calculator: '计算器', explainer: '规则说明', faq: '常见问题', contact: '联系', account: '账户', signUp: '注册', signUpAndSave: '注册并保存', login: '登录', logout: '退出', accountError: '账户功能暂时不可用。' },
  ja: { navigation: 'メインナビゲーション', calculator: '計算ツール', explainer: 'ルール説明', faq: 'よくある質問', contact: 'お問い合わせ', account: 'アカウント', signUp: '登録', signUpAndSave: '登録して保存', login: 'ログイン', logout: 'ログアウト', accountError: 'アカウント機能は一時的に利用できません。' },
  ko: { navigation: '기본 탐색', calculator: '계산기', explainer: '규칙 설명', faq: '자주 묻는 질문', contact: '문의', account: '계정', signUp: '가입', signUpAndSave: '가입하고 저장', login: '로그인', logout: '로그아웃', accountError: '계정 기능을 일시적으로 사용할 수 없습니다.' },
  he: { navigation: 'ניווט ראשי', calculator: 'מחשבון', explainer: 'הסבר', faq: 'שאלות נפוצות', contact: 'יצירת קשר', account: 'חשבון', signUp: 'הרשמה', signUpAndSave: 'הרשמה ושמירה', login: 'כניסה', logout: 'יציאה', accountError: 'בקרות החשבון אינן זמינות כרגע.' },
  ar: { navigation: 'التنقل الرئيسي', calculator: 'الحاسبة', explainer: 'الشرح', faq: 'الأسئلة الشائعة', contact: 'اتصل بنا', account: 'الحساب', signUp: 'إنشاء حساب', signUpAndSave: 'إنشاء حساب وحفظ', login: 'تسجيل الدخول', logout: 'تسجيل الخروج', accountError: 'عناصر التحكم في الحساب غير متاحة مؤقتًا.' }
};

export function siteHeaderUi(locale: Locale): SiteHeaderCatalog {
  return catalogs[locale];
}
