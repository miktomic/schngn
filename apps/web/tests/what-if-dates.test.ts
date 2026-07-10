import { describe, expect, test } from 'bun:test';
import { buildAdjustmentRange, moveTripDates, resizeTripEntry, resizeTripExit } from '../src/lib/simulator/whatIfDates';

describe('what-if date adjuster', () => {
  const range = buildAdjustmentRange('2026-08-01', '2026-08-10');

  test('moves the whole trip without changing its duration', () => {
    expect(moveTripDates('2026-08-01', '2026-08-10', 14, range)).toEqual({
      entryDate: '2026-08-15', exitDate: '2026-08-24', mode: 'move', moveDays: 14
    });
  });

  test('resizes either edge and never crosses the other edge', () => {
    expect(resizeTripEntry('2026-08-01', '2026-08-10', 20, range).entryDate).toBe('2026-08-10');
    expect(resizeTripExit('2026-08-01', '2026-08-10', -20, range).exitDate).toBe('2026-08-01');
  });

  test('clamps movement to the exploration range', () => {
    const moved = moveTripDates('2026-08-01', '2026-08-10', -500, range);
    expect(moved.entryDate).toBe(range.minDate);
    expect(moved.exitDate).toBe('2026-05-12');
  });
});
