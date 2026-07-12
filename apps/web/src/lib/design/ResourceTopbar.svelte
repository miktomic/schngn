<script lang="ts">
  import SchngnLogo from './SchngnLogo.svelte';
  import LanguageSelector from '$lib/i18n/LanguageSelector.svelte';
  import { createTranslator, localizedPath, type Locale } from '$lib/i18n';
  import { resourceTopbarUi } from '$lib/i18n/resourceTopbarUi';
  import { contactUi } from '$lib/i18n/contactUi';
  import { createSinglePageUiTranslator } from '$lib/i18n/singlePageUi';

  interface Props {
    locale: Locale;
    url: URL;
    current: 'explainer' | 'faq' | 'contact';
  }

  let { locale, url, current }: Props = $props();
  let t = $derived(createTranslator(locale));
  let singlePage = $derived(createSinglePageUiTranslator(locale));
  let resourceCopy = $derived(resourceTopbarUi(locale));
  let contactCopy = $derived(contactUi(locale));
  let homePath = $derived(localizedPath('/', locale));
  let appPath = $derived(localizedPath('/app', locale));
  let explainerPath = $derived(localizedPath('/explainer', locale));
  let faqPath = $derived(localizedPath('/faq', locale));
  let contactPath = $derived(localizedPath('/contact', locale));
</script>

<header class="resource-topbar">
  <a class="brand" href={homePath} aria-label={t('common.home')}>
    <SchngnLogo alt="" motto />
  </a>

  <div class="resource-actions">
    <nav class="resource-nav" aria-label={t('common.home')}>
      <a href={appPath}>{resourceCopy.dayCalculator}</a>
      <a href={explainerPath} aria-current={current === 'explainer' ? 'page' : undefined}>{singlePage('explainer')}</a>
      <a href={faqPath} aria-current={current === 'faq' ? 'page' : undefined}>{singlePage('faq')}</a>
      <a href={contactPath} aria-current={current === 'contact' ? 'page' : undefined}>{contactCopy.nav}</a>
    </nav>
    <LanguageSelector label={t('common.language')} {locale} {url} />
  </div>
</header>

<style>
  .resource-topbar {
    display: flex;
    width: min(1180px, 100%);
    min-height: 72px;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin: 0 auto;
    padding: 12px 0;
    border-bottom: 1px solid var(--line);
  }

  .brand {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    text-decoration: none;
  }

  .resource-actions,
  .resource-nav {
    display: flex;
    min-width: 0;
    align-items: center;
  }

  .resource-actions { gap: 18px; }
  .resource-nav { gap: 4px; }

  .resource-nav a {
    display: inline-flex;
    min-height: 42px;
    align-items: center;
    border-radius: 9px;
    padding: 8px 11px;
    color: var(--muted);
    font-weight: 720;
    line-height: 1.1;
    text-decoration: none;
    white-space: nowrap;
  }

  .resource-nav a:hover { color: var(--ink); }
  .resource-nav a[aria-current='page'] { background: var(--ink); color: var(--surface); }

  @media (max-width: 780px) {
    .resource-topbar { align-items: flex-start; flex-direction: column; gap: 12px; }
    .resource-actions { width: 100%; align-items: flex-start; flex-direction: column-reverse; gap: 10px; }
    .resource-nav { width: 100%; overflow-x: auto; padding-bottom: 2px; }
    .resource-nav a { flex: 0 0 auto; }
  }
</style>
