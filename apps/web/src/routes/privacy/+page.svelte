<script lang="ts">
  import { page } from '$app/state';
  import { LegalDocument, SiteHeader } from '$lib/design';
  import { localeFromPath, localizedPath, SUPPORTED_LOCALES } from '$lib/i18n';
  import { privacyUi } from '$lib/i18n/legalUi';

  let locale = $derived(localeFromPath(page.url.pathname));
  let copy = $derived(privacyUi(locale));
  let canonicalUrl = $derived(`https://schngn.com${localizedPath('/privacy', locale)}`);
</script>

<svelte:head>
  <title>{copy.title} | SCHNGN</title>
  <meta name="description" content={copy.metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  {#each SUPPORTED_LOCALES as alternateLocale}
    <link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/privacy', alternateLocale)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/privacy" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={`${copy.title} | SCHNGN`} />
  <meta property="og:description" content={copy.metaDescription} />
  <meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="SCHNGN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${copy.title} | SCHNGN`} />
  <meta name="twitter:description" content={copy.metaDescription} />
  <meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />
  <meta name="twitter:image:alt" content="SCHNGN" />
</svelte:head>

<SiteHeader {locale} url={page.url} />
<LegalDocument {locale} {copy} />
