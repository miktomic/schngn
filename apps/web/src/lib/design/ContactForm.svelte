<script lang="ts">
  import { onMount } from 'svelte';
  import type { Locale } from '$lib/i18n';
  import { contactUi } from '$lib/i18n/contactUi';

  interface Props { locale: Locale; siteKey?: string; }
  const LOCAL_TEST_SITE_KEY = '1x00000000000000000000AA';
  let { locale, siteKey = '' }: Props = $props();
  let copy = $derived(contactUi(locale));
  let formElement = $state<HTMLFormElement>();
  let turnstileContainer = $state<HTMLDivElement>();
  let activeSiteKey = $state('');
  let widgetId = $state<string | null>(null);
  let turnstileToken = $state('');
  let sending = $state(false);
  let result = $state<'idle' | 'success' | 'invalid' | 'verification_failed' | 'rate_limited' | 'unavailable'>('idle');

  onMount(() => {
    let disposed = false;
    activeSiteKey = siteKey;
    if (!activeSiteKey && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) activeSiteKey = LOCAL_TEST_SITE_KEY;
    if (activeSiteKey) {
      void loadTurnstile().then((turnstile) => {
        if (disposed || !turnstileContainer) return;
        widgetId = turnstile.render(turnstileContainer, {
          sitekey: activeSiteKey, action: 'contact', size: 'flexible', language: locale,
          callback: (token: string) => { turnstileToken = token; result = 'idle'; },
          'expired-callback': () => { turnstileToken = ''; },
          'error-callback': () => { turnstileToken = ''; result = 'verification_failed'; }
        });
      }).catch(() => { result = 'unavailable'; });
    }
    return () => {
      disposed = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  });

  async function submitContact(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = formElement;
    if (!form || sending || !form.reportValidity()) return;
    if (!turnstileToken) { result = 'verification_failed'; return; }
    const data = new FormData(form);
    sending = true;
    result = 'idle';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: data.get('type'), name: data.get('name'), email: data.get('email'),
          message: data.get('message'), website: data.get('website'), turnstileToken, locale
        })
      });
      const body = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (response.ok && body.ok) { result = 'success'; form.reset(); }
      else if (response.status === 429 || body.error === 'rate_limited') result = 'rate_limited';
      else if (body.error === 'verification_failed') result = 'verification_failed';
      else if (response.status >= 500 || body.error === 'unavailable') result = 'unavailable';
      else result = 'invalid';
    } catch { result = 'unavailable'; }
    finally {
      sending = false;
      turnstileToken = '';
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    }
  }

  function resultMessage(): string {
    if (result === 'invalid') return copy.invalid;
    if (result === 'verification_failed') return copy.verificationFailed;
    if (result === 'rate_limited') return copy.rateLimited;
    return copy.unavailable;
  }

  function loadTurnstile(): Promise<SCHNGNTurnstileApi> {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-schngn-turnstile]');
      const script = existing ?? document.createElement('script');
      const finish = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable'));
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('Turnstile failed to load')), { once: true });
      if (!existing) {
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.defer = true;
        script.dataset.schngnTurnstile = 'true';
        document.head.append(script);
      }
    });
  }
</script>

