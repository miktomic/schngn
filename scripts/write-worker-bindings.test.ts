import { afterEach, describe, expect, test } from 'bun:test';
import { lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  WORKER_BINDING_KEYS,
  writeWorkerBindings
} from './write-worker-bindings.mjs';

const temporaryDirectories: string[] = [];

const bindings = {
  PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_private_sentinel',
  CLERK_SECRET_KEY: 'sk_live_private_sentinel',
  CLERK_WEBHOOK_SIGNING_SECRET: 'webhook-private-sentinel',
  PUBLIC_TURNSTILE_SITE_KEY: 'turnstile-site-private-sentinel',
  TURNSTILE_SECRET_KEY: 'turnstile-private-sentinel'
};

function temporaryPath() {
  const directory = mkdtempSync(join(tmpdir(), 'schngn-bindings-'));
  temporaryDirectories.push(directory);
  return join(directory, 'schngn-worker-bindings.json');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('temporary production Worker bindings', () => {
  test('writes only the allowlisted bindings with owner-only permissions', () => {
    const path = temporaryPath();

    writeWorkerBindings(path, {
      ...bindings,
      UNRELATED_PRIVATE_VALUE: 'must-not-be-written'
    });

    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(bindings);
    expect(lstatSync(path).mode & 0o777).toBe(0o600);
    expect(Object.keys(bindings)).toEqual([...WORKER_BINDING_KEYS]);
  });

  test('fails without replacing an existing file', () => {
    const path = temporaryPath();
    writeWorkerBindings(path, bindings);

    expect(() => writeWorkerBindings(path, bindings)).toThrow();
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(bindings);
  });

  test('names an invalid binding without exposing its value', () => {
    const malformed = ' sk_live_private_sentinel ';
    const path = temporaryPath();
    let message = '';

    try {
      writeWorkerBindings(path, {
        ...bindings,
        CLERK_SECRET_KEY: malformed
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('CLERK_SECRET_KEY');
    expect(message).toContain('leading or trailing whitespace');
    expect(message).not.toContain(malformed);
    expect(message).not.toContain(malformed.trim());
  });

  test('rejects control characters without exposing the malformed value', () => {
    const malformed = 'webhook-private\u0000sentinel';
    const path = temporaryPath();
    let message = '';

    try {
      writeWorkerBindings(path, {
        ...bindings,
        CLERK_WEBHOOK_SIGNING_SECRET: malformed
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain('CLERK_WEBHOOK_SIGNING_SECRET');
    expect(message).toContain('control characters');
    expect(message).not.toContain('private');
  });
});
