import { describe, expect, spyOn, test } from 'bun:test';
import * as engine from '@schngn/engine';
import { calculateUsageOnDate } from '@schngn/engine';
import { buildContributionSeries, contributionReading } from '../src/lib/timeline/layeredContributions';
import { movingWindowBounds, shiftDate } from '../src/lib/timeline/movingWindow';
import { toEngineTrips, type EditableTrip } from '../src/lib/trips/tripCrud';

const trip = (id: string, start: number, end: number): EditableTrip => ({ id, status: 'booked', stays: [{ entryDate: shiftDate('2026-09-10', start), exitDate: shiftDate('2026-09-10', end) }] });
const example = [trip('fr', -160, -146), trip('it', -95, -86), { ...trip('extra', 0, 64), status: 'what-if' as const }, trip('es', 80, 109)];

describe('layered contribution evidence', () => {
  test('matches the engine at every date, including interpolated boundaries between plot points', () => {
    const bounds = movingWindowBounds(example, '2026-12-28', '2026-09-10');
    const series = buildContributionSeries(example, bounds);
    for (let day = -1; day <= 109; day++) {
      const date = shiftDate('2026-09-10', day);
      const usage = calculateUsageOnDate(toEngineTrips(example, date), date);
      const reading = contributionReading(series, usage);
      expect(reading.reduce((a, b) => a + b, 0)).toBe(usage.daysUsed);
      const rightIndex = series.points.findIndex(point => point.date >= date);
      const right = series.points[rightIndex];
      const left = series.points[Math.max(0, rightIndex - 1)];
      const ratio = left.date === right.date ? 0 : (Date.parse(date) - Date.parse(left.date)) / (Date.parse(right.date) - Date.parse(left.date));
      expect(left.used + ratio * (right.used - left.used)).toBeCloseTo(usage.daysUsed, 8);
      reading.forEach((value, i) => expect(left.values[i] + ratio * (right.values[i] - left.values[i])).toBeCloseTo(value, 8));
    }
    expect(series.points.at(-1)?.used).toBe(95);
    expect(series.hasOverlap).toBe(false);
  });

  test('attributes each overlapping physical day once and is independent of input order', () => {
    const trips = [trip('a', 0, 9), trip('b', 4, 14)];
    const bounds = movingWindowBounds(trips, '2026-09-24', '2026-09-10');
    const original = JSON.stringify(trips);
    const series = buildContributionSeries(trips, bounds);
    expect(series.hasOverlap).toBe(true);
    expect(contributionReading(series, calculateUsageOnDate(toEngineTrips(trips), '2026-09-24'))).toEqual([10, 5]);
    expect(buildContributionSeries([...trips].reverse(), bounds)).toEqual(series);
    expect(JSON.stringify(trips)).toBe(original);
  });

  test('preserves outside-Schengen gaps and projects open-ended stays through each inspected date', () => {
    const split = trip('split', -10, -8);
    split.stays.push(...trip('return', -4, -2).stays);
    const trips = [split, { ...trip('open', 0, 0), ongoing: true as const }];
    const series = buildContributionSeries(trips, movingWindowBounds(trips, '2026-09-10'));
    for (const date of ['2026-09-09', '2026-09-10', '2026-10-10', '2027-03-09']) {
      const usage = calculateUsageOnDate(toEngineTrips(trips, date), date);
      expect(contributionReading(series, usage).reduce((a, b) => a + b, 0)).toBe(usage.daysUsed);
    }
    expect(series.layers.some(layer => layer.projected)).toBe(true);
  });

  test('groups a large history into at most six layers without losing counted days', () => {
    const trips = Array.from({ length: 18 }, (_, i) => trip(`trip-${String(i).padStart(2, '0')}`, -170 + i * 10, -167 + i * 10));
    const series = buildContributionSeries(trips, movingWindowBounds(trips, '2026-09-10'));
    expect(series.layers).toHaveLength(6);
    expect(series.layers[0].trips).toHaveLength(13);
    for (const point of series.points) expect(point.values.reduce((a, b) => a + b, 0)).toBe(point.used);
  });

  test('handles empty data and uses change points rather than iterating years of empty dates', () => {
    const far = [{ id: 'far', status: 'booked' as const, stays: [{ entryDate: '2090-01-01', exitDate: '2090-01-10' }] }];
    const bounds = movingWindowBounds(far, '2026-09-10');
    const empty = buildContributionSeries([], bounds);
    expect(empty.layers).toEqual([]);
    expect(empty.points.every(point => point.used === 0)).toBe(true);
    expect(buildContributionSeries(far, bounds).points.length).toBeLessThan(10);
  });

  test('keeps large overlapping histories de-duplicated and preserves an intermediate conflict peak', () => {
    const trips = Array.from({ length: 500 }, (_, i) => trip(`trip-${i}`, -80, 14));
    const bounds = movingWindowBounds(trips, '2027-03-29', '2026-09-10');
    const series = buildContributionSeries(trips, bounds);
    expect(series.layers).toHaveLength(1);
    expect(series.points.some(point => point.used === 95)).toBe(true);
    expect(series.points.at(-1)?.used).toBe(0);
    expect(series.points.length).toBeLessThan(10);
    expect(series.hasOverlap).toBe(true);
  });

  test('bounds engine work to intersecting ranges for large fragmented histories', () => {
    const trips = Array.from({ length: 100 }, (_, owner) => ({
      ...trip(`fragmented-${owner}`, owner * 42, owner * 42),
      stays: Array.from({ length: 21 }, (_, segment) => trip('stay', owner * 42 + segment * 2, owner * 42 + segment * 2).stays[0])
    }));
    const calculate = engine.calculateUsageOnDate;
    let largestInput = 0;
    const usageSpy = spyOn(engine, 'calculateUsageOnDate').mockImplementation((stays, date) => {
      largestInput = Math.max(largestInput, stays.length);
      return calculate(stays, date);
    });
    try {
      const series = buildContributionSeries(trips, movingWindowBounds(trips, '2026-09-10'));
      // Disjoint, non-adjacent ranges permit at most 90 intersections in 180 days.
      // This structural budget avoids timing thresholds that vary between CI hosts.
      expect(largestInput).toBeLessThanOrEqual(90);
      expect(series.points.length).toBeGreaterThan(4000);
      for (const point of series.points) expect(point.values.reduce((a, b) => a + b, 0)).toBe(point.used);
      for (const point of [series.points[0], series.points[Math.floor(series.points.length / 2)], series.points.at(-1)!]) {
        expect(point.used).toBe(calculate(toEngineTrips(trips), point.date).daysUsed);
      }
    } finally { usageSpy.mockRestore(); }
  });
});
