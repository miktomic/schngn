import { localizedLegalCopy } from '$lib/legal/legalCopy';
import type { Locale } from './locales';

export interface LegalFooterCopy {
  navigation: string;
  resources: string;
  agents: string;
  privacy: string;
  terms: string;
  contact: string;
  disclaimer: string;
  copyright: string;
}

const resourceLabels: Record<Locale, Pick<LegalFooterCopy, 'resources' | 'agents'>> = {
  en: { resources: 'Resources', agents: 'For agents' },
  fr: { resources: 'Ressources', agents: 'Pour les agents' },
  de: { resources: 'Ressourcen', agents: 'Für Agenten' },
  es: { resources: 'Recursos', agents: 'Para agentes' },
  it: { resources: 'Risorse', agents: 'Per gli agenti' },
  'pt-br': { resources: 'Recursos', agents: 'Para agentes' },
  ru: { resources: 'Ресурсы', agents: 'Для агентов' },
  uk: { resources: 'Ресурси', agents: 'Для агентів' },
  tr: { resources: 'Kaynaklar', agents: 'Ajanlar için' },
  sr: { resources: 'Resursi', agents: 'Za agente' },
  sq: { resources: 'Burime', agents: 'Për agjentët' },
  ka: { resources: 'რესურსები', agents: 'აგენტებისთვის' },
  'zh-cn': { resources: '资源', agents: '面向智能体' },
  ja: { resources: 'リソース', agents: 'エージェント向け' },
  ko: { resources: '리소스', agents: '에이전트용' },
  he: { resources: 'משאבים', agents: 'לסוכנים' },
  ar: { resources: 'الموارد', agents: 'للوكلاء' }
};

const labels: Record<Locale, Omit<LegalFooterCopy, 'resources' | 'agents' | 'disclaimer' | 'copyright'>> = {
  en: { navigation: 'Legal and support', privacy: 'Privacy Policy', terms: 'Terms of Service', contact: 'Support center' },
  fr: { navigation: 'Mentions légales et assistance', privacy: 'Politique de confidentialité', terms: 'Conditions d’utilisation', contact: 'Centre d’assistance' },
  de: { navigation: 'Rechtliches und Support', privacy: 'Datenschutzerklärung', terms: 'Nutzungsbedingungen', contact: 'Support' },
  es: { navigation: 'Información legal y asistencia', privacy: 'Política de privacidad', terms: 'Términos del servicio', contact: 'Centro de ayuda' },
  it: { navigation: 'Informazioni legali e assistenza', privacy: 'Informativa sulla privacy', terms: 'Termini di servizio', contact: 'Centro assistenza' },
  'pt-br': { navigation: 'Informações legais e suporte', privacy: 'Política de Privacidade', terms: 'Termos de Serviço', contact: 'Central de suporte' },
  ru: { navigation: 'Правовая информация и поддержка', privacy: 'Политика конфиденциальности', terms: 'Условия использования', contact: 'Центр поддержки' },
  uk: { navigation: 'Правова інформація та підтримка', privacy: 'Політика конфіденційності', terms: 'Умови використання', contact: 'Центр підтримки' },
  tr: { navigation: 'Yasal bilgiler ve destek', privacy: 'Gizlilik Politikası', terms: 'Hizmet Koşulları', contact: 'Destek merkezi' },
  sr: { navigation: 'Pravne informacije i podrška', privacy: 'Politika privatnosti', terms: 'Uslovi korišćenja', contact: 'Centar za podršku' },
  sq: { navigation: 'Informacion ligjor dhe mbështetje', privacy: 'Politika e privatësisë', terms: 'Kushtet e shërbimit', contact: 'Qendra e mbështetjes' },
  ka: { navigation: 'იურიდიული ინფორმაცია და მხარდაჭერა', privacy: 'კონფიდენციალურობის პოლიტიკა', terms: 'მომსახურების პირობები', contact: 'მხარდაჭერის ცენტრი' },
  'zh-cn': { navigation: '法律信息与支持', privacy: '隐私政策', terms: '服务条款', contact: '支持中心' },
  ja: { navigation: '法的情報とサポート', privacy: 'プライバシーポリシー', terms: '利用規約', contact: 'サポートセンター' },
  ko: { navigation: '법률 정보 및 지원', privacy: '개인정보 처리방침', terms: '서비스 이용약관', contact: '지원 센터' },
  he: { navigation: 'מידע משפטי ותמיכה', privacy: 'מדיניות פרטיות', terms: 'תנאי השירות', contact: 'מרכז התמיכה' },
  ar: { navigation: 'المعلومات القانونية والدعم', privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة', contact: 'مركز الدعم' }
};

const copyrightLabels: Record<Locale, string> = {
  en: '© 2026 SCHNGN. All rights reserved.',
  fr: '© 2026 SCHNGN. Tous droits réservés.',
  de: '© 2026 SCHNGN. Alle Rechte vorbehalten.',
  es: '© 2026 SCHNGN. Todos los derechos reservados.',
  it: '© 2026 SCHNGN. Tutti i diritti riservati.',
  'pt-br': '© 2026 SCHNGN. Todos os direitos reservados.',
  ru: '© 2026 SCHNGN. Все права защищены.',
  uk: '© 2026 SCHNGN. Усі права захищено.',
  tr: '© 2026 SCHNGN. Tüm hakları saklıdır.',
  sr: '© 2026 SCHNGN. Sva prava zadržana.',
  sq: '© 2026 SCHNGN. Të gjitha të drejtat e rezervuara.',
  ka: '© 2026 SCHNGN. ყველა უფლება დაცულია.',
  'zh-cn': '© 2026 SCHNGN。保留所有权利。',
  ja: '© 2026 SCHNGN。すべての権利を留保します。',
  ko: '© 2026 SCHNGN. 모든 권리 보유.',
  he: '© 2026 SCHNGN. כל הזכויות שמורות.',
  ar: '© 2026 SCHNGN. جميع الحقوق محفوظة.'
};

export function legalFooterUi(locale: Locale): LegalFooterCopy {
  return {
    ...labels[locale],
    ...resourceLabels[locale],
    disclaimer: localizedLegalCopy(locale).footer,
    copyright: copyrightLabels[locale]
  };
}
