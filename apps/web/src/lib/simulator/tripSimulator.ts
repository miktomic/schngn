import {
  calculateUsageOnDate,
  classifyVerdict,
  isTripSafeForEveryDay,
  latestSafeExitDate,
  type Trip,
  type UsageResult,
} from "@schngn/engine";
import {
  inclusiveTripDays,
  toEngineTrips,
  validateTripInput,
  type EditableTrip,
  type TripValidationErrors,
} from "../trips/tripCrud";

export type SimulationTone = "safe" | "close" | "risk" | "neutral";

export interface ProposedTripInput {
  countryCode?: string;
  entryDate: string;
  exitDate: string;
  label?: string;
}

export interface TripSimulationState {
  daysUsedLabel: string;
  errors: TripValidationErrors;
  firstFixCopy: string;
  latestSafeExitLabel: string;
  maxStayLabel: string;
  simulatedTrip: Trip | null;
  statusLabel: string;
  statusTone: SimulationTone;
  summaryCopy: string;
  usage: UsageResult | null;
  valid: boolean;
}

export function buildTripSimulationState(
  savedTrips: EditableTrip[],
  proposed: ProposedTripInput
): TripSimulationState {
  const normalizedProposal = normalizeProposal(proposed);
  const errors = validateTripInput({ ...normalizedProposal, status: "what-if" });

  if (Object.keys(errors).length > 0) {
    return emptySimulation(errors);
  }

  const existingTrips = toEngineTrips(savedTrips);
  const simulatedTrip: Trip = {
    countryCode: normalizedProposal.countryCode,
    entryDate: normalizedProposal.entryDate,
    exitDate: normalizedProposal.exitDate,
    label: normalizedProposal.label,
  };
  const tripsWithSimulation = [...existingTrips, simulatedTrip];
  const usage = calculateUsageOnDate(
    tripsWithSimulation,
    normalizedProposal.exitDate
  );
  const safeForEveryDay = isTripSafeForEveryDay(existingTrips, simulatedTrip);
  const verdict = safeForEveryDay
    ? classifyVerdict(usage)
    : { state: "over" as const };
  const tone = verdict.state === "over" ? "risk" : verdict.state === "close" ? "close" : "safe";
  const latestSafeExit = latestSafeExitDate(
    existingTrips,
    normalizedProposal.entryDate,
    normalizedProposal.countryCode
  );
  const targetName = normalizedProposal.label || normalizedProposal.countryCode || "Trip";

  return {
    daysUsedLabel: `${usage.daysUsed} / 90`,
    errors: {},
    firstFixCopy: formatFirstFixCopy(tone, latestSafeExit, targetName),
    latestSafeExitLabel: latestSafeExit ? formatShortDate(latestSafeExit) : "No safe stay",
    maxStayLabel: formatMaxStayLabel(normalizedProposal.entryDate, latestSafeExit),
    simulatedTrip,
    statusLabel: formatStatusLabel(tone, targetName),
    statusTone: tone,
    summaryCopy: formatSummaryCopy(tone, usage, targetName, safeForEveryDay),
    usage,
    valid: true,
  };
}

function emptySimulation(errors: TripValidationErrors): TripSimulationState {
  return {
    daysUsedLabel: "- / 90",
    errors,
    firstFixCopy: "Enter a valid entry and exit date to simulate a trip.",
    latestSafeExitLabel: "Add dates",
    maxStayLabel: "Add dates",
    simulatedTrip: null,
    statusLabel: "Add dates to simulate",
    statusTone: "neutral",
    summaryCopy: "Add proposed dates to see whether a future trip fits.",
    usage: null,
    valid: false,
  };
}

function normalizeProposal(proposed: ProposedTripInput): Required<Pick<ProposedTripInput, "entryDate" | "exitDate">> &
  Pick<ProposedTripInput, "countryCode" | "label"> {
  const countryCode = proposed.countryCode?.trim().toUpperCase() || undefined;
  const label = proposed.label?.trim() || (countryCode ? `${countryCode} trip` : "What-if trip");
  return {
    countryCode,
    entryDate: proposed.entryDate,
    exitDate: proposed.exitDate,
    label,
  };
}

function formatStatusLabel(tone: SimulationTone, targetName: string): string {
  if (tone === "risk") {
    return `${targetName} needs changes`;
  }
  if (tone === "close") {
    return `${targetName} at limit`;
  }
  return `${targetName} fits`;
}

function formatSummaryCopy(
  tone: SimulationTone,
  usage: UsageResult,
  targetName: string,
  safeForEveryDay: boolean
): string {
  if (tone === "risk" || !safeForEveryDay) {
    return `${targetName} would exceed the limit before exit. The exit-day window shows ${usage.daysUsed} counted days.`;
  }

  return `${targetName} fits with ${usage.daysRemaining} safe buffer ${usage.daysRemaining === 1 ? "day" : "days"}. Exit-day window shows ${usage.daysUsed} counted days.`;
}

function formatFirstFixCopy(
  tone: SimulationTone,
  latestSafeExit: string | null,
  targetName: string
): string {
  if (tone === "risk") {
    return latestSafeExit
      ? `First fix: shorten ${targetName}. Latest safe exit is ${formatShortDate(latestSafeExit)}.`
      : `First fix: move ${targetName} later or reduce earlier Schengen days.`;
  }

  return latestSafeExit
    ? `You can stay until ${formatShortDate(latestSafeExit)} before this start date runs out of allowance.`
    : "This proposed country does not use Schengen short-stay allowance.";
}

function formatMaxStayLabel(entryDate: string, latestSafeExit: string | null): string {
  if (!latestSafeExit) {
    return "Not applicable";
  }

  const days = inclusiveTripDays({ entryDate, exitDate: latestSafeExit });
  return `${days} ${days === 1 ? "day" : "days"} max from ${formatShortDate(entryDate)}`;
}

function formatShortDate(isoDate: string): string {
  const [_, month, day] = isoDate.split("-").map(Number);
  return `${monthName(month)} ${day}`;
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
