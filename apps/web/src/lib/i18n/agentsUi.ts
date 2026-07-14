import { SUPPORTED_LOCALES, type Locale } from './locales';

export type AgentsSectionId =
  | 'mcp'
  | 'skill'
  | 'cli'
  | 'api'
  | 'typescript'
  | 'tools'
  | 'privacy';

export interface AgentsUiCopy {
  intro: string;
  meta: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    intro: string;
    primary: string;
    secondary: string;
  };
  quickStart: {
    title: string;
    intro: string;
    stepLabels: readonly [string, string, string];
    copy: string;
    copied: string;
    copyFailed: string;
    ready: string;
  };
  evidence: {
    items: readonly [string, string, string, string];
    privacyNote: string;
  };
  contents: {
    label: string;
    sections: Record<AgentsSectionId, string>;
  };
  mcp: { intro: string; verifyTitle: string; verifyBody: string };
  skill: {
    intro: string;
    behaviorTitle: string;
    behaviors: readonly [string, string, string];
  };
  cli: { intro: string; inputNote: string };
  api: { intro: string; docsNote: string };
  typescript: { intro: string; packageNote: string };
  tools: {
    intro: string;
    inputLabel: string;
    purposeLabel: string;
    purposes: readonly [string, string, string];
  };
  privacy: {
    intro: string;
    runtimeTitle: string;
    runtimeBody: string;
    hostTitle: string;
    hostBody: string;
  };
  limits: { title: string; body: string; advisory: string };
  requirements: { title: string; body: string };
  common: { recommended: string; interfaceLabel: string };
}

export const AGENT_SETUP_COMMANDS = [
  { id: 'runtime', command: 'npm install --global @schngn/agent' },
  { id: 'mcp', command: 'codex mcp add schngn -- schngn-mcp' },
  { id: 'skill', command: 'npx skills add miktomic/schngn --skill schngn' }
] as const;

export const AGENT_TOOL_REFERENCES = [
  {
    name: 'calculate_schengen_usage',
    input: '{ stays, referenceDate, includeCountedDays? }'
  },
  {
    name: 'check_schengen_stay',
    input: '{ existingStays, candidateStay }'
  },
  {
    name: 'latest_safe_schengen_exit',
    input: '{ existingStays, entryDate }'
  }
] as const;

