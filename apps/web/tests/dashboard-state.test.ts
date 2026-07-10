import { describe, expect, test } from 'bun:test';
import { buildDashboardState } from '../src/lib/dashboard/dashboardState';
import { makeTrip } from './trip-fixtures';

const sampleTrips = [
  makeTrip('france', 'France', '2026-05-01', '2026-05-12', 'past', 'FR'),
  makeTrip('germany', 'Germany', '2026-06-03', '2026-06-20', 'past', 'DE'),
  makeTrip('greece', 'Greece', '2026-08-02', '2026-08-17', 'past', 'GR'),
  makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT')
];

describe('dashboard money-shot state', () => {
  test('answers a safe booked trip with days remaining and latest safe exit', () => {
    const state = buildDashboardState(sampleTrips);
    expect(state.heroMetric).toBe('15 safe buffer days');
    expect(state.statusLabel).toBe('Italy fits');
    expect(state.statusTone).toBe('safe');
    expect(state.daysUsedLabel).toBe('75 / 90');
    expect(state.latestSafeExitLabel).toBe('Nov 9');
  });

  test('warns when a planned trip is exactly at the limit', () => {
    const state = buildDashboardState([
      makeTrip('past-89', 'Prior Schengen', '2026-01-01', '2026-03-30'),
      makeTrip('one-day', 'Italy', '2026-06-29', '2026-06-29', 'booked', 'IT')
    ]);
    expect(state.heroMetric).toBe('0 safe buffer days');
    expect(state.statusLabel).toBe('Italy at limit');
    expect(state.statusTone).toBe('close');
    expect(state.latestSafeExitLabel).toBe('Sep 26');
  });

  test('surfaces over-limit state and the earliest unsafe commitment', () => {
    const state = buildDashboardState([
      makeTrip('past-90', 'Prior Schengen', '2026-01-01', '2026-03-31'),
      makeTrip('unsafe-italy', 'Earlier Italy booking', '2026-06-29', '2026-06-29', 'booked', 'IT'),
      makeTrip('safe-portugal', 'Later Portugal booking', '2026-12-01', '2026-12-05', 'booked', 'PT')
    ]);
    expect(state.targetTrip?.id).toBe('unsafe-italy');
    expect(state.referenceDate).toBe('2026-06-29');
    expect(state.statusTone).toBe('risk');
    expect(state.heroMetric).toBe('1 day over limit');
    expect(state.actionCopy).toContain('shorten or move Earlier Italy booking');
  });

  test('uses saved labels and handles empty local data', () => {
    const state = buildDashboardState([makeTrip('portugal', 'Portugal', '2026-11-01', '2026-11-10', 'booked', 'PT')]);
    expect(state.heroMetric).toBe('80 safe buffer days');
    expect(state.statusLabel).toBe('Portugal fits');
    expect(state.latestSafeExitLabel).toBe('Jan 29');

    const empty = buildDashboardState([]);
    expect(empty.statusLabel).toBe('Add a trip');
    expect(empty.daysUsedLabel).toBe('0 / 90');
  });

  test('counts only the Schengen segments around an outside break', () => {
    const summer = makeTrip('summer', 'Summer', '2026-07-01', '2026-07-05', 'booked', 'IT', 'AT');
    summer.stays.push({ entryDate: '2026-07-08', exitDate: '2026-07-12' });
    expect(buildDashboardState([summer]).daysUsedLabel).toBe('10 / 90');
  });
});
