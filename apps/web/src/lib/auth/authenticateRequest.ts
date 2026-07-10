import { createClerkClient } from '@clerk/backend';

export const CLERK_PRODUCTION_AUTHORIZED_PARTIES = [
  'https://schngn.com',
  'https://www.schngn.com'
] as const;

export const CLERK_LOCAL_AUTHORIZED_PARTIES = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
] as const;

export interface ClerkAuthEnvironment {
  PUBLIC_CLERK_PUBLISHABLE_KEY?: unknown;
  CLERK_SECRET_KEY?: unknown;
}

export type AuthenticatedClerkRequest = {
  ok: true;
  userId: string;
  sessionId: string;
};

export type ClerkAuthenticationFailure = {
  ok: false;
  status: 401 | 503;
  error: 'Unauthorized' | 'Authentication is temporarily unavailable';
};

export type ClerkAuthenticationResult = AuthenticatedClerkRequest | ClerkAuthenticationFailure;

interface ClerkAuthObjectLike {
  userId?: string | null;
  sessionId?: string | null;
}

interface ClerkRequestStateLike {
  isAuthenticated: boolean;
  toAuth(): ClerkAuthObjectLike | null;
}

interface ClerkClientLike {
  authenticateRequest(
    request: Request,
    options: { acceptsToken: 'session_token'; authorizedParties: string[] }
  ): Promise<ClerkRequestStateLike>;
}

interface ClerkClientConfiguration {
  publishableKey: string;
  secretKey: string;
  telemetry: { disabled: true };
}

export interface AuthenticateClerkRequestDependencies {
  createClient(configuration: ClerkClientConfiguration): ClerkClientLike;
}

const defaultDependencies: AuthenticateClerkRequestDependencies = {
  createClient: (configuration) => createClerkClient(configuration)
};

function readKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim();
  return key.length > 0 ? key : null;
}

export function createAuthenticateClerkRequest(dependencies: AuthenticateClerkRequestDependencies = defaultDependencies) {
  return async function authenticateClerkRequest(
    request: Request,
    env?: ClerkAuthEnvironment
  ): Promise<ClerkAuthenticationResult> {
    const publishableKey = readKey(env?.PUBLIC_CLERK_PUBLISHABLE_KEY);
    const secretKey = readKey(env?.CLERK_SECRET_KEY);

    if (!publishableKey || !secretKey) {
      return { ok: false, status: 503, error: 'Authentication is temporarily unavailable' };
    }

    try {
      const client = dependencies.createClient({
        publishableKey,
        secretKey,
        telemetry: { disabled: true }
      });
      const state = await client.authenticateRequest(request, {
        acceptsToken: 'session_token',
        authorizedParties: authorizedPartiesFor(request, publishableKey)
      });

      if (!state.isAuthenticated) {
        return { ok: false, status: 401, error: 'Unauthorized' };
      }

      const auth = state.toAuth();
      if (!auth || typeof auth.userId !== 'string' || auth.userId.length === 0 || typeof auth.sessionId !== 'string' || auth.sessionId.length === 0) {
        return { ok: false, status: 401, error: 'Unauthorized' };
      }

      return { ok: true, userId: auth.userId, sessionId: auth.sessionId };
    } catch {
      return { ok: false, status: 503, error: 'Authentication is temporarily unavailable' };
    }
  };
}

function authorizedPartiesFor(request: Request, publishableKey: string): string[] {
  const requestOrigin = new URL(request.url).origin;
  if (!publishableKey.startsWith('pk_live_') && CLERK_LOCAL_AUTHORIZED_PARTIES.some((party) => party === requestOrigin)) {
    return [requestOrigin];
  }
  return [...CLERK_PRODUCTION_AUTHORIZED_PARTIES];
}

export const authenticateClerkRequest = createAuthenticateClerkRequest();
