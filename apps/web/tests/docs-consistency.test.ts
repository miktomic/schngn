import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('project status documentation', () => {
  test('has one explicit production-readiness checklist', () => {
    expect(existsSync('docs/production-readiness.md')).toBe(true);
    const source = read('docs/production-readiness.md');
    expect(source).toContain('Repository release gate');
    expect(source).toContain('One-time production configuration');
    expect(source).toContain('Authenticated-write edge rate limiting');
    expect(source).toContain('Go/no-go decision');
  });

  test('does not retain known skeleton and obsolete backlog claims', () => {
    const architecture = read('docs/architecture.md');
    const repoStructure = read('docs/repo-structure.md');
    const board = read('docs/mvp-implementation-kanban.md');
    const readme = read('README.md');
    const agentContext = read('CLAUDE.md');
    const ci = read('docs/ci-cd.md');
    const cloudflare = read('docs/cloudflare-github-secrets-setup.md');

    expect(architecture).not.toContain('Created skeleton');
    expect(architecture).not.toContain('service worker/offline support later');
    expect(architecture).not.toContain('next serious implementation step');
    expect(repoStructure).not.toContain('PWA/service worker later');
    expect(repoStructure).not.toContain('## Next structure to add');
    expect(board).not.toContain('No implementation cards are done yet');
    expect(board).not.toContain('# Remaining pull order');
    expect(readme).not.toContain('provably-correct calculation engine');
    expect(agentContext).not.toContain('provider not finalized');
    expect(agentContext).not.toContain('analytics provider not finalized');
    expect(ci).not.toContain('KV-backed waitlist');
    expect(cloudflare).not.toContain('Add `www` later');
    expect(cloudflare).not.toContain('We choose D1 instead of KV');
  });

  test('does not claim direct EC calculator parity without captured provenance', () => {
    const accuracy = read('apps/web/src/lib/i18n/messages.ts');
    const fixtures = read('packages/engine/tests/fixtures/ec/README.md');

    expect(fixtures).toContain('independent day-set oracle');
    expect(accuracy).toContain('does not claim captured output parity');
    expect(accuracy).not.toContain('Validated against the European Commission');
  });
});
