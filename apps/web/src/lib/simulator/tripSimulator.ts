import {
  addDays,
  calculateUsageOnDate,
  classifyVerdict,
  countsForShortStay,
  formatISODate,
  latestSafeExitDate,
  parseISODate,
  type Trip,
  type UsageResult
} from '@schngn/engine';
import {
  inclusiveTripDays,
  toEngineTrips,
  validateTripInput,
  type EditableTrip,
  type TripStatus,
  type TripValidationErrors
} from '../trips/tripCrud';
import { normalizeCountryCode } from '../trips/countries';

export type SimulationTone = 'safe' | 'close' | 'risk' | 'neutral';

export interface ProposedTripInput {
  countryCode?: string;
  entryDate: string;
  exitDate: string;
  label?: string;
}

export interface TripSimulationConflict {
  date: string;
  tripId?: string;
  tripLabel: string;
  tripStatus: TripStatus | 'proposal';
}

export interface TripSimulationState {
  conflict: TripSimulationConflict | null;
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

interface EvaluationOwner {
  tripId?: string;
  tripLabel: string;
  tripStatus: TripStatus | 'proposal';
}

interface InternalConflict extends TripSimulationConflict {
  usage: UsageResult;
}

interface ItineraryAssessment {
  conflict: InternalConflict | null;
  peakUsage: UsageResult;
}

const AFFECTED_WINDOW_DAYS_AFTER_EXIT = 179;
const MILLISECONDS_PER_DAY = 86_400_000;

export function buildTripSimulationState(
  savedTrips: EditableTrip[],
  proposed: ProposedTripInput
): TripSimulationState {
  const normalizedProposal = normalizeProposal(proposed);
  const errors = validateTripInput({ ...normalizedProposal, status: 'what-if' });

  if (Object.keys(errors).length > 0) {
    return emptySimulation(errors);
  }

  const existingTrips = toEngineTrips(savedTrips);
  const simulatedTrip: Trip = {
    countryCode: normalizedProposal.countryCode,
    entryDate: normalizedProposal.entryDate,
    exitDate: normalizedProposal.exitDate,
    label: normalizedProposal.label
  };
  const targetName = normalizedProposal.label || normalizedProposal.countryCode || 'Trip';

  if (!countsForShortStay(simulatedTrip)) {
    const usage = calculateUsageOnDate(existingTrips, normalizedProposal.exitDate);
    return {
      conflict: null,
      daysUsedLabel: `${usage.daysUsed} / 90`,
      errors: {},
      firstFixCopy: 'This country does not use Schengen short-stay allowance.',
      latestSafeExitLabel: 'Not applicable',
      maxStayLabel: 'Not applicable',
      simulatedTrip,
      statusLabel: `${targetName} does not count`,
      statusTone: 'safe',
      summaryCopy: `${targetName} is outside the Schengen short-stay count, so it does not use or reduce the 90-day allowance.`,
      usage,
      valid: true
    };
  }

  const assessment = assessAffectedItinerary(savedTrips, simulatedTrip, targetName);
  const usage = assessment.conflict?.usage ?? assessment.peakUsage;
  const verdict = assessment.conflict ? { state: 'over' as const } : classifyVerdict(usage);
  const tone: SimulationTone = verdict.state === 'over' ? 'risk' : verdict.state === 'close' ? 'close' : 'safe';
  const latestSafeExit = findLatestProtectedExit(savedTrips, simulatedTrip, targetName);
  const conflict = assessment.conflict ? publicConflict(assessment.conflict) : null;

  return {
    conflict,
    daysUsedLabel: `${usage.daysUsed} / 90`,
    errors: {},
    firstFixCopy: formatFirstFixCopy(tone, latestSafeExit, targetName, conflict),
    latestSafeExitLabel: latestSafeExit ? formatShortDate(latestSafeExit) : 'No safe stay',
    maxStayLabel: formatMaxStayLabel(normalizedProposal.entryDate, latestSafeExit),
    simulatedTrip,
    statusLabel: formatStatusLabel(tone, targetName),
    statusTone: tone,
    summaryCopy: formatSummaryCopy(tone, usage, targetName, conflict),
    usage,
    valid: true
  };
}

function emptySimulation(errors: TripValidationErrors): TripSimulationState {
  return {
    conflict: null,
    daysUsedLabel: '- / 90',
    errors,
    firstFixCopy: 'Enter valid trip details to simulate a trip.',
    latestSafeExitLabel: 'Add dates',
    maxStayLabel: 'Add dates',
    simulatedTrip: null,
    statusLabel: 'Add dates to simulate',
    statusTone: 'neutral',
    summaryCopy: 'Add a proposed trip to see whether it and later commitments still fit.',
    usage: null,
    valid: false
  };
}

function normalizeProposal(proposed: ProposedTripInput): Required<Pick<ProposedTripInput, 'entryDate' | 'exitDate'>> &
  Pick<ProposedTripInput, 'countryCode' | 'label'> {
  const countryCode = normalizeCountryCode(proposed.countryCode);
  const label = proposed.label?.trim() || (countryCode ? `${countryCode} trip` : 'What-if trip');
  return {
    countryCode,
    entryDate: proposed.entryDate,
    exitDate: proposed.exitDate,
    label
  };
}

function assessAffectedItinerary(
  savedTrips: EditableTrip[],
  simulatedTrip: Trip,
  targetName: string
): ItineraryAssessment {
  const existingTrips = toEngineTrips(savedTrips);
  const tripsWithSimulation = [...existingTrips, simulatedTrip];
  const checkpoints = buildAffectedCheckpoints(savedTrips, simulatedTrip, targetName);
  const firstCheckpoint = checkpoints.keys().next().value as string | undefined;
  const fallbackDate = firstCheckpoint ?? simulatedTrip.exitDate;
  let peakUsage = calculateUsageOnDate(tripsWithSimulation, fallbackDate);
  let conflict: InternalConflict | null = null;

  for (const [date, owner] of checkpoints) {
    const usage = calculateUsageOnDate(tripsWithSimulation, date);
    if (usage.daysUsed > peakUsage.daysUsed) peakUsage = usage;

    if (!conflict && usage.daysUsed > 90) {
      conflict = {
        date,
        tripId: owner.tripId,
        tripLabel: owner.tripLabel,
        tripStatus: owner.tripStatus,
        usage
      };
    }
  }

  return { conflict, peakUsage };
}

function buildAffectedCheckpoints(
  savedTrips: EditableTrip[],
  simulatedTrip: Trip,
  targetName: string
): Map<string, EvaluationOwner> {
  const checkpoints = new Map<string, EvaluationOwner>();
  const proposalOwner: EvaluationOwner = {
    tripLabel: targetName,
    tripStatus: 'proposal'
  };
  addCheckpointRange(checkpoints, simulatedTrip.entryDate, simulatedTrip.exitDate, proposalOwner);

  const affectedThrough = formatISODate(
    addDays(parseISODate(simulatedTrip.exitDate), AFFECTED_WINDOW_DAYS_AFTER_EXIT)
  );
  const plannedTrips = savedTrips
    .filter((trip) => trip.status === 'booked' || trip.status === 'what-if')
    .filter((trip) => countsForShortStay(trip))
    .filter((trip) => trip.exitDate >= simulatedTrip.entryDate && trip.entryDate <= affectedThrough)
    .sort((left, right) => left.entryDate.localeCompare(right.entryDate) || left.id.localeCompare(right.id));

  for (const trip of plannedTrips) {
    const startDate = trip.entryDate < simulatedTrip.entryDate ? simulatedTrip.entryDate : trip.entryDate;
    const endDate = trip.exitDate > affectedThrough ? affectedThrough : trip.exitDate;
    addCheckpointRange(
      checkpoints,
      startDate,
      endDate,
      { tripId: trip.id, tripLabel: trip.label, tripStatus: trip.status },
      false
    );
  }

  return new Map([...checkpoints.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function addCheckpointRange(
  checkpoints: Map<string, EvaluationOwner>,
  entryDate: string,
  exitDate: string,
  owner: EvaluationOwner,
  overwrite = true
): void {
  const exit = parseISODate(exitDate);

  for (let current = parseISODate(entryDate); current.getTime() <= exit.getTime(); current = addDays(current, 1)) {
    const date = formatISODate(current);
    if (overwrite || !checkpoints.has(date)) checkpoints.set(date, owner);
  }
}

function findLatestProtectedExit(
  savedTrips: EditableTrip[],
  simulatedTrip: Trip,
  targetName: string
): string | null {
  const existingTrips = toEngineTrips(savedTrips);
  const engineLatestExit = latestSafeExitDate(existingTrips, simulatedTrip.entryDate, simulatedTrip.countryCode);
  if (!engineLatestExit) return null;

  const entry = parseISODate(simulatedTrip.entryDate);
  const engineLatest = parseISODate(engineLatestExit);
  let latestProtectedExit: string | null = null;
  let lowerOffset = 0;
  let upperOffset = Math.floor((engineLatest.getTime() - entry.getTime()) / MILLISECONDS_PER_DAY);

  // A longer continuous proposal only adds counted days, so safety is
  // monotonic and the last protected exit can be found without rescanning
  // every possible trip length on each keystroke.
  while (lowerOffset <= upperOffset) {
    const middleOffset = Math.floor((lowerOffset + upperOffset) / 2);
    const candidateExit = addDays(entry, middleOffset);
    const exitDate = formatISODate(candidateExit);
    const candidate = { ...simulatedTrip, exitDate };
    const assessment = assessAffectedItinerary(savedTrips, candidate, targetName);
    if (assessment.conflict) {
      upperOffset = middleOffset - 1;
    } else {
      latestProtectedExit = exitDate;
      lowerOffset = middleOffset + 1;
    }
  }

  return latestProtectedExit;
}

function publicConflict(conflict: InternalConflict): TripSimulationConflict {
  return {
    date: conflict.date,
    tripId: conflict.tripId,
    tripLabel: conflict.tripLabel,
    tripStatus: conflict.tripStatus
  };
}

function formatStatusLabel(tone: SimulationTone, targetName: string): string {
  if (tone === 'risk') return `${targetName} needs changes`;
  if (tone === 'close') return `${targetName} at limit`;
  return `${targetName} fits`;
}

function formatSummaryCopy(
  tone: SimulationTone,
  usage: UsageResult,
  targetName: string,
  conflict: TripSimulationConflict | null
): string {
  if (tone === 'risk' && conflict?.tripStatus !== 'proposal') {
    return `${conflict?.tripLabel ?? 'A later trip'} would reach ${usage.daysUsed} / 90 on ${formatShortDate(conflict?.date ?? usage.referenceDate)} if ${targetName} were added. Change the proposal to protect that commitment.`;
  }

  if (tone === 'risk') {
    return `${targetName} would exceed the limit before exit. The first over-limit day reaches ${usage.daysUsed} / 90 on ${formatShortDate(conflict?.date ?? usage.referenceDate)}.`;
  }

  return `${targetName} fits with ${usage.daysRemaining} safe buffer ${usage.daysRemaining === 1 ? 'day' : 'days'}. Highest affected-day window shows ${usage.daysUsed} counted days.`;
}

function formatFirstFixCopy(
  tone: SimulationTone,
  latestSafeExit: string | null,
  targetName: string,
  conflict: TripSimulationConflict | null
): string {
  if (tone === 'risk' && conflict?.tripStatus !== 'proposal') {
    return latestSafeExit
      ? `First fix: shorten ${targetName} to ${formatShortDate(latestSafeExit)} to protect ${conflict?.tripLabel ?? 'the later trip'}.`
      : `First fix: move ${targetName} later or reduce earlier Schengen days to protect ${conflict?.tripLabel ?? 'the later trip'}.`;
  }

  if (tone === 'risk') {
    return latestSafeExit
      ? `First fix: shorten ${targetName}. Latest safe exit is ${formatShortDate(latestSafeExit)}.`
      : `First fix: move ${targetName} later or reduce earlier Schengen days.`;
  }

  return latestSafeExit
    ? `You can stay until ${formatShortDate(latestSafeExit)} while keeping later commitments safe.`
    : 'This proposed country does not use Schengen short-stay allowance.';
}

function formatMaxStayLabel(entryDate: string, latestSafeExit: string | null): string {
  if (!latestSafeExit) return 'Not applicable';

  const days = inclusiveTripDays({ entryDate, exitDate: latestSafeExit });
  return `${days} ${days === 1 ? 'day' : 'days'} max from ${formatShortDate(entryDate)}`;
}

function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-').map(Number);
  return `${monthName(month)} ${day}`;
}

function monthName(month: number): string {
  return [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ][month - 1];
}
