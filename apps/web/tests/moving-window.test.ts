import { describe, expect, test } from 'bun:test';
import { buildMovingWindow, movingWindowBounds } from '../src/lib/timeline/movingWindow';
import type { EditableTrip } from '../src/lib/trips/tripCrud';

const trip = (id: string, entryDate: string, exitDate: string): EditableTrip => ({ id, status: 'booked', stays: [{ entryDate, exitDate }] });

describe('moving window evidence', () => {
  test('keeps trip geometry fixed while inclusive boundary days leave the count', () => {
    const trips = [trip('a', '2026-01-01', '2026-01-15')];
    const bounds = movingWindowBounds(trips, '2026-06-29');
    const first = buildMovingWindow(trips, '2026-06-29', bounds);
    const next = buildMovingWindow(trips, '2026-06-30', bounds);
    expect(first.usage.daysUsed).toBe(15);
    expect(next.usage.daysUsed).toBe(14);
    expect(first.lanes[0].segments).toEqual(next.lanes[0].segments);
    expect(next.window.left).toBeGreaterThan(first.window.left);
  });
  test('deduplicates aggregate days and excludes full days outside Schengen', () => {
    const trips = [trip('a', '2026-06-01', '2026-06-10'), trip('b', '2026-06-05', '2026-06-15')];
    trips[0].stays.push({ entryDate: '2026-06-20', exitDate: '2026-06-22' });
    const result = buildMovingWindow(trips, '2026-06-30', movingWindowBounds(trips, '2026-06-30'));
    expect(result.usage.daysUsed).toBe(18);
    expect(result.lanes.map(l => l.counted)).toEqual([13, 11]);
  });
  test('projects open-ended stays through the checking date and never edits saved dates', () => {
    const trips = [{ ...trip('open', '2026-06-01', '2026-06-01'), ongoing: true }];
    const original = JSON.stringify(trips);
    const result = buildMovingWindow(trips, '2026-09-01', movingWindowBounds(trips, '2026-06-01'));
    expect(result.usage.daysUsed).toBe(93);
    expect(result.usage.overBy).toBe(3);
    expect(JSON.stringify(trips)).toBe(original);
  });
  test('bounds include past verdicts, future exits and their complete windows', () => {
    const trips = [trip('old', '2025-01-01', '2025-01-15'), trip('future', '2027-01-01', '2027-01-30')];
    const bounds = movingWindowBounds(trips, '2025-01-15', '2026-09-09');
    expect(bounds.minDate).toBe('2025-01-14');
    expect(bounds.endDate >= '2027-01-30').toBe(true);
    for (const date of [bounds.minDate, bounds.endDate]) {
      const result = buildMovingWindow(trips, date, bounds);
      expect(result.window.left).toBeGreaterThanOrEqual(0);
      expect(result.window.left + result.window.width).toBeLessThanOrEqual(100.00001);
    }
  });
  test('focuses the initial axis on the current window and planned exit, without extra empty months', () => {
    const trips = [trip('earlier', '2026-04-02', '2026-04-16'), trip('planned', '2026-11-28', '2026-12-27')];
    const bounds = movingWindowBounds(trips, '2026-12-27', '2026-09-09');
    expect(bounds.startDate).toBe('2026-03-13');
    expect(bounds.endDate).toBe('2026-12-27');
    expect(bounds.days).toBe(290);
  });
  test('clips old evidence to the chart without discarding it from the calculation', () => {
    const trips = [trip('old', '2025-01-01', '2025-01-15')];
    const bounds = movingWindowBounds(trips, '2026-09-09');
    const result = buildMovingWindow(trips, '2026-09-09', bounds);
    expect(result.lanes[0].segments).toEqual([]);
    expect(result.lanes[0].counted).toBe(0);
  });
});
