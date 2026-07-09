import { addDays, calculateUsageOnDate, countsForShortStay, formatISODate, parseISODate } from '@schngn/engine';
import { sortTrips, toEngineTrips, type EditableTrip } from '../trips/tripCrud';

export interface ReturningDaysForecastOptions {
  referenceDate: string;
  horizonDays?: number;
}

export interface ReturningDayRow {
  date: string;
  dateLabel: string;
  daysReturned: number;
  daysLabel: string;
  source: string;
}

export interface ReturningDaysForecast {
  referenceDate: string;
  horizonDays: number;
  currentUsed: number;
  currentUsedLabel: string;
  summaryLabel: string;
  nextReturnLabel: string;
  rows: ReturningDayRow[];
}

const DEFAULT_HORIZON_DAYS = 30;

export function buildReturningDaysForecast(
  trips: EditableTrip[],
  options: ReturningDaysForecastOptions
): ReturningDaysForecast {
  const horizonDays = options.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const reference = parseISODate(options.referenceDate);
  const engineTrips = toEngineTrips(trips);
  const usage = calculateUsageOnDate(engineTrips, options.referenceDate);
  const countedDays = new Set(usage.countedDays);
  const sourcesByCountedDay = sourceLabelsByCountedDay(sortTrips(trips), countedDays);
  const rows: ReturningDayRow[] = [];

  for (const countedDay of usage.countedDays) {
    const returnDate = addDays(parseISODate(countedDay), 180);
    const offset = daysBetween(reference, returnDate);
    if (offset <= 0 || offset > horizonDays) continue;

    const source = sourcesByCountedDay.get(countedDay) ?? `Counted day ${formatShortDate(countedDay)} leaves the window`;
    rows.push({
      date: formatISODate(returnDate),
      dateLabel: formatShortDate(formatISODate(returnDate)),
      daysReturned: 1,
      daysLabel: '+1 day',
      source
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  const totalReturningDays = rows.reduce((total, row) => total + row.daysReturned, 0);

  return {
    referenceDate: usage.referenceDate,
    horizonDays,
    currentUsed: usage.daysUsed,
    currentUsedLabel: `${usage.daysUsed} / 90 used`,
    summaryLabel:
      totalReturningDays > 0
        ? `${totalReturningDays} ${pluralize('day', totalReturningDays)} return in the next ${horizonDays} days`
        : `No counted days return in the next ${horizonDays} days`,
    nextReturnLabel: rows[0] ? `Next return: ${rows[0].dateLabel}` : 'No returning days in this window',
    rows
  };
}

function sourceLabelsByCountedDay(trips: EditableTrip[], countedDays: Set<string>): Map<string, string> {
  const sources = new Map<string, string>();

  for (const trip of trips) {
    if (!countsForShortStay(trip)) continue;
    const entry = parseISODate(trip.entryDate);
    const exit = parseISODate(trip.exitDate);

    for (let current = entry; current.getTime() <= exit.getTime(); current = addDays(current, 1)) {
      const iso = formatISODate(current);
      if (!countedDays.has(iso) || sources.has(iso)) continue;
      sources.set(iso, `${trip.label ?? trip.countryCode ?? 'Schengen trip'} ${formatShortDate(iso)} leaves the window`);
    }
  }

  return sources;
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function formatShortDate(isoDate: string): string {
  const date = parseISODate(isoDate);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}
