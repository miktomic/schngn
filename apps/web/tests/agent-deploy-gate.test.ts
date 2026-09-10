import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, test } from 'bun:test';

const root = resolve(import.meta.dirname, '../../..');
const cases = [['apps/web/package.json', 'deploy']];
const stub = `#!/bin/sh
printf '%s %s\\n' "\${0##*/}" "$*" >> "$AUDIT_LOG"
case "$*" in *check-preview.mjs*) exit "$AUDIT_GATE_EXIT" ;; esac
exit 0
`;

for (const [file, script] of cases) {
  test(`${script} checks its build and blocks upload on readiness failure`, () => {
    const folder = mkdtempSync(resolve(tmpdir(), 'agent-deploy-gate-'));
    try {
      for (const name of ['bun', 'node', 'wrangler', 'opennextjs-cloudflare']) {
        const path = resolve(folder, name);
        writeFileSync(path, stub);
        chmodSync(path, 0o755);
      }
      const command = JSON.parse(readFileSync(resolve(root, file), 'utf8')).scripts[script];
      for (const fail of [true, false]) {
        const log = resolve(folder, 'events');
        writeFileSync(log, '');
        // Only inert executables are on PATH. No build or upload can run here.
        const result = spawnSync('/bin/sh', ['-c', command], {
          cwd: folder,
          env: { PATH: folder, NODE_ENV: "test", AUDIT_LOG: log, AUDIT_GATE_EXIT: fail ? '42' : '0' },
          encoding: 'utf8',
        });
        const events = readFileSync(log, 'utf8').trim().split('\n');
        const gate = events.findIndex((line) => line.includes('check-preview.mjs'));
        const build = events.findLastIndex((line) => line.includes('build'));
        const upload = events.findIndex((line) => line.startsWith('wrangler deploy') || line.includes('pages deploy') || line.startsWith('opennextjs-cloudflare deploy'));
        expect(gate).toBeGreaterThan(build);
        expect(build).toBeGreaterThanOrEqual(0);
        expect(result.status).toBe(fail ? 42 : 0);
        if (fail) expect(upload).toBe(-1);
        else expect(upload).toBeGreaterThan(gate);
      }
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });
}
