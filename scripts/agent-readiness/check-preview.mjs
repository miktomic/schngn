import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const wrangler = resolve(root, 'apps/web/node_modules/wrangler/bin/wrangler.js');
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
async function availablePort() {
  const server = createServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  return port;
}
async function preview(args) {
  const port = await availablePort();
  let logs = '';
  const child = spawn(process.execPath, [wrangler, ...args, '--port', String(port), '--inspector-port', '0'], {
    cwd: resolve(root, 'apps/web'),
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', BROWSER: 'none' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (data) => { logs = `${logs}${data}`.slice(-12000); });
  child.stderr.on('data', (data) => { logs = `${logs}${data}`.slice(-12000); });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      if (child.exitCode !== null) throw new Error(`Preview exited with ${child.exitCode}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/robots.txt`, { signal: AbortSignal.timeout(1000) });
        await response.arrayBuffer();
        ready = true;
        break;
      } catch { await sleep(500); }
    }
    if (!ready) throw new Error('Preview did not start within 60 seconds');
    const check = spawn(process.execPath, [resolve(root, 'scripts/agent-readiness/smoke.mjs'), `http://127.0.0.1:${port}`], { cwd: root, stdio: 'inherit' });
    const code = await new Promise((done, reject) => { check.once('error', reject); check.once('exit', done); });
    if (code !== 0) throw new Error(`Agent readiness smoke exited with ${code}`);
  } catch (error) {
    // Wrangler may print binding names. Never dump environment values or raw logs.
    const diagnostic = logs.split('\n').filter((line) => /ERROR|Error:|Address already in use/.test(line)).join('\n');
    throw new Error(`${error.message}\n${diagnostic}`);
  } finally {
    child.kill('SIGTERM');
    await Promise.race([new Promise((done) => child.once('exit', done)), sleep(5000)]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
}
await preview(['dev', '--local']);
