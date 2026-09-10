import { describe, expect, test } from 'bun:test';
import { createBrowserTools, registerBrowserTools } from '../src/lib/agent/browserTools';

describe('browser-local agent calculations', () => {
  test('uses the strict calculation contract without reading saved state', async () => {
    const tool = createBrowserTools().find(tool => tool.name === 'calculate_schengen_usage')!;
    const result = JSON.parse(await tool.execute({ stays: [{ entryDate: '2026-09-01', exitDate: '2026-09-10' }], referenceDate: '2026-09-10' }));
    expect(result.result.daysUsed).toBe(10);
    expect(result.advisory.code).toBe('planning_aid_not_legal_advice');
    expect(await tool.execute({ stays: [], referenceDate: 'secret-value', userId: 'other' })).toBe('{"error":"INVALID_ARGUMENTS"}');
  });
  test('registers real executable tools and cleans up its own names', async () => {
    const registered: string[] = [];
    const removed: string[] = [];
    const cleanup = await registerBrowserTools({ registerTool: async tool => { registered.push(tool.name); }, unregisterTool: async name => { removed.push(name); } });
    expect(registered).toEqual(['calculate_schengen_usage', 'check_schengen_stay', 'latest_safe_schengen_exit']);
    await cleanup();
    expect(removed).toEqual(registered);
    expect(await registerBrowserTools(undefined)).toBeInstanceOf(Function);
  });
  test('rejects oversized histories and cancelled calls without echoing input', async () => {
    const tool = createBrowserTools()[0];
    expect(await tool.execute({ stays: Array(101).fill({ entryDate: '2026-01-01', exitDate: '2026-01-01' }), referenceDate: '2026-01-01' })).toBe('{"error":"INVALID_ARGUMENTS"}');
    const controller = new AbortController(); controller.abort();
    expect(await tool.execute({}, { signal: controller.signal })).toBe('{"error":"CANCELLED"}');
  });
});
