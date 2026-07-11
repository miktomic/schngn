import { describe, expect, test } from 'bun:test';
import { buildDashboardState } from '../src/lib/dashboard/dashboardState';
import { makeTrip } from './trip-fixtures';

const sampleTrips = [
  makeTrip('france', 'France', '2026-05-01', '2026-05-12', 'past', 'FR'),
  makeTrip('germany', 'Germany', '2026-06-03', '2026-06-20', 'past', 'DE'),
  makeTrip('greece', 'Greece', '2026-08-02', '2026-08-17', 'past', 'GR'),
  makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT')
];
const prospectiveToday = '2026-01-01';

describe('dashboard money-shot state', () => {
  test('answers a safe booked trip with days remaining and latest safe exit', () => {
    const state = buildDashboardState(sampleTrips, undefined, prospectiveToday);
    expect(state.heroMetric).toBe('15 safe buffer days');
    expect(state.statusLabel).toBe('Italy fits');
    expect(state.statusTone).toBe('safe');
    expect(state.daysUsedLabel).toBe('75 / 90');
    expect(state.latestSafeExitLabel).toBe('Nov 9');
  });

  test('prioritizes an ongoing stay and calculates its live departure deadline', () => {
    const ongoing = { ...makeTrip('current', 'Current stay', '2026-07-01', '2026-07-10', 'booked', 'IT'), ongoing: true as const, exitCountryCode: undefined };
    const later = makeTrip('later', 'Later trip', '2026-12-01', '2026-12-05', 'booked', 'FR');
    const state = buildDashboardState([ongoing, later], undefined, '2026-07-10');

    expect(state.targetTrip?.id).toBe('current');
    expect(state.referenceDate).toBe('2026-07-10');
    expect(state.completed).toBe(false);
    expect(state.latestSafeExitDate).toBe('2026-09-28');
  });

  test('warns when a planned trip is exactly at the limit', () => {
    const state = buildDashboardState([
      makeTrip('past-89', 'Prior Schengen', '2026-01-01', '2026-03-30'),
      makeTrip('one-day', 'Italy', '2026-06-29', '2026-06-29', 'booked', 'IT')
    ], undefined, '2026-06-28');
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
    ], undefined, '2026-06-28');
    expect(state.targetTrip?.id).toBe('unsafe-italy');
    expect(state.referenceDate).toBe('2026-06-29');
    expect(state.statusTone).toBe('risk');
    expect(state.heroMetric).toBe('1 day over limit');
    expect(state.actionCopy).toContain('shorten or move Earlier Italy booking');
  });

  test('uses saved labels and handles empty local data', () => {
    const state = buildDashboardState(
      [makeTrip('portugal', 'Portugal', '2026-11-01', '2026-11-10', 'booked', 'PT')],
      undefined,
      prospectiveToday
    );
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
    expect(buildDashboardState([summer], undefined, prospectiveToday).daysUsedLabel).toBe('10 / 90');
  });

  test('counts overlapping saved trips once while preserving both records', () => {
    const first = makeTrip('first-overlap', 'First overlap', '2026-07-01', '2026-07-10', 'booked', 'IT');
    const second = makeTrip('second-overlap', 'Second overlap', '2026-07-05', '2026-07-14', 'booked', 'FR');
    const state = buildDashboardState([first, second], undefined, prospectiveToday);

    expect(state.daysUsedLabel).toBe('14 / 90');
    expect(state.targetTrip?.id).toBe('second-overlap');
  });

  test('derives completed state from the exit date rather than the stored trip status', () => {
    const completedBookedTrip = buildDashboardState([
      makeTrip('completed-booking', 'Completed booking', '2026-05-01', '2026-05-05', 'booked', 'IT')
    ], undefined, '2026-05-06');
    expect(completedBookedTrip.completed).toBe(true);

    const futurePastTrip = buildDashboardState([
      makeTrip('future-past', 'Future past-status trip', '2026-05-07', '2026-05-08', 'past', 'IT')
    ], undefined, '2026-05-06');
    expect(futurePastTrip.completed).toBe(false);

    const endingToday = buildDashboardState([
      makeTrip('ending-today', 'Ending today', '2026-05-01', '2026-05-06', 'booked', 'IT')
    ], undefined, '2026-05-06');
    expect(endingToday.completed).toBe(false);
  });

  test('uses completed history wording for safe and over-limit trips that already ended', () => {
    const safe = buildDashboardState([
      makeTrip('completed-safe', 'Completed safe trip', '2026-05-01', '2026-05-05', 'booked', 'IT')
    ], undefined, '2026-05-06');
    expect(safe.statusLabel).toBe('Completed safe trip · Completed');
    expect(safe.actionCopy).toBe('This completed trip is included in your history. Review the counted days against your travel records.');
    expect(`${safe.statusLabel} ${safe.actionCopy}`).not.toMatch(/fits|needs changes|book(?:ing)?|shorten|move/i);

    const overLimit = buildDashboardState([
      makeTrip('completed-over', 'Completed over-limit trip', '2026-01-01', '2026-04-01', 'booked', 'IT')
    ], undefined, '2026-04-02');
    expect(overLimit.completed).toBe(true);
    expect(overLimit.statusTone).toBe('risk');
    expect(overLimit.heroMetric).toBe('1 day over limit');
    expect(overLimit.statusLabel).toBe('Completed over-limit trip · Completed');
    expect(overLimit.actionCopy).toBe('This completed trip is included in your history. Review the counted days against your travel records.');
    expect(`${overLimit.statusLabel} ${overLimit.actionCopy}`).not.toMatch(/fits|needs changes|book(?:ing)?|shorten|move/i);
  });
});
