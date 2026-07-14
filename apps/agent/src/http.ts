import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import {
  CapabilityValidationError,
  calculateUsage,
  checkStay,
  latestSafeExit,
  type CalculateUsageInput,
  type CheckStayInput,
  type LatestSafeExitInput
} from '@schngn/capability';
import { ZodError } from 'zod/v4';
import { openApiDocument } from './openapi.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 37491;
const MAX_BODY_BYTES = 64 * 1024;

export interface LocalApiOptions {
  host?: string;
  maxBodyBytes?: number;
  port?: number;
}

export interface ListeningLocalApi {
  host: string;
  port: number;
  server: Server;
  url: string;
}

interface ApiErrorBody {
  error: {
    code: string;
    issues?: Array<{ code: string; path: string }>;
  };
  schemaVersion: '1';
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string
  ) {
    super(code);
  }
}

export function createLocalApiServer(options: Pick<LocalApiOptions, 'maxBodyBytes'> = {}): Server {
  const maxBodyBytes = options.maxBodyBytes ?? MAX_BODY_BYTES;
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1) {
    throw new RangeError('maxBodyBytes must be a positive safe integer');
  }

  return createServer((request, response) => {
    void handleRequest(request, response, maxBodyBytes);
  });
}

export async function listenLocalApi(options: LocalApiOptions = {}): Promise<ListeningLocalApi> {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  assertLoopbackHost(host);
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
    throw new RangeError('port must be an integer from 0 through 65535');
  }

  const server = createLocalApiServer(options);
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => reject(error);
    server.once('error', onError);
    server.listen(port, host, () => {
      server.off('error', onError);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    await closeServer(server);
    throw new Error('Local API did not expose a TCP address');
  }

  const displayHost = host === '::1' ? '[::1]' : host;
  return {
    host,
    port: address.port,
    server,
    url: `http://${displayHost}:${address.port}`
  };
}

export function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  maxBodyBytes: number
): Promise<void> {
  try {
    assertLocalRequest(request);
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.search !== '') throw new HttpError(400, 'query_not_allowed');

    if (request.method === 'GET' && url.pathname === '/healthz') {
      sendJson(response, 200, {
        ruleSet: 'ordinary-schengen-90-180/v1',
        schemaVersion: '1',
        status: 'ok'
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/openapi.json') {
      sendJson(response, 200, openApiDocument);
      return;
    }

    const operation = POST_OPERATIONS[url.pathname];
    if (operation && request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      throw new HttpError(405, 'method_not_allowed');
    }
    if (!operation) throw new HttpError(404, 'not_found');

    assertJsonContentType(request);
    const body = await readJsonBody(request, maxBodyBytes);
    sendJson(response, 200, operation(body));
  } catch (error) {
    sendApiError(response, error);
  }
}

const POST_OPERATIONS: Record<string, (body: unknown) => unknown> = {
  '/v1/calculations/latest-safe-exit': (body) => latestSafeExit(body as LatestSafeExitInput),
  '/v1/calculations/stay-check': (body) => checkStay(body as CheckStayInput),
  '/v1/calculations/usage': (body) => calculateUsage(body as CalculateUsageInput)
};

function assertLoopbackHost(host: string): void {
  if (host !== '127.0.0.1' && host !== '::1' && host !== 'localhost') {
    throw new RangeError('The agent API may only bind to a loopback host');
  }
}

function assertLocalRequest(request: IncomingMessage): void {
  const host = request.headers.host?.toLowerCase();
  if (!host || !isLoopbackAuthority(host)) throw new HttpError(403, 'local_request_required');

  const origin = request.headers.origin;
  if (origin) {
    try {
      const hostname = new URL(origin).hostname;
      assertLoopbackHost(hostname);
    } catch {
      throw new HttpError(403, 'local_request_required');
    }
  }
}

function isLoopbackAuthority(authority: string): boolean {
  return /^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(authority)
    || /^\[::1\](?::\d+)?$/.test(authority);
}

function assertJsonContentType(request: IncomingMessage): void {
  const contentType = request.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') throw new HttpError(415, 'json_content_type_required');
}

async function readJsonBody(request: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  const declaredLength = request.headers['content-length'];
  if (declaredLength !== undefined) {
    if (!/^\d+$/.test(declaredLength)) throw new HttpError(400, 'invalid_content_length');
    if (Number(declaredLength) > maxBodyBytes) throw new HttpError(413, 'request_too_large');
  }

  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const rawChunk of request) {
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
    bytes += chunk.byteLength;
    if (bytes > maxBodyBytes) throw new HttpError(413, 'request_too_large');
    chunks.push(chunk);
  }

  if (bytes === 0) throw new HttpError(400, 'invalid_json');
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
    return JSON.parse(text) as unknown;
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
}

function sendApiError(response: ServerResponse, error: unknown): void {
  if (response.headersSent) {
    response.end();
    return;
  }

  if (error instanceof HttpError) {
    sendJson(response, error.status, errorBody(error.code));
    return;
  }

  if (error instanceof CapabilityValidationError) {
    sendJson(response, 400, errorBody('invalid_request', error.issues.map((issue) => ({ ...issue }))));
    return;
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      code: sanitizeIssueCode(issue),
      path: issue.path.map(String).join('.')
    }));
    sendJson(response, 400, errorBody('invalid_request', issues));
    return;
  }

  sendJson(response, 500, errorBody('internal_error'));
}

function sanitizeIssueCode(issue: ZodError['issues'][number]): string {
  const parameters = 'params' in issue && issue.params && typeof issue.params === 'object'
    ? issue.params as Record<string, unknown>
    : undefined;
  const capabilityCode = parameters?.capabilityCode;
  return typeof capabilityCode === 'string' && /^[a-z0-9_]+$/.test(capabilityCode)
    ? capabilityCode
    : issue.code;
}

function errorBody(code: string, issues?: ApiErrorBody['error']['issues']): ApiErrorBody {
  return {
    error: issues ? { code, issues } : { code },
    schemaVersion: '1'
  };
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Vary', '*');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(`${JSON.stringify(value)}\n`);
}
