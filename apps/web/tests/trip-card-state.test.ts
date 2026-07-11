import { describe, expect, test } from 'bun:test';
import type { EditableTrip } from '../src/lib/trips/tripCrud';
import { assignTripColors, buildTripCardStates } from '../src/lib/trips/tripCardState';
import { makeTrip } from './trip-fixtures';

describe('trip card state', () => {
  test('keeps the highest affected stay-exit window for a multi-stay completed trip', () => {
    const prior = makeTrip('prior', 'Prior stay', '2026-01-01', '2026-03-31');
    const split: EditableTrip = {
      id: 'split',
      label: 'Split stay',
      status: 'past',
      stays: [
        { entryDate: '2026-04-01', exitDate: '2026-04-02' },
        { entryDate: '2026-07-01', exitDate: '2026-07-01' }
      ]
    };

    const state = buildTripCardStates([prior, split], [split], '2026-08-01').split;

    expect(state).toEqual({
      completed: true,
      overBy: 2,
      peakDaysUsed: 92,
      peakReferenceDate: '2026-04-02'
    });
  });

  test('uses all saved stays, de-duplicates overlaps, and only returns displayed trip ids', () => {
    const longStay = makeTrip('long', 'Long stay', '2026-01-01', '2026-03-31');
    const overlap = makeTrip('overlap', 'Overlap', '2026-03-01', '2026-04-01');

    const states = buildTripCardStates([longStay, overlap], [overlap], '2026-04-02');

    expect(Object.keys(states)).toEqual(['overlap']);
    expect(states.overlap).toEqual({
      completed: true,
      overBy: 1,
      peakDaysUsed: 91,
      peakReferenceDate: '2026-04-01'
    });
  });

  test('treats a trip ending today as current rather than completed', () => {
    const current = makeTrip('current', 'Current stay', '2026-07-01', '2026-07-11', 'booked');
    const future = makeTrip('future', 'Future stay', '2026-08-01', '2026-08-02', 'booked');

    const states = buildTripCardStates([current, future], [current, future], '2026-07-11');

    expect(states.current.completed).toBe(false);
    expect(states.future.completed).toBe(false);
  });

  test('assigns at least eight distinct colors by stable trip id rather than display order or dates', () => {
    const trips = Array.from({ length: 8 }, (_, index) =>
      makeTrip(`trip-${String(index).padStart(2, '0')}`, `Trip ${index}`, `2026-0${index + 1}-01`, `2026-0${index + 1}-02`)
    );
    const initial = assignTripColors(trips);
    const reorderedAndRedated = assignTripColors(
      [...trips]
        .reverse()
        .map((trip, index) => ({ ...trip, stays: [{ entryDate: `2027-01-${String(index + 1).padStart(2, '0')}`, exitDate: `2027-01-${String(index + 2).padStart(2, '0')}` }] }))
    );

    expect(new Set(Object.values(initial)).size).toBe(8);
    for (const color of Object.values(initial)) {
      expect(contrastRatio(color, '#ffffff')).toBeGreaterThanOrEqual(3);
    }
    expect(reorderedAndRedated).toEqual(initial);
  });

  test('gives duplicate occurrences of an id one color', () => {
    const first = makeTrip('same-id', 'First copy', '2026-01-01', '2026-01-02');
    const second = makeTrip('same-id', 'Second copy', '2026-03-01', '2026-03-02');

    expect(Object.keys(assignTripColors([first, second]))).toEqual(['same-id']);
  });
});

function contrastRatio(left: string, right: string): number {
  const [lighter, darker] = [relativeLuminance(left), relativeLuminance(right)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
