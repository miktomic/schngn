<script lang="ts">
  import { page } from '$app/state';
  import { SchngnLogo } from '$lib/design';
  import LanguageSelector from '$lib/i18n/LanguageSelector.svelte';
  import { createTranslator, localeFromPath, localizedPath, type Locale } from '$lib/i18n';

  let locale = $derived(localeFromPath(page.url.pathname));
  let t = $derived(createTranslator(locale));
  const english = createTranslator('en');
  let homePath = $derived(localizedPath('/', locale));
  let appPath = $derived(`${localizedPath('/app', locale)}?market=uk`);
  let accuracyPath = $derived(localizedPath('/accuracy', locale));
  let canonicalUrl = $derived(`https://schngn.com${homePath}`);
</script>

<svelte:head>
  <title>{t('landing.title')}</title>
  <meta
    name="description"
    content={t('landing.description')}
  />
  <link rel="canonical" href={canonicalUrl} />
  {#each ['en', 'fr', 'de', 'es', 'it', 'ru', 'tr', 'he', 'ar'] as alternateLocale}
    <link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/', alternateLocale as Locale)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={t('landing.title')} />
  <meta
    property="og:description"
    content={t('landing.ogDescription')}
  />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="SCHNGN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={t('landing.title')} />
  <meta
    name="twitter:description"
    content={t('landing.twitterDescription')}
  />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:image:alt" content="SCHNGN" />
</svelte:head>

<main class="landing">
  <header class="topbar" aria-label={t('landing.header')}>
    <a class="brand" href={homePath} aria-label={t('common.home')}>
      <SchngnLogo alt="" motto />
    </a>
    <div class="topbar-actions">
      <LanguageSelector label={t('common.language')} {locale} url={page.url} />
      <a class="toplink" href={appPath}>{t('common.openCalculator')}</a>
    </div>
  </header>

  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="kicker">{t('landing.kicker')}</p>
      <h1 id="hero-title">{t('landing.hero')}</h1>
      <p class="lede">
        {t('landing.lede')}
      </p>
      <div class="actions" aria-label={t('landing.actions')}>
        <a class="primary" href={appPath}>{t('landing.primaryAction')}</a>
        <a class="secondary" href={appPath}>{t('common.openCalculator')}</a>
      </div>
      <p class="trust-line" lang="en" dir="ltr">{english('landing.trust')}</p>
      {#if locale !== 'en'}<p class="translation-note">{t('common.reviewedEnglishNotice')}</p>{/if}
      <a class="evidence-link" href={accuracyPath}>{t('landing.evidence')}</a>
    </div>

    <aside class="answer-card" aria-label={t('landing.exampleAnswer')}>
      <div class="mini-header">
        <span class="mini-brand">SCHNGN</span>
        <span class="privacy">{t('landing.localPrivate')}</span>
      </div>
      <span class="chip safe">{t('landing.franceFits')}</span>
      <strong>{t('landing.safeBuffer')}</strong>
      <dl>
        <div>
          <dt>{t('landing.mustExit')}</dt>
          <dd>Oct 13</dd>
        </div>
        <div>
          <dt>{t('landing.daysUsed')}</dt>
          <dd>75 / 90</dd>
        </div>
      </dl>
      <div class="timeline" aria-hidden="true">
        <span class="past"></span>
        <span class="booked"></span>
        <span class="whatif"></span>
        <span class="safe-segment"></span>
      </div>
      <p>{t('landing.exampleCounted')}</p>
    </aside>
  </section>

  <section class="audience" aria-label={t('landing.audience')}>
    <div>
      <h2>{t('landing.audienceTitle')}</h2>
      <p>
        {t('landing.audienceCopy')}
      </p>
    </div>
    <ul aria-label={t('landing.benefits')}>
      <li>
        <strong>{t('landing.checkTitle')}</strong>
        <span>{t('landing.checkCopy')}</span>
      </li>
      <li>
        <strong>{t('landing.returnTitle')}</strong>
        <span>{t('landing.returnCopy')}</span>
      </li>
      <li>
        <strong>{t('landing.privateTitle')}</strong>
        <span>{t('landing.privateCopy')}</span>
      </li>
    </ul>
  </section>
</main>

<style>
  .landing {
    min-height: 100svh;
    padding: 20px clamp(16px, 4vw, 48px) 64px;
  }

  .topbar,
  .hero,
  .audience {
    max-width: 1120px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
    gap: 16px;
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    min-width: 0;
  }

  .brand,
  .toplink,
  .actions a {
    text-decoration: none;
  }

  .brand {
    display: inline-flex;
    align-items: center;
  }

  .toplink,
  .primary,
  .secondary {
    border-radius: 10px;
    font-weight: 750;
  }

  .toplink {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    padding: 10px 14px;
    white-space: nowrap;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
    gap: clamp(28px, 6vw, 72px);
    align-items: center;
    padding: clamp(44px, 9vw, 88px) 0 48px;
  }

  .kicker {
    margin: 0 0 14px;
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  h1 {
    max-width: 760px;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.65rem, 7.4vw, 5.1rem);
    line-height: 0.98;
    letter-spacing: -0.035em;
  }

  .lede {
    max-width: 600px;
    margin: 24px 0 0;
    color: var(--muted);
    font-size: clamp(1.08rem, 2vw, 1.28rem);
    line-height: 1.5;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 13px 18px;
  }

  .primary {
    background: var(--ink);
    color: var(--surface);
  }

  .secondary {
    border: 1px solid var(--ink);
    background: var(--surface);
    color: var(--ink);
  }

  .trust-line {
    max-width: 520px;
    margin: 18px 0 0;
    color: var(--muted);
    font-size: 0.96rem;
    line-height: 1.45;
  }

  .translation-note {
    max-width: 520px;
    margin: 8px 0 0;
    color: var(--muted);
    font-size: 0.84rem;
    line-height: 1.4;
  }

  .evidence-link {
    display: inline-flex;
    margin-top: 10px;
    color: var(--safe);
    font-weight: 750;
    text-decoration: none;
  }

  .answer-card,
  .audience {
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .answer-card {
    border-radius: 18px;
    padding: 20px;
  }

  .mini-header,
  dl {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .mini-brand {
    font-weight: 850;
    letter-spacing: 0.06em;
  }

  .privacy,
  .chip {
    border-radius: 6px;
    padding: 6px 9px;
    font-size: 0.82rem;
    font-weight: 750;
  }

  .privacy,
  .safe {
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 35%);
    background: var(--safe-bg);
    color: var(--safe);
  }

  .chip {
    display: inline-flex;
    margin-top: 28px;
  }

  .answer-card strong {
    display: block;
    margin-top: 14px;
    color: var(--safe);
    font-size: clamp(2.3rem, 8vw, 3.6rem);
    line-height: 0.96;
    letter-spacing: -0.03em;
  }

  dl {
    margin: 20px 0 0;
  }

  dl div {
    flex: 1;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
    background: var(--paper);
  }

  dt {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 750;
  }

  dd {
    margin: 5px 0 0;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .timeline {
    display: grid;
    grid-template-columns: 0.45fr 0.75fr 0.35fr 0.28fr;
    gap: 3px;
    height: 26px;
    margin-top: 18px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--paper);
    padding: 3px;
  }

  .timeline span {
    border-radius: 4px;
  }

  .past { background: var(--past); }
  .booked { background: var(--booked); }
  .whatif { background: var(--whatif); }
  .safe-segment { background: var(--safe); }

  .answer-card p {
    margin: 16px 0 0;
    color: var(--muted);
    line-height: 1.45;
  }

  .audience {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: clamp(20px, 4vw, 52px);
    align-items: start;
    border-radius: 18px;
    padding: clamp(22px, 5vw, 40px);
  }

  .audience h2 {
    max-width: 420px;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .audience p {
    max-width: 520px;
    margin: 18px 0 0;
    color: var(--muted);
    line-height: 1.55;
  }

  .audience ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .audience li {
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    padding: 16px;
  }

  .audience strong,
  .audience span {
    display: block;
  }

  .audience strong {
    color: var(--ink);
  }

  .audience span {
    margin-top: 5px;
    color: var(--muted);
    line-height: 1.45;
  }

  @media (max-width: 840px) {
    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .topbar-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .hero,
    .audience {
      grid-template-columns: 1fr;
    }

    .hero {
      padding-top: 34px;
    }
  }
</style>
