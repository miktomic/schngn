import { describe, expect, test } from 'bun:test';
import {
  initializeClerkBrowserAuth,
  openClerkSignIn,
  openClerkSignUp,
  SCHNGN_CLERK_APPEARANCE,
  type ClerkBrowserClientLike,
  type ClerkBrowserWindow
} from '../src/lib/auth/clerkBrowser';

function createFakeClerkClient() {
  const calls: Array<{ method: string; value?: unknown }> = [];
  const listeners = new Set<() => void>();
  const client: ClerkBrowserClientLike = {
    user: {
      id: 'user_browser',
      primaryEmailAddress: { emailAddress: 'person@example.com' }
    },
    session: {
      id: 'sess_browser',
      async getToken() {
        calls.push({ method: 'token' });
        return 'session-token';
      }
    },
    async load(options) {
      calls.push({ method: 'load', value: options });
    },
    addListener(listener, options) {
      calls.push({ method: 'listener', value: options });
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    openSignUp(options) {
      calls.push({ method: 'open-sign-up', value: options });
    },
    openSignIn(options) {
      calls.push({ method: 'open-sign-in', value: options });
    },
    async redirectToUserProfile() {
      calls.push({ method: 'profile' });
    },
    async signOut() {
      calls.push({ method: 'sign-out' });
    }
  };
  return { client, calls, emit: () => listeners.forEach((listener) => listener()) };
}

describe('Clerk browser auth wrapper', () => {
  test('returns unavailable without importing Clerk when the publishable key is missing', async () => {
    let loaderCalled = false;
    const targetWindow: ClerkBrowserWindow = {
      __schngnClerkTestLoader: async () => {
        loaderCalled = true;
        return createFakeClerkClient().client;
      }
    };

    await expect(initializeClerkBrowserAuth('   ', targetWindow)).resolves.toEqual({
      available: false,
      reason: 'missing_publishable_key'
    });
    expect(loaderCalled).toBe(false);
  });

  test('loads an injected client with telemetry disabled and exposes live session identity', async () => {
    const { client, calls } = createFakeClerkClient();
    const targetWindow: ClerkBrowserWindow = { __schngnClerkTestClient: client };
    const auth = await initializeClerkBrowserAuth('pk_test_browser', targetWindow);

    expect(auth.available).toBe(true);
    if (!auth.available) throw new Error('expected Clerk to be available');
    expect(auth.isSignedIn).toBe(true);
    expect(auth.userId).toBe('user_browser');
    expect(auth.email).toBe('person@example.com');
    expect(auth.sessionId).toBe('sess_browser');
    expect(calls).toEqual([{ method: 'load', value: { telemetry: false } }]);

    expect(await auth.getToken()).toBe('session-token');
    let emissions = 0;
    const unsubscribe = auth.subscribe(() => (emissions += 1));
    unsubscribe();
    expect(emissions).toBe(0);
    expect(calls.slice(1)).toEqual([
      { method: 'token' },
      { method: 'listener', value: { skipInitialEmit: true } }
    ]);

    client.user = null;
    client.session = null;
    expect(auth.isSignedIn).toBe(false);
    expect(auth.userId).toBeNull();
    expect(auth.email).toBeNull();
    expect(auth.sessionId).toBeNull();
    expect(await auth.getToken()).toBeNull();
  });

  test('subscribes to Clerk identity changes and can unsubscribe', async () => {
    const { client, emit } = createFakeClerkClient();
    const auth = await initializeClerkBrowserAuth('pk_test_browser', { __schngnClerkTestClient: client });
    if (!auth.available) throw new Error('expected Clerk to be available');

    let emissions = 0;
    const unsubscribe = auth.subscribe(() => (emissions += 1));
    emit();
    expect(emissions).toBe(1);
    unsubscribe();
    emit();
    expect(emissions).toBe(1);
  });

  test('keeps background account operations minimal', async () => {
    const { client, calls } = createFakeClerkClient();
    const auth = await initializeClerkBrowserAuth('pk_test_browser', { __schngnClerkTestClient: client });
    if (!auth.available) throw new Error('expected Clerk to be available');

    await auth.redirectToUserProfile();
    await auth.signOut();

    expect(calls.slice(1)).toEqual([
      { method: 'profile' },
      { method: 'sign-out' }
    ]);
  });

  test('opens a branded signup modal independently when the background session client cannot load', async () => {
    const { client, calls } = createFakeClerkClient();
    const targetWindow: ClerkBrowserWindow = {
      __schngnClerkTestLoader: async () => {
        throw new Error('background session unavailable');
      },
      __schngnClerkTestUiLoader: async () => client
    };

    await expect(initializeClerkBrowserAuth('pk_test_browser', targetWindow)).resolves.toEqual({
      available: false,
      reason: 'load_failed'
    });
    await expect(openClerkSignUp(
      'pk_test_browser',
      {
        forceRedirectUrl: '/app?account=signup#account',
        signInForceRedirectUrl: '/app?account=signup#account'
      },
      targetWindow
    )).resolves.toEqual({ ok: true });
    expect(calls).toEqual([
      { method: 'load', value: { telemetry: false } },
      {
        method: 'open-sign-up',
        value: {
          forceRedirectUrl: '/app?account=signup#account',
          signInForceRedirectUrl: '/app?account=signup#account',
          oauthFlow: 'popup',
          appearance: SCHNGN_CLERK_APPEARANCE
        }
      }
    ]);
  });

  test('reuses the lazy modal client for branded signup and sign-in overlays', async () => {
    const { client, calls } = createFakeClerkClient();
    let modalLoads = 0;
    const targetWindow: ClerkBrowserWindow = {
      __schngnClerkTestUiLoader: async () => {
        modalLoads += 1;
        return client;
      }
    };

    await expect(openClerkSignUp(
      'pk_test_browser',
      { forceRedirectUrl: '/app?account=signup#account' },
      targetWindow
    )).resolves.toEqual({ ok: true });
    await expect(openClerkSignIn(
      'pk_test_browser',
      {
        forceRedirectUrl: '/app?account=connected#account',
        signUpForceRedirectUrl: '/app?account=connected#account'
      },
      targetWindow
    )).resolves.toEqual({ ok: true });

    expect(modalLoads).toBe(1);
    expect(calls).toEqual([
      { method: 'load', value: { telemetry: false } },
      {
        method: 'open-sign-up',
        value: {
          forceRedirectUrl: '/app?account=signup#account',
          oauthFlow: 'popup',
          appearance: SCHNGN_CLERK_APPEARANCE
        }
      },
      {
        method: 'open-sign-in',
        value: {
          forceRedirectUrl: '/app?account=connected#account',
          signUpForceRedirectUrl: '/app?account=connected#account',
          oauthFlow: 'popup',
          appearance: SCHNGN_CLERK_APPEARANCE
        }
      }
    ]);
  });

  test('forwards the Clerk UI constructor when the modal runtime provides one', async () => {
    const { client, calls } = createFakeClerkClient();
    const uiConstructor = class FakeClerkUi {} as unknown as NonNullable<
      ClerkBrowserWindow['__internal_ClerkUICtor']
    >;
    const targetWindow: ClerkBrowserWindow = {
      __internal_ClerkUICtor: uiConstructor,
      __schngnClerkTestUiLoader: async () => client
    };

    await expect(openClerkSignUp('pk_test_browser', {}, targetWindow)).resolves.toEqual({ ok: true });

    expect(calls[0]).toEqual({
      method: 'load',
      value: { telemetry: false, ui: { ClerkUI: uiConstructor } }
    });
  });

  test('evicts a failed modal load so the user can retry without reloading the page', async () => {
    const { client, calls } = createFakeClerkClient();
    let attempts = 0;
    const targetWindow: ClerkBrowserWindow = {
      __schngnClerkTestUiLoader: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('temporary Clerk UI failure');
        return client;
      }
    };

    await expect(openClerkSignUp('pk_test_browser', {}, targetWindow)).resolves.toEqual({
      ok: false,
      reason: 'load_failed'
    });
    await expect(openClerkSignUp('pk_test_browser', {}, targetWindow)).resolves.toEqual({ ok: true });

    expect(attempts).toBe(2);
    expect(calls.map((call) => call.method)).toEqual(['load', 'open-sign-up']);
  });

  test('times out and removes an official Clerk UI script that never initializes', async () => {
    let appendedSource = '';
    let removed = false;
    const script = {
      src: '',
      async: false,
      crossOrigin: '',
      dataset: {} as Record<string, string>,
      addEventListener() {},
      remove() {
        removed = true;
      }
    };
    const targetWindow = {
      __schngnClerkTestUiLoadTimeoutMs: 0,
      atob: () => 'clerk.example$',
      document: {
        createElement: () => script,
        head: {
          appendChild(node: typeof script) {
            appendedSource = node.src;
          }
        }
      }
    } as unknown as ClerkBrowserWindow;

    await expect(openClerkSignUp('pk_test_encoded', {}, targetWindow)).resolves.toEqual({
      ok: false,
      reason: 'load_failed'
    });
    expect(appendedSource).toBe('https://clerk.example/npm/@clerk/ui@1/dist/ui.browser.js');
    expect(removed).toBe(true);
  });

  test('rejects a publishable key whose decoded frontend domain lacks Clerk framing', async () => {
    let scriptCreated = false;
    const targetWindow = {
      atob: () => 'clerk.example',
      document: {
        createElement() {
          scriptCreated = true;
          return {};
        },
        head: {}
      }
    } as unknown as ClerkBrowserWindow;

    await expect(openClerkSignUp('pk_test_encoded', {}, targetWindow)).resolves.toEqual({
      ok: false,
      reason: 'load_failed'
    });
    expect(scriptCreated).toBe(false);
  });

  test('sanitizes modal configuration and loading failures', async () => {
    await expect(openClerkSignUp('  ', {}, {})).resolves.toEqual({
      ok: false,
      reason: 'missing_publishable_key'
    });
    await expect(openClerkSignIn('pk_test_browser', {}, {
      __schngnClerkTestUiLoader: async () => {
        throw new Error('private Clerk detail');
      }
    })).resolves.toEqual({ ok: false, reason: 'load_failed' });
  });

  test('supports an injected loader and hides load failures', async () => {
    const { client } = createFakeClerkClient();
    let loadedKey = '';
    const available = await initializeClerkBrowserAuth('pk_test_browser', {
      __schngnClerkTestLoader: async (publishableKey) => {
        loadedKey = publishableKey;
        return client;
      }
    });
    expect(available.available).toBe(true);
    expect(loadedKey).toBe('pk_test_browser');

    const unavailable = await initializeClerkBrowserAuth('pk_test_browser', {
      __schngnClerkTestLoader: async () => {
        throw new Error('private Clerk detail');
      }
    });
    expect(unavailable).toEqual({ available: false, reason: 'load_failed' });
  });
});
