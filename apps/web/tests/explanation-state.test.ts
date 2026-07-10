import { describe, expect, test } from 'bun:test';
import { buildExplanationState } from '../src/lib/explanation/explanationState';
import { makeTrip } from './trip-fixtures';

const sampleTrips = [
  makeTrip('france', 'France', '2026-05-01', '2026-05-12', 'past', 'FR'),
  makeTrip('germany', 'Germany', '2026-06-03', '2026-06-20', 'past', 'DE'),
  makeTrip('greece', 'Greece', '2026-08-02', '2026-08-17', 'past', 'GR'),
  makeTrip('italy', 'Italy', '2026-09-15', '2026-10-13', 'booked', 'IT')
];

describe('plain-English calculation explanation', () => {
  test('explains used days, inclusive counting, the rolling window, and outside gaps', () => {
    const state = buildExplanationState(sampleTrips, '2026-10-13');
    expect(state.summary).toBe('75 counted days between Apr 17 and Oct 13. That leaves 15 safe buffer days.');
    expect(state.ruleBullets).toContain('Travel between Schengen countries is one continuous stay. Full calendar days outside Schengen are not counted.');
    expect(state.countedTripRows.at(-1)).toEqual({ label: 'Italy', rangeLabel: 'Sep 15 to Oct 13', daysLabel: '29 days counted' });
  });

  test('explains over-limit states without legal advice', () => {
    const state = buildExplanationState([
      makeTrip('past', 'Prior Schengen', '2026-01-01', '2026-03-31'),
      makeTrip('italy', 'Italy', '2026-06-29', '2026-06-29', 'booked', 'IT')
    ], '2026-06-29');
    expect(state.summary).toBe('91 counted days between Jan 1 and Jun 29. That is 1 day over the 90-day limit.');
  });
});
