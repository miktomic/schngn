<script lang="ts">
  import { intlLocale, type Locale } from '$lib/i18n';
  import { countryGuideUi } from '$lib/i18n/countryGuideUi';
  import {
    EU_COUNTRIES_OUTSIDE_SCHENGEN,
    EU_SCHENGEN_COUNTRY_CODES,
    NEWEST_SCHENGEN_COUNTRY_CODES,
    NON_EU_SCHENGEN_COUNTRY_CODES,
    SCHENGEN_AREA_COUNTRIES_SOURCE_URL,
    SCHENGEN_SHORT_STAY_COUNTRY_CODES
  } from '$lib/trips/countries';

  interface Props {
    locale?: Locale;
    presentation?: 'section' | 'popover';
    expanded?: boolean;
    anchorId?: string;
  }

  let { locale = 'en', presentation = 'section', expanded = true, anchorId = 'schengen-countries' }: Props = $props();
  const instanceId = $props.id();
  const headingId = `${instanceId}-title`;
  let copy = $derived(countryGuideUi(locale));
  let newestCodes = new Set<string>(NEWEST_SCHENGEN_COUNTRY_CODES);
  let euCountries = $derived(localizeCountries(EU_SCHENGEN_COUNTRY_CODES));
  let nonEuCountries = $derived(localizeCountries(NON_EU_SCHENGEN_COUNTRY_CODES));
  let outsideCountries = $derived(localizeCountries(EU_COUNTRIES_OUTSIDE_SCHENGEN));

  function localizeCountries(codes: readonly string[]): Array<{ code: string; name: string }> {
    const displayNames = new Intl.DisplayNames([intlLocale(locale)], { type: 'region' });
    const collator = new Intl.Collator(intlLocale(locale));
    return codes
      .map((code) => ({ code, name: displayNames.of(code) ?? code }))
      .sort((left, right) => collator.compare(left.name, right.name));
  }

</script>

