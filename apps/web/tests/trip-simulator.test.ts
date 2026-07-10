import { describe, expect, test } from 'bun:test';
import { buildTripSimulationState, type ProposedTripInput } from '../src/lib/simulator/tripSimulator';
import { makeTrip } from './trip-fixtures';

const savedTrips = [
  makeTrip('france', 'France', '2026-05-01', '2026-05-12'),
  makeTrip('germany', 'Germany', '2026-06-03', '2026-06-20'),
  makeTrip('greece', 'Greece', '2026-08-02', '2026-08-17')
];
const proposal = (overrides: Partial<ProposedTripInput> = {}): ProposedTripInput => ({
  label: 'Italy',
  entryCountryCode: 'IT',
  exitCountryCode: 'AT',
  entryDate: '2026-09-15',
  exitDate: '2026-10-13',
  outsideBreaks: [],
  ...overrides
});

describe('future trip simulator', () => {
  test('marks a proposed trip safe and calculates the latest safe exit', () => {
    const state = buildTripSimulationState(savedTrips, proposal());
    expect(state.valid).toBe(true);
    expect(state.statusLabel).toBe('Italy fits');
    expect(state.daysUsedLabel).toBe('75 / 90');
    expect(state.maxStayLabel).toBe('56 days across this trip');
    expect(state.latestSafeExitLabel).toBe('Nov 9');
  });

  test('marks an over-limit proposal without mutating saved trips', () => {
    const originalTrips = [makeTrip('prior', 'Prior Schengen', '2026-01-01', '2026-03-31')];
    const original = structuredClone(originalTrips);
    const state = buildTripSimulationState(originalTrips, proposal({ entryDate: '2026-06-29', exitDate: '2026-06-30' }));
    expect(originalTrips).toEqual(original);
    expect(state.statusTone).toBe('risk');
    expect(state.daysUsedLabel).toBe('91 / 90');
  });

  test('counts a multi-country plan around an outside-Schengen break', () => {
    const state = buildTripSimulationState([], proposal({
      entryDate: '2026-07-01',
      exitDate: '2026-07-12',
      outsideBreaks: [{ id: 'ireland', leftDate: '2026-07-05', reentryDate: '2026-07-08' }]
    }));
    expect(state.valid).toBe(true);
    expect(state.daysUsedLabel).toBe('10 / 90');
    expect(state.simulatedTrip?.stays).toHaveLength(2);
  });

  test('returns validation errors without producing a simulation', () => {
    const state = buildTripSimulationState(savedTrips, proposal({ entryDate: '2026-10-13', exitDate: '2026-09-15' }));
    expect(state.valid).toBe(false);
    expect(state.errors.exitDate).toBe('The date you left Schengen cannot be before the date you entered.');
  });

  test('marks a proposal risky when it would break a later booked trip', () => {
    const laterBooking = makeTrip('later-germany', 'Germany booking', '2026-03-04', '2026-04-02', 'booked', 'DE');
    const state = buildTripSimulationState([laterBooking], proposal({
      label: 'Spain proposal',
      entryCountryCode: 'ES',
      exitCountryCode: 'ES',
      entryDate: '2026-01-01',
      exitDate: '2026-03-03'
    }));
    expect(state.statusTone).toBe('risk');
    expect(state.conflict).toMatchObject({ date: '2026-04-01', tripId: 'later-germany' });
    expect(state.firstFixCopy).toContain('shorten Spain proposal to Mar 1');
  });
});
