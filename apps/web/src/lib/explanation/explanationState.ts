import { addDays, calculateUsageOnDate, countsForShortStay, formatISODate, parseISODate } from '@schngn/engine';
import { sortTrips, toEngineTrips, type EditableTrip } from '../trips/tripCrud';

export interface CountedTripRow {
  label: string;
  rangeLabel: string;
  daysLabel: string;
}

export interface ExplanationState {
  countedTripRows: CountedTripRow[];
  heading: string;
  ruleBullets: string[];
  summary: string;
  verdictLine: string;
  windowLabel: string;
}

export function buildExplanationState(trips: EditableTrip[], referenceDate: string): ExplanationState {
  const sortedTrips = sortTrips(trips);
  const usage = calculateUsageOnDate(toEngineTrips(sortedTrips), referenceDate);
  const countedDays = new Set(usage.countedDays);
  const referenceLabel = formatShortDate(usage.referenceDate);
  const windowStartLabel = formatShortDate(usage.windowStart);
  const windowEndLabel = formatShortDate(usage.windowEnd);

  return {
    countedTripRows: buildCountedTripRows(sortedTrips, countedDays),
    heading: 'Why this number?',
    ruleBullets: [
      'Entry and exit dates both count.',
      `The app looks back 180 calendar days from ${referenceLabel}, including ${referenceLabel} itself.`,
      'Only Schengen short-stay countries count. Ireland and Cyprus are excluded.'
    ],
    summary: usage.overLimit
      ? `${usage.daysUsed} counted days between ${windowStartLabel} and ${windowEndLabel}. That is ${usage.overBy} ${pluralize('day', usage.overBy)} over the 90-day limit.`
      : `${usage.daysUsed} counted days between ${windowStartLabel} and ${windowEndLabel}. That leaves ${usage.daysRemaining} safe buffer ${pluralize('day', usage.daysRemaining)}.`,
    verdictLine: usage.overLimit
      ? 'Calculation result: over the ordinary short-stay allowance. Check official sources before booking or travelling.'
      : 'Calculation result: within the ordinary short-stay allowance. Check official sources before booking or travelling.',
    windowLabel: `${windowStartLabel} to ${windowEndLabel}`
  };
}

function buildCountedTripRows(trips: EditableTrip[], countedDays: Set<string>): CountedTripRow[] {
  return trips
    .map((trip) => {
      const days = countTripDaysInSet(trip, countedDays);
      if (days <= 0) return null;
      return {
        label: trip.label ?? trip.countryCode ?? 'Schengen trip',
        rangeLabel: `${formatShortDate(trip.entryDate)} to ${formatShortDate(trip.exitDate)}`,
        daysLabel: `${days} ${pluralize('day', days)} counted`
      } satisfies CountedTripRow;
    })
    .filter((row): row is CountedTripRow => row !== null);
}

function countTripDaysInSet(trip: EditableTrip, countedDays: Set<string>): number {
  if (!countsForShortStay(trip)) return 0;

  const entry = parseISODate(trip.entryDate);
  const exit = parseISODate(trip.exitDate);
  let count = 0;

  for (let current = entry; current.getTime() <= exit.getTime(); current = addDays(current, 1)) {
    if (countedDays.has(formatISODate(current))) count += 1;
  }

  return count;
}

function formatShortDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}
