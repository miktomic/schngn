<script lang="ts">
  import { intlLocale, type Locale } from '$lib/i18n';
  import { createAppDeepUiTranslator } from '$lib/i18n/appDeepUi';
  import { createBilateralUiTranslator } from '$lib/i18n/bilateralUi';
  import {
    BILATERAL_RUNTIME_PASSPORTS,
    findPotentialBilateralNotice
  } from '$lib/bilateral/runtime';

  interface Props {
    asOf: string;
    hostCountryCode: string;
    locale?: Locale;
    selectId?: string;
  }

  let { asOf, hostCountryCode, locale = 'en', selectId }: Props = $props();
  const instanceId = $props.id();
  let passportSelectId = $derived(selectId ?? `${instanceId}-passport`);
  let passportCountryCode = $state('');
  let ui = $derived(createBilateralUiTranslator(locale));
  let deep = $derived(createAppDeepUiTranslator(locale));
  let passportOptions = $derived.by(() => {
    const names = new Intl.DisplayNames([intlLocale(locale)], { type: 'region' });
    const collator = new Intl.Collator(intlLocale(locale), { sensitivity: 'base' });
    return BILATERAL_RUNTIME_PASSPORTS
      .map((passport) => ({
        ...passport,
        displayName: names.of(passport.countryCode) ?? passport.countryName
      }))
      .sort((left, right) => collator.compare(left.displayName, right.displayName));
  });
  let notice = $derived(
    findPotentialBilateralNotice({ passportCountryCode, hostCountryCode, asOf })
  );
  let selectedPassportName = $derived(
    passportOptions.find((passport) => passport.countryCode === passportCountryCode)?.displayName ??
      passportCountryCode
  );
  let hostCountryName = $derived(
    new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(hostCountryCode) ?? hostCountryCode
  );
</script>

<section class="passport-check">
  <label id={`${instanceId}-label`} for={passportSelectId}>
    {ui('passportLabel')} <small>{deep('optional')}</small>
  </label>
  <select
    id={passportSelectId}
    bind:value={passportCountryCode}
    aria-describedby={`${instanceId}-help`}
  >
    <option value="">{ui('choosePassport')}</option>
    {#each passportOptions as passport (passport.countryCode)}
      <option value={passport.countryCode}>{passport.displayName}</option>
    {/each}
  </select>
  <small id={`${instanceId}-help`} class="passport-help">{ui('passportHelp')}</small>

  {#if notice}
    <aside
      class="bilateral-note"
      class:caution={notice.kind === 'conditional_current_with_cautions'}
      role="note"
      aria-live="polite"
      aria-atomic="true"
      data-bilateral-kind={notice.kind}
    >
      <h3>
        {notice.kind === 'conditional_current_with_cautions'
          ? ui('cautionTitle')
          : ui('potentialTitle')}
      </h3>
      <p>{ui('matchCopy', { passportCountry: selectedPassportName, exitCountry: hostCountryName })}</p>
      <p>{ui('conditionsCopy', { exitCountry: hostCountryName })}</p>
      <p>{ui('authorityCaution')}</p>
      <p class="calculation-boundary">{ui('unchangedCopy')}</p>
      <a
        href={notice.source.url}
        target="_blank"
        rel="noopener noreferrer"
        referrerpolicy="no-referrer"
        aria-label={`${ui('officialSource')} — ${ui('opensNewTab')}`}
      >{ui('officialSource')}<span aria-hidden="true"> ↗</span></a>
      <small class="source-issuer"><bdi lang="en">{notice.source.issuer}</bdi></small>
    </aside>
  {/if}
</section>

<style>
  .passport-check {
    display: grid;
    gap: 7px;
    margin-top: 8px;
    border-block: 1px solid var(--line);
    padding-block: 14px;
  }

  label {
    color: var(--ink);
    font-weight: 740;
  }

  label small {
    margin-inline-start: 4px;
    color: var(--muted);
    font-weight: 500;
  }

  select {
    width: 100%;
    min-height: 48px;
    border: 1px solid var(--control-line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    padding: 10px 12px;
  }

  select:focus-visible,
  a:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--safe), transparent 42%);
    outline-offset: 2px;
  }

  .passport-help {
    max-width: 68ch;
    color: var(--muted);
    line-height: 1.45;
  }

  .bilateral-note {
    display: grid;
    gap: 7px;
    margin-top: 5px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    padding: 13px;
  }

  .bilateral-note.caution {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 45%);
    background: var(--whatif-bg);
  }

  h3,
  p {
    margin: 0;
  }

  h3 {
    color: var(--ink);
    font-size: 1rem;
    line-height: 1.3;
    text-wrap: balance;
  }

  p {
    max-width: 68ch;
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.48;
    text-wrap: pretty;
  }

  .calculation-boundary {
    color: var(--ink);
    font-weight: 680;
  }

  a {
    width: fit-content;
    color: var(--ink);
    font-weight: 760;
    text-underline-offset: 3px;
  }

  .source-issuer {
    color: var(--muted);
    line-height: 1.35;
  }
</style>
