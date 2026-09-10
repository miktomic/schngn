<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { SUPPORTED_LOCALES, LOCALE_LABELS, localeFromPath, localizedUrl } from '$lib/i18n';
  let { title, children }: { title: string; children: Snippet } = $props();
</script>
<svelte:head><title>{title} | SCHNGN</title><meta name="robots" content="noindex, nofollow" /><meta name="referrer" content="no-referrer" /></svelte:head>
<main>
  <header><a href="/">SCHNGN</a><select aria-label="Language" value={localeFromPath(page.url.pathname)} onchange={event => location.assign(localizedUrl(page.url, event.currentTarget.value as typeof SUPPORTED_LOCALES[number]))}>{#each SUPPORTED_LOCALES as locale}<option value={locale}>{LOCALE_LABELS[locale]}</option>{/each}</select></header>
  <h1>{title}</h1>{@render children()}
</main>
<style>
  main { width: min(640px, calc(100% - 32px)); margin: 32px auto 64px; color: var(--ink); line-height: 1.6; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  h1 { font-size: 2rem; line-height: 1.2; letter-spacing: -0.025em; text-wrap: balance; margin-block: 32px 24px; }
  main :global(p) { text-wrap: pretty; } main :global(bdi), main :global(strong) { overflow-wrap: anywhere; }
  main :global(ul) { padding-inline-start: 24px; } main :global(li) { margin-block: 16px; }
  main :global(button), select { min-height: 44px; padding: 10px 16px; border: 1px solid var(--line); border-radius: 6px; cursor: pointer; background: var(--surface); color: var(--ink); font: inherit; max-width: 100%; }
  main :global(button:hover:not(:disabled)), select:hover { border-color: var(--ink); }
  main :global(button:disabled) { opacity: .65; cursor: wait; }
  main :global(button:focus-visible), main :global(a:focus-visible), select:focus-visible { outline: 2px solid var(--safe); outline-offset: 4px; }
  main :global(.actions) { display: flex; flex-wrap: wrap; gap: 12px; margin-block: 24px; }
  main :global(.primary) { background: var(--ink); color: var(--surface); }
  main :global([role=alert]) { color: var(--risk); }
</style>
