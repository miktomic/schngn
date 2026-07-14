import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageDirectories = ['packages/engine', 'packages/capability', 'apps/agent'];
const registryMode = process.argv.includes('--registry');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'schngn-package-check-'));
const packageManifests = packageDirectories.map((directory) => ({
  directory,
  manifest: JSON.parse(readFileSync(resolve(repoRoot, directory, 'package.json'), 'utf8'))
}));

try {
  const packageSources = registryMode
    ? packageManifests.map(({ manifest }) => `${manifest.name}@${manifest.version}`)
    : packageDirectories.map((directory) => pack(directory));
  const consumerRoot = join(temporaryRoot, 'consumer');
  mkdirSync(consumerRoot);
  writeFileSync(
    join(consumerRoot, 'package.json'),
    `${JSON.stringify({ name: 'schngn-package-consumer', private: true, type: 'module' }, null, 2)}\n`
  );

  const installArguments = [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--save-exact'
  ];

  if (registryMode) {
    installArguments.push(
      '--registry',
      'https://registry.npmjs.org/',
      '--userconfig',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
      '--cache',
      join(temporaryRoot, 'npm-cache')
    );
  }

  installArguments.push(...packageSources);
  run(npmCommand, installArguments, consumerRoot);

  const binDirectory = join(consumerRoot, 'node_modules', '.bin');
  const executableSuffix = process.platform === 'win32' ? '.cmd' : '';
  const cli = join(binDirectory, `schngn${executableSuffix}`);
  const mcp = join(binDirectory, `schngn-mcp${executableSuffix}`);

  const version = run(cli, ['version'], consumerRoot);
  const expectedAgentVersion = packageManifests.find(
    ({ manifest }) => manifest.name === '@schngn/agent'
  )?.manifest.version;
  if (!expectedAgentVersion || !version.includes(expectedAgentVersion)) {
    throw new Error('Installed CLI returned the wrong version.');
  }

  const usage = JSON.parse(run(cli, ['usage'], consumerRoot, JSON.stringify({
    includeCountedDays: false,
    referenceDate: '2026-05-05',
    stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-05' }]
  })));
  if (usage.result?.daysUsed !== 5) throw new Error('Packed CLI returned the wrong usage.');

  run(process.execPath, ['--input-type=module', '--eval', capabilityImportCheck()], consumerRoot);
  run(process.execPath, ['--input-type=module', '--eval', mcpCheck(), mcp], consumerRoot);

  process.stdout.write(
    registryMode
      ? 'SCHNGN public-registry consumer check passed.\n'
      : 'SCHNGN packed-package consumer check passed.\n'
  );
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}

function pack(directory) {
  const output = run(
    npmCommand,
    ['pack', '--json', '--pack-destination', temporaryRoot],
    resolve(repoRoot, directory)
  );
  const metadata = JSON.parse(output)[0];
  if (!metadata?.filename) throw new Error(`npm pack returned no artifact for ${directory}.`);

  const paths = new Set(metadata.files?.map((file) => file.path));
  for (const required of ['LICENSE', 'README.md', 'dist/index.js', 'dist/index.d.ts']) {
    if (!paths.has(required)) throw new Error(`${directory} tarball is missing ${required}.`);
  }

  const tarball = join(temporaryRoot, metadata.filename);
  readFileSync(tarball);
  return tarball;
}

function run(command, args, cwd, input) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    input,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'inherit']
  });
}

function capabilityImportCheck() {
  return `
    import { calculateUsage } from '@schngn/capability';
    import { calculateUsageOnDate } from '@schngn/engine';
    const request = {
      stays: [{ entryDate: '2026-06-01', exitDate: '2026-06-03' }],
      referenceDate: '2026-06-03'
    };
    if (calculateUsage(request).result.daysUsed !== 3) throw new Error('Capability import failed.');
    if (calculateUsageOnDate(request.stays, request.referenceDate).daysUsed !== 3) {
      throw new Error('Engine import failed.');
    }
  `;
}

function mcpCheck() {
  return `
    import { Client } from '@modelcontextprotocol/sdk/client/index.js';
    import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
    const client = new Client({ name: 'packed-schngn-check', version: '1.0.0' });
    const transport = new StdioClientTransport({ command: process.argv[1], stderr: 'pipe' });
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      const names = tools.tools.map((tool) => tool.name).join(',');
      if (names !== 'calculate_schengen_usage,check_schengen_stay,latest_safe_schengen_exit') {
        throw new Error('Packed MCP tool list was unexpected.');
      }
      const result = await client.callTool({
        name: 'latest_safe_schengen_exit',
        arguments: { existingStays: [], entryDate: '2026-10-01' }
      });
      if (result.isError || result.structuredContent?.result?.latestSafeExitDate !== '2026-12-29') {
        throw new Error('Packed MCP calculation failed.');
      }
    } finally {
      await client.close();
    }
  `;
}
