import type { EditableTrip, TripStatus } from '../src/lib/trips/tripCrud';

export function makeTrip(
  id: string,
  label: string,
  entryDate: string,
  exitDate: string,
  status: TripStatus = 'past',
  entryCountryCode?: string,
  exitCountryCode: string | undefined = entryCountryCode
): EditableTrip {
  return {
    id,
    label,
    status,
    entryCountryCode,
    exitCountryCode,
    stays: [{ entryDate, exitDate }]
  };
}
