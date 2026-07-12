import { SUPPORTED_LOCALES, type Locale } from './locales';
import { translateExtended } from './extendedLocaleStrings';

type SignupCatalog = Record<'title' | 'copy' | 'button' | 'compactButton', string>;

const catalogs: Partial<Record<Locale, SignupCatalog>> & { en: SignupCatalog } = {
  en: { title: 'Keep your trips for next time', copy: 'Create an account to save your current trip history in your SCHNGN account for future 90/180 calculations and access on another device.', button: 'Create account & save trips', compactButton: 'Sign up & save' },
  fr: { title: 'Retrouvez vos voyages la prochaine fois', copy: 'Créez un compte pour enregistrer votre historique actuel dans votre compte SCHNGN, le réutiliser pour de futurs calculs 90/180 et y accéder sur un autre appareil.', button: 'Créer un compte et enregistrer', compactButton: 'S’inscrire et enregistrer' },
  de: { title: 'Reisen für die nächste Berechnung behalten', copy: 'Erstellen Sie ein Konto, um Ihren aktuellen Reiseverlauf im SCHNGN-Konto für künftige 90/180-Berechnungen und andere Geräte zu speichern.', button: 'Konto erstellen und Reisen speichern', compactButton: 'Registrieren und speichern' },
  es: { title: 'Conserva tus viajes para la próxima vez', copy: 'Crea una cuenta para guardar tu historial actual en tu cuenta SCHNGN, usarlo en futuros cálculos de 90/180 días y acceder desde otro dispositivo.', button: 'Crear cuenta y guardar viajes', compactButton: 'Registrarse y guardar' },
  it: { title: 'Conserva i viaggi per la prossima volta', copy: 'Crea un account per salvare la cronologia attuale nel tuo account SCHNGN, riutilizzarla nei prossimi calcoli 90/180 e accedervi da un altro dispositivo.', button: 'Crea account e salva i viaggi', compactButton: 'Registrati e salva' },
  ru: { title: 'Сохраните поездки для будущих расчётов', copy: 'Создайте аккаунт, чтобы сохранить текущую историю поездок в SCHNGN для следующих расчётов 90/180 и доступа с другого устройства.', button: 'Создать аккаунт и сохранить поездки', compactButton: 'Регистрация и сохранение' },
  tr: { title: 'Seyahatlerinizi sonraki hesaplamalar için saklayın', copy: 'Mevcut seyahat geçmişinizi gelecekteki 90/180 hesaplamaları ve başka cihazlardan erişim için SCHNGN hesabınıza kaydetmek üzere hesap oluşturun.', button: 'Hesap oluştur ve seyahatleri kaydet', compactButton: 'Kaydol ve kaydet' },
  he: { title: 'שמרו את הנסיעות לחישובים הבאים', copy: 'צרו חשבון כדי לשמור את היסטוריית הנסיעות הנוכחית בחשבון SCHNGN לחישובי 90/180 עתידיים ולגישה ממכשיר אחר.', button: 'יצירת חשבון ושמירת נסיעות', compactButton: 'הרשמה ושמירה' },
  ar: { title: 'احتفظ برحلاتك للحسابات القادمة', copy: 'أنشئ حسابًا لحفظ سجل رحلاتك الحالي في حساب SCHNGN لاستخدامه في حسابات 90/180 المستقبلية والوصول إليه من جهاز آخر.', button: 'إنشاء حساب وحفظ الرحلات', compactButton: 'التسجيل والحفظ' }
};

export type SignupValueUiKey = keyof (typeof catalogs)['en'];

export function createSignupValueUiTranslator(locale: Locale): (key: SignupValueUiKey) => string {
  return (key) => catalogs[locale]?.[key] ?? translateExtended(locale, catalogs.en[key]);
}

export function signupValueCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, Object.keys(catalogs.en).length])) as Record<Locale, number>;
}
