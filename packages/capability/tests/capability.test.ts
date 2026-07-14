import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CalculateUsageOutputSchema,
  CapabilityValidationError,
  CheckStayOutputSchema,
  LatestSafeExitOutputSchema,
  MAX_STAYS,
  OFFICIAL_SOURCE_URL,
  PLANNING_AID_ADVISORY,
  RULE_SET,
  SCHEMA_VERSION,
  calculateUsage,
  checkStay,
  latestSafeExit
} from '../src';

describe('@schngn/capability metadata', () => {
  test('uses stable schema, rule-set, advisory, and official-source values', () => {
    expect(SCHEMA_VERSION).toBe('1');
    expect(RULE_SET).toBe('ordinary-schengen-90-180/v1');
    expect(OFFICIAL_SOURCE_URL).toBe(
      'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en'
    );
    expect(PLANNING_AID_ADVISORY).toEqual({
      code: 'planning_aid_not_legal_advice',
      message: 'Planning aid only — not legal advice or a guarantee of entry. Verify with official sources.',
      officialSourceUrl: OFFICIAL_SOURCE_URL
    });
  });

  test('returns the same deterministic metadata from every operation', () => {
    const outputs = [
      calculateUsage({ stays: [], referenceDate: '2026-07-14' }),
      checkStay({
        existingStays: [],
        candidateStay: { entryDate: '2026-07-14', exitDate: '2026-07-14' }
      }),
      latestSafeExit({ existingStays: [], entryDate: '2026-07-14' })
    ];

    for (const output of outputs) {
      expect(output).toMatchObject({
        schemaVersion: SCHEMA_VERSION,
        ruleSet: RULE_SET,
        advisory: PLANNING_AID_ADVISORY
      });
    }
  });
});

describe('calculateUsage', () => {
  test('counts inclusive overlapping stays once and omits counted dates by default', () => {
    const output = calculateUsage({
      stays: [
        { entryDate: '2026-06-01', exitDate: '2026-06-10' },
        { entryDate: '2026-06-05', exitDate: '2026-06-12' }
      ],
      referenceDate: '2026-06-12'
    });

    expect(output.result).toEqual({
      referenceDate: '2026-06-12',
      windowStart: '2025-12-15',
      windowEnd: '2026-06-12',
      daysUsed: 12,
      daysRemaining: 78,
      overLimit: false,
      overBy: 0,
      status: 'within_limit'
    });
    expect(CalculateUsageOutputSchema.parse(output)).toEqual(output);
  });

  test('includes counted dates only when requested', () => {
    const output = calculateUsage({
      stays: [{ entryDate: '2026-06-01', exitDate: '2026-06-02' }],
      referenceDate: '2026-06-02',
      includeCountedDays: true
    });

    expect(output.result.countedDays).toEqual(['2026-06-01', '2026-06-02']);
  });

  test('returns stable within, near, at-limit, and over-limit statuses', () => {
    const statusForDays = (days: number) => calculateUsage({
      stays: [{ entryDate: '2026-01-01', exitDate: isoDayFromStart(days - 1) }],
      referenceDate: isoDayFromStart(days - 1)
    }).result.status;

    expect(statusForDays(82)).toBe('within_limit');
    expect(statusForDays(83)).toBe('near_limit');
    expect(statusForDays(90)).toBe('at_limit');
    expect(statusForDays(91)).toBe('over_limit');
  });
});

describe('checkStay', () => {
  test('records the first over-limit day and prior safe exit while tracking the full candidate peak', () => {
    const output = checkStay({
      existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-30' }],
      candidateStay: { entryDate: '2026-04-01', exitDate: '2026-04-03' }
    });

    expect(output.result).toEqual({
      safeForEveryDay: false,
      status: 'over_limit',
      firstOverLimitDate: '2026-04-02',
      safeThroughDate: '2026-04-01',
      peakDaysUsed: 92,
      minimumDaysRemaining: 0,
      overBy: 2
    });
    expect(CheckStayOutputSchema.parse(output)).toEqual(output);
  });

  test('bounds a very long candidate at 180 evaluated days and reports the true maximum', () => {
    const output = checkStay({
      existingStays: [],
      candidateStay: { entryDate: '2026-01-01', exitDate: '9999-12-31' }
    });

    expect(output.result).toEqual({
      safeForEveryDay: false,
      status: 'over_limit',
      firstOverLimitDate: '2026-04-01',
      safeThroughDate: '2026-03-31',
      peakDaysUsed: 180,
      minimumDaysRemaining: 0,
      overBy: 90
    });
  });

  test('reports a fully safe candidate through its requested final day', () => {
    const output = checkStay({
      existingStays: [],
      candidateStay: { entryDate: '2026-04-01', exitDate: '2026-04-03' }
    });

    expect(output.result).toMatchObject({
      safeForEveryDay: true,
      status: 'within_limit',
      firstOverLimitDate: null,
      safeThroughDate: '2026-04-03',
      peakDaysUsed: 3,
      minimumDaysRemaining: 87,
      overBy: 0
    });
  });

  test('returns no safe exit when the entry day is already over the limit', () => {
    const output = checkStay({
      existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-31' }],
      candidateStay: { entryDate: '2026-04-01', exitDate: '2026-04-01' }
    });

    expect(output.result.firstOverLimitDate).toBe('2026-04-01');
    expect(output.result.safeThroughDate).toBeNull();
  });
});

