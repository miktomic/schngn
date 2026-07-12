import { describe, expect, test } from 'bun:test';
import {
  initializeClerkBrowserAuth,
  redirectToClerkSignUp,
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
    async redirectToSignUp(options) {
      calls.push({ method: 'redirect-sign-up', value: options });
    },
    async redirectToSignIn(options) {
      calls.push({ method: 'sign-in', value: options });
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

  test('redirects signup through Clerk while keeping the remaining account operations minimal', async () => {
    const { client, calls } = createFakeClerkClient();
    const auth = await initializeClerkBrowserAuth('pk_test_browser', { __schngnClerkTestClient: client });
    if (!auth.available) throw new Error('expected Clerk to be available');

    await auth.redirectToSignUp({ redirectUrl: '/app' });
    await auth.redirectToSignIn({ redirectUrl: '/app?market=uk' });
    await auth.redirectToUserProfile();
    await auth.signOut();

    expect(calls.slice(1)).toEqual([
      { method: 'redirect-sign-up', value: { redirectUrl: '/app' } },
      { method: 'sign-in', value: { redirectUrl: '/app?market=uk' } },
      { method: 'profile' },
      { method: 'sign-out' }
    ]);
  });

  test('redirects to hosted signup independently when the background session client cannot load', async () => {
    const { client, calls } = createFakeClerkClient();
    const targetWindow: ClerkBrowserWindow = {
      __schngnClerkTestLoader: async () => {
        throw new Error('background session unavailable');
      },
      __schngnClerkTestSignUpLoader: async () => client
    };

    await expect(initializeClerkBrowserAuth('pk_test_browser', targetWindow)).resolves.toEqual({
      available: false,
      reason: 'load_failed'
    });
    await expect(redirectToClerkSignUp(
      'pk_test_browser',
      { redirectUrl: '/app?account=signup#account' },
      targetWindow
    )).resolves.toEqual({ ok: true });
    expect(calls).toEqual([
      { method: 'load', value: { telemetry: false } },
      { method: 'redirect-sign-up', value: { redirectUrl: '/app?account=signup#account' } }
    ]);
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
