import {
  CLOSE_BUFFER_DAYS,
  ROLLING_WINDOW_DAYS,
  SCHENGEN_ALLOWANCE_DAYS,
  addDays,
  calculateUsageOnDate,
  formatISODate,
  latestSafeExitDate as engineLatestSafeExitDate,
  parseISODate,
  type UsageResult
} from '@schngn/engine';
import { z } from 'zod';
import { PLANNING_AID_ADVISORY, RULE_SET, SCHEMA_VERSION } from './constants.js';
import { capabilityValidationError } from './errors.js';
import {
  CalculateUsageInputSchema,
  CheckStayInputSchema,
  LatestSafeExitInputSchema,
  type CalculateUsageInput,
  type CalculateUsageOutput,
  type CheckStayInput,
  type CheckStayOutput,
  type LatestSafeExitInput,
  type LatestSafeExitOutput,
  type SchengenStay,
  type SemanticStatus
} from './schemas.js';

export function calculateUsage(input: CalculateUsageInput): CalculateUsageOutput {
  const parsed = parseInput(CalculateUsageInputSchema, input);
  const usage = calculateWindowedUsage(parsed.stays, parsed.referenceDate);

  return {
    ...metadata(),
    result: {
      referenceDate: usage.referenceDate,
      windowStart: usage.windowStart,
      windowEnd: usage.windowEnd,
      daysUsed: usage.daysUsed,
      daysRemaining: usage.daysRemaining,
      overLimit: usage.overLimit,
      overBy: usage.overBy,
      status: semanticStatus(usage.daysUsed),
      ...(parsed.includeCountedDays ? { countedDays: usage.countedDays } : {})
    }
  };
}

export function checkStay(input: CheckStayInput): CheckStayOutput {
  const parsed = parseInput(CheckStayInputSchema, input);
  const candidateEntry = parseISODate(parsed.candidateStay.entryDate);
  const candidateExit = parseISODate(parsed.candidateStay.exitDate);
  const boundedScanExit = new Date(Math.min(
    candidateExit.getTime(),
    addDays(candidateEntry, ROLLING_WINDOW_DAYS - 1).getTime()
  ));
  const stays = [...parsed.existingStays, parsed.candidateStay];

  let firstOverLimitDate: string | null = null;
  let safeThroughDate: string | null = null;
  let peakDaysUsed = 0;

  for (
    let current = candidateEntry;
    current.getTime() <= boundedScanExit.getTime();
    current = addDays(current, 1)
  ) {
    const date = formatISODate(current);
    const usage = calculateWindowedUsage(stays, date);
    peakDaysUsed = Math.max(peakDaysUsed, usage.daysUsed);
    if (usage.overLimit && firstOverLimitDate === null) {
      firstOverLimitDate = date;
    }
    if (firstOverLimitDate === null) safeThroughDate = date;
  }

  const overBy = Math.max(peakDaysUsed - SCHENGEN_ALLOWANCE_DAYS, 0);
  return {
    ...metadata(),
    result: {
      safeForEveryDay: firstOverLimitDate === null,
      status: firstOverLimitDate === null ? semanticStatus(peakDaysUsed) : 'over_limit',
      firstOverLimitDate,
      safeThroughDate,
      peakDaysUsed,
      minimumDaysRemaining: Math.max(SCHENGEN_ALLOWANCE_DAYS - peakDaysUsed, 0),
      overBy
    }
  };
}

export function latestSafeExit(input: LatestSafeExitInput): LatestSafeExitOutput {
  const parsed = parseInput(LatestSafeExitInputSchema, input);
  const earliestRelevantDate = formatISODate(
    addDays(parseISODate(parsed.entryDate), -(ROLLING_WINDOW_DAYS - 1))
  );
  const latestRelevantDate = formatISODate(
    addDays(parseISODate(parsed.entryDate), ROLLING_WINDOW_DAYS + SCHENGEN_ALLOWANCE_DAYS - 1)
  );
  const relevantStays = clipStays(parsed.existingStays, earliestRelevantDate, latestRelevantDate);

  return {
    ...metadata(),
    result: {
      entryDate: parsed.entryDate,
      latestSafeExitDate: engineLatestSafeExitDate(relevantStays, parsed.entryDate)
    }
  };
}

function parseInput<TSchema extends z.ZodType>(schema: TSchema, input: unknown): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) throw capabilityValidationError(result.error);
  return result.data;
}

function metadata() {
  return {
    schemaVersion: SCHEMA_VERSION,
    ruleSet: RULE_SET,
    advisory: { ...PLANNING_AID_ADVISORY }
  };
}

function semanticStatus(daysUsed: number): SemanticStatus {
  if (daysUsed > SCHENGEN_ALLOWANCE_DAYS) return 'over_limit';
  const daysRemaining = SCHENGEN_ALLOWANCE_DAYS - daysUsed;
  if (daysRemaining === 0) return 'at_limit';
  if (daysRemaining <= CLOSE_BUFFER_DAYS) return 'near_limit';
  return 'within_limit';
}

function calculateWindowedUsage(stays: readonly SchengenStay[], referenceDate: string): UsageResult {
  const windowStart = formatISODate(
    addDays(parseISODate(referenceDate), -(ROLLING_WINDOW_DAYS - 1))
  );
  return calculateUsageOnDate(clipStays(stays, windowStart, referenceDate), referenceDate);
}

function clipStays(
  stays: readonly SchengenStay[],
  rangeStart: string,
  rangeEnd: string
): SchengenStay[] {
  const clipped: SchengenStay[] = [];
  for (const stay of stays) {
    if (stay.exitDate < rangeStart || stay.entryDate > rangeEnd) continue;
    clipped.push({
      entryDate: stay.entryDate < rangeStart ? rangeStart : stay.entryDate,
      exitDate: stay.exitDate > rangeEnd ? rangeEnd : stay.exitDate
    });
  }
  return clipped;
}
