import {
  CalculateUsageInputSchema, CheckStayInputSchema, LatestSafeExitInputSchema,
  calculateUsage, checkStay, latestSafeExit
} from '@schngn/capability';

const date = { type: 'string', format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
const stay = { type: 'object', additionalProperties: false, properties: { entryDate: date, exitDate: date }, required: ['entryDate', 'exitDate'] };
const stays = { type: 'array', items: stay, maxItems: 100 };
const privacy = ' Runs entirely in this browser, with explicit inputs only; does not read saved trips, persist changes, or make network requests. Your agent provider may process inputs and outputs. Ordinary short stays only; planning aid, not legal advice.';

export interface BrowserTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; consequentialHint: boolean; untrustedContentHint: boolean };
  execute(input: unknown, options?: { signal?: AbortSignal }): Promise<string>;
}
export interface BrowserModelContext {
  registerTool(tool: BrowserTool): void | Promise<void>;
  unregisterTool(name: string): void | Promise<void>;
}

export function createBrowserTools(): BrowserTool[] {
  function tool<T>(name: string, description: string, properties: Record<string, unknown>, required: string[], schema: { safeParse(input: unknown): { success: true; data: T } | { success: false } }, calculate: (input: T) => unknown): BrowserTool {
    return {
      name, description: description + privacy,
      inputSchema: { type: 'object', additionalProperties: false, properties, required },
      annotations: { readOnlyHint: true, consequentialHint: false, untrustedContentHint: false },
      async execute(input, options) {
        if (options?.signal?.aborted) return JSON.stringify({ error: 'CANCELLED' });
        try {
          const parsed = schema.safeParse(input);
          if (!parsed.success) return JSON.stringify({ error: 'INVALID_ARGUMENTS' });
          return JSON.stringify(calculate(parsed.data));
        } catch { return JSON.stringify({ error: 'CALCULATION_FAILED' }); }
      }
    };
  }
  return [
    tool('calculate_schengen_usage', 'Calculate used and remaining days for continuous Schengen stays on a reference date. Entry and exit days count.', { stays, referenceDate: date, includeCountedDays: { type: 'boolean' } }, ['stays', 'referenceDate'], CalculateUsageInputSchema, calculateUsage),
    tool('check_schengen_stay', 'Check every day of a proposed continuous Schengen stay against existing stays.', { existingStays: stays, candidateStay: stay }, ['existingStays', 'candidateStay'], CheckStayInputSchema, checkStay),
    tool('latest_safe_schengen_exit', 'Find the latest safe exit for a proposed Schengen entry date, accounting for existing stays.', { existingStays: stays, entryDate: date }, ['existingStays', 'entryDate'], LatestSafeExitInputSchema, latestSafeExit)
  ];
}

export async function registerBrowserTools(context?: BrowserModelContext): Promise<() => Promise<void>> {
  const registered: string[] = [];
  if (context) {
    for (const tool of createBrowserTools()) {
      try { await context.registerTool(tool); registered.push(tool.name); } catch { /* Unsupported browser API must not break the calculator. */ }
    }
  }
  return async () => {
    for (const name of registered) {
      try { await context?.unregisterTool(name); } catch { /* The document may already be gone. */ }
    }
  };
}
