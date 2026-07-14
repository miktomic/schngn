import type { Clerk } from '@clerk/clerk-js';

export const SCHNGN_CLERK_APPEARANCE = {
  options: {
    logoImageUrl: '/brand/schngn-wordmark.png',
    logoLinkUrl: '/',
    logoPlacement: 'inside'
  },
  variables: {
    colorBackground: '#ffffff',
    colorForeground: '#10231f',
    colorMuted: '#edf5f1',
    colorMutedForeground: '#4f5f59',
    colorPrimary: '#10231f',
    colorPrimaryForeground: '#ffffff',
    colorNeutral: '#718079',
    colorInput: '#ffffff',
    colorInputForeground: '#10231f',
    colorBorder: '#c8d1c8',
    colorRing: '#0f6b4f',
    colorDanger: '#a8322a',
    colorSuccess: '#0f6b4f',
    colorWarning: '#8a5a00',
    colorModalBackdrop: 'rgba(10, 32, 27, 0.56)',
    colorShadow: 'rgba(16, 35, 31, 0.18)',
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    fontFamilyButtons: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    fontSize: '0.9375rem',
    borderRadius: '10px',
    spacing: '1rem'
  }
} as const;

type ClerkBrowserLoadOptions = NonNullable<Parameters<Clerk['load']>[0]>;
type ClerkSignUpOpenOptions = NonNullable<Parameters<Clerk['openSignUp']>[0]>;
type ClerkSignInOpenOptions = NonNullable<Parameters<Clerk['openSignIn']>[0]>;
type ClerkUiConstructor = NonNullable<NonNullable<ClerkBrowserLoadOptions['ui']>['ClerkUI']>;

export type ClerkSignUpModalOptions = Pick<
  ClerkSignUpOpenOptions,
  'forceRedirectUrl' | 'fallbackRedirectUrl' | 'signInForceRedirectUrl' | 'signInFallbackRedirectUrl'
>;

export type ClerkSignInModalOptions = Pick<
  ClerkSignInOpenOptions,
  'forceRedirectUrl' | 'fallbackRedirectUrl' | 'signUpForceRedirectUrl' | 'signUpFallbackRedirectUrl'
>;

export interface ClerkBrowserClientLike {
  user:
    | {
        id?: string | null;
        primaryEmailAddress?: { emailAddress?: string | null } | null;
      }
    | null
    | undefined;
  session:
    | {
        id?: string | null;
        getToken(): Promise<string | null>;
      }
    | null
    | undefined;
  load(options: ClerkBrowserLoadOptions): Promise<unknown>;
  addListener(listener: () => void, options?: { skipInitialEmit?: boolean }): () => void;
  openSignUp(options?: ClerkSignUpOpenOptions): void;
  openSignIn(options?: ClerkSignInOpenOptions): void;
  redirectToUserProfile(): Promise<unknown>;
  signOut(): Promise<unknown>;
}

export type ClerkBrowserClientLoader = (publishableKey: string) => Promise<ClerkBrowserClientLike>;

export interface ClerkBrowserWindow {
  __schngnClerkTestClient?: ClerkBrowserClientLike;
  __schngnClerkTestLoader?: ClerkBrowserClientLoader;
  __schngnClerkTestUiLoader?: ClerkBrowserClientLoader;
  /** @deprecated Kept so older smoke-test fixtures fail safely during rollout. */
  __schngnClerkTestSignUpLoader?: ClerkBrowserClientLoader;
  __internal_ClerkUICtor?: ClerkUiConstructor;
  __schngnClerkTestUiLoadTimeoutMs?: number;
}

export type ClerkModalOpenResult =
  | { ok: true }
  | { ok: false; reason: 'missing_publishable_key' | 'browser_unavailable' | 'load_failed' };

export type ClerkBrowserAuthUnavailable = {
  available: false;
  reason: 'missing_publishable_key' | 'browser_unavailable' | 'load_failed';
};

export interface ClerkBrowserAuthAvailable {
  readonly available: true;
  readonly isSignedIn: boolean;
  readonly userId: string | null;
  readonly email: string | null;
  readonly sessionId: string | null;
  getToken(): Promise<string | null>;
  subscribe(listener: () => void): () => void;
  redirectToUserProfile(): Promise<void>;
  signOut(): Promise<void>;
}

export type ClerkBrowserAuth = ClerkBrowserAuthAvailable | ClerkBrowserAuthUnavailable;

declare global {
  interface Window extends ClerkBrowserWindow {}
}