{#snippet guideContents()}
  <div class="guide-heading">
    <div>
      <p class="count-label"><span aria-hidden="true"></span>{copy.countLabel}</p>
      <h2 id={headingId}>{copy.title}</h2>
      <p>{copy.intro}</p>
    </div>
    {#if presentation === 'popover'}
      <button class="close-button" type="button" popovertarget={`${instanceId}-popover`} popovertargetaction="hide" aria-label={copy.close}>×</button>
    {/if}
  </div>

  <div class="country-groups">
    <section class="country-group eu-group" aria-labelledby={`${instanceId}-eu-title`}>
      <div class="group-heading">
        <div>
          <h3 id={`${instanceId}-eu-title`}>{copy.euTitle}</h3>
          <p>{copy.euCopy}</p>
        </div>
        <span class="status-label counted">{copy.countedLabel}</span>
      </div>
      <p class="newest-note">{copy.newestCopy}</p>
      <ul class="country-list full-list">
        {#each euCountries as country (country.code)}
          <li class:newest={newestCodes.has(country.code)}>
            <span>{country.name}</span><code>{country.code}</code>
          </li>
        {/each}
      </ul>
    </section>

    <section class="country-group counted-group" aria-labelledby={`${instanceId}-non-eu-title`}>
      <div class="group-heading">
        <div>
          <h3 id={`${instanceId}-non-eu-title`}>{copy.nonEuTitle}</h3>
          <p>{copy.nonEuCopy}</p>
        </div>
        <span class="status-label counted">{copy.countedLabel}</span>
      </div>
      <ul class="country-list">
        {#each nonEuCountries as country (country.code)}
          <li><span>{country.name}</span><code>{country.code}</code></li>
        {/each}
      </ul>
    </section>

    <section class="country-group outside-group" aria-labelledby={`${instanceId}-outside-title`}>
      <div class="group-heading">
        <div>
          <h3 id={`${instanceId}-outside-title`}>{copy.outsideTitle}</h3>
          <p>{copy.outsideCopy}</p>
        </div>
        <span class="status-label outside">{copy.notCountedLabel}</span>
      </div>
      <ul class="country-list">
        {#each outsideCountries as country (country.code)}
          <li><span>{country.name}</span><code>{country.code}</code></li>
        {/each}
      </ul>
    </section>
  </div>

  <a class="official-source" href={SCHENGEN_AREA_COUNTRIES_SOURCE_URL} target="_blank" rel="noreferrer">{copy.officialSource}</a>
{/snippet}

{#if presentation === 'popover'}
  <button class="guide-trigger" type="button" popovertarget={`${instanceId}-popover`}>{copy.trigger}</button>
  <div id={`${instanceId}-popover`} class="country-popover" popover="auto" role="dialog" aria-labelledby={headingId}>
    <div class="popover-sheet">
      {@render guideContents()}
    </div>
  </div>
{:else}
  <section id={anchorId} class="country-guide" aria-labelledby={headingId} data-country-count={SCHENGEN_SHORT_STAY_COUNTRY_CODES.length}>
    <details open={expanded}>
      <summary>{copy.trigger}</summary>
      <div class="section-body">
        {@render guideContents()}
      </div>
    </details>
  </section>
{/if}

<style>
  .guide-trigger { display: inline-flex; min-height: 34px; align-items: center; border: 0; background: transparent; padding: 3px 0; color: var(--safe); font: inherit; font-size: 0.93rem; font-weight: 760; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; cursor: pointer; }
  .guide-trigger:hover { color: var(--ink); }
  .guide-trigger:focus-visible, .close-button:focus-visible, summary:focus-visible, .official-source:focus-visible { outline: 3px solid var(--safe); outline-offset: 3px; }
  .country-popover { width: min(980px, calc(100vw - 28px)); max-height: calc(100svh - 28px); border: 0; border-radius: 16px; background: transparent; padding: 0; color: var(--ink); box-shadow: 0 18px 48px rgba(16, 35, 31, 0.16); }
  .country-popover::backdrop { background: rgba(16, 35, 31, 0.58); }
  .popover-sheet { max-height: calc(100svh - 28px); overflow: auto; border: 1px solid var(--line); border-radius: 16px; background: var(--surface); padding: clamp(20px, 4vw, 36px); }
  .country-guide { margin-block: 40px; border-block: 1px solid var(--line); }
  .country-guide details > summary { display: flex; min-height: 64px; align-items: center; justify-content: space-between; gap: 16px; color: var(--ink); font-size: 1.12rem; font-weight: 760; cursor: pointer; list-style: none; }
  .country-guide details > summary::-webkit-details-marker { display: none; }
  .country-guide details > summary::after { content: '+'; color: var(--safe); font-size: 1.5rem; font-weight: 500; }
  .country-guide details[open] > summary::after { content: '−'; }
  .section-body { padding: 8px 0 36px; }
  .guide-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
  .count-label { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; color: var(--safe); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.82rem; font-weight: 760; }
  .count-label span { width: 10px; height: 10px; border-radius: 3px; background: var(--safe); }
  h2 { margin: 0; font-size: clamp(1.65rem, 3vw, 2.45rem); line-height: 1.05; letter-spacing: -0.025em; text-wrap: balance; }
  .guide-heading p:last-child { max-width: 72ch; margin: 12px 0 0; color: var(--muted); font-size: 1.03rem; line-height: 1.55; text-wrap: pretty; }
  .close-button { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); font-size: 1.55rem; line-height: 1; cursor: pointer; }
  .close-button:hover { border-color: var(--ink); }
  .country-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 26px; }
  .country-group { min-width: 0; border: 1px solid var(--line); border-radius: 14px; background: var(--paper); padding: 18px; }
  .eu-group { grid-column: 1 / -1; }
  .counted-group { border-color: color-mix(in srgb, var(--safe), var(--line) 52%); background: var(--safe-bg); }
  .outside-group { border-color: color-mix(in srgb, var(--whatif), var(--line) 50%); background: var(--whatif-bg); }
  .group-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  h3 { margin: 0; font-size: 1.15rem; line-height: 1.2; text-wrap: balance; }
  .group-heading p { max-width: 58ch; margin: 7px 0 0; color: var(--muted); line-height: 1.5; text-wrap: pretty; }
  .status-label { display: inline-flex; min-height: 28px; flex: 0 0 auto; align-items: center; border: 1px solid currentColor; border-radius: 999px; padding: 4px 9px; font-size: 0.78rem; font-weight: 760; line-height: 1.2; }
  .status-label.counted { color: var(--safe); background: var(--surface); }
  .status-label.outside { color: var(--whatif); background: var(--surface); }
  .newest-note { margin: 14px 0 0; color: var(--ink); font-size: 0.9rem; font-weight: 650; }
  .country-list { display: grid; gap: 6px; margin: 15px 0 0; padding: 0; list-style: none; }
  .country-list.full-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .country-list li { display: flex; min-width: 0; align-items: baseline; justify-content: space-between; gap: 8px; border-top: 1px solid color-mix(in srgb, var(--line), transparent 28%); padding-top: 6px; }
  .country-list li.newest { color: var(--safe); font-weight: 720; }
  .country-list span { min-width: 0; overflow-wrap: anywhere; }
  .country-list code { color: var(--muted); font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 0.76rem; }
  .official-source { display: inline-flex; margin-top: 20px; color: var(--safe); font-weight: 720; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  .official-source:hover { color: var(--ink); }
  @media (max-width: 720px) {
    .country-groups { grid-template-columns: 1fr; }
    .eu-group { grid-column: auto; }
    .country-list.full-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .group-heading { align-items: stretch; flex-direction: column; }
    .status-label { align-self: flex-start; }
  }
  @media (max-width: 420px) {
    .country-popover { width: calc(100vw - 16px); max-height: calc(100svh - 16px); }
    .popover-sheet { max-height: calc(100svh - 16px); border-radius: 12px; padding: 18px; }
    .country-list.full-list { grid-template-columns: 1fr; }
    h2 { font-size: 1.65rem; }
  }
</style>
