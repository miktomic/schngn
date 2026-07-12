import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('optional account operations contract', () => {
  test('documents the guest and signed-in data boundary as an explicit scope change', () => {
    const architecture = read('docs/architecture.md');
    const decisions = read('docs/product-decisions.md');
    const board = read('docs/mvp-implementation-kanban.md');
    const agentContext = read('CLAUDE.md');

    for (const source of [architecture, decisions, board, agentContext]) {
      expect(source).toContain('Clerk');
      expect(source).toContain('signup-and-save');
      expect(source).toContain('Clerk user ID');
    }

    expect(decisions).toContain('DEC-10');
    expect(decisions).toContain('scope change');
    expect(board).toContain('Optional accounts and authenticated sync');
    expect(board).toContain('guest trips remain local-only');
    expect(agentContext).toContain('Never accept a client-supplied owner');
  });

  test('keeps account storage, signup, analytics, export, and deletion boundaries explicit', () => {
    const architecture = read('docs/architecture.md');
    const readiness = read('docs/production-readiness.md');
    const readme = read('README.md');
    const app = read('apps/web/src/routes/app/+page.svelte');

    for (const source of [architecture, readiness, readme]) {
      expect(source).toContain('optional');
      expect(source).toContain('local-only');
      expect(source).toContain('export');
      expect(source).toContain('deletion');
    }

    expect(architecture).toContain('There is no SCHNGN-managed email waitlist');
    expect(architecture).toContain('use Clerk signup directly');
    expect(architecture).toContain('no trip data in analytics or logs');
    expect(readiness).toContain('signed-in user');
    expect(app).toContain("accountSignedIn ? recordUnlockBuyIntent() : void startAccountSignUp()");
  });

  test('declares required Worker secrets and ignores every local Wrangler secret file', () => {
    const wrangler = read('apps/web/wrangler.jsonc');
    const gitignore = read('.gitignore');

    expect(wrangler).toContain('"secrets"');
    expect(wrangler).toContain('"CLERK_SECRET_KEY"');
    expect(wrangler).toContain('"CLERK_WEBHOOK_SIGNING_SECRET"');
    expect(wrangler).toContain('"PUBLIC_TURNSTILE_SITE_KEY"');
    expect(wrangler).toContain('"TURNSTILE_SECRET_KEY"');
    expect(wrangler).toContain('"CONTACT_EMAIL"');
    expect(wrangler).toContain('"CONTACT_RATE_LIMITER"');
    expect(gitignore).toContain('.dev.vars*');
  });

  test('delivers Clerk configuration without committing or immediately deploying secrets', () => {
    const ci = read('.github/workflows/ci.yml');

    expect(ci).toContain('PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ vars.PUBLIC_CLERK_PUBLISHABLE_KEY }}');
    expect(ci).toContain('CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}');
    expect(ci).toContain('CLERK_WEBHOOK_SIGNING_SECRET: ${{ secrets.CLERK_WEBHOOK_SIGNING_SECRET }}');
    expect(ci).toContain('PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.PUBLIC_TURNSTILE_SITE_KEY }}');
    expect(ci).toContain('TURNSTILE_SECRET_KEY: ${{ secrets.TURNSTILE_SECRET_KEY }}');
    expect(ci).toContain('${RUNNER_TEMP}');
    expect(ci).toContain('umask 077');
    expect(ci).toContain('--secrets-file');
    expect(ci).toContain('if: ${{ always() }}');
    expect(ci).toContain('run: rm -f -- "${RUNNER_TEMP}/schngn-worker-bindings.json"');
    expect(ci).not.toContain('GITHUB_OUTPUT');
    expect(ci).not.toContain('steps.clerk-worker-bindings.outputs');
    expect(ci).not.toContain('wrangler secret put');

    const prepare = ci.indexOf('Prepare Clerk Worker bindings');
    const inactiveUpload = ci.indexOf('wrangler versions upload --secrets-file');
    const migration = ci.indexOf('Apply D1 migrations');
    const activeDeploy = ci.indexOf('wrangler deploy --secrets-file');
    const cleanup = ci.indexOf('Remove temporary Worker bindings');
    expect(prepare).toBeLessThan(inactiveUpload);
    expect(inactiveUpload).toBeLessThan(migration);
    expect(migration).toBeLessThan(activeDeploy);
    expect(activeDeploy).toBeLessThan(cleanup);
  });

  test('limits Cloudflare credentials to deployment operations behind a boolean gate', () => {
    const ci = read('.github/workflows/ci.yml');
    const deployJob = ci.slice(ci.indexOf('  deploy-production:'));
    const jobEnvironment = deployJob.match(/\n    env:\n([\s\S]*?)\n    steps:/)?.[1] ?? '';

    expect(jobEnvironment).toContain('CLOUDFLARE_DEPLOY_CONFIGURED:');
    expect(jobEnvironment).not.toContain('CLOUDFLARE_API_TOKEN:');
    expect(jobEnvironment).not.toContain('CLOUDFLARE_ACCOUNT_ID:');
    expect(ci).not.toMatch(/^\s*if:.*secrets\./m);

    const cloudflareTokenBindings = ci.match(/^          CLOUDFLARE_API_TOKEN:/gm) ?? [];
    const cloudflareAccountBindings = ci.match(/^          CLOUDFLARE_ACCOUNT_ID:/gm) ?? [];
    expect(cloudflareTokenBindings).toHaveLength(4);
    expect(cloudflareAccountBindings).toHaveLength(4);

    for (const step of [
      'Provision Cloudflare resources without changing production traffic',
      'Apply D1 migrations',
      'Deploy to Cloudflare Workers',
      'Configure canonical www redirect'
    ]) {
      const start = ci.indexOf(`      - name: ${step}`);
      const end = ci.indexOf('\n      - name:', start + 1);
      const block = ci.slice(start, end === -1 ? undefined : end);
      expect(block).toContain('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}');
      expect(block).toContain('CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID || secrets.CLOUDFLARE_ACCOUNT_ID }}');
      expect(block).toContain("if: ${{ env.CLOUDFLARE_DEPLOY_CONFIGURED == 'true' }}");
    }

    const smokeStart = ci.indexOf('      - name: Run production smoke checks');
    const smokeEnd = ci.indexOf('\n      - name:', smokeStart + 1);
    const smokeBlock = ci.slice(smokeStart, smokeEnd);
    expect(smokeBlock).toContain("if: ${{ env.CLOUDFLARE_DEPLOY_CONFIGURED == 'true' }}");
    expect(smokeBlock).not.toContain('CLOUDFLARE_API_TOKEN:');
    expect(smokeBlock).not.toContain('CLOUDFLARE_ACCOUNT_ID:');
  });

  test('pins every third-party action to an audited commit while retaining release comments', () => {
    const ci = read('.github/workflows/ci.yml');
    const actionLines = ci.split('\n').filter((line) => line.trimStart().startsWith('uses:'));

    expect(actionLines).toHaveLength(6);
    for (const line of actionLines) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+(?:\.\d+){0,2}$/);
    }
    expect(ci).toContain('actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0');
    expect(ci).toContain('actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0');
    expect(ci).toContain('oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0');
  });

  test('contains binding names but no live Clerk credential literals', () => {
    const sources = [
      '.github/workflows/ci.yml',
      'apps/web/wrangler.jsonc',
      'CLAUDE.md',
      'README.md',
      'docs/ci-cd.md',
      'docs/cloudflare-github-secrets-setup.md',
      'docs/production-readiness.md'
    ].map(read).join('\n');

    expect(sources).not.toMatch(/(?:pk|sk)_live_[A-Za-z0-9_-]+/);
    expect(sources).not.toMatch(/whsec_[A-Za-z0-9_-]+/);
  });
});