const catalogs = {
  en: {
    meta: {
      title: 'Agent setup | SCHNGN',
      description: 'Install SCHNGN as a local MCP server, CLI, loopback API, or TypeScript package and teach agents when to use it.'
    },
    hero: {
      eyebrow: 'Local agent capability',
      title: 'Put SCHNGN behind your agent',
      intro: 'Install the local runtime, connect it through MCP, and add the skill for reliable Schengen 90/180-day planning.',
      primary: 'Set up MCP',
      secondary: 'Compare interfaces'
    },
    quickStart: {
      title: 'Three commands to get ready',
      intro: 'MCP is the recommended path for agents. Run each command in your terminal.',
      stepLabels: ['Install the local runtime', 'Connect SCHNGN to Codex', 'Add the SCHNGN skill'],
      copy: 'Copy command',
      copied: 'Copied',
      copyFailed: 'Copy failed. Select the command and copy it manually.',
      ready: 'Ready for 3 read-only tools'
    },
    evidence: {
      items: ['Calculates in a local process', 'No SCHNGN telemetry', 'Strict, versioned JSON', 'Ordinary 90/180-day rule'],
      privacyNote: 'SCHNGN makes no outbound requests. Your agent host may still send tool inputs and results to its model provider.'
    },
    contents: {
      label: 'On this page',
      sections: {
        mcp: 'MCP setup', skill: 'Agent skill', cli: 'CLI', api: 'REST + OpenAPI',
        typescript: 'TypeScript', tools: 'Tool reference', privacy: 'Privacy boundary'
      }
    },
    mcp: {
      intro: 'MCP gives an agent three read-only calculation tools over stdio. The server stays on your machine and needs no SCHNGN account or API key.',
      verifyTitle: 'Verify the connection',
      verifyBody: 'Restart or refresh your MCP client, then ask it to list SCHNGN tools. You should see all three operations below.'
    },
    skill: {
      intro: 'The skill teaches an agent when to call SCHNGN, how to shape explicit stay ranges, and when to refuse legal-status questions.',
      behaviorTitle: 'What the skill adds',
      behaviors: [
        'Prefers the MCP tools instead of reimplementing the date math.',
        'Keeps inputs to entry and exit dates for continuous Schengen stays.',
        'Stays within ordinary short-stay planning and points exceptional cases to official authorities.'
      ]
    },
    cli: {
      intro: 'Use the JSON CLI in scripts and agent shells. It reads strict JSON from stdin or a file and returns one JSON result.',
      inputNote: 'Commands: schngn usage, schngn check-stay, and schngn latest-exit.'
    },
    api: {
      intro: 'Start a loopback-only HTTP service for tools that speak REST. It serves a live OpenAPI document and refuses non-local bind addresses.',
      docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json'
    },
    typescript: {
      intro: 'Import the pure engine for low-level date math or the capability package for the strict agent contract.',
      packageNote: 'Packages: @schngn/engine and @schngn/capability'
    },
    tools: {
      intro: 'Every interface exposes the same versioned calculation contract. Dates use YYYY-MM-DD and stay ranges include both entry and exit days.',
      inputLabel: 'Input', purposeLabel: 'Purpose',
      purposes: [
        'Calculate days used and remaining on an explicit reference date.',
        'Check a proposed continuous stay on every day.',
        'Find the latest safe exit for a stay with a known entry date.'
      ]
    },
    privacy: {
      intro: 'The calculation boundary is local, but the full agent path may include cloud services.',
      runtimeTitle: 'SCHNGN runtime',
      runtimeBody: 'The runtime performs no persistence, telemetry, logging of submitted dates, or outbound network requests.',
      hostTitle: 'Agent host and model provider',
      hostBody: 'Your MCP client or agent host can send prompts, tool arguments, and results to its model provider. Review that provider\'s privacy and retention policies before using real travel dates.'
    },
    limits: {
      title: 'Scope and limitations',
      body: 'This capability models explicit continuous stays under the ordinary Schengen 90/180-day rule. It does not classify countries, decide visa or residence rights, or apply bilateral agreements. It is not legal advice.',
      advisory: 'Planning aid only. Competent authorities decide the authorized stay.'
    },
    requirements: {
      title: 'Requirements',
      body: 'Node.js 24+. No SCHNGN account or API key is required. No hosted SCHNGN endpoint or network connection is required for calculation.'
    },
    common: { recommended: 'Recommended', interfaceLabel: 'Interface' }
  },
  fr: {
    meta: { title: 'Configuration pour agents | SCHNGN', description: 'Installez SCHNGN comme serveur MCP local, CLI, API en boucle locale ou paquet TypeScript, et apprenez aux agents quand l’utiliser.' },
    hero: { eyebrow: 'Capacité locale pour agents', title: 'Placez SCHNGN derrière votre agent', intro: 'Installez le moteur local, connectez-le par MCP et ajoutez la compétence pour une planification fiable des 90/180 jours Schengen.', primary: 'Configurer MCP', secondary: 'Comparer les interfaces' },
    quickStart: { title: 'Trois commandes pour démarrer', intro: 'MCP est la voie recommandée pour les agents. Exécutez chaque commande dans votre terminal.', stepLabels: ['Installer le moteur local', 'Connecter SCHNGN à Codex', 'Ajouter la compétence SCHNGN'], copy: 'Copier la commande', copied: 'Copiée', copyFailed: 'Échec de la copie. Sélectionnez la commande et copiez-la manuellement.', ready: 'Prêt avec 3 outils en lecture seule' },
    evidence: { items: ['Calcul dans un processus local', 'Aucune télémétrie SCHNGN', 'JSON strict et versionné', 'Règle ordinaire des 90/180 jours'], privacyNote: 'SCHNGN n’effectue aucune requête sortante. Votre hôte d’agent peut néanmoins envoyer les entrées et résultats des outils à son fournisseur de modèle.' },
    contents: { label: 'Sur cette page', sections: { mcp: 'Configuration MCP', skill: 'Compétence agent', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Référence des outils', privacy: 'Limite de confidentialité' } },
    mcp: { intro: 'MCP fournit à un agent trois outils de calcul en lecture seule via stdio. Le serveur reste sur votre machine et ne nécessite ni compte SCHNGN ni clé API.', verifyTitle: 'Vérifier la connexion', verifyBody: 'Redémarrez ou actualisez votre client MCP, puis demandez-lui de lister les outils SCHNGN. Les trois opérations ci-dessous doivent apparaître.' },
    skill: { intro: 'La compétence apprend à l’agent quand appeler SCHNGN, comment former des plages de séjour explicites et quand refuser les questions de statut juridique.', behaviorTitle: 'Ce que la compétence ajoute', behaviors: ['Préfère les outils MCP plutôt que de recréer le calcul des dates.', 'Limite les entrées aux dates d’entrée et de sortie des séjours Schengen continus.', 'Reste dans la planification des courts séjours ordinaires et renvoie les cas exceptionnels aux autorités officielles.'] },
    cli: { intro: 'Utilisez la CLI JSON dans des scripts et des shells d’agent. Elle lit du JSON strict depuis stdin ou un fichier et renvoie un seul résultat JSON.', inputNote: 'Commandes : schngn usage, schngn check-stay et schngn latest-exit.' },
    api: { intro: 'Lancez un service HTTP limité à la boucle locale pour les outils REST. Il fournit un document OpenAPI en direct et refuse les adresses d’écoute non locales.', docsNote: 'OpenAPI : http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Importez le moteur pur pour le calcul de dates de bas niveau ou le paquet de capacité pour le contrat strict destiné aux agents.', packageNote: 'Paquets : @schngn/engine et @schngn/capability' },
    tools: { intro: 'Chaque interface expose le même contrat de calcul versionné. Les dates utilisent YYYY-MM-DD et les plages incluent les jours d’entrée et de sortie.', inputLabel: 'Entrée', purposeLabel: 'Objectif', purposes: ['Calculer les jours utilisés et restants à une date de référence explicite.', 'Vérifier chaque jour d’un séjour continu proposé.', 'Trouver la dernière sortie sûre pour un séjour dont la date d’entrée est connue.'] },
    privacy: { intro: 'La limite de calcul est locale, mais le parcours complet de l’agent peut inclure des services cloud.', runtimeTitle: 'Moteur SCHNGN', runtimeBody: 'Le moteur ne conserve rien, n’envoie aucune télémétrie, ne journalise pas les dates soumises et n’effectue aucune requête réseau sortante.', hostTitle: 'Hôte d’agent et fournisseur de modèle', hostBody: 'Votre client MCP ou hôte d’agent peut envoyer les invites, arguments d’outil et résultats à son fournisseur de modèle. Consultez ses règles de confidentialité et de conservation avant d’utiliser de vraies dates de voyage.' },
    limits: { title: 'Périmètre et limites', body: 'Cette capacité modélise des séjours continus explicites selon la règle ordinaire des 90/180 jours Schengen. Elle ne classe pas les pays, ne décide pas des droits de visa ou de séjour, n’applique pas les accords bilatéraux et ne fournit pas d’avis juridique.', advisory: 'Outil de planification uniquement. Les autorités compétentes décident du séjour autorisé.' },
    requirements: { title: 'Prérequis', body: 'Node.js 24 ou version ultérieure. Aucun compte SCHNGN, clé API, point de terminaison hébergé ou connexion réseau n’est requis pour le calcul.' },
    common: { recommended: 'Recommandé', interfaceLabel: 'Interface' }
  },
  de: {
    meta: { title: 'Agenten-Einrichtung | SCHNGN', description: 'Installieren Sie SCHNGN als lokalen MCP-Server, CLI, Loopback-API oder TypeScript-Paket und zeigen Sie Agenten, wann sie es verwenden sollen.' },
    hero: { eyebrow: 'Lokale Agenten-Funktion', title: 'Geben Sie Ihrem Agenten SCHNGN', intro: 'Installieren Sie die lokale Laufzeit, verbinden Sie sie über MCP und fügen Sie den Skill für verlässliche Schengen-90/180-Tage-Planung hinzu.', primary: 'MCP einrichten', secondary: 'Schnittstellen vergleichen' },
    quickStart: { title: 'Startklar mit drei Befehlen', intro: 'MCP ist der empfohlene Weg für Agenten. Führen Sie jeden Befehl im Terminal aus.', stepLabels: ['Lokale Laufzeit installieren', 'SCHNGN mit Codex verbinden', 'SCHNGN-Skill hinzufügen'], copy: 'Befehl kopieren', copied: 'Kopiert', copyFailed: 'Kopieren fehlgeschlagen. Markieren Sie den Befehl und kopieren Sie ihn manuell.', ready: 'Bereit für 3 schreibgeschützte Tools' },
    evidence: { items: ['Berechnung in einem lokalen Prozess', 'Keine SCHNGN-Telemetrie', 'Striktes, versioniertes JSON', 'Gewöhnliche 90/180-Tage-Regel'], privacyNote: 'SCHNGN stellt keine ausgehenden Anfragen. Ihr Agenten-Host kann Tool-Eingaben und Ergebnisse dennoch an seinen Modellanbieter senden.' },
    contents: { label: 'Auf dieser Seite', sections: { mcp: 'MCP-Einrichtung', skill: 'Agenten-Skill', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Tool-Referenz', privacy: 'Datenschutzgrenze' } },
    mcp: { intro: 'MCP gibt einem Agenten drei schreibgeschützte Berechnungstools über stdio. Der Server bleibt auf Ihrem Rechner und benötigt weder SCHNGN-Konto noch API-Schlüssel.', verifyTitle: 'Verbindung prüfen', verifyBody: 'Starten oder aktualisieren Sie Ihren MCP-Client und lassen Sie ihn die SCHNGN-Tools auflisten. Alle drei folgenden Operationen sollten erscheinen.' },
    skill: { intro: 'Der Skill lehrt einen Agenten, wann SCHNGN aufzurufen ist, wie explizite Aufenthaltszeiträume aufgebaut werden und wann Fragen zum Rechtsstatus abzulehnen sind.', behaviorTitle: 'Was der Skill ergänzt', behaviors: ['Bevorzugt die MCP-Tools, statt die Datumsberechnung neu zu bauen.', 'Beschränkt Eingaben auf Einreise- und Ausreisedaten zusammenhängender Schengen-Aufenthalte.', 'Bleibt bei gewöhnlicher Kurzaufenthaltsplanung und verweist Sonderfälle an offizielle Behörden.'] },
    cli: { intro: 'Nutzen Sie die JSON-CLI in Skripten und Agenten-Shells. Sie liest striktes JSON aus stdin oder einer Datei und gibt ein JSON-Ergebnis zurück.', inputNote: 'Befehle: schngn usage, schngn check-stay und schngn latest-exit.' },
    api: { intro: 'Starten Sie für REST-Tools einen HTTP-Dienst nur auf Loopback. Er liefert ein aktuelles OpenAPI-Dokument und lehnt nicht lokale Bind-Adressen ab.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Importieren Sie die reine Engine für grundlegende Datumsberechnungen oder das Capability-Paket für den strikten Agentenvertrag.', packageNote: 'Pakete: @schngn/engine und @schngn/capability' },
    tools: { intro: 'Jede Schnittstelle bietet denselben versionierten Berechnungsvertrag. Daten verwenden YYYY-MM-DD und Aufenthaltszeiträume enthalten Einreise- und Ausreisetag.', inputLabel: 'Eingabe', purposeLabel: 'Zweck', purposes: ['Verbrauchte und verbleibende Tage an einem expliziten Stichtag berechnen.', 'Einen geplanten zusammenhängenden Aufenthalt an jedem Tag prüfen.', 'Die späteste sichere Ausreise für einen Aufenthalt mit bekanntem Einreisedatum finden.'] },
    privacy: { intro: 'Die Berechnung bleibt lokal, der vollständige Agentenweg kann jedoch Cloud-Dienste enthalten.', runtimeTitle: 'SCHNGN-Laufzeit', runtimeBody: 'Die Laufzeit speichert nichts, sendet keine Telemetrie, protokolliert keine übermittelten Daten und stellt keine ausgehenden Netzwerkanfragen.', hostTitle: 'Agenten-Host und Modellanbieter', hostBody: 'Ihr MCP-Client oder Agenten-Host kann Prompts, Tool-Argumente und Ergebnisse an seinen Modellanbieter senden. Prüfen Sie dessen Datenschutz- und Aufbewahrungsregeln, bevor Sie echte Reisedaten verwenden.' },
    limits: { title: 'Umfang und Grenzen', body: 'Diese Funktion modelliert explizite zusammenhängende Aufenthalte nach der gewöhnlichen Schengen-90/180-Tage-Regel. Sie klassifiziert keine Länder, entscheidet nicht über Visa- oder Aufenthaltsrechte, wendet keine bilateralen Abkommen an und erteilt keine Rechtsberatung.', advisory: 'Nur eine Planungshilfe. Die zuständigen Behörden entscheiden über den erlaubten Aufenthalt.' },
    requirements: { title: 'Voraussetzungen', body: 'Node.js 24 oder neuer. Für die Berechnung sind kein SCHNGN-Konto, API-Schlüssel, gehosteter Endpunkt und keine Netzwerkverbindung nötig.' },
    common: { recommended: 'Empfohlen', interfaceLabel: 'Schnittstelle' }
  },
  es: {
    meta: { title: 'Configuración para agentes | SCHNGN', description: 'Instala SCHNGN como servidor MCP local, CLI, API de bucle local o paquete TypeScript y enseña a los agentes cuándo usarlo.' },
    hero: { eyebrow: 'Capacidad local para agentes', title: 'Pon SCHNGN detrás de tu agente', intro: 'Instala el entorno local, conéctalo mediante MCP y añade la skill para planificar de forma fiable la regla Schengen de 90/180 días.', primary: 'Configurar MCP', secondary: 'Comparar interfaces' },
    quickStart: { title: 'Prepárate con tres comandos', intro: 'MCP es la vía recomendada para agentes. Ejecuta cada comando en tu terminal.', stepLabels: ['Instalar el entorno local', 'Conectar SCHNGN con Codex', 'Añadir la skill de SCHNGN'], copy: 'Copiar comando', copied: 'Copiado', copyFailed: 'No se pudo copiar. Selecciona el comando y cópialo manualmente.', ready: 'Listo para 3 herramientas de solo lectura' },
    evidence: { items: ['Cálculo en un proceso local', 'Sin telemetría de SCHNGN', 'JSON estricto y versionado', 'Regla ordinaria de 90/180 días'], privacyNote: 'SCHNGN no hace solicitudes salientes. Aun así, el host de tu agente puede enviar entradas y resultados de las herramientas a su proveedor de modelos.' },
    contents: { label: 'En esta página', sections: { mcp: 'Configuración MCP', skill: 'Skill del agente', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Referencia de herramientas', privacy: 'Límite de privacidad' } },
    mcp: { intro: 'MCP ofrece a un agente tres herramientas de cálculo de solo lectura mediante stdio. El servidor permanece en tu equipo y no necesita cuenta de SCHNGN ni clave API.', verifyTitle: 'Verificar la conexión', verifyBody: 'Reinicia o actualiza tu cliente MCP y pídele que enumere las herramientas de SCHNGN. Deberías ver las tres operaciones siguientes.' },
    skill: { intro: 'La skill enseña al agente cuándo llamar a SCHNGN, cómo formar intervalos de estancia explícitos y cuándo rechazar preguntas sobre estatus jurídico.', behaviorTitle: 'Qué añade la skill', behaviors: ['Prefiere las herramientas MCP en vez de rehacer el cálculo de fechas.', 'Limita las entradas a fechas de entrada y salida de estancias Schengen continuas.', 'Se mantiene en la planificación ordinaria de estancias cortas y remite los casos excepcionales a las autoridades oficiales.'] },
    cli: { intro: 'Usa la CLI JSON en scripts y shells de agentes. Lee JSON estricto desde stdin o un archivo y devuelve un único resultado JSON.', inputNote: 'Comandos: schngn usage, schngn check-stay y schngn latest-exit.' },
    api: { intro: 'Inicia un servicio HTTP solo de bucle local para herramientas REST. Publica un documento OpenAPI en vivo y rechaza direcciones de escucha no locales.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Importa el motor puro para cálculos de fechas de bajo nivel o el paquete de capacidad para el contrato estricto del agente.', packageNote: 'Paquetes: @schngn/engine y @schngn/capability' },
    tools: { intro: 'Cada interfaz expone el mismo contrato de cálculo versionado. Las fechas usan YYYY-MM-DD y los intervalos incluyen los días de entrada y salida.', inputLabel: 'Entrada', purposeLabel: 'Finalidad', purposes: ['Calcular días usados y restantes en una fecha de referencia explícita.', 'Comprobar cada día de una estancia continua propuesta.', 'Hallar la última salida segura para una estancia con fecha de entrada conocida.'] },
    privacy: { intro: 'El límite de cálculo es local, pero la ruta completa del agente puede incluir servicios en la nube.', runtimeTitle: 'Entorno de SCHNGN', runtimeBody: 'El entorno no guarda datos, no envía telemetría, no registra fechas enviadas ni hace solicitudes de red salientes.', hostTitle: 'Host del agente y proveedor de modelos', hostBody: 'Tu cliente MCP o host del agente puede enviar instrucciones, argumentos de herramientas y resultados a su proveedor de modelos. Revisa sus políticas de privacidad y conservación antes de usar fechas reales de viaje.' },
    limits: { title: 'Alcance y limitaciones', body: 'Esta capacidad modela estancias continuas explícitas bajo la regla Schengen ordinaria de 90/180 días. No clasifica países, decide derechos de visado o residencia, aplica acuerdos bilaterales ni ofrece asesoramiento jurídico.', advisory: 'Solo es una ayuda de planificación. Las autoridades competentes deciden la estancia autorizada.' },
    requirements: { title: 'Requisitos', body: 'Node.js 24 o posterior. El cálculo no requiere cuenta de SCHNGN, clave API, endpoint alojado ni conexión de red.' },
    common: { recommended: 'Recomendado', interfaceLabel: 'Interfaz' }
  },
  it: {
    meta: { title: 'Configurazione per agenti | SCHNGN', description: 'Installa SCHNGN come server MCP locale, CLI, API loopback o pacchetto TypeScript e insegna agli agenti quando usarlo.' },
    hero: { eyebrow: 'Funzione locale per agenti', title: 'Metti SCHNGN dietro il tuo agente', intro: 'Installa il runtime locale, collegalo tramite MCP e aggiungi la skill per una pianificazione affidabile della regola Schengen 90/180 giorni.', primary: 'Configura MCP', secondary: 'Confronta le interfacce' },
    quickStart: { title: 'Tre comandi per iniziare', intro: 'MCP è il percorso consigliato per gli agenti. Esegui ogni comando nel terminale.', stepLabels: ['Installa il runtime locale', 'Collega SCHNGN a Codex', 'Aggiungi la skill SCHNGN'], copy: 'Copia comando', copied: 'Copiato', copyFailed: 'Copia non riuscita. Seleziona il comando e copialo manualmente.', ready: 'Pronto per 3 strumenti di sola lettura' },
    evidence: { items: ['Calcolo in un processo locale', 'Nessuna telemetria SCHNGN', 'JSON rigoroso e versionato', 'Regola ordinaria 90/180 giorni'], privacyNote: 'SCHNGN non effettua richieste in uscita. L’host dell’agente può comunque inviare input e risultati degli strumenti al proprio fornitore del modello.' },
    contents: { label: 'In questa pagina', sections: { mcp: 'Configurazione MCP', skill: 'Skill per agenti', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Riferimento strumenti', privacy: 'Confine della privacy' } },
    mcp: { intro: 'MCP offre a un agente tre strumenti di calcolo di sola lettura tramite stdio. Il server resta sul tuo computer e non richiede un account SCHNGN o una chiave API.', verifyTitle: 'Verifica la connessione', verifyBody: 'Riavvia o aggiorna il client MCP, poi chiedigli di elencare gli strumenti SCHNGN. Dovresti vedere tutte e tre le operazioni qui sotto.' },
    skill: { intro: 'La skill insegna all’agente quando chiamare SCHNGN, come formare intervalli di soggiorno espliciti e quando rifiutare domande sullo status giuridico.', behaviorTitle: 'Cosa aggiunge la skill', behaviors: ['Preferisce gli strumenti MCP invece di ricreare il calcolo delle date.', 'Limita gli input alle date di ingresso e uscita dei soggiorni Schengen continui.', 'Resta nella pianificazione ordinaria dei soggiorni brevi e rimanda i casi eccezionali alle autorità ufficiali.'] },
    cli: { intro: 'Usa la CLI JSON in script e shell per agenti. Legge JSON rigoroso da stdin o da un file e restituisce un singolo risultato JSON.', inputNote: 'Comandi: schngn usage, schngn check-stay e schngn latest-exit.' },
    api: { intro: 'Avvia un servizio HTTP solo loopback per gli strumenti REST. Espone un documento OpenAPI aggiornato e rifiuta indirizzi di ascolto non locali.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Importa il motore puro per i calcoli di date di basso livello o il pacchetto capability per il contratto rigoroso destinato agli agenti.', packageNote: 'Pacchetti: @schngn/engine e @schngn/capability' },
    tools: { intro: 'Ogni interfaccia espone lo stesso contratto di calcolo versionato. Le date usano YYYY-MM-DD e gli intervalli includono i giorni di ingresso e uscita.', inputLabel: 'Input', purposeLabel: 'Scopo', purposes: ['Calcola giorni usati e rimanenti in una data di riferimento esplicita.', 'Controlla ogni giorno di un soggiorno continuo proposto.', 'Trova l’ultima uscita sicura per un soggiorno con data di ingresso nota.'] },
    privacy: { intro: 'Il confine del calcolo è locale, ma il percorso completo dell’agente può includere servizi cloud.', runtimeTitle: 'Runtime SCHNGN', runtimeBody: 'Il runtime non conserva dati, non invia telemetria, non registra le date inviate e non effettua richieste di rete in uscita.', hostTitle: 'Host dell’agente e fornitore del modello', hostBody: 'Il client MCP o l’host dell’agente può inviare prompt, argomenti degli strumenti e risultati al proprio fornitore del modello. Consulta le sue regole su privacy e conservazione prima di usare date di viaggio reali.' },
    limits: { title: 'Ambito e limiti', body: 'Questa funzione modella soggiorni continui espliciti secondo la regola Schengen ordinaria 90/180 giorni. Non classifica paesi, decide diritti di visto o residenza, applica accordi bilaterali o fornisce consulenza legale.', advisory: 'Solo strumento di pianificazione. Le autorità competenti decidono il soggiorno autorizzato.' },
    requirements: { title: 'Requisiti', body: 'Node.js 24 o successivo. Per il calcolo non servono account SCHNGN, chiave API, endpoint ospitato o connessione di rete.' },
    common: { recommended: 'Consigliato', interfaceLabel: 'Interfaccia' }
  },
  'pt-br': {
    meta: { title: 'Configuração para agentes | SCHNGN', description: 'Instale o SCHNGN como servidor MCP local, CLI, API de loopback ou pacote TypeScript e ensine aos agentes quando usá-lo.' },
    hero: { eyebrow: 'Capacidade local para agentes', title: 'Coloque o SCHNGN por trás do seu agente', intro: 'Instale o runtime local, conecte-o por MCP e adicione a skill para um planejamento confiável da regra Schengen de 90/180 dias.', primary: 'Configurar MCP', secondary: 'Comparar interfaces' },
    quickStart: { title: 'Três comandos para começar', intro: 'MCP é o caminho recomendado para agentes. Execute cada comando no terminal.', stepLabels: ['Instalar o runtime local', 'Conectar o SCHNGN ao Codex', 'Adicionar a skill do SCHNGN'], copy: 'Copiar comando', copied: 'Copiado', copyFailed: 'Falha ao copiar. Selecione o comando e copie manualmente.', ready: 'Pronto para 3 ferramentas somente leitura' },
    evidence: { items: ['Cálculo em processo local', 'Sem telemetria do SCHNGN', 'JSON estrito e versionado', 'Regra comum de 90/180 dias'], privacyNote: 'O SCHNGN não faz solicitações de saída. Mesmo assim, o host do seu agente pode enviar entradas e resultados das ferramentas ao provedor do modelo.' },
    contents: { label: 'Nesta página', sections: { mcp: 'Configuração MCP', skill: 'Skill do agente', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Referência das ferramentas', privacy: 'Limite de privacidade' } },
    mcp: { intro: 'O MCP oferece ao agente três ferramentas de cálculo somente leitura por stdio. O servidor fica na sua máquina e não exige conta SCHNGN nem chave de API.', verifyTitle: 'Verificar a conexão', verifyBody: 'Reinicie ou atualize o cliente MCP e peça para listar as ferramentas do SCHNGN. As três operações abaixo devem aparecer.' },
    skill: { intro: 'A skill ensina ao agente quando chamar o SCHNGN, como montar intervalos explícitos de estadia e quando recusar perguntas sobre situação jurídica.', behaviorTitle: 'O que a skill acrescenta', behaviors: ['Prefere as ferramentas MCP em vez de recriar a matemática das datas.', 'Limita as entradas às datas de entrada e saída de estadias Schengen contínuas.', 'Permanece no planejamento comum de estadias curtas e encaminha casos excepcionais às autoridades oficiais.'] },
    cli: { intro: 'Use a CLI JSON em scripts e shells de agentes. Ela lê JSON estrito de stdin ou de um arquivo e retorna um único resultado JSON.', inputNote: 'Comandos: schngn usage, schngn check-stay e schngn latest-exit.' },
    api: { intro: 'Inicie um serviço HTTP somente em loopback para ferramentas REST. Ele fornece um documento OpenAPI atualizado e recusa endereços de escuta não locais.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Importe o mecanismo puro para cálculos de data de baixo nível ou o pacote de capacidade para o contrato estrito de agentes.', packageNote: 'Pacotes: @schngn/engine e @schngn/capability' },
    tools: { intro: 'Toda interface expõe o mesmo contrato de cálculo versionado. As datas usam YYYY-MM-DD e os intervalos incluem os dias de entrada e saída.', inputLabel: 'Entrada', purposeLabel: 'Finalidade', purposes: ['Calcular dias usados e restantes em uma data de referência explícita.', 'Verificar cada dia de uma estadia contínua proposta.', 'Encontrar a última saída segura para uma estadia com data de entrada conhecida.'] },
    privacy: { intro: 'O limite de cálculo é local, mas o caminho completo do agente pode incluir serviços em nuvem.', runtimeTitle: 'Runtime do SCHNGN', runtimeBody: 'O runtime não persiste dados, não envia telemetria, não registra datas enviadas nem faz solicitações de rede de saída.', hostTitle: 'Host do agente e provedor do modelo', hostBody: 'Seu cliente MCP ou host do agente pode enviar prompts, argumentos de ferramentas e resultados ao provedor do modelo. Revise as políticas de privacidade e retenção antes de usar datas reais de viagem.' },
    limits: { title: 'Escopo e limitações', body: 'Esta capacidade modela estadias contínuas explícitas segundo a regra Schengen comum de 90/180 dias. Ela não classifica países, decide direitos de visto ou residência, aplica acordos bilaterais nem oferece aconselhamento jurídico.', advisory: 'Apenas uma ajuda de planejamento. As autoridades competentes decidem a estadia autorizada.' },
    requirements: { title: 'Requisitos', body: 'Node.js 24 ou mais recente. O cálculo não exige conta SCHNGN, chave de API, endpoint hospedado nem conexão de rede.' },
    common: { recommended: 'Recomendado', interfaceLabel: 'Interface' }
  },
  ru: {
    meta: { title: 'Настройка для агентов | SCHNGN', description: 'Установите SCHNGN как локальный MCP-сервер, CLI, loopback API или пакет TypeScript и научите агентов правильно его применять.' },
    hero: { eyebrow: 'Локальная возможность для агентов', title: 'Подключите SCHNGN к своему агенту', intro: 'Установите локальную среду, подключите её через MCP и добавьте навык для надёжного планирования по шенгенскому правилу 90/180 дней.', primary: 'Настроить MCP', secondary: 'Сравнить интерфейсы' },
    quickStart: { title: 'Три команды для начала работы', intro: 'MCP является рекомендуемым способом для агентов. Выполните каждую команду в терминале.', stepLabels: ['Установить локальную среду', 'Подключить SCHNGN к Codex', 'Добавить навык SCHNGN'], copy: 'Копировать команду', copied: 'Скопировано', copyFailed: 'Не удалось скопировать. Выделите команду и скопируйте её вручную.', ready: 'Готово 3 инструмента только для чтения' },
    evidence: { items: ['Расчёт в локальном процессе', 'Без телеметрии SCHNGN', 'Строгий версионированный JSON', 'Обычное правило 90/180 дней'], privacyNote: 'SCHNGN не выполняет исходящих запросов. Хост вашего агента всё же может отправлять входные данные и результаты инструментов поставщику модели.' },
    contents: { label: 'На этой странице', sections: { mcp: 'Настройка MCP', skill: 'Навык агента', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Справочник инструментов', privacy: 'Граница конфиденциальности' } },
    mcp: { intro: 'MCP предоставляет агенту три расчётных инструмента только для чтения через stdio. Сервер остаётся на вашем компьютере и не требует учётной записи SCHNGN или ключа API.', verifyTitle: 'Проверить подключение', verifyBody: 'Перезапустите или обновите MCP-клиент, затем попросите его перечислить инструменты SCHNGN. Должны появиться все три операции ниже.' },
    skill: { intro: 'Навык учит агента, когда вызывать SCHNGN, как формировать явные интервалы пребывания и когда отказываться от вопросов о правовом статусе.', behaviorTitle: 'Что добавляет навык', behaviors: ['Предпочитает инструменты MCP самостоятельному повторению расчёта дат.', 'Оставляет во входных данных только даты въезда и выезда для непрерывных пребываний в Шенгене.', 'Ограничивается обычным планированием краткосрочных поездок и направляет исключительные случаи к официальным органам.'] },
    cli: { intro: 'Используйте JSON CLI в скриптах и оболочках агентов. Он читает строгий JSON из stdin или файла и возвращает один результат JSON.', inputNote: 'Команды: schngn usage, schngn check-stay и schngn latest-exit.' },
    api: { intro: 'Запустите HTTP-службу только на loopback для инструментов REST. Она публикует актуальный документ OpenAPI и отклоняет нелокальные адреса привязки.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Импортируйте чистое ядро для низкоуровневых расчётов дат или пакет capability для строгого контракта агента.', packageNote: 'Пакеты: @schngn/engine и @schngn/capability' },
    tools: { intro: 'Все интерфейсы предоставляют один версионированный расчётный контракт. Даты имеют вид YYYY-MM-DD, а интервалы включают дни въезда и выезда.', inputLabel: 'Ввод', purposeLabel: 'Назначение', purposes: ['Рассчитать использованные и оставшиеся дни на явно заданную дату.', 'Проверить каждый день предлагаемого непрерывного пребывания.', 'Найти последнюю безопасную дату выезда при известной дате въезда.'] },
    privacy: { intro: 'Расчёт выполняется локально, но полный путь агента может включать облачные сервисы.', runtimeTitle: 'Среда SCHNGN', runtimeBody: 'Среда ничего не сохраняет, не отправляет телеметрию, не журналирует введённые даты и не выполняет исходящих сетевых запросов.', hostTitle: 'Хост агента и поставщик модели', hostBody: 'MCP-клиент или хост агента может отправлять запросы, аргументы инструментов и результаты поставщику модели. Перед использованием реальных дат поездок изучите его правила конфиденциальности и хранения.' },
    limits: { title: 'Область применения и ограничения', body: 'Эта возможность моделирует явно заданные непрерывные пребывания по обычному шенгенскому правилу 90/180 дней. Она не классифицирует страны, не определяет визовые права или права на проживание, не применяет двусторонние соглашения и не даёт юридических консультаций.', advisory: 'Только помощь в планировании. Разрешённый срок пребывания определяют компетентные органы.' },
    requirements: { title: 'Требования', body: 'Node.js 24 или новее. Для расчёта не нужны учётная запись SCHNGN, ключ API, размещённая конечная точка или сетевое подключение.' },
    common: { recommended: 'Рекомендуется', interfaceLabel: 'Интерфейс' }
  },
  uk: {
    meta: { title: 'Налаштування для агентів | SCHNGN', description: 'Установіть SCHNGN як локальний MCP-сервер, CLI, loopback API або пакет TypeScript і навчіть агентів правильно його застосовувати.' },
    hero: { eyebrow: 'Локальна можливість для агентів', title: 'Підключіть SCHNGN до свого агента', intro: 'Установіть локальне середовище, підключіть його через MCP і додайте навичку для надійного планування за шенгенським правилом 90/180 днів.', primary: 'Налаштувати MCP', secondary: 'Порівняти інтерфейси' },
    quickStart: { title: 'Три команди для початку', intro: 'MCP є рекомендованим способом для агентів. Виконайте кожну команду в терміналі.', stepLabels: ['Установити локальне середовище', 'Підключити SCHNGN до Codex', 'Додати навичку SCHNGN'], copy: 'Копіювати команду', copied: 'Скопійовано', copyFailed: 'Не вдалося скопіювати. Виділіть команду та скопіюйте її вручну.', ready: 'Готово 3 інструменти лише для читання' },
    evidence: { items: ['Обчислення в локальному процесі', 'Без телеметрії SCHNGN', 'Строгий версіонований JSON', 'Звичайне правило 90/180 днів'], privacyNote: 'SCHNGN не виконує вихідних запитів. Хост вашого агента все одно може надсилати вхідні дані та результати інструментів постачальнику моделі.' },
    contents: { label: 'На цій сторінці', sections: { mcp: 'Налаштування MCP', skill: 'Навичка агента', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Довідник інструментів', privacy: 'Межа конфіденційності' } },
    mcp: { intro: 'MCP надає агенту три обчислювальні інструменти лише для читання через stdio. Сервер залишається на вашому комп’ютері та не потребує облікового запису SCHNGN чи ключа API.', verifyTitle: 'Перевірити підключення', verifyBody: 'Перезапустіть або оновіть MCP-клієнт, а потім попросіть його перелічити інструменти SCHNGN. Ви маєте побачити всі три операції нижче.' },
    skill: { intro: 'Навичка вчить агента, коли викликати SCHNGN, як формувати явні діапазони перебування та коли відмовлятися від питань про правовий статус.', behaviorTitle: 'Що додає навичка', behaviors: ['Надає перевагу інструментам MCP замість повторної реалізації розрахунку дат.', 'Залишає у вхідних даних лише дати в’їзду та виїзду для безперервних перебувань у Шенгені.', 'Обмежується звичайним плануванням коротких поїздок і спрямовує виняткові випадки до офіційних органів.'] },
    cli: { intro: 'Використовуйте JSON CLI у скриптах та оболонках агентів. Він читає строгий JSON зі stdin або файлу й повертає один результат JSON.', inputNote: 'Команди: schngn usage, schngn check-stay і schngn latest-exit.' },
    api: { intro: 'Запустіть HTTP-службу лише на loopback для інструментів REST. Вона надає актуальний документ OpenAPI та відхиляє нелокальні адреси прив’язки.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Імпортуйте чисте ядро для низькорівневих обчислень дат або пакет capability для строгого контракту агента.', packageNote: 'Пакети: @schngn/engine і @schngn/capability' },
    tools: { intro: 'Кожен інтерфейс надає той самий версіонований контракт обчислення. Дати мають формат YYYY-MM-DD, а діапазони містять дні в’їзду й виїзду.', inputLabel: 'Вхідні дані', purposeLabel: 'Призначення', purposes: ['Обчислити використані та залишкові дні на явно задану дату.', 'Перевірити кожен день запропонованого безперервного перебування.', 'Знайти останню безпечну дату виїзду за відомої дати в’їзду.'] },
    privacy: { intro: 'Межа обчислення локальна, але повний шлях агента може містити хмарні сервіси.', runtimeTitle: 'Середовище SCHNGN', runtimeBody: 'Середовище нічого не зберігає, не надсилає телеметрію, не журналює введені дати та не виконує вихідних мережевих запитів.', hostTitle: 'Хост агента й постачальник моделі', hostBody: 'MCP-клієнт або хост агента може надсилати запити, аргументи інструментів і результати постачальнику моделі. Перед використанням реальних дат подорожей перегляньте його правила конфіденційності та зберігання.' },
    limits: { title: 'Сфера застосування та обмеження', body: 'Ця можливість моделює явно задані безперервні перебування за звичайним шенгенським правилом 90/180 днів. Вона не класифікує країни, не визначає візові права чи права на проживання, не застосовує двосторонні угоди й не надає юридичних порад.', advisory: 'Лише допомога в плануванні. Дозволений строк перебування визначають компетентні органи.' },
    requirements: { title: 'Вимоги', body: 'Node.js 24 або новіша версія. Для обчислення не потрібні обліковий запис SCHNGN, ключ API, розміщена кінцева точка або підключення до мережі.' },
    common: { recommended: 'Рекомендовано', interfaceLabel: 'Інтерфейс' }
  },
  tr: {
    meta: { title: 'Ajan kurulumu | SCHNGN', description: 'SCHNGN uygulamasını yerel MCP sunucusu, CLI, loopback API veya TypeScript paketi olarak kurun ve ajanlara ne zaman kullanacaklarını öğretin.' },
    hero: { eyebrow: 'Yerel ajan özelliği', title: 'Ajanınıza SCHNGN gücü ekleyin', intro: 'Yerel çalışma ortamını kurun, MCP üzerinden bağlayın ve güvenilir Schengen 90/180 gün planlaması için beceriyi ekleyin.', primary: 'MCP kurulumu', secondary: 'Arayüzleri karşılaştır' },
    quickStart: { title: 'Üç komutla hazır olun', intro: 'Ajanlar için önerilen yol MCP’dir. Her komutu terminalinizde çalıştırın.', stepLabels: ['Yerel çalışma ortamını kur', 'SCHNGN uygulamasını Codex’e bağla', 'SCHNGN becerisini ekle'], copy: 'Komutu kopyala', copied: 'Kopyalandı', copyFailed: 'Kopyalama başarısız. Komutu seçip elle kopyalayın.', ready: '3 salt okunur araç hazır' },
    evidence: { items: ['Yerel süreçte hesaplama', 'SCHNGN telemetrisi yok', 'Katı, sürümlü JSON', 'Olağan 90/180 gün kuralı'], privacyNote: 'SCHNGN dışarıya istek göndermez. Ajan barındırıcınız yine de araç girdilerini ve sonuçlarını model sağlayıcısına gönderebilir.' },
    contents: { label: 'Bu sayfada', sections: { mcp: 'MCP kurulumu', skill: 'Ajan becerisi', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Araç başvurusu', privacy: 'Gizlilik sınırı' } },
    mcp: { intro: 'MCP, ajana stdio üzerinden üç salt okunur hesaplama aracı verir. Sunucu makinenizde kalır ve SCHNGN hesabı veya API anahtarı gerektirmez.', verifyTitle: 'Bağlantıyı doğrulayın', verifyBody: 'MCP istemcinizi yeniden başlatın veya yenileyin, ardından SCHNGN araçlarını listelemesini isteyin. Aşağıdaki üç işlemi de görmelisiniz.' },
    skill: { intro: 'Beceri, ajana SCHNGN uygulamasını ne zaman çağıracağını, açık kalış aralıklarını nasıl oluşturacağını ve hukuki statü sorularını ne zaman reddedeceğini öğretir.', behaviorTitle: 'Becerinin kattıkları', behaviors: ['Tarih hesabını yeniden yazmak yerine MCP araçlarını tercih eder.', 'Girdileri kesintisiz Schengen kalışlarının giriş ve çıkış tarihleriyle sınırlar.', 'Olağan kısa kalış planlaması içinde kalır ve istisnai durumları resmi makamlara yönlendirir.'] },
    cli: { intro: 'JSON CLI aracını betiklerde ve ajan kabuklarında kullanın. stdin veya dosyadan katı JSON okur ve tek bir JSON sonucu döndürür.', inputNote: 'Komutlar: schngn usage, schngn check-stay ve schngn latest-exit.' },
    api: { intro: 'REST kullanan araçlar için yalnızca loopback üzerinde bir HTTP hizmeti başlatın. Güncel bir OpenAPI belgesi sunar ve yerel olmayan dinleme adreslerini reddeder.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Düşük seviyeli tarih hesabı için saf motoru veya katı ajan sözleşmesi için capability paketini içe aktarın.', packageNote: 'Paketler: @schngn/engine ve @schngn/capability' },
    tools: { intro: 'Her arayüz aynı sürümlü hesaplama sözleşmesini sunar. Tarihler YYYY-MM-DD biçimini kullanır ve aralıklar giriş ile çıkış günlerini içerir.', inputLabel: 'Girdi', purposeLabel: 'Amaç', purposes: ['Açık bir referans tarihinde kullanılan ve kalan günleri hesaplar.', 'Önerilen kesintisiz kalışın her gününü kontrol eder.', 'Giriş tarihi bilinen bir kalış için en geç güvenli çıkışı bulur.'] },
    privacy: { intro: 'Hesaplama sınırı yereldir, ancak ajanın tüm yolu bulut hizmetlerini içerebilir.', runtimeTitle: 'SCHNGN çalışma ortamı', runtimeBody: 'Çalışma ortamı verileri saklamaz, telemetri göndermez, sunulan tarihleri günlüğe kaydetmez ve dış ağ isteği yapmaz.', hostTitle: 'Ajan barındırıcısı ve model sağlayıcısı', hostBody: 'MCP istemciniz veya ajan barındırıcınız istemleri, araç argümanlarını ve sonuçları model sağlayıcısına gönderebilir. Gerçek seyahat tarihlerini kullanmadan önce sağlayıcının gizlilik ve saklama politikalarını inceleyin.' },
    limits: { title: 'Kapsam ve sınırlamalar', body: 'Bu özellik, olağan Schengen 90/180 gün kuralı altında açık kesintisiz kalışları modeller. Ülkeleri sınıflandırmaz, vize veya ikamet haklarına karar vermez, ikili anlaşmaları uygulamaz ve hukuki tavsiye vermez.', advisory: 'Yalnızca planlama yardımıdır. İzin verilen kalışa yetkili makamlar karar verir.' },
    requirements: { title: 'Gereksinimler', body: 'Node.js 24 veya üzeri. Hesaplama için SCHNGN hesabı, API anahtarı, barındırılan uç nokta veya ağ bağlantısı gerekmez.' },
    common: { recommended: 'Önerilen', interfaceLabel: 'Arayüz' }
  },
  sr: {
    meta: { title: 'Podešavanje za agente | SCHNGN', description: 'Instalirajte SCHNGN kao lokalni MCP server, CLI, loopback API ili TypeScript paket i naučite agente kada da ga koriste.' },
    hero: { eyebrow: 'Lokalna mogućnost za agente', title: 'Povežite SCHNGN sa svojim agentom', intro: 'Instalirajte lokalno okruženje, povežite ga preko MCP-a i dodajte veštinu za pouzdano planiranje šengenskog pravila 90/180 dana.', primary: 'Podesi MCP', secondary: 'Uporedi interfejse' },
    quickStart: { title: 'Tri komande za početak', intro: 'MCP je preporučeni put za agente. Pokrenite svaku komandu u terminalu.', stepLabels: ['Instaliraj lokalno okruženje', 'Poveži SCHNGN sa Codex-om', 'Dodaj SCHNGN veštinu'], copy: 'Kopiraj komandu', copied: 'Kopirano', copyFailed: 'Kopiranje nije uspelo. Izaberite komandu i kopirajte je ručno.', ready: 'Spremna su 3 alata samo za čitanje' },
    evidence: { items: ['Računanje u lokalnom procesu', 'Bez SCHNGN telemetrije', 'Strogi, verzionisani JSON', 'Uobičajeno pravilo 90/180 dana'], privacyNote: 'SCHNGN ne šalje odlazne zahteve. Domaćin vašeg agenta ipak može poslati ulaze i rezultate alata svom dobavljaču modela.' },
    contents: { label: 'Na ovoj stranici', sections: { mcp: 'MCP podešavanje', skill: 'Veština agenta', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Pregled alata', privacy: 'Granica privatnosti' } },
    mcp: { intro: 'MCP daje agentu tri računarska alata samo za čitanje preko stdio. Server ostaje na vašem računaru i ne zahteva SCHNGN nalog ni API ključ.', verifyTitle: 'Proverite vezu', verifyBody: 'Ponovo pokrenite ili osvežite MCP klijent, pa zatražite da izlista SCHNGN alate. Trebalo bi da vidite sve tri operacije ispod.' },
    skill: { intro: 'Veština uči agenta kada da pozove SCHNGN, kako da oblikuje izričite raspone boravka i kada da odbije pitanja o pravnom statusu.', behaviorTitle: 'Šta veština dodaje', behaviors: ['Daje prednost MCP alatima umesto ponovne izrade računanja datuma.', 'Ograničava ulaze na datume ulaska i izlaska za neprekidne šengenske boravke.', 'Ostaje u okviru uobičajenog planiranja kratkog boravka i upućuje izuzetne slučajeve zvaničnim organima.'] },
    cli: { intro: 'Koristite JSON CLI u skriptama i agentskim ljuskama. Čita strogi JSON iz stdin ili datoteke i vraća jedan JSON rezultat.', inputNote: 'Komande: schngn usage, schngn check-stay i schngn latest-exit.' },
    api: { intro: 'Pokrenite HTTP uslugu samo na loopback adresi za REST alate. Ona pruža aktuelni OpenAPI dokument i odbija nelokalne adrese vezivanja.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Uvezite čisto jezgro za osnovno računanje datuma ili capability paket za strogi ugovor agenta.', packageNote: 'Paketi: @schngn/engine i @schngn/capability' },
    tools: { intro: 'Svaki interfejs izlaže isti verzionisani ugovor za računanje. Datumi koriste YYYY-MM-DD, a rasponi uključuju dane ulaska i izlaska.', inputLabel: 'Ulaz', purposeLabel: 'Svrha', purposes: ['Izračunava iskorišćene i preostale dane na izričiti referentni datum.', 'Proverava svaki dan predloženog neprekidnog boravka.', 'Nalazi najkasniji bezbedan izlazak za boravak sa poznatim datumom ulaska.'] },
    privacy: { intro: 'Granica računanja je lokalna, ali puna putanja agenta može uključiti usluge u oblaku.', runtimeTitle: 'SCHNGN okruženje', runtimeBody: 'Okruženje ništa ne čuva, ne šalje telemetriju, ne beleži unete datume i ne pravi odlazne mrežne zahteve.', hostTitle: 'Domaćin agenta i dobavljač modela', hostBody: 'MCP klijent ili domaćin agenta može poslati upite, argumente alata i rezultate dobavljaču modela. Pre stvarnih datuma putovanja proverite njegova pravila privatnosti i čuvanja.' },
    limits: { title: 'Obim i ograničenja', body: 'Ova mogućnost modeluje izričite neprekidne boravke po uobičajenom šengenskom pravilu 90/180 dana. Ne klasifikuje zemlje, ne odlučuje o pravima na vizu ili boravak, ne primenjuje bilateralne sporazume i ne pruža pravni savet.', advisory: 'Samo pomoć pri planiranju. Nadležni organi odlučuju o dozvoljenom boravku.' },
    requirements: { title: 'Uslovi', body: 'Node.js 24 ili noviji. Za računanje nisu potrebni SCHNGN nalog, API ključ, hostovani endpoint ni mrežna veza.' },
    common: { recommended: 'Preporučeno', interfaceLabel: 'Interfejs' }
  },
  sq: {
    meta: { title: 'Konfigurimi për agjentët | SCHNGN', description: 'Instaloni SCHNGN si server lokal MCP, CLI, API loopback ose paketë TypeScript dhe mësojuni agjentëve kur ta përdorin.' },
    hero: { eyebrow: 'Aftësi lokale për agjentët', title: 'Lidheni SCHNGN me agjentin tuaj', intro: 'Instaloni mjedisin lokal, lidheni përmes MCP dhe shtoni aftësinë për planifikim të besueshëm të rregullit Schengen 90/180 ditë.', primary: 'Konfiguro MCP', secondary: 'Krahaso ndërfaqet' },
    quickStart: { title: 'Tri komanda për të filluar', intro: 'MCP është rruga e rekomanduar për agjentët. Ekzekutoni çdo komandë në terminal.', stepLabels: ['Instalo mjedisin lokal', 'Lidh SCHNGN me Codex', 'Shto aftësinë SCHNGN'], copy: 'Kopjo komandën', copied: 'U kopjua', copyFailed: 'Kopjimi dështoi. Përzgjidhni komandën dhe kopjojeni manualisht.', ready: 'Gati me 3 mjete vetëm për lexim' },
    evidence: { items: ['Llogaritje në proces lokal', 'Pa telemetri nga SCHNGN', 'JSON i rreptë dhe i versionuar', 'Rregulli i zakonshëm 90/180 ditë'], privacyNote: 'SCHNGN nuk bën kërkesa dalëse. Pritësi i agjentit tuaj mund t’ia dërgojë përsëri hyrjet dhe rezultatet e mjeteve ofruesit të modelit.' },
    contents: { label: 'Në këtë faqe', sections: { mcp: 'Konfigurimi MCP', skill: 'Aftësia e agjentit', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'Referenca e mjeteve', privacy: 'Kufiri i privatësisë' } },
    mcp: { intro: 'MCP i jep agjentit tri mjete llogaritëse vetëm për lexim përmes stdio. Serveri qëndron në pajisjen tuaj dhe nuk kërkon llogari SCHNGN ose çelës API.', verifyTitle: 'Verifikoni lidhjen', verifyBody: 'Rinisni ose rifreskoni klientin MCP, pastaj kërkojini të rendisë mjetet SCHNGN. Duhet të shihni të tria veprimet më poshtë.' },
    skill: { intro: 'Aftësia i mëson agjentit kur të thërrasë SCHNGN, si të formojë intervale të qarta qëndrimi dhe kur të refuzojë pyetje për statusin ligjor.', behaviorTitle: 'Çfarë shton aftësia', behaviors: ['Parapëlqen mjetet MCP në vend që të rindërtojë llogaritjen e datave.', 'I kufizon hyrjet te datat e hyrjes dhe daljes për qëndrime të vazhdueshme Schengen.', 'Qëndron brenda planifikimit të zakonshëm të qëndrimit të shkurtër dhe i drejton rastet e veçanta te autoritetet zyrtare.'] },
    cli: { intro: 'Përdorni JSON CLI në skripte dhe shell të agjentëve. Lexon JSON të rreptë nga stdin ose një skedar dhe kthen një rezultat JSON.', inputNote: 'Komandat: schngn usage, schngn check-stay dhe schngn latest-exit.' },
    api: { intro: 'Nisni një shërbim HTTP vetëm në loopback për mjetet REST. Ai ofron një dokument OpenAPI aktiv dhe refuzon adresat e lidhjes jo lokale.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'Importoni motorin e pastër për llogaritje bazë të datave ose paketën capability për kontratën e rreptë të agjentit.', packageNote: 'Paketat: @schngn/engine dhe @schngn/capability' },
    tools: { intro: 'Çdo ndërfaqe ofron të njëjtën kontratë llogaritjeje të versionuar. Datat përdorin YYYY-MM-DD dhe intervalet përfshijnë ditët e hyrjes dhe daljes.', inputLabel: 'Hyrja', purposeLabel: 'Qëllimi', purposes: ['Llogarit ditët e përdorura dhe të mbetura në një datë reference të qartë.', 'Kontrollon çdo ditë të një qëndrimi të vazhdueshëm të propozuar.', 'Gjen daljen më të fundit të sigurt për një qëndrim me datë hyrjeje të njohur.'] },
    privacy: { intro: 'Kufiri i llogaritjes është lokal, por rruga e plotë e agjentit mund të përfshijë shërbime cloud.', runtimeTitle: 'Mjedisi SCHNGN', runtimeBody: 'Mjedisi nuk ruan të dhëna, nuk dërgon telemetri, nuk regjistron datat e dorëzuara dhe nuk bën kërkesa rrjeti dalëse.', hostTitle: 'Pritësi i agjentit dhe ofruesi i modelit', hostBody: 'Klienti MCP ose pritësi i agjentit mund t’i dërgojë udhëzimet, argumentet e mjeteve dhe rezultatet ofruesit të modelit. Kontrolloni politikat e privatësisë dhe ruajtjes para se të përdorni data reale udhëtimi.' },
    limits: { title: 'Fusha dhe kufizimet', body: 'Kjo aftësi modelon qëndrime të qarta të vazhdueshme sipas rregullit të zakonshëm Schengen 90/180 ditë. Nuk klasifikon shtete, nuk vendos për të drejta vize ose qëndrimi, nuk zbaton marrëveshje dypalëshe dhe nuk jep këshillë ligjore.', advisory: 'Vetëm ndihmë për planifikim. Autoritetet kompetente vendosin qëndrimin e lejuar.' },
    requirements: { title: 'Kërkesat', body: 'Node.js 24 ose më i ri. Për llogaritjen nuk kërkohet llogari SCHNGN, çelës API, endpoint i hostuar ose lidhje rrjeti.' },
    common: { recommended: 'Rekomandohet', interfaceLabel: 'Ndërfaqja' }
  },
  ka: {
    meta: { title: 'აგენტების დაყენება | SCHNGN', description: 'დააყენეთ SCHNGN ლოკალურ MCP სერვერად, CLI-დ, loopback API-დ ან TypeScript პაკეტად და ასწავლეთ აგენტებს, როდის გამოიყენონ ის.' },
    hero: { eyebrow: 'ლოკალური შესაძლებლობა აგენტებისთვის', title: 'დააკავშირეთ SCHNGN თქვენს აგენტთან', intro: 'დააყენეთ ლოკალური გარემო, დააკავშირეთ MCP-ით და დაამატეთ skill შენგენის 90/180 დღის წესის საიმედო დაგეგმვისთვის.', primary: 'MCP-ის დაყენება', secondary: 'ინტერფეისების შედარება' },
    quickStart: { title: 'სამი ბრძანება დასაწყებად', intro: 'აგენტებისთვის რეკომენდებული გზა MCP-ია. გაუშვით თითოეული ბრძანება ტერმინალში.', stepLabels: ['ლოკალური გარემოს დაყენება', 'SCHNGN-ის Codex-თან დაკავშირება', 'SCHNGN skill-ის დამატება'], copy: 'ბრძანების კოპირება', copied: 'კოპირებულია', copyFailed: 'კოპირება ვერ მოხერხდა. მონიშნეთ ბრძანება და ხელით დააკოპირეთ.', ready: 'მზადაა 3 მხოლოდ წაკითხვის ინსტრუმენტი' },
    evidence: { items: ['გამოთვლა ლოკალურ პროცესში', 'SCHNGN ტელემეტრიის გარეშე', 'მკაცრი და ვერსირებული JSON', 'ჩვეულებრივი 90/180 დღის წესი'], privacyNote: 'SCHNGN გამავალ მოთხოვნებს არ აკეთებს. თუმცა თქვენი აგენტის ჰოსტმა შეიძლება ინსტრუმენტის მონაცემები და შედეგები მოდელის მომწოდებელს გაუგზავნოს.' },
    contents: { label: 'ამ გვერდზე', sections: { mcp: 'MCP-ის დაყენება', skill: 'აგენტის skill', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'ინსტრუმენტების ცნობარი', privacy: 'კონფიდენციალურობის საზღვარი' } },
    mcp: { intro: 'MCP აგენტს stdio-ით აძლევს სამ მხოლოდ წაკითხვის გამოთვლის ინსტრუმენტს. სერვერი თქვენს კომპიუტერზე რჩება და SCHNGN ანგარიში ან API გასაღები არ სჭირდება.', verifyTitle: 'კავშირის შემოწმება', verifyBody: 'გადატვირთეთ ან განაახლეთ MCP კლიენტი და სთხოვეთ SCHNGN ინსტრუმენტების ჩამოთვლა. ქვემოთ მოცემული სამივე ოპერაცია უნდა გამოჩნდეს.' },
    skill: { intro: 'Skill აგენტს ასწავლის, როდის გამოიძახოს SCHNGN, როგორ შექმნას მკაფიო ყოფნის დიაპაზონები და როდის უარყოს სამართლებრივი სტატუსის კითხვები.', behaviorTitle: 'რას ამატებს skill', behaviors: ['თარიღების გამოთვლის თავიდან დაწერის ნაცვლად MCP ინსტრუმენტებს ამჯობინებს.', 'შეყვანას ზღუდავს შენგენში უწყვეტი ყოფნის შესვლისა და გასვლის თარიღებით.', 'რჩება ჩვეულებრივი მოკლევადიანი ყოფნის დაგეგმვის ფარგლებში და გამონაკლის შემთხვევებს ოფიციალურ უწყებებთან გზავნის.'] },
    cli: { intro: 'გამოიყენეთ JSON CLI სკრიპტებსა და აგენტის shell-ში. ის მკაცრ JSON-ს stdin-იდან ან ფაილიდან კითხულობს და ერთ JSON შედეგს აბრუნებს.', inputNote: 'ბრძანებები: schngn usage, schngn check-stay და schngn latest-exit.' },
    api: { intro: 'REST ინსტრუმენტებისთვის გაუშვით HTTP სერვისი მხოლოდ loopback-ზე. ის გასცემს მიმდინარე OpenAPI დოკუმენტს და უარყოფს არალოკალურ მისამართებს.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'დაბალი დონის თარიღების გამოთვლისთვის შემოიტანეთ სუფთა engine, ხოლო მკაცრი აგენტის კონტრაქტისთვის capability პაკეტი.', packageNote: 'პაკეტები: @schngn/engine და @schngn/capability' },
    tools: { intro: 'ყველა ინტერფეისი ერთსა და იმავე ვერსირებულ გამოთვლის კონტრაქტს იძლევა. თარიღები იყენებს YYYY-MM-DD ფორმატს, დიაპაზონები კი შესვლისა და გასვლის დღეებს მოიცავს.', inputLabel: 'შეყვანა', purposeLabel: 'მიზანი', purposes: ['ითვლის გამოყენებულ და დარჩენილ დღეებს კონკრეტულ საცნობარო თარიღზე.', 'ამოწმებს შემოთავაზებული უწყვეტი ყოფნის ყოველ დღეს.', 'პოულობს ბოლო უსაფრთხო გასვლას ცნობილი შესვლის თარიღის მქონე ყოფნისთვის.'] },
    privacy: { intro: 'გამოთვლის საზღვარი ლოკალურია, თუმცა აგენტის სრული გზა შეიძლება ღრუბლოვან სერვისებს მოიცავდეს.', runtimeTitle: 'SCHNGN გარემო', runtimeBody: 'გარემო არაფერს ინახავს, არ აგზავნის ტელემეტრიას, არ აღრიცხავს შეყვანილ თარიღებს და არ აკეთებს გამავალ ქსელურ მოთხოვნებს.', hostTitle: 'აგენტის ჰოსტი და მოდელის მომწოდებელი', hostBody: 'MCP კლიენტმა ან აგენტის ჰოსტმა შეიძლება მოთხოვნები, ინსტრუმენტის არგუმენტები და შედეგები მოდელის მომწოდებელს გაუგზავნოს. რეალური მოგზაურობის თარიღების გამოყენებამდე გადახედეთ მის კონფიდენციალურობისა და შენახვის წესებს.' },
    limits: { title: 'ფარგლები და შეზღუდვები', body: 'ეს შესაძლებლობა მოდელირებს მკაფიო უწყვეტ ყოფნებს შენგენის ჩვეულებრივი 90/180 დღის წესით. ის არ ახარისხებს ქვეყნებს, არ წყვეტს ვიზის ან ბინადრობის უფლებებს, არ იყენებს ორმხრივ შეთანხმებებს და არ იძლევა იურიდიულ რჩევას.', advisory: 'მხოლოდ დაგეგმვის დამხმარე საშუალება. ნებადართულ ყოფნას კომპეტენტური ორგანოები წყვეტენ.' },
    requirements: { title: 'მოთხოვნები', body: 'Node.js 24 ან უფრო ახალი. გამოთვლას არ სჭირდება SCHNGN ანგარიში, API გასაღები, ჰოსტირებული endpoint ან ქსელური კავშირი.' },
    common: { recommended: 'რეკომენდებული', interfaceLabel: 'ინტერფეისი' }
  },
  'zh-cn': {
    meta: { title: '智能体设置 | SCHNGN', description: '将 SCHNGN 安装为本地 MCP 服务器、CLI、回环 API 或 TypeScript 包，并教会智能体何时使用它。' },
    hero: { eyebrow: '本地智能体能力', title: '让你的智能体接入 SCHNGN', intro: '安装本地运行时，通过 MCP 连接，并添加技能，以可靠规划申根 90/180 天规则。', primary: '设置 MCP', secondary: '比较接口' },
    quickStart: { title: '三个命令即可就绪', intro: 'MCP 是智能体的推荐方式。请在终端中依次运行每个命令。', stepLabels: ['安装本地运行时', '将 SCHNGN 连接到 Codex', '添加 SCHNGN 技能'], copy: '复制命令', copied: '已复制', copyFailed: '复制失败。请选择命令并手动复制。', ready: '3 个只读工具已就绪' },
    evidence: { items: ['在本地进程中计算', '无 SCHNGN 遥测', '严格且有版本的 JSON', '普通 90/180 天规则'], privacyNote: 'SCHNGN 不会发出出站请求。不过，你的智能体主机仍可能把工具输入和结果发送给其模型提供商。' },
    contents: { label: '本页内容', sections: { mcp: 'MCP 设置', skill: '智能体技能', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: '工具参考', privacy: '隐私边界' } },
    mcp: { intro: 'MCP 通过 stdio 为智能体提供三个只读计算工具。服务器保留在你的设备上，无需 SCHNGN 账户或 API 密钥。', verifyTitle: '验证连接', verifyBody: '重启或刷新 MCP 客户端，然后让它列出 SCHNGN 工具。你应看到下方全部三个操作。' },
    skill: { intro: '该技能会教智能体何时调用 SCHNGN、如何构造明确的停留区间，以及何时拒绝法律身份问题。', behaviorTitle: '该技能提供的行为', behaviors: ['优先使用 MCP 工具，不重新实现日期计算。', '输入仅包含连续申根停留的入境和出境日期。', '只处理普通短期停留规划，并将特殊情况引导至官方主管机关。'] },
    cli: { intro: '在脚本和智能体 shell 中使用 JSON CLI。它从 stdin 或文件读取严格 JSON，并返回一个 JSON 结果。', inputNote: '命令：schngn usage、schngn check-stay 和 schngn latest-exit。' },
    api: { intro: '为使用 REST 的工具启动仅限回环地址的 HTTP 服务。它提供实时 OpenAPI 文档，并拒绝非本地绑定地址。', docsNote: 'OpenAPI：http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: '导入纯 engine 进行底层日期计算，或导入 capability 包使用严格的智能体契约。', packageNote: '软件包：@schngn/engine 和 @schngn/capability' },
    tools: { intro: '每种接口都提供相同的版本化计算契约。日期使用 YYYY-MM-DD，停留区间同时包含入境日和出境日。', inputLabel: '输入', purposeLabel: '用途', purposes: ['计算明确参考日期上的已用天数和剩余天数。', '逐日检查拟议的连续停留。', '为已知入境日期的停留找出最晚安全出境日。'] },
    privacy: { intro: '计算边界位于本地，但完整的智能体链路可能包含云服务。', runtimeTitle: 'SCHNGN 运行时', runtimeBody: '运行时不持久化数据、不发送遥测、不记录提交的日期，也不发出出站网络请求。', hostTitle: '智能体主机和模型提供商', hostBody: '你的 MCP 客户端或智能体主机可能把提示、工具参数和结果发送给模型提供商。使用真实旅行日期前，请查看该提供商的隐私和保留政策。' },
    limits: { title: '范围和限制', body: '此能力按照普通申根 90/180 天规则对明确的连续停留进行建模。它不判断国家归属、不决定签证或居留权、不应用双边协议，也不提供法律建议。', advisory: '仅供规划参考。获准停留期限由主管机关决定。' },
    requirements: { title: '要求', body: '需要 Node.js 24 或更高版本。计算无需 SCHNGN 账户、API 密钥、托管端点或网络连接。' },
    common: { recommended: '推荐', interfaceLabel: '接口' }
  },
  ja: {
    meta: { title: 'エージェント設定 | SCHNGN', description: 'SCHNGN をローカル MCP サーバー、CLI、ループバック API、または TypeScript パッケージとして導入し、エージェントに使いどころを教えます。' },
    hero: { eyebrow: 'ローカルのエージェント機能', title: 'エージェントに SCHNGN を接続', intro: 'ローカルランタイムを導入し、MCP で接続して、シェンゲン 90/180 日ルールを確実に計画するためのスキルを追加します。', primary: 'MCP を設定', secondary: 'インターフェースを比較' },
    quickStart: { title: '3 つのコマンドで準備完了', intro: 'エージェントには MCP を推奨します。各コマンドをターミナルで実行してください。', stepLabels: ['ローカルランタイムを導入', 'SCHNGN を Codex に接続', 'SCHNGN スキルを追加'], copy: 'コマンドをコピー', copied: 'コピーしました', copyFailed: 'コピーできませんでした。コマンドを選択して手動でコピーしてください。', ready: '3 つの読み取り専用ツールを使用可能' },
    evidence: { items: ['ローカルプロセスで計算', 'SCHNGN のテレメトリなし', '厳格でバージョン付きの JSON', '通常の 90/180 日ルール'], privacyNote: 'SCHNGN は外部へリクエストしません。ただし、エージェントホストがツールの入力と結果をモデル提供者へ送信する場合があります。' },
    contents: { label: 'このページの内容', sections: { mcp: 'MCP 設定', skill: 'エージェントスキル', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'ツールリファレンス', privacy: 'プライバシー境界' } },
    mcp: { intro: 'MCP は stdio 経由で 3 つの読み取り専用計算ツールをエージェントに提供します。サーバーは端末内に留まり、SCHNGN アカウントや API キーは不要です。', verifyTitle: '接続を確認', verifyBody: 'MCP クライアントを再起動または更新し、SCHNGN ツールの一覧を求めます。下記の 3 操作すべてが表示されます。' },
    skill: { intro: 'このスキルは、SCHNGN を呼び出す場面、明示的な滞在範囲の作り方、法的地位に関する質問を断る場面をエージェントに教えます。', behaviorTitle: 'スキルが追加する動作', behaviors: ['日付計算を作り直さず MCP ツールを優先します。', '入力を連続したシェンゲン滞在の入域日と出域日に限定します。', '通常の短期滞在計画に限定し、例外的な事案は公的機関へ案内します。'] },
    cli: { intro: 'スクリプトやエージェントのシェルでは JSON CLI を使います。stdin またはファイルから厳格な JSON を読み、1 つの JSON 結果を返します。', inputNote: 'コマンド: schngn usage、schngn check-stay、schngn latest-exit。' },
    api: { intro: 'REST 対応ツール向けにループバック限定の HTTP サービスを起動します。最新の OpenAPI 文書を提供し、ローカル以外のバインドアドレスを拒否します。', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: '低レベルの日付計算には純粋な engine を、厳格なエージェント契約には capability パッケージをインポートします。', packageNote: 'パッケージ: @schngn/engine と @schngn/capability' },
    tools: { intro: 'すべてのインターフェースが同じバージョン付き計算契約を公開します。日付は YYYY-MM-DD 形式で、滞在範囲には入域日と出域日の両方を含めます。', inputLabel: '入力', purposeLabel: '目的', purposes: ['明示した基準日に使用済み日数と残日数を計算します。', '提案した連続滞在を毎日確認します。', '入域日が既知の滞在について最も遅い安全な出域日を求めます。'] },
    privacy: { intro: '計算の境界はローカルですが、エージェント全体の経路にはクラウドサービスが含まれる場合があります。', runtimeTitle: 'SCHNGN ランタイム', runtimeBody: 'ランタイムはデータを保存せず、テレメトリを送信せず、入力された日付を記録せず、外向きのネットワークリクエストを行いません。', hostTitle: 'エージェントホストとモデル提供者', hostBody: 'MCP クライアントやエージェントホストは、プロンプト、ツール引数、結果をモデル提供者へ送る場合があります。実際の旅行日を使う前に、その提供者のプライバシーと保持方針を確認してください。' },
    limits: { title: '対象範囲と制限', body: 'この機能は、通常のシェンゲン 90/180 日ルールに基づく明示的な連続滞在を扱います。国の分類、ビザや居住権の判断、二国間協定の適用、法律助言は行いません。', advisory: '計画支援専用です。許可される滞在は管轄当局が判断します。' },
    requirements: { title: '要件', body: 'Node.js 24 以降。計算に SCHNGN アカウント、API キー、ホストされたエンドポイント、ネットワーク接続は不要です。' },
    common: { recommended: '推奨', interfaceLabel: 'インターフェース' }
  },
  ko: {
    meta: { title: '에이전트 설정 | SCHNGN', description: 'SCHNGN을 로컬 MCP 서버, CLI, 루프백 API 또는 TypeScript 패키지로 설치하고 에이전트가 언제 사용할지 알려 주세요.' },
    hero: { eyebrow: '로컬 에이전트 기능', title: '에이전트에 SCHNGN 연결하기', intro: '로컬 런타임을 설치하고 MCP로 연결한 뒤 신뢰할 수 있는 솅겐 90/180일 계획을 위한 스킬을 추가하세요.', primary: 'MCP 설정', secondary: '인터페이스 비교' },
    quickStart: { title: '명령어 3개로 준비 완료', intro: '에이전트에는 MCP 방식을 권장합니다. 터미널에서 각 명령어를 실행하세요.', stepLabels: ['로컬 런타임 설치', 'SCHNGN을 Codex에 연결', 'SCHNGN 스킬 추가'], copy: '명령어 복사', copied: '복사됨', copyFailed: '복사하지 못했습니다. 명령어를 선택해 직접 복사하세요.', ready: '읽기 전용 도구 3개 준비 완료' },
    evidence: { items: ['로컬 프로세스에서 계산', 'SCHNGN 텔레메트리 없음', '엄격하고 버전이 지정된 JSON', '일반 90/180일 규칙'], privacyNote: 'SCHNGN은 외부 요청을 하지 않습니다. 다만 에이전트 호스트가 도구 입력과 결과를 모델 제공업체에 보낼 수 있습니다.' },
    contents: { label: '이 페이지의 내용', sections: { mcp: 'MCP 설정', skill: '에이전트 스킬', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: '도구 참조', privacy: '개인정보 경계' } },
    mcp: { intro: 'MCP는 stdio를 통해 에이전트에 읽기 전용 계산 도구 3개를 제공합니다. 서버는 사용자의 기기에 남으며 SCHNGN 계정이나 API 키가 필요 없습니다.', verifyTitle: '연결 확인', verifyBody: 'MCP 클라이언트를 다시 시작하거나 새로 고친 뒤 SCHNGN 도구 목록을 요청하세요. 아래의 세 작업이 모두 보여야 합니다.' },
    skill: { intro: '스킬은 SCHNGN을 호출할 시점, 명시적인 체류 범위를 만드는 방법, 법적 지위 질문을 거절할 시점을 에이전트에 알려 줍니다.', behaviorTitle: '스킬이 더하는 동작', behaviors: ['날짜 계산을 다시 구현하는 대신 MCP 도구를 우선합니다.', '입력은 연속된 솅겐 체류의 입국일과 출국일로 제한합니다.', '일반 단기 체류 계획 범위만 다루며 예외 사례는 공식 기관으로 안내합니다.'] },
    cli: { intro: '스크립트와 에이전트 셸에서는 JSON CLI를 사용하세요. stdin 또는 파일에서 엄격한 JSON을 읽고 하나의 JSON 결과를 반환합니다.', inputNote: '명령어: schngn usage, schngn check-stay, schngn latest-exit.' },
    api: { intro: 'REST 도구를 위해 루프백 전용 HTTP 서비스를 시작하세요. 실시간 OpenAPI 문서를 제공하고 로컬이 아닌 바인드 주소를 거부합니다.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: '저수준 날짜 계산에는 순수 engine을, 엄격한 에이전트 계약에는 capability 패키지를 가져오세요.', packageNote: '패키지: @schngn/engine 및 @schngn/capability' },
    tools: { intro: '모든 인터페이스가 같은 버전 지정 계산 계약을 제공합니다. 날짜는 YYYY-MM-DD 형식이며 체류 범위에는 입국일과 출국일이 모두 포함됩니다.', inputLabel: '입력', purposeLabel: '목적', purposes: ['명시한 기준일의 사용 일수와 남은 일수를 계산합니다.', '제안된 연속 체류의 모든 날짜를 확인합니다.', '입국일이 알려진 체류의 가장 늦은 안전 출국일을 찾습니다.'] },
    privacy: { intro: '계산 경계는 로컬이지만 전체 에이전트 경로에는 클라우드 서비스가 포함될 수 있습니다.', runtimeTitle: 'SCHNGN 런타임', runtimeBody: '런타임은 데이터를 저장하거나 텔레메트리를 보내거나 제출된 날짜를 기록하거나 외부 네트워크 요청을 하지 않습니다.', hostTitle: '에이전트 호스트와 모델 제공업체', hostBody: 'MCP 클라이언트나 에이전트 호스트가 프롬프트, 도구 인수, 결과를 모델 제공업체에 보낼 수 있습니다. 실제 여행 날짜를 쓰기 전에 해당 제공업체의 개인정보 및 보관 정책을 확인하세요.' },
    limits: { title: '범위와 제한', body: '이 기능은 일반 솅겐 90/180일 규칙에 따라 명시된 연속 체류를 모델링합니다. 국가를 분류하거나 비자 및 거주 권리를 판단하거나 양자 협정을 적용하거나 법률 조언을 제공하지 않습니다.', advisory: '계획 보조용일 뿐입니다. 허용 체류 기간은 관할 당국이 결정합니다.' },
    requirements: { title: '요구 사항', body: 'Node.js 24 이상. 계산에는 SCHNGN 계정, API 키, 호스팅 엔드포인트 또는 네트워크 연결이 필요 없습니다.' },
    common: { recommended: '권장', interfaceLabel: '인터페이스' }
  },
  he: {
    meta: { title: 'הגדרה לסוכנים | SCHNGN', description: 'התקינו את SCHNGN כשרת MCP מקומי, CLI, ממשק loopback API או חבילת TypeScript, ולמדו סוכנים מתי להשתמש בו.' },
    hero: { eyebrow: 'יכולת מקומית לסוכנים', title: 'חברו את SCHNGN לסוכן שלכם', intro: 'התקינו את סביבת ההרצה המקומית, חברו אותה דרך MCP והוסיפו את המיומנות לתכנון אמין לפי כלל שנגן 90/180 ימים.', primary: 'הגדרת MCP', secondary: 'השוואת ממשקים' },
    quickStart: { title: 'שלוש פקודות ומתחילים', intro: 'MCP הוא המסלול המומלץ לסוכנים. הריצו כל פקודה במסוף.', stepLabels: ['התקנת סביבת ההרצה המקומית', 'חיבור SCHNGN אל Codex', 'הוספת מיומנות SCHNGN'], copy: 'העתקת הפקודה', copied: 'הועתק', copyFailed: 'ההעתקה נכשלה. בחרו את הפקודה והעתיקו אותה ידנית.', ready: '3 כלים לקריאה בלבד מוכנים' },
    evidence: { items: ['חישוב בתהליך מקומי', 'ללא טלמטריה של SCHNGN', 'JSON קפדני ובעל גרסה', 'כלל 90/180 הימים הרגיל'], privacyNote: 'SCHNGN אינו שולח בקשות החוצה. עם זאת, מארח הסוכן עשוי לשלוח את קלט הכלים ואת תוצאותיהם לספק המודל שלו.' },
    contents: { label: 'בעמוד זה', sections: { mcp: 'הגדרת MCP', skill: 'מיומנות הסוכן', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'מדריך הכלים', privacy: 'גבול הפרטיות' } },
    mcp: { intro: 'MCP מעניק לסוכן שלושה כלי חישוב לקריאה בלבד דרך stdio. השרת נשאר במחשב שלכם ואינו דורש חשבון SCHNGN או מפתח API.', verifyTitle: 'אימות החיבור', verifyBody: 'הפעילו מחדש או רעננו את לקוח MCP, ואז בקשו ממנו להציג את כלי SCHNGN. כל שלוש הפעולות שלמטה אמורות להופיע.' },
    skill: { intro: 'המיומנות מלמדת את הסוכן מתי לקרוא ל-SCHNGN, כיצד לבנות טווחי שהייה מפורשים ומתי לסרב לשאלות על מעמד משפטי.', behaviorTitle: 'מה המיומנות מוסיפה', behaviors: ['מעדיפה את כלי MCP במקום לממש מחדש את חישוב התאריכים.', 'מגבילה את הקלט לתאריכי כניסה ויציאה של שהיות רצופות בשנגן.', 'נשארת בתחום תכנון שהייה קצרה רגילה ומפנה מקרים חריגים לרשויות הרשמיות.'] },
    cli: { intro: 'השתמשו ב-JSON CLI בסקריפטים ובמעטפות של סוכנים. הוא קורא JSON קפדני מ-stdin או מקובץ ומחזיר תוצאת JSON אחת.', inputNote: 'פקודות: schngn usage, schngn check-stay ו-schngn latest-exit.' },
    api: { intro: 'הפעילו שירות HTTP המוגבל ל-loopback עבור כלי REST. הוא מספק מסמך OpenAPI עדכני ומסרב לכתובות קישור שאינן מקומיות.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'ייבאו את engine הטהור לחישובי תאריכים ברמה נמוכה או את חבילת capability לחוזה הסוכן הקפדני.', packageNote: 'חבילות: @schngn/engine ו-@schngn/capability' },
    tools: { intro: 'כל ממשק חושף אותו חוזה חישוב בעל גרסה. תאריכים משתמשים במבנה YYYY-MM-DD וטווחי השהייה כוללים את ימי הכניסה והיציאה.', inputLabel: 'קלט', purposeLabel: 'מטרה', purposes: ['חישוב הימים שנוצלו ושנותרו בתאריך ייחוס מפורש.', 'בדיקת כל יום בשהייה רצופה מוצעת.', 'מציאת תאריך היציאה הבטוח המאוחר ביותר לשהייה עם תאריך כניסה ידוע.'] },
    privacy: { intro: 'גבול החישוב מקומי, אך המסלול המלא של הסוכן עשוי לכלול שירותי ענן.', runtimeTitle: 'סביבת ההרצה של SCHNGN', runtimeBody: 'סביבת ההרצה אינה שומרת נתונים, שולחת טלמטריה, מתעדת תאריכים שנמסרו או שולחת בקשות רשת החוצה.', hostTitle: 'מארח הסוכן וספק המודל', hostBody: 'לקוח MCP או מארח הסוכן עשוי לשלוח הנחיות, ארגומנטים של כלים ותוצאות לספק המודל. בדקו את מדיניות הפרטיות והשמירה שלו לפני שימוש בתאריכי נסיעה אמיתיים.' },
    limits: { title: 'תחום ומגבלות', body: 'יכולת זו מדמה שהיות רצופות מפורשות לפי כלל שנגן 90/180 הימים הרגיל. היא אינה מסווגת מדינות, קובעת זכויות אשרה או תושבות, מחילה הסכמים דו-צדדיים או מספקת ייעוץ משפטי.', advisory: 'כלי עזר לתכנון בלבד. הרשויות המוסמכות קובעות את השהייה המותרת.' },
    requirements: { title: 'דרישות', body: 'Node.js 24 ומעלה. החישוב אינו דורש חשבון SCHNGN, מפתח API, נקודת קצה מתארחת או חיבור רשת.' },
    common: { recommended: 'מומלץ', interfaceLabel: 'ממשק' }
  },
  ar: {
    meta: { title: 'إعداد الوكلاء | SCHNGN', description: 'ثبّت SCHNGN كخادم MCP محلي أو CLI أو واجهة loopback API أو حزمة TypeScript، وعلّم الوكلاء متى يستخدمونه.' },
    hero: { eyebrow: 'إمكانات محلية للوكلاء', title: 'اربط SCHNGN بوكيلك', intro: 'ثبّت بيئة التشغيل المحلية واربطها عبر MCP وأضف المهارة لتخطيط موثوق وفق قاعدة شنغن 90/180 يومًا.', primary: 'إعداد MCP', secondary: 'مقارنة الواجهات' },
    quickStart: { title: 'ثلاثة أوامر للبدء', intro: 'MCP هو المسار الموصى به للوكلاء. شغّل كل أمر في الطرفية.', stepLabels: ['تثبيت بيئة التشغيل المحلية', 'ربط SCHNGN مع Codex', 'إضافة مهارة SCHNGN'], copy: 'نسخ الأمر', copied: 'تم النسخ', copyFailed: 'تعذر النسخ. حدّد الأمر وانسخه يدويًا.', ready: '3 أدوات للقراءة فقط جاهزة' },
    evidence: { items: ['الحساب في عملية محلية', 'دون قياس عن بعد من SCHNGN', 'JSON صارم ومحدد الإصدار', 'قاعدة 90/180 يومًا العادية'], privacyNote: 'لا يرسل SCHNGN طلبات إلى الخارج. ومع ذلك قد يرسل مضيف وكيلك مدخلات الأدوات ونتائجها إلى مزود النموذج.' },
    contents: { label: 'في هذه الصفحة', sections: { mcp: 'إعداد MCP', skill: 'مهارة الوكيل', cli: 'CLI', api: 'REST + OpenAPI', typescript: 'TypeScript', tools: 'مرجع الأدوات', privacy: 'حدود الخصوصية' } },
    mcp: { intro: 'يوفر MCP للوكيل ثلاث أدوات حساب للقراءة فقط عبر stdio. يبقى الخادم على جهازك ولا يحتاج إلى حساب SCHNGN أو مفتاح API.', verifyTitle: 'التحقق من الاتصال', verifyBody: 'أعد تشغيل عميل MCP أو حدّثه، ثم اطلب منه إدراج أدوات SCHNGN. ينبغي أن ترى العمليات الثلاث أدناه.' },
    skill: { intro: 'تعلّم المهارة الوكيل متى يستدعي SCHNGN وكيف ينشئ نطاقات إقامة صريحة ومتى يرفض أسئلة الوضع القانوني.', behaviorTitle: 'ما الذي تضيفه المهارة', behaviors: ['تفضّل أدوات MCP بدلًا من إعادة تنفيذ حساب التواريخ.', 'تقصر المدخلات على تواريخ الدخول والخروج للإقامات المتصلة في شنغن.', 'تلتزم بتخطيط الإقامة القصيرة العادية وتحيل الحالات الاستثنائية إلى السلطات الرسمية.'] },
    cli: { intro: 'استخدم JSON CLI في البرامج النصية وأصداف الوكلاء. يقرأ JSON صارمًا من stdin أو من ملف ويعيد نتيجة JSON واحدة.', inputNote: 'الأوامر: schngn usage وschngn check-stay وschngn latest-exit.' },
    api: { intro: 'شغّل خدمة HTTP محصورة في loopback للأدوات التي تستخدم REST. توفر مستند OpenAPI محدثًا وترفض عناوين الربط غير المحلية.', docsNote: 'OpenAPI: http://127.0.0.1:37491/openapi.json' },
    typescript: { intro: 'استورد engine النقي لحسابات التواريخ منخفضة المستوى أو حزمة capability لعقد الوكيل الصارم.', packageNote: 'الحزم: @schngn/engine و@schngn/capability' },
    tools: { intro: 'تعرض كل واجهة عقد الحساب نفسه والمحدد بالإصدار. تستخدم التواريخ تنسيق YYYY-MM-DD وتشمل نطاقات الإقامة يومي الدخول والخروج.', inputLabel: 'المدخلات', purposeLabel: 'الغرض', purposes: ['حساب الأيام المستخدمة والمتبقية في تاريخ مرجعي صريح.', 'فحص كل يوم من إقامة متصلة مقترحة.', 'العثور على آخر خروج آمن لإقامة ذات تاريخ دخول معروف.'] },
    privacy: { intro: 'حدود الحساب محلية، لكن مسار الوكيل الكامل قد يشمل خدمات سحابية.', runtimeTitle: 'بيئة تشغيل SCHNGN', runtimeBody: 'لا تحفظ بيئة التشغيل البيانات ولا ترسل القياس عن بعد ولا تسجل التواريخ المقدمة ولا تنفذ طلبات شبكة صادرة.', hostTitle: 'مضيف الوكيل ومزود النموذج', hostBody: 'قد يرسل عميل MCP أو مضيف الوكيل التعليمات ووسائط الأدوات والنتائج إلى مزود النموذج. راجع سياسات الخصوصية والاحتفاظ لديه قبل استخدام تواريخ سفر حقيقية.' },
    limits: { title: 'النطاق والقيود', body: 'تمثل هذه الإمكانية إقامات متصلة وصريحة وفق قاعدة شنغن 90/180 يومًا العادية. ولا تصنف البلدان أو تقرر حقوق التأشيرة أو الإقامة أو تطبق الاتفاقيات الثنائية أو تقدم مشورة قانونية.', advisory: 'أداة مساعدة للتخطيط فقط. تحدد السلطات المختصة مدة الإقامة المصرح بها.' },
    requirements: { title: 'المتطلبات', body: 'Node.js 24 أو أحدث. لا يتطلب الحساب حساب SCHNGN أو مفتاح API أو نقطة نهاية مستضافة أو اتصالًا بالشبكة.' },
    common: { recommended: 'موصى به', interfaceLabel: 'الواجهة' }
  }
} satisfies Record<Locale, Omit<AgentsUiCopy, 'intro'>>;

export function agentsUi(locale: Locale): AgentsUiCopy {
  const catalog = catalogs[locale];
  return { ...catalog, intro: catalog.hero.intro };
}

export function agentsUiCatalogLengths(): Record<Locale, number> {
  return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [
    locale,
    countStrings(agentsUi(locale))
  ])) as Record<Locale, number>;
}

function countStrings(value: unknown): number {
  if (typeof value === 'string') return 1;
  if (Array.isArray(value)) return value.reduce((total, item) => total + countStrings(item), 0);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce((total, item) => total + countStrings(item), 0);
  }
  return 0;
}
