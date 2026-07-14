<script lang="ts">
  import { page } from '$app/state';
  import CommandBlock from '$lib/design/CommandBlock.svelte';
  import SiteHeader from '$lib/design/SiteHeader.svelte';
  import {
    AGENT_SETUP_COMMANDS,
    agentsUi,
    type AgentsSectionId
  } from '$lib/i18n/agentsUi';
  import { localeFromPath, localizedPath, SUPPORTED_LOCALES } from '$lib/i18n';

  const sectionLinks: ReadonlyArray<{ id: string; key: AgentsSectionId }> = [
    { id: 'mcp', key: 'mcp' },
    { id: 'agent-skill', key: 'skill' },
    { id: 'cli', key: 'cli' },
    { id: 'rest-api', key: 'api' },
    { id: 'typescript', key: 'typescript' },
    { id: 'tool-reference', key: 'tools' },
    { id: 'privacy-boundary', key: 'privacy' }
  ];

  const toolReferences = [
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

  const typeScriptExample = `import { calculateUsage } from '@schngn/capability';

const result = calculateUsage({
  stays: [{ entryDate: '2026-01-01', exitDate: '2026-01-12' }],
  referenceDate: '2026-02-01'
});`;

  let locale = $derived(localeFromPath(page.url.pathname));
  let copy = $derived(agentsUi(locale));
  let canonicalUrl = $derived(`https://schngn.com${localizedPath('/agents', locale)}`);
</script>

<svelte:head>
  <title>{copy.meta.title}</title>
  <meta name="description" content={copy.meta.description} />
  <link rel="canonical" href={canonicalUrl} />
  {#each SUPPORTED_LOCALES as alternateLocale}
    <link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/agents', alternateLocale)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/agents" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={copy.meta.title} />
  <meta property="og:description" content={copy.meta.description} />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
</svelte:head>

<SiteHeader {locale} url={page.url} />

<main class="agents-page">
  <section class="agents-hero" aria-labelledby="agents-title">
    <div class="hero-copy">
      <p class="eyebrow">{copy.hero.eyebrow}</p>
      <h1 id="agents-title">{copy.hero.title}</h1>
      <p class="hero-intro">{copy.hero.intro}</p>
      <div class="hero-actions">
        <a class="primary-action" href="#mcp">{copy.hero.primary}</a>
        <a class="secondary-action" href="#interface-options">{copy.hero.secondary}</a>
      </div>
    </div>

    <aside class="setup-sheet" aria-labelledby="quick-start-title">
      <div class="sheet-heading">
        <div>
          <p class="sheet-kicker">MCP</p>
          <h2 id="quick-start-title">{copy.quickStart.title}</h2>
        </div>
        <span class="recommended">{copy.common.recommended}</span>
      </div>
      <p class="sheet-intro">{copy.quickStart.intro}</p>
      <ol class="setup-steps">
        {#each AGENT_SETUP_COMMANDS as setup, index}
          <li>
            <p><span>{index + 1}</span>{copy.quickStart.stepLabels[index]}</p>
            <CommandBlock
              command={setup.command}
              copyLabel={copy.quickStart.copy}
              copiedLabel={copy.quickStart.copied}
              copyFailedLabel={copy.quickStart.copyFailed}
            />
          </li>
        {/each}
      </ol>
      <p class="ready-note"><span aria-hidden="true">✓</span>{copy.quickStart.ready}</p>
    </aside>
  </section>

  <section class="evidence-strip" aria-label={copy.requirements.title}>
    <ul>
      {#each copy.evidence.items as item}
        <li><span aria-hidden="true"></span>{item}</li>
      {/each}
    </ul>
    <p>{copy.evidence.privacyNote}</p>
  </section>

  <div class="docs-layout">
    <aside class="contents">
      <nav aria-label={copy.contents.label}>
        <p>{copy.contents.label}</p>
        <ol>
          {#each sectionLinks as link, index}
            <li>
              <a href={`#${link.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{copy.contents.sections[link.key]}</a>
            </li>
          {/each}
        </ol>
      </nav>
    </aside>

    <article class="docs-content">
      <section class="docs-section featured-section" id="mcp" aria-labelledby="mcp-title">
        <div class="section-index">01</div>
        <div class="section-body">
          <div class="section-heading">
            <h2 id="mcp-title">{copy.contents.sections.mcp}</h2>
            <span class="recommended">{copy.common.recommended}</span>
          </div>
          <p>{copy.mcp.intro}</p>
          <div class="verification-row">
            <div>
              <h3>{copy.mcp.verifyTitle}</h3>
              <p>{copy.mcp.verifyBody}</p>
            </div>
            <CommandBlock
              command="codex mcp get schngn --json"
              copyLabel={copy.quickStart.copy}
              copiedLabel={copy.quickStart.copied}
              copyFailedLabel={copy.quickStart.copyFailed}
            />
          </div>
        </div>
      </section>

      <section class="docs-section" id="agent-skill" aria-labelledby="agent-skill-title">
        <div class="section-index">02</div>
        <div class="section-body">
          <h2 id="agent-skill-title">{copy.contents.sections.skill}</h2>
          <p>{copy.skill.intro}</p>
          <h3>{copy.skill.behaviorTitle}</h3>
          <ul class="behavior-list">
            {#each copy.skill.behaviors as behavior}
              <li>{behavior}</li>
            {/each}
          </ul>
        </div>
      </section>

      <div id="interface-options" class="interface-anchor" aria-hidden="true"></div>

      <section class="docs-section interface-section" id="cli" aria-labelledby="cli-title">
        <div class="section-index">03</div>
        <div class="section-body">
          <p class="interface-label">{copy.common.interfaceLabel}</p>
          <h2 id="cli-title">{copy.contents.sections.cli}</h2>
          <p>{copy.cli.intro}</p>
          <p class="muted-note">{copy.cli.inputNote}</p>
          <CommandBlock
            command="schngn usage --input request.json"
            copyLabel={copy.quickStart.copy}
            copiedLabel={copy.quickStart.copied}
            copyFailedLabel={copy.quickStart.copyFailed}
          />
        </div>
      </section>

      <section class="docs-section interface-section" id="rest-api" aria-labelledby="rest-api-title">
        <div class="section-index">04</div>
        <div class="section-body">
          <p class="interface-label">{copy.common.interfaceLabel}</p>
          <h2 id="rest-api-title">{copy.contents.sections.api}</h2>
          <p>{copy.api.intro}</p>
          <p class="muted-note" dir="ltr">{copy.api.docsNote}</p>
          <CommandBlock
            command="schngn-api"
            copyLabel={copy.quickStart.copy}
            copiedLabel={copy.quickStart.copied}
            copyFailedLabel={copy.quickStart.copyFailed}
          />
        </div>
      </section>

      <section class="docs-section interface-section" id="typescript" aria-labelledby="typescript-title">
        <div class="section-index">05</div>
        <div class="section-body">
          <p class="interface-label">{copy.common.interfaceLabel}</p>
          <h2 id="typescript-title">{copy.contents.sections.typescript}</h2>
          <p>{copy.typescript.intro}</p>
          <p class="muted-note" dir="ltr">{copy.typescript.packageNote}</p>
          <CommandBlock
            command="npm install @schngn/capability"
            copyLabel={copy.quickStart.copy}
            copiedLabel={copy.quickStart.copied}
            copyFailedLabel={copy.quickStart.copyFailed}
          />
          <pre dir="ltr"><code>{typeScriptExample}</code></pre>
        </div>
      </section>

      <section class="docs-section" id="tool-reference" aria-labelledby="tool-reference-title">
        <div class="section-index">06</div>
        <div class="section-body">
          <h2 id="tool-reference-title">{copy.contents.sections.tools}</h2>
          <p>{copy.tools.intro}</p>
          <div class="tool-ledger">
            {#each toolReferences as tool, index}
              <section class="tool-row" aria-labelledby={`tool-${index}`}>
                <div class="tool-name">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h3 id={`tool-${index}`} dir="ltr">{tool.name}</h3>
                </div>
                <dl>
                  <div>
                    <dt>{copy.tools.inputLabel}</dt>
                    <dd><code dir="ltr">{tool.input}</code></dd>
                  </div>
                  <div>
                    <dt>{copy.tools.purposeLabel}</dt>
                    <dd>{copy.tools.purposes[index]}</dd>
                  </div>
                </dl>
              </section>
            {/each}
          </div>
        </div>
      </section>

      <section class="docs-section" id="privacy-boundary" aria-labelledby="privacy-boundary-title">
        <div class="section-index">07</div>
        <div class="section-body">
          <h2 id="privacy-boundary-title">{copy.contents.sections.privacy}</h2>
          <p>{copy.privacy.intro}</p>
          <div class="privacy-split">
            <section>
              <p class="boundary-label">LOCAL</p>
              <h3>{copy.privacy.runtimeTitle}</h3>
              <p>{copy.privacy.runtimeBody}</p>
            </section>
            <section>
              <p class="boundary-label">HOST</p>
              <h3>{copy.privacy.hostTitle}</h3>
              <p>{copy.privacy.hostBody}</p>
            </section>
          </div>
        </div>
      </section>

      <section class="closing-notes">
        <div>
          <h2>{copy.requirements.title}</h2>
          <p>{copy.requirements.body}</p>
        </div>
        <div>
          <h2>{copy.limits.title}</h2>
          <p>{copy.limits.body}</p>
          <p class="advisory">{copy.limits.advisory}</p>
        </div>
      </section>
    </article>
  </div>
</main>

<style>
  :global(html) { scroll-behavior: smooth; }

  .agents-page {
    min-height: 100svh;
    padding: 0 clamp(16px, 4vw, 48px) 96px;
    overflow: clip;
  }

  .agents-hero,
  .evidence-strip,
  .docs-layout {
    width: min(1180px, 100%);
    margin-inline: auto;
  }

  .agents-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
    align-items: center;
    gap: clamp(48px, 7vw, 92px);
    padding: clamp(56px, 8vw, 92px) 0 48px;
  }

  .hero-copy { max-width: 650px; }

  .eyebrow,
  .sheet-kicker,
  .interface-label,
  .boundary-label {
    margin: 0;
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.78rem;
    font-weight: 760;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 10ch;
    margin: 15px 0 0;
    font-size: clamp(3.25rem, 7.2vw, 6.6rem);
    line-height: 0.92;
    letter-spacing: -0.055em;
    text-wrap: balance;
  }

  .hero-intro {
    max-width: 610px;
    margin: 25px 0 0;
    color: var(--muted);
    font-size: clamp(1.08rem, 2vw, 1.28rem);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 22px;
    margin-top: 30px;
  }

  .hero-actions a {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    padding: 10px 18px;
    border-radius: 3px;
    font-weight: 760;
    text-underline-offset: 4px;
  }

  .primary-action {
    border: 1px solid var(--safe);
    background: var(--safe);
    color: white;
    text-decoration: none;
  }

  .primary-action:hover { background: var(--ink); border-color: var(--ink); }
  .secondary-action:hover { color: var(--safe); }

  .setup-sheet {
    position: relative;
    padding: clamp(22px, 3vw, 32px);
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    box-shadow: 0 18px 50px color-mix(in srgb, var(--ink), transparent 91%);
  }

  .sheet-heading,
  .section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .sheet-heading h2 {
    margin: 7px 0 0;
    font-size: clamp(1.45rem, 2.5vw, 2rem);
    line-height: 1.15;
  }

  .recommended {
    display: inline-flex;
    min-height: 28px;
    align-items: center;
    padding: 4px 8px;
    border: 1px solid color-mix(in srgb, var(--safe), transparent 42%);
    border-radius: 3px;
    background: var(--safe-bg);
    color: var(--safe);
    font-size: 0.74rem;
    font-weight: 760;
    white-space: nowrap;
  }

  .sheet-intro {
    margin: 12px 0 0;
    color: var(--muted);
    line-height: 1.5;
  }

  .setup-steps {
    display: grid;
    gap: 20px;
    margin: 25px 0 0;
    padding: 0;
    list-style: none;
  }

  .setup-steps li > p {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 7px;
    color: var(--muted);
    font-size: 0.88rem;
    font-weight: 700;
  }

  .setup-steps li > p span {
    display: inline-flex;
    width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 50%;
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.7rem;
  }

  .ready-note {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 23px 0 0;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    color: var(--safe);
    font-size: 0.9rem;
    font-weight: 760;
  }

  .ready-note span {
    display: inline-flex;
    width: 23px;
    height: 23px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--safe-bg);
  }

  .evidence-strip {
    padding: 22px 0 26px;
    border-block: 1px solid var(--line);
  }

  .evidence-strip ul {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px 24px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .evidence-strip li {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--ink);
    font-size: 0.92rem;
    font-weight: 720;
  }

  .evidence-strip li span {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--safe);
  }

  .evidence-strip > p {
    max-width: 88ch;
    margin: 14px 0 0;
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .docs-layout {
    display: grid;
    grid-template-columns: minmax(180px, 0.24fr) minmax(0, 0.76fr);
    gap: clamp(44px, 8vw, 112px);
    padding-top: clamp(52px, 8vw, 88px);
  }

  .contents nav {
    position: sticky;
    top: 24px;
  }

  .contents nav > p {
    margin: 0 0 13px;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 760;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .contents ol {
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--line);
    list-style: none;
  }

  .contents a {
    display: grid;
    min-height: 46px;
    grid-template-columns: 28px 1fr;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font-size: 0.91rem;
    font-weight: 680;
    text-decoration: none;
  }

  .contents a span,
  .section-index {
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.72rem;
  }

  .contents a:hover { color: var(--safe); }

  .docs-content { min-width: 0; }

  .docs-section {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 15px;
    padding: clamp(38px, 6vw, 64px) 0;
    border-top: 1px solid var(--line);
    scroll-margin-top: 24px;
  }

  .docs-section:first-child { padding-top: 0; border-top: 0; }

  .section-index { padding-top: 8px; }

  .section-body > h2,
  .section-heading h2 {
    margin: 0;
    font-size: clamp(2rem, 4.5vw, 3.8rem);
    line-height: 1;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }

  .section-body > p,
  .verification-row p,
  .privacy-split p,
  .closing-notes p {
    max-width: 72ch;
    color: var(--muted);
    font-size: 1.03rem;
    line-height: 1.65;
    text-wrap: pretty;
  }

  .section-body > p { margin: 17px 0 0; }

  .section-body > h3 {
    margin: 28px 0 0;
    font-size: 1rem;
  }

  .verification-row {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(280px, 1.1fr);
    align-items: end;
    gap: 26px;
    margin-top: 28px;
    padding: 22px 0;
    border-block: 1px solid var(--line);
  }

  .verification-row h3 { margin: 0; font-size: 1.05rem; }
  .verification-row p { margin: 6px 0 0; font-size: 0.94rem; }

  .behavior-list {
    display: grid;
    gap: 0;
    margin: 12px 0 0;
    padding: 0;
    border-top: 1px solid var(--line);
    list-style: none;
  }

  .behavior-list li {
    position: relative;
    padding: 15px 0 15px 28px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    line-height: 1.55;
  }

  :global([dir='rtl']) .behavior-list li { padding-right: 28px; padding-left: 0; }

  .behavior-list li::before {
    position: absolute;
    inset-inline-start: 3px;
    content: '✓';
    color: var(--safe);
    font-weight: 800;
  }

  .interface-anchor { height: 0; scroll-margin-top: 24px; }
  .interface-label { margin-bottom: 9px; }

  .muted-note {
    padding: 10px 0;
    border-block: 1px solid color-mix(in srgb, var(--line), transparent 20%);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.86rem !important;
    overflow-wrap: anywhere;
  }

  .interface-section :global(.command-block) { margin-top: 22px; }

  pre {
    margin: 18px 0 0;
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--surface);
    color: var(--ink);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.82rem;
    line-height: 1.65;
    overflow-x: auto;
  }

  .tool-ledger {
    margin-top: 26px;
    border-bottom: 1px solid var(--line);
  }

  .tool-row {
    display: grid;
    grid-template-columns: minmax(220px, 0.42fr) minmax(0, 0.58fr);
    gap: 26px;
    padding: 22px 0;
    border-top: 1px solid var(--line);
  }

  .tool-name {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 8px;
  }

  .tool-name span,
  dt {
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.7rem;
    font-weight: 760;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .tool-name h3 {
    margin: 0;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.9rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  dl,
  dl div { margin: 0; }
  dl { display: grid; gap: 15px; }
  dd { margin: 4px 0 0; color: var(--muted); line-height: 1.5; }
  dd code { color: var(--ink); font-size: 0.82rem; overflow-wrap: anywhere; }

  .privacy-split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    margin-top: 28px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .privacy-split section { padding: clamp(20px, 3vw, 28px); }
  .privacy-split section + section { border-inline-start: 1px solid var(--line); }
  .privacy-split h3 { margin: 9px 0 0; font-size: 1.25rem; }
  .privacy-split p:last-child { margin: 11px 0 0; font-size: 0.94rem; }

  .closing-notes {
    display: grid;
    grid-template-columns: minmax(0, 0.38fr) minmax(0, 0.62fr);
    gap: clamp(28px, 6vw, 72px);
    padding: 48px 0 0 53px;
    border-top: 1px solid var(--line);
  }

  :global([dir='rtl']) .closing-notes { padding-right: 53px; padding-left: 0; }

  .closing-notes h2 { margin: 0; font-size: 1.2rem; }
  .closing-notes p { margin: 10px 0 0; font-size: 0.94rem; }
  .closing-notes .advisory { color: var(--ink); font-weight: 760; }

  @media (max-width: 960px) {
    .agents-hero { grid-template-columns: 1fr; gap: 38px; }
    .hero-copy { max-width: 760px; }
    h1 { max-width: 12ch; }
    .setup-sheet { width: min(680px, 100%); }
    .evidence-strip ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .docs-layout { grid-template-columns: 1fr; gap: 34px; }
    .contents nav { position: static; }
    .contents ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .contents li:nth-child(odd) { border-inline-end: 1px solid var(--line); }
    .contents a { padding-inline: 10px; }
  }

  @media (max-width: 700px) {
    .agents-page { padding-bottom: 68px; }
    .agents-hero { padding-top: 44px; }
    h1 { font-size: clamp(3rem, 15vw, 5.3rem); }
    .evidence-strip ul { grid-template-columns: 1fr; }
    .contents ol { grid-template-columns: 1fr; }
    .contents li:nth-child(odd) { border-inline-end: 0; }
    .docs-section { grid-template-columns: 28px minmax(0, 1fr); gap: 8px; }
    .verification-row,
    .tool-row,
    .privacy-split,
    .closing-notes { grid-template-columns: 1fr; }
    .privacy-split section + section { border-inline-start: 0; border-top: 1px solid var(--line); }
    .closing-notes { padding-inline: 36px 0; }
    :global([dir='rtl']) .closing-notes { padding-inline: 0 36px; }
  }
</style>
