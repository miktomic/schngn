import { describe, expect, test } from 'bun:test';
import { buildTripSimulationState } from '../src/lib/simulator/tripSimulator';
import type { EditableTrip } from '../src/lib/trips/tripCrud';

const savedTrips: EditableTrip[] = [
  { id: 'france', label: 'France', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-12', status: 'past' },
  { id: 'germany', label: 'Germany', countryCode: 'DE', entryDate: '2026-06-03', exitDate: '2026-06-20', status: 'past' },
  { id: 'greece', label: 'Greece', countryCode: 'GR', entryDate: '2026-08-02', exitDate: '2026-08-17', status: 'past' }
];

describe('future trip simulator', () => {
  test('marks a proposed trip safe and shows maximum additional days from proposed start', () => {
    const state = buildTripSimulationState(savedTrips, {
      label: 'Italy',
      countryCode: 'IT',
      entryDate: '2026-09-15',
      exitDate: '2026-10-13'
    });

    expect(state.valid).toBe(true);
    expect(state.statusLabel).toBe('Italy fits');
    expect(state.statusTone).toBe('safe');
    expect(state.daysUsedLabel).toBe('75 / 90');
    expect(state.maxStayLabel).toBe('56 days max from Sep 15');
    expect(state.latestSafeExitLabel).toBe('Nov 9');
    expect(state.summaryCopy).toContain('15 safe buffer days');
  });

  test('marks an over-limit proposal without mutating saved trips', () => {
    const originalTrips: EditableTrip[] = [
      { id: 'prior', label: 'Prior Schengen', entryDate: '2026-01-01', exitDate: '2026-03-31', status: 'past' }
    ];
    const original = structuredClone(originalTrips);
    const state = buildTripSimulationState(originalTrips, {
      label: 'Italy',
      countryCode: 'IT',
      entryDate: '2026-06-29',
      exitDate: '2026-06-30'
    });

    expect(originalTrips).toEqual(original);
    expect(state.valid).toBe(true);
    expect(state.statusLabel).toBe('Italy needs changes');
    expect(state.statusTone).toBe('risk');
    expect(state.daysUsedLabel).toBe('91 / 90');
    expect(state.summaryCopy).toContain('would exceed the limit before exit');
    expect(state.firstFixCopy).toContain('move Italy later');
  });

  test('reports at-limit proposal as a warning rather than an overstay', () => {
    const state = buildTripSimulationState(
      [{ id: 'prior', label: 'Prior Schengen', entryDate: '2026-01-01', exitDate: '2026-03-30', status: 'past' }],
      { label: 'Italy', countryCode: 'IT', entryDate: '2026-06-29', exitDate: '2026-06-29' }
    );

    expect(state.statusLabel).toBe('Italy at limit');
    expect(state.statusTone).toBe('close');
    expect(state.daysUsedLabel).toBe('90 / 90');
    expect(state.summaryCopy).toContain('0 safe buffer days');
  });

  test('returns validation errors without producing a simulated trip', () => {
    const state = buildTripSimulationState(savedTrips, {
      label: 'Italy',
      countryCode: 'IT',
      entryDate: '2026-10-13',
      exitDate: '2026-09-15'
    });

    expect(state.valid).toBe(false);
    expect(state.statusLabel).toBe('Add dates to simulate');
    expect(state.errors.exitDate).toBe('Exit date cannot be before entry date.');
  });
});