async function loadOfficialClerkClient(publishableKey: string): Promise<ClerkBrowserClientLike> {
  // Background account/session checks do not require Clerk's separate UI bundle.
  const { Clerk } = await import('@clerk/clerk-js/no-rhc');
  return new Clerk(publishableKey) as ClerkBrowserClientLike;
}

type BrowserRuntimeWindow = Window & ClerkBrowserWindow;

const modalClientLoads = new WeakMap<object, { publishableKey: string; promise: Promise<ClerkBrowserClientLike> }>();
const clerkUiBundleLoads = new WeakMap<object, { domain: string; promise: Promise<unknown> }>();
const CLERK_UI_LOAD_TIMEOUT_MS = 15_000;

function clerkFrontendApiDomain(publishableKey: string, browserWindow: ClerkBrowserWindow): string {
  const encoded = publishableKey.match(/^pk_(?:test|live)_(.+)$/)?.[1];
  const runtimeWindow = browserWindow as BrowserRuntimeWindow;
  if (!encoded || typeof runtimeWindow.atob !== 'function') throw new Error('invalid Clerk publishable key');

  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const decoded = runtimeWindow.atob(padded);
  if (!decoded.endsWith('$')) throw new Error('invalid Clerk publishable key');
  const domain = decoded.slice(0, -1).toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(domain)) throw new Error('invalid Clerk frontend domain');

  const parsed = new URL(`https://${domain}`);
  if (parsed.hostname !== domain || parsed.port || parsed.pathname !== '/') {
    throw new Error('invalid Clerk frontend domain');
  }
  return domain;
}

