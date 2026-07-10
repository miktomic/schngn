import {
  addDays,
  calculateUsageOnDate,
  classifyVerdict,
  countsForShortStay,
  formatISODate,
  latestSafeExitDate,
  parseISODate,
  type UsageResult,
} from "@schngn/engine";
import { type EditableTrip, sortTrips, toEngineTrips } from "../trips/tripCrud";

export type DashboardStatusTone = "safe" | "close" | "risk";

export interface DashboardState {
  actionCopy: string;
  daysUsedLabel: string;
  heroMetric: string;
  latestSafeExitLabel: string;
  referenceDate: string;
  statusLabel: string;
  statusTone: DashboardStatusTone;
  targetTrip: EditableTrip | null;
  usage: UsageResult;
  whyCopy: string;
  windowLabel: string;
}

export function buildDashboardState(
  trips: EditableTrip[],
  referenceDate?: string
): DashboardState {
  const sortedTrips = sortTrips(trips);
  const earliestConflict = findEarliestPlannedConflict(sortedTrips);
  const targetTrip = earliestConflict?.trip ?? chooseTargetTrip(sortedTrips);
  const effectiveReferenceDate =
    referenceDate ?? earliestConflict?.date ?? targetTrip?.exitDate ?? todayISODate();
  const usage = calculateUsageOnDate(
    toEngineTrips(sortedTrips),
    effectiveReferenceDate
  );
  const targetName = targetTrip?.label ?? targetTrip?.countryCode ?? "Trip";
  const statusTone = toDashboardTone(usage);
  const latestSafeExit = targetTrip
    ? calculateLatestSafeExit(sortedTrips, targetTrip)
    : null;

  return {
    actionCopy: formatActionCopy(usage, targetName, targetTrip, latestSafeExit),
    daysUsedLabel: `${usage.daysUsed} / 90`,
    heroMetric: formatHeroMetric(usage),
    latestSafeExitLabel: latestSafeExit
      ? formatShortDate(latestSafeExit)
      : targetTrip
        ? "No safe stay"
        : "Add dates",
    referenceDate: effectiveReferenceDate,
    statusLabel: formatStatusLabel(statusTone, targetName, targetTrip),
    statusTone,
    targetTrip,
    usage,
    whyCopy: formatWhyCopy(usage, targetName, targetTrip),
    windowLabel: formatWindowLabel(usage.windowStart, usage.windowEnd),
  };
}

function findEarliestPlannedConflict(
  trips: EditableTrip[]
): { date: string; trip: EditableTrip } | null {
  const checkpoints = new Map<string, EditableTrip>();
  const plannedTrips = trips
    .filter((trip) => trip.status === "booked" || trip.status === "what-if")
    .filter((trip) => countsForShortStay(trip));

  for (const trip of plannedTrips) {
    const exit = parseISODate(trip.exitDate);
    for (
      let current = parseISODate(trip.entryDate);
      current.getTime() <= exit.getTime();
      current = addDays(current, 1)
    ) {
      const date = formatISODate(current);
      if (!checkpoints.has(date)) checkpoints.set(date, trip);
    }
  }

  const engineTrips = toEngineTrips(trips);
  for (const [date, trip] of [...checkpoints.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (calculateUsageOnDate(engineTrips, date).overLimit) return { date, trip };
  }

  return null;
}

function chooseTargetTrip(trips: EditableTrip[]): EditableTrip | null {
  const plannedTrips = trips.filter(
    (trip) => trip.status === "booked" || trip.status === "what-if"
  );
  return (
    [...(plannedTrips.length > 0 ? plannedTrips : trips)]
      .sort((a, b) => a.exitDate.localeCompare(b.exitDate))
      .at(-1) ?? null
  );
}

function calculateLatestSafeExit(
  trips: EditableTrip[],
  targetTrip: EditableTrip
): string | null {
  const existingTrips = toEngineTrips(
    trips.filter((trip) => trip.id !== targetTrip.id)
  );
  return latestSafeExitDate(
    existingTrips,
    targetTrip.entryDate,
    targetTrip.countryCode
  );
}

function toDashboardTone(usage: UsageResult): DashboardStatusTone {
  const verdict = classifyVerdict(usage);
  if (verdict.state === "over") {
    return "risk";
  }
  if (verdict.state === "close") {
    return "close";
  }
  return "safe";
}

function formatHeroMetric(usage: UsageResult): string {
  if (usage.overLimit) {
    return `${usage.overBy} ${usage.overBy === 1 ? "day" : "days"} over limit`;
  }
  return `${usage.daysRemaining} safe buffer ${usage.daysRemaining === 1 ? "day" : "days"}`;
}

function formatStatusLabel(
  tone: DashboardStatusTone,
  targetName: string,
  targetTrip: EditableTrip | null
): string {
  if (!targetTrip) {
    return "Add a trip";
  }
  if (tone === "risk") {
    return `${targetName} needs changes`;
  }
  if (tone === "close") {
    return `${targetName} at limit`;
  }
  return `${targetName} fits`;
}

function formatWhyCopy(
  usage: UsageResult,
  targetName: string,
  targetTrip: EditableTrip | null
): string {
  if (!targetTrip) {
    return "Add your trip dates to see the rolling 180-day window, counted days, and safe buffer.";
  }

  if (usage.overLimit) {
    return `Looking backward from ${formatShortDate(usage.referenceDate)}, ${targetName} leaves ${usage.daysUsed} counted days in the 180-day window. That is ${usage.overBy} ${usage.overBy === 1 ? "day" : "days"} over the 90-day limit.`;
  }

  return `Looking backward from ${formatShortDate(usage.referenceDate)}, ${targetName} leaves ${usage.daysUsed} counted days in the 180-day window. ${usage.daysRemaining} ${usage.daysRemaining === 1 ? "day remains" : "days remain"} before the 90-day limit.`;
}

function formatActionCopy(
  usage: UsageResult,
  targetName: string,
  targetTrip: EditableTrip | null,
  latestSafeExit: string | null
): string {
  if (!targetTrip) {
    return "Add your next Schengen trip to get a clear safe/risk answer.";
  }
  if (usage.overLimit) {
    return `First fix: shorten or move ${targetName}, then recalculate before booking.`;
  }
  if (latestSafeExit) {
    return `Current plan exits ${formatShortDate(targetTrip.exitDate)}. Latest calculated safe exit is ${formatShortDate(latestSafeExit)}.`;
  }
  return "This trip does not count toward the Schengen short-stay limit.";
}

function formatWindowLabel(windowStart: string, windowEnd: string): string {
  const start = parseDateParts(windowStart);
  const end = parseDateParts(windowEnd);
  const startLabel = `${monthName(start.month)} ${start.day}`;
  const endLabel = `${monthName(end.month)} ${end.day}, ${end.year}`;
  return `${startLabel}-${endLabel}`;
}

function formatShortDate(isoDate: string): string {
  const { month, day } = parseDateParts(isoDate);
  return `${monthName(month)} ${day}`;
}

function parseDateParts(isoDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { day, month, year };
}

function monthName(month: number): string {
  return [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][month - 1];
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
