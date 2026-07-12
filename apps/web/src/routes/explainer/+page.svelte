<script lang="ts">
  import { page } from '$app/state';
  import ExplainerWalkthrough from '$lib/design/ExplainerWalkthrough.svelte';
  import ResourceTopbar from '$lib/design/ResourceTopbar.svelte';
  import SchengenCountryGuide from '$lib/design/SchengenCountryGuide.svelte';
  import { createTranslator, localeFromPath, localizedPath, SUPPORTED_LOCALES } from '$lib/i18n';
  import { explainerUi } from '$lib/i18n/explainerUi';
  import { rulesUi } from '$lib/i18n/rulesUi';
  import { localizedOfficialSourceLinks } from '$lib/legal/legalCopy';

  let locale = $derived(localeFromPath(page.url.pathname));
  let t = $derived(createTranslator(locale));
  let copy = $derived(explainerUi(locale));
  let ruleCopy = $derived(rulesUi(locale));
  let officialSourceLinks = $derived(localizedOfficialSourceLinks(locale));
  let appPath = $derived(localizedPath('/app', locale));
  let canonicalUrl = $derived(`https://schngn.com${localizedPath('/explainer', locale)}`);
</script>

<svelte:head>
  <title>{copy.heroTitle} | SCHNGN</title>
  <meta name="description" content={copy.heroIntro} />
  <link rel="canonical" href={canonicalUrl} />
  {#each SUPPORTED_LOCALES as alternateLocale}
    <link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/explainer', alternateLocale)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/explainer" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={`${copy.heroTitle} | SCHNGN`} />
  <meta property="og:description" content={copy.heroIntro} />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
</svelte:head>

<main class="resource-page">
  <ResourceTopbar {locale} url={page.url} current="explainer" />

  <article class="resource-content" id="explainer" aria-labelledby="explainer-title">
    <header class="resource-hero">
      <p class="eyebrow">90 / 180</p>
      <h1 id="explainer-title">{copy.heroTitle}</h1>
      <p>{copy.heroIntro}</p>
    </header>

    <ExplainerWalkthrough {locale} />

    <SchengenCountryGuide {locale} />

    <aside class="scope" aria-labelledby="scope-title">
      <h2 id="scope-title">{ruleCopy.scopeTitle}</h2>
      <p>{ruleCopy.scopeCopy}</p>
      <div class="official-links">
        {#each officialSourceLinks as source}
          <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
        {/each}
      </div>
    </aside>

    <section class="calculator-cta" aria-labelledby="calculator-cta-title">
      <div>
        <h2 id="calculator-cta-title">{copy.tryTitle}</h2>
        <p>{copy.tryBody}</p>
      </div>
      <a href={appPath}>{t('common.openCalculator')}</a>
    </section>
  </article>
</main>

<style>
  .resource-page { min-height: 100svh; padding: 0 clamp(16px, 4vw, 48px) 72px; }
  .resource-content { width: min(1180px, 100%); margin: 0 auto; }
  .resource-hero { padding: clamp(52px, 8vw, 88px) 0 36px; }
  .eyebrow { margin: 0 0 14px; color: var(--safe); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.82rem; font-weight: 760; letter-spacing: 0.06em; }
  h1 { max-width: 850px; margin: 0; font-size: clamp(3rem, 8vw, 6rem); line-height: 0.95; letter-spacing: -0.045em; text-wrap: balance; }
  .resource-hero > p:last-child { max-width: 760px; margin: 26px 0 0; color: var(--muted); font-size: clamp(1.08rem, 2vw, 1.3rem); line-height: 1.55; text-wrap: pretty; }
  .scope { margin-top: 40px; border: 1px solid var(--whatif); border-radius: 16px; background: var(--whatif-bg); padding: clamp(22px, 4vw, 36px); }
  .scope h2 { margin: 0; font-size: clamp(1.4rem, 2.5vw, 2rem); }
  .scope p { max-width: 800px; margin: 10px 0 20px; color: var(--muted); font-size: 1.05rem; line-height: 1.55; }
  .official-links { display: flex; flex-wrap: wrap; gap: 10px; }
  .official-links a { display: inline-flex; min-height: 42px; align-items: center; border: 1px solid var(--control-line); border-radius: 9px; background: var(--surface); padding: 9px 13px; color: var(--ink); font-weight: 720; text-decoration: none; }
  .official-links a:hover { border-color: var(--safe); color: var(--safe); }
  .calculator-cta { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 32px; border-block: 1px solid var(--line); padding: 32px 0; }
  .calculator-cta h2 { margin: 0; font-size: clamp(1.5rem, 3vw, 2.25rem); line-height: 1.1; text-wrap: balance; }
  .calculator-cta p { max-width: 680px; margin: 10px 0 0; color: var(--muted); font-size: 1.05rem; line-height: 1.55; text-wrap: pretty; }
  .calculator-cta a { display: inline-flex; min-height: 46px; flex: 0 0 auto; align-items: center; justify-content: center; border-radius: 9px; background: var(--ink); color: var(--surface); padding: 12px 18px; font-weight: 760; text-decoration: none; }
  @media (max-width: 640px) {
    .resource-hero { padding-top: 44px; }
    .calculator-cta { align-items: stretch; flex-direction: column; }
    .calculator-cta a { width: 100%; }
  }
</style>
