const DAY_MS = 86_400_000;

export type AdjustmentMode = 'move' | 'entry' | 'exit';

export interface DateAdjustment {
  entryDate: string;
  exitDate: string;
  moveDays: number;
  mode: AdjustmentMode;
}

export interface AdjustmentRange {
  maxDate: string;
  minDate: string;
  totalDays: number;
}

export function buildAdjustmentRange(entryDate: string, exitDate: string): AdjustmentRange {
  const minDate = addIsoDays(entryDate, -90);
  const maxDate = addIsoDays(exitDate, 180);
  return { minDate, maxDate, totalDays: differenceInDays(minDate, maxDate) };
}

export function moveTripDates(entryDate: string, exitDate: string, days: number, range: AdjustmentRange): DateAdjustment {
  const duration = differenceInDays(entryDate, exitDate);
  const earliestEntry = range.minDate;
  const latestEntry = addIsoDays(range.maxDate, -duration);
  const nextEntry = clampIsoDate(addIsoDays(entryDate, days), earliestEntry, latestEntry);
  const appliedDays = differenceInDays(entryDate, nextEntry);
  return { entryDate: nextEntry, exitDate: addIsoDays(exitDate, appliedDays), moveDays: appliedDays, mode: 'move' };
}

export function resizeTripEntry(entryDate: string, exitDate: string, days: number, range: AdjustmentRange): DateAdjustment {
  return { entryDate: clampIsoDate(addIsoDays(entryDate, days), range.minDate, exitDate), exitDate, moveDays: 0, mode: 'entry' };
}

export function resizeTripExit(entryDate: string, exitDate: string, days: number, range: AdjustmentRange): DateAdjustment {
  return { entryDate, exitDate: clampIsoDate(addIsoDays(exitDate, days), entryDate, range.maxDate), moveDays: 0, mode: 'exit' };
}

export function addIsoDays(value: string, days: number): string {
  return new Date(isoTime(value) + days * DAY_MS).toISOString().slice(0, 10);
}

export function differenceInDays(start: string, end: string): number {
  return Math.round((isoTime(end) - isoTime(start)) / DAY_MS);
}

function clampIsoDate(value: string, min: string, max: string): string {
  return value < min ? min : value > max ? max : value;
}

function isoTime(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime();
}
