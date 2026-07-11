import type { Locale } from './locales';

const catalogs = {
  en: { title: 'Keep your trips for next time', copy: 'Create an account to save your trip history for future 90/180 calculations and use it on another device. Nothing is uploaded until you choose sync.', button: 'Create account' },
  fr: { title: 'Retrouvez vos voyages la prochaine fois', copy: 'Créez un compte pour conserver votre historique pour de futurs calculs 90/180 et l’utiliser sur un autre appareil. Rien n’est envoyé avant votre accord de synchronisation.', button: 'Créer un compte' },
  de: { title: 'Reisen für die nächste Berechnung behalten', copy: 'Erstellen Sie ein Konto, um Ihren Reiseverlauf für künftige 90/180-Berechnungen und auf anderen Geräten zu speichern. Erst nach Ihrer Sync-Zustimmung wird etwas hochgeladen.', button: 'Konto erstellen' },
  es: { title: 'Conserva tus viajes para la próxima vez', copy: 'Crea una cuenta para guardar tu historial para futuros cálculos de 90/180 días y usarlo en otro dispositivo. Nada se sube hasta que elijas sincronizar.', button: 'Crear cuenta' },
  it: { title: 'Conserva i viaggi per la prossima volta', copy: 'Crea un account per salvare la cronologia per i prossimi calcoli 90/180 e usarla su un altro dispositivo. Nulla viene caricato finché non scegli la sincronizzazione.', button: 'Crea account' },
  ru: { title: 'Сохраните поездки для будущих расчётов', copy: 'Создайте аккаунт, чтобы сохранить историю поездок для следующих расчётов 90/180 и использовать её на другом устройстве. Данные не отправляются, пока вы не включите синхронизацию.', button: 'Создать аккаунт' },
  tr: { title: 'Seyahatlerinizi sonraki hesaplamalar için saklayın', copy: 'Gelecekteki 90/180 hesaplamalarında ve başka bir cihazda kullanmak üzere seyahat geçmişinizi kaydetmek için hesap oluşturun. Eşitlemeyi seçene kadar hiçbir veri yüklenmez.', button: 'Hesap oluştur' },
  he: { title: 'שמרו את הנסיעות לחישובים הבאים', copy: 'צרו חשבון כדי לשמור את היסטוריית הנסיעות לחישובי 90/180 עתידיים ולהשתמש בה במכשיר אחר. דבר לא יועלה עד שתבחרו לסנכרן.', button: 'יצירת חשבון' },
  ar: { title: 'احتفظ برحلاتك للحسابات القادمة', copy: 'أنشئ حسابًا لحفظ سجل رحلاتك لحسابات 90/180 المستقبلية واستخدامه على جهاز آخر. لن يُرفع شيء حتى تختار المزامنة.', button: 'إنشاء حساب' }
} satisfies Record<Locale, Record<'title' | 'copy' | 'button', string>>;

export type SignupValueUiKey = keyof (typeof catalogs)['en'];

export function createSignupValueUiTranslator(locale: Locale): (key: SignupValueUiKey) => string {
  return (key) => catalogs[locale][key];
}

export function signupValueCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(Object.entries(catalogs).map(([locale, catalog]) => [locale, Object.keys(catalog).length])) as Record<Locale, number>;
}
