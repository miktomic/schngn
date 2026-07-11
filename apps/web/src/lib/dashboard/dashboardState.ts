import {
  addDays,
  calculateUsageOnDate,
  classifyVerdict,
  formatISODate,
  latestSafeExitDate,
  parseISODate,
  type UsageResult,
} from "@schngn/engine";
import { currentLocalIsoDate, type EditableTrip, sortTrips, toEngineTrips, tripEntryDate, tripExitDate, tripRouteLabel } from "../trips/tripCrud";

export type DashboardStatusTone = "safe" | "close" | "risk";

export interface DashboardState {
  actionCopy: string;
  completed: boolean;
  daysUsedLabel: string;
  heroMetric: string;
  latestSafeExitLabel: string;
  latestSafeExitDate: string | null;
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
  referenceDate?: string,
  currentDate: string = currentLocalIsoDate()
): DashboardState {
  const sortedTrips = sortTrips(trips);
  const earliestConflict = findEarliestPlannedConflict(sortedTrips);
  const targetTrip = earliestConflict?.trip ?? chooseTargetTrip(sortedTrips);
  const effectiveReferenceDate =
    referenceDate ?? earliestConflict?.date ?? (targetTrip ? tripExitDate(targetTrip) : undefined) ?? currentDate;
  const usage = calculateUsageOnDate(
    toEngineTrips(sortedTrips),
    effectiveReferenceDate
  );
  const targetName = targetTrip?.label ?? (targetTrip ? tripRouteLabel(targetTrip) : "Trip");
  const completed = targetTrip !== null && tripExitDate(targetTrip) < currentDate;
  const statusTone = toDashboardTone(usage);
  const latestSafeExit = targetTrip
    ? calculateLatestSafeExit(sortedTrips, targetTrip)
    : null;

  return {
    actionCopy: formatActionCopy(usage, targetName, targetTrip, latestSafeExit, completed),
    completed,
    daysUsedLabel: `${usage.daysUsed} / 90`,
    heroMetric: formatHeroMetric(usage),
    latestSafeExitLabel: latestSafeExit
      ? formatShortDate(latestSafeExit)
      : targetTrip
        ? "No safe stay"
        : "Add dates",
    latestSafeExitDate: latestSafeExit,
    referenceDate: effectiveReferenceDate,
    statusLabel: formatStatusLabel(statusTone, targetName, targetTrip, completed),
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
    .filter((trip) => trip.status === "booked" || trip.status === "what-if");

  for (const trip of plannedTrips) {
    for (const stay of trip.stays) {
      const exit = parseISODate(stay.exitDate);
      for (let current = parseISODate(stay.entryDate); current <= exit; current = addDays(current, 1)) {
        const date = formatISODate(current);
        if (!checkpoints.has(date)) checkpoints.set(date, trip);
      }
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
      .sort((a, b) => tripExitDate(a).localeCompare(tripExitDate(b)))
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
  const finalStay = targetTrip.stays.at(-1);
  if (!finalStay) return null;
  return latestSafeExitDate([...existingTrips, ...targetTrip.stays.slice(0, -1)], finalStay.entryDate);
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
  targetTrip: EditableTrip | null,
  completed: boolean
): string {
  if (!targetTrip) {
    return "Add a trip";
  }
  if (completed) {
    return `${targetName} · Completed`;
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
  latestSafeExit: string | null,
  completed: boolean
): string {
  if (!targetTrip) {
    return "Add your next Schengen trip to get a clear safe/risk answer.";
  }
  if (completed) {
    return "This completed trip is included in your history. Review the counted days against your travel records.";
  }
  if (usage.overLimit) {
    return `First fix: shorten or move ${targetName}, then recalculate before booking.`;
  }
  if (latestSafeExit) {
    return `Current plan exits ${formatShortDate(tripExitDate(targetTrip))}. Latest calculated safe exit is ${formatShortDate(latestSafeExit)}.`;
  }
  return "No safe final Schengen stay is available from this entry date.";
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