describe('latestSafeExit', () => {
  test('returns the inclusive ninetieth day for an empty history', () => {
    const output = latestSafeExit({ existingStays: [], entryDate: '2026-04-01' });

    expect(output.result).toEqual({
      entryDate: '2026-04-01',
      latestSafeExitDate: '2026-06-29'
    });
    expect(LatestSafeExitOutputSchema.parse(output)).toEqual(output);
  });

  test('returns null when the traveler is already at the rolling limit', () => {
    const output = latestSafeExit({
      existingStays: [{ entryDate: '2026-01-01', exitDate: '2026-03-31' }],
      entryDate: '2026-04-01'
    });

    expect(output.result.latestSafeExitDate).toBeNull();
  });
});

describe('strict, privacy-safe validation', () => {
  test('rejects labels, countries, ids, and other unknown fields', () => {
    for (const extra of [
      { label: 'Private journey' },
      { country: 'Italy' },
      { id: 'traveler-123' }
    ]) {
      const error = captureValidationError(() => calculateUsage({
        stays: [{ entryDate: '2026-04-01', exitDate: '2026-04-02', ...extra }],
        referenceDate: '2026-04-02'
      }));

      expect(error.issues).toContainEqual({ path: '$.stays[0]', code: 'unknown_field' });
      expect(JSON.stringify(error)).not.toContain(Object.values(extra)[0]);
    }
  });

  test('rejects more than one hundred stays', () => {
    const error = captureValidationError(() => calculateUsage({
      stays: Array.from({ length: MAX_STAYS + 1 }, () => ({
        entryDate: '2026-04-01',
        exitDate: '2026-04-01'
      })),
      referenceDate: '2026-04-01'
    }));

    expect(error.issues).toContainEqual({ path: '$.stays', code: 'too_many_stays' });
  });

  test('distinguishes date format, actual calendar, and reversed-range errors without echoing input', () => {
    const malformed = captureValidationError(() => latestSafeExit({
      existingStays: [],
      entryDate: 'April 1, 2026'
    }));
    const impossible = captureValidationError(() => calculateUsage({
      stays: [],
      referenceDate: '2026-02-30'
    }));
    const reversed = captureValidationError(() => checkStay({
      existingStays: [],
      candidateStay: { entryDate: '2026-04-03', exitDate: '2026-04-01' }
    }));

    expect(malformed.issues).toContainEqual({ path: '$.entryDate', code: 'invalid_date_format' });
    expect(impossible.issues).toContainEqual({ path: '$.referenceDate', code: 'invalid_calendar_date' });
    expect(reversed.issues).toContainEqual({
      path: '$.candidateStay.exitDate',
      code: 'exit_before_entry'
    });
    const serialized = JSON.stringify([malformed, impossible, reversed]);
    expect(serialized).not.toContain('April 1, 2026');
    expect(serialized).not.toContain('2026-02-30');
    expect(serialized).not.toContain('2026-04-03');
  });

  test('keeps runtime source free of networking, storage, logging, and platform APIs', () => {
    const sourceDirectory = fileURLToPath(new URL('../src', import.meta.url));
    const source = readdirSync(sourceDirectory)
      .filter((name) => name.endsWith('.ts'))
      .map((name) => readFileSync(`${sourceDirectory}/${name}`, 'utf8'))
      .join('\n');

    for (const forbidden of [
      'fetch(',
      'console.',
      'localStorage',
      'indexedDB',
      'node:fs',
      'bun:',
      'cloudflare:'
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});

function captureValidationError(operation: () => unknown): CapabilityValidationError {
  try {
    operation();
  } catch (error) {
    expect(error).toBeInstanceOf(CapabilityValidationError);
    return error as CapabilityValidationError;
  }
  throw new Error('Expected capability validation to fail.');
}

function isoDayFromStart(offset: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + offset));
  return date.toISOString().slice(0, 10);
}
