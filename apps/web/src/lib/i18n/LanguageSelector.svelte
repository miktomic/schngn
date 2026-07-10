<script lang="ts">
  import { browser } from '$app/environment';
  import { LOCALE_COOKIE, LOCALE_LABELS, SUPPORTED_LOCALES, localizedPath, type Locale } from './locales';

  interface Props {
    label: string;
    locale: Locale;
    url: URL;
  }

  let { label, locale, url }: Props = $props();

  function rememberLocale(nextLocale: Locale): void {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  }

  function localeHref(nextLocale: Locale): string {
    const pathname = localizedPath(url.pathname, nextLocale);
    return browser ? `${pathname}${url.search}${url.hash}` : pathname;
  }
</script>

<div class="language-selector">
  <span>{label}</span>
  <ul aria-label={label}>
    {#each SUPPORTED_LOCALES as option}
      <li>
        <a
          href={localeHref(option)}
          lang={option}
          hreflang={option}
          aria-current={option === locale ? 'page' : undefined}
          onclick={() => rememberLocale(option)}
        >{LOCALE_LABELS[option]}</a>
      </li>
    {/each}
  </ul>
</div>

<style>
  .language-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .language-selector > span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  ul {
    display: flex;
    gap: 3px;
    margin: 0;
    padding: 3px;
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    list-style: none;
    scrollbar-width: thin;
  }

  a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    border-radius: 7px;
    color: var(--muted);
    padding: 6px 9px;
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }

  a:hover { color: var(--ink); }
  a[aria-current='page'] { background: var(--ink); color: var(--surface); }
  a:focus-visible { outline: 3px solid var(--safe); outline-offset: 2px; }

  @media (max-width: 680px) {
    .language-selector { width: 100%; }
    ul { width: 100%; }
  }
</style>
