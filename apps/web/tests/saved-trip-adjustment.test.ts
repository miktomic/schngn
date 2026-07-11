import { describe, expect, test } from 'bun:test';
import {
  applySavedTripDateAdjustment,
  commitSavedTripAdjustment,
  createSavedTripAdjustmentDraft,
  hasSavedTripAdjustmentChanges,
  savedTripAdjustmentBounds
} from '../src/lib/simulator/savedTripAdjustment';
import { upsertTrip, type EditableTrip, type TripStatus } from '../src/lib/trips/tripCrud';

function trip(id: string, status: TripStatus, entryDate: string, exitDate: string, label = id): EditableTrip {
  const result = upsertTrip([], {
    id,
    label,
    entryDate,
    exitDate,
    outsideBreaks: [],
    status
  }, '2026-01-01');
  return { ...result.trips[0], status };
}

describe('saved trip adjustment', () => {
  test('keeps an ongoing stay open until the traveler explicitly ends it', () => {
    const ongoing = { ...trip('ongoing', 'booked', '2026-07-01', '2026-07-10', 'Current stay'), ongoing: true as const, exitCountryCode: undefined };
    const draft = createSavedTripAdjustmentDraft(ongoing, '2026-07-10');
    expect(draft.form.ongoing).toBe(true);

    const keptOpen = commitSavedTripAdjustment([ongoing], ongoing.id, { ...draft.form, entryDate: '2026-07-02' }, '2026-07-10');
    expect(keptOpen.trips[0].ongoing).toBe(true);
    expect(keptOpen.trips[0].stays.at(-1)?.exitDate).toBe('2026-07-10');

    const ended = commitSavedTripAdjustment(keptOpen.trips, ongoing.id, { ...draft.form, ongoing: false }, '2026-07-10');
    expect(ended.trips[0].ongoing).toBeUndefined();
    expect(ended.trips[0].stays.at(-1)?.exitDate).toBe('2026-07-10');
  });
  test('enables saving only while the adjusted dates differ from the saved trip', () => {
    const sourceResult = upsertTrip([], {
      id: 'dirty-state-trip',
      label: 'Dirty state trip',
      entryDate: '2026-08-01',
      exitDate: '2026-08-20',
      outsideBreaks: [
        { id: 'break-1', leftDate: '2026-08-05', reentryDate: '2026-08-08' },
        { id: 'break-2', leftDate: '2026-08-12', reentryDate: '2026-08-15' }
      ],
      status: 'booked'
    }, '2026-07-01');
    const source = sourceResult.trips[0];
    const draft = createSavedTripAdjustmentDraft(source);

    expect(hasSavedTripAdjustmentChanges(source, draft.form)).toBe(false);
    expect(hasSavedTripAdjustmentChanges(source, {
      ...draft.form,
      outsideBreaks: [
        { id: 'regenerated-2', leftDate: '2026-08-12', reentryDate: '2026-08-15' },
        { id: 'regenerated-1', leftDate: '2026-08-05', reentryDate: '2026-08-08' }
      ]
    })).toBe(false);

    const moved = applySavedTripDateAdjustment(draft.form, {
      entryDate: '2026-08-02', exitDate: '2026-08-21', mode: 'move', moveDays: 1
    });
    expect(hasSavedTripAdjustmentChanges(source, moved)).toBe(true);
    expect(hasSavedTripAdjustmentChanges(source, {
      ...moved,
      entryDate: draft.form.entryDate,
      exitDate: draft.form.exitDate
    })).toBe(true);

    const restored = applySavedTripDateAdjustment(moved, {
      entryDate: '2026-08-01', exitDate: '2026-08-20', mode: 'move', moveDays: -1
    });
    expect(hasSavedTripAdjustmentChanges(source, restored)).toBe(false);
  });

  test('also detects inline label, country, and outside-Schengen detail changes', () => {
    const source = trip('details', 'booked', '2026-04-01', '2026-04-10', 'Original label');
    const draft = createSavedTripAdjustmentDraft(source).form;

    expect(hasSavedTripAdjustmentChanges(source, { ...draft, label: 'Corrected label' })).toBe(true);
    expect(hasSavedTripAdjustmentChanges(source, { ...draft, entryCountryCode: 'IT' })).toBe(true);
    expect(hasSavedTripAdjustmentChanges(source, { ...draft, exitCountryCode: 'AT' })).toBe(true);
    expect(hasSavedTripAdjustmentChanges(source, {
      ...draft,
      outsideBreaks: [{ id: 'break-1', leftDate: '2026-04-04', reentryDate: '2026-04-06' }]
    })).toBe(true);
    expect(hasSavedTripAdjustmentChanges(source, draft)).toBe(false);
  });

  test('updates only the selected trip and preserves its identity', () => {
    const first = trip('first', 'booked', '2026-08-01', '2026-08-05');
    const second = trip('second', 'booked', '2026-09-01', '2026-09-05');
    const draft = createSavedTripAdjustmentDraft(first);
    const adjusted = applySavedTripDateAdjustment(draft.form, {
      entryDate: '2026-08-02',
      exitDate: '2026-08-06',
      mode: 'move',
      moveDays: 1
    });
    const result = commitSavedTripAdjustment([first, second], first.id, adjusted, '2026-07-01');

    expect(result.updated).toBe(true);
    expect(result.trips).toHaveLength(2);
    expect(result.trips.find((value) => value.id === first.id)?.stays).toEqual([
      { entryDate: '2026-08-02', exitDate: '2026-08-06' }
    ]);
    expect(result.trips.find((value) => value.id === second.id)).toEqual(second);
  });

  test('commits corrected inline trip details without changing identity', () => {
    const source = trip('details-save', 'booked', '2026-08-01', '2026-08-10', 'Old label');
    const draft = createSavedTripAdjustmentDraft(source).form;
    const result = commitSavedTripAdjustment([source], source.id, {
      ...draft,
      label: 'Corrected label',
      entryCountryCode: 'IT',
      exitCountryCode: 'AT',
      outsideBreaks: [{ id: 'break-1', leftDate: '2026-08-04', reentryDate: '2026-08-06' }]
    }, '2026-07-01');

    expect(result.updated).toBe(true);
    expect(result.trips[0]).toMatchObject({
      id: source.id,
      label: 'Corrected label',
      entryCountryCode: 'IT',
      exitCountryCode: 'AT'
    });
    expect(result.trips[0].stays).toEqual([
      { entryDate: '2026-08-01', exitDate: '2026-08-04' },
      { entryDate: '2026-08-06', exitDate: '2026-08-10' }
    ]);
  });

  test('preserves planned status while still inferring past trips', () => {
    const cases: { source: TripStatus; exitDate: string; expected: TripStatus }[] = [
      { source: 'booked', exitDate: '2026-08-05', expected: 'booked' },
      { source: 'booked', exitDate: '2026-06-30', expected: 'past' },
      { source: 'what-if', exitDate: '2026-08-05', expected: 'what-if' },
      { source: 'what-if', exitDate: '2026-06-30', expected: 'past' },
      { source: 'past', exitDate: '2026-06-30', expected: 'past' },
      { source: 'past', exitDate: '2026-08-05', expected: 'booked' }
    ];

    for (const value of cases) {
      const source = trip(`trip-${value.source}-${value.exitDate}`, value.source, '2026-06-01', value.exitDate);
      const draft = createSavedTripAdjustmentDraft(source);
      const result = commitSavedTripAdjustment([source], source.id, draft.form, '2026-07-01');
      expect(result.trips[0]?.status).toBe(value.expected);
    }
  });

  test('does not resurrect a selected trip that disappeared', () => {
    const source = trip('missing', 'booked', '2026-08-01', '2026-08-05');
    const draft = createSavedTripAdjustmentDraft(source);
    const result = commitSavedTripAdjustment([], source.id, draft.form, '2026-07-01');

    expect(result.updated).toBe(false);
    expect(result.trips).toEqual([]);
    expect(result.errors.id).toBeTruthy();
  });

  test('keeps an unlabeled trip unlabeled while changing its dates', () => {
    const sourceResult = upsertTrip([], {
      id: 'unlabeled',
      label: '',
      entryDate: '2026-08-01',
      exitDate: '2026-08-05',
      outsideBreaks: [],
      status: 'booked'
    }, '2026-07-01');
    const source = sourceResult.trips[0];
    const draft = createSavedTripAdjustmentDraft(source);
    const adjusted = applySavedTripDateAdjustment(draft.form, {
      entryDate: '2026-08-02',
      exitDate: '2026-08-06',
      mode: 'move',
      moveDays: 1
    });
    const result = commitSavedTripAdjustment([source], source.id, adjusted, '2026-07-01');

    expect(result.updated).toBe(true);
    expect(result.trips[0]?.label).toBeUndefined();
  });

  test('moves every stay together and clamps resized edges around outside breaks', () => {
    const sourceResult = upsertTrip([], {
      id: 'split-trip',
      label: 'Split trip',
      entryDate: '2026-08-01',
      exitDate: '2026-08-12',
      outsideBreaks: [{ id: 'break-1', leftDate: '2026-08-05', reentryDate: '2026-08-08' }],
      status: 'booked'
    }, '2026-07-01');
    const draft = createSavedTripAdjustmentDraft(sourceResult.trips[0]);
    const moved = applySavedTripDateAdjustment(draft.form, {
      entryDate: '2026-08-02', exitDate: '2026-08-13', mode: 'move', moveDays: 1
    });

    expect(moved.outsideBreaks).toEqual([
      { id: 'break-1', leftDate: '2026-08-06', reentryDate: '2026-08-09' }
    ]);
    expect(savedTripAdjustmentBounds(moved)).toEqual({ entryMax: '2026-08-06', exitMin: '2026-08-09' });
    expect(applySavedTripDateAdjustment(moved, {
      entryDate: '2026-08-10', exitDate: moved.exitDate, mode: 'entry', moveDays: 0
    }).entryDate).toBe('2026-08-06');
    expect(applySavedTripDateAdjustment(moved, {
      entryDate: moved.entryDate, exitDate: '2026-08-07', mode: 'exit', moveDays: 0
    }).exitDate).toBe('2026-08-09');
  });

  test('applies repeated pointer targets incrementally without compounding outside breaks', () => {
    const sourceResult = upsertTrip([], {
      id: 'dragged-split-trip',
      label: 'Dragged split trip',
      entryDate: '2026-08-01',
      exitDate: '2026-08-12',
      outsideBreaks: [{ id: 'break-1', leftDate: '2026-08-05', reentryDate: '2026-08-08' }],
      status: 'booked'
    }, '2026-07-01');
    let form = createSavedTripAdjustmentDraft(sourceResult.trips[0]).form;

    for (const [entryDate, exitDate, moveDays] of [
      ['2026-08-02', '2026-08-13', 1],
      ['2026-08-03', '2026-08-14', 2],
      ['2026-08-04', '2026-08-15', 3]
    ] as const) {
      form = applySavedTripDateAdjustment(form, { entryDate, exitDate, moveDays, mode: 'move' });
    }

    expect(form.entryDate).toBe('2026-08-04');
    expect(form.exitDate).toBe('2026-08-15');
    expect(form.outsideBreaks).toEqual([
      { id: 'break-1', leftDate: '2026-08-08', reentryDate: '2026-08-11' }
    ]);
  });
});
