import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

await smokeCli();
await smokeMcp();
process.stdout.write('SCHNGN compiled agent smoke passed.\n');

async function smokeCli() {
  const child = spawn(process.execPath, ['dist/cli.js', 'latest-exit'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  const stdout = collect(child.stdout);
  const stderr = collect(child.stderr);
  child.stdin.end(JSON.stringify({ existingStays: [], entryDate: '2026-10-01' }));
  const [exitCode] = await once(child, 'exit');
  const [output, diagnostics] = await Promise.all([stdout, stderr]);

  if (exitCode !== 0 || diagnostics !== '') throw new Error('Compiled CLI smoke failed.');
  const parsed = JSON.parse(output);
  if (parsed.result?.latestSafeExitDate !== '2026-12-29') {
    throw new Error('Compiled CLI returned an unexpected result.');
  }
}

async function smokeMcp() {
  const client = new Client({ name: 'schngn-smoke', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/mcp.js'],
    stderr: 'pipe'
  });

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    if (tools.tools.map((tool) => tool.name).join(',') !== [
      'calculate_schengen_usage',
      'check_schengen_stay',
      'latest_safe_schengen_exit'
    ].join(',')) {
      throw new Error('Compiled MCP server exposed an unexpected tool list.');
    }

    const result = await client.callTool({
      name: 'calculate_schengen_usage',
      arguments: {
        stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-05' }],
        referenceDate: '2026-05-05'
      }
    });
    if (result.isError || result.structuredContent?.result?.daysUsed !== 5) {
      throw new Error('Compiled MCP server returned an unexpected result.');
    }
  } finally {
    await client.close();
  }
}

async function collect(stream) {
  let value = '';
  stream.setEncoding('utf8');
  for await (const chunk of stream) value += chunk;
  return value;
}
