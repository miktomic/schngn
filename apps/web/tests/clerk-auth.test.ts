import { describe, expect, test } from 'bun:test';
import {
  CLERK_LOCAL_AUTHORIZED_PARTIES,
  CLERK_PRODUCTION_AUTHORIZED_PARTIES,
  createAuthenticateClerkRequest,
  type ClerkAuthEnvironment
} from '../src/lib/auth/authenticateRequest';

const configuredEnv: ClerkAuthEnvironment = {
  PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example',
  CLERK_SECRET_KEY: 'sk_test_example'
};

describe('Clerk authenticated request boundary', () => {
  test('accepts only a verified Clerk user session and returns its server-derived owner id', async () => {
    const calls: Array<{ request: Request; options: Record<string, unknown> }> = [];
    const authenticateClerkRequest = createAuthenticateClerkRequest({
      createClient(configuration) {
        expect(configuration).toEqual({
          publishableKey: 'pk_test_example',
          secretKey: 'sk_test_example',
          telemetry: { disabled: true }
        });
        return {
          async authenticateRequest(request, options) {
            calls.push({ request, options });
            return {
              isAuthenticated: true,
              toAuth: () => ({ userId: 'user_verified', sessionId: 'sess_verified' })
            };
          }
        };
      }
    });
    const request = new Request('https://schngn.com/api/account/trips', {
      headers: { authorization: 'Bearer test-session-token' }
    });

    await expect(authenticateClerkRequest(request, configuredEnv)).resolves.toEqual({
      ok: true,
      userId: 'user_verified',
      sessionId: 'sess_verified'
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.request).toBe(request);
    expect(calls[0]?.options).toEqual({
      acceptsToken: 'session_token',
      authorizedParties: CLERK_PRODUCTION_AUTHORIZED_PARTIES
    });
  });

  test('uses a fixed origin allowlist instead of trusting the request Host', () => {
    expect(CLERK_PRODUCTION_AUTHORIZED_PARTIES).toEqual([
      'https://schngn.com',
      'https://www.schngn.com'
    ]);
    expect(CLERK_LOCAL_AUTHORIZED_PARTIES).toEqual([
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:4173',
      'http://localhost:4173'
    ]);
    expect([...CLERK_PRODUCTION_AUTHORIZED_PARTIES, ...CLERK_LOCAL_AUTHORIZED_PARTIES]).not.toContain('https://attacker.example');
  });

  test('allows only the exact local request origin for non-live development keys', async () => {
    let authorizedParties: string[] = [];
    const authenticateClerkRequest = createAuthenticateClerkRequest({
      createClient: () => ({
        async authenticateRequest(_request, options) {
          authorizedParties = options.authorizedParties;
          return { isAuthenticated: false, toAuth: () => null };
        }
      })
    });

    await authenticateClerkRequest(new Request('http://127.0.0.1:5173/api/account/trips'), configuredEnv);
    expect(authorizedParties).toEqual(['http://127.0.0.1:5173']);
  });

  test('never authorizes localhost parties when the live production key is configured', async () => {
    let authorizedParties: string[] = [];
    const authenticateClerkRequest = createAuthenticateClerkRequest({
      createClient: () => ({
        async authenticateRequest(_request, options) {
          authorizedParties = options.authorizedParties;
          return { isAuthenticated: false, toAuth: () => null };
        }
      })
    });

    await authenticateClerkRequest(new Request('http://127.0.0.1:5173/api/account/trips'), {
      PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_example',
      CLERK_SECRET_KEY: 'test-server-secret'
    });
    expect(authorizedParties).toEqual([...CLERK_PRODUCTION_AUTHORIZED_PARTIES]);
  });

  test('rejects signed-out, machine, and malformed auth states without trusting client user data', async () => {
    for (const state of [
      { isAuthenticated: false, toAuth: () => ({ userId: null, sessionId: null }) },
      { isAuthenticated: true, toAuth: () => ({ userId: '', sessionId: 'sess_123' }) },
      { isAuthenticated: true, toAuth: () => ({ userId: 'user_123', sessionId: null }) }
    ]) {
      const authenticateClerkRequest = createAuthenticateClerkRequest({
        createClient: () => ({ authenticateRequest: async () => state })
      });

      await expect(
        authenticateClerkRequest(
          new Request('https://schngn.com/api/account/trips', {
            method: 'POST',
            body: JSON.stringify({ userId: 'client_supplied_owner' })
          }),
          configuredEnv
        )
      ).resolves.toEqual({ ok: false, status: 401, error: 'Unauthorized' });
    }
  });

  test('fails closed before verification when either Worker binding is absent', async () => {
    let verifierCalled = false;
    const authenticateClerkRequest = createAuthenticateClerkRequest({
      createClient: () => {
        verifierCalled = true;
        throw new Error('must not be called');
      }
    });

    for (const env of [undefined, {}, { CLERK_SECRET_KEY: 'sk_test_example' }, { PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example' }]) {
      await expect(authenticateClerkRequest(new Request('https://schngn.com/api/account/trips'), env)).resolves.toEqual({
        ok: false,
        status: 503,
        error: 'Authentication is temporarily unavailable'
      });
    }
    expect(verifierCalled).toBe(false);
  });

  test('does not expose verifier failures or key material', async () => {
    const authenticateClerkRequest = createAuthenticateClerkRequest({
      createClient: () => ({
        authenticateRequest: async () => {
          throw new Error('network error with sk_test_example');
        }
      })
    });

    await expect(authenticateClerkRequest(new Request('https://schngn.com/api/account/trips'), configuredEnv)).resolves.toEqual({
      ok: false,
      status: 503,
      error: 'Authentication is temporarily unavailable'
    });
  });
});
