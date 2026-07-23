<script lang="ts">
  import { legalFooterUi } from '$lib/i18n/legalFooterUi';
  import { localizedPath, stripLocalePrefix, type Locale } from '$lib/i18n';

  interface Props {
    locale: Locale;
    url: URL;
  }

  let { locale, url }: Props = $props();

  let copy = $derived(legalFooterUi(locale));
  let currentPath = $derived(stripLocalePrefix(url.pathname));
  let privacyPath = $derived(localizedPath('/privacy', locale));
  let termsPath = $derived(localizedPath('/terms', locale));
  let contactPath = $derived(localizedPath('/contact', locale));
  let agentsPath = $derived(localizedPath('/agents', locale));
</script>

<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="footer-main">
      <p class="copyright">{copy.copyright}</p>

      <nav aria-label={`${copy.resources}. ${copy.navigation}`}>
        <a href={agentsPath} aria-current={currentPath === '/agents' ? 'page' : undefined}>{copy.agents}</a>
        <a href={contactPath} aria-current={currentPath === '/contact' ? 'page' : undefined}>{copy.contact}</a>
        <a href={privacyPath} aria-current={currentPath === '/privacy' ? 'page' : undefined}>{copy.privacy}</a>
        <a href={termsPath} aria-current={currentPath === '/terms' ? 'page' : undefined}>{copy.terms}</a>
      </nav>
    </div>

    <p class="footer-disclaimer">{copy.disclaimer}</p>
  </div>
</footer>

<style>
  .site-footer {
    width: 100%;
    background: var(--ink);
    color: var(--surface);
  }

  .site-footer-inner {
    width: min(1290px, calc(100% - 48px));
    margin: 0 auto;
    padding-block: 40px 32px;
  }

  .footer-main,
  nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .footer-main {
    gap: 16px clamp(36px, 5vw, 72px);
  }

  .copyright {
    flex: 0 0 auto;
    margin: 0;
    color: color-mix(in srgb, var(--surface), transparent 23%);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
  }

  nav {
    gap: 4px clamp(24px, 3.4vw, 52px);
  }

  nav a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    color: color-mix(in srgb, var(--surface), transparent 19%);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-decoration-thickness: 1px;
    text-underline-offset: 5px;
    transition: color 160ms ease-out, text-decoration-color 160ms ease-out;
  }

  nav a:hover,
  nav a[aria-current='page'] {
    color: var(--surface);
    text-decoration-color: currentColor;
  }

  nav a:focus-visible {
    outline-color: var(--surface);
    outline-offset: 3px;
  }

  .footer-disclaimer {
    max-width: 72ch;
    margin: 14px 0 0;
    color: color-mix(in srgb, var(--surface), transparent 35%);
    font-size: 0.86rem;
    line-height: 1.5;
    text-wrap: pretty;
  }

  @media (max-width: 820px) {
    .site-footer-inner {
      padding-block: 32px 28px;
    }

    .footer-main {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }
  }

  @media (max-width: 520px) {
    .site-footer-inner {
      width: calc(100% - 32px);
      padding-block: 28px 24px;
    }

    nav {
      display: grid;
      width: 100%;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 16px;
    }

    .copyright {
      white-space: normal;
    }

    nav a {
      font-size: 0.96rem;
    }

    .footer-disclaimer {
      margin-top: 16px;
    }
  }
</style>
