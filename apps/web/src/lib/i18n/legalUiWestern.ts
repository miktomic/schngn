import type { LegalLocaleCatalog, LegalProviderLink } from './legalUi';
import type { Locale } from './locales';

type WesternLocale = 'fr' | 'de' | 'es' | 'it' | 'pt-br' | 'ru' | 'uk' | 'tr';

const UPDATED_DATE = '2026-07-14';

const providerUrls = {
  cloudflare: 'https://www.cloudflare.com/privacypolicy/',
  clerk: 'https://clerk.com/legal/privacy',
  google: 'https://policies.google.com/privacy',
  plausible: 'https://plausible.io/data-policy',
  proton: 'https://proton.me/legal/privacy'
} as const;

function localizedProviderLinks(labels: Record<keyof typeof providerUrls, string>): LegalProviderLink[] {
  return (Object.keys(providerUrls) as Array<keyof typeof providerUrls>).map((provider) => ({
    label: labels[provider],
    url: providerUrls[provider]
  }));
}

const frCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Mentions légales et assistance',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    contact: 'Contact',
    disclaimer: 'Outil de planification uniquement — ni conseil juridique ni garantie d’entrée. Vérifiez auprès des sources officielles.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Sections de la politique de confidentialité',
    title: 'Politique de confidentialité',
    metaDescription: 'Comment SCHNGN traite les voyages conservés localement, la synchronisation facultative, la connexion Google, les statistiques, les demandes d’assistance et vos choix de confidentialité.',
    intro: 'SCHNGN est conçu pour calculer vos projets de voyage sans exiger de compte. Cette politique explique ce qui reste dans votre navigateur, ce qui est traité lorsque vous choisissez des fonctions en ligne facultatives et les moyens de contrôle dont vous disposez.',
    updatedLabel: 'Dernière mise à jour',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'En bref',
    summaryItems: [
      'Les détails des voyages d’un utilisateur invité restent dans son navigateur, sauf s’il choisit expressément la synchronisation avec un compte.',
      'La connexion Google sert à créer, sécuriser, authentifier et identifier un compte SCHNGN facultatif, ainsi qu’à lui associer les voyages que vous choisissez d’enregistrer.',
      'Plausible peut recevoir des catégories générales d’utilisation et de résultat, mais jamais les dates, libellés ou pays de vos voyages, votre adresse e-mail ou l’identifiant de votre compte.',
      'Vous pouvez exporter la copie des voyages présente dans le navigateur et supprimer l’instantané de voyage actif enregistré dans votre compte.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. Champ d’application de cette politique',
        paragraphs: [
          'Cette politique s’applique à schngn.com, à l’application web SCHNGN ainsi qu’à ses fonctions de compte, de synchronisation, de statistiques et d’assistance. SCHNGN est un calculateur de planification et, dans le cadre de ses fonctions habituelles, ne demande pas l’accès au GPS, ne scanne pas les passeports et ne recueille pas les numéros de visa ou de titre de séjour.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Responsable et finalités du traitement',
        paragraphs: [
          'SCHNGN exploite schngn.com et est responsable des traitements propres à l’application décrits ici. Pour toute question relative à la confidentialité, écrivez à support@schngn.com. Nous traitons les données de compte, de synchronisation et d’assistance afin de fournir les fonctions que vous demandez ; des données limitées de statistiques et de sécurité afin de comprendre et de protéger le service ; les données fondées sur le consentement lorsque celui-ci est requis ; et les données nécessaires au respect des obligations légales applicables.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Utilisation sans compte et stockage dans le navigateur',
        paragraphs: [
          'Lorsque vous utilisez SCHNGN sans compte, les dates et libellés des voyages, le contexte facultatif relatif au pays de passage de la frontière, les périodes de séjour, le statut et les résultats des calculs restent dans votre navigateur. Les calculs et les simulations non enregistrées s’exécutent sur votre appareil. La question facultative sur le passeport utilise uniquement le pays de délivrance dans la mémoire temporaire du navigateur afin d’afficher un éventuel avis sur un accord bilatéral ; cette information n’est ni enregistrée avec les voyages ni envoyée aux statistiques. Le stockage du navigateur conserve aussi des préférences fonctionnelles, telles que la langue et la réponse relative aux voyages précédents ; les fichiers publics de l’application peuvent être mis en cache pour une utilisation hors ligne. Une sauvegarde JSON est créée et lue localement sous votre contrôle et n’est pas téléversée du seul fait que vous l’exportez ou l’importez.'
        ],
        items: [
          'Les voyages restent dans le navigateur jusqu’à ce que vous les effaciez ou les remplaciez, ou que vous supprimiez les données du site.',
          'Le cookie de préférence linguistique est conservé jusqu’à un an.',
          'Les sauvegardes JSON locales sont des fichiers non chiffrés ; il vous appartient de les conserver de manière sûre.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Comptes facultatifs et connexion Google',
        paragraphs: [
          'Clerk se charge sur les pages publiques de SCHNGN pour vérifier si vous êtes connecté et peut traiter des données essentielles relatives à la session, à l’appareil et au réseau conformément à sa politique de confidentialité. Si vous choisissez la connexion Google, Google envoie vos données d’identité de base et la réponse OAuth à Clerk. Clerk gère les identifiants ou jetons du fournisseur et la session du compte conformément à sa politique. SCHNGN reçoit la session Clerk et l’identifiant utilisateur qui en résultent afin d’identifier le compte actif, d’afficher votre état de connexion et votre adresse e-mail et d’associer les voyages que vous choisissez expressément d’enregistrer. Seul l’identifiant utilisateur Clerk — et non votre adresse e-mail Google, votre nom, votre photo de profil, votre mot de passe ou les jetons du fournisseur — est stocké dans Cloudflare D1 avec ces voyages. SCHNGN ne demande pas l’accès à Gmail, Google Drive, Agenda, vos contacts ou d’autres contenus Google, ne vend pas les données utilisateur Google et ne les utilise pas à des fins publicitaires.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Synchronisation, exportation et suppression facultatives des voyages',
        paragraphs: [
          'Lorsque vous terminez une action clairement libellée d’inscription et d’enregistrement, ou activez séparément la synchronisation alors que vous êtes connecté, l’instantané validé des voyages en cours est envoyé à Cloudflare D1. Cet instantané comprend l’identifiant utilisateur Clerk vérifié, tous les détails des voyages enregistrés, les métadonnées de révision et de consentement ainsi que les horodatages. Une fois la fonction activée, les modifications ou importations enregistrées ultérieurement peuvent être synchronisées. Le navigateur conserve aussi l’identifiant utilisateur Clerk, la révision du serveur, l’état de synchronisation ou de pause et une empreinte des voyages pour la réconciliation ; le choix de s’inscrire et d’enregistrer est conservé temporairement dans le stockage de session. Ces métadonnées de synchronisation ne font pas partie de l’exportation JSON des voyages ; elles sont supprimées par l’action « Se déconnecter et effacer ce navigateur » ou lorsque vous effacez les données du site. L’exportation JSON contient la copie des voyages actuellement présente dans le navigateur, et non l’ensemble des données d’identité, d’assistance, de journalisation ou détenues par les prestataires. « Supprimer les voyages enregistrés dans le compte » retire l’instantané D1 actif, mais ne supprime ni les voyages du navigateur ni le compte Clerk. La suppression du compte Clerk entraîne le nettoyage de l’instantané et crée un verrou unidirectionnel haché signalant la suppression du compte, actif pendant 30 jours afin d’empêcher sa recréation à partir d’une session obsolète ; passé ce délai, il est ignoré et purgé de manière opportuniste.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Statistiques agrégées',
        paragraphs: [
          'Sur le site de production, Plausible peut recevoir des événements figurant sur une liste autorisée, tels que la consultation d’une page, le démarrage du calculateur, l’ajout d’un voyage et le lancement d’une simulation, accompagnés de catégories générales comme la tranche du nombre de voyages, le verdict, la tranche de marge de sécurité ou la source. SCHNGN supprime les chaînes de requête et les fragments d’URL, et interdit les dates, libellés, pays et chronologies de voyage, le choix de passeport, les adresses e-mail et les identifiants de compte. Les statistiques Plausible sont configurées sans cookies statistiques ni suivi automatique des formulaires, téléchargements et liens sortants. Plausible peut néanmoins traiter des informations réseau ordinaires afin de produire des statistiques agrégées.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Assistance, sécurité et données techniques',
        paragraphs: [
          'Si vous nous contactez, SCHNGN transmet le type de demande, le nom facultatif, l’adresse e-mail, le message et la langue sélectionnée par les services de messagerie Cloudflare à notre boîte d’assistance Proton. L’historique des voyages n’est jamais joint automatiquement, mais tout ce que vous saisissez dans le message nous parviendra. Séparément, le navigateur envoie un jeton Turnstile pour vérification ; ce jeton n’est pas inclus dans l’e-mail d’assistance. Cloudflare utilise l’adresse IP de connexion pour limiter le débit et vérifier Turnstile, et traite les métadonnées ordinaires relatives à la requête, à l’appareil, au navigateur, à la sécurité et aux erreurs lors de la fourniture et de la protection du site. SCHNGN n’utilise pas Sentry et ses journaux applicatifs ne doivent contenir ni le corps des voyages, ni les adresses e-mail des comptes, ni les identifiants utilisateur Clerk.'
        ]
      },
      {
        id: 'providers',
        title: '8. Prestataires et traitement international',
        paragraphs: [
          'SCHNGN utilise Cloudflare pour l’hébergement, le stockage, la sécurité et l’acheminement des e-mails ; Clerk pour l’identité et les sessions ; Google uniquement lorsque vous choisissez la connexion Google ; Plausible pour des statistiques agrégées restreintes ; et Proton pour la boîte d’assistance. Ces prestataires peuvent traiter des données dans des pays autres que le vôtre. Leurs avis publiés décrivent leurs lieux de traitement, leurs durées de conservation et leurs garanties de transfert. Nous ne partageons les données que dans la mesure nécessaire pour fournir ces fonctions, protéger le service, suivre vos instructions ou respecter la loi ; nous ne vendons pas de données à caractère personnel.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Conservation, suppression et sécurité',
        paragraphs: [
          'Les données du navigateur restent présentes jusqu’à ce que vous ou votre navigateur les supprimiez. Les voyages synchronisés actifs restent présents jusqu’à leur remplacement ou leur suppression. Les messages d’assistance restent dans la boîte Proton jusqu’à ce que SCHNGN les supprime ; aucun délai fixe de suppression n’est actuellement promis et ils devraient être supprimés lorsqu’ils ne sont plus raisonnablement nécessaires au suivi, à la protection du service, aux litiges ou aux obligations applicables. Les sauvegardes des prestataires, les dossiers opérationnels, les données de compte et les statistiques agrégées suivent les durées de conservation configurées par les prestataires et peuvent mettre du temps à expirer après la suppression des données actives. SCHNGN utilise des contrôles d’accès, des entrées validées, une attribution de propriété authentifiée et des connexions HTTPS chiffrées, mais aucune méthode de stockage en ligne ou local n’est totalement sûre.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Vos choix, vos droits et les modifications de la politique',
        paragraphs: [
          'Vous pouvez utiliser le calculateur sans compte, effacer les données du navigateur, exporter les voyages du navigateur, supprimer l’instantané de voyage actif du compte, ou gérer et supprimer votre compte Clerk. Selon la loi applicable, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité, vous opposer à certains traitements, retirer votre consentement lorsque celui-ci en constitue la base et introduire une réclamation auprès de votre autorité locale de protection des données. La communication des données de compte ou d’assistance est facultative, mais ces fonctions ne peuvent pas fonctionner sans elles. SCHNGN ne prend pas de décision automatisée produisant des effets juridiques significatifs : les résultats du calculateur sont des estimations de planification. Nous mettrons cette page à jour avant toute modification substantielle de l’utilisation des données.'
        ]
      }
    ],
    contactTitle: 'Questions ou demandes relatives à la confidentialité',
    contactBody: 'Écrivez à support@schngn.com. Décrivez votre demande sans envoyer de numéro de passeport, de visa ou d’autre document sensible. Nous pouvons être amenés à vérifier une demande concernant un compte avant d’y donner suite.',
    contactLinkLabel: 'Contacter l’assistance SCHNGN',
    providerLinksTitle: 'Informations des prestataires sur la confidentialité',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Politique de confidentialité de Cloudflare',
      clerk: 'Politique de confidentialité de Clerk',
      google: 'Politique de confidentialité de Google',
      plausible: 'Politique de données de Plausible',
      proton: 'Politique de confidentialité de Proton'
    })
  },
  terms: {
    navLabel: 'Sections des conditions',
    title: 'Conditions d’utilisation',
    metaDescription: 'Les conditions d’utilisation du calculateur SCHNGN de la règle Schengen des 90 jours sur 180, du stockage local des voyages et des fonctions de compte facultatives.',
    intro: 'Les présentes Conditions régissent votre utilisation de schngn.com et de l’application web SCHNGN. Elles préservent la promesse centrale du produit : un outil de planification utile, aux limites transparentes, avec des comptes facultatifs.',
    updatedLabel: 'Dernière mise à jour',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Le calculateur est disponible sans compte ; l’enregistrement des voyages en ligne est facultatif.',
      'SCHNGN est un outil de planification, et non un conseil juridique ou une garantie d’entrée.',
      'Vous êtes responsable de l’exactitude des dates et devez consulter les sources officielles avant de voyager.',
      'Utilisez le service légalement et protégez l’accès à votre compte.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Utilisation de SCHNGN',
        paragraphs: [
          'En utilisant SCHNGN, vous acceptez les présentes Conditions et la Politique de confidentialité. Vous pouvez utiliser le calculateur sans compte. Si vous créez un compte, vous devez avoir la capacité juridique d’accepter ces Conditions ; toute personne qui n’en a pas la capacité ne doit utiliser SCHNGN qu’avec un parent, un tuteur ou une autre personne autorisée. Si vous n’acceptez pas ces Conditions, n’utilisez pas le service.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Outil de planification uniquement',
        paragraphs: [
          'SCHNGN estime les courts séjours ordinaires selon la règle Schengen des 90 jours sur 180. Il ne fournit ni conseil juridique ni conseil en immigration et ne garantit pas l’entrée, la légalité du séjour ou une décision quelconque d’une autorité frontalière, consulaire ou d’immigration. Il peut ne pas tenir compte des titres de séjour, des visas de long séjour ou nationaux, des accords bilatéraux d’exemption, des exceptions liées à la nationalité, du travail, des études, de l’asile ou de la protection temporaire, des transitions entre règles ou du pouvoir d’appréciation des autorités. Un avis lié au passeport ou au pays concernant un éventuel accord bilatéral est fourni à titre informatif et ne modifie pas le calcul principal ni ne détermine qu’une prolongation s’applique. Vérifiez votre situation auprès des sources officielles et des autorités compétentes avant de réserver ou de voyager.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Vos responsabilités',
        paragraphs: [
          'Il vous appartient de saisir des dates complètes et exactes, d’interpréter le résultat en fonction de votre propre statut, de conserver les sauvegardes dont vous avez besoin et de vérifier indépendamment les règles en vigueur. Les preuves d’entrée et de sortie, les conditions de visa et les instructions des autorités prévalent sur SCHNGN. Ne vous fiez pas à un résultat mis en cache, exporté ou calculé antérieurement après une modification de vos projets ou des règles applicables.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Stockage local, comptes et synchronisation',
        paragraphs: [
          'Les voyages des utilisateurs invités sont stockés dans leur navigateur et peuvent être perdus si les données du site sont effacées, si l’appareil tombe en panne ou si une autre personne modifie le profil du navigateur. Les comptes facultatifs sont fournis par Clerk. Une action libellée d’inscription et d’enregistrement ou un choix de synchronisation distinct autorise SCHNGN à enregistrer l’instantané validé des voyages pour ce compte. Protégez l’accès au compte, déconnectez-vous et effacez les données du navigateur sur les appareils partagés lorsque cela est approprié, et consultez la Politique de confidentialité pour les détails relatifs à l’exportation, la suppression et les prestataires.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Utilisation acceptable',
        paragraphs: [
          'N’utilisez pas SCHNGN de manière abusive, ne perturbez pas son fonctionnement ou sa sécurité, ne sondez pas et ne contournez pas les contrôles d’accès, ne soumettez pas de contenu illégal ou nuisible, n’automatisez pas un trafic abusif, n’usurpez pas l’identité d’une autre personne, n’accédez pas au compte d’autrui et n’utilisez pas le service pour faciliter une fraude ou un voyage illégal. Tout test de sécurité raisonnable nécessite une autorisation écrite préalable. Nous pouvons restreindre l’accès dans la mesure nécessaire pour mettre fin à une utilisation abusive, protéger les utilisateurs ou respecter la loi.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. Contenu de SCHNGN et services tiers',
        paragraphs: [
          'Le nom, la conception, le logiciel et le contenu original de SCHNGN sont protégés par les lois applicables en matière de propriété intellectuelle. Les présentes Conditions vous accordent un droit limité, révocable et non exclusif d’utiliser le service pour votre planification personnelle ; elles ne transfèrent aucun droit de propriété. Les liens vers des sources officielles, Clerk, Google, Cloudflare, Plausible et les autres services tiers sont régis par leurs propres conditions et politiques. SCHNGN n’est pas une institution de l’UE et n’est ni approuvé ni certifié par l’Union européenne.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Disponibilité et modifications',
        paragraphs: [
          'Nous nous efforçons de maintenir l’exactitude et la disponibilité de SCHNGN, mais le service peut être interrompu, retardé ou modifié. Les fonctions, les prestataires, les règles prises en charge ou la disponibilité gratuite peuvent changer, et nous pouvons corriger ou supprimer du contenu. Dans la mesure du raisonnable, les modifications substantielles qui touchent les données de compte enregistrées seront expliquées avant leur entrée en vigueur. Conservez vos propres dossiers pour toute décision de voyage importante à vos yeux.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Exclusions de garantie et responsabilité',
        paragraphs: [
          'Dans toute la mesure permise par la loi, SCHNGN est fourni « en l’état » et « selon disponibilité », sans promesse que chaque résultat, source, prestataire ou fonction sera toujours complet, à jour ou exempt d’erreur. Dans la mesure où la loi autorise cette limitation, SCHNGN n’est pas responsable des décisions des autorités, des refus d’entrée, des dépassements de séjour, des amendes, des frais de voyage, des réservations manquées, de la perte de données locales ou des pertes indirectes résultant de la confiance accordée au service. Rien dans les présentes Conditions n’exclut une responsabilité qui ne peut légalement l’être ni ne limite les droits impératifs des consommateurs.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Fin de l’utilisation, droits applicables et contact',
        paragraphs: [
          'Vous pouvez cesser d’utiliser SCHNGN à tout moment, effacer les données locales, supprimer l’instantané de voyage synchronisé actif et, séparément, gérer ou supprimer le compte Clerk. Nous pouvons suspendre toute utilisation abusive ou illégale. Les lois impératives applicables et la protection des consommateurs restent en vigueur ; les présentes Conditions ne désignent pas de juridiction et ne suppriment aucun droit que la loi vous accorde. Nous pouvons mettre ces Conditions à jour lorsque le service ou les exigences légales changent, la date ci-dessus faisant foi. Les questions peuvent être envoyées à support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Questions sur les présentes Conditions',
    contactBody: 'Contactez support@schngn.com pour toute question concernant SCHNGN ou les présentes Conditions. L’assistance produit ne peut pas déterminer votre statut au regard du droit de l’immigration ni fournir de conseil juridique.',
    contactLinkLabel: 'Contacter l’assistance SCHNGN'
  }
};

const deCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Rechtliches und Support',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
    contact: 'Kontakt',
    disclaimer: 'Nur eine Planungshilfe — keine Rechtsberatung und keine Einreisegarantie. Prüfen Sie die Angaben anhand offizieller Quellen.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Abschnitte der Datenschutzrichtlinie',
    title: 'Datenschutzerklärung',
    metaDescription: 'Wie SCHNGN lokale Reisedaten, optionale Kontosynchronisierung, Google-Anmeldung, Analysen, Supportanfragen und Ihre Datenschutzoptionen behandelt.',
    intro: 'SCHNGN ist darauf ausgelegt, Reisepläne ohne ein erforderliches Konto zu berechnen. Diese Richtlinie erklärt, was in Ihrem Browser bleibt, was bei der Nutzung optionaler Online-Funktionen verarbeitet wird und welche Kontrollmöglichkeiten Sie haben.',
    updatedLabel: 'Zuletzt aktualisiert',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Kurzfassung',
    summaryItems: [
      'Reisedetails von Gästen bleiben in ihrem Browser, sofern sie nicht ausdrücklich die Kontosynchronisierung wählen.',
      'Die Google-Anmeldung wird verwendet, um ein optionales SCHNGN-Konto zu erstellen, zu schützen, zu authentifizieren und zu identifizieren und von Ihnen gespeicherte Reisen damit zu verknüpfen.',
      'Plausible kann grobe Nutzungs- und Ergebniskategorien erhalten, jedoch niemals Ihre Reisedaten, Bezeichnungen, Länder, E-Mail-Adresse oder Konto-ID.',
      'Sie können die aktuelle Reisekopie aus dem Browser exportieren und den aktiven, im Konto gespeicherten Reise-Snapshot löschen.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. Geltungsbereich dieser Richtlinie',
        paragraphs: [
          'Diese Richtlinie gilt für schngn.com, die SCHNGN-Web-App und deren Konto-, Synchronisierungs-, Analyse- und Supportfunktionen. SCHNGN ist ein Planungsrechner und fordert im Rahmen seiner üblichen Funktionen keinen GPS-Zugriff an, scannt keine Reisepässe und erfasst keine Visa- oder Aufenthaltstitelnummern.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Verantwortlichkeit und Zwecke der Datenverarbeitung',
        paragraphs: [
          'SCHNGN betreibt schngn.com und ist für die hier beschriebene anwendungsspezifische Verarbeitung verantwortlich. Bei Datenschutzfragen wenden Sie sich an support@schngn.com. Wir verarbeiten Konto-, Synchronisierungs- und Supportdaten, um von Ihnen angeforderte Funktionen bereitzustellen; begrenzte Analyse- und Sicherheitsdaten, um den Dienst zu verstehen und zu schützen; einwilligungsbasierte Daten, soweit eine Einwilligung erforderlich ist; sowie Daten, die zur Erfüllung geltender gesetzlicher Pflichten benötigt werden.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Gastnutzung und Browserspeicher',
        paragraphs: [
          'Wenn Sie SCHNGN als Gast nutzen, bleiben Reisedaten, Bezeichnungen, optionale Angaben zum Grenzland, Aufenthaltszeiträume, Status und Berechnungsergebnisse in Ihrem Browser. Berechnungen und nicht gespeicherte Simulationen laufen auf Ihrem Gerät. Bei der optionalen Passfrage wird nur das Ausstellungsland vorübergehend im Browserspeicher verwendet, um einen Hinweis auf ein mögliches bilaterales Abkommen anzuzeigen; diese Angabe wird weder mit Reisen gespeichert noch an Analysedienste gesendet. Im Browserspeicher verbleiben außerdem funktionale Einstellungen wie Sprache und die Antwort zu früheren Reisen; öffentliche App-Dateien können für die Offline-Nutzung zwischengespeichert werden. Eine JSON-Sicherung wird unter Ihrer Kontrolle lokal erstellt und gelesen und nicht allein deshalb hochgeladen, weil Sie sie exportieren oder importieren.'
        ],
        items: [
          'Reisen bleiben im Browser gespeichert, bis Sie sie löschen oder ersetzen beziehungsweise die Websitedaten löschen.',
          'Das Cookie für die Spracheinstellung bleibt bis zu einem Jahr bestehen.',
          'Lokale JSON-Sicherungen sind unverschlüsselte Dateien; für ihre sichere Aufbewahrung sind Sie verantwortlich.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Optionale Konten und Google-Anmeldung',
        paragraphs: [
          'Clerk wird auf öffentlichen SCHNGN-Seiten geladen, um zu prüfen, ob Sie angemeldet sind, und kann nach seiner Datenschutzrichtlinie wesentliche Sitzungs-, Geräte- und Netzwerkdaten verarbeiten. Wenn Sie die Google-Anmeldung wählen, sendet Google Ihre grundlegenden Identitätsdaten und die OAuth-Antwort an Clerk. Clerk verwaltet nach seiner Richtlinie die Zugangsdaten oder Token des Anbieters und die Kontositzung. SCHNGN erhält die daraus entstehende Clerk-Sitzung und Benutzer-ID, um das aktive Konto zu identifizieren, Ihren Anmeldestatus und Ihre E-Mail-Adresse anzuzeigen und ausdrücklich von Ihnen gespeicherte Reisen zuzuordnen. Nur die Clerk-Benutzer-ID — nicht Ihre Google-E-Mail-Adresse, Ihr Name, Profilbild, Passwort oder Anbieter-Token — wird zusammen mit diesen Reisen in Cloudflare D1 gespeichert. SCHNGN fordert keinen Zugriff auf Gmail, Google Drive, Kalender, Kontakte oder andere Google-Inhalte an und verkauft Google-Nutzerdaten weder noch nutzt es sie für Werbung.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Optionale Reisesynchronisierung, Export und Löschung',
        paragraphs: [
          'Wenn Sie eine eindeutig gekennzeichnete Aktion zum Registrieren und Speichern abschließen oder die Synchronisierung separat aktivieren, während Sie angemeldet sind, wird der aktuell validierte Reise-Snapshot an Cloudflare D1 gesendet. Dieser Snapshot umfasst die verifizierte Clerk-Benutzer-ID, sämtliche gespeicherten Reisedetails, Revisions- und Einwilligungsmetadaten sowie Zeitstempel. Nach der Aktivierung können später gespeicherte Änderungen oder Importe synchronisiert werden. Der Browser speichert außerdem die Clerk-Benutzer-ID, die Serverrevision, den Synchronisierungs- oder Pausenstatus und einen Reise-Fingerabdruck für den Abgleich; die Entscheidung zum Registrieren und Speichern wird vorübergehend im Sitzungsspeicher gehalten. Diese Synchronisierungsmetadaten sind nicht Teil des Reise-JSON-Exports; sie werden durch die Aktion „Abmelden und diesen Browser leeren“ oder beim Löschen der Websitedaten entfernt. Der JSON-Export enthält die aktuelle Reisekopie im Browser, nicht sämtliche Identitäts-, Support-, Protokoll- oder von Dienstleistern gehaltenen Daten. „Im Konto gespeicherte Reisen löschen“ entfernt den aktiven D1-Snapshot, löscht aber weder die Reisen im Browser noch das Clerk-Konto. Die Löschung des Clerk-Kontos löst die Bereinigung des Snapshots aus und erstellt einen einseitig gehashten Kontolöschschutz, der 30 Tage lang aktiv ist, um eine Neuerstellung durch veraltete Sitzungen zu verhindern; danach wird er ignoriert und bei Gelegenheit bereinigt.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Aggregierte Analysen',
        paragraphs: [
          'Auf der Produktionswebsite kann Plausible freigegebene Ereignisse wie Seitenaufruf, Rechnerstart, hinzugefügte Reise und ausgeführte Simulation erhalten, zusammen mit groben Kategorien wie Bereich der Reiseanzahl, Ergebnis, Bereich des Sicherheitspuffers oder Quelle. SCHNGN entfernt Abfragezeichenfolgen und URL-Fragmente und untersagt die Übermittlung von Reisedaten, Bezeichnungen, Ländern, Zeitachsen, Passauswahl, E-Mail-Adressen und Konto-IDs. Plausible Analytics ist ohne Analyse-Cookies und ohne automatische Verfolgung von Formularen, Downloads und ausgehenden Links konfiguriert. Gewöhnliche Netzwerkinformationen können von Plausible dennoch verarbeitet werden, um aggregierte Statistiken zu erstellen.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Support, Sicherheit und technische Daten',
        paragraphs: [
          'Wenn Sie uns kontaktieren, sendet SCHNGN die Art Ihrer Anfrage, den optionalen Namen, die E-Mail-Adresse, die Nachricht und die ausgewählte Sprache über die E-Mail-Dienste von Cloudflare an unser Proton-Supportpostfach. Der Reiseverlauf wird nie automatisch angehängt; alles, was Sie in die Nachricht eingeben, geht jedoch bei uns ein. Davon getrennt sendet der Browser ein Turnstile-Token zur Verifizierung; dieses Token ist nicht in der Support-E-Mail enthalten. Cloudflare verwendet die verbindende IP-Adresse zur Ratenbegrenzung und Turnstile-Prüfung und verarbeitet bei der Bereitstellung und Absicherung der Website übliche Anfrage-, Geräte-, Browser-, Sicherheits- und Fehlermetadaten. SCHNGN nutzt Sentry nicht, und seine Anwendungsprotokolle dürfen keine Reiseinhalte, Konto-E-Mail-Adressen oder Clerk-Benutzer-IDs enthalten.'
        ]
      },
      {
        id: 'providers',
        title: '8. Dienstleister und internationale Verarbeitung',
        paragraphs: [
          'SCHNGN nutzt Cloudflare für Hosting, Speicherung, Sicherheit und E-Mail-Zustellung, Clerk für Identität und Sitzungen, Google nur bei Auswahl der Google-Anmeldung, Plausible für eingeschränkte aggregierte Analysen und Proton für das Supportpostfach. Diese Dienstleister können Daten in Ländern außerhalb Ihres eigenen Landes verarbeiten. Ihre veröffentlichten Hinweise beschreiben Standorte, Aufbewahrung und Garantien für Datenübermittlungen. Wir teilen Daten nur, soweit dies zur Bereitstellung dieser Funktionen, zum Schutz des Dienstes, zur Ausführung Ihrer Anweisungen oder zur Einhaltung von Gesetzen erforderlich ist; wir verkaufen keine personenbezogenen Daten.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Aufbewahrung, Löschung und Sicherheit',
        paragraphs: [
          'Browserdaten bleiben bestehen, bis Sie oder Ihr Browser sie entfernen. Aktive synchronisierte Reisen bleiben bis zu ihrer Ersetzung oder Löschung erhalten. Supportnachrichten bleiben im Proton-Postfach, bis SCHNGN sie löscht; derzeit wird keine feste Löschfrist zugesagt, und sie sollten entfernt werden, sobald sie für Nachfragen, den Schutz des Dienstes, Streitigkeiten oder geltende Pflichten nicht mehr vernünftigerweise erforderlich sind. Sicherungen der Dienstleister, Betriebsaufzeichnungen, Kontodaten und aggregierte Analysen folgen den konfigurierten Aufbewahrungsfristen der Dienstleister und können nach dem Löschen aktiver Daten zeitverzögert ablaufen. SCHNGN verwendet Zugriffskontrollen, validierte Eingaben, authentifizierte Eigentumszuordnung und verschlüsselte HTTPS-Verbindungen, doch keine Methode zur Online- oder lokalen Speicherung ist vollkommen sicher.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Ihre Wahlmöglichkeiten, Rechte und Änderungen dieser Richtlinie',
        paragraphs: [
          'Sie können den Rechner ohne Konto nutzen, Browserdaten löschen, Browserreisen exportieren, den aktiven Reise-Snapshot des Kontos löschen oder Ihr Clerk-Konto verwalten und löschen. Je nach anwendbarem Recht können Sie Auskunft, Berichtigung, Löschung, Einschränkung oder Übertragbarkeit verlangen, bestimmten Verarbeitungen widersprechen, eine Einwilligung widerrufen, wenn sie die Rechtsgrundlage ist, und sich bei Ihrer zuständigen Datenschutzbehörde beschweren. Die Angabe von Konto- oder Supportdaten ist freiwillig, doch diese Funktionen können ohne sie nicht bereitgestellt werden. SCHNGN trifft keine rechtlich erheblichen automatisierten Entscheidungen: Die Ergebnisse des Rechners sind Planungsschätzungen. Wir werden diese Seite aktualisieren, bevor wir die Nutzung von Daten wesentlich ändern.'
        ]
      }
    ],
    contactTitle: 'Datenschutzfragen oder -anfragen',
    contactBody: 'Schreiben Sie an support@schngn.com. Beschreiben Sie Ihre Anfrage, ohne Pass-, Visa- oder andere sensible Dokumentennummern zu senden. Bevor wir eine Kontoanfrage bearbeiten, müssen wir sie gegebenenfalls verifizieren.',
    contactLinkLabel: 'SCHNGN-Support kontaktieren',
    providerLinksTitle: 'Datenschutzinformationen der Dienstleister',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Datenschutzrichtlinie von Cloudflare',
      clerk: 'Datenschutzrichtlinie von Clerk',
      google: 'Datenschutzrichtlinie von Google',
      plausible: 'Datenrichtlinie von Plausible',
      proton: 'Datenschutzrichtlinie von Proton'
    })
  },
  terms: {
    navLabel: 'Abschnitte der Nutzungsbedingungen',
    title: 'Nutzungsbedingungen',
    metaDescription: 'Die Bedingungen für die Nutzung des SCHNGN-Rechners zur Schengen-90/180-Tage-Regel, der lokalen Reisespeicherung und optionaler Kontofunktionen.',
    intro: 'Diese Bedingungen regeln Ihre Nutzung von schngn.com und der SCHNGN-Web-App. Sie sollen das zentrale Versprechen des Produkts bewahren: eine hilfreiche Planungslösung mit transparenten Grenzen und optionalen Konten.',
    updatedLabel: 'Zuletzt aktualisiert',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Das Wichtigste',
    summaryItems: [
      'Der Rechner ist ohne Konto verfügbar; das Online-Speichern von Reisen ist optional.',
      'SCHNGN ist eine Planungshilfe, keine Rechtsberatung und keine Einreisegarantie.',
      'Sie sind für korrekte Daten und die Prüfung offizieller Quellen vor einer Reise verantwortlich.',
      'Nutzen Sie den Dienst rechtmäßig und schützen Sie den Zugang zu Ihrem Konto.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Nutzung von SCHNGN',
        paragraphs: [
          'Durch die Nutzung von SCHNGN stimmen Sie diesen Bedingungen und der Datenschutzrichtlinie zu. Sie können den Rechner als Gast nutzen. Wenn Sie ein Konto erstellen, müssen Sie rechtlich in der Lage sein, diesen Bedingungen zuzustimmen; wer nicht über diese Fähigkeit verfügt, sollte SCHNGN nur mit einem Elternteil, einer sorgeberechtigten oder einer anderen befugten Person nutzen. Wenn Sie nicht zustimmen, dürfen Sie den Dienst nicht nutzen.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Nur eine Planungshilfe',
        paragraphs: [
          'SCHNGN schätzt gewöhnliche Kurzaufenthalte nach der Schengen-90/180-Tage-Regel. Es handelt sich weder um Rechts- oder Einwanderungsberatung noch um eine Garantie für die Einreise, den rechtmäßigen Aufenthalt oder eine Entscheidung einer Grenz-, Visa- oder Einwanderungsbehörde. Aufenthaltsgenehmigungen, Langzeit- oder nationale Visa, bilaterale Befreiungsabkommen, nationalitätsspezifische Ausnahmen, Arbeit, Studium, Asyl oder vorübergehender Schutz, Regelübergänge oder behördliches Ermessen werden möglicherweise nicht berücksichtigt. Ein pass- oder länderspezifischer Hinweis auf eine mögliche bilaterale Regelung dient nur der Information, ändert die Kernberechnung nicht und stellt nicht fest, dass eine Verlängerung gilt. Prüfen Sie Ihre Situation vor einer Buchung oder Reise anhand offizieller Quellen und bei den zuständigen Behörden.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Ihre Verantwortlichkeiten',
        paragraphs: [
          'Sie sind dafür verantwortlich, vollständige und korrekte Daten einzugeben, das Ergebnis im Hinblick auf Ihren eigenen Status auszulegen, benötigte Sicherungen aufzubewahren und die aktuellen Regeln eigenständig zu prüfen. Ein- und Ausreisenachweise, Visabedingungen und behördliche Anweisungen haben Vorrang vor SCHNGN. Verlassen Sie sich nicht auf ein zwischengespeichertes, exportiertes oder früher berechnetes Ergebnis, nachdem sich Ihre Pläne oder die anwendbaren Regeln geändert haben.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Lokale Speicherung, Konten und Synchronisierung',
        paragraphs: [
          'Reisen von Gästen werden in ihrem Browser gespeichert und können verloren gehen, wenn Websitedaten gelöscht werden, das Gerät ausfällt oder eine andere Person das Browserprofil ändert. Optionale Konten werden über Clerk bereitgestellt. Eine gekennzeichnete Aktion zum Registrieren und Speichern oder eine separate Synchronisierungswahl berechtigt SCHNGN, den validierten Reise-Snapshot für dieses Konto zu speichern. Schützen Sie den Kontozugang, melden Sie sich ab und löschen Sie gegebenenfalls Browserdaten auf gemeinsam genutzten Geräten. Einzelheiten zu Export, Löschung und Dienstleistern finden Sie in der Datenschutzrichtlinie.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Zulässige Nutzung',
        paragraphs: [
          'Missbrauchen Sie SCHNGN nicht, stören Sie weder Betrieb noch Sicherheit, untersuchen oder umgehen Sie keine Zugriffskontrollen, übermitteln Sie kein rechtswidriges oder schädliches Material, automatisieren Sie keinen missbräuchlichen Datenverkehr, geben Sie sich nicht als eine andere Person aus, greifen Sie nicht auf ein fremdes Konto zu und nutzen Sie den Dienst nicht zur Unterstützung von Betrug oder rechtswidrigem Reisen. Angemessene Sicherheitstests bedürfen einer vorherigen schriftlichen Genehmigung. Wir können den Zugang soweit beschränken, wie dies zur Beendigung von Missbrauch, zum Schutz von Nutzern oder zur Einhaltung von Gesetzen erforderlich ist.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. SCHNGN-Inhalte und Dienste Dritter',
        paragraphs: [
          'Der Name SCHNGN, das Design, die Software und eigene Inhalte sind durch geltende Gesetze zum geistigen Eigentum geschützt. Diese Bedingungen gewähren Ihnen ein beschränktes, widerrufliches, nicht ausschließliches Recht, den Dienst für Ihre persönliche Planung zu nutzen; sie übertragen kein Eigentum. Links zu offiziellen Quellen, Clerk, Google, Cloudflare, Plausible und andere Dienste Dritter unterliegen deren eigenen Bedingungen und Richtlinien. SCHNGN ist keine EU-Einrichtung und wird von der Europäischen Union weder unterstützt noch zertifiziert.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Verfügbarkeit und Änderungen',
        paragraphs: [
          'Wir bemühen uns, SCHNGN korrekt und verfügbar zu halten, der Dienst kann jedoch unterbrochen, verzögert oder geändert werden. Funktionen, Dienstleister, unterstützte Regeln oder die kostenlose Verfügbarkeit können sich ändern, und wir können Inhalte korrigieren oder entfernen. Soweit vernünftigerweise möglich, werden wesentliche Änderungen, die gespeicherte Kontodaten betreffen, vor ihrem Inkrafttreten erläutert. Bewahren Sie für jede für Sie wichtige Reiseentscheidung eigene Unterlagen auf.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Haftungsausschlüsse und Haftung',
        paragraphs: [
          'Soweit gesetzlich zulässig, wird SCHNGN „wie besehen“ und „wie verfügbar“ bereitgestellt, ohne Zusicherung, dass jedes Ergebnis, jede Quelle, jeder Dienstleister oder jede Funktion stets vollständig, aktuell oder fehlerfrei ist. Soweit das Gesetz diese Beschränkung zulässt, haftet SCHNGN nicht für Behördenentscheidungen, verweigerte Einreisen, Aufenthaltsüberschreitungen, Geldbußen, Reisekosten, verpasste Buchungen, verlorene lokale Daten oder mittelbare Schäden, die durch das Vertrauen auf den Dienst entstehen. Diese Bedingungen schließen keine Haftung aus, die rechtlich nicht ausgeschlossen werden kann, und beschränken keine zwingenden Verbraucherrechte.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Beendigung der Nutzung, geltende Rechte und Kontakt',
        paragraphs: [
          'Sie können SCHNGN jederzeit nicht mehr nutzen, lokale Daten löschen, den aktiven synchronisierten Reise-Snapshot löschen und das Clerk-Konto separat verwalten oder löschen. Wir können eine missbräuchliche oder rechtswidrige Nutzung sperren. Anwendbares zwingendes Recht und Verbraucherschutzbestimmungen bleiben in Kraft; diese Bedingungen legen kein Gericht fest und entziehen Ihnen keine gesetzlichen Rechte. Wir können diese Bedingungen ändern, wenn sich der Dienst oder die rechtlichen Anforderungen ändern; das Datum ist oben angegeben. Fragen können Sie an support@schngn.com senden.'
        ]
      }
    ],
    contactTitle: 'Fragen zu diesen Bedingungen',
    contactBody: 'Kontaktieren Sie support@schngn.com, wenn Sie Fragen zu SCHNGN oder diesen Bedingungen haben. Der Produktsupport kann Ihren Einwanderungsstatus nicht bestimmen und keine Rechtsberatung leisten.',
    contactLinkLabel: 'SCHNGN-Support kontaktieren'
  }
};

const esCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Información legal y asistencia',
    privacy: 'Privacidad',
    terms: 'Condiciones',
    contact: 'Contacto',
    disclaimer: 'Solo una ayuda para planificar; no constituye asesoramiento jurídico ni garantiza la entrada. Consulta fuentes oficiales.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Secciones de la política de privacidad',
    title: 'Política de privacidad',
    metaDescription: 'Cómo trata SCHNGN los viajes guardados localmente, la sincronización opcional, el inicio de sesión con Google, las analíticas, las solicitudes de asistencia y tus opciones de privacidad.',
    intro: 'SCHNGN está diseñado para calcular planes de viaje sin exigir una cuenta. Esta política explica qué permanece en tu navegador, qué se trata cuando eliges funciones en línea opcionales y qué controles tienes a tu disposición.',
    updatedLabel: 'Última actualización',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'En pocas palabras',
    summaryItems: [
      'Los detalles de los viajes como invitado permanecen en tu navegador, salvo que elijas expresamente sincronizarlos con una cuenta.',
      'El inicio de sesión con Google se utiliza para crear, proteger, autenticar e identificar una cuenta opcional de SCHNGN y asociarle los viajes que decidas guardar.',
      'Plausible puede recibir categorías generales de uso y resultados, pero nunca las fechas, etiquetas o países de tus viajes, tu correo electrónico ni el identificador de tu cuenta.',
      'Puedes exportar la copia actual de los viajes del navegador y eliminar la instantánea de viajes activa guardada en tu cuenta.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. Qué abarca esta política',
        paragraphs: [
          'Esta política se aplica a schngn.com, a la aplicación web SCHNGN y a sus funciones de cuenta, sincronización, analítica y asistencia. SCHNGN es una calculadora de planificación y, como parte de sus funciones habituales, no solicita acceso al GPS, no escanea pasaportes ni recopila números de visado o de documentos de residencia.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Quién es responsable y por qué se tratan los datos',
        paragraphs: [
          'SCHNGN gestiona schngn.com y es responsable del tratamiento específico de la aplicación que aquí se describe. Para preguntas sobre privacidad, escribe a support@schngn.com. Tratamos los datos de cuenta, sincronización y asistencia para ofrecer las funciones que solicitas; datos limitados de analítica y seguridad para comprender y proteger el servicio; datos basados en el consentimiento cuando este sea necesario; y datos necesarios para cumplir las obligaciones legales aplicables.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Uso como invitado y almacenamiento en el navegador',
        paragraphs: [
          'Cuando utilizas SCHNGN como invitado, las fechas y etiquetas de los viajes, el contexto opcional del país fronterizo, los periodos de estancia, el estado y los resultados de los cálculos permanecen en tu navegador. Los cálculos y las simulaciones no guardadas se ejecutan en tu dispositivo. La pregunta opcional sobre el pasaporte solo utiliza el país emisor en la memoria temporal del navegador para mostrar un posible aviso sobre un acuerdo bilateral; no se guarda con los viajes ni se envía a las analíticas. El almacenamiento del navegador también conserva preferencias funcionales, como el idioma y la respuesta sobre viajes anteriores; los archivos públicos de la aplicación pueden almacenarse en caché para usarlos sin conexión. Una copia de seguridad JSON se crea y se lee localmente bajo tu control y no se carga por el mero hecho de exportarla o importarla.'
        ],
        items: [
          'Los viajes permanecen almacenados en el navegador hasta que los elimines o sustituyas, o borres los datos del sitio.',
          'La cookie de preferencia de idioma dura hasta un año.',
          'Las copias de seguridad JSON locales son archivos sin cifrar; tú eres responsable de guardarlas de forma segura.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Cuentas opcionales e inicio de sesión con Google',
        paragraphs: [
          'Clerk se carga en las páginas públicas de SCHNGN para comprobar si has iniciado sesión y puede tratar datos esenciales de la sesión, el dispositivo y la red conforme a su política de privacidad. Si eliges iniciar sesión con Google, Google envía tus datos básicos de identidad y la respuesta OAuth a Clerk. Clerk gestiona las credenciales o tokens del proveedor y la sesión de la cuenta conforme a su política. SCHNGN recibe la sesión y el identificador de usuario de Clerk resultantes para identificar la cuenta activa, mostrar tu estado de sesión y correo electrónico y asociar los viajes que decidas guardar expresamente. Solo se almacena en Cloudflare D1 el identificador de usuario de Clerk junto con esos viajes, no tu correo de Google, nombre, imagen de perfil, contraseña ni los tokens del proveedor. SCHNGN no solicita acceso a Gmail, Google Drive, Calendar, tus contactos ni otros contenidos de Google, y no vende datos de usuarios de Google ni los utiliza para publicidad.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Sincronización, exportación y eliminación opcionales de viajes',
        paragraphs: [
          'Al completar una acción claramente identificada para registrarte y guardar, o al activar por separado la sincronización mientras tienes la sesión iniciada, la instantánea validada de los viajes actuales se envía a Cloudflare D1. Esa instantánea incluye el identificador de usuario de Clerk verificado, todos los detalles de los viajes guardados, metadatos de revisión y consentimiento, y marcas de tiempo. Una vez activada, las modificaciones o importaciones que guardes después pueden sincronizarse. El navegador también guarda el identificador de usuario de Clerk, la revisión del servidor, el estado de sincronización o pausa y una huella de los viajes para conciliarlos; la elección de registrarte y guardar se conserva temporalmente en el almacenamiento de sesión. Estos metadatos de sincronización no forman parte de la exportación JSON de los viajes; se eliminan mediante la acción «Cerrar sesión y borrar este navegador» o cuando borras los datos del sitio. La exportación JSON contiene la copia actual de los viajes del navegador, no todos los datos de identidad, asistencia, registros o datos en poder de los proveedores. «Eliminar los viajes guardados de la cuenta» borra la instantánea activa de D1, pero no los viajes del navegador ni la cuenta de Clerk. Al eliminar la cuenta de Clerk se inicia la limpieza de la instantánea y se crea un bloqueo unidireccional cifrado mediante hash que permanece activo durante 30 días para impedir que una sesión obsoleta vuelva a crearla; después se ignora y se purga cuando surge la oportunidad.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Analítica agregada',
        paragraphs: [
          'En el sitio de producción, Plausible puede recibir eventos de una lista permitida, como la visita a una página, el inicio de la calculadora, un viaje añadido o la ejecución de una simulación, junto con categorías generales como el intervalo del número de viajes, el resultado, el intervalo del margen de seguridad o la fuente. SCHNGN elimina las cadenas de consulta y los fragmentos de las URL y prohíbe enviar fechas, etiquetas, países y cronologías de viajes, la elección de pasaporte, direcciones de correo electrónico e identificadores de cuenta. Plausible Analytics está configurado sin cookies de analítica ni seguimiento automático de formularios, descargas y enlaces salientes. Plausible puede seguir tratando información de red ordinaria para producir estadísticas agregadas.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Asistencia, seguridad y datos técnicos',
        paragraphs: [
          'Si te pones en contacto con nosotros, SCHNGN envía el tipo de solicitud, el nombre opcional, la dirección de correo electrónico, el mensaje y el idioma seleccionado mediante los servicios de correo electrónico de Cloudflare a nuestro buzón de asistencia de Proton. El historial de viajes nunca se adjunta automáticamente, aunque recibiremos todo lo que escribas en el mensaje. Por separado, el navegador envía un token de Turnstile para verificarlo; ese token no se incluye en el correo de asistencia. Cloudflare utiliza la dirección IP de la conexión para limitar la frecuencia y verificar Turnstile, y trata los metadatos ordinarios de la solicitud, el dispositivo, el navegador, la seguridad y los errores al prestar y proteger el sitio. SCHNGN no utiliza Sentry y los registros de su aplicación no deben contener el contenido de los viajes, correos electrónicos de cuentas ni identificadores de usuario de Clerk.'
        ]
      },
      {
        id: 'providers',
        title: '8. Proveedores de servicios y tratamiento internacional',
        paragraphs: [
          'SCHNGN utiliza Cloudflare para el alojamiento, el almacenamiento, la seguridad y la entrega de correo electrónico; Clerk para la identidad y las sesiones; Google solo cuando eliges iniciar sesión con Google; Plausible para analítica agregada restringida; y Proton para el buzón de asistencia. Estos proveedores pueden tratar datos en países distintos del tuyo. Sus avisos publicados describen sus ubicaciones, periodos de conservación y garantías para las transferencias. Solo compartimos datos en la medida necesaria para ofrecer estas funciones, proteger el servicio, seguir tus instrucciones o cumplir la ley; no vendemos datos personales.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Conservación, eliminación y seguridad',
        paragraphs: [
          'Los datos del navegador permanecen hasta que tú o el navegador los eliminéis. Los viajes sincronizados activos permanecen hasta que se sustituyen o eliminan. Los mensajes de asistencia permanecen en el buzón de Proton hasta que SCHNGN los elimina; actualmente no se promete un plazo fijo de eliminación y deberían borrarse cuando dejen de ser razonablemente necesarios para el seguimiento, la protección del servicio, posibles disputas o las obligaciones aplicables. Las copias de seguridad de los proveedores, los registros operativos, los datos de cuenta y la analítica agregada siguen los plazos de conservación configurados por los proveedores y pueden tardar en caducar después de eliminar los datos activos. SCHNGN utiliza controles de acceso, entradas validadas, titularidad autenticada y conexiones HTTPS cifradas, pero ningún método de almacenamiento local o en línea es completamente seguro.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Tus opciones, derechos y cambios de esta política',
        paragraphs: [
          'Puedes utilizar la calculadora sin una cuenta, borrar los datos del navegador, exportar los viajes del navegador, eliminar la instantánea activa de viajes de la cuenta o gestionar y eliminar tu cuenta de Clerk. Según la legislación aplicable, puedes solicitar acceso, rectificación, supresión, limitación o portabilidad, oponerte a determinados tratamientos, retirar el consentimiento cuando este sea la base y presentar una reclamación ante tu autoridad local de protección de datos. Facilitar datos de cuenta o asistencia es opcional, pero esas funciones no pueden operar sin ellos. SCHNGN no toma decisiones automatizadas con efectos jurídicos significativos: los resultados de la calculadora son estimaciones para planificar. Actualizaremos esta página antes de cambiar de forma sustancial el uso de los datos.'
        ]
      }
    ],
    contactTitle: 'Preguntas o solicitudes sobre privacidad',
    contactBody: 'Escribe a support@schngn.com. Describe la solicitud sin enviar números de pasaporte, visado ni otros documentos sensibles. Es posible que tengamos que verificar una solicitud relacionada con una cuenta antes de atenderla.',
    contactLinkLabel: 'Contactar con la asistencia de SCHNGN',
    providerLinksTitle: 'Información de privacidad de los proveedores',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Política de privacidad de Cloudflare',
      clerk: 'Política de privacidad de Clerk',
      google: 'Política de privacidad de Google',
      plausible: 'Política de datos de Plausible',
      proton: 'Política de privacidad de Proton'
    })
  },
  terms: {
    navLabel: 'Secciones de las condiciones',
    title: 'Condiciones de uso',
    metaDescription: 'Las condiciones para utilizar la calculadora SCHNGN de la regla Schengen de 90/180 días, el almacenamiento local de viajes y las funciones opcionales de cuenta.',
    intro: 'Estas Condiciones rigen el uso de schngn.com y de la aplicación web SCHNGN. Están redactadas para preservar la promesa central del producto: una herramienta útil para planificar, con límites transparentes y cuentas opcionales.',
    updatedLabel: 'Última actualización',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'La calculadora está disponible sin una cuenta; guardar viajes en línea es opcional.',
      'SCHNGN es una ayuda para planificar, no asesoramiento jurídico ni una garantía de entrada.',
      'Tú eres responsable de que las fechas sean exactas y de consultar fuentes oficiales antes de viajar.',
      'Utiliza el servicio de forma lícita y protege el acceso a cualquier cuenta.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Uso de SCHNGN',
        paragraphs: [
          'Al utilizar SCHNGN, aceptas estas Condiciones y la Política de privacidad. Puedes utilizar la calculadora como invitado. Si creas una cuenta, debes tener capacidad legal para aceptar estas Condiciones; quien carezca de esa capacidad solo debe utilizar SCHNGN con un padre, tutor u otra persona autorizada. Si no estás de acuerdo, no utilices el servicio.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Solo una ayuda para planificar',
        paragraphs: [
          'SCHNGN calcula estancias cortas ordinarias conforme a la regla Schengen de 90/180 días. No constituye asesoramiento jurídico ni de inmigración y no garantiza la entrada, la legalidad de la estancia ni decisión alguna de una autoridad fronteriza, de visados o de inmigración. Puede que no tenga en cuenta permisos de residencia, visados nacionales o de larga duración, acuerdos bilaterales de exención, excepciones específicas por nacionalidad, trabajo, estudios, asilo o protección temporal, transiciones normativas o discrecionalidad oficial. Un aviso específico del pasaporte o el país sobre un posible acuerdo bilateral es informativo y no cambia el cálculo principal ni determina que corresponda una prórroga. Verifica tu situación con fuentes oficiales y las autoridades competentes antes de reservar o viajar.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Tus responsabilidades',
        paragraphs: [
          'Eres responsable de introducir fechas completas y exactas, interpretar el resultado teniendo en cuenta tu propia situación, conservar las copias de seguridad que necesites y comprobar de forma independiente las normas vigentes. Las pruebas de entrada y salida, las condiciones del visado y las instrucciones de las autoridades prevalecen sobre SCHNGN. No te bases en un resultado almacenado en caché, exportado o calculado previamente después de que cambien tus planes o las normas aplicables.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Almacenamiento local, cuentas y sincronización',
        paragraphs: [
          'Los viajes como invitado se guardan en el navegador y pueden perderse si se borran los datos del sitio, falla el dispositivo o alguien modifica el perfil del navegador. Las cuentas opcionales se proporcionan mediante Clerk. Una acción identificada para registrarte y guardar, o una elección de sincronización independiente, autoriza a SCHNGN a almacenar la instantánea validada de los viajes de esa cuenta. Protege el acceso a la cuenta, cierra la sesión y borra los datos del navegador en dispositivos compartidos cuando corresponda, y consulta la Política de privacidad para obtener detalles sobre la exportación, la eliminación y los proveedores.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Uso aceptable',
        paragraphs: [
          'No hagas un uso indebido de SCHNGN, no interfieras en su funcionamiento o seguridad, no sondees ni eludas los controles de acceso, no envíes material ilegal o perjudicial, no automatices tráfico abusivo, no suplantes a otra persona, no accedas a otra cuenta ni utilices el servicio para facilitar fraudes o viajes ilícitos. Las pruebas de seguridad razonables requieren autorización previa por escrito. Podemos restringir el acceso necesario para detener el uso indebido, proteger a los usuarios o cumplir la ley.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. Contenido de SCHNGN y servicios de terceros',
        paragraphs: [
          'El nombre, el diseño, el software y el contenido original de SCHNGN están protegidos por las leyes de propiedad intelectual aplicables. Estas Condiciones te conceden un derecho limitado, revocable y no exclusivo a utilizar el servicio para tu planificación personal; no transfieren la propiedad. Los enlaces a fuentes oficiales, Clerk, Google, Cloudflare, Plausible y otros servicios de terceros tienen sus propias condiciones y políticas. SCHNGN no es una institución de la UE ni está avalado o certificado por la Unión Europea.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Disponibilidad y cambios',
        paragraphs: [
          'Procuramos mantener SCHNGN exacto y disponible, pero el servicio puede sufrir interrupciones, retrasos o cambios. Las funciones, los proveedores, las normas admitidas o la disponibilidad gratuita pueden cambiar, y podemos corregir o retirar contenido. Siempre que sea razonablemente posible, los cambios importantes que afecten a datos de cuenta guardados se explicarán antes de que entren en vigor. Conserva registros independientes para cualquier decisión de viaje que sea importante para ti.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Exclusiones de garantías y responsabilidad',
        paragraphs: [
          'En la medida máxima permitida por la ley, SCHNGN se proporciona «tal cual» y «según disponibilidad», sin prometer que todos los resultados, fuentes, proveedores o funciones sean siempre completos, actuales o estén libres de errores. Cuando la ley permita esa limitación, SCHNGN no se hace responsable de decisiones de las autoridades, denegaciones de entrada, exceso de estancia, multas, gastos de viaje, reservas perdidas, pérdida de datos locales ni daños indirectos causados por confiar en el servicio. Nada de lo dispuesto en estas Condiciones excluye responsabilidades que legalmente no puedan excluirse ni limita derechos obligatorios de los consumidores.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Fin del uso, derechos aplicables y contacto',
        paragraphs: [
          'Puedes dejar de utilizar SCHNGN en cualquier momento, borrar los datos locales, eliminar la instantánea activa de viajes sincronizada y gestionar o eliminar por separado la cuenta de Clerk. Podemos suspender el uso abusivo o ilícito. La legislación obligatoria aplicable y las protecciones de los consumidores siguen vigentes; estas Condiciones no eligen un tribunal ni eliminan derechos que te conceda la ley. Podemos actualizar estas Condiciones cuando cambien el servicio o los requisitos legales, con la fecha que figura arriba. Puedes enviar tus preguntas a support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Preguntas sobre estas Condiciones',
    contactBody: 'Ponte en contacto con support@schngn.com si tienes alguna pregunta sobre SCHNGN o estas Condiciones. La asistencia del producto no puede determinar tu situación migratoria ni ofrecer asesoramiento jurídico.',
    contactLinkLabel: 'Contactar con la asistencia de SCHNGN'
  }
};

const itCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Informazioni legali e assistenza',
    privacy: 'Privacy',
    terms: 'Termini',
    contact: 'Contatti',
    disclaimer: 'Solo uno strumento di pianificazione: non è consulenza legale né garanzia di ingresso. Verifica con fonti ufficiali.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Sezioni dell’informativa sulla privacy',
    title: 'Informativa sulla privacy',
    metaDescription: 'Come SCHNGN gestisce i dati di viaggio locali, la sincronizzazione facoltativa, l’accesso con Google, i dati statistici, le richieste di assistenza e le tue scelte sulla privacy.',
    intro: 'SCHNGN è progettato per calcolare i piani di viaggio senza richiedere un account. Questa informativa spiega cosa resta nel tuo browser, cosa viene trattato quando scegli funzioni online facoltative e quali controlli hai a disposizione.',
    updatedLabel: 'Ultimo aggiornamento',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'In breve',
    summaryItems: [
      'I dettagli dei viaggi effettuati come ospite restano nel tuo browser, a meno che tu non scelga esplicitamente la sincronizzazione con un account.',
      'L’accesso con Google viene utilizzato per creare, proteggere, autenticare e identificare un account SCHNGN facoltativo e associarvi i viaggi che scegli di salvare.',
      'Plausible può ricevere categorie generali di utilizzo e di risultato, ma mai date, etichette o paesi dei tuoi viaggi, la tua e-mail o l’ID del tuo account.',
      'Puoi esportare la copia dei viaggi presente nel browser ed eliminare l’istantanea di viaggio attiva salvata nel tuo account.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. Ambito di questa informativa',
        paragraphs: [
          'Questa informativa riguarda schngn.com, l’applicazione web SCHNGN e le relative funzioni di account, sincronizzazione, analisi e assistenza. SCHNGN è un calcolatore per la pianificazione e, nell’ambito delle sue normali funzioni, non richiede l’accesso al GPS, non scansiona passaporti e non raccoglie numeri di visto o di documenti di soggiorno.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Titolare e motivi del trattamento dei dati',
        paragraphs: [
          'SCHNGN gestisce schngn.com ed è responsabile del trattamento specifico dell’applicazione descritto qui. Per domande sulla privacy, contatta support@schngn.com. Trattiamo i dati di account, sincronizzazione e assistenza per fornire le funzioni richieste; dati limitati di analisi e sicurezza per comprendere e proteggere il servizio; dati basati sul consenso quando questo è necessario; e dati necessari per adempiere agli obblighi di legge applicabili.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Utilizzo come ospite e memoria del browser',
        paragraphs: [
          'Quando utilizzi SCHNGN come ospite, le date e le etichette dei viaggi, il contesto facoltativo del paese di frontiera, gli intervalli di soggiorno, lo stato e i risultati dei calcoli restano nel tuo browser. I calcoli e le simulazioni non salvate vengono eseguiti sul tuo dispositivo. La domanda facoltativa sul passaporto usa solo il paese di rilascio nella memoria temporanea del browser per mostrare un eventuale avviso su un accordo bilaterale; non viene salvato con i viaggi né inviato ai sistemi di analisi. La memoria del browser conserva anche preferenze funzionali quali la lingua e la risposta sui viaggi precedenti; i file pubblici dell’app possono essere memorizzati nella cache per l’uso offline. Un backup JSON viene creato e letto localmente sotto il tuo controllo e non viene caricato per il solo fatto che lo esporti o lo importi.'
        ],
        items: [
          'I viaggi restano nella memoria del browser finché non li cancelli o sostituisci oppure finché non elimini i dati del sito.',
          'Il cookie della preferenza della lingua dura fino a un anno.',
          'I backup JSON locali sono file non crittografati; sei responsabile della loro conservazione sicura.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Account facoltativi e accesso con Google',
        paragraphs: [
          'Clerk viene caricato sulle pagine pubbliche di SCHNGN per verificare se hai effettuato l’accesso e può trattare dati essenziali relativi a sessione, dispositivo e rete in base alla propria informativa sulla privacy. Se scegli l’accesso con Google, Google invia a Clerk i tuoi dati identificativi di base e la risposta OAuth. Clerk gestisce le credenziali o i token del fornitore e la sessione dell’account secondo la propria informativa. SCHNGN riceve la sessione Clerk e l’ID utente risultanti per identificare l’account attivo, mostrare lo stato di accesso e l’e-mail e associare i viaggi che scegli espressamente di salvare. Solo l’ID utente Clerk — non l’e-mail Google, il nome, l’immagine del profilo, la password o i token del fornitore — viene archiviato in Cloudflare D1 con tali viaggi. SCHNGN non richiede l’accesso a Gmail, Google Drive, Calendar, contatti o altri contenuti Google e non vende i dati degli utenti Google né li usa per la pubblicità.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Sincronizzazione, esportazione ed eliminazione facoltative dei viaggi',
        paragraphs: [
          'Completare un’azione chiaramente indicata per registrarsi e salvare, oppure attivare separatamente la sincronizzazione dopo aver effettuato l’accesso, invia l’istantanea convalidata dei viaggi correnti a Cloudflare D1. L’istantanea include l’ID utente Clerk verificato, tutti i dettagli dei viaggi salvati, i metadati di revisione e consenso e i timestamp. Una volta attivata, le modifiche o le importazioni salvate successivamente possono essere sincronizzate. Il browser archivia inoltre l’ID utente Clerk, la revisione del server, lo stato di sincronizzazione o pausa e un’impronta dei viaggi per la riconciliazione; la scelta di registrarsi e salvare viene conservata temporaneamente nella memoria di sessione. Questi metadati di sincronizzazione non fanno parte dell’esportazione JSON dei viaggi; vengono rimossi dall’azione «Esci e cancella questo browser» o quando cancelli i dati del sito. L’esportazione JSON contiene la copia dei viaggi attualmente presente nel browser, non tutti i dati di identità, assistenza, registro o detenuti dai fornitori. «Elimina i viaggi salvati nell’account» rimuove l’istantanea D1 attiva, ma non elimina i viaggi dal browser né l’account Clerk. L’eliminazione dell’account Clerk avvia la rimozione dell’istantanea e crea un blocco unidirezionale con hash relativo all’eliminazione dell’account, attivo per 30 giorni per impedire che sessioni obsolete lo ricreino; in seguito viene ignorato e rimosso quando se ne presenta l’occasione.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Analisi aggregate',
        paragraphs: [
          'Sul sito di produzione, Plausible può ricevere eventi inseriti in una lista consentita, come visualizzazione della pagina, avvio del calcolatore, viaggio aggiunto e simulazione eseguita, insieme a categorie generali quali fascia del numero di viaggi, esito, fascia del margine di sicurezza o fonte. SCHNGN rimuove stringhe di query e frammenti degli URL e vieta date, etichette, paesi e sequenze temporali dei viaggi, scelta del passaporto, e-mail e identificatori degli account. Plausible Analytics è configurato senza cookie analitici né tracciamento automatico di moduli, download e link in uscita. Plausible può comunque trattare normali informazioni di rete per produrre statistiche aggregate.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Assistenza, sicurezza e dati tecnici',
        paragraphs: [
          'Se ci contatti, SCHNGN invia il tipo di richiesta, il nome facoltativo, l’indirizzo e-mail, il messaggio e la lingua selezionata attraverso i servizi e-mail di Cloudflare alla nostra casella di assistenza Proton. La cronologia dei viaggi non viene mai allegata automaticamente, anche se riceveremo qualsiasi informazione tu inserisca nel messaggio. Separatamente, il browser invia un token Turnstile per la verifica; tale token non è incluso nell’e-mail di assistenza. Cloudflare usa l’indirizzo IP della connessione per limitare la frequenza delle richieste e verificare Turnstile e tratta normali metadati relativi a richiesta, dispositivo, browser, sicurezza ed errori durante l’erogazione e la protezione del sito. SCHNGN non usa Sentry e i log dell’applicazione non devono contenere il contenuto dei viaggi, le e-mail degli account o gli ID utente Clerk.'
        ]
      },
      {
        id: 'providers',
        title: '8. Fornitori di servizi e trattamento internazionale',
        paragraphs: [
          'SCHNGN utilizza Cloudflare per hosting, archiviazione, sicurezza e consegna delle e-mail; Clerk per identità e sessioni; Google solo quando scegli l’accesso con Google; Plausible per analisi aggregate limitate; e Proton per la casella di assistenza. Questi fornitori possono trattare dati in paesi diversi dal tuo. Le loro informative pubblicate descrivono ubicazioni, conservazione e garanzie per i trasferimenti. Condividiamo i dati solo per quanto necessario a fornire queste funzioni, proteggere il servizio, seguire le tue istruzioni o rispettare la legge; non vendiamo dati personali.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Conservazione, eliminazione e sicurezza',
        paragraphs: [
          'I dati del browser rimangono finché tu o il browser non li eliminate. I viaggi sincronizzati attivi rimangono finché non vengono sostituiti o eliminati. I messaggi di assistenza restano nella casella Proton finché SCHNGN non li elimina; al momento non viene promesso un termine fisso di cancellazione e dovrebbero essere rimossi quando non sono più ragionevolmente necessari per il seguito, la protezione del servizio, eventuali controversie o gli obblighi applicabili. I backup dei fornitori, i registri operativi, i dati degli account e le analisi aggregate seguono i periodi di conservazione configurati dai fornitori e possono impiegare del tempo a scadere dopo l’eliminazione dei dati attivi. SCHNGN utilizza controlli degli accessi, input convalidati, titolarità autenticata e connessioni HTTPS crittografate, ma nessun metodo di archiviazione online o locale è completamente sicuro.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Le tue scelte, i tuoi diritti e le modifiche all’informativa',
        paragraphs: [
          'Puoi utilizzare il calcolatore senza un account, cancellare i dati del browser, esportare i viaggi dal browser, eliminare l’istantanea di viaggio attiva dell’account o gestire ed eliminare il tuo account Clerk. A seconda della legge applicabile, puoi chiedere accesso, rettifica, cancellazione, limitazione o portabilità, opporti a determinati trattamenti, revocare il consenso quando ne costituisce la base e presentare un reclamo all’autorità locale per la protezione dei dati. Fornire dati dell’account o di assistenza è facoltativo, ma tali funzioni non possono operare senza questi dati. SCHNGN non adotta decisioni automatizzate con effetti giuridici significativi: i risultati del calcolatore sono stime di pianificazione. Aggiorneremo questa pagina prima di modificare in modo sostanziale l’uso dei dati.'
        ]
      }
    ],
    contactTitle: 'Domande o richieste sulla privacy',
    contactBody: 'Scrivi a support@schngn.com. Descrivi la richiesta senza inviare numeri di passaporto, visto o altri documenti sensibili. Potremmo dover verificare una richiesta relativa a un account prima di intervenire.',
    contactLinkLabel: 'Contatta l’assistenza SCHNGN',
    providerLinksTitle: 'Informazioni sulla privacy dei fornitori',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Informativa sulla privacy di Cloudflare',
      clerk: 'Informativa sulla privacy di Clerk',
      google: 'Norme sulla privacy di Google',
      plausible: 'Informativa sui dati di Plausible',
      proton: 'Informativa sulla privacy di Proton'
    })
  },
  terms: {
    navLabel: 'Sezioni dei termini',
    title: 'Termini di utilizzo',
    metaDescription: 'I termini per utilizzare il calcolatore SCHNGN della regola Schengen dei 90/180 giorni, l’archiviazione locale dei viaggi e le funzioni facoltative dell’account.',
    intro: 'I presenti Termini regolano l’utilizzo di schngn.com e dell’applicazione web SCHNGN. Sono scritti per preservare la promessa centrale del prodotto: uno strumento di pianificazione utile, con limiti trasparenti e account facoltativi.',
    updatedLabel: 'Ultimo aggiornamento',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Gli elementi essenziali',
    summaryItems: [
      'Il calcolatore è disponibile senza account; salvare i viaggi online è facoltativo.',
      'SCHNGN è uno strumento di pianificazione, non una consulenza legale né una garanzia di ingresso.',
      'Sei responsabile dell’esattezza delle date e della verifica delle fonti ufficiali prima del viaggio.',
      'Utilizza il servizio in modo lecito e mantieni sicuro l’accesso a qualsiasi account.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Utilizzo di SCHNGN',
        paragraphs: [
          'Utilizzando SCHNGN, accetti i presenti Termini e l’Informativa sulla privacy. Puoi utilizzare il calcolatore come ospite. Se crei un account, devi avere la capacità giuridica di accettare questi Termini; chi non dispone di tale capacità deve usare SCHNGN solo con un genitore, tutore o altra persona autorizzata. Se non accetti, non utilizzare il servizio.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Solo uno strumento di pianificazione',
        paragraphs: [
          'SCHNGN stima i normali soggiorni brevi in base alla regola Schengen dei 90/180 giorni. Non è consulenza legale o in materia di immigrazione e non garantisce l’ingresso, la regolarità del soggiorno o alcuna decisione di un’autorità di frontiera, dei visti o dell’immigrazione. Potrebbe non tenere conto di permessi di soggiorno, visti nazionali o per soggiorni di lunga durata, accordi bilaterali di esenzione, eccezioni specifiche per nazionalità, lavoro, studio, asilo o protezione temporanea, passaggi tra regole o discrezionalità delle autorità. Un avviso specifico per passaporto o paese su un possibile accordo bilaterale è informativo e non modifica il calcolo di base né stabilisce che si applichi una proroga. Verifica la tua situazione con fonti ufficiali e presso le autorità competenti prima di prenotare o viaggiare.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Le tue responsabilità',
        paragraphs: [
          'Sei responsabile dell’inserimento di date complete ed esatte, dell’interpretazione del risultato alla luce della tua situazione personale, della conservazione dei backup necessari e della verifica indipendente delle regole vigenti. Le prove di ingresso e uscita, le condizioni del visto e le istruzioni delle autorità prevalgono su SCHNGN. Non fare affidamento su un risultato memorizzato nella cache, esportato o calcolato in precedenza dopo che i tuoi piani o le regole applicabili sono cambiati.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Archiviazione locale, account e sincronizzazione',
        paragraphs: [
          'I viaggi degli ospiti vengono salvati nel browser e possono andare perduti se si cancellano i dati del sito, se il dispositivo si guasta o se un’altra persona modifica il profilo del browser. Gli account facoltativi sono forniti tramite Clerk. Un’azione indicata per registrarsi e salvare o una scelta separata di sincronizzazione autorizza SCHNGN ad archiviare l’istantanea di viaggio convalidata per quell’account. Proteggi l’accesso all’account, esci e cancella i dati del browser sui dispositivi condivisi quando opportuno e consulta l’Informativa sulla privacy per i dettagli su esportazione, eliminazione e fornitori.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Uso consentito',
        paragraphs: [
          'Non utilizzare SCHNGN in modo improprio, non interferire con il suo funzionamento o la sua sicurezza, non sondare o aggirare i controlli degli accessi, non inviare materiale illecito o dannoso, non automatizzare traffico abusivo, non impersonare altre persone, non accedere all’account altrui e non utilizzare il servizio per facilitare frodi o viaggi illeciti. Test di sicurezza ragionevoli richiedono un’autorizzazione scritta preventiva. Possiamo limitare l’accesso nella misura necessaria a fermare gli abusi, proteggere gli utenti o rispettare la legge.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. Contenuti SCHNGN e servizi di terzi',
        paragraphs: [
          'Il nome, il design, il software e i contenuti originali di SCHNGN sono protetti dalle leggi applicabili sulla proprietà intellettuale. I presenti Termini ti concedono un diritto limitato, revocabile e non esclusivo di utilizzare il servizio per la pianificazione personale; non trasferiscono la proprietà. I link a fonti ufficiali, Clerk, Google, Cloudflare, Plausible e altri servizi di terzi sono soggetti ai rispettivi termini e informative. SCHNGN non è un’istituzione dell’UE e non è approvato o certificato dall’Unione europea.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Disponibilità e modifiche',
        paragraphs: [
          'Ci impegniamo a mantenere SCHNGN accurato e disponibile, ma il servizio può essere interrotto, ritardato o modificato. Funzioni, fornitori, regole supportate o disponibilità gratuita possono cambiare e possiamo correggere o rimuovere contenuti. Quando ragionevolmente possibile, le modifiche sostanziali che incidono sui dati salvati nell’account verranno spiegate prima che abbiano effetto. Conserva documenti indipendenti per qualsiasi decisione di viaggio importante per te.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Esclusioni di garanzia e responsabilità',
        paragraphs: [
          'Nella misura massima consentita dalla legge, SCHNGN viene fornito «così com’è» e «secondo disponibilità», senza promessa che ogni risultato, fonte, fornitore o funzione sia sempre completo, aggiornato o privo di errori. Ove la legge consenta tale limitazione, SCHNGN non è responsabile di decisioni delle autorità, ingressi negati, permanenze oltre il termine, sanzioni, costi di viaggio, prenotazioni perse, dati locali perduti o perdite indirette causate dall’affidamento sul servizio. Nulla nei presenti Termini esclude responsabilità che non possono essere legalmente escluse o limita i diritti inderogabili dei consumatori.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Cessazione dell’utilizzo, diritti applicabili e contatti',
        paragraphs: [
          'Puoi smettere di utilizzare SCHNGN in qualsiasi momento, cancellare i dati locali, eliminare l’istantanea di viaggio sincronizzata attiva e gestire o eliminare separatamente l’account Clerk. Possiamo sospendere un uso abusivo o illecito. Le norme imperative applicabili e le tutele dei consumatori restano in vigore; i presenti Termini non scelgono un tribunale né eliminano i diritti riconosciuti dalla legge. Possiamo aggiornare questi Termini quando cambiano il servizio o i requisiti di legge, indicando la data sopra. Puoi inviare domande a support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Domande su questi Termini',
    contactBody: 'Contatta support@schngn.com per domande su SCHNGN o sui presenti Termini. L’assistenza del prodotto non può determinare il tuo status di immigrazione né fornire consulenza legale.',
    contactLinkLabel: 'Contatta l’assistenza SCHNGN'
  }
};

const ptBrCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Informações legais e suporte',
    privacy: 'Privacidade',
    terms: 'Termos',
    contact: 'Contato',
    disclaimer: 'Apenas uma ferramenta de planejamento — não é orientação jurídica nem garantia de entrada. Consulte fontes oficiais.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Seções da política de privacidade',
    title: 'Política de Privacidade',
    metaDescription: 'Como o SCHNGN trata dados de viagem locais, sincronização opcional, login com Google, análises, solicitações de suporte e suas escolhas de privacidade.',
    intro: 'O SCHNGN foi desenvolvido para calcular planos de viagem sem exigir uma conta. Esta política explica o que permanece no seu navegador, o que é tratado quando você escolhe recursos on-line opcionais e quais controles estão disponíveis para você.',
    updatedLabel: 'Última atualização',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Em resumo',
    summaryItems: [
      'Os detalhes das viagens de visitantes permanecem no navegador, a menos que você escolha expressamente a sincronização com uma conta.',
      'O login com Google é usado para criar, proteger, autenticar e identificar uma conta opcional do SCHNGN e associar as viagens que você escolher salvar.',
      'A Plausible pode receber categorias gerais de uso e resultado, mas nunca as datas, etiquetas ou países das suas viagens, seu e-mail ou ID da conta.',
      'Você pode exportar a cópia atual das viagens no navegador e excluir o registro ativo de viagens salvo na sua conta.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. O que esta política abrange',
        paragraphs: [
          'Esta política abrange o schngn.com, o aplicativo web SCHNGN e seus recursos de conta, sincronização, análise e suporte. O SCHNGN é uma calculadora de planejamento e, como parte de seus recursos normais, não solicita acesso ao GPS, não digitaliza passaportes nem coleta números de vistos ou documentos de residência.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Quem é responsável e por que os dados são tratados',
        paragraphs: [
          'O SCHNGN opera o schngn.com e é responsável pelo tratamento específico do aplicativo descrito aqui. Envie dúvidas sobre privacidade para support@schngn.com. Tratamos dados de conta, sincronização e suporte para oferecer os recursos solicitados; dados limitados de análise e segurança para compreender e proteger o serviço; dados baseados em consentimento quando ele for exigido; e dados necessários para cumprir obrigações legais aplicáveis.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Uso como visitante e armazenamento no navegador',
        paragraphs: [
          'Quando você usa o SCHNGN como visitante, as datas e etiquetas das viagens, o contexto opcional do país de fronteira, os intervalos de permanência, o status e os resultados dos cálculos permanecem no seu navegador. Os cálculos e as simulações não salvas são executados no seu dispositivo. A pergunta opcional sobre o passaporte usa somente o país emissor na memória temporária do navegador para mostrar um possível aviso sobre acordo bilateral; essa informação não é salva com as viagens nem enviada para análises. O armazenamento do navegador também mantém preferências funcionais, como idioma e resposta sobre viagens anteriores; arquivos públicos do aplicativo podem ser armazenados em cache para uso off-line. Um backup JSON é criado e lido localmente sob seu controle e não é enviado pelo simples fato de você exportá-lo ou importá-lo.'
        ],
        items: [
          'As viagens permanecem armazenadas no navegador até que você as apague ou substitua, ou exclua os dados do site.',
          'O cookie de preferência de idioma dura até um ano.',
          'Os backups JSON locais são arquivos sem criptografia; você é responsável por armazená-los com segurança.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Contas opcionais e login com Google',
        paragraphs: [
          'A Clerk é carregada nas páginas públicas do SCHNGN para verificar se você está conectado e pode tratar dados essenciais de sessão, dispositivo e rede de acordo com sua política de privacidade. Se você escolher o login com Google, o Google enviará seus dados básicos de identidade e a resposta OAuth à Clerk. A Clerk gerencia as credenciais ou tokens do provedor e a sessão da conta conforme sua política. O SCHNGN recebe a sessão e o ID de usuário da Clerk resultantes para identificar a conta ativa, mostrar seu status de login e e-mail e associar as viagens que você escolher salvar expressamente. Somente o ID de usuário da Clerk — e não seu e-mail do Google, nome, imagem do perfil, senha ou tokens do provedor — é armazenado no Cloudflare D1 com essas viagens. O SCHNGN não solicita acesso ao Gmail, Google Drive, Agenda, contatos ou outro conteúdo do Google e não vende dados de usuários do Google nem os usa para publicidade.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Sincronização, exportação e exclusão opcionais de viagens',
        paragraphs: [
          'Concluir uma ação claramente identificada de cadastro e salvamento, ou ativar separadamente a sincronização enquanto estiver conectado, envia o registro validado das viagens atuais ao Cloudflare D1. Esse registro inclui o ID de usuário da Clerk verificado, todos os detalhes das viagens salvas, metadados de revisão e consentimento e datas e horários. Depois da ativação, alterações ou importações salvas posteriormente podem ser sincronizadas. O navegador também armazena o ID de usuário da Clerk, a revisão do servidor, o estado de sincronização ou pausa e uma impressão digital das viagens para reconciliação; a escolha de se cadastrar e salvar é mantida temporariamente no armazenamento da sessão. Esses metadados de sincronização não fazem parte da exportação JSON das viagens; eles são removidos pela ação “Sair e limpar este navegador” ou quando você apaga os dados do site. A exportação JSON contém a cópia atual das viagens do navegador, e não todos os dados de identidade, suporte, registros ou dados mantidos pelos fornecedores. “Excluir viagens salvas na conta” remove o registro ativo do D1, mas não exclui as viagens do navegador nem a conta da Clerk. A exclusão da conta da Clerk aciona a remoção do registro e cria uma proteção unidirecional com hash da exclusão da conta que permanece ativa por 30 dias para impedir que sessões antigas voltem a criá-la; depois disso, ela é ignorada e removida quando houver oportunidade.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Análises agregadas',
        paragraphs: [
          'No site de produção, a Plausible pode receber eventos incluídos em uma lista permitida, como visualização de página, início da calculadora, viagem adicionada e simulação executada, junto com categorias gerais como faixa da quantidade de viagens, resultado, faixa da margem de segurança ou origem. O SCHNGN remove parâmetros de consulta e fragmentos das URLs e proíbe datas, etiquetas, países e cronologias de viagens, escolha de passaporte, e-mails e identificadores de conta. O Plausible Analytics é configurado sem cookies de análise ou acompanhamento automático de formulários, downloads e links externos. Informações comuns de rede ainda podem ser tratadas pela Plausible para produzir estatísticas agregadas.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Suporte, segurança e dados técnicos',
        paragraphs: [
          'Se você entrar em contato conosco, o SCHNGN enviará o tipo de solicitação, nome opcional, endereço de e-mail, mensagem e idioma selecionado por meio dos serviços de e-mail da Cloudflare para nossa caixa de suporte da Proton. O histórico de viagens nunca é anexado automaticamente, embora tudo o que você digitar na mensagem seja recebido. Separadamente, o navegador envia um token do Turnstile para verificação; esse token não é incluído no e-mail de suporte. A Cloudflare usa o endereço IP da conexão para limitar a frequência e verificar o Turnstile e trata metadados comuns da solicitação, dispositivo, navegador, segurança e erros ao disponibilizar e proteger o site. O SCHNGN não usa o Sentry, e os logs do aplicativo não devem conter o conteúdo das viagens, e-mails de contas ou IDs de usuário da Clerk.'
        ]
      },
      {
        id: 'providers',
        title: '8. Fornecedores de serviços e tratamento internacional',
        paragraphs: [
          'O SCHNGN usa a Cloudflare para hospedagem, armazenamento, segurança e entrega de e-mails; a Clerk para identidade e sessões; o Google somente quando você escolhe o login com Google; a Plausible para análises agregadas restritas; e a Proton para a caixa de suporte. Esses fornecedores podem tratar dados em países diferentes do seu. Os avisos publicados por eles descrevem locais, retenção e salvaguardas de transferência. Compartilhamos dados somente na medida necessária para oferecer essas funções, proteger o serviço, seguir suas instruções ou cumprir a lei; não vendemos dados pessoais.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Retenção, exclusão e segurança',
        paragraphs: [
          'Os dados do navegador permanecem até que você ou seu navegador os removam. As viagens sincronizadas ativas permanecem até serem substituídas ou excluídas. As mensagens de suporte permanecem na caixa da Proton até que o SCHNGN as exclua; atualmente não é prometido um prazo fixo de exclusão, e elas devem ser removidas quando deixarem de ser razoavelmente necessárias para acompanhamento, proteção do serviço, controvérsias ou obrigações aplicáveis. Backups de fornecedores, registros operacionais, dados de contas e análises agregadas seguem os prazos de retenção configurados pelos fornecedores e podem levar algum tempo para expirar após a exclusão dos dados ativos. O SCHNGN usa controles de acesso, entradas validadas, titularidade autenticada e conexões HTTPS criptografadas, mas nenhum método de armazenamento on-line ou local é totalmente seguro.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Suas escolhas, direitos e alterações nesta política',
        paragraphs: [
          'Você pode usar a calculadora sem uma conta, limpar os dados do navegador, exportar as viagens do navegador, excluir o registro ativo de viagens da conta ou gerenciar e excluir sua conta da Clerk. Dependendo da legislação aplicável, você pode solicitar acesso, correção, exclusão, restrição ou portabilidade, opor-se a determinados tratamentos, retirar o consentimento quando ele for a base e apresentar reclamação à autoridade local de proteção de dados. O fornecimento de dados de conta ou suporte é opcional, mas essas funções não funcionam sem eles. O SCHNGN não toma decisões automatizadas com efeitos jurídicos significativos: os resultados da calculadora são estimativas de planejamento. Atualizaremos esta página antes de alterar de forma relevante como os dados são usados.'
        ]
      }
    ],
    contactTitle: 'Dúvidas ou solicitações sobre privacidade',
    contactBody: 'Envie um e-mail para support@schngn.com. Descreva a solicitação sem enviar números de passaporte, visto ou outro documento sensível. Talvez precisemos verificar uma solicitação relacionada a uma conta antes de atendê-la.',
    contactLinkLabel: 'Contatar o suporte do SCHNGN',
    providerLinksTitle: 'Informações de privacidade dos fornecedores',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Política de Privacidade da Cloudflare',
      clerk: 'Política de Privacidade da Clerk',
      google: 'Política de Privacidade do Google',
      plausible: 'Política de Dados da Plausible',
      proton: 'Política de Privacidade da Proton'
    })
  },
  terms: {
    navLabel: 'Seções dos termos',
    title: 'Termos de Uso',
    metaDescription: 'Os termos para usar a calculadora SCHNGN da regra Schengen de 90/180 dias, o armazenamento local de viagens e os recursos opcionais da conta.',
    intro: 'Estes Termos regem seu uso do schngn.com e do aplicativo web SCHNGN. Eles foram redigidos para preservar a promessa central do produto: uma ferramenta de planejamento útil, com limites transparentes e contas opcionais.',
    updatedLabel: 'Última atualização',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'O essencial',
    summaryItems: [
      'A calculadora está disponível sem uma conta; salvar viagens on-line é opcional.',
      'O SCHNGN é uma ferramenta de planejamento, não orientação jurídica nem garantia de entrada.',
      'Você é responsável pela exatidão das datas e por consultar fontes oficiais antes de viajar.',
      'Use o serviço de forma lícita e mantenha seguro o acesso a qualquer conta.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Uso do SCHNGN',
        paragraphs: [
          'Ao usar o SCHNGN, você concorda com estes Termos e com a Política de Privacidade. Você pode usar a calculadora como visitante. Se criar uma conta, deve ter capacidade legal para concordar com estes Termos; qualquer pessoa sem essa capacidade deve usar o SCHNGN somente com um dos pais, responsável ou outra pessoa autorizada. Se você não concordar, não use o serviço.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Apenas uma ferramenta de planejamento',
        paragraphs: [
          'O SCHNGN estima estadias curtas comuns de acordo com a regra Schengen de 90/180 dias. Ele não oferece orientação jurídica ou de imigração e não garante a entrada, a permanência legal ou qualquer decisão de uma autoridade de fronteira, vistos ou imigração. Ele pode não considerar autorizações de residência, vistos nacionais ou de longa permanência, acordos bilaterais de isenção, exceções específicas de nacionalidade, trabalho, estudo, asilo ou proteção temporária, transições de regras ou poder discricionário das autoridades. Um aviso específico de passaporte ou país sobre um possível acordo bilateral é informativo e não altera o cálculo principal nem determina que uma extensão seja aplicável. Verifique sua situação com fontes oficiais e as autoridades competentes antes de reservar ou viajar.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Suas responsabilidades',
        paragraphs: [
          'Você é responsável por inserir datas completas e exatas, interpretar o resultado considerando sua própria situação, manter os backups necessários e verificar de forma independente as regras vigentes. Comprovantes de entrada e saída, condições do visto e instruções das autoridades prevalecem sobre o SCHNGN. Não confie em um resultado armazenado em cache, exportado ou calculado anteriormente depois que seus planos ou as regras aplicáveis mudarem.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Armazenamento local, contas e sincronização',
        paragraphs: [
          'As viagens dos visitantes são armazenadas no navegador e podem ser perdidas se os dados do site forem apagados, o dispositivo falhar ou outra pessoa alterar o perfil do navegador. As contas opcionais são fornecidas pela Clerk. Uma ação identificada de cadastro e salvamento ou uma escolha separada de sincronização autoriza o SCHNGN a armazenar o registro validado das viagens dessa conta. Proteja o acesso à conta, saia e limpe os dados do navegador em dispositivos compartilhados quando apropriado e consulte a Política de Privacidade para obter detalhes sobre exportação, exclusão e fornecedores.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Uso aceitável',
        paragraphs: [
          'Não use o SCHNGN indevidamente, não interfira no funcionamento ou na segurança, não investigue nem contorne controles de acesso, não envie conteúdo ilícito ou nocivo, não automatize tráfego abusivo, não se passe por outra pessoa, não acesse outra conta e não use o serviço para facilitar fraudes ou viagens ilícitas. Testes de segurança razoáveis exigem autorização prévia por escrito. Podemos restringir o acesso conforme necessário para interromper o uso indevido, proteger usuários ou cumprir a lei.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. Conteúdo do SCHNGN e serviços de terceiros',
        paragraphs: [
          'O nome, o design, o software e o conteúdo original do SCHNGN são protegidos pelas leis de propriedade intelectual aplicáveis. Estes Termos concedem a você um direito limitado, revogável e não exclusivo de usar o serviço para planejamento pessoal; eles não transferem propriedade. Links para fontes oficiais, Clerk, Google, Cloudflare, Plausible e outros serviços de terceiros têm seus próprios termos e políticas. O SCHNGN não é uma instituição da UE e não é endossado ou certificado pela União Europeia.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Disponibilidade e alterações',
        paragraphs: [
          'Buscamos manter o SCHNGN exato e disponível, mas o serviço pode sofrer interrupções, atrasos ou alterações. Recursos, fornecedores, regras compatíveis ou disponibilidade gratuita podem mudar, e podemos corrigir ou remover conteúdo. Sempre que for razoavelmente possível, alterações relevantes que afetem dados salvos na conta serão explicadas antes de entrarem em vigor. Mantenha registros independentes para qualquer decisão de viagem que seja importante para você.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Isenções e responsabilidade',
        paragraphs: [
          'Na máxima medida permitida por lei, o SCHNGN é fornecido “no estado em que se encontra” e “conforme disponível”, sem promessa de que todo resultado, fonte, fornecedor ou recurso será sempre completo, atual ou livre de erros. Quando a lei permitir essa limitação, o SCHNGN não se responsabiliza por decisões de autoridades, entrada negada, permanência além do prazo, multas, custos de viagem, reservas perdidas, dados locais perdidos ou perdas indiretas causadas pela confiança no serviço. Nada nestes Termos exclui responsabilidade que não possa ser legalmente excluída ou limita direitos obrigatórios dos consumidores.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Encerramento do uso, direitos aplicáveis e contato',
        paragraphs: [
          'Você pode deixar de usar o SCHNGN a qualquer momento, limpar os dados locais, excluir o registro ativo de viagens sincronizadas e gerenciar ou excluir separadamente a conta da Clerk. Podemos suspender o uso abusivo ou ilícito. A legislação obrigatória aplicável e as proteções aos consumidores permanecem em vigor; estes Termos não escolhem um tribunal nem retiram direitos concedidos a você por lei. Podemos atualizar estes Termos quando o serviço ou os requisitos legais mudarem, com a data indicada acima. Dúvidas podem ser enviadas para support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Dúvidas sobre estes Termos',
    contactBody: 'Entre em contato com support@schngn.com se tiver dúvidas sobre o SCHNGN ou estes Termos. O suporte do produto não pode decidir sua situação migratória nem fornecer orientação jurídica.',
    contactLinkLabel: 'Contatar o suporte do SCHNGN'
  }
};

const ruCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Правовая информация и поддержка',
    privacy: 'Конфиденциальность',
    terms: 'Условия',
    contact: 'Контакты',
    disclaimer: 'Только для планирования — не является юридической консультацией или гарантией въезда. Сверяйтесь с официальными источниками.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Разделы политики конфиденциальности',
    title: 'Политика конфиденциальности',
    metaDescription: 'Как SCHNGN обрабатывает локальные данные о поездках, необязательную синхронизацию, вход через Google, аналитику, обращения в поддержку и ваши настройки конфиденциальности.',
    intro: 'SCHNGN позволяет рассчитывать планы поездок без обязательной регистрации. В этой политике объясняется, что остаётся в вашем браузере, какие данные обрабатываются при выборе необязательных онлайн-функций и как вы можете ими управлять.',
    updatedLabel: 'Последнее обновление',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Кратко',
    summaryItems: [
      'Данные о поездках гостя остаются в его браузере, если он явно не выберет синхронизацию с аккаунтом.',
      'Вход через Google используется для создания, защиты, аутентификации и идентификации необязательного аккаунта SCHNGN, а также для привязки поездок, которые вы решите сохранить.',
      'Plausible может получать обобщённые категории использования и результатов, но никогда не получает даты, названия или страны ваших поездок, адрес электронной почты или идентификатор аккаунта.',
      'Вы можете экспортировать текущую копию поездок из браузера и удалить активный снимок поездок, сохранённый в аккаунте.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. На что распространяется эта политика',
        paragraphs: [
          'Эта политика распространяется на schngn.com, веб-приложение SCHNGN и его функции, связанные с аккаунтами, синхронизацией, аналитикой и поддержкой. SCHNGN — это калькулятор для планирования. В рамках обычных функций он не запрашивает доступ к GPS, не сканирует паспорта и не собирает номера виз или документов на проживание.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Кто отвечает за данные и зачем они обрабатываются',
        paragraphs: [
          'SCHNGN управляет сайтом schngn.com и отвечает за описанную здесь обработку данных, необходимую для работы приложения. По вопросам конфиденциальности обращайтесь по адресу support@schngn.com. Мы обрабатываем данные аккаунта, синхронизации и поддержки, чтобы предоставлять запрошенные вами функции; ограниченные аналитические данные и данные безопасности — чтобы понимать работу сервиса и защищать его; данные на основании согласия — когда оно требуется; а также данные, необходимые для выполнения применимых требований закона.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Использование без аккаунта и хранение в браузере',
        paragraphs: [
          'Если вы используете SCHNGN как гость, даты и названия поездок, необязательная информация о стране пересечения границы, периоды пребывания, статус и результаты расчётов остаются в вашем браузере. Расчёты и несохранённые симуляции выполняются на вашем устройстве. В необязательном вопросе о паспорте страна выдачи используется только во временной памяти браузера, чтобы показать уведомление о возможном двустороннем соглашении; она не сохраняется вместе с поездками и не отправляется в аналитику. В браузере также сохраняются функциональные настройки, например язык и ответ о предыдущих поездках; общедоступные файлы приложения могут кэшироваться для работы без интернета. Резервная копия JSON создаётся и читается локально под вашим контролем и не загружается на сервер только потому, что вы её экспортируете или импортируете.'
        ],
        items: [
          'Данные о поездках остаются в браузере, пока вы не удалите или не замените их либо не очистите данные сайта.',
          'Файл cookie с настройкой языка хранится до одного года.',
          'Локальные резервные копии JSON представляют собой незашифрованные файлы; вы отвечаете за их безопасное хранение.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Необязательные аккаунты и вход через Google',
        paragraphs: [
          'Clerk загружается на общедоступных страницах SCHNGN, чтобы проверить, вошли ли вы в аккаунт, и может обрабатывать необходимые данные сеанса, устройства и сети в соответствии со своей политикой конфиденциальности. Если вы выбираете вход через Google, Google отправляет ваши основные идентификационные данные и ответ OAuth в Clerk. Clerk обрабатывает учётные данные или токены поставщика и сеанс аккаунта в соответствии со своей политикой. SCHNGN получает итоговый сеанс Clerk и идентификатор пользователя, чтобы определить активный аккаунт, показать состояние входа и адрес электронной почты и связать с аккаунтом поездки, которые вы явно решили сохранить. Вместе с этими поездками в Cloudflare D1 сохраняется только идентификатор пользователя Clerk, а не ваш адрес Google, имя, изображение профиля, пароль или токены поставщика. SCHNGN не запрашивает доступ к Gmail, Google Drive, Календарю, контактам или другому содержимому Google, не продаёт данные пользователей Google и не использует их для рекламы.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Необязательная синхронизация, экспорт и удаление поездок',
        paragraphs: [
          'После завершения явно обозначенного действия «Зарегистрироваться и сохранить» или отдельного включения синхронизации при активном входе текущий проверенный снимок поездок отправляется в Cloudflare D1. Он включает проверенный идентификатор пользователя Clerk, полные сведения о сохранённых поездках, метаданные версии и согласия, а также временные метки. После включения синхронизации последующие сохранённые изменения или импортированные данные также могут синхронизироваться. Браузер также хранит идентификатор пользователя Clerk, номер версии на сервере, состояние синхронизации или паузы и отпечаток поездок для согласования; выбор регистрации и сохранения временно хранится в хранилище сеанса. Эти метаданные синхронизации не входят в JSON-экспорт поездок; они удаляются действием «Выйти и очистить этот браузер» или при очистке данных сайта. Экспорт JSON содержит текущую копию поездок из браузера, а не все данные об идентификации, поддержке, журналах или данные, хранящиеся у поставщиков. Действие «Удалить поездки, сохранённые в аккаунте» удаляет активный снимок D1, но не удаляет поездки из браузера или аккаунт Clerk. При удалении аккаунта Clerk запускается очистка снимка и создаётся односторонний хешированный защитный маркер удаления аккаунта, который действует 30 дней, чтобы устаревший сеанс не мог создать его снова; затем он игнорируется и удаляется при удобной возможности.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Агрегированная аналитика',
        paragraphs: [
          'На рабочем сайте Plausible может получать только разрешённые события, например просмотр страницы, запуск калькулятора, добавление поездки и запуск симуляции, а также обобщённые категории: диапазон количества поездок, результат, диапазон безопасного запаса или источник. SCHNGN удаляет строки запросов и фрагменты URL и запрещает передавать даты, названия, страны и хронологию поездок, выбор паспорта, адреса электронной почты и идентификаторы аккаунтов. Plausible Analytics настроен без аналитических cookie-файлов и без автоматического отслеживания форм, загрузок и исходящих ссылок. При этом Plausible может обрабатывать обычную сетевую информацию для подготовки агрегированной статистики.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Поддержка, безопасность и технические данные',
        paragraphs: [
          'Если вы обращаетесь к нам, SCHNGN отправляет тип запроса, необязательное имя, адрес электронной почты, сообщение и выбранный язык через почтовые службы Cloudflare в наш ящик поддержки Proton. История поездок никогда не прикладывается автоматически, однако мы получим всё, что вы введёте в сообщение. Отдельно браузер отправляет токен Turnstile для проверки; этот токен не включается в письмо в поддержку. Cloudflare использует IP-адрес соединения для ограничения частоты запросов и проверки Turnstile, а при доставке и защите сайта обрабатывает обычные метаданные запроса, устройства, браузера, безопасности и ошибок. SCHNGN не использует Sentry, а журналы приложения не должны содержать сведения о поездках, адреса электронной почты аккаунтов или идентификаторы пользователей Clerk.'
        ]
      },
      {
        id: 'providers',
        title: '8. Поставщики услуг и международная обработка',
        paragraphs: [
          'SCHNGN использует Cloudflare для хостинга, хранения, безопасности и доставки электронной почты; Clerk — для идентификации и сеансов; Google — только если вы выбираете вход через Google; Plausible — для ограниченной агрегированной аналитики; Proton — для почтового ящика поддержки. Эти поставщики могут обрабатывать данные в странах за пределами вашей страны. В их опубликованных документах описаны места обработки, сроки хранения и меры защиты при передаче данных. Мы передаём данные только в объёме, необходимом для предоставления этих функций, защиты сервиса, выполнения ваших указаний или соблюдения закона; мы не продаём персональные данные.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Хранение, удаление и безопасность',
        paragraphs: [
          'Данные в браузере сохраняются до тех пор, пока вы или ваш браузер не удалите их. Активные синхронизированные поездки сохраняются до замены или удаления. Сообщения в поддержку остаются в ящике Proton, пока SCHNGN не удалит их; сейчас фиксированный срок удаления не установлен, и сообщения следует удалять, когда они больше не нужны в разумной мере для последующего взаимодействия, защиты сервиса, разрешения споров или выполнения применимых обязательств. Резервные копии поставщиков, операционные записи, данные аккаунта и агрегированная аналитика хранятся в соответствии с настроенными поставщиками сроками и могут быть окончательно удалены не сразу после удаления активных данных. SCHNGN использует контроль доступа, проверку введённых данных, аутентифицированное определение владельца и зашифрованные HTTPS-соединения, однако ни один способ локального или онлайн-хранения не обеспечивает абсолютной безопасности.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Ваш выбор, права и изменения политики',
        paragraphs: [
          'Вы можете использовать калькулятор без аккаунта, очистить данные браузера, экспортировать поездки из браузера, удалить активный снимок поездок аккаунта, а также управлять своим аккаунтом Clerk или удалить его. В зависимости от применимого законодательства вы можете запросить доступ, исправление, удаление, ограничение обработки или переносимость данных, возразить против определённой обработки, отозвать согласие, если обработка основана на нём, и подать жалобу в местный орган по защите данных. Предоставление данных аккаунта или поддержки необязательно, но соответствующие функции без них не работают. SCHNGN не принимает автоматизированных решений, имеющих существенные юридические последствия: результаты калькулятора являются оценками для планирования. Мы обновим эту страницу до того, как существенно изменим порядок использования данных.'
        ]
      }
    ],
    contactTitle: 'Вопросы и запросы о конфиденциальности',
    contactBody: 'Напишите на support@schngn.com. Опишите запрос, не отправляя номера паспорта, визы или других конфиденциальных документов. Перед выполнением запроса, связанного с аккаунтом, нам может потребоваться подтвердить его.',
    contactLinkLabel: 'Связаться с поддержкой SCHNGN',
    providerLinksTitle: 'Информация поставщиков о конфиденциальности',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Политика конфиденциальности Cloudflare',
      clerk: 'Политика конфиденциальности Clerk',
      google: 'Политика конфиденциальности Google',
      plausible: 'Политика Plausible в отношении данных',
      proton: 'Политика конфиденциальности Proton'
    })
  },
  terms: {
    navLabel: 'Разделы условий',
    title: 'Условия использования',
    metaDescription: 'Условия использования калькулятора SCHNGN для правила 90/180 дней в Шенгенской зоне, локального хранения поездок и необязательных функций аккаунта.',
    intro: 'Эти Условия регулируют использование сайта schngn.com и веб-приложения SCHNGN. Они призваны сохранить главное обещание продукта: полезный инструмент планирования с прозрачными ограничениями и необязательными аккаунтами.',
    updatedLabel: 'Последнее обновление',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Главное',
    summaryItems: [
      'Калькулятор доступен без аккаунта; сохранять поездки онлайн необязательно.',
      'SCHNGN — это инструмент планирования, а не юридическая консультация или гарантия въезда.',
      'Вы отвечаете за точность дат и должны сверяться с официальными источниками до поездки.',
      'Используйте сервис законно и защищайте доступ к своему аккаунту.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Использование SCHNGN',
        paragraphs: [
          'Используя SCHNGN, вы соглашаетесь с этими Условиями и Политикой конфиденциальности. Вы можете пользоваться калькулятором как гость. Если вы создаёте аккаунт, вы должны обладать законной дееспособностью для принятия этих Условий; лицам, у которых её нет, следует использовать SCHNGN только с родителем, опекуном или другим уполномоченным лицом. Если вы не согласны, не используйте сервис.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Только инструмент планирования',
        paragraphs: [
          'SCHNGN оценивает обычные краткосрочные пребывания по правилу Шенгенской зоны 90/180 дней. Он не предоставляет юридических или иммиграционных консультаций и не гарантирует въезд, законность пребывания или какое-либо решение пограничного, визового или иммиграционного органа. Он может не учитывать виды на жительство, долгосрочные или национальные визы, двусторонние соглашения об освобождении, исключения для отдельных гражданств, работу, учёбу, убежище или временную защиту, переходные положения правил или усмотрение органов власти. Уведомление для определённого паспорта или страны о возможном двустороннем соглашении носит информационный характер, не изменяет основной расчёт и не устанавливает, что продление применимо. До бронирования или поездки проверьте свою ситуацию по официальным источникам и у компетентных органов.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Ваша ответственность',
        paragraphs: [
          'Вы отвечаете за ввод полных и точных дат, толкование результата с учётом собственного статуса, хранение необходимых резервных копий и самостоятельную проверку действующих правил. Подтверждения въезда и выезда, условия визы и указания органов власти имеют приоритет над SCHNGN. Не полагайтесь на кэшированный, экспортированный или рассчитанный ранее результат после изменения ваших планов или применимых правил.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Локальное хранение, аккаунты и синхронизация',
        paragraphs: [
          'Поездки гостей хранятся в браузере и могут быть потеряны при очистке данных сайта, поломке устройства или изменении профиля браузера другим лицом. Необязательные аккаунты предоставляются через Clerk. Обозначенное действие регистрации и сохранения или отдельный выбор синхронизации разрешает SCHNGN хранить проверенный снимок поездок этого аккаунта. Защищайте доступ к аккаунту, выходите из него и при необходимости очищайте данные браузера на общих устройствах. Подробнее об экспорте, удалении и поставщиках см. в Политике конфиденциальности.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Допустимое использование',
        paragraphs: [
          'Не используйте SCHNGN ненадлежащим образом, не вмешивайтесь в его работу или безопасность, не исследуйте и не обходите средства контроля доступа, не отправляйте незаконные или вредоносные материалы, не создавайте автоматизированный вредоносный трафик, не выдавайте себя за другое лицо, не получайте доступ к чужому аккаунту и не используйте сервис для содействия мошенничеству или незаконным поездкам. Для обоснованного тестирования безопасности необходимо предварительное письменное разрешение. Мы можем ограничить доступ в объёме, необходимом для прекращения злоупотреблений, защиты пользователей или соблюдения закона.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. Материалы SCHNGN и сторонние сервисы',
        paragraphs: [
          'Название, дизайн, программное обеспечение и оригинальные материалы SCHNGN защищены применимым законодательством об интеллектуальной собственности. Эти Условия предоставляют вам ограниченное, отзывное и неисключительное право использовать сервис для личного планирования; они не передают права собственности. Ссылки на официальные источники, Clerk, Google, Cloudflare, Plausible и другие сторонние сервисы регулируются их собственными условиями и политиками. SCHNGN не является учреждением ЕС и не одобрен и не сертифицирован Европейским союзом.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Доступность и изменения',
        paragraphs: [
          'Мы стремимся поддерживать точность и доступность SCHNGN, однако работа сервиса может прерываться, задерживаться или изменяться. Функции, поставщики, поддерживаемые правила или бесплатная доступность могут измениться, а материалы могут быть исправлены или удалены. Насколько это обоснованно возможно, мы заранее разъясним существенные изменения, затрагивающие сохранённые данные аккаунта. Храните независимые записи по любым важным для вас решениям о поездках.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Отказ от гарантий и ответственность',
        paragraphs: [
          'В максимально допустимой законом степени SCHNGN предоставляется «как есть» и «по мере доступности» без обещания, что каждый результат, источник, поставщик или функция всегда будут полными, актуальными и безошибочными. Если закон допускает такое ограничение, SCHNGN не отвечает за решения органов власти, отказ во въезде, превышение срока пребывания, штрафы, расходы на поездку, пропущенные бронирования, потерю локальных данных или косвенные убытки, вызванные доверием к сервису. Ничто в этих Условиях не исключает ответственность, которую нельзя исключить по закону, и не ограничивает обязательные права потребителей.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Прекращение использования, применимые права и контакты',
        paragraphs: [
          'Вы можете в любое время прекратить использование SCHNGN, удалить локальные данные и активный синхронизированный снимок поездок, а также отдельно управлять аккаунтом Clerk или удалить его. Мы можем приостановить неправомерное или незаконное использование. Применимое императивное законодательство и меры защиты потребителей сохраняют силу; эти Условия не устанавливают подсудность и не отменяют права, предоставленные вам законом. Мы можем обновлять Условия при изменении сервиса или правовых требований, указывая дату выше. Вопросы можно направлять на support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Вопросы об этих Условиях',
    contactBody: 'Если у вас есть вопрос о SCHNGN или этих Условиях, напишите на support@schngn.com. Поддержка продукта не может определить ваш иммиграционный статус или предоставить юридическую консультацию.',
    contactLinkLabel: 'Связаться с поддержкой SCHNGN'
  }
};

const ukCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Правова інформація та підтримка',
    privacy: 'Конфіденційність',
    terms: 'Умови',
    contact: 'Контакти',
    disclaimer: 'Лише для планування — не є юридичною консультацією чи гарантією в’їзду. Звіряйтеся з офіційними джерелами.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Розділи політики конфіденційності',
    title: 'Політика конфіденційності',
    metaDescription: 'Як SCHNGN обробляє локальні дані про подорожі, необов’язкову синхронізацію, вхід через Google, аналітику, звернення до підтримки та ваші налаштування конфіденційності.',
    intro: 'SCHNGN дає змогу розраховувати плани подорожей без обов’язкового облікового запису. Ця політика пояснює, що залишається у вашому браузері, які дані обробляються, коли ви обираєте необов’язкові онлайн-функції, і як ви можете ними керувати.',
    updatedLabel: 'Останнє оновлення',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Коротко',
    summaryItems: [
      'Відомості про подорожі гостя залишаються в його браузері, якщо він прямо не обере синхронізацію з обліковим записом.',
      'Вхід через Google використовується для створення, захисту, автентифікації та ідентифікації необов’язкового облікового запису SCHNGN, а також для прив’язки подорожей, які ви вирішите зберегти.',
      'Plausible може отримувати узагальнені категорії використання й результатів, але ніколи не отримує дати, назви чи країни ваших подорожей, адресу електронної пошти або ідентифікатор облікового запису.',
      'Ви можете експортувати поточну копію подорожей із браузера та видалити активний знімок подорожей, збережений в обліковому записі.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. На що поширюється ця політика',
        paragraphs: [
          'Ця політика поширюється на schngn.com, вебзастосунок SCHNGN і його функції, пов’язані з обліковими записами, синхронізацією, аналітикою та підтримкою. SCHNGN — це калькулятор для планування. У межах звичайних функцій він не запитує доступ до GPS, не сканує паспорти й не збирає номери віз або документів на проживання.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Хто відповідає за дані й навіщо вони обробляються',
        paragraphs: [
          'SCHNGN керує сайтом schngn.com і відповідає за описану тут обробку даних, потрібну для роботи застосунку. З питань конфіденційності звертайтеся на support@schngn.com. Ми обробляємо дані облікового запису, синхронізації та підтримки, щоб надавати запитані вами функції; обмежені аналітичні дані й дані безпеки — щоб розуміти роботу сервісу та захищати його; дані на підставі згоди — коли вона потрібна; а також дані, необхідні для виконання застосовних правових обов’язків.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Використання без облікового запису та зберігання в браузері',
        paragraphs: [
          'Якщо ви користуєтеся SCHNGN як гість, дати й назви подорожей, необов’язкові відомості про країну перетину кордону, періоди перебування, статус і результати розрахунків залишаються у вашому браузері. Розрахунки та незбережені симуляції виконуються на вашому пристрої. У необов’язковому запитанні про паспорт країна видачі використовується лише в тимчасовій пам’яті браузера, щоб показати повідомлення про можливу двосторонню угоду; вона не зберігається разом із подорожами й не надсилається в аналітику. У браузері також зберігаються функціональні налаштування, як-от мова й відповідь про попередні подорожі; загальнодоступні файли застосунку можуть кешуватися для роботи без інтернету. Резервна копія JSON створюється й читається локально під вашим контролем і не завантажується на сервер лише тому, що ви її експортуєте або імпортуєте.'
        ],
        items: [
          'Дані про подорожі залишаються в браузері, доки ви не видалите чи не заміните їх або не очистите дані сайту.',
          'Файл cookie з налаштуванням мови зберігається до одного року.',
          'Локальні резервні копії JSON є незашифрованими файлами; ви відповідаєте за їх безпечне зберігання.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. Необов’язкові облікові записи та вхід через Google',
        paragraphs: [
          'Clerk завантажується на загальнодоступних сторінках SCHNGN, щоб перевірити, чи ввійшли ви в обліковий запис, і може обробляти необхідні дані сеансу, пристрою та мережі відповідно до своєї політики конфіденційності. Якщо ви обираєте вхід через Google, Google надсилає ваші основні ідентифікаційні дані й відповідь OAuth до Clerk. Clerk обробляє облікові дані або токени постачальника та сеанс облікового запису відповідно до своєї політики. SCHNGN отримує підсумковий сеанс Clerk та ідентифікатор користувача, щоб визначити активний обліковий запис, показати стан входу й адресу електронної пошти та пов’язати з обліковим записом подорожі, які ви явно вирішили зберегти. Разом із цими подорожами в Cloudflare D1 зберігається лише ідентифікатор користувача Clerk, а не ваша адреса Google, ім’я, зображення профілю, пароль або токени постачальника. SCHNGN не запитує доступ до Gmail, Google Drive, Календаря, контактів чи іншого вмісту Google, не продає дані користувачів Google і не використовує їх для реклами.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. Необов’язкова синхронізація, експорт і видалення подорожей',
        paragraphs: [
          'Після завершення чітко позначеної дії реєстрації та збереження або окремого ввімкнення синхронізації під час активного входу поточний перевірений знімок подорожей надсилається до Cloudflare D1. Він містить перевірений ідентифікатор користувача Clerk, повні відомості про збережені подорожі, метадані версії та згоди, а також часові позначки. Після ввімкнення синхронізації подальші збережені зміни або імпортовані дані також можуть синхронізуватися. Браузер також зберігає ідентифікатор користувача Clerk, номер версії на сервері, стан синхронізації чи паузи та відбиток подорожей для узгодження; вибір реєстрації та збереження тимчасово зберігається в сховищі сеансу. Ці метадані синхронізації не входять до JSON-експорту подорожей; вони видаляються дією «Вийти й очистити цей браузер» або під час очищення даних сайту. Експорт JSON містить поточну копію подорожей із браузера, а не всі дані про особу, підтримку, журнали або дані, які зберігають постачальники. Дія «Видалити подорожі, збережені в обліковому записі» видаляє активний знімок D1, але не видаляє подорожі з браузера чи обліковий запис Clerk. Видалення облікового запису Clerk запускає очищення знімка та створює односторонній хешований захисний маркер видалення облікового запису, який діє 30 днів, щоб застарілий сеанс не міг створити його знову; потім він ігнорується й видаляється за слушної нагоди.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Агрегована аналітика',
        paragraphs: [
          'На робочому сайті Plausible може отримувати лише дозволені події, наприклад перегляд сторінки, запуск калькулятора, додавання подорожі й запуск симуляції, а також узагальнені категорії: діапазон кількості подорожей, результат, діапазон безпечного запасу або джерело. SCHNGN видаляє рядки запитів і фрагменти URL та забороняє передавати дати, назви, країни й хронологію подорожей, вибір паспорта, адреси електронної пошти та ідентифікатори облікових записів. Plausible Analytics налаштовано без аналітичних cookie-файлів і без автоматичного відстеження форм, завантажень і вихідних посилань. Водночас Plausible може обробляти звичайну мережеву інформацію для створення агрегованої статистики.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Підтримка, безпека й технічні дані',
        paragraphs: [
          'Якщо ви звертаєтеся до нас, SCHNGN надсилає тип запиту, необов’язкове ім’я, адресу електронної пошти, повідомлення та вибрану мову через поштові служби Cloudflare до нашої скриньки підтримки Proton. Токен Turnstile окремо передається Cloudflare для перевірки й не включається до листа підтримки. Історія подорожей ніколи не додається автоматично, однак ми отримаємо все, що ви введете в повідомлення. Cloudflare використовує IP-адресу з’єднання для обмеження частоти запитів і перевірки Turnstile, а під час доставки та захисту сайту обробляє звичайні метадані запиту, пристрою, браузера, безпеки й помилок. SCHNGN не використовує Sentry, а журнали застосунку не повинні містити відомості про подорожі, адреси електронної пошти облікових записів або ідентифікатори користувачів Clerk.'
        ]
      },
      {
        id: 'providers',
        title: '8. Постачальники послуг і міжнародна обробка',
        paragraphs: [
          'SCHNGN використовує Cloudflare для хостингу, зберігання, безпеки й доставки електронної пошти; Clerk — для ідентифікації та сеансів; Google — лише якщо ви обираєте вхід через Google; Plausible — для обмеженої агрегованої аналітики; Proton — для поштової скриньки підтримки. Ці постачальники можуть обробляти дані в країнах за межами вашої країни. В опублікованих ними документах описано місця обробки, строки зберігання й заходи захисту під час передавання даних. Ми передаємо дані лише в обсязі, необхідному для надання цих функцій, захисту сервісу, виконання ваших вказівок або дотримання закону; ми не продаємо персональні дані.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Зберігання, видалення й безпека',
        paragraphs: [
          'Дані в браузері зберігаються, доки ви або ваш браузер не видалите їх. Активні синхронізовані подорожі зберігаються до заміни чи видалення. Повідомлення до підтримки залишаються в скриньці Proton, доки SCHNGN не видалить їх; наразі фіксований строк видалення не встановлено, і повідомлення слід видаляти, коли вони більше не потрібні в розумній мірі для подальшої взаємодії, захисту сервісу, вирішення спорів або виконання застосовних обов’язків. Резервні копії постачальників, операційні записи, дані облікового запису й агрегована аналітика зберігаються відповідно до налаштованих постачальниками строків і можуть бути остаточно видалені не відразу після видалення активних даних. SCHNGN використовує контроль доступу, перевірку введених даних, автентифіковане визначення власника й зашифровані HTTPS-з’єднання, однак жоден спосіб локального чи онлайн-зберігання не забезпечує цілковитої безпеки.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Ваш вибір, права та зміни політики',
        paragraphs: [
          'Ви можете використовувати калькулятор без облікового запису, очистити дані браузера, експортувати подорожі з браузера, видалити активний знімок подорожей облікового запису, а також керувати своїм обліковим записом Clerk або видалити його. Залежно від застосовного законодавства ви можете запитати доступ, виправлення, видалення, обмеження обробки чи перенесення даних, заперечити проти певної обробки, відкликати згоду, якщо обробка ґрунтується на ній, і подати скаргу до місцевого органу захисту даних. Надання даних облікового запису чи підтримки є необов’язковим, але відповідні функції без них не працюють. SCHNGN не приймає автоматизованих рішень, що мають істотні юридичні наслідки: результати калькулятора є оцінками для планування. Ми оновимо цю сторінку до того, як істотно змінимо порядок використання даних.'
        ]
      }
    ],
    contactTitle: 'Запитання та запити щодо конфіденційності',
    contactBody: 'Напишіть на support@schngn.com. Опишіть запит, не надсилаючи номери паспорта, візи чи інших конфіденційних документів. Перед виконанням запиту, пов’язаного з обліковим записом, нам може знадобитися підтвердити його.',
    contactLinkLabel: 'Зв’язатися з підтримкою SCHNGN',
    providerLinksTitle: 'Інформація постачальників про конфіденційність',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Політика конфіденційності Cloudflare',
      clerk: 'Політика конфіденційності Clerk',
      google: 'Політика конфіденційності Google',
      plausible: 'Політика Plausible щодо даних',
      proton: 'Політика конфіденційності Proton'
    })
  },
  terms: {
    navLabel: 'Розділи умов',
    title: 'Умови користування',
    metaDescription: 'Умови використання калькулятора SCHNGN для правила 90/180 днів у Шенгенській зоні, локального зберігання подорожей і необов’язкових функцій облікового запису.',
    intro: 'Ці Умови регулюють використання сайту schngn.com і вебзастосунку SCHNGN. Вони покликані зберегти головну обіцянку продукту: корисний інструмент планування з прозорими обмеженнями й необов’язковими обліковими записами.',
    updatedLabel: 'Останнє оновлення',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Головне',
    summaryItems: [
      'Калькулятор доступний без облікового запису; зберігати подорожі онлайн необов’язково.',
      'SCHNGN — це інструмент планування, а не юридична консультація чи гарантія в’їзду.',
      'Ви відповідаєте за точність дат і повинні звірятися з офіційними джерелами до подорожі.',
      'Використовуйте сервіс законно й захищайте доступ до свого облікового запису.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. Використання SCHNGN',
        paragraphs: [
          'Використовуючи SCHNGN, ви погоджуєтеся з цими Умовами й Політикою конфіденційності. Ви можете користуватися калькулятором як гість. Якщо ви створюєте обліковий запис, ви повинні мати законну дієздатність для прийняття цих Умов; особам, які її не мають, слід використовувати SCHNGN лише з одним із батьків, опікуном або іншою уповноваженою особою. Якщо ви не погоджуєтеся, не використовуйте сервіс.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Лише інструмент планування',
        paragraphs: [
          'SCHNGN оцінює звичайні короткострокові перебування за правилом Шенгенської зони 90/180 днів. Він не надає юридичних чи імміграційних консультацій і не гарантує в’їзд, законність перебування або будь-яке рішення прикордонного, візового чи імміграційного органу. Він може не враховувати дозволи на проживання, довгострокові чи національні візи, двосторонні угоди про звільнення, винятки для окремих громадянств, роботу, навчання, притулок або тимчасовий захист, перехідні положення правил чи розсуд органів влади. Повідомлення для певного паспорта чи країни про можливу двосторонню угоду має інформаційний характер, не змінює основний розрахунок і не визначає, що продовження застосовується. До бронювання чи подорожі перевірте свою ситуацію за офіційними джерелами й у компетентних органів.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Ваша відповідальність',
        paragraphs: [
          'Ви відповідаєте за введення повних і точних дат, тлумачення результату з урахуванням власного статусу, зберігання потрібних резервних копій і самостійну перевірку чинних правил. Підтвердження в’їзду та виїзду, умови візи й указівки органів влади мають перевагу над SCHNGN. Не покладайтеся на кешований, експортований або розрахований раніше результат після зміни ваших планів чи застосовних правил.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Локальне зберігання, облікові записи й синхронізація',
        paragraphs: [
          'Подорожі гостей зберігаються в браузері й можуть бути втрачені в разі очищення даних сайту, несправності пристрою чи зміни профілю браузера іншою особою. Необов’язкові облікові записи надаються через Clerk. Позначена дія реєстрації та збереження або окремий вибір синхронізації дозволяє SCHNGN зберігати перевірений знімок подорожей цього облікового запису. Захищайте доступ до облікового запису, виходьте з нього й за потреби очищуйте дані браузера на спільних пристроях. Докладніше про експорт, видалення та постачальників дивіться в Політиці конфіденційності.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Допустиме використання',
        paragraphs: [
          'Не використовуйте SCHNGN неналежним чином, не втручайтеся в його роботу чи безпеку, не досліджуйте й не обходьте засоби контролю доступу, не надсилайте незаконні або шкідливі матеріали, не створюйте автоматизований шкідливий трафік, не видавайте себе за іншу особу, не отримуйте доступ до чужого облікового запису й не використовуйте сервіс для сприяння шахрайству чи незаконним подорожам. Для обґрунтованого тестування безпеки потрібен попередній письмовий дозвіл. Ми можемо обмежити доступ в обсязі, необхідному для припинення зловживань, захисту користувачів або дотримання закону.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. Матеріали SCHNGN і сторонні сервіси',
        paragraphs: [
          'Назва, дизайн, програмне забезпечення й оригінальні матеріали SCHNGN захищені застосовним законодавством про інтелектуальну власність. Ці Умови надають вам обмежене, відкличне й невиключне право використовувати сервіс для особистого планування; вони не передають право власності. Посилання на офіційні джерела, Clerk, Google, Cloudflare, Plausible та інші сторонні сервіси регулюються їхніми власними умовами й політиками. SCHNGN не є установою ЄС, не схвалений і не сертифікований Європейським Союзом.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Доступність і зміни',
        paragraphs: [
          'Ми прагнемо підтримувати точність і доступність SCHNGN, однак робота сервісу може перериватися, затримуватися або змінюватися. Функції, постачальники, підтримувані правила чи безплатна доступність можуть змінитися, а матеріали можуть бути виправлені чи видалені. Наскільки це обґрунтовано можливо, ми заздалегідь пояснимо істотні зміни, що стосуються збережених даних облікового запису. Зберігайте незалежні записи щодо будь-яких важливих для вас рішень про подорожі.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Відмова від гарантій і відповідальність',
        paragraphs: [
          'Наскільки це дозволено законом, SCHNGN надається «як є» та «за наявності» без обіцянки, що кожен результат, джерело, постачальник або функція завжди будуть повними, актуальними й безпомилковими. Якщо закон дозволяє таке обмеження, SCHNGN не відповідає за рішення органів влади, відмову у в’їзді, перевищення строку перебування, штрафи, витрати на подорож, пропущені бронювання, втрату локальних даних або непрямі збитки, спричинені довірою до сервісу. Ніщо в цих Умовах не виключає відповідальність, яку не можна виключити за законом, і не обмежує обов’язкові права споживачів.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Припинення використання, застосовні права й контакти',
        paragraphs: [
          'Ви можете будь-коли припинити використання SCHNGN, видалити локальні дані й активний синхронізований знімок подорожей, а також окремо керувати обліковим записом Clerk або видалити його. Ми можемо призупинити неправомірне чи незаконне використання. Застосовне імперативне законодавство й захист прав споживачів залишаються чинними; ці Умови не визначають суд і не скасовують права, надані вам законом. Ми можемо оновлювати Умови, коли змінюється сервіс або правові вимоги, із зазначенням дати вище. Запитання можна надсилати на support@schngn.com.'
        ]
      }
    ],
    contactTitle: 'Запитання про ці Умови',
    contactBody: 'Якщо у вас є запитання про SCHNGN або ці Умови, напишіть на support@schngn.com. Підтримка продукту не може визначити ваш імміграційний статус або надати юридичну консультацію.',
    contactLinkLabel: 'Зв’язатися з підтримкою SCHNGN'
  }
};

const trCatalog: LegalLocaleCatalog = {
  footer: {
    navigation: 'Yasal bilgiler ve destek',
    privacy: 'Gizlilik',
    terms: 'Koşullar',
    contact: 'İletişim',
    disclaimer: 'Yalnızca planlama aracıdır — hukuki danışmanlık veya giriş garantisi değildir. Resmî kaynaklardan doğrulayın.',
    copyright: '© 2026 SCHNGN'
  },
  privacy: {
    navLabel: 'Gizlilik politikası bölümleri',
    title: 'Gizlilik Politikası',
    metaDescription: 'SCHNGN’nin yerel seyahat verilerini, isteğe bağlı hesap eşitlemesini, Google ile girişi, analizleri, destek taleplerini ve gizlilik tercihlerinizi nasıl ele aldığı.',
    intro: 'SCHNGN, bir hesap gerektirmeden seyahat planlarını hesaplamak üzere tasarlanmıştır. Bu politika, tarayıcınızda nelerin kaldığını, isteğe bağlı çevrim içi özellikleri seçtiğinizde nelerin işlendiğini ve kullanabileceğiniz denetimleri açıklar.',
    updatedLabel: 'Son güncelleme',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Kısaca',
    summaryItems: [
      'Misafir olarak girdiğiniz seyahat ayrıntıları, hesap eşitlemesini açıkça seçmediğiniz sürece tarayıcınızda kalır.',
      'Google ile giriş, isteğe bağlı bir SCHNGN hesabını oluşturmak, korumak, doğrulamak ve tanımlamak ve kaydetmeyi seçtiğiniz seyahatleri bu hesapla ilişkilendirmek için kullanılır.',
      'Plausible genel kullanım ve sonuç kategorileri alabilir; ancak seyahat tarihleriniz, etiketleriniz, ülkeleriniz, e-posta adresiniz veya hesap kimliğiniz hiçbir zaman gönderilmez.',
      'Tarayıcıdaki güncel seyahat kopyasını dışa aktarabilir ve hesabınıza kaydedilen etkin seyahat anlık görüntüsünü silebilirsiniz.'
    ],
    sections: [
      {
        id: 'scope',
        title: '1. Bu politikanın kapsamı',
        paragraphs: [
          'Bu politika schngn.com’u, SCHNGN web uygulamasını ve uygulamanın hesap, eşitleme, analiz ve destek özelliklerini kapsar. SCHNGN bir planlama hesaplayıcısıdır ve olağan özellikleri kapsamında GPS erişimi istemez, pasaport taramaz ya da vize ve oturum belgesi numaralarını toplamaz.'
        ]
      },
      {
        id: 'responsibility',
        title: '2. Sorumlu taraf ve verilerin işlenme amaçları',
        paragraphs: [
          'SCHNGN, schngn.com’u işletir ve burada açıklanan uygulamaya özgü işlemeden sorumludur. Gizlilik sorularınız için support@schngn.com adresine yazın. Hesap, eşitleme ve destek verilerini istediğiniz özellikleri sunmak; sınırlı analiz ve güvenlik verilerini hizmeti anlamak ve korumak; onay gerektiğinde onaya dayalı verileri işlemek; ayrıca geçerli yasal yükümlülükleri yerine getirmek için gerekli verileri kullanırız.'
        ]
      },
      {
        id: 'guest-data',
        title: '3. Misafir kullanımı ve tarayıcı depolaması',
        paragraphs: [
          'SCHNGN’yi misafir olarak kullandığınızda seyahat tarihleri, etiketler, isteğe bağlı sınır ülkesi bilgisi, kalış aralıkları, durum ve hesaplama sonuçları tarayıcınızda kalır. Hesaplamalar ve kaydedilmemiş simülasyonlar cihazınızda çalışır. İsteğe bağlı pasaport sorusu, olası bir ikili anlaşma bildirimini göstermek için yalnızca pasaportu düzenleyen ülkeyi tarayıcının geçici belleğinde kullanır; bu bilgi seyahatlerle birlikte kaydedilmez veya analizlere gönderilmez. Tarayıcı depolaması dil ve önceki seyahat yanıtı gibi işlevsel tercihleri de tutar; herkese açık uygulama dosyaları çevrim dışı kullanım için önbelleğe alınabilir. JSON yedeği sizin kontrolünüz altında yerel olarak oluşturulur ve okunur; yalnızca dışa veya içe aktardığınız için karşıya yüklenmez.'
        ],
        items: [
          'Tarayıcıdaki seyahat verileri siz temizleyene, değiştirene veya site verilerini silene kadar kalır.',
          'Dil tercihi çerezi en fazla bir yıl saklanır.',
          'Yerel JSON yedekleri şifrelenmemiş dosyalardır; bunları güvenli şekilde saklamak sizin sorumluluğunuzdadır.'
        ]
      },
      {
        id: 'accounts-google',
        title: '4. İsteğe bağlı hesaplar ve Google ile giriş',
        paragraphs: [
          'Clerk, giriş yapıp yapmadığınızı kontrol etmek için herkese açık SCHNGN sayfalarında yüklenir ve kendi gizlilik politikası kapsamında temel oturum, cihaz ve ağ verilerini işleyebilir. Google ile girişi seçerseniz Google, temel kimlik verilerinizi ve OAuth yanıtını Clerk’e gönderir. Sağlayıcı kimlik bilgilerini veya tokenlarını ve hesap oturumunu kendi politikası kapsamında Clerk yönetir. SCHNGN, etkin hesabı belirlemek, giriş durumunuzu ve e-posta adresinizi göstermek ve açıkça kaydetmeyi seçtiğiniz seyahatleri ilişkilendirmek için ortaya çıkan Clerk oturumunu ve kullanıcı kimliğini alır. Bu seyahatlerle birlikte Cloudflare D1’de yalnızca Clerk kullanıcı kimliği saklanır; Google e-postanız, adınız, profil resminiz, parolanız veya sağlayıcı tokenları saklanmaz. SCHNGN, Gmail, Google Drive, Takvim, kişiler veya başka Google içeriklerine erişim istemez ve Google kullanıcı verilerini satmaz ya da reklam için kullanmaz.'
        ]
      },
      {
        id: 'account-sync',
        title: '5. İsteğe bağlı seyahat eşitleme, dışa aktarma ve silme',
        paragraphs: [
          'Açıkça belirtilen kaydol ve kaydet işlemini tamamladığınızda ya da oturum açıkken eşitlemeyi ayrıca etkinleştirdiğinizde, doğrulanmış güncel seyahat anlık görüntüsü Cloudflare D1’e gönderilir. Bu görüntü, doğrulanmış Clerk kullanıcı kimliğini, kaydedilmiş seyahatlerin tüm ayrıntılarını, sürüm ve onay üst verilerini ve zaman damgalarını içerir. Özellik etkinleştirildikten sonra, kaydedilen sonraki düzenlemeler veya içe aktarımlar eşitlenebilir. Tarayıcı ayrıca uzlaştırma için Clerk kullanıcı kimliğini, sunucu sürümünü, eşitleme veya duraklatma durumunu ve seyahat parmak izini saklar; kaydolup kaydetme seçimi ise oturum depolamasında geçici olarak tutulur. Bu eşitleme üst verileri seyahat JSON dışa aktarımına dâhil değildir; “Çıkış yap ve bu tarayıcıyı temizle” işlemiyle veya site verilerini temizlediğinizde kaldırılır. JSON dışa aktarımı, kimlik, destek, günlük veya sağlayıcıların elindeki tüm verileri değil, tarayıcıdaki güncel seyahat kopyasını içerir. “Hesaba kaydedilen seyahatleri sil” işlemi etkin D1 anlık görüntüsünü kaldırır ancak tarayıcıdaki seyahatleri veya Clerk hesabını silmez. Clerk hesabının silinmesi anlık görüntünün temizlenmesini tetikler ve eski bir oturumun hesabı yeniden oluşturmasını önlemek için 30 gün etkin kalan tek yönlü karma uygulanmış bir hesap silme koruması oluşturur; sonrasında bu koruma dikkate alınmaz ve uygun bir fırsatta temizlenir.'
        ]
      },
      {
        id: 'analytics',
        title: '6. Toplu analizler',
        paragraphs: [
          'Yayındaki sitede Plausible; sayfa görüntüleme, hesaplayıcı başlatma, seyahat ekleme ve simülasyon çalıştırma gibi izin listesindeki olayları, seyahat sayısı aralığı, sonuç, güvenli pay aralığı veya kaynak gibi genel kategorilerle birlikte alabilir. SCHNGN, sorgu dizelerini ve URL parçalarını kaldırır; seyahat tarihleri, etiketleri, ülkeleri ve zaman çizelgelerinin, pasaport seçiminin, e-posta adreslerinin ve hesap kimliklerinin iletilmesini yasaklar. Plausible Analytics, analiz çerezleri ve formların, indirmelerin veya giden bağlantıların otomatik takibi olmadan yapılandırılmıştır. Plausible yine de toplu istatistikler üretmek için olağan ağ bilgilerini işleyebilir.'
        ]
      },
      {
        id: 'support-security',
        title: '7. Destek, güvenlik ve teknik veriler',
        paragraphs: [
          'Bizimle iletişime geçerseniz SCHNGN; talep türünüzü, isteğe bağlı adınızı, e-posta adresinizi, mesajınızı ve seçilen dili Cloudflare e-posta hizmetleri üzerinden Proton destek posta kutumuza gönderir. Seyahat geçmişi hiçbir zaman otomatik olarak eklenmez; ancak mesaja yazdığınız her şey tarafımıza ulaşır. Tarayıcı, Turnstile tokenını doğrulama için ayrıca gönderir; bu token destek e-postasına eklenmez. Cloudflare, bağlantı IP adresini istek sıklığını sınırlamak ve Turnstile doğrulaması için kullanır ve siteyi sunup korurken olağan istek, cihaz, tarayıcı, güvenlik ve hata üst verilerini işler. SCHNGN, Sentry kullanmaz ve uygulama günlükleri seyahat içeriklerini, hesap e-postalarını veya Clerk kullanıcı kimliklerini içermemelidir.'
        ]
      },
      {
        id: 'providers',
        title: '8. Hizmet sağlayıcılar ve uluslararası işleme',
        paragraphs: [
          'SCHNGN; barındırma, depolama, güvenlik ve e-posta teslimi için Cloudflare’i; kimlik ve oturumlar için Clerk’i; yalnızca Google ile girişi seçtiğinizde Google’ı; sınırlı toplu analizler için Plausible’ı; destek posta kutusu için Proton’u kullanır. Bu sağlayıcılar verileri kendi ülkeniz dışındaki ülkelerde işleyebilir. Yayımladıkları bildirimlerde konumları, saklama süreleri ve aktarım güvenceleri açıklanır. Verileri yalnızca bu işlevleri sunmak, hizmeti korumak, talimatlarınızı izlemek veya yasalara uymak için gerektiği ölçüde paylaşırız; kişisel verileri satmayız.'
        ]
      },
      {
        id: 'retention-security',
        title: '9. Saklama, silme ve güvenlik',
        paragraphs: [
          'Tarayıcı verileri siz veya tarayıcınız kaldırana kadar kalır. Etkin eşitlenmiş seyahatler değiştirilene veya silinene kadar saklanır. Destek mesajları SCHNGN tarafından silinene kadar Proton posta kutusunda kalır; şu anda sabit bir silme süresi taahhüt edilmez ve takip, hizmetin korunması, uyuşmazlıklar veya geçerli yükümlülükler için makul ölçüde gerekli olmaktan çıktıklarında kaldırılmaları gerekir. Sağlayıcı yedekleri, operasyonel kayıtlar, hesap verileri ve toplu analizler sağlayıcıların yapılandırılmış saklama sürelerine tabidir ve etkin veriler silindikten sonra tamamen kaldırılmaları zaman alabilir. SCHNGN erişim denetimleri, doğrulanmış girdiler, kimliği doğrulanmış sahiplik ve şifreli HTTPS bağlantıları kullanır; ancak hiçbir çevrim içi veya yerel depolama yöntemi tamamen güvenli değildir.'
        ]
      },
      {
        id: 'rights-changes',
        title: '10. Tercihleriniz, haklarınız ve politika değişiklikleri',
        paragraphs: [
          'Hesap olmadan hesaplayıcıyı kullanabilir, tarayıcı verilerini temizleyebilir, tarayıcıdaki seyahatleri dışa aktarabilir, hesaptaki etkin seyahat anlık görüntüsünü silebilir veya Clerk hesabınızı yönetip silebilirsiniz. Geçerli hukuka bağlı olarak erişim, düzeltme, silme, kısıtlama veya taşınabilirlik talep edebilir; belirli işlemlere itiraz edebilir; dayanak onay olduğunda onayınızı geri çekebilir ve yerel veri koruma makamınıza şikâyette bulunabilirsiniz. Hesap veya destek verilerini sağlamak isteğe bağlıdır; ancak ilgili özellikler bu veriler olmadan çalışamaz. SCHNGN, hukuken önemli otomatik kararlar vermez: hesaplayıcı sonuçları planlama tahminleridir. Verilerin kullanım biçimini önemli ölçüde değiştirmeden önce bu sayfayı güncelleyeceğiz.'
        ]
      }
    ],
    contactTitle: 'Gizlilik soruları veya talepleri',
    contactBody: 'support@schngn.com adresine e-posta gönderin. Talebinizi pasaport, vize veya başka hassas belge numaralarını göndermeden açıklayın. Hesapla ilgili bir talebi yerine getirmeden önce doğrulamamız gerekebilir.',
    contactLinkLabel: 'SCHNGN desteğine ulaşın',
    providerLinksTitle: 'Sağlayıcıların gizlilik bilgileri',
    providerLinks: localizedProviderLinks({
      cloudflare: 'Cloudflare Gizlilik Politikası',
      clerk: 'Clerk Gizlilik Politikası',
      google: 'Google Gizlilik Politikası',
      plausible: 'Plausible Veri Politikası',
      proton: 'Proton Gizlilik Politikası'
    })
  },
  terms: {
    navLabel: 'Koşulların bölümleri',
    title: 'Kullanım Koşulları',
    metaDescription: 'SCHNGN Schengen 90/180 gün hesaplayıcısını, yerel seyahat depolamasını ve isteğe bağlı hesap özelliklerini kullanma koşulları.',
    intro: 'Bu Koşullar, schngn.com’u ve SCHNGN web uygulamasını kullanımınızı düzenler. Ürünün temel vaadini korumak üzere yazılmıştır: sınırları şeffaf ve hesapları isteğe bağlı, kullanışlı bir planlama aracı.',
    updatedLabel: 'Son güncelleme',
    updatedDate: UPDATED_DATE,
    summaryTitle: 'Temel noktalar',
    summaryItems: [
      'Hesaplayıcı hesap olmadan kullanılabilir; seyahatleri çevrim içi kaydetmek isteğe bağlıdır.',
      'SCHNGN bir planlama aracıdır; hukuki danışmanlık veya giriş garantisi değildir.',
      'Tarihlerin doğruluğundan ve seyahatten önce resmî kaynakları kontrol etmekten siz sorumlusunuz.',
      'Hizmeti hukuka uygun kullanın ve hesap erişiminizi güvende tutun.'
    ],
    sections: [
      {
        id: 'using-schngn',
        title: '1. SCHNGN’yi kullanma',
        paragraphs: [
          'SCHNGN’yi kullanarak bu Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz. Hesaplayıcıyı misafir olarak kullanabilirsiniz. Hesap oluşturursanız bu Koşulları kabul etmeye yasal olarak ehil olmalısınız; bu ehliyete sahip olmayan kişiler SCHNGN’yi yalnızca ebeveyn, vasi veya başka bir yetkili kişiyle birlikte kullanmalıdır. Kabul etmiyorsanız hizmeti kullanmayın.'
        ]
      },
      {
        id: 'planning-aid',
        title: '2. Yalnızca planlama aracı',
        paragraphs: [
          'SCHNGN, Schengen 90/180 gün kuralı kapsamındaki olağan kısa kalışları tahmin eder. Hukuki veya göçmenlik danışmanlığı değildir ve giriş, yasal kalış ya da sınır, vize veya göçmenlik makamlarının herhangi bir kararı için garanti vermez. Oturma izinlerini, uzun süreli veya ulusal vizeleri, ikili muafiyet anlaşmalarını, vatandaşlığa özgü istisnaları, çalışma, eğitim, sığınma veya geçici koruma durumlarını, kural geçişlerini ya da makamların takdir yetkisini hesaba katmayabilir. Olası bir ikili düzenleme hakkında pasaporta veya ülkeye özgü bildirim yalnızca bilgi amaçlıdır; temel hesaplamayı değiştirmez veya uzatmanın geçerli olduğunu belirlemez. Rezervasyon yapmadan veya seyahat etmeden önce durumunuzu resmî kaynaklardan ve ilgili makamlardan doğrulayın.'
        ]
      },
      {
        id: 'responsibilities',
        title: '3. Sorumluluklarınız',
        paragraphs: [
          'Eksiksiz ve doğru tarihleri girmek, sonucu kendi durumunuza göre yorumlamak, ihtiyaç duyduğunuz yedekleri saklamak ve güncel kuralları bağımsız olarak kontrol etmek sizin sorumluluğunuzdadır. Giriş ve çıkış kanıtları, vize koşulları ve makam talimatları SCHNGN’den önceliklidir. Planlarınız veya geçerli kurallar değiştikten sonra önbelleğe alınmış, dışa aktarılmış ya da daha önce hesaplanmış bir sonuca güvenmeyin.'
        ]
      },
      {
        id: 'storage-accounts',
        title: '4. Yerel depolama, hesaplar ve eşitleme',
        paragraphs: [
          'Misafir seyahatleri tarayıcınızda saklanır ve site verileri temizlenirse, cihaz arızalanırsa veya başka biri tarayıcı profilini değiştirirse kaybolabilir. İsteğe bağlı hesaplar Clerk aracılığıyla sağlanır. Belirtilen kaydol ve kaydet işlemi veya ayrı bir eşitleme seçimi, SCHNGN’ye o hesap için doğrulanmış seyahat anlık görüntüsünü saklama izni verir. Hesap erişimini koruyun, paylaşılan cihazlarda uygun olduğunda oturumu kapatıp tarayıcı verilerini temizleyin ve dışa aktarma, silme ve sağlayıcı ayrıntıları için Gizlilik Politikasını inceleyin.'
        ]
      },
      {
        id: 'acceptable-use',
        title: '5. Kabul edilebilir kullanım',
        paragraphs: [
          'SCHNGN’yi kötüye kullanmayın; çalışmasına veya güvenliğine müdahale etmeyin; erişim denetimlerini araştırmayın veya atlatmayın; hukuka aykırı ya da zararlı içerik göndermeyin; kötüye kullanım amaçlı trafiği otomatikleştirmeyin; başka bir kişinin kimliğine bürünmeyin; başka bir hesaba erişmeyin veya hizmeti dolandırıcılığı ya da hukuka aykırı seyahati kolaylaştırmak için kullanmayın. Makul güvenlik testleri önceden yazılı izin gerektirir. Kötüye kullanımı durdurmak, kullanıcıları korumak veya yasalara uymak için gereken erişimi kısıtlayabiliriz.'
        ]
      },
      {
        id: 'ownership-third-parties',
        title: '6. SCHNGN içeriği ve üçüncü taraf hizmetleri',
        paragraphs: [
          'SCHNGN adı, tasarımı, yazılımı ve özgün içeriği geçerli fikrî mülkiyet yasalarıyla korunur. Bu Koşullar size hizmeti kişisel planlama amacıyla kullanmak için sınırlı, geri alınabilir ve münhasır olmayan bir hak verir; mülkiyeti devretmez. Resmî kaynak bağlantıları, Clerk, Google, Cloudflare, Plausible ve diğer üçüncü taraf hizmetlerinin kendi koşulları ve politikaları vardır. SCHNGN bir AB kurumu değildir ve Avrupa Birliği tarafından desteklenmemiş veya onaylanmamıştır.'
        ]
      },
      {
        id: 'availability-changes',
        title: '7. Kullanılabilirlik ve değişiklikler',
        paragraphs: [
          'SCHNGN’yi doğru ve kullanılabilir tutmayı amaçlıyoruz; ancak hizmet kesintiye uğrayabilir, gecikebilir veya değişebilir. Özellikler, sağlayıcılar, desteklenen kurallar veya ücretsiz kullanılabilirlik değişebilir ve içeriği düzeltebilir ya da kaldırabiliriz. Makul ölçüde mümkün olduğunda, kaydedilen hesap verilerini etkileyen önemli değişiklikler yürürlüğe girmeden önce açıklanacaktır. Sizin için önemli olan her seyahat kararı için bağımsız kayıtlar tutun.'
        ]
      },
      {
        id: 'disclaimers-liability',
        title: '8. Sorumluluk reddi ve sorumluluk',
        paragraphs: [
          'Yasaların izin verdiği en geniş ölçüde SCHNGN, her sonucun, kaynağın, sağlayıcının veya özelliğin daima eksiksiz, güncel ya da hatasız olacağı taahhüt edilmeksizin “olduğu gibi” ve “mevcut olduğu şekilde” sunulur. Yasaların bu sınırlamaya izin verdiği durumlarda SCHNGN; makam kararlarından, girişin reddedilmesinden, kalış süresinin aşılmasından, para cezalarından, seyahat masraflarından, kaçırılan rezervasyonlardan, kayıp yerel verilerden veya hizmete güvenmenin yol açtığı dolaylı kayıplardan sorumlu değildir. Bu Koşullardaki hiçbir hüküm, yasal olarak hariç tutulamayan sorumluluğu hariç tutmaz veya zorunlu tüketici haklarını sınırlamaz.'
        ]
      },
      {
        id: 'ending-rights-contact',
        title: '9. Kullanımı sona erdirme, geçerli haklar ve iletişim',
        paragraphs: [
          'SCHNGN’yi kullanmayı istediğiniz zaman bırakabilir; yerel verileri ve etkin eşitlenmiş seyahat anlık görüntüsünü silebilir; Clerk hesabını ayrıca yönetebilir veya silebilirsiniz. Kötüye kullanım ya da hukuka aykırı kullanımı askıya alabiliriz. Geçerli emredici hukuk ve tüketici korumaları yürürlükte kalır; bu Koşullar bir mahkeme seçmez veya yasaların size tanıdığı hakları ortadan kaldırmaz. Hizmet veya yasal gereklilikler değiştiğinde, yukarıda belirtilen tarihle bu Koşulları güncelleyebiliriz. Sorular support@schngn.com adresine gönderilebilir.'
        ]
      }
    ],
    contactTitle: 'Bu Koşullar hakkında sorular',
    contactBody: 'SCHNGN veya bu Koşullar hakkında sorunuz varsa support@schngn.com adresine yazın. Ürün desteği göçmenlik statünüzü belirleyemez veya hukuki danışmanlık sağlayamaz.',
    contactLinkLabel: 'SCHNGN desteğine ulaşın'
  }
};

export const westernLegalCatalogs: Pick<Record<Locale, LegalLocaleCatalog>, WesternLocale> = {
  fr: frCatalog,
  de: deCatalog,
  es: esCatalog,
  it: itCatalog,
  'pt-br': ptBrCatalog,
  ru: ruCatalog,
  uk: ukCatalog,
  tr: trCatalog
};
