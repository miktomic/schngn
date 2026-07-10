const MS_PER_DAY = 86_400_000;

export const SCHENGEN_ALLOWANCE_DAYS = 90;
export const ROLLING_WINDOW_DAYS = 180;
export const CLOSE_BUFFER_DAYS = 7;

export type VerdictState = 'ok' | 'close' | 'over';

export interface SchengenStay {
  entryDate: string;
  exitDate: string;
  label?: string;
}

/** @deprecated Prefer SchengenStay. Kept as a source-compatible name for consumers. */
export type Trip = SchengenStay;

export interface UsageResult {
  referenceDate: string;
  windowStart: string;
  windowEnd: string;
  daysUsed: number;
  daysRemaining: number;
  overLimit: boolean;
  overBy: number;
  countedDays: string[];
}

export interface VerdictInput {
  daysRemaining: number;
  overLimit: boolean;
  overBy: number;
}

export interface Verdict {
  state: VerdictState;
  label: string;
  tone: 'success' | 'warning' | 'danger';
}

export function calculateUsageOnDate(stays: SchengenStay[], referenceDate: string): UsageResult {
  const reference = parseISODate(referenceDate);
  const windowStart = addDays(reference, -(ROLLING_WINDOW_DAYS - 1));
  const countedDays = new Set<string>();

  for (const stay of stays) {
    const entry = parseISODate(stay.entryDate);
    const exit = parseISODate(stay.exitDate);
    assertValidTripRange(entry, exit, stay);

    for (let current = entry; current.getTime() <= exit.getTime(); current = addDays(current, 1)) {
      if (current.getTime() < windowStart.getTime()) continue;
      if (current.getTime() > reference.getTime()) continue;
      countedDays.add(formatISODate(current));
    }
  }

  const daysUsed = countedDays.size;
  const daysRemaining = Math.max(SCHENGEN_ALLOWANCE_DAYS - daysUsed, 0);
  const overBy = Math.max(daysUsed - SCHENGEN_ALLOWANCE_DAYS, 0);

  return {
    referenceDate: formatISODate(reference),
    windowStart: formatISODate(windowStart),
    windowEnd: formatISODate(reference),
    daysUsed,
    daysRemaining,
    overLimit: overBy > 0,
    overBy,
    countedDays: [...countedDays].sort()
  };
}

export function classifyVerdict(usage: VerdictInput, closeBufferDays = CLOSE_BUFFER_DAYS): Verdict {
  if (usage.overLimit || usage.overBy > 0) {
    return { state: 'over', label: 'Overstay / over limit', tone: 'danger' };
  }

  if (usage.daysRemaining > closeBufferDays) {
    return { state: 'ok', label: 'OK', tone: 'success' };
  }

  if (usage.daysRemaining <= 0) {
    return { state: 'close', label: 'At limit', tone: 'warning' };
  }

  return { state: 'close', label: 'Cutting it close', tone: 'warning' };
}

export function latestSafeExitDate(
  existingStays: SchengenStay[],
  entryDate: string,
  maxSearchDays = ROLLING_WINDOW_DAYS + SCHENGEN_ALLOWANCE_DAYS
): string | null {
  const entry = parseISODate(entryDate);

  let latestSafe: string | null = null;

  for (let offset = 0; offset < maxSearchDays; offset += 1) {
    const exitDate = formatISODate(addDays(entry, offset));
    const candidateStay: SchengenStay = { entryDate: formatISODate(entry), exitDate };

    if (!isTripSafeForEveryDay(existingStays, candidateStay)) {
      return latestSafe;
    }

    latestSafe = exitDate;
  }

  return latestSafe;
}

export function isTripSafeForEveryDay(existingStays: SchengenStay[], candidateStay: SchengenStay): boolean {
  const entry = parseISODate(candidateStay.entryDate);
  const exit = parseISODate(candidateStay.exitDate);
  assertValidTripRange(entry, exit, candidateStay);

  const staysWithCandidate = [...existingStays, candidateStay];

  for (let current = entry; current.getTime() <= exit.getTime(); current = addDays(current, 1)) {
    const usage = calculateUsageOnDate(staysWithCandidate, formatISODate(current));
    if (usage.daysUsed > SCHENGEN_ALLOWANCE_DAYS) return false;
  }

  return true;
}

export function parseISODate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError(`Expected ISO date YYYY-MM-DD, got ${value}`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || formatISODate(date) !== value) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  return date;
}

export function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function assertValidTripRange(entry: Date, exit: Date, stay: SchengenStay): void {
  if (exit.getTime() < entry.getTime()) {
    throw new RangeError(`Stay exit date ${stay.exitDate} cannot be before entry date ${stay.entryDate}`);
  }
}
