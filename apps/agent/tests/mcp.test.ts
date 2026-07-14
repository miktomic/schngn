import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createSchngnMcpServer } from '../src/mcp';

describe('SCHNGN MCP server', () => {
  let client: Client;
  let server: McpServer;

  beforeEach(async () => {
    server = createSchngnMcpServer();
    client = new Client({ name: 'schngn-mcp-test-client', version: '0.1.0' });

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  test('lists exactly three strict read-only calculation tools', async () => {
    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual([
      'calculate_schengen_usage',
      'check_schengen_stay',
      'latest_safe_schengen_exit'
    ]);

    for (const tool of result.tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.outputSchema?.type).toBe('object');
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      });
    }

    expect(client.getInstructions()).toContain('planning aid, not legal advice');
  });

  test('calls every tool with structured/text parity', async () => {
    // Listing first also makes the v1 client cache and enforce every output schema.
    await client.listTools();

    const usage = expectStructuredTextParity(
      await client.callTool({
        name: 'calculate_schengen_usage',
        arguments: {
          stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-05' }],
          referenceDate: '2026-05-05',
          includeCountedDays: true
        }
      })
    );
    expect(usage).toMatchObject({
      result: {
        referenceDate: '2026-05-05',
        daysUsed: 5,
        daysRemaining: 85,
        overLimit: false,
        overBy: 0
      }
    });
    expect((usage.result as { countedDays: string[] }).countedDays).toHaveLength(5);

    const checkedStay = expectStructuredTextParity(
      await client.callTool({
        name: 'check_schengen_stay',
        arguments: {
          existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-30' }],
          candidateStay: { entryDate: '2026-04-01', exitDate: '2026-04-02' }
        }
      })
    );
    expect(checkedStay).toMatchObject({
      result: {
        safeForEveryDay: false,
        firstOverLimitDate: '2026-04-02',
        safeThroughDate: '2026-04-01',
        overBy: 1
      }
    });

    const safeExit = expectStructuredTextParity(
      await client.callTool({
        name: 'latest_safe_schengen_exit',
        arguments: {
          existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-30' }],
          entryDate: '2026-04-01'
        }
      })
    );
    expect(safeExit).toMatchObject({
      result: {
        entryDate: '2026-04-01',
        latestSafeExitDate: '2026-04-01'
      }
    });
  });

  test('returns a safe tool error without echoing invalid input or a stack', async () => {
    const sensitiveInvalidValue = 'PRIVATE-TRIP-DATE-NOT-ISO';
    const result = await client.callTool({
      name: 'calculate_schengen_usage',
      arguments: {
        stays: [],
        referenceDate: sensitiveInvalidValue
      }
    });

    expect(result.isError).toBe(true);
    const text = textContent(result);
    expect(text).not.toContain(sensitiveInvalidValue);
    expect(text.toLowerCase()).not.toContain('stack');
    expect(text).not.toMatch(/\n\s+at\s/);
    expect(JSON.parse(text)).toEqual({
      error: {
        code: 'INVALID_ARGUMENTS',
        message: 'Arguments did not match the required schema. Use ISO calendar dates in YYYY-MM-DD form.'
      }
    });
  });
});

function expectStructuredTextParity(result: CallToolResult): Record<string, unknown> {
  expect(result.isError).not.toBe(true);
  expect(result.structuredContent).toBeDefined();

  const structuredContent = result.structuredContent as Record<string, unknown>;
  expect(JSON.parse(textContent(result))).toEqual(structuredContent);
  return structuredContent;
}

function textContent(result: CallToolResult): string {
  expect(result.content).toHaveLength(1);
  const content = result.content[0];
  if (!content || content.type !== 'text') {
    throw new TypeError('Expected one MCP text content block.');
  }
  return content.text;
}
