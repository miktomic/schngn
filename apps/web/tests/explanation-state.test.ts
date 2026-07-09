import { describe, expect, test } from 'bun:test';
import { buildExplanationState } from '../src/lib/explanation/explanationState';
import type { EditableTrip } from '../src/lib/trips/tripCrud';

const sampleTrips: EditableTrip[] = [
  { id: 'france', label: 'France', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-12', status: 'past' },
  { id: 'germany', label: 'Germany', countryCode: 'DE', entryDate: '2026-06-03', exitDate: '2026-06-20', status: 'past' },
  { id: 'greece', label: 'Greece', countryCode: 'GR', entryDate: '2026-08-02', exitDate: '2026-08-17', status: 'past' },
  { id: 'italy', label: 'Italy', countryCode: 'IT', entryDate: '2026-09-15', exitDate: '2026-10-13', status: 'booked' }
];

describe('plain-English calculation explanation', () => {
  test('explains used days, inclusive counting, and the rolling 180-day window', () => {
    const state = buildExplanationState(sampleTrips, '2026-10-13');

    expect(state.heading).toBe('Why this number?');
    expect(state.summary).toBe('75 counted days between Apr 17 and Oct 13. That leaves 15 safe buffer days.');
    expect(state.windowLabel).toBe('Apr 17 to Oct 13');
    expect(state.ruleBullets).toEqual([
      'Entry and exit dates both count.',
      'The app looks back 180 calendar days from Oct 13, including Oct 13 itself.',
      'Only Schengen short-stay countries count. Ireland and Cyprus are excluded.'
    ]);
    expect(state.countedTripRows).toEqual([
      { label: 'France', rangeLabel: 'May 1 to May 12', daysLabel: '12 days counted' },
      { label: 'Germany', rangeLabel: 'Jun 3 to Jun 20', daysLabel: '18 days counted' },
      { label: 'Greece', rangeLabel: 'Aug 2 to Aug 17', daysLabel: '16 days counted' },
      { label: 'Italy', rangeLabel: 'Sep 15 to Oct 13', daysLabel: '29 days counted' }
    ]);
  });

  test('explains over-limit states without legal advice', () => {
    const state = buildExplanationState([
      { id: 'past', label: 'Prior Schengen', entryDate: '2026-01-01', exitDate: '2026-03-31', status: 'past' },
      { id: 'italy', label: 'Italy', countryCode: 'IT', entryDate: '2026-06-29', exitDate: '2026-06-29', status: 'booked' }
    ], '2026-06-29');

    expect(state.summary).toBe('91 counted days between Jan 1 and Jun 29. That is 1 day over the 90-day limit.');
    expect(state.verdictLine).toBe('Calculation result: over the ordinary short-stay allowance. Check official sources before booking or travelling.');
  });
});
