<script lang="ts">
  import { page } from '$app/state';
  import SiteHeader from '$lib/design/SiteHeader.svelte';
  import SchengenCountryGuide from '$lib/design/SchengenCountryGuide.svelte';
  import { localeFromPath, localizedPath, SUPPORTED_LOCALES } from '$lib/i18n';
  import { FAQ_SOURCE_URLS, faqUi } from '$lib/i18n/faqUi';

  let locale = $derived(localeFromPath(page.url.pathname));
  let copy = $derived(faqUi(locale));
  let canonicalUrl = $derived(`https://schngn.com${localizedPath('/faq', locale)}`);
</script>

<svelte:head>
  <title>{copy.title} | SCHNGN</title>
  <meta name="description" content={copy.intro} />
  <link rel="canonical" href={canonicalUrl} />
  {#each SUPPORTED_LOCALES as alternateLocale}
    <link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/faq', alternateLocale)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/faq" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={`${copy.title} | SCHNGN`} />
  <meta property="og:description" content={copy.intro} />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
</svelte:head>

<SiteHeader {locale} url={page.url} current="faq" />
<main class="resource-page">

  <article class="resource-content" id="faq" aria-labelledby="faq-title">
    <header class="resource-hero">
      <div>
        <p class="eyebrow">90 / 180</p>
        <h1 id="faq-title">{copy.title}</h1>
        <p class="lede">{copy.intro}</p>
      </div>
      <p class="reviewed">{copy.reviewedCopy}</p>
    </header>

    <SchengenCountryGuide {locale} />

    <div class="faq-groups">
      {#each copy.groups as group}
        <section class="faq-group" aria-labelledby={`faq-group-${group.id}`}>
          <h2 id={`faq-group-${group.id}`}>{group.title}</h2>
          <div class="faq-list">
            {#each group.items as item}
              <details class="faq-item" open={group.id === 'rule' && item.id === 'meaning'}>
                <summary>{item.question}</summary>
                <div class="faq-answer">
                  <p>{item.answer}</p>
                  <div class="answer-meta">
                    {#if item.source}
                      <a href={FAQ_SOURCE_URLS[item.source]} target="_blank" rel="noreferrer">
                        {copy.officialSource}: {copy.sourceNames[item.source]}
                      </a>
                    {/if}
                  </div>
                </div>
              </details>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </article>
</main>

<style>
  .resource-page { min-height: 100svh; padding: 0 clamp(16px, 4vw, 48px) 72px; }
  .resource-content { width: min(1120px, 100%); margin: 0 auto; }
  .resource-hero { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr); align-items: end; gap: 48px; padding: clamp(56px, 9vw, 104px) 0 44px; }
  .eyebrow { margin: 0 0 14px; color: var(--safe); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.82rem; font-weight: 760; letter-spacing: 0.06em; }
  h1 { margin: 0; font-size: clamp(3rem, 8vw, 6rem); line-height: 0.95; letter-spacing: -0.045em; text-wrap: balance; }
  .lede { max-width: 700px; margin: 24px 0 0; color: var(--muted); font-size: clamp(1.08rem, 2vw, 1.25rem); line-height: 1.55; text-wrap: pretty; }
  .reviewed { margin: 0; padding: 16px 0; border-block: 1px solid var(--line); color: var(--muted); font-size: 0.93rem; line-height: 1.5; }
  .faq-groups { border-bottom: 1px solid var(--line); }
  .faq-group { display: grid; grid-template-columns: minmax(190px, 0.32fr) minmax(0, 1fr); gap: clamp(24px, 5vw, 64px); padding: 34px 0; border-top: 1px solid var(--line); }
  .faq-group > h2 { max-width: 18ch; margin: 4px 0 0; font-size: clamp(1.18rem, 2.2vw, 1.55rem); line-height: 1.25; text-wrap: balance; }
  .faq-list { min-width: 0; }
  .faq-item { border-top: 1px solid color-mix(in srgb, var(--line), transparent 28%); }
  .faq-item:first-child { border-top: 0; }
  .faq-item summary { position: relative; display: flex; min-height: 64px; align-items: center; padding: 14px 48px 14px 0; color: var(--ink); font-size: clamp(1.03rem, 1.7vw, 1.2rem); font-weight: 760; line-height: 1.35; cursor: pointer; list-style: none; text-wrap: pretty; }
  :global([dir='rtl']) .faq-item summary { padding-right: 0; padding-left: 48px; }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::after { position: absolute; inset-inline-end: 4px; content: '+'; color: var(--safe); font-size: 1.5rem; font-weight: 500; line-height: 1; }
  .faq-item[open] summary::after { content: '−'; }
  .faq-item summary:hover { color: var(--safe); }
  .faq-answer { max-width: 76ch; padding: 0 48px 24px 0; }
  :global([dir='rtl']) .faq-answer { padding-right: 0; padding-left: 48px; }
  .faq-answer > p { margin: 0; color: var(--muted); font-size: 1.03rem; line-height: 1.65; text-wrap: pretty; }
  .answer-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin-top: 14px; font-size: 0.88rem; }
  .answer-meta a { color: var(--safe); font-weight: 720; overflow-wrap: anywhere; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  @media (max-width: 760px) {
    .resource-hero, .faq-group { grid-template-columns: 1fr; }
    .resource-hero { gap: 24px; padding-top: 44px; }
    .faq-group { gap: 14px; padding: 28px 0; }
    .faq-group > h2 { max-width: none; }
    .faq-item summary { min-height: 58px; }
  }
</style>
