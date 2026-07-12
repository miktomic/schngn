import { describe, expect, test } from 'bun:test';
import { addDays, calculateUsageOnDate, formatISODate, parseISODate } from '@schngn/engine';
import { buildExplainerScenario } from '../src/lib/explainer/explainerScenario';
import { buildReturningDaysForecast } from '../src/lib/returns/returningDays';
import { toEngineTrips } from '../src/lib/trips/tripCrud';

describe('today-relative explainer scenario', () => {
  test('keeps every example inside today’s 180-day window and makes only the final example exceed 90 days', () => {
    const referenceDate = '2026-07-12';
    const scenario = buildExplainerScenario(referenceDate, 'Earlier stay', 'Recent stay');
    const windowStart = formatISODate(addDays(parseISODate(referenceDate), -179));

    expect(scenario.windowStart).toBe(windowStart);
    expect(scenario.trips).toHaveLength(2);
    for (const trip of scenario.trips) {
      for (const stay of trip.stays) {
        expect(stay.entryDate >= windowStart).toBe(true);
        expect(stay.exitDate <= referenceDate).toBe(true);
      }
    }

    const firstUsage = calculateUsageOnDate(toEngineTrips(scenario.trips.slice(0, 1), referenceDate), referenceDate);
    expect(firstUsage.daysUsed).toBe(60);
    expect(firstUsage.overBy).toBe(0);

    const finalUsage = calculateUsageOnDate(toEngineTrips(scenario.trips, referenceDate), referenceDate);
    expect(finalUsage.daysUsed).toBe(100);
    expect(finalUsage.overBy).toBe(10);

    const forecast = buildReturningDaysForecast(scenario.trips.slice(0, 1), { referenceDate, horizonDays: 180 });
    expect(forecast.rows[0]?.date).toBe(formatISODate(addDays(parseISODate(referenceDate), 1)));
  });
});
