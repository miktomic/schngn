import {
  addDays,
  calculateUsageOnDate,
  classifyVerdict,
  formatISODate,
  latestSafeExitDate,
  parseISODate,
  type UsageResult
} from '@schngn/engine';
import {
  countTripSchengenDays,
  emptyTripForm,
  inclusiveTripDays,
  toEngineTrips,
  tripEntryDate,
  tripExitDate,
  upsertTrip,
  type EditableTrip,
  type OutsideSchengenBreakInput,
  type TripStatus,
  type TripValidationErrors
} from '../trips/tripCrud';

export type SimulationTone = 'safe' | 'close' | 'risk' | 'neutral';

export interface ProposedTripInput {
  label?: string;
  entryCountryCode?: string;
  exitCountryCode?: string;
  entryDate: string;
  exitDate: string;
  outsideBreaks: OutsideSchengenBreakInput[];
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
  latestSafeExitDate: string | null;
  maxStayLabel: string;
  simulatedTrip: EditableTrip | null;
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

export function emptyProposedTrip(): ProposedTripInput {
  const form = emptyTripForm('what-if');
  return {
    label: form.label,
    entryCountryCode: form.entryCountryCode,
    exitCountryCode: form.exitCountryCode,
    entryDate: form.entryDate,
    exitDate: form.exitDate,
    outsideBreaks: form.outsideBreaks
  };
}

export function buildTripSimulationState(
  savedTrips: EditableTrip[],
  proposed: ProposedTripInput
): TripSimulationState {
  // Simulations are hypothetical regardless of when the chosen dates fall.
  // Using the proposed entry as the status reference keeps this path independent
  // from the real-world clock while the saved-trip form infers Past from today.
  const result = upsertTrip([], { ...proposed, id: 'simulation', status: 'what-if' }, proposed.entryDate);
  if (Object.keys(result.errors).length > 0) return emptySimulation(result.errors);

  const simulatedTrip = result.trips[0];
  const targetName = simulatedTrip.label || 'This trip';
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
    latestSafeExitDate: latestSafeExit,
    maxStayLabel: formatMaxStayLabel(simulatedTrip, latestSafeExit),
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
    firstFixCopy: 'Enter valid Schengen stay details to simulate this trip.',
    latestSafeExitLabel: 'Add dates',
    latestSafeExitDate: null,
    maxStayLabel: 'Add dates',
    simulatedTrip: null,
    statusLabel: 'Add dates to simulate',
    statusTone: 'neutral',
    summaryCopy: 'Add a proposed trip to see whether it and later commitments still fit.',
    usage: null,
    valid: false
  };
}

function assessAffectedItinerary(
  savedTrips: EditableTrip[],
  simulatedTrip: EditableTrip,
  targetName: string
): ItineraryAssessment {
  const staysWithSimulation = [...toEngineTrips(savedTrips), ...toEngineTrips([simulatedTrip])];
  const checkpoints = buildAffectedCheckpoints(savedTrips, simulatedTrip, targetName);
  const fallbackDate = checkpoints.keys().next().value as string | undefined ?? tripExitDate(simulatedTrip);
  let peakUsage = calculateUsageOnDate(staysWithSimulation, fallbackDate);
  let conflict: InternalConflict | null = null;

  for (const [date, owner] of checkpoints) {
    const usage = calculateUsageOnDate(staysWithSimulation, date);
    if (usage.daysUsed > peakUsage.daysUsed) peakUsage = usage;
    if (!conflict && usage.daysUsed > 90) conflict = { date, ...owner, usage };
  }
  return { conflict, peakUsage };
}

