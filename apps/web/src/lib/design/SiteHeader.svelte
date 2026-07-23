<script lang="ts">
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { initializeClerkBrowserAuth, openClerkSignIn, openClerkSignUp, type ClerkBrowserAuth } from '$lib/auth/clerkBrowser';
  import LanguageSelector from '$lib/i18n/LanguageSelector.svelte';
  import { createTranslator, localizedPath, type Locale } from '$lib/i18n';
  import { siteHeaderUi } from '$lib/i18n/siteHeaderUi';
  import SchngnLogo from './SchngnLogo.svelte';

  type HeaderSection = 'calculator' | 'explainer' | 'faq' | 'contact' | 'account';
  type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'unavailable';

  interface Props {
    locale: Locale;
    url: URL;
    current?: HeaderSection;
    calculatorHref?: string;
    accountHref?: string;
    authStatus?: AuthStatus;
    signupMode?: 'standard' | 'save';
    authBusy?: boolean;
    authError?: string;
    onCalculator?: () => void | Promise<void>;
    onSignUp?: () => void | Promise<void>;
    onLogin?: () => void | Promise<void>;
    onLogout?: () => void | Promise<void>;
  }

  let {
    locale,
    url,
    current,
    calculatorHref,
    accountHref,
    authStatus,
    signupMode = 'standard',
    authBusy = false,
    authError = '',
    onCalculator,
    onSignUp,
    onLogin,
    onLogout
  }: Props = $props();

  let t = $derived(createTranslator(locale));
  let copy = $derived(siteHeaderUi(locale));
  let homePath = $derived(localizedPath('/', locale));
  let appPath = $derived(calculatorHref ?? localizedPath('/app', locale));
  let explainerPath = $derived(localizedPath('/explainer', locale));
  let faqPath = $derived(localizedPath('/faq', locale));
  let contactPath = $derived(localizedPath('/contact', locale));
  let accountPath = $derived(accountHref ?? `${localizedPath('/app', locale)}#account`);
  let localAuthStatus = $state<AuthStatus>('loading');
  let localAuthBusy = $state(false);
  let localAuthError = $state('');
  let clerkAuth = $state<ClerkBrowserAuth | null>(null);
  let unsubscribeClerk: (() => void) | null = null;
  let controlled = $derived(Boolean(authStatus || onSignUp || onLogin || onLogout));
  let resolvedAuthStatus = $derived(authStatus ?? localAuthStatus);
  let resolvedAuthBusy = $derived(authBusy || localAuthBusy);
  let resolvedAuthError = $derived(authError || localAuthError);

  onMount(() => {
    if (controlled) return;
    void initializePublicAuth();
    return () => unsubscribeClerk?.();
  });

  async function initializePublicAuth(): Promise<void> {
    const auth = await initializeClerkBrowserAuth(env.PUBLIC_CLERK_PUBLISHABLE_KEY);
    clerkAuth = auth;
    updatePublicAuthStatus();
    if (!auth.available) return;
    unsubscribeClerk = auth.subscribe(updatePublicAuthStatus);
  }

  function updatePublicAuthStatus(): void {
    localAuthStatus = clerkAuth?.available === true
      ? (clerkAuth.isSignedIn ? 'signed-in' : 'signed-out')
      : 'unavailable';
  }

  function returnUrl(): string {
    if (!browser) return homePath;
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  async function handleSignUp(): Promise<void> {
    if (resolvedAuthBusy) return;
    if (onSignUp) {
      await onSignUp();
      return;
    }
    await runPublicAuthAction(async () => {
      const destination = returnUrl();
      const result = await openClerkSignUp(env.PUBLIC_CLERK_PUBLISHABLE_KEY, {
        forceRedirectUrl: destination,
        signInForceRedirectUrl: destination
      });
      if (result.ok === false) throw new Error('Clerk signup unavailable');
    });
  }

  function handleCalculatorNavigation(event: MouseEvent): void {
    if (!onCalculator) return;
    event.preventDefault();
    void onCalculator();
  }

  async function handleLogin(): Promise<void> {
    if (resolvedAuthBusy) return;
    if (onLogin) {
      await onLogin();
      return;
    }
    await runPublicAuthAction(async () => {
      const destination = returnUrl();
      const result = await openClerkSignIn(env.PUBLIC_CLERK_PUBLISHABLE_KEY, {
        forceRedirectUrl: destination,
        signUpForceRedirectUrl: destination
      });
      if (result.ok === false) throw new Error('Clerk sign-in unavailable');
    });
  }

  async function handleLogout(): Promise<void> {
    if (resolvedAuthBusy) return;
    if (onLogout) {
      await onLogout();
      return;
    }
    const auth = clerkAuth;
    if (!auth?.available || !auth.isSignedIn) return;
    await runPublicAuthAction(() => auth.signOut());
    updatePublicAuthStatus();
  }

  async function runPublicAuthAction(action: () => Promise<void>): Promise<void> {
    localAuthBusy = true;
    localAuthError = '';
    try {
      await action();
    } catch {
      localAuthError = copy.accountError;
    } finally {
      localAuthBusy = false;
    }
  }
</script>

<header class="site-header">
  <div class="site-header-inner">
    <a class="site-brand" href={homePath} aria-label={t('common.home')}>
      <SchngnLogo alt="" motto />
    </a>

    <nav class="site-navigation" aria-label={copy.navigation}>
      <a href={appPath} aria-current={current === 'calculator' ? 'page' : undefined} onclick={handleCalculatorNavigation}>{copy.calculator}</a>
      <a href={accountPath} aria-current={current === 'account' ? 'page' : undefined}>{copy.account}</a>
      <a href={explainerPath} aria-current={current === 'explainer' ? 'page' : undefined}>{copy.explainer}</a>
      <a href={faqPath} aria-current={current === 'faq' ? 'page' : undefined}>{copy.faq}</a>
      <a href={contactPath} aria-current={current === 'contact' ? 'page' : undefined}>{copy.contact}</a>
    </nav>

    <div class="site-utilities">
      <LanguageSelector label={t('common.language')} {locale} {url} />
      <div class="account-actions" aria-live="polite">
        {#if resolvedAuthStatus === 'signed-in'}
          <button class="auth-action auth-secondary" type="button" disabled={resolvedAuthBusy} aria-busy={resolvedAuthBusy ? 'true' : undefined} onclick={() => void handleLogout()}>{copy.logout}</button>
        {:else}
          <button class="auth-action auth-secondary" type="button" disabled={resolvedAuthBusy} onclick={() => void handleLogin()}>{copy.login}</button>
          <button class="auth-action auth-primary" type="button" disabled={resolvedAuthBusy} aria-busy={resolvedAuthBusy ? 'true' : undefined} onclick={() => void handleSignUp()}>{signupMode === 'save' ? copy.signUpAndSave : copy.signUp}</button>
        {/if}
      </div>
      {#if resolvedAuthError}<p class="header-auth-error" role="alert">{resolvedAuthError}</p>{/if}
    </div>
  </div>
</header>

<style>
  .site-header {
    width: 100%;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--surface), transparent 2%);
  }

  .site-header-inner {
    display: grid;
    width: min(1440px, calc(100% - 32px));
    min-height: 76px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: clamp(16px, 2vw, 30px);
    margin: 0 auto;
  }

  .site-brand {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    text-decoration: none;
  }

  .site-navigation,
  .site-utilities,
  .account-actions {
    display: flex;
    min-width: 0;
    align-items: center;
  }

  .site-navigation { justify-content: center; gap: 2px; }
  .site-utilities { position: relative; justify-content: flex-end; gap: 10px; }
  .account-actions { gap: 6px; }

  .site-navigation a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    border-block-end: 2px solid transparent;
    color: var(--muted);
    padding: 10px clamp(8px, 1vw, 13px) 8px;
    font-size: 0.88rem;
    font-weight: 740;
    line-height: 1.1;
    text-decoration: none;
    white-space: nowrap;
  }

  .site-navigation a:hover { color: var(--ink); }
  .site-navigation a[aria-current='page'] { border-block-end-color: var(--safe); color: var(--ink); }

  .auth-action {
    display: inline-flex;
    min-height: 42px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--ink);
    border-radius: 8px;
    padding: 8px 12px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 760;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
  }

  .auth-secondary { background: var(--surface); color: var(--ink); }
  .auth-primary { background: var(--ink); color: var(--surface); }
  .auth-action:hover:not(:disabled) { filter: brightness(1.08); }
  .auth-action:focus-visible, .site-navigation a:focus-visible, .site-brand:focus-visible { outline: 3px solid var(--safe); outline-offset: 2px; }
  .auth-action:disabled { cursor: progress; opacity: 0.62; }

  .header-auth-error {
    position: absolute;
    inset-block-start: calc(100% + 8px);
    inset-inline-end: 0;
    z-index: 30;
    width: min(330px, 80vw);
    margin: 0;
    border: 1px solid color-mix(in srgb, var(--risk), var(--line) 40%);
    border-radius: 8px;
    background: var(--surface);
    color: var(--risk);
    padding: 8px 10px;
    font-size: 0.76rem;
    font-weight: 650;
    line-height: 1.35;
  }

  @media (max-width: 1400px) {
    .site-header-inner {
      grid-template-columns: auto minmax(0, 1fr);
      gap: 8px 18px;
      padding-block: 10px;
    }
    .site-utilities { grid-column: 2; grid-row: 1; }
    .site-navigation {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-content: flex-start;
      overflow-x: auto;
      padding-block-start: 2px;
      scrollbar-width: thin;
    }
    .site-navigation a { flex: 0 0 auto; }
  }

  @media (max-width: 900px) {
    .site-header-inner { width: 100%; grid-template-columns: 1fr; gap: 10px; padding: 12px 16px 8px; }
    .site-brand { grid-column: 1; grid-row: 1; }
    .site-utilities { grid-column: 1; grid-row: 2; justify-content: space-between; flex-wrap: wrap; }
    .site-navigation { grid-column: 1; grid-row: 3; margin-inline: -16px; padding-inline: 12px; }
    .site-navigation a { min-height: 44px; padding-inline: 9px; font-size: 0.84rem; }
    .auth-action { min-height: 44px; padding-inline: 10px; font-size: 0.78rem; }
  }

  @media (max-width: 390px) {
    .site-utilities :global(.language-selector) { flex: 1 1 100%; }
    .account-actions { width: 100%; }
    .account-actions .auth-action {
      min-width: 0;
      flex: 1;
      line-height: 1.15;
      white-space: normal;
    }
  }
</style>
