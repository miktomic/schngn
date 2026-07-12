<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { LOCALE_COOKIE, LOCALE_LABELS, SUPPORTED_LOCALES, intlLocale, localeDirection, localizedPath, type Locale } from './locales';

  interface Props {
    label: string;
    locale: Locale;
    url: URL;
  }

  let { label, locale, url }: Props = $props();
  let ready = $state(false);

  onMount(() => {
    ready = true;
  });

  function rememberLocale(nextLocale: Locale): void {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  }

  function localeHref(nextLocale: Locale): string {
    const pathname = localizedPath(url.pathname, nextLocale);
    return browser ? `${pathname}${url.search}${url.hash}` : pathname;
  }

  function switchLocale(event: Event): void {
    const nextLocale = (event.currentTarget as HTMLSelectElement).value as Locale;
    rememberLocale(nextLocale);
    window.location.assign(localeHref(nextLocale));
  }
</script>

<label class="language-selector">
  <span class="control-label">{label}</span>
  <span class="language-icon" aria-hidden="true">🌐</span>
  <span class="select-wrap">
    <select aria-label={label} value={locale} disabled={!ready} onchange={switchLocale}>
    {#each SUPPORTED_LOCALES as option}
        <option value={option} lang={intlLocale(option)} dir={localeDirection(option)}>{LOCALE_LABELS[option]}</option>
    {/each}
    </select>
  </span>
</label>

<style>
  .language-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--ink);
    font-size: 0.82rem;
    font-weight: 750;
  }

  .control-label {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .language-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .select-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: min(132px, 42vw);
    min-width: 0;
  }

  .select-wrap::after {
    position: absolute;
    inset-inline-end: 11px;
    content: '▾';
    color: var(--muted);
    font-size: 0.72rem;
    pointer-events: none;
  }

  select {
    width: 100%;
    min-width: 0;
    min-height: 40px;
    appearance: none;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--surface);
    color: var(--ink);
    padding: 8px 32px 8px 11px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  select:hover { border-color: var(--ink); }
  select:focus-visible { outline: 3px solid var(--safe); outline-offset: 2px; }
  select:disabled { cursor: progress; opacity: 0.72; }

</style>