function buildAffectedCheckpoints(
  savedTrips: EditableTrip[],
  simulatedTrip: EditableTrip,
  targetName: string
): Map<string, EvaluationOwner> {
  const checkpoints = new Map<string, EvaluationOwner>();
  const proposalOwner: EvaluationOwner = { tripLabel: targetName, tripStatus: 'proposal' };
  for (const stay of simulatedTrip.stays) addCheckpointRange(checkpoints, stay.entryDate, stay.exitDate, proposalOwner);

  const proposalEntry = tripEntryDate(simulatedTrip);
  const affectedThrough = formatISODate(addDays(parseISODate(tripExitDate(simulatedTrip)), AFFECTED_WINDOW_DAYS_AFTER_EXIT));
  const plannedTrips = savedTrips
    .filter((trip) => trip.status === 'booked' || trip.status === 'what-if')
    .filter((trip) => tripExitDate(trip) >= proposalEntry && tripEntryDate(trip) <= affectedThrough)
    .sort((left, right) => tripEntryDate(left).localeCompare(tripEntryDate(right)) || left.id.localeCompare(right.id));

  for (const trip of plannedTrips) {
    for (const stay of trip.stays) {
      const startDate = stay.entryDate < proposalEntry ? proposalEntry : stay.entryDate;
      const endDate = stay.exitDate > affectedThrough ? affectedThrough : stay.exitDate;
      if (startDate <= endDate) {
        addCheckpointRange(checkpoints, startDate, endDate, { tripId: trip.id, tripLabel: trip.label || 'Schengen trip', tripStatus: trip.status }, false);
      }
    }
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
  for (let current = parseISODate(entryDate); current <= exit; current = addDays(current, 1)) {
    const date = formatISODate(current);
    if (overwrite || !checkpoints.has(date)) checkpoints.set(date, owner);
  }
}

function findLatestProtectedExit(
  savedTrips: EditableTrip[],
  simulatedTrip: EditableTrip,
  targetName: string
): string | null {
  const finalStay = simulatedTrip.stays.at(-1);
  if (!finalStay) return null;
  const earlierProposalStays = simulatedTrip.stays.slice(0, -1);
  const engineLatestExit = latestSafeExitDate([...toEngineTrips(savedTrips), ...earlierProposalStays], finalStay.entryDate);
  if (!engineLatestExit) return null;

  const entry = parseISODate(finalStay.entryDate);
  const engineLatest = parseISODate(engineLatestExit);
  let latestProtectedExit: string | null = null;
  let lowerOffset = 0;
  let upperOffset = Math.floor((engineLatest.getTime() - entry.getTime()) / MILLISECONDS_PER_DAY);

  while (lowerOffset <= upperOffset) {
    const middleOffset = Math.floor((lowerOffset + upperOffset) / 2);
    const exitDate = formatISODate(addDays(entry, middleOffset));
    const candidate: EditableTrip = {
      ...simulatedTrip,
      stays: [...earlierProposalStays, { ...finalStay, exitDate }]
    };
    if (assessAffectedItinerary(savedTrips, candidate, targetName).conflict) upperOffset = middleOffset - 1;
    else {
      latestProtectedExit = exitDate;
      lowerOffset = middleOffset + 1;
    }
  }
  return latestProtectedExit;
}

function publicConflict(conflict: InternalConflict): TripSimulationConflict {
  return { date: conflict.date, tripId: conflict.tripId, tripLabel: conflict.tripLabel, tripStatus: conflict.tripStatus };
}

function formatStatusLabel(tone: SimulationTone, targetName: string): string {
  if (tone === 'risk') return `${targetName} needs changes`;
  if (tone === 'close') return `${targetName} at limit`;
  return `${targetName} fits`;
}

function formatSummaryCopy(tone: SimulationTone, usage: UsageResult, targetName: string, conflict: TripSimulationConflict | null): string {
  if (tone === 'risk' && conflict?.tripStatus !== 'proposal') {
    return `${conflict?.tripLabel ?? 'A later trip'} would reach ${usage.daysUsed} / 90 on ${formatShortDate(conflict?.date ?? usage.referenceDate)} if ${targetName} were added. Change the proposal to protect that commitment.`;
  }
  if (tone === 'risk') {
    return `${targetName} would exceed the limit before exit. The first over-limit day reaches ${usage.daysUsed} / 90 on ${formatShortDate(conflict?.date ?? usage.referenceDate)}.`;
  }
  return `${targetName} fits with ${usage.daysRemaining} safe buffer ${usage.daysRemaining === 1 ? 'day' : 'days'}. Highest affected-day window shows ${usage.daysUsed} counted days.`;
}

function formatFirstFixCopy(tone: SimulationTone, latestSafeExit: string | null, targetName: string, conflict: TripSimulationConflict | null): string {
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
    : 'No safe continuous final stay is available from this re-entry date.';
}

function formatMaxStayLabel(trip: EditableTrip, latestSafeExit: string | null): string {
  const finalStay = trip.stays.at(-1);
  if (!latestSafeExit || !finalStay) return 'Not applicable';
  const finalStayMax = inclusiveTripDays({ entryDate: finalStay.entryDate, exitDate: latestSafeExit });
  const priorDays = countTripSchengenDays({ stays: trip.stays.slice(0, -1) });
  const days = priorDays + finalStayMax;
  return `${days} ${days === 1 ? 'day' : 'days'} across this trip`;
}

function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-').map(Number);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} ${day}`;
}
