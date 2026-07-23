import { describe, expect, test } from 'bun:test';
import {
  INFISICAL_API_BASE_URL,
  REQUIRED_PRODUCTION_KEYS,
  buildChildEnvironment,
  loadProductionSecrets,
  maskForGitHub,
  parseCommandArguments
} from './run-with-infisical-oidc.mjs';

const productionValues = {
  CLOUDFLARE_API_TOKEN: 'cloudflare-private-sentinel',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account-sentinel',
  PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_private_sentinel',
  CLERK_SECRET_KEY: 'sk_live_private_sentinel',
  CLERK_WEBHOOK_SIGNING_SECRET: 'webhook-private-sentinel',
  PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-private-sentinel',
  TURNSTILE_SECRET_KEY: 'turnstile-private-sentinel'
};

const oidcConfig = {
  identityId: '812097c6-b028-4a21-9af0-291ebc835cfa',
  projectId: '44e3b68f-6f17-458c-aaeb-da72b0faa793',
  audience: 'https://github.com/miktomic',
  oidcRequestUrl:
    'https://pipelines.actions.githubusercontent.com/example/idtoken?api-version=2.0',
  oidcRequestToken: 'github-oidc-request-private-sentinel'
};

function successfulFetch() {
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    calls.push({ url, init });

    if (url.hostname.endsWith('.actions.githubusercontent.com')) {
      return Response.json({ value: 'github-jwt-private-sentinel' });
    }

    if (url.pathname.endsWith('/v1/auth/oidc-auth/login')) {
      return Response.json({ accessToken: 'infisical-access-private-sentinel' });
    }

    if (url.pathname.endsWith('/v4/secrets')) {
      return Response.json({
        secrets: Object.entries(productionValues).map(([secretKey, secretValue]) => ({
          secretKey,
          secretValue
        }))
      });
    }

    return new Response(null, { status: 404 });
  };

  return { calls, fetchImpl };
}

