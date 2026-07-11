import { SCHENGEN_ALLOWANCE_DAYS, calculateUsageOnDate } from '@schngn/engine';
import { currentLocalIsoDate, toEngineTrips, tripExitDate, type EditableTrip } from './tripCrud';

export interface TripCardState {
  completed: boolean;
  overBy: number;
  peakDaysUsed: number;
  peakReferenceDate: string;
}

// Eight color-blind-distinguishable hues with at least 3:1 contrast against white.
// Assigning them after sorting stable ids keeps colors independent of trip dates and display order.
const TRIP_COLOR_PALETTE = [
  '#1f6fa9',
  '#9b3f78',
  '#287a4b',
  '#b24c16',
  '#6f4aa8',
  '#006d77',
  '#806000',
  '#525252'
] as const;

export function buildTripCardStates(
  allTrips: EditableTrip[],
  displayedTrips: EditableTrip[],
  currentDate: string = currentLocalIsoDate()
): Record<string, TripCardState> {
  const allSavedStays = toEngineTrips(allTrips);
  const entries = displayedTrips.map((trip): [string, TripCardState] => {
    const stayExitDates = [...new Set(trip.stays.map((stay) => stay.exitDate))].sort();
    const finalExitDate = tripExitDate(trip);
    let peakDaysUsed = 0;
    let peakReferenceDate = stayExitDates[0] ?? (finalExitDate || currentDate);

    for (const exitDate of stayExitDates) {
      const usage = calculateUsageOnDate(allSavedStays, exitDate);
      if (usage.daysUsed > peakDaysUsed) {
        peakDaysUsed = usage.daysUsed;
        peakReferenceDate = usage.referenceDate;
      }
    }

    return [trip.id, {
      completed: finalExitDate.length > 0 && finalExitDate < currentDate,
      overBy: Math.max(peakDaysUsed - SCHENGEN_ALLOWANCE_DAYS, 0),
      peakDaysUsed,
      peakReferenceDate
    }];
  });

  return Object.fromEntries(entries);
}

export function assignTripColors(trips: readonly Pick<EditableTrip, 'id'>[]): Record<string, string> {
  const stableIds = [...new Set(trips.map((trip) => trip.id))].sort((left, right) => left.localeCompare(right));
  return Object.fromEntries(
    stableIds.map((id, index) => [id, TRIP_COLOR_PALETTE[index % TRIP_COLOR_PALETTE.length]])
  );
}
