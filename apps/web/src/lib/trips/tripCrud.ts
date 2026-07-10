import type { SchengenStay } from '@schngn/engine';
import { isSupportedCountryCode, normalizeCountryCode } from './countries';

export type TripStatus = 'past' | 'booked' | 'what-if';

export interface EditableTrip {
  id: string;
  label?: string;
  status: TripStatus;
  entryCountryCode?: string;
  exitCountryCode?: string;
  stays: SchengenStay[];
}

export interface OutsideSchengenBreakInput {
  id: string;
  leftDate: string;
  reentryDate: string;
}

export interface TripFormInput {
  id?: string;
  label?: string;
  entryCountryCode?: string;
  exitCountryCode?: string;
  entryDate: string;
  exitDate: string;
  outsideBreaks: OutsideSchengenBreakInput[];
  status: TripStatus;
}

export const MAX_TRIP_COUNT = 500;
export const MAX_TRIP_ID_LENGTH = 128;
export const MAX_TRIP_LABEL_LENGTH = 80;
export const MAX_OUTSIDE_BREAKS = 20;

export interface OutsideBreakValidationErrors {
  leftDate?: string;
  reentryDate?: string;
}

export type TripValidationErrors = Partial<
  Record<
    | 'tripCount'
    | 'id'
    | 'label'
    | 'entryCountryCode'
    | 'exitCountryCode'
    | 'entryDate'
    | 'exitDate'
    | 'status'
    | 'outsideBreaks',
    string
  >
> & { breakFields?: Record<string, OutsideBreakValidationErrors> };