async function loadOfficialClerkUiBundle(
  publishableKey: string,
  browserWindow: ClerkBrowserWindow
): Promise<unknown> {
  if (browserWindow.__internal_ClerkUICtor) return browserWindow.__internal_ClerkUICtor;

  const runtimeWindow = browserWindow as BrowserRuntimeWindow;
  if (!runtimeWindow.document?.head) throw new Error('Clerk UI requires a browser document');
  const domain = clerkFrontendApiDomain(publishableKey, browserWindow);
  const cached = clerkUiBundleLoads.get(browserWindow);
  if (cached?.domain === domain) return cached.promise;

  const script = runtimeWindow.document.createElement('script');
  script.src = `https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.schngnClerkUi = domain;

  const configuredTimeout = browserWindow.__schngnClerkTestUiLoadTimeoutMs;
  const timeoutMs = typeof configuredTimeout === 'number' && Number.isFinite(configuredTimeout) && configuredTimeout >= 0
    ? configuredTimeout
    : CLERK_UI_LOAD_TIMEOUT_MS;
  const promise = new Promise<unknown>((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
    const finish = (result: { value: ClerkUiConstructor } | { error: Error }) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
      if ('error' in result) {
        script.remove();
        reject(result.error);
        return;
      }
      resolve(result.value);
    };
    timeoutId = globalThis.setTimeout(
      () => finish({ error: new Error('Clerk UI load timed out') }),
      timeoutMs
    );
    script.addEventListener('load', () => {
      const constructor = browserWindow.__internal_ClerkUICtor;
      if (!constructor) {
        finish({ error: new Error('Clerk UI did not initialize') });
        return;
      }
      finish({ value: constructor });
    }, { once: true });
    script.addEventListener('error', () => {
      finish({ error: new Error('Clerk UI could not load') });
    }, { once: true });
    runtimeWindow.document.head.appendChild(script);
  }).catch((error: unknown) => {
    const current = clerkUiBundleLoads.get(browserWindow);
    if (current?.promise === promise) clerkUiBundleLoads.delete(browserWindow);
    throw error;
  });

  clerkUiBundleLoads.set(browserWindow, { domain, promise });
  return promise;
}

async function loadOfficialClerkModalClient(
  publishableKey: string,
  browserWindow: ClerkBrowserWindow
): Promise<ClerkBrowserClientLike> {
  await loadOfficialClerkUiBundle(publishableKey, browserWindow);
  const { Clerk } = await import('@clerk/clerk-js');
  return new Clerk(publishableKey) as ClerkBrowserClientLike;
}

async function loadClerkModalClient(
  publishableKey: string,
  browserWindow: ClerkBrowserWindow
): Promise<ClerkBrowserClientLike> {
  const cached = modalClientLoads.get(browserWindow);
  if (cached?.publishableKey === publishableKey) return cached.promise;

  const promise = (async () => {
    const injectedClient = browserWindow.__schngnClerkTestClient;
    const injectedLoader = browserWindow.__schngnClerkTestUiLoader
      ?? browserWindow.__schngnClerkTestSignUpLoader;
    const client = injectedClient
      ?? await (injectedLoader
        ? injectedLoader(publishableKey)
        : loadOfficialClerkModalClient(publishableKey, browserWindow));
    const uiConstructor = browserWindow.__internal_ClerkUICtor;
    await client.load({
      telemetry: false,
      ...(uiConstructor ? { ui: { ClerkUI: uiConstructor } } : {})
    });
    return client;
  })().catch((error: unknown) => {
    const current = modalClientLoads.get(browserWindow);
    if (current?.promise === promise) modalClientLoads.delete(browserWindow);
    throw error;
  });

  modalClientLoads.set(browserWindow, { publishableKey, promise });
  return promise;
}

function normalizedPublishableKey(publishableKey: string | null | undefined): string {
  return typeof publishableKey === 'string' ? publishableKey.trim() : '';
}

function resolvedBrowserWindow(targetWindow?: ClerkBrowserWindow): ClerkBrowserWindow | undefined {
  return targetWindow ?? (typeof window === 'undefined' ? undefined : window);
}

export async function openClerkSignUp(
  publishableKey: string | null | undefined,
  options: ClerkSignUpModalOptions = {},
  targetWindow?: ClerkBrowserWindow
): Promise<ClerkModalOpenResult> {
  const key = normalizedPublishableKey(publishableKey);
  if (key.length === 0) return { ok: false, reason: 'missing_publishable_key' };

  const browserWindow = resolvedBrowserWindow(targetWindow);
  if (!browserWindow) return { ok: false, reason: 'browser_unavailable' };

  try {
    const client = await loadClerkModalClient(key, browserWindow);
    client.openSignUp({
      ...options,
      oauthFlow: 'popup',
      appearance: SCHNGN_CLERK_APPEARANCE
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'load_failed' };
  }
}

export async function openClerkSignIn(
  publishableKey: string | null | undefined,
  options: ClerkSignInModalOptions = {},
  targetWindow?: ClerkBrowserWindow
): Promise<ClerkModalOpenResult> {
  const key = normalizedPublishableKey(publishableKey);
  if (key.length === 0) return { ok: false, reason: 'missing_publishable_key' };

  const browserWindow = resolvedBrowserWindow(targetWindow);
  if (!browserWindow) return { ok: false, reason: 'browser_unavailable' };

  try {
    const client = await loadClerkModalClient(key, browserWindow);
    client.openSignIn({
      ...options,
      oauthFlow: 'popup',
      appearance: SCHNGN_CLERK_APPEARANCE
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'load_failed' };
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function browserAuthFor(client: ClerkBrowserClientLike): ClerkBrowserAuthAvailable {
  return {
    available: true,
    get isSignedIn() {
      return stringOrNull(client.user?.id) !== null && stringOrNull(client.session?.id) !== null;
    },
    get userId() {
      return stringOrNull(client.user?.id);
    },
    get email() {
      return stringOrNull(client.user?.primaryEmailAddress?.emailAddress);
    },
    get sessionId() {
      return stringOrNull(client.session?.id);
    },
    async getToken() {
      const session = client.session;
      if (!session || stringOrNull(session.id) === null) return null;
      return stringOrNull(await session.getToken());
    },
    subscribe(listener) {
      return client.addListener(listener, { skipInitialEmit: true });
    },
    async redirectToUserProfile() {
      await client.redirectToUserProfile();
    },
    async signOut() {
      await client.signOut();
    }
  };
}

export async function initializeClerkBrowserAuth(
  publishableKey: string | null | undefined,
  targetWindow?: ClerkBrowserWindow
): Promise<ClerkBrowserAuth> {
  const key = normalizedPublishableKey(publishableKey);
  if (key.length === 0) {
    return { available: false, reason: 'missing_publishable_key' };
  }

  const browserWindow = resolvedBrowserWindow(targetWindow);
  if (!browserWindow) {
    return { available: false, reason: 'browser_unavailable' };
  }

  try {
    const injectedClient = browserWindow.__schngnClerkTestClient;
    const injectedLoader = browserWindow.__schngnClerkTestLoader;
    const client = injectedClient ?? (await (injectedLoader ?? loadOfficialClerkClient)(key));
    await client.load({ telemetry: false });
    return browserAuthFor(client);
  } catch {
    return { available: false, reason: 'load_failed' };
  }
}
