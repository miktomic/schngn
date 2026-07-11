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
const prospectiveToday = '2025-12-31';

describe('future trip simulator', () => {
  test('marks a proposed trip safe and calculates the latest safe exit', () => {
    const state = buildTripSimulationState(savedTrips, proposal(), prospectiveToday);
    expect(state.valid).toBe(true);
    expect(state.statusLabel).toBe('Italy fits');
    expect(state.daysUsedLabel).toBe('75 / 90');
    expect(state.maxStayLabel).toBe('56 days across this trip');
    expect(state.latestSafeExitLabel).toBe('Nov 9');
  });

  test('marks an over-limit proposal without mutating saved trips', () => {
    const originalTrips = [makeTrip('prior', 'Prior Schengen', '2026-01-01', '2026-03-31')];
    const original = structuredClone(originalTrips);
    const state = buildTripSimulationState(
      originalTrips,
      proposal({ entryDate: '2026-06-29', exitDate: '2026-06-30' }),
      prospectiveToday
    );
    expect(originalTrips).toEqual(original);
    expect(state.statusTone).toBe('risk');
    expect(state.daysUsedLabel).toBe('91 / 90');
  });

  test('counts a multi-country plan around an outside-Schengen break', () => {
    const state = buildTripSimulationState([], proposal({
      entryDate: '2026-07-01',
      exitDate: '2026-07-12',
      outsideBreaks: [{ id: 'ireland', leftDate: '2026-07-05', reentryDate: '2026-07-08' }]
    }), prospectiveToday);
    expect(state.valid).toBe(true);
    expect(state.daysUsedLabel).toBe('10 / 90');
    expect(state.simulatedTrip?.stays).toHaveLength(2);
  });

  test('returns validation errors without producing a simulation', () => {
    const state = buildTripSimulationState(
      savedTrips,
      proposal({ entryDate: '2026-10-13', exitDate: '2026-09-15' }),
      prospectiveToday
    );
    expect(state.valid).toBe(false);
    expect(state.errors.exitDate).toBe('The exit date cannot be before the entry date.');
  });

  test('marks a proposal risky when it would break a later booked trip', () => {
    const laterBooking = makeTrip('later-germany', 'Germany booking', '2026-03-04', '2026-04-02', 'booked', 'DE');
    const state = buildTripSimulationState([laterBooking], proposal({
      label: 'Spain proposal',
      entryCountryCode: 'ES',
      exitCountryCode: 'ES',
      entryDate: '2026-01-01',
      exitDate: '2026-03-03'
    }), '2025-12-31');
    expect(state.statusTone).toBe('risk');
    expect(state.conflict).toMatchObject({ date: '2026-04-01', tripId: 'later-germany' });
    expect(state.firstFixCopy).toContain('shorten Spain proposal to Mar 1');
  });

  test('recalculates completed state when an adjusted exit moves across today', () => {
    const completed = buildTripSimulationState([], proposal({
      entryDate: '2026-07-01',
      exitDate: '2026-07-10'
    }), '2026-07-11');
    expect(completed.completed).toBe(true);
    expect(completed.statusLabel).toBe('Italy · Completed');
    expect(`${completed.statusLabel} ${completed.summaryCopy} ${completed.firstFixCopy}`)
      .not.toMatch(/fits|needs changes|book(?:ing)?/i);

    const endingToday = buildTripSimulationState([], proposal({
      entryDate: '2026-07-01',
      exitDate: '2026-07-11'
    }), '2026-07-11');
    expect(endingToday.completed).toBe(false);
    expect(endingToday.statusLabel).toBe('Italy fits');

    const movedIntoFuture = buildTripSimulationState([], proposal({
      entryDate: '2026-07-01',
      exitDate: '2026-07-12'
    }), '2026-07-11');
    expect(movedIntoFuture.completed).toBe(false);
    expect(movedIntoFuture.statusLabel).toBe('Italy fits');
  });

  test('keeps a completed trip historical when its days would break a later plan', () => {
    const futurePlan = makeTrip('future-plan', 'Future plan', '2026-04-01', '2026-05-15', 'booked');
    const state = buildTripSimulationState([futurePlan], proposal({
      label: 'Recorded past trip',
      entryDate: '2026-01-01',
      exitDate: '2026-03-01'
    }), '2026-03-15');

    expect(state.completed).toBe(true);
    expect(state.conflict).toMatchObject({ tripId: 'future-plan', tripLabel: 'Future plan' });
    expect(state.summaryCopy).toContain('Future plan would reach 91 / 90');
    expect(state.summaryCopy).toContain('Recorded past trip remains in the rolling history');
    expect(state.summaryCopy).not.toContain('Recorded past trip reached 91 / 90');
    expect(state.firstFixCopy).toContain('Future plan is the later plan affected');
  });
});
