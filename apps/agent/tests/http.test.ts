import { afterEach, describe, expect, test } from 'bun:test';
import type { Server } from 'node:http';
import { closeServer, listenLocalApi } from '../src/http';

const openServers = new Set<Server>();

afterEach(async () => {
  await Promise.all([...openServers].map(async (server) => {
    openServers.delete(server);
    await closeServer(server);
  }));
});

describe('loopback agent HTTP API', () => {
  test('serves discovery metadata without allowing remote binds', async () => {
    await expect(listenLocalApi({ host: '0.0.0.0', port: 0 })).rejects.toThrow('loopback');

    const api = await startApi();
    const health = await fetch(`${api.url}/healthz`);
    expect(health.status).toBe(200);
    expect(health.headers.get('cache-control')).toBe('no-store');
    expect(health.headers.get('vary')).toBe('*');
    expect(await health.json()).toEqual({
      ruleSet: 'ordinary-schengen-90-180/v1',
      schemaVersion: '1',
      status: 'ok'
    });

    const openapi = await fetch(`${api.url}/openapi.json`);
    expect(openapi.status).toBe(200);
    expect((await openapi.json() as { openapi: string }).openapi).toBe('3.1.0');
  });

  test('returns the shared calculation contract', async () => {
    const api = await startApi();
    const response = await postJson(`${api.url}/v1/calculations/usage`, {
      includeCountedDays: true,
      referenceDate: '2026-03-31',
      stays: [{ entryDate: '2026-01-01', exitDate: '2026-03-31' }]
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      result: {
        daysRemaining: 0,
        daysUsed: 90,
        status: 'at_limit'
      },
      ruleSet: 'ordinary-schengen-90-180/v1',
      schemaVersion: '1'
    });
  });

  test('exposes stay-check and latest-exit operations', async () => {
    const api = await startApi();
    const stayCheck = await postJson(`${api.url}/v1/calculations/stay-check`, {
      candidateStay: { entryDate: '2026-04-01', exitDate: '2026-04-02' },
      existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-30' }]
    });
    expect(stayCheck.status).toBe(200);
    expect(await stayCheck.json()).toMatchObject({
      result: {
        firstOverLimitDate: '2026-04-02',
        safeForEveryDay: false,
        safeThroughDate: '2026-04-01'
      }
    });

    const latestExit = await postJson(`${api.url}/v1/calculations/latest-safe-exit`, {
      entryDate: '2026-10-01',
      existingStays: []
    });
    expect(latestExit.status).toBe(200);
    expect(await latestExit.json()).toMatchObject({
      result: {
        latestSafeExitDate: '2026-12-29'
      }
    });
  });

  test('rejects unknown fields without echoing private input', async () => {
    const api = await startApi();
    const response = await postJson(`${api.url}/v1/calculations/usage`, {
      ownerId: 'private-owner-123',
      referenceDate: '2026-05-07',
      stays: [{ entryDate: '2026-05-01', exitDate: '2026-05-07' }]
    });
    const text = await response.text();

    expect(response.status).toBe(400);
    expect(text).toContain('invalid_request');
    expect(text).not.toContain('private-owner-123');
    expect(text).not.toContain('2026-05-07');
  });

  test('enforces JSON, body, query, and local-origin boundaries', async () => {
    const api = await startApi(8);

    const wrongType = await fetch(`${api.url}/v1/calculations/usage`, {
      body: '{}',
      method: 'POST'
    });
    expect(wrongType.status).toBe(415);

    const tooLarge = await postJson(`${api.url}/v1/calculations/usage`, {
      referenceDate: '2026-01-01',
      stays: []
    });
    expect(tooLarge.status).toBe(413);

    const query = await postJson(`${api.url}/v1/calculations/usage?date=2026-01-01`, {});
    expect(query.status).toBe(400);

    const remoteOrigin = await fetch(`${api.url}/healthz`, {
      headers: { Origin: 'https://example.com' }
    });
    expect(remoteOrigin.status).toBe(403);
  });
});

async function startApi(maxBodyBytes?: number) {
  const api = await listenLocalApi(maxBodyBytes === undefined ? { port: 0 } : { maxBodyBytes, port: 0 });
  openServers.add(api.server);
  return api;
}

function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
}
