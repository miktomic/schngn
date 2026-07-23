import type { Locale } from './locales';
import { easternLegalCatalogs } from './legalUiEastern';
import { westernLegalCatalogs } from './legalUiWestern';

export interface LegalSectionCopy {
  id: string;
  title: string;
  paragraphs: string[];
  items?: string[];
}

export interface LegalProviderLink {
  label: string;
  url: string;
}

export interface LegalPageCopy {
  navLabel: string;
  title: string;
  metaDescription: string;
  intro: string;
  updatedLabel: string;
  updatedDate: string;
  summaryTitle: string;
  summaryItems: string[];
  sections: LegalSectionCopy[];
  contactTitle: string;
  contactBody: string;
  contactLinkLabel: string;
  providerLinksTitle?: string;
  providerLinks?: LegalProviderLink[];
}

export interface LegalFooterCopy {
  navigation: string;
  privacy: string;
  terms: string;
  contact: string;
  disclaimer: string;
  copyright: string;
}

export interface LegalLocaleCatalog {
  footer: LegalFooterCopy;
  privacy: LegalPageCopy;
  terms: LegalPageCopy;
}

const UPDATED_DATE = '2026-07-14';

const providerLinks: LegalProviderLink[] = [
  { label: 'Cloudflare Privacy Policy', url: 'https://www.cloudflare.com/privacypolicy/' },
  { label: 'Clerk Privacy Policy', url: 'https://clerk.com/legal/privacy' },
  { label: 'Google Privacy Policy', url: 'https://policies.google.com/privacy' },
  { label: 'Plausible Data Policy', url: 'https://plausible.io/data-policy' },
  { label: 'Proton Privacy Policy', url: 'https://proton.me/legal/privacy' }
];

const englishCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Legal and support',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    disclaimer: 'Planning aid only — not legal advice or a guarantee of entry. Verify with official sources.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Privacy policy sections',
    title: 'Privacy Policy',
    metaDescription: 'How SCHNGN handles local trip data, optional account sync, Google sign-in, analytics, support requests and your privacy choices.',
    intro: 'SCHNGN is designed to calculate travel plans without requiring an account. This policy explains what stays in your browser, what is processed when you choose optional online features, and the controls available to you.',
    updatedLabel: 'Last updated',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'The short version',
    summaryItems: [
      'Guest trip details stay in your browser unless you explicitly choose account sync.',
      'Google sign-in is used to create, secure, authenticate and identify an optional SCHNGN account and to associate trips you choose to save.',
      'Plausible may receive coarse usage and result categories, but never your trip dates, labels, countries, email or account ID.',
      'You can export the current browser trip copy and delete the active trip snapshot saved to your account.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. What this policy covers',
        paragraphs: [
          'This policy covers schngn.com, the SCHNGN web app and its account, synchronization, analytics and support features. SCHNGN is a planning calculator and does not request GPS access, scan passports, or collect visa and residence-document numbers as part of its normal features.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Who is responsible and why data is processed',
        paragraphs: [
          'SCHNGN operates schngn.com and is responsible for the application-specific processing described here. Contact support@schngn.com with privacy questions. We process account, synchronization and support data to provide features you request; limited analytics and security data to understand and protect the service; consent-based data where consent is required; and data needed to meet applicable legal obligations.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Guest use and browser storage',
        paragraphs: [
          'When you use SCHNGN as a guest, trip dates, labels, optional border-country context, stay ranges, status and calculation results remain in your browser. Calculations and unsaved simulations run on your device. The optional passport question uses only the issuing country in temporary browser memory to show a possible bilateral-agreement notice; it is not saved with trips or sent to analytics. Browser storage also keeps functional preferences such as language and the previous-travel answer; public app files may be cached for offline use. A JSON backup is created and read locally under your control and is not uploaded merely because you export or import it.'
        ],
        items: [
          'Browser trip storage remains until you clear it, replace it, or clear site data.',
          'The language preference cookie lasts up to one year.',
          'Local JSON backups are plain files; you are responsible for storing them securely.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Optional accounts and Google sign-in',
        paragraphs: [
          'Clerk loads on public SCHNGN pages to check whether you are signed in and may process essential session, device and network data under its privacy policy. If you choose Google sign-in, Google sends your basic identity data and OAuth response to Clerk. Clerk handles the provider credentials or tokens and the account session under its policy. SCHNGN receives the resulting Clerk session and user ID to identify the active account, show your signed-in state and email, and associate trips you explicitly choose to save. Only the Clerk user ID—not your Google email, name, profile image, password or provider tokens—is stored in Cloudflare D1 with those trips. SCHNGN does not request Gmail, Google Drive, Calendar, contacts or other Google content, and does not sell Google user data or use it for advertising.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Optional trip sync, export and deletion',
        paragraphs: [
          'Completing a clearly labelled sign-up-and-save action, or separately enabling sync while signed in, sends the current validated trip snapshot to Cloudflare D1. That snapshot includes the verified Clerk user ID, full saved trip details, revision and consent metadata, and timestamps. Once enabled, later saved edits or imports can synchronize. The browser also stores the Clerk user ID, server revision, sync state and a trip fingerprint for reconciliation, while a sign-up-and-save choice is held temporarily in session storage. This sync metadata is not part of the trip JSON export; it is removed by the “sign out and clear this browser” action or when you clear site data. The JSON export contains the current browser trip copy, not all identity, support, log or provider-held data. “Delete saved account trips” removes the active D1 snapshot but does not delete browser trips or the Clerk account. Deleting the Clerk account triggers cleanup of the snapshot and creates a one-way hashed account-deletion guard that is active for 30 days to block stale-session re-creation; after that it is ignored and purged opportunistically.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Aggregate analytics',
        paragraphs: [
          'On the production site, Plausible may receive allowlisted events such as page view, calculator start, trip added and simulation run, together with coarse categories such as trip-count range, verdict, safe-buffer range or source. SCHNGN strips query strings and hashes and prohibits trip dates, labels, countries, timelines, passport choice, email and account identifiers. Plausible analytics is configured without analytics cookies or automatic form, download and outbound-link tracking. Ordinary network information may still be processed by Plausible to produce aggregate statistics.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Support, security and technical data',
        paragraphs: [
          'If you contact us, SCHNGN sends your request type, optional name, email address, message and selected language through Cloudflare email services to our Proton support mailbox. Trip history is never attached automatically, although anything you type into the message will be received. Separately, the browser sends a Turnstile token for verification; that token is not included in the support email. Cloudflare uses the connecting IP address for rate limiting and Turnstile verification and processes ordinary request, device, browser, security and error metadata when delivering and protecting the site. SCHNGN does not use Sentry and its application logs must not contain trip bodies, account emails or Clerk user IDs.'
        ]
      },
      {
        id: 'providers',
        title: '8. Service providers and international processing',
        paragraphs: [
          'SCHNGN uses Cloudflare for hosting, storage, security and email delivery; Clerk for identity and sessions; Google only when you choose Google sign-in; Plausible for restricted aggregate analytics; and Proton for the support mailbox. These providers may process data in countries outside your own. Their published notices describe their locations, retention and transfer safeguards. We share data only as needed to provide these functions, protect the service, follow your instructions, or comply with law; we do not sell personal data.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Retention, deletion and security',
        paragraphs: [
          'Browser data remains until you or your browser removes it. Active synchronized trips remain until replaced or deleted. Support messages remain in the Proton mailbox until SCHNGN deletes them; no fixed deletion period is currently promised, and they should be removed when no longer reasonably needed for follow-up, service protection, disputes or applicable obligations. Provider backups, operational records, account data and aggregate analytics follow the providers’ configured retention schedules and may take time to expire after active data is deleted. SCHNGN uses access controls, validated inputs, authenticated ownership and encrypted HTTPS connections, but no online or local storage method is completely secure.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Your choices, rights and policy changes',
        paragraphs: [
          'You can use the calculator without an account, clear browser data, export browser trips, delete the active account trip snapshot, or manage and delete your Clerk account. Depending on the law that applies, you may ask for access, correction, deletion, restriction or portability, object to certain processing, withdraw consent where consent is the basis, and complain to your local data-protection authority. Providing account or support data is optional, but those features cannot work without it. SCHNGN does not make legally significant automated decisions: calculator results are planning estimates. We will update this page before materially changing how data is used.'
        ]
      }
    ],
    contactTitle: 'Privacy questions or requests',
    contactBody: 'Email support@schngn.com. Please describe the request without sending passport, visa or other sensitive document numbers. We may need to verify an account request before acting on it.',
    contactLinkLabel: 'Contact SCHNGN support',
    providerLinksTitle: 'Provider privacy information',
    providerLinks
  },
  terms: {
    navLabel: 'Terms sections',
    title: 'Terms of Use',
    metaDescription: 'The terms for using the SCHNGN Schengen 90/180-day calculator, local trip storage and optional account features.',
    intro: 'These Terms govern your use of schngn.com and the SCHNGN web app. They are written to preserve the product’s central promise: a useful planning tool with transparent limits and optional accounts.',
    updatedLabel: 'Last updated',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'The essentials',
    summaryItems: [
      'The calculator is available without an account; saving trips online is optional.',
      'SCHNGN is a planning aid, not legal advice or a guarantee of entry.',
      'You are responsible for accurate dates and for checking official sources before travelling.',
      'Use the service lawfully and keep any account access secure.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Using SCHNGN',
        paragraphs: [
          'By using SCHNGN, you agree to these Terms and the Privacy Policy. You may use the calculator as a guest. If you create an account, you must be legally able to agree to these Terms; anyone who lacks that capacity should use SCHNGN only with a parent, guardian or other authorized person. If you do not agree, do not use the service.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Planning aid only',
        paragraphs: [
          'SCHNGN estimates ordinary short stays under the Schengen 90/180-day rule. It is not legal or immigration advice and not a guarantee of entry, lawful stay or any decision by a border, visa or immigration authority. It may not account for residence permits, long-stay or national visas, bilateral waiver agreements, nationality-specific exceptions, work, study, asylum or temporary-protection status, rule transitions or official discretion. A passport- or country-specific notice about a possible bilateral arrangement is informational and does not change the core calculation or determine that an extension applies. Verify your situation with official sources and the relevant authorities before booking or travelling.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Your responsibilities',
        paragraphs: [
          'You are responsible for entering complete and accurate dates, interpreting the result in light of your own status, keeping backups you need, and independently checking current rules. Entry and exit evidence, visa conditions and authority instructions take priority over SCHNGN. Do not rely on a cached, exported or previously calculated result after your plans or the applicable rules change.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Local storage, accounts and synchronization',
        paragraphs: [
          'Guest trips are stored in your browser and may be lost if site data is cleared, the device fails or another person changes the browser profile. Optional accounts are provided through Clerk. A labelled sign-up-and-save action or separate sync choice authorizes SCHNGN to store the validated trip snapshot for that account. Keep account access secure, sign out and clear browser data on shared devices when appropriate, and review the Privacy Policy for export, deletion and provider details.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Acceptable use',
        paragraphs: [
          'Do not misuse SCHNGN, interfere with its operation or security, probe or bypass access controls, submit unlawful or harmful material, automate abusive traffic, impersonate another person, access another account, or use the service to facilitate fraud or unlawful travel. Reasonable security testing requires prior written permission. We may restrict access needed to stop misuse, protect users or comply with law.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. SCHNGN content and third-party services',
        paragraphs: [
          'The SCHNGN name, design, software and original content are protected by applicable intellectual-property laws. These Terms give you a limited, revocable, non-exclusive right to use the service for personal planning; they do not transfer ownership. Official-source links, Clerk, Google, Cloudflare, Plausible and other third-party services have their own terms and policies. SCHNGN is not an EU institution and is not endorsed or certified by the European Union.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Availability and changes',
        paragraphs: [
          'We aim to keep SCHNGN accurate and available, but the service may be interrupted, delayed or changed. Features, providers, supported rules or free availability may change, and we may correct or remove content. Where reasonably possible, material changes affecting saved account data will be explained before they take effect. Keep independent records for any travel decision that matters to you.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Disclaimers and liability',
        paragraphs: [
          'To the fullest extent permitted by law, SCHNGN is provided “as is” and “as available” without a promise that every result, source, provider or feature will always be complete, current or error-free. SCHNGN is not responsible for authority decisions, denied entry, overstays, fines, travel costs, missed bookings, lost local data or indirect losses caused by relying on the service where the law permits that limitation. Nothing in these Terms excludes liability that cannot legally be excluded or limits mandatory consumer rights.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Ending use, applicable rights and contact',
        paragraphs: [
          'You may stop using SCHNGN at any time and can clear local data, delete the active synchronized trip snapshot and separately manage or delete the Clerk account. We may suspend abusive or unlawful use. Applicable mandatory law and consumer protections remain in force; these Terms do not choose a court or remove rights that the law gives you. We may update these Terms when the service or legal requirements change, with the date shown above. Questions can be sent to support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Questions about these Terms',
    contactBody: 'Contact support@schngn.com if you have a question about SCHNGN or these Terms. Product support cannot decide your immigration status or provide legal advice.',
    contactLinkLabel: 'Contact SCHNGN support'
  }
};

const catalogs: Record<Locale, LegalLocaleCatalog> = {
  en: englishCatalog,
  ...westernLegalCatalogs,
  ...easternLegalCatalogs
};

export function privacyUi(locale: Locale): LegalPageCopy {
  return catalogs[locale].privacy;
}

export function termsUi(locale: Locale): LegalPageCopy {
  return catalogs[locale].terms;
}

export function legalFooterUi(locale: Locale): LegalFooterCopy {
  return catalogs[locale].footer;
}
