import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

const publicPackages = [
  { directory: 'packages/engine', name: '@schngn/engine' },
  { directory: 'packages/capability', name: '@schngn/capability' },
  { directory: 'apps/agent', name: '@schngn/agent' }
] as const;

describe('public package metadata', () => {
  for (const spec of publicPackages) {
    test(`${spec.name} ships a self-contained public package`, () => {
      const directory = join(repoRoot, spec.directory);
      const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));

      expect(manifest.name).toBe(spec.name);
      expect(manifest.private).not.toBe(true);
      expect(manifest.license).toBe('MIT');
      expect(manifest.publishConfig).toEqual({ access: 'public' });
      expect(manifest.engines).toMatchObject({ node: '>=24.0.0' });
      expect(manifest.files).toEqual(expect.arrayContaining(['dist', 'LICENSE', 'README.md']));
      expect(manifest.main).toBe('./dist/index.js');
      expect(manifest.types).toBe('./dist/index.d.ts');
      expect(manifest.exports['.']).toMatchObject({
        import: './dist/index.js',
        types: './dist/index.d.ts'
      });
      expect(manifest.repository).toMatchObject({
        directory: spec.directory,
        type: 'git',
        url: 'git+https://github.com/miktomic/schngn.git'
      });

      expect(existsSync(join(directory, 'LICENSE'))).toBe(true);
      expect(existsSync(join(directory, 'README.md'))).toBe(true);
      expect(readFileSync(join(directory, 'LICENSE'), 'utf8')).toStartWith('MIT License');

      for (const version of Object.values(manifest.dependencies ?? {})) {
        expect(version).not.toStartWith('workspace:');
      }
    });
  }

  test('the public dependency chain is versioned consistently', () => {
    const engine = manifest('packages/engine');
    const capability = manifest('packages/capability');
    const agent = manifest('apps/agent');

    expect(capability.dependencies['@schngn/engine']).toBe(engine.version);
    expect(agent.dependencies['@schngn/capability']).toBe(capability.version);
  });

  test('the agent build emits declaration files for its public export', () => {
    const agent = manifest('apps/agent');
    expect(agent.scripts.build).toContain('tsconfig.build.json');
    expect(existsSync(join(repoRoot, 'apps/agent/tsconfig.build.json'))).toBe(true);
  });

  test('the agent publishes normalized executable entries', () => {
    const agent = manifest('apps/agent');
    const bins = {
      schngn: 'dist/cli.js',
      'schngn-api': 'dist/api.js',
      'schngn-mcp': 'dist/mcp.js'
    };

    expect(agent.bin).toEqual(bins);

    for (const target of Object.values(bins)) {
      expect(readFileSync(join(repoRoot, 'apps/agent', target), 'utf8')).toStartWith(
        '#!/usr/bin/env node\n'
      );
    }
  });

  test('the repository exposes a packed-consumer release check', () => {
    const root = manifest('.');
    expect(root.scripts['release:packages:check']).toContain('verify-published-packages.mjs');
    expect(existsSync(join(repoRoot, 'scripts/verify-published-packages.mjs'))).toBe(true);
  });

  test('the repository exposes an anonymous public-registry consumer check', () => {
    const root = manifest('.');
    expect(root.scripts['release:packages:public-check']).toContain(
      'verify-published-packages.mjs --registry'
    );

    const verifier = readFileSync(
      join(repoRoot, 'scripts/verify-published-packages.mjs'),
      'utf8'
    );
    expect(verifier).toContain("'--userconfig'");
  });
});

function manifest(directory: string): Record<string, any> {
  return JSON.parse(readFileSync(join(repoRoot, directory, 'package.json'), 'utf8'));
}
