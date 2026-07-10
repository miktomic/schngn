<script lang="ts">
  import { page } from '$app/state';
  import { SchngnLogo } from '$lib/design';
  import LanguageSelector from '$lib/i18n/LanguageSelector.svelte';
  import { createTranslator, localeFromPath, localizedPath, type Locale } from '$lib/i18n';

  const officialCalculatorUrl = 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en';
  let locale = $derived(localeFromPath(page.url.pathname));
  let t = $derived(createTranslator(locale));
  const english = createTranslator('en');
  let homePath = $derived(localizedPath('/', locale));
  let appPath = $derived(localizedPath('/app', locale));
  let accuracyPath = $derived(localizedPath('/accuracy', locale));
  let canonicalUrl = $derived(`https://schngn.com${accuracyPath}`);
  const cases = [
    {
      title: english('accuracy.caseInclusiveTitle'),
      detail: english('accuracy.caseInclusiveCopy')
    },
    {
      title: english('accuracy.caseWindowTitle'),
      detail: english('accuracy.caseWindowCopy')
    },
    {
      title: english('accuracy.caseOverlapTitle'),
      detail: english('accuracy.caseOverlapCopy')
    },
    {
      title: english('accuracy.caseExcludedTitle'),
      detail: english('accuracy.caseExcludedCopy')
    }
  ];
</script>

<svelte:head>
  <title>{t('accuracy.title')}</title>
  <meta
    name="description"
    content={t('accuracy.description')}
  />
  <link rel="canonical" href={canonicalUrl} />
  {#each ['en', 'fr', 'de', 'es', 'it', 'ru', 'tr', 'he', 'ar'] as alternateLocale}
    <link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/accuracy', alternateLocale as Locale)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/accuracy" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={t('accuracy.title')} />
  <meta property="og:description" content={t('accuracy.ogDescription')} />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="SCHNGN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:image:alt" content="SCHNGN" />
</svelte:head>

<main class="accuracy-page">
  <header class="topbar" aria-label={t('accuracy.header')}>
    <a class="brand" href={homePath} aria-label={t('common.home')}>
      <SchngnLogo alt="" />
    </a>
    <div class="topbar-actions">
      <LanguageSelector label={t('common.language')} {locale} url={page.url} />
      <a class="toplink" href={appPath}>{t('common.openCalculator')}</a>
    </div>
  </header>

  <section class="hero" aria-labelledby="accuracy-title">
    <p class="kicker">{t('accuracy.kicker')}</p>
    <h1 id="accuracy-title">{t('accuracy.hero')}</h1>
    <p class="lede">{t('accuracy.lede')}</p>
    <div class="actions">
      <a class="primary" href={officialCalculatorUrl} target="_blank" rel="noreferrer">{t('accuracy.officialCalculator')}</a>
      <a class="secondary" href={appPath}>{t('common.openCalculator')}</a>
    </div>
  </section>

  {#if locale !== 'en'}<p class="translation-note">{t('common.reviewedEnglishNotice')}</p>{/if}
  <section class="notice" aria-label={t('accuracy.scope')} lang="en" dir="ltr">
    <strong>SCHNGN is not certified, approved, or guaranteed by the EU</strong>
    <p>The European Commission calculator is linked for independent comparison. SCHNGN's checked-in suite currently verifies published rule semantics; it does not claim captured output parity with the official calculator. It is not legal advice and does not guarantee entry.</p>
  </section>

  <section class="case-grid" aria-label={t('accuracy.cases')} lang="en" dir="ltr">
    {#each cases as testCase}
      <article>
        <h2>{testCase.title}</h2>
        <p>{testCase.detail}</p>
      </article>
    {/each}
  </section>
</main>

<style>
  .accuracy-page {
    min-height: 100svh;
    padding: 20px clamp(16px, 4vw, 48px) 64px;
  }

  .topbar,
  .hero,
  .notice,
  .case-grid {
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

  .toplink,
  .secondary {
    border: 1px solid var(--ink);
    background: var(--surface);
    color: var(--ink);
  }

  .toplink {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 10px 14px;
    white-space: nowrap;
  }

  .hero {
    padding: clamp(44px, 9vw, 88px) 0 34px;
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
    font-size: clamp(2.7rem, 8vw, 5.3rem);
    line-height: 0.98;
    letter-spacing: -0.035em;
  }

  .lede {
    max-width: 680px;
    margin: 24px 0 0;
    color: var(--muted);
    font-size: clamp(1.08rem, 2vw, 1.25rem);
    line-height: 1.52;
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

  .notice,
  .case-grid article {
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .translation-note {
    max-width: 1120px;
    margin: 0 auto 12px;
    color: var(--muted);
    font-size: 0.84rem;
    line-height: 1.4;
  }

  .notice {
    border-radius: 16px;
    padding: 18px 20px;
  }

  .notice strong {
    display: block;
    color: var(--ink);
    font-size: 1.05rem;
  }

  .notice p {
    margin: 8px 0 0;
    color: var(--muted);
    line-height: 1.48;
  }

  .case-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .case-grid article {
    border-radius: 14px;
    padding: 18px;
  }

  .case-grid h2 {
    margin: 0;
    color: var(--ink);
    font-size: 1.1rem;
  }

  .case-grid p {
    margin: 8px 0 0;
    color: var(--muted);
    line-height: 1.5;
  }

  @media (max-width: 760px) {
    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .topbar-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .case-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
