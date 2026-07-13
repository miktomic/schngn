<script lang="ts">
  import { page } from '$app/state';
  import { SiteHeader } from '$lib/design';
  import { createTranslator, localeFromPath, localizedPath, type Locale } from '$lib/i18n';

  const officialCalculatorUrl = 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en';
  let locale = $derived(localeFromPath(page.url.pathname));
  let t = $derived(createTranslator(locale));

  let appPath = $derived(localizedPath('/app', locale));
  let accuracyPath = $derived(localizedPath('/accuracy', locale));
  let canonicalUrl = $derived(`https://schngn.com${accuracyPath}`);
  let cases = $derived([
    {
      title: t('accuracy.caseInclusiveTitle'),
      detail: t('accuracy.caseInclusiveCopy')
    },
    {
      title: t('accuracy.caseWindowTitle'),
      detail: t('accuracy.caseWindowCopy')
    },
    {
      title: t('accuracy.caseOverlapTitle'),
      detail: t('accuracy.caseOverlapCopy')
    },
    {
      title: t('accuracy.caseExcludedTitle'),
      detail: t('accuracy.caseExcludedCopy')
    }
  ]);
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

<SiteHeader {locale} url={page.url} />
<main class="accuracy-page">
  <section class="hero" aria-labelledby="accuracy-title">
    <p class="kicker">{t('accuracy.kicker')}</p>
    <h1 id="accuracy-title">{t('accuracy.hero')}</h1>
    <p class="lede">{t('accuracy.lede')}</p>
    <div class="actions">
      <a class="primary" href={officialCalculatorUrl} target="_blank" rel="noreferrer">{t('accuracy.officialCalculator')}</a>
      <a class="secondary" href={appPath}>{t('common.openCalculator')}</a>
    </div>
  </section>

  <section class="notice" aria-label={t('accuracy.scope')}>
    <strong>{t('accuracy.noticeTitle')}</strong>
    <p>{t('accuracy.noticeCopy')}</p>
  </section>

  <section class="case-grid" aria-label={t('accuracy.cases')}>
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
    padding: 0 clamp(16px, 4vw, 48px) 64px;
  }

  .hero,
  .notice,
  .case-grid {
    max-width: 1120px;
    margin: 0 auto;
  }

  .actions a {
    text-decoration: none;
  }

  .primary,
  .secondary {
    border-radius: 10px;
    font-weight: 750;
  }

  .secondary {
    border: 1px solid var(--ink);
    background: var(--surface);
    color: var(--ink);
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
    .case-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
