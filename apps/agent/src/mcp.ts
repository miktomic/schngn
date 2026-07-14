#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CalculateUsageInputSchema,
  CalculateUsageOutputSchema,
  CheckStayInputSchema,
  CheckStayOutputSchema,
  LatestSafeExitInputSchema,
  LatestSafeExitOutputSchema,
  calculateUsage,
  checkStay,
  latestSafeExit
} from '@schngn/capability';
import { isMainModule } from './mainModule.js';

const SERVER_NAME = 'schngn';
const SERVER_VERSION = '0.1.1';

const SERVER_INSTRUCTIONS = [
  'All inputs are explicit continuous stays inside the Schengen Area.',
  'Split a journey into separate stays for any full calendar days spent outside Schengen.',
  'Entry and exit days both count, and country metadata never changes the calculation.',
  'Results cover ordinary short stays only and are a planning aid, not legal advice or a guarantee of entry.',
  'Verify the result with official sources before booking or travelling.'
].join(' ');

const READ_ONLY_TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
} as const;

const INVALID_ARGUMENTS_SENTINEL = Object.freeze({ invalidSchngnMcpArguments: true });

const CALCULATE_USAGE_MCP_INPUT_SCHEMA = CalculateUsageInputSchema.extend({
  stays: CalculateUsageInputSchema.shape.stays.catch(() => INVALID_ARGUMENTS_SENTINEL as never),
  referenceDate: CalculateUsageInputSchema.shape.referenceDate.catch(
    () => INVALID_ARGUMENTS_SENTINEL as never
  ),
  includeCountedDays: CalculateUsageInputSchema.shape.includeCountedDays.catch(
    () => INVALID_ARGUMENTS_SENTINEL as never
  )
});

const CHECK_STAY_MCP_INPUT_SCHEMA = CheckStayInputSchema.extend({
  existingStays: CheckStayInputSchema.shape.existingStays.catch(
    () => INVALID_ARGUMENTS_SENTINEL as never
  ),
  candidateStay: CheckStayInputSchema.shape.candidateStay.catch(
    () => INVALID_ARGUMENTS_SENTINEL as never
  )
});

const LATEST_SAFE_EXIT_MCP_INPUT_SCHEMA = LatestSafeExitInputSchema.extend({
  existingStays: LatestSafeExitInputSchema.shape.existingStays.catch(
    () => INVALID_ARGUMENTS_SENTINEL as never
  ),
  entryDate: LatestSafeExitInputSchema.shape.entryDate.catch(
    () => INVALID_ARGUMENTS_SENTINEL as never
  )
});

type ToolErrorCode = 'INVALID_ARGUMENTS' | 'CALCULATION_FAILED';

export function createSchngnMcpServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: SERVER_INSTRUCTIONS }
  );

  server.registerTool(
    'calculate_schengen_usage',
    {
      title: 'Calculate Schengen usage',
      description:
        'Calculate days used and remaining on an explicit reference date under the ordinary Schengen 90-in-180-day rule. Each input range must contain only continuous days inside Schengen.',
      inputSchema: CALCULATE_USAGE_MCP_INPUT_SCHEMA,
      outputSchema: CalculateUsageOutputSchema,
      annotations: READ_ONLY_TOOL_ANNOTATIONS
    },
    async (input) => {
      if (containsInvalidArguments(input)) return invalidArgumentsResult();
      const parsed = CalculateUsageInputSchema.safeParse(input);
      if (!parsed.success) return invalidArgumentsResult();

      try {
        const result = CalculateUsageOutputSchema.safeParse(await calculateUsage(parsed.data));
        if (!result.success) return calculationFailedResult();
        return successfulResult(result.data);
      } catch {
        return calculationFailedResult();
      }
    }
  );

  server.registerTool(
    'check_schengen_stay',
    {
      title: 'Check a Schengen stay',
      description:
        'Check whether a proposed continuous Schengen stay is within the ordinary 90-in-180-day allowance on every day, using explicit prior Schengen stay ranges.',
      inputSchema: CHECK_STAY_MCP_INPUT_SCHEMA,
      outputSchema: CheckStayOutputSchema,
      annotations: READ_ONLY_TOOL_ANNOTATIONS
    },
    async (input) => {
      if (containsInvalidArguments(input)) return invalidArgumentsResult();
      const parsed = CheckStayInputSchema.safeParse(input);
      if (!parsed.success) return invalidArgumentsResult();

      try {
        const result = CheckStayOutputSchema.safeParse(await checkStay(parsed.data));
        if (!result.success) return calculationFailedResult();
        return successfulResult(result.data);
      } catch {
        return calculationFailedResult();
      }
    }
  );

  server.registerTool(
    'latest_safe_schengen_exit',
    {
      title: 'Find the latest safe Schengen exit',
      description:
        'Find the latest safe exit date for a continuous Schengen stay beginning on the supplied entry date, using explicit prior Schengen stay ranges.',
      inputSchema: LATEST_SAFE_EXIT_MCP_INPUT_SCHEMA,
      outputSchema: LatestSafeExitOutputSchema,
      annotations: READ_ONLY_TOOL_ANNOTATIONS
    },
    async (input) => {
      if (containsInvalidArguments(input)) return invalidArgumentsResult();
      const parsed = LatestSafeExitInputSchema.safeParse(input);
      if (!parsed.success) return invalidArgumentsResult();

      try {
        const result = LatestSafeExitOutputSchema.safeParse(await latestSafeExit(parsed.data));
        if (!result.success) return calculationFailedResult();
        return successfulResult(result.data);
      } catch {
        return calculationFailedResult();
      }
    }
  );

  return server;
}

export async function startStdioMcpServer(): Promise<void> {
  const server = createSchngnMcpServer();
  await server.connect(new StdioServerTransport());
}

function successfulResult<T extends object>(result: T) {
  const structuredContent = { ...result };

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }],
    structuredContent
  };
}

function invalidArgumentsResult() {
  return errorResult(
    'INVALID_ARGUMENTS',
    'Arguments did not match the required schema. Use ISO calendar dates in YYYY-MM-DD form.'
  );
}

function calculationFailedResult() {
  return errorResult('CALCULATION_FAILED', 'The Schengen calculation could not be completed.');
}

function errorResult(code: ToolErrorCode, message: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: { code, message } }) }],
    isError: true as const
  };
}

function containsInvalidArguments(value: unknown): boolean {
  if (value === INVALID_ARGUMENTS_SENTINEL) return true;
  if (Array.isArray(value)) return value.some(containsInvalidArguments);
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(containsInvalidArguments);
}

if (isMainModule(import.meta.url)) {
  startStdioMcpServer().catch(() => {
    process.stderr.write('Unable to start the SCHNGN MCP server.\n');
    process.exitCode = 1;
  });
}
