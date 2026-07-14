#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { CapabilityValidationError, calculateUsage, checkStay, latestSafeExit } from '@schngn/capability';
import { ZodError } from 'zod/v4';
import { closeServer, listenLocalApi } from './http.js';
import { isMainModule } from './mainModule.js';
import { startStdioMcpServer } from './mcp.js';
import { openApiDocument } from './openapi.js';

const CLI_VERSION = '0.1.1';
const MAX_INPUT_BYTES = 64 * 1024;

class CliError extends Error {
  constructor(
    readonly code: string,
    readonly exitCode = 2
  ) {
    super(code);
  }
}

export async function runCli(args: string[]): Promise<number> {
  try {
    const [command, ...commandArgs] = args;
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      process.stdout.write(HELP_TEXT);
      return 0;
    }
    if (command === 'version' || command === '--version' || command === '-v') {
      process.stdout.write(`${CLI_VERSION}\n`);
      return 0;
    }

    if (command === 'usage') {
      const input = await readOperationInput(commandArgs);
      writeJson(process.stdout, calculateUsage(input as never));
      return 0;
    }
    if (command === 'check-stay') {
      const input = await readOperationInput(commandArgs);
      writeJson(process.stdout, checkStay(input as never));
      return 0;
    }
    if (command === 'latest-exit') {
      const input = await readOperationInput(commandArgs);
      writeJson(process.stdout, latestSafeExit(input as never));
      return 0;
    }
    if (command === 'openapi') {
      assertNoOptions(commandArgs);
      writeJson(process.stdout, openApiDocument);
      return 0;
    }
    if (command === 'serve') {
      let values: { port?: string };
      try {
        ({ values } = parseArgs({
          allowPositionals: false,
          args: commandArgs,
          options: { port: { short: 'p', type: 'string' } },
          strict: true
        }) as { values: { port?: string } });
      } catch {
        throw new CliError('invalid_options');
      }
      const port = parsePort(values.port);
      const listening = await listenLocalApi(port === undefined ? {} : { port });
      process.stderr.write(`SCHNGN local API listening at ${listening.url}\n`);
      installShutdownHandlers(() => closeServer(listening.server));
      return 0;
    }
    if (command === 'mcp') {
      assertNoOptions(commandArgs);
      await startStdioMcpServer();
      return 0;
    }

    throw new CliError('unknown_command');
  } catch (error) {
    return writeCliError(error);
  }
}

async function readOperationInput(args: string[]): Promise<unknown> {
  let values: { input?: string };
  try {
    ({ values } = parseArgs({
      allowPositionals: false,
      args,
      options: { input: { short: 'i', type: 'string' } },
      strict: true
    }) as { values: { input?: string } });
  } catch {
    throw new CliError('invalid_options');
  }

  const text = values.input && values.input !== '-'
    ? await readInputFile(values.input)
    : await readStdin();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new CliError('invalid_json');
  }
}

async function readInputFile(path: string): Promise<string> {
  try {
    const metadata = await stat(path);
    if (!metadata.isFile()) throw new CliError('input_unavailable');
    if (metadata.size > MAX_INPUT_BYTES) throw new CliError('input_too_large');
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError('input_unavailable');
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const rawChunk of process.stdin) {
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
    bytes += chunk.byteLength;
    if (bytes > MAX_INPUT_BYTES) throw new CliError('input_too_large');
    chunks.push(chunk);
  }
  if (bytes === 0) throw new CliError('input_required');
  return Buffer.concat(chunks).toString('utf8');
}

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) throw new CliError('invalid_port');
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) throw new CliError('invalid_port');
  return port;
}

function assertNoOptions(args: string[]): void {
  if (args.length > 0) throw new CliError('invalid_options');
}

function writeCliError(error: unknown): number {
  if (error instanceof CapabilityValidationError) {
    writeJson(process.stderr, {
      error: { code: 'invalid_request', issues: error.issues.map((issue) => ({ ...issue })) },
      schemaVersion: '1'
    });
    return 2;
  }

  if (error instanceof ZodError) {
    writeJson(process.stderr, {
      error: {
        code: 'invalid_request',
        issues: error.issues.map((issue) => ({ code: safeIssueCode(issue), path: issue.path.map(String).join('.') }))
      },
      schemaVersion: '1'
    });
    return 2;
  }

  if (error instanceof CliError) {
    writeJson(process.stderr, { error: { code: error.code }, schemaVersion: '1' });
    return error.exitCode;
  }

  writeJson(process.stderr, { error: { code: 'internal_error' }, schemaVersion: '1' });
  return 1;
}

function safeIssueCode(issue: ZodError['issues'][number]): string {
  const parameters = 'params' in issue && issue.params && typeof issue.params === 'object'
    ? issue.params as Record<string, unknown>
    : undefined;
  const capabilityCode = parameters?.capabilityCode;
  return typeof capabilityCode === 'string' && /^[a-z0-9_]+$/.test(capabilityCode)
    ? capabilityCode
    : issue.code;
}

function writeJson(stream: NodeJS.WritableStream, value: unknown): void {
  stream.write(`${JSON.stringify(value)}\n`);
}

function installShutdownHandlers(close: () => Promise<void>): void {
  let closing = false;
  const shutdown = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    await close();
  };
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

const HELP_TEXT = `SCHNGN agent CLI ${CLI_VERSION}

Usage:
  schngn usage [--input <file|->]
  schngn check-stay [--input <file|->]
  schngn latest-exit [--input <file|->]
  schngn openapi
  schngn serve [--port <number>]
  schngn mcp

Calculation commands read strict JSON from stdin by default and write JSON to stdout.
The HTTP API binds to 127.0.0.1 only. The MCP server uses stdio.
`;

if (isMainModule(import.meta.url)) {
  const exitCode = await runCli(process.argv.slice(2));
  process.exitCode = exitCode;
}
