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
    expect(app).toContain('class="signup-value-section"');
    expect(app).toContain('onclick={startAccountSignUp}');
    expect(app).not.toContain('recordUnlockBuyIntent');
    expect(app).toContain("result.reason === 'missing_publishable_key'");
    expect(app).toContain("rt('signInUnavailable')");
  });

  test('declares required Worker secrets and the value-free Infisical local setup', () => {
    const wrangler = read('apps/web/wrangler.jsonc');
    const gitignore = read('.gitignore');
    const example = read('apps/web/.env.example');
    const infisical = read('.infisical.json');
    const packageJson = read('package.json');
    const svelteConfig = read('apps/web/svelte.config.js');
    const setup = read('docs/cloudflare-github-secrets-setup.md');

    expect(wrangler).toContain('"secrets"');
    expect(wrangler).toContain('"CLERK_SECRET_KEY"');
    expect(wrangler).toContain('"CLERK_WEBHOOK_SIGNING_SECRET"');
    expect(wrangler).toContain('"PUBLIC_TURNSTILE_SITE_KEY"');
    expect(wrangler).toContain('"TURNSTILE_SECRET_KEY"');
    expect(wrangler).toContain('"CONTACT_EMAIL"');
    expect(wrangler).toContain('"CONTACT_RATE_LIMITER"');
    expect(gitignore).toContain('.env.*');
    expect(gitignore).toContain('.dev.vars*');
    expect(example).toContain('PUBLIC_CLERK_PUBLISHABLE_KEY=');
    expect(example).toContain('CLERK_SECRET_KEY=');
    expect(example).not.toMatch(/pk_(?:test|live)_[A-Za-z0-9_-]{8,}/);
    expect(example).not.toMatch(/sk_(?:test|live)_[A-Za-z0-9_-]{8,}/);
    expect(infisical).toContain('"workspaceId": "44e3b68f-6f17-458c-aaeb-da72b0faa793"');
    expect(infisical).not.toContain('token');
    expect(packageJson).toContain('"dev:infisical"');
    expect(packageJson).toContain('"secrets:check:dev"');
    expect(packageJson).toContain('"secrets:check:prod"');
    expect(svelteConfig).toContain("platformProxy: { envFiles: ['.env.local'] }");
    expect(setup).toContain('Infisical `dev` `/apps/web` is the single source of truth');
    expect(setup).toContain('bun run dev:infisical');
    expect(setup).toContain('bun run secrets:check:dev');
  });

  test('fetches production values directly from Infisical with job-scoped GitHub OIDC', () => {
    const ci = read('.github/workflows/ci.yml');
    const loader = read('scripts/run-with-infisical-oidc.mjs');
    const deployJob = ci.slice(ci.indexOf('  deploy-production:'));

    expect(deployJob).toContain('permissions:\n      contents: read\n      id-token: write');
    expect(ci.match(/id-token: write/g)).toHaveLength(1);
    expect(deployJob).toContain(
      'concurrency:\n      group: schngn-production\n      cancel-in-progress: false'
    );
    expect(deployJob).toContain('timeout-minutes: 30');
    expect(deployJob).toContain('INFISICAL_IDENTITY_ID: 812097c6-b028-4a21-9af0-291ebc835cfa');
    expect(deployJob).toContain('INFISICAL_PROJECT_ID: 44e3b68f-6f17-458c-aaeb-da72b0faa793');
    expect(deployJob).toContain('INFISICAL_OIDC_AUDIENCE: https://github.com/miktomic');
    expect(ci).toContain('scripts/run-with-infisical-oidc.mjs');
    expect(ci).not.toContain('${{ secrets.');
    expect(ci).not.toContain('${{ vars.');
    expect(ci).not.toContain('INFISICAL_TOKEN');
    expect(ci).not.toContain('CLOUDFLARE_DEPLOY_CONFIGURED');
    expect(ci).not.toContain('Skip deploy');
    expect(loader).toContain("const INFISICAL_ENVIRONMENT = 'prod'");
    expect(loader).toContain("const INFISICAL_SECRET_PATH = '/apps/web'");
    for (const name of [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
      'PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'CLERK_WEBHOOK_SIGNING_SECRET',
      'PUBLIC_TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY'
    ]) {
      expect(read('scripts/validate-infisical-env.mjs')).toContain(name);
    }
    expect(ci).toContain('${RUNNER_TEMP}');
    expect(ci).toContain('umask 077');
    expect(ci).toContain('--secrets-file');
    expect(ci).toContain('if: ${{ always() }}');
    expect(ci).toContain('run: rm -f -- "${RUNNER_TEMP}/schngn-worker-bindings.json"');
    expect(ci).not.toContain('GITHUB_OUTPUT');
    expect(ci).not.toContain('steps.clerk-worker-bindings.outputs');
    expect(ci).not.toContain('wrangler secret put');

    const firstPrepare = ci.indexOf('Prepare Worker bindings for inactive upload');
    const inactiveUpload = ci.indexOf('wrangler versions upload');
    const firstCleanup = ci.indexOf('Remove inactive Worker bindings');
    const migration = ci.indexOf('Apply D1 migrations');
    const secondPrepare = ci.indexOf('Prepare Worker bindings for deployment');
    const activeDeploy = ci.indexOf('wrangler deploy');
    const secondCleanup = ci.indexOf('Remove deployment Worker bindings');
    expect(firstPrepare).toBeLessThan(inactiveUpload);
    expect(inactiveUpload).toBeLessThan(firstCleanup);
    expect(firstCleanup).toBeLessThan(migration);
    expect(migration).toBeLessThan(secondPrepare);
    expect(secondPrepare).toBeLessThan(activeDeploy);
    expect(activeDeploy).toBeLessThan(secondCleanup);
  });

  test('passes only the values each production operation requires', () => {
    const ci = read('.github/workflows/ci.yml');
    const deployJob = ci.slice(ci.indexOf('  deploy-production:'));
    const stepBlock = (name: string) => {
      const start = deployJob.indexOf(`      - name: ${name}`);
      const end = deployJob.indexOf('\n      - name:', start + 1);
      return deployJob.slice(start, end === -1 ? undefined : end);
    };

    expect(stepBlock('Build packages and app')).toContain(
      '--keys PUBLIC_CLERK_PUBLISHABLE_KEY,PUBLIC_TURNSTILE_SITE_KEY'
    );
    for (const step of [
      'Prepare Worker bindings for inactive upload',
      'Prepare Worker bindings for deployment'
    ]) {
      expect(stepBlock(step)).toContain(
        '--keys PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,CLERK_WEBHOOK_SIGNING_SECRET,PUBLIC_TURNSTILE_SITE_KEY,TURNSTILE_SECRET_KEY'
      );
      expect(stepBlock(step)).toContain(
        'node scripts/write-worker-bindings.mjs "${secrets_file}"'
      );
    }

    for (const step of [
      'Provision Cloudflare resources without changing production traffic',
      'Apply D1 migrations',
      'Deploy to Cloudflare Workers',
      'Configure canonical www redirect'
    ]) {
      const block = stepBlock(step);
      expect(block).toContain('--keys CLOUDFLARE_API_TOKEN,CLOUDFLARE_ACCOUNT_ID');
      expect(block).not.toContain('CLERK_SECRET_KEY');
      expect(block).not.toContain('TURNSTILE_SECRET_KEY');
    }

    const smokeBlock = stepBlock('Run production smoke checks');
    expect(smokeBlock).not.toContain('run-with-infisical-oidc');
    expect(smokeBlock).not.toContain('CLOUDFLARE_API_TOKEN:');
    expect(smokeBlock).not.toContain('CLOUDFLARE_ACCOUNT_ID:');

    const migrationBlock = stepBlock('Apply D1 migrations');
    expect(migrationBlock).not.toContain('schngn-worker-bindings.json');
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
    expect(ci.match(/persist-credentials: false/g)).toHaveLength(2);
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
