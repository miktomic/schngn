import { describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';
import { validateInfisicalEnvironment } from './validate-infisical-env.mjs';

const script = resolve('scripts/validate-infisical-env.mjs');

function run(mode: string, values: Record<string, string>) {
  return Bun.spawnSync({
    cmd: [process.execPath, script, mode],
    env: {
      PATH: process.env.PATH ?? '',
      ...values
    },
    stdout: 'pipe',
    stderr: 'pipe'
  });
}

describe('Infisical environment validation', () => {
  test('accepts matching Clerk development keys without printing their values', () => {
    const publishable = 'pk_test_private_sentinel';
    const secret = 'sk_test_private_sentinel';
    const result = run('dev', {
      PUBLIC_CLERK_PUBLISHABLE_KEY: publishable,
      CLERK_SECRET_KEY: secret
    });
    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).toBe(0);
    expect(output).toContain('Infisical dev configuration is valid');
    expect(output).not.toContain(publishable);
    expect(output).not.toContain(secret);
  });

  test('reports missing names without exposing configured values', () => {
    const publishable = 'pk_test_private_sentinel';
    const result = run('dev', {
      PUBLIC_CLERK_PUBLISHABLE_KEY: publishable
    });
    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).toBe(1);
    expect(output).toContain('CLERK_SECRET_KEY');
    expect(output).not.toContain(publishable);
  });

  test('rejects development keys in the production environment', () => {
    const result = run('prod', {
      CLOUDFLARE_API_TOKEN: 'cloudflare-token',
      CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account',
      PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_wrong_environment',
      CLERK_SECRET_KEY: 'sk_test_wrong_environment',
      CLERK_WEBHOOK_SIGNING_SECRET: 'webhook-secret',
      PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-key',
      TURNSTILE_SECRET_KEY: 'turnstile-secret'
    });
    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).toBe(1);
    expect(output).toContain('PUBLIC_CLERK_PUBLISHABLE_KEY');
    expect(output).toContain('CLERK_SECRET_KEY');
    expect(output).not.toContain('pk_test_wrong_environment');
    expect(output).not.toContain('sk_test_wrong_environment');
  });

  test('accepts the complete production contract without printing any values', () => {
    const values = {
      CLOUDFLARE_API_TOKEN: 'cloudflare-private-sentinel',
      CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account-sentinel',
      PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_private_sentinel',
      CLERK_SECRET_KEY: 'sk_live_private_sentinel',
      CLERK_WEBHOOK_SIGNING_SECRET: 'webhook-private-sentinel',
      PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-private-sentinel',
      TURNSTILE_SECRET_KEY: 'turnstile-private-sentinel'
    };
    const result = run('prod', values);
    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).toBe(0);
    expect(output).toContain('Infisical prod configuration is valid (7 required values)');
    for (const value of Object.values(values)) {
      expect(output).not.toContain(value);
    }
  });

  test('rejects surrounding whitespace without exposing the malformed value', () => {
    const malformed = ' sk_live_private_sentinel ';
    const result = run('prod', {
      CLOUDFLARE_API_TOKEN: 'cloudflare-private-sentinel',
      CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account-sentinel',
      PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_private_sentinel',
      CLERK_SECRET_KEY: malformed,
      CLERK_WEBHOOK_SIGNING_SECRET: 'webhook-private-sentinel',
      PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-private-sentinel',
      TURNSTILE_SECRET_KEY: 'turnstile-private-sentinel'
    });
    const output = `${result.stdout.toString()}${result.stderr.toString()}`;

    expect(result.exitCode).toBe(1);
    expect(output).toContain('CLERK_SECRET_KEY');
    expect(output).toContain('leading or trailing whitespace');
    expect(output).not.toContain(malformed);
    expect(output).not.toContain(malformed.trim());
  });

  test('rejects control characters without exposing the malformed value', () => {
    const malformed = 'sk_live_private\u0000sentinel';
    const result = validateInfisicalEnvironment('prod', {
      CLOUDFLARE_API_TOKEN: 'cloudflare-private-sentinel',
      CLOUDFLARE_ACCOUNT_ID: 'cloudflare-account-sentinel',
      PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_private_sentinel',
      CLERK_SECRET_KEY: malformed,
      CLERK_WEBHOOK_SIGNING_SECRET: 'webhook-private-sentinel',
      PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-private-sentinel',
      TURNSTILE_SECRET_KEY: 'turnstile-private-sentinel'
    });
    const output = result.failures.join('\n');

    expect(result.failures).toHaveLength(1);
    expect(output).toContain('CLERK_SECRET_KEY');
    expect(output).toContain('control characters');
    expect(output).not.toContain('private');
  });
});
