import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliPath = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));

describe('SCHNGN JSON CLI', () => {
  test('calculates usage from stdin with stdout reserved for the result', async () => {
    const run = await runCli('usage', {
      includeCountedDays: false,
      referenceDate: '2026-03-31',
      stays: [{ entryDate: '2026-01-01', exitDate: '2026-03-31' }]
    });

    expect(run.exitCode).toBe(0);
    expect(run.stderr).toBe('');
    expect(JSON.parse(run.stdout)).toMatchObject({
      result: { daysUsed: 90, status: 'at_limit' },
      ruleSet: 'ordinary-schengen-90-180/v1',
      schemaVersion: '1'
    });
  });

  test('supports candidate checks and latest-exit planning', async () => {
    const check = await runCli('check-stay', {
      candidateStay: { entryDate: '2026-04-01', exitDate: '2026-04-02' },
      existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-30' }]
    });
    expect(JSON.parse(check.stdout)).toMatchObject({
      result: { firstOverLimitDate: '2026-04-02', safeForEveryDay: false }
    });

    const latest = await runCli('latest-exit', { entryDate: '2026-10-01', existingStays: [] });
    expect(JSON.parse(latest.stdout)).toMatchObject({
      result: { latestSafeExitDate: '2026-12-29' }
    });
  });

  test('returns safe structured errors without input values or stack traces', async () => {
    const run = await runCli('usage', {
      ownerId: 'owner-secret-value',
      referenceDate: '2026-05-07',
      stays: []
    });

    expect(run.exitCode).toBe(2);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('invalid_request');
    expect(run.stderr).not.toContain('owner-secret-value');
    expect(run.stderr).not.toContain('2026-05-07');
    expect(run.stderr).not.toContain(' at ');
  });

  test('reports malformed JSON as a stable CLI error', async () => {
    const child = Bun.spawn({
      cmd: [process.execPath, cliPath, 'usage'],
      stderr: 'pipe',
      stdin: 'pipe',
      stdout: 'pipe'
    });
    child.stdin.write('{not json');
    child.stdin.end();
    const [exitCode, stderr] = await Promise.all([
      child.exited,
      new Response(child.stderr).text()
    ]);

    expect(exitCode).toBe(2);
    expect(JSON.parse(stderr)).toEqual({ error: { code: 'invalid_json' }, schemaVersion: '1' });
  });

  test('runs when a package manager invokes it through a bin symlink', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'schngn-cli-symlink-'));
    const outputDirectory = join(directory, 'dist');
    const symlinkPath = join(directory, 'schngn');

    try {
      const build = Bun.spawn({
        cmd: [
          process.execPath,
          'build',
          cliPath,
          '--target=node',
          '--format=esm',
          `--outdir=${outputDirectory}`
        ],
        cwd: repoRoot,
        stderr: 'pipe',
        stdout: 'pipe'
      });
      const [buildExitCode, buildStderr] = await Promise.all([
        build.exited,
        new Response(build.stderr).text()
      ]);
      expect(buildExitCode, buildStderr).toBe(0);
      symlinkSync(join(outputDirectory, 'cli.js'), symlinkPath);

      const child = Bun.spawn({
        cmd: [Bun.which('node') ?? 'node', symlinkPath, 'version'],
        stderr: 'pipe',
        stdout: 'pipe'
      });
      const [exitCode, stderr, stdout] = await Promise.all([
        child.exited,
        new Response(child.stderr).text(),
        new Response(child.stdout).text()
      ]);

      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      expect(stdout).toBe('0.1.1\n');
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});

async function runCli(command: string, input: unknown): Promise<{
  exitCode: number;
  stderr: string;
  stdout: string;
}> {
  const child = Bun.spawn({
    cmd: [process.execPath, cliPath, command],
    stderr: 'pipe',
    stdin: 'pipe',
    stdout: 'pipe'
  });
  child.stdin.write(JSON.stringify(input));
  child.stdin.end();
  const [exitCode, stderr, stdout] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
    new Response(child.stdout).text()
  ]);
  return { exitCode, stderr, stdout };
}
