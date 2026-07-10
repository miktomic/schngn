import type { Trip } from '@schngn/engine';
import { isSupportedCountryCode, normalizeCountryCode } from './countries';

export type TripStatus = 'past' | 'booked' | 'what-if';

export interface EditableTrip extends Trip {
  id: string;
  status: TripStatus;
}

export interface TripFormInput {
  id?: string;
  label?: string;
  countryCode?: string;
  entryDate: string;
  exitDate: string;
  status: TripStatus;
}

export const MAX_TRIP_COUNT = 500;
export const MAX_TRIP_ID_LENGTH = 128;
export const MAX_TRIP_LABEL_LENGTH = 80;

export type TripValidationErrors = Partial<
  Record<'tripCount' | 'id' | 'label' | 'countryCode' | 'entryDate' | 'exitDate' | 'status', string>
>;

export interface UpsertTripResult {
  trips: EditableTrip[];
  errors: TripValidationErrors;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateTripInput(input: TripFormInput): TripValidationErrors {
  const errors: TripValidationErrors = {};
  const countryCode = normalizeCountryCode(input.countryCode);
  const label = typeof input.label === 'string' ? input.label.trim() : '';

  if (input.id !== undefined && !isValidTripId(input.id)) {
    errors.id = 'Trip id is invalid.';
  }

  if (label && codePointLength(label) > MAX_TRIP_LABEL_LENGTH) {
    errors.label = `Keep the trip label to ${MAX_TRIP_LABEL_LENGTH} characters or fewer.`;
  } else if (label && /[\u0000-\u001f\u007f]/u.test(label)) {
    errors.label = 'Use a single-line trip label without control characters.';
  }

  if (countryCode && !isSupportedCountryCode(countryCode)) {
    errors.countryCode = 'Choose a supported country or leave it blank for a manual Schengen trip.';
  }

  if (!input.entryDate) {
    errors.entryDate = 'Entry date is required.';
  } else if (!isRealIsoDate(input.entryDate)) {
    errors.entryDate = 'Enter a real entry date.';
  }

  if (!input.exitDate) {
    errors.exitDate = 'Exit date is required.';
  } else if (!isRealIsoDate(input.exitDate)) {
    errors.exitDate = 'Enter a real exit date.';
  }

  if (!isTripStatus(input.status)) {
    errors.status = 'Choose past, booked, or what-if.';
  }

  if (!errors.entryDate && !errors.exitDate && dateToDayNumber(input.exitDate) < dateToDayNumber(input.entryDate)) {
    errors.exitDate = 'Exit date cannot be before entry date.';
  }

  return errors;
}

export function upsertTrip(existingTrips: EditableTrip[], input: TripFormInput): UpsertTripResult {
  const errors = validateTripInput(input);
  if (Object.keys(errors).length > 0) {
    return { trips: sortTrips(existingTrips), errors };
  }

  const normalizedTrip = normalizeTripInput(input);
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
    const entryDelta = a.entryDate.localeCompare(b.entryDate);
    if (entryDelta !== 0) return entryDelta;
    const exitDelta = a.exitDate.localeCompare(b.exitDate);
    if (exitDelta !== 0) return exitDelta;
    return a.id.localeCompare(b.id);
  });
}

export function toEngineTrips(trips: EditableTrip[]): Trip[] {
  return trips.map(({ label, countryCode, entryDate, exitDate }) => ({ label, countryCode, entryDate, exitDate }));
}

export function inclusiveTripDays(trip: Pick<TripFormInput, 'entryDate' | 'exitDate'>): number {
  return dateToDayNumber(trip.exitDate) - dateToDayNumber(trip.entryDate) + 1;
}

export function formatTripRange(trip: Pick<TripFormInput, 'entryDate' | 'exitDate'>): string {
  return `${trip.entryDate.slice(5)} to ${trip.exitDate.slice(5)}`;
}

export function emptyTripForm(status: TripStatus = 'booked'): TripFormInput {
  return {
    label: '',
    countryCode: '',
    entryDate: '',
    exitDate: '',
    status
  };
}

export function tripToForm(trip: EditableTrip): TripFormInput {
  return {
    id: trip.id,
    label: trip.label ?? '',
    countryCode: trip.countryCode ?? '',
    entryDate: trip.entryDate,
    exitDate: trip.exitDate,
    status: trip.status
  };
}

function normalizeTripInput(input: TripFormInput): EditableTrip {
  const countryCode = normalizeCountryCode(input.countryCode);
  const label = normalizeLabel(input.label, countryCode);
  const id = input.id?.trim() || makeTripId({ ...input, label, countryCode });

  return {
    id,
    label,
    countryCode,
    entryDate: input.entryDate,
    exitDate: input.exitDate,
    status: input.status
  };
}

function normalizeLabel(label: string | undefined, countryCode: string | undefined): string {
  const normalized = label?.trim();
  if (normalized) return normalized;
  if (countryCode) return `${countryCode} trip`;
  return 'Schengen trip';
}

function makeTripId(input: Pick<TripFormInput, 'entryDate' | 'exitDate'> & { label: string; countryCode?: string }): string {
  const raw = `${input.entryDate}-${input.exitDate}-${input.countryCode ?? 'schengen'}-${input.label}`.toLowerCase();
  return `trip-${raw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

export function isRealIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTripStatus(value: unknown): value is TripStatus {
  return value === 'past' || value === 'booked' || value === 'what-if';
}

export function isValidTripId(value: string): boolean {
  const normalized = value.trim();
  return (
    normalized.length > 0 &&
    normalized.length <= MAX_TRIP_ID_LENGTH &&
    /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/u.test(normalized)
  );
}

function codePointLength(value: string): number {
  return [...value].length;
}

function dateToDayNumber(value: string): number {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Math.floor(date.getTime() / 86_400_000);
}
