import { addDays, calculateUsageOnDate, formatISODate, parseISODate } from '@schngn/engine';
import { toEngineTrips, type EditableTrip } from '../trips/tripCrud';

export const shiftDate = (date: string, days: number): string => formatISODate(addDays(parseISODate(date), days));
export const distance = (start: string, end: string): number => Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86_400_000);

export function movingWindowBounds(trips: EditableTrip[], referenceDate: string, today = referenceDate) {
  const dates = trips.flatMap(trip => trip.stays.flatMap(stay => [stay.entryDate, stay.exitDate]));
  // Inspect the saved result and today's planning horizon without padding an
  // extra 179 days before already-expired history or six empty future months.
  const minDate = shiftDate([referenceDate, today].sort()[0], -1);
  const endDate = [referenceDate, shiftDate(today, trips.some(trip => trip.ongoing) ? 180 : 30), ...dates].sort().at(-1)!;
  const startDate = shiftDate(minDate, -179);
  return { minDate, startDate, endDate, days: distance(startDate, endDate) + 1 };
}

export type MovingWindowBounds = ReturnType<typeof movingWindowBounds>;

export function buildMovingWindow(trips: EditableTrip[], checkingDate: string, bounds: MovingWindowBounds) {
  const usage = calculateUsageOnDate(toEngineTrips(trips, checkingDate), checkingDate);
  const position = (start: string, end: string) => ({
    left: distance(bounds.startDate, start) / bounds.days * 100,
    width: (distance(start, end) + 1) / bounds.days * 100
  });
  const lanes = trips.map(trip => {
    // Open-ended bars extend through the visible forecast. Count only through
    // the checking date, using the same projection contract as the calculator.
    const segments = toEngineTrips([trip], bounds.endDate).flatMap(stay => {
      const start = stay.entryDate > bounds.startDate ? stay.entryDate : bounds.startDate;
      const end = stay.exitDate < bounds.endDate ? stay.exitDate : bounds.endDate;
      return start <= end ? [{ ...position(start, end), entryDate: stay.entryDate, showEntry: start === stay.entryDate }] : [];
    });
    const counted = calculateUsageOnDate(toEngineTrips([trip], checkingDate), checkingDate).daysUsed;
    const countedSegments = toEngineTrips([trip], checkingDate).flatMap(stay => {
      const start = stay.entryDate > usage.windowStart ? stay.entryDate : usage.windowStart;
      const end = stay.exitDate < checkingDate ? stay.exitDate : checkingDate;
      return start <= end ? [position(start, end)] : [];
    });
    return { trip, segments, countedSegments, counted };
  });
  return { usage, lanes, window: position(usage.windowStart, checkingDate) };
}
