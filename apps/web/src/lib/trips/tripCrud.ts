import type { Trip } from '@schngn/engine';

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

export type TripValidationErrors = Partial<Record<'entryDate' | 'exitDate' | 'status', string>>;

export interface UpsertTripResult {
  trips: EditableTrip[];
  errors: TripValidationErrors;
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateTripInput(input: TripFormInput): TripValidationErrors {
  const errors: TripValidationErrors = {};

  if (!isIsoDate(input.entryDate)) {
    errors.entryDate = 'Entry date is required.';
  }

  if (!isIsoDate(input.exitDate)) {
    errors.exitDate = 'Exit date is required.';
  }

  if (errors.entryDate || errors.exitDate) return errors;

  if (dateToDayNumber(input.exitDate) < dateToDayNumber(input.entryDate)) {
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
  const replaced = existingTrips.some((trip) => trip.id === normalizedTrip.id);
  const trips = replaced
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
  const id = input.id || makeTripId({ ...input, label, countryCode });

  return {
    id,
    label,
    countryCode,
    entryDate: input.entryDate,
    exitDate: input.exitDate,
    status: input.status
  };
}

function normalizeCountryCode(countryCode: string | undefined): string | undefined {
  const normalized = countryCode?.trim().toUpperCase();
  return normalized ? normalized : undefined;
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

function isIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dateToDayNumber(value: string): number {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Math.floor(date.getTime() / 86_400_000);
}
