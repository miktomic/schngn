<script lang="ts">
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';
  import ContactForm from '$lib/design/ContactForm.svelte';
  import SiteHeader from '$lib/design/SiteHeader.svelte';
  import { localeFromPath, localizedPath, SUPPORTED_LOCALES } from '$lib/i18n';
  import { contactUi } from '$lib/i18n/contactUi';

  let locale = $derived(localeFromPath(page.url.pathname));
  let copy = $derived(contactUi(locale));
  let canonicalUrl = $derived(`https://schngn.com${localizedPath('/contact', locale)}`);
</script>

<svelte:head>
  <title>{copy.metaTitle} | SCHNGN</title>
  <meta name="description" content={copy.metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  {#each SUPPORTED_LOCALES as alternateLocale}<link rel="alternate" hreflang={alternateLocale} href={`https://schngn.com${localizedPath('/contact', alternateLocale)}`} />{/each}
  <link rel="alternate" hreflang="x-default" href="https://schngn.com/contact" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={`${copy.metaTitle} | SCHNGN`} />
  <meta property="og:description" content={copy.metaDescription} />
</svelte:head>

<SiteHeader {locale} url={page.url} current="contact" />
<main class="resource-page">
  <article class="contact-content" aria-labelledby="contact-title">
    <header><p>{copy.eyebrow}</p><h1 id="contact-title">{copy.title}</h1><div class="rule" aria-hidden="true"></div><p>{copy.intro}</p></header>
    <section class="form-panel" aria-label={copy.title}><ContactForm {locale} siteKey={env.PUBLIC_TURNSTILE_SITE_KEY ?? ''} /></section>
  </article>
</main>

<style>
  .resource-page { min-height: 100svh; padding: 0 clamp(16px, 4vw, 48px) 72px; }
  .contact-content { display: grid; width: min(1060px, 100%); grid-template-columns: minmax(240px, 0.72fr) minmax(0, 1.28fr); gap: clamp(36px, 7vw, 84px); align-items: start; margin: 0 auto; padding: clamp(52px, 8vw, 92px) 0 0; }
  header { position: sticky; top: 32px; }
  header > p:first-child { margin: 0 0 14px; color: var(--safe); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.84rem; font-weight: 720; }
  h1 { max-width: 10ch; margin: 0; font-size: clamp(2.8rem, 6vw, 5rem); line-height: 0.97; letter-spacing: -0.035em; text-wrap: balance; }
  .rule { width: 54px; height: 3px; margin: 26px 0; background: var(--safe); }
  header > p:last-child { max-width: 38ch; margin: 0; color: var(--muted); font-size: 1.08rem; line-height: 1.6; text-wrap: pretty; }
  .form-panel { border-block: 1px solid var(--line); padding: clamp(24px, 4vw, 38px) 0; }
  @media (max-width: 760px) { .contact-content { grid-template-columns: 1fr; gap: 30px; padding-top: 42px; } header { position: static; } h1 { max-width: none; } }
</style>