{#if result === 'success'}
  <section class="success" role="status" aria-labelledby="contact-success-title">
    <span aria-hidden="true">✓</span>
    <div><h2 id="contact-success-title">{copy.successTitle}</h2><p>{copy.successBody}</p></div>
  </section>
{:else}
  <form bind:this={formElement} class="contact-form" novalidate onsubmit={submitContact}>
    <fieldset>
      <legend>{copy.typeLabel}</legend>
      <div class="request-types">
        <label><input type="radio" name="type" value="help" checked /> <span>{copy.helpOption}</span></label>
        <label><input type="radio" name="type" value="feature" /> <span>{copy.featureOption}</span></label>
      </div>
    </fieldset>
    <div class="field-grid">
      <label><span>{copy.nameLabel} <small>{copy.optional}</small></span><input name="name" autocomplete="name" maxlength="80" /></label>
      <label><span>{copy.emailLabel}</span><input name="email" type="email" autocomplete="email" maxlength="254" required /></label>
    </div>
    <label><span>{copy.messageLabel}</span><textarea name="message" minlength="20" maxlength="4000" rows="7" aria-describedby="contact-message-help" required></textarea></label>
    <small id="contact-message-help" class="help-copy">{copy.messageHelp}</small>
    <label class="honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>
    <div class="verification"><span>{copy.verification}</span>{#if activeSiteKey}<div bind:this={turnstileContainer} class="turnstile"></div>{/if}</div>
    <p class="privacy-copy">{copy.privacy}</p>
    {#if result !== 'idle'}<p class="form-error" role="alert">{resultMessage()}</p>{/if}
    <button type="submit" disabled={sending || !activeSiteKey || !turnstileToken} aria-busy={sending ? 'true' : undefined}>{sending ? copy.sending : copy.submit}</button>
    {#if !activeSiteKey || result === 'unavailable'}<p class="email-fallback">{copy.emailFallback} <a href="mailto:support@schngn.com">support@schngn.com</a>.</p>{/if}
  </form>
{/if}

<style>
  .contact-form { display: grid; gap: 20px; }
  fieldset { min-width: 0; margin: 0; border: 0; padding: 0; }
  legend, label > span, .verification > span { display: block; margin-bottom: 8px; color: var(--ink); font-weight: 720; }
  label > span small { color: var(--muted); font-weight: 500; }
  .request-types { display: flex; flex-wrap: wrap; gap: 10px; }
  .request-types label { display: flex; min-height: 46px; flex: 1 1 210px; align-items: center; gap: 10px; border: 1px solid var(--control-line); border-radius: 10px; background: var(--surface); padding: 10px 14px; cursor: pointer; }
  .request-types label:has(input:checked) { border-color: var(--safe); background: var(--surface-mint); }
  .request-types input { width: 18px; height: 18px; accent-color: var(--safe); }
  .request-types span { margin: 0; }
  .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  input:not([type='radio']), textarea { width: 100%; border: 1px solid var(--control-line); border-radius: 10px; background: var(--surface); color: var(--ink); font: inherit; }
  input:not([type='radio']) { min-height: 50px; padding: 11px 13px; }
  textarea { min-height: 170px; resize: vertical; padding: 13px; line-height: 1.5; }
  input:focus-visible, textarea:focus-visible, .request-types label:has(input:focus-visible) { outline: 3px solid color-mix(in srgb, var(--safe), transparent 52%); outline-offset: 2px; }
  .help-copy, .privacy-copy, .email-fallback { color: var(--muted); line-height: 1.5; }
  .help-copy { display: block; margin-top: -14px; }
  .privacy-copy, .email-fallback { margin: 0; font-size: 0.94rem; }
  .verification { display: grid; gap: 4px; }
  .turnstile { width: 100%; min-height: 65px; }
  .form-error { margin: 0; border: 1px solid var(--risk); border-radius: 10px; background: var(--risk-bg); padding: 11px 13px; color: var(--risk); font-weight: 650; }
  button { width: fit-content; min-height: 48px; border: 0; border-radius: 10px; background: var(--ink); padding: 12px 20px; color: var(--surface); font: inherit; font-weight: 760; cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: 0.52; }
  button:focus-visible { outline: 3px solid var(--safe); outline-offset: 3px; }
  .email-fallback a { color: var(--safe); font-weight: 700; }
  .honeypot { position: absolute; inset-inline-start: -10000px; width: 1px; height: 1px; overflow: hidden; }
  .success { display: flex; align-items: flex-start; gap: 14px; border: 1px solid var(--safe); border-radius: 14px; background: var(--safe-bg); padding: 22px; }
  .success > span { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--safe); color: var(--surface); font-weight: 800; }
  .success h2 { margin: 0; font-size: 1.35rem; }
  .success p { margin: 6px 0 0; color: var(--muted); line-height: 1.5; }
  @media (max-width: 620px) { .field-grid { grid-template-columns: 1fr; } button { width: 100%; } }
</style>
