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
  load(options: { telemetry: false }): Promise<unknown>;
  addListener(listener: () => void, options?: { skipInitialEmit?: boolean }): () => void;
  openSignUp(options?: { forceRedirectUrl?: string | null }): void;
  redirectToSignIn(options?: { redirectUrl?: string | null }): Promise<unknown>;
  redirectToUserProfile(): Promise<unknown>;
  signOut(): Promise<unknown>;
}

export type ClerkBrowserClientLoader = (publishableKey: string) => Promise<ClerkBrowserClientLike>;

export interface ClerkBrowserWindow {
  __schngnClerkTestClient?: ClerkBrowserClientLike;
  __schngnClerkTestLoader?: ClerkBrowserClientLoader;
  __schngnClerkTestUiLoader?: ClerkBrowserClientLoader;
}

export type ClerkSignUpOpenResult =
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
  openSignUp(options?: { forceRedirectUrl?: string | null }): Promise<void>;
  redirectToSignIn(options?: { redirectUrl?: string | null }): Promise<void>;
  redirectToUserProfile(): Promise<void>;
  signOut(): Promise<void>;
}

export type ClerkBrowserAuth = ClerkBrowserAuthAvailable | ClerkBrowserAuthUnavailable;

declare global {
  interface Window extends ClerkBrowserWindow {}
}

async function loadOfficialClerkClient(publishableKey: string): Promise<ClerkBrowserClientLike> {
  // Keep the account/session check small. The UI bundle is loaded only after signup is clicked.
  const { Clerk } = await import('@clerk/clerk-js/no-rhc');
  return new Clerk(publishableKey) as ClerkBrowserClientLike;
}

let clerkUiClient: { key: string; client: Promise<ClerkBrowserClientLike> } | null = null;

function loadOfficialClerkUiClient(publishableKey: string): Promise<ClerkBrowserClientLike> {
  if (clerkUiClient?.key === publishableKey) return clerkUiClient.client;
  const client = import('@clerk/clerk-js').then(async ({ Clerk }) => {
    const uiClient = new Clerk(publishableKey) as ClerkBrowserClientLike;
    await uiClient.load({ telemetry: false });
    return uiClient;
  });
  clerkUiClient = { key: publishableKey, client };
  return client;
}

export async function openClerkSignUp(
  publishableKey: string | null | undefined,
  options?: { forceRedirectUrl?: string | null },
  targetWindow?: ClerkBrowserWindow
): Promise<ClerkSignUpOpenResult> {
  const key = typeof publishableKey === 'string' ? publishableKey.trim() : '';
  if (key.length === 0) return { ok: false, reason: 'missing_publishable_key' };

  const browserWindow = targetWindow ?? (typeof window === 'undefined' ? undefined : window);
  if (!browserWindow) return { ok: false, reason: 'browser_unavailable' };

  try {
    const injectedClient = browserWindow.__schngnClerkTestClient;
    const injectedLoader = browserWindow.__schngnClerkTestUiLoader ?? browserWindow.__schngnClerkTestLoader;
    const client = injectedClient ?? (await (injectedLoader ?? loadOfficialClerkUiClient)(key));
    if (injectedClient || injectedLoader) await client.load({ telemetry: false });
    client.openSignUp(options);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'load_failed' };
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function browserAuthFor(
  client: ClerkBrowserClientLike,
  openSignUp: (options?: { forceRedirectUrl?: string | null }) => Promise<void>
): ClerkBrowserAuthAvailable {
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
    openSignUp,
    async redirectToSignIn(options) {
      await client.redirectToSignIn(options);
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
  const key = typeof publishableKey === 'string' ? publishableKey.trim() : '';
  if (key.length === 0) {
    return { available: false, reason: 'missing_publishable_key' };
  }

  const browserWindow = targetWindow ?? (typeof window === 'undefined' ? undefined : window);
  if (!browserWindow) {
    return { available: false, reason: 'browser_unavailable' };
  }

  try {
    const injectedClient = browserWindow.__schngnClerkTestClient;
    const injectedLoader = browserWindow.__schngnClerkTestLoader;
    const client = injectedClient ?? (await (injectedLoader ?? loadOfficialClerkClient)(key));
    await client.load({ telemetry: false });
    const openSignUp = injectedClient || injectedLoader
      ? async (options?: { forceRedirectUrl?: string | null }) => { client.openSignUp(options); }
      : async (options?: { forceRedirectUrl?: string | null }) => { (await loadOfficialClerkUiClient(key)).openSignUp(options); };
    return browserAuthFor(client, openSignUp);
  } catch {
    return { available: false, reason: 'load_failed' };
  }
}