export interface UpsertTripResult {
  trips: EditableTrip[];
  errors: TripValidationErrors;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateTripInput(input: TripFormInput): TripValidationErrors {
  const errors: TripValidationErrors = {};
  const label = typeof input.label === 'string' ? input.label.trim() : '';

  if (input.id !== undefined && !isValidTripId(input.id)) errors.id = 'Trip id is invalid.';

  if (label && codePointLength(label) > MAX_TRIP_LABEL_LENGTH) {
    errors.label = `Keep the trip label to ${MAX_TRIP_LABEL_LENGTH} characters or fewer.`;
  } else if (label && /[\u0000-\u001f\u007f]/u.test(label)) {
    errors.label = 'Use a single-line trip label without control characters.';
  }

  validateOptionalCountry(input.entryCountryCode, 'entryCountryCode', errors);
  validateOptionalCountry(input.exitCountryCode, 'exitCountryCode', errors);
  validateRequiredDate(input.entryDate, 'entryDate', 'entered-Schengen', errors);
  validateRequiredDate(input.exitDate, 'exitDate', 'left-Schengen', errors);

  if (!isTripStatus(input.status)) errors.status = 'Choose past, booked, or what-if.';

  if (!errors.entryDate && !errors.exitDate && dayNumber(input.exitDate) < dayNumber(input.entryDate)) {
    errors.exitDate = 'The date you left Schengen cannot be before the date you entered.';
  }

  validateOutsideBreaks(input, errors);
  return errors;
}

export function validateEditableTrip(trip: EditableTrip): TripValidationErrors {
  const form = tripToForm(trip);
  const errors = validateTripInput(form);
  if (!Array.isArray(trip.stays) || trip.stays.length === 0) {
    errors.outsideBreaks = 'A trip needs at least one Schengen stay.';
  }
  return errors;
}

export function upsertTrip(
  existingTrips: EditableTrip[],
  input: TripFormInput,
  referenceDate: string = currentLocalIsoDate()
): UpsertTripResult {
  const errors = validateTripInput(input);
  if (Object.keys(errors).length > 0) return { trips: sortTrips(existingTrips), errors };

  const normalizedTrip = normalizeTripInput(input, referenceDate);
  const replacesExistingTrip = existingTrips.some((trip) => trip.id === normalizedTrip.id);
  if (!replacesExistingTrip && existingTrips.length >= MAX_TRIP_COUNT) {
    return {
      trips: sortTrips(existingTrips),
      errors: { tripCount: `You can store up to ${MAX_TRIP_COUNT} trips on this device.` }
    };
  }

  const trips = replacesExistingTrip
    ? existingTrips.map((trip) => (trip.id === normalizedTrip.id ? normalizedTrip : trip))
    : [...existingTrips, normalizedTrip];
  return { trips: sortTrips(trips), errors: {} };
}

export function deleteTripById(trips: EditableTrip[], id: string): EditableTrip[] {
  return sortTrips(trips.filter((trip) => trip.id !== id));
}

export function sortTrips(trips: EditableTrip[]): EditableTrip[] {
  return [...trips].sort((a, b) => {
    const entryDelta = tripEntryDate(a).localeCompare(tripEntryDate(b));
    if (entryDelta !== 0) return entryDelta;
    const exitDelta = tripExitDate(a).localeCompare(tripExitDate(b));
    if (exitDelta !== 0) return exitDelta;
    return a.id.localeCompare(b.id);
  });
}

export function toEngineTrips(trips: EditableTrip[]): SchengenStay[] {
  return trips.flatMap((trip) =>
    trip.stays.map((stay) => ({ entryDate: stay.entryDate, exitDate: stay.exitDate, label: trip.label }))
  );
}

export function tripEntryDate(trip: EditableTrip): string {
  return trip.stays[0]?.entryDate ?? '';
}

export function tripExitDate(trip: EditableTrip): string {
  return trip.stays.at(-1)?.exitDate ?? '';
}

export function tripRouteLabel(trip: Pick<EditableTrip, 'entryCountryCode' | 'exitCountryCode'>): string {
  if (trip.entryCountryCode && trip.exitCountryCode) return `${trip.entryCountryCode} → ${trip.exitCountryCode}`;
  if (trip.entryCountryCode) return `Entered via ${trip.entryCountryCode}`;
  if (trip.exitCountryCode) return `Left via ${trip.exitCountryCode}`;
  return 'Schengen stay';
}

export function countTripSchengenDays(trip: Pick<EditableTrip, 'stays'>): number {
  const days = new Set<number>();
  for (const stay of trip.stays) {
    const entry = dayNumber(stay.entryDate);
    const exit = dayNumber(stay.exitDate);
    for (let day = entry; day <= exit; day += 1) days.add(day);
  }
  return days.size;
}

export function countTripOutsideDays(trip: Pick<EditableTrip, 'stays'>): number {
  let outsideDays = 0;
  for (let index = 1; index < trip.stays.length; index += 1) {
    outsideDays += Math.max(dayNumber(trip.stays[index].entryDate) - dayNumber(trip.stays[index - 1].exitDate) - 1, 0);
  }
  return outsideDays;
}

export function inclusiveTripDays(range: Pick<SchengenStay, 'entryDate' | 'exitDate'>): number {
  return dayNumber(range.exitDate) - dayNumber(range.entryDate) + 1;
}

export function formatTripRange(range: Pick<SchengenStay, 'entryDate' | 'exitDate'>): string {
  return `${range.entryDate.slice(5)} to ${range.exitDate.slice(5)}`;
}

export function emptyTripForm(status: TripStatus = 'booked'): TripFormInput {
  return {
    label: '',
    entryCountryCode: '',
    exitCountryCode: '',
    entryDate: '',
    exitDate: '',
    outsideBreaks: [],
    status
  };
}

export function createOutsideBreak(index = 0): OutsideSchengenBreakInput {
  return { id: `break-${Date.now().toString(36)}-${index}`, leftDate: '', reentryDate: '' };
}

export function tripToForm(trip: EditableTrip): TripFormInput {
  const stays = [...trip.stays].sort(compareStays);
  return {
    id: trip.id,
    label: trip.label ?? '',
    entryCountryCode: trip.entryCountryCode ?? '',
    exitCountryCode: trip.exitCountryCode ?? '',
    entryDate: stays[0]?.entryDate ?? '',
    exitDate: stays.at(-1)?.exitDate ?? '',
    outsideBreaks: stays.slice(0, -1).map((stay, index) => ({
      id: `break-${index + 1}`,
      leftDate: stay.exitDate,
      reentryDate: stays[index + 1].entryDate
    })),
    status: trip.status
  };
}

export function isRealIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTripStatus(value: unknown): value is TripStatus {
  return value === 'past' || value === 'booked' || value === 'what-if';
}

export function statusForTripDates(status: TripStatus, exitDate: string, referenceDate: string = currentLocalIsoDate()): TripStatus {
  if (isRealIsoDate(exitDate) && isRealIsoDate(referenceDate) && exitDate < referenceDate) return 'past';
  return status === 'past' ? 'booked' : status;
}

export function rollingWindowStartDate(referenceDate: string = currentLocalIsoDate()): string {
  if (!isRealIsoDate(referenceDate)) throw new RangeError('Reference date must be a real ISO date.');
  return new Date((dayNumber(referenceDate) - 179) * 86_400_000).toISOString().slice(0, 10);
}

export function isTripBeforeRollingWindow(trip: EditableTrip, referenceDate: string = currentLocalIsoDate()): boolean {
  const exitDate = tripExitDate(trip);
  return isRealIsoDate(exitDate) && exitDate < rollingWindowStartDate(referenceDate);
}

export function isValidTripId(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= MAX_TRIP_ID_LENGTH && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(normalized);
}

function normalizeTripInput(input: TripFormInput, referenceDate: string): EditableTrip {
  const breaks = [...input.outsideBreaks].sort((a, b) => a.leftDate.localeCompare(b.leftDate));
  const stays: SchengenStay[] = [];
  let stayEntry = input.entryDate;
  for (const outsideBreak of breaks) {
    stays.push({ entryDate: stayEntry, exitDate: outsideBreak.leftDate });
    stayEntry = outsideBreak.reentryDate;
  }
  stays.push({ entryDate: stayEntry, exitDate: input.exitDate });

  const entryCountryCode = normalizeCountryCode(input.entryCountryCode);
  const exitCountryCode = normalizeCountryCode(input.exitCountryCode) ?? entryCountryCode;
  const label = input.label?.trim() || undefined;
  const id = input.id?.trim() || makeTripId(input.entryDate, input.exitDate, label);
  return {
    id,
    label,
    status: statusForTripDates(input.status, input.exitDate, referenceDate),
    entryCountryCode,
    exitCountryCode,
    stays
  };
}

function validateOptionalCountry(
  value: string | undefined,
  field: 'entryCountryCode' | 'exitCountryCode',
  errors: TripValidationErrors
): void {
  const countryCode = normalizeCountryCode(value);
  if (countryCode && !isSupportedCountryCode(countryCode)) {
    errors[field] = 'Choose a Schengen country or leave this optional field blank.';
  }
}

function validateRequiredDate(
  value: string,
  field: 'entryDate' | 'exitDate',
  description: string,
  errors: TripValidationErrors
): void {
  if (!value) errors[field] = `The ${description} date is required.`;
  else if (!isRealIsoDate(value)) errors[field] = `Enter a real ${description} date.`;
}

function validateOutsideBreaks(input: TripFormInput, errors: TripValidationErrors): void {
  if (!Array.isArray(input.outsideBreaks)) {
    errors.outsideBreaks = 'Outside-Schengen breaks are invalid.';
    return;
  }
  if (input.outsideBreaks.length > MAX_OUTSIDE_BREAKS) {
    errors.outsideBreaks = `A trip can contain up to ${MAX_OUTSIDE_BREAKS} outside-Schengen breaks.`;
    return;
  }

  const ids = new Set<string>();
  const validBreaks: OutsideSchengenBreakInput[] = [];
  for (const outsideBreak of input.outsideBreaks) {
    const fieldErrors: OutsideBreakValidationErrors = {};
    if (!outsideBreak?.id || ids.has(outsideBreak.id)) {
      errors.outsideBreaks = 'Each outside-Schengen break needs a unique identifier.';
      continue;
    }
    ids.add(outsideBreak.id);
    if (!outsideBreak.leftDate) fieldErrors.leftDate = 'Enter when you left Schengen.';
    else if (!isRealIsoDate(outsideBreak.leftDate)) fieldErrors.leftDate = 'Enter a real date.';
    if (!outsideBreak.reentryDate) fieldErrors.reentryDate = 'Enter when you re-entered Schengen.';
    else if (!isRealIsoDate(outsideBreak.reentryDate)) fieldErrors.reentryDate = 'Enter a real date.';

    if (!fieldErrors.leftDate && !fieldErrors.reentryDate) {
      if (dayNumber(outsideBreak.reentryDate) - dayNumber(outsideBreak.leftDate) < 2) {
        fieldErrors.reentryDate = 'A break must include at least one full calendar day outside Schengen.';
      } else {
        validBreaks.push(outsideBreak);
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      errors.breakFields = { ...errors.breakFields, [outsideBreak.id]: fieldErrors };
    }
  }

  if (errors.entryDate || errors.exitDate) return;
  const sorted = [...validBreaks].sort((a, b) => a.leftDate.localeCompare(b.leftDate));
  let previousReentry = input.entryDate;
  for (const outsideBreak of sorted) {
    const fieldErrors = errors.breakFields?.[outsideBreak.id] ?? {};
    if (outsideBreak.leftDate < input.entryDate || outsideBreak.leftDate > input.exitDate) {
      fieldErrors.leftDate = 'This date must fall within the trip.';
    }
    if (outsideBreak.reentryDate < input.entryDate || outsideBreak.reentryDate > input.exitDate) {
      fieldErrors.reentryDate = 'This date must fall within the trip.';
    }
    if (outsideBreak.leftDate < previousReentry) {
      fieldErrors.leftDate = 'Outside-Schengen breaks cannot overlap.';
    }
    previousReentry = outsideBreak.reentryDate;
    if (Object.keys(fieldErrors).length > 0) {
      errors.breakFields = { ...errors.breakFields, [outsideBreak.id]: fieldErrors };
    }
  }
}

function makeTripId(entryDate: string, exitDate: string, label: string | undefined): string {
  const raw = `${entryDate}-${exitDate}-${label ?? 'schengen-stay'}`.toLowerCase();
  return `trip-${raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function compareStays(left: SchengenStay, right: SchengenStay): number {
  return left.entryDate.localeCompare(right.entryDate) || left.exitDate.localeCompare(right.exitDate);
}

function codePointLength(value: string): number {
  return [...value].length;
}

function dayNumber(value: string): number {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Math.floor(date.getTime() / 86_400_000);
}

export function currentLocalIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
