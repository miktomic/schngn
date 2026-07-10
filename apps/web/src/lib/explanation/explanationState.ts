import { addDays, calculateUsageOnDate, formatISODate, parseISODate } from '@schngn/engine';
import { sortTrips, toEngineTrips, tripEntryDate, tripExitDate, tripRouteLabel, type EditableTrip } from '../trips/tripCrud';

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
      'Travel between Schengen countries is one continuous stay. Full calendar days outside Schengen are not counted.'
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
        label: trip.label ?? tripRouteLabel(trip),
        rangeLabel: `${formatShortDate(tripEntryDate(trip))} to ${formatShortDate(tripExitDate(trip))}`,
        daysLabel: `${days} ${pluralize('day', days)} counted`
      } satisfies CountedTripRow;
    })
    .filter((row): row is CountedTripRow => row !== null);
}

function countTripDaysInSet(trip: EditableTrip, countedDays: Set<string>): number {
  let count = 0;
  const tripDays = new Set<string>();
  for (const stay of trip.stays) {
    const exit = parseISODate(stay.exitDate);
    for (let current = parseISODate(stay.entryDate); current <= exit; current = addDays(current, 1)) {
      tripDays.add(formatISODate(current));
    }
  }
  for (const day of tripDays) if (countedDays.has(day)) count += 1;
  return count;
}

function formatShortDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}
