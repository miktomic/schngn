import { addDays, formatISODate, parseISODate } from '@schngn/engine';
import type { EditableTrip } from '$lib/trips/tripCrud';

export interface ExplainerScenario {
  windowStart: string;
  trips: [EditableTrip, EditableTrip];
}

function offsetDate(referenceDate: string, days: number): string {
  return formatISODate(addDays(parseISODate(referenceDate), days));
}

export function buildExplainerScenario(
  referenceDate: string,
  earlierLabel: string,
  recentLabel: string
): ExplainerScenario {
  const windowStart = offsetDate(referenceDate, -179);
  return {
    windowStart,
    trips: [
      {
        id: 'sample-earlier',
        label: earlierLabel,
        status: 'past',
        entryCountryCode: 'IT',
        exitCountryCode: 'AT',
        stays: [{ entryDate: windowStart, exitDate: offsetDate(referenceDate, -120) }]
      },
      {
        id: 'sample-recent',
        label: recentLabel,
        status: 'booked',
        entryCountryCode: 'FR',
        exitCountryCode: 'ES',
        stays: [{ entryDate: offsetDate(referenceDate, -39), exitDate: referenceDate }]
      }
    ]
  };
}
