import {
  statusForTripDates,
  tripToForm,
  upsertTrip,
  type EditableTrip,
  type TripValidationErrors
} from '../trips/tripCrud';
import type { ProposedTripInput } from './tripSimulator';
import { addIsoDays, buildAdjustmentRange, differenceInDays, type AdjustmentRange, type DateAdjustment } from './whatIfDates';

export interface SavedTripAdjustmentDraft {
  form: ProposedTripInput;
  range: AdjustmentRange;
}

export interface SavedTripAdjustmentResult {
  errors: TripValidationErrors;
  trips: EditableTrip[];
  updated: boolean;
}

export function createSavedTripAdjustmentDraft(trip: EditableTrip): SavedTripAdjustmentDraft {
  const form = tripToForm(trip);
  return {
    form: {
      label: form.label,
      entryCountryCode: form.entryCountryCode,
      exitCountryCode: form.exitCountryCode,
      entryDate: form.entryDate,
      exitDate: form.exitDate,
      outsideBreaks: form.outsideBreaks
    },
    range: buildAdjustmentRange(form.entryDate, form.exitDate)
  };
}

export function applySavedTripDateAdjustment(
  form: ProposedTripInput,
  adjustment: DateAdjustment
): ProposedTripInput {
  const moveDays = adjustment.mode === 'move'
    ? differenceInDays(form.entryDate, adjustment.entryDate)
    : 0;
  const sortedBreaks = [...form.outsideBreaks].sort((left, right) => left.leftDate.localeCompare(right.leftDate));
  const firstBreak = sortedBreaks[0];
  const lastBreak = sortedBreaks.at(-1);
  const entryDate = adjustment.mode === 'entry' && firstBreak && adjustment.entryDate > firstBreak.leftDate
    ? firstBreak.leftDate
    : adjustment.entryDate;
  const exitDate = adjustment.mode === 'exit' && lastBreak && adjustment.exitDate < lastBreak.reentryDate
    ? lastBreak.reentryDate
    : adjustment.exitDate;

  return {
    ...form,
    entryDate,
    exitDate,
    outsideBreaks: adjustment.mode === 'move' && moveDays !== 0
      ? form.outsideBreaks.map((outsideBreak) => ({
          ...outsideBreak,
          leftDate: outsideBreak.leftDate ? addIsoDays(outsideBreak.leftDate, moveDays) : '',
          reentryDate: outsideBreak.reentryDate ? addIsoDays(outsideBreak.reentryDate, moveDays) : ''
        }))
      : form.outsideBreaks
  };
}

export function commitSavedTripAdjustment(
  trips: EditableTrip[],
  sourceId: string,
  form: ProposedTripInput,
  referenceDate: string
): SavedTripAdjustmentResult {
  const source = trips.find((trip) => trip.id === sourceId);
  if (!source) {
    return {
      errors: { id: 'The selected trip is no longer available.' },
      trips,
      updated: false
    };
  }

  const result = upsertTrip(trips, {
    ...form,
    id: source.id,
    status: statusForTripDates(source.status, form.exitDate, referenceDate)
  }, referenceDate);
  return {
    ...result,
    updated: Object.keys(result.errors).length === 0
  };
}

export function savedTripAdjustmentBounds(form: ProposedTripInput): { entryMax: string; exitMin: string } {
  const sortedBreaks = [...form.outsideBreaks].sort((left, right) => left.leftDate.localeCompare(right.leftDate));
  return {
    entryMax: sortedBreaks[0]?.leftDate ?? form.exitDate,
    exitMin: sortedBreaks.at(-1)?.reentryDate ?? form.entryDate
  };
}