describe('Infisical GitHub OIDC command wrapper', () => {
  test('parses an allowlisted key set and child command', () => {
    expect(
      parseCommandArguments([
        '--keys',
        'PUBLIC_CLERK_PUBLISHABLE_KEY,PUBLIC_TURNSTILE_SITE_KEY',
        '--',
        'bun',
        'run',
        'build'
      ])
    ).toEqual({
      keys: ['PUBLIC_CLERK_PUBLISHABLE_KEY', 'PUBLIC_TURNSTILE_SITE_KEY'],
      command: ['bun', 'run', 'build']
    });

    expect(() =>
      parseCommandArguments(['--keys', 'UNAPPROVED_VALUE', '--', 'bun', 'run', 'build'])
    ).toThrow('Unsupported Infisical key: UNAPPROVED_VALUE');
  });

  test('exchanges GitHub OIDC in memory and validates the complete production set', async () => {
    const { calls, fetchImpl } = successfulFetch();
    const result = await loadProductionSecrets(oidcConfig, { fetchImpl });

    expect(result).toEqual(productionValues);
    expect(calls).toHaveLength(3);
    expect(calls[0]?.url.searchParams.get('audience')).toBe('https://github.com/miktomic');
    expect(calls[0]?.init?.headers).toEqual({
      Accept: 'application/json',
      Authorization: `Bearer ${oidcConfig.oidcRequestToken}`
    });
    expect(calls[0]?.init?.redirect).toBe('error');
    expect(calls[1]?.url.toString()).toBe(
      `${INFISICAL_API_BASE_URL}/v1/auth/oidc-auth/login`
    );
    expect(JSON.parse(String(calls[1]?.init?.body))).toEqual({
      identityId: oidcConfig.identityId,
      jwt: 'github-jwt-private-sentinel'
    });
    expect(calls[1]?.init?.redirect).toBe('error');
    expect(calls[2]?.init?.headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer infisical-access-private-sentinel'
    });
    expect(calls[2]?.init?.redirect).toBe('error');
    for (const call of calls) {
      expect(call.init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(calls[2]?.url.searchParams.get('environment')).toBe('prod');
    expect(calls[2]?.url.searchParams.get('secretPath')).toBe('/apps/web');
    expect(calls[2]?.url.searchParams.get('recursive')).toBe('false');
    expect(calls[2]?.url.searchParams.get('includeImports')).toBe('false');
  });

  test('rejects an untrusted GitHub token URL before making a request', async () => {
    for (const oidcRequestUrl of [
      'https://example.com/steal-token',
      'http://token.actions.githubusercontent.com/steal-token',
      'https://token.actions.githubusercontent.com.evil.example/steal-token',
      'https://user:password@token.actions.githubusercontent.com/steal-token',
      'https://token.actions.githubusercontent.com:444/steal-token'
    ]) {
      let fetchCount = 0;

      await expect(
        loadProductionSecrets(
          {
            ...oidcConfig,
            oidcRequestUrl
          },
          {
            fetchImpl: async () => {
              fetchCount += 1;
              return new Response(null, { status: 500 });
            }
          }
        )
      ).rejects.toThrow('GitHub OIDC request URL is not trusted');

      expect(fetchCount).toBe(0);
    }
  });

  test('reports only the failed stage and status, never an API response body', async () => {
    const responseBody = 'server-returned-private-sentinel';
    const fetchImpl = async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : input.toString());
      if (url.hostname.endsWith('.actions.githubusercontent.com')) {
        return Response.json({ value: 'github-jwt-private-sentinel' });
      }
      return new Response(responseBody, { status: 403 });
    };

    let message = '';
    try {
      await loadProductionSecrets(oidcConfig, { fetchImpl });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toBe('Infisical OIDC login failed with HTTP 403');
    expect(message).not.toContain(responseBody);
  });

  test('passes only requested values to the child and strips authentication material', () => {
    const child = buildChildEnvironment(
      {
        PATH: '/usr/bin',
        ACTIONS_ID_TOKEN_REQUEST_URL: oidcConfig.oidcRequestUrl,
        ACTIONS_ID_TOKEN_REQUEST_TOKEN: oidcConfig.oidcRequestToken,
        INFISICAL_IDENTITY_ID: oidcConfig.identityId,
        INFISICAL_PROJECT_ID: oidcConfig.projectId,
        CLERK_SECRET_KEY: 'stale-github-copy',
        GH_TOKEN: 'unrelated-private-sentinel',
        NPM_TOKEN: 'unrelated-private-sentinel',
        AWS_SECRET_ACCESS_KEY: 'unrelated-private-sentinel',
        UNRELATED_VALUE: 'not-needed'
      },
      productionValues,
      ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']
    );

    expect(child.PATH).toBe('/usr/bin');
    expect(child.CLOUDFLARE_API_TOKEN).toBe(productionValues.CLOUDFLARE_API_TOKEN);
    expect(child.CLOUDFLARE_ACCOUNT_ID).toBe(productionValues.CLOUDFLARE_ACCOUNT_ID);
    expect(child.CLERK_SECRET_KEY).toBeUndefined();
    expect(child.ACTIONS_ID_TOKEN_REQUEST_URL).toBeUndefined();
    expect(child.ACTIONS_ID_TOKEN_REQUEST_TOKEN).toBeUndefined();
    expect(child.INFISICAL_IDENTITY_ID).toBeUndefined();
    expect(child.INFISICAL_PROJECT_ID).toBeUndefined();
    expect(child.GH_TOKEN).toBeUndefined();
    expect(child.NPM_TOKEN).toBeUndefined();
    expect(child.AWS_SECRET_ACCESS_KEY).toBeUndefined();
    expect(child.UNRELATED_VALUE).toBeUndefined();

    expect(Object.keys(productionValues).sort()).toEqual([...REQUIRED_PRODUCTION_KEYS].sort());
  });

  test('escapes GitHub workflow command characters when masking', () => {
    expect(maskForGitHub('percent%line\r\nnext')).toBe('percent%25line%0D%0Anext');
  });

  test('rejects an invalid request timeout before making a request', async () => {
    let fetchCount = 0;

    await expect(
      loadProductionSecrets(oidcConfig, {
        timeoutMs: 0,
        fetchImpl: async () => {
          fetchCount += 1;
          return new Response(null, { status: 500 });
        }
      })
    ).rejects.toThrow('Request timeout is invalid');

    expect(fetchCount).toBe(0);
  });
});
