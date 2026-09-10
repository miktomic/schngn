import { calculateUsageOnDate, formatISODate, type SchengenStay, type UsageResult } from '@schngn/engine';
import { toEngineTrips, type EditableTrip } from '../trips/tripCrud';
import type { MovingWindowBounds } from './movingWindow';

const DAY = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;
const iso = (day: number) => formatISODate(new Date(day * DAY));
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const colors = ['#386b94', '#317b6c', '#6654a3', '#9b536a', '#496c84', '#817038'];

export interface ContributionLayer {
  id: string;
  trips: EditableTrip[];
  color: string;
  projected: boolean;
}
export interface ContributionPoint { date: string; used: number; values: number[] }
interface OwnedRange { start: number; end: number; owner: number }
export interface ContributionSeries {
  startDate: string;
  endDate: string;
  layers: ContributionLayer[];
  ranges: OwnedRange[];
  ownerLayers: number[];
  points: ContributionPoint[];
  hasOverlap: boolean;
}

/** Attribute the engine's unique counted dates; this never calculates a second verdict. */
export function contributionReading(series: ContributionSeries, usage: UsageResult): number[] {
  const values = series.layers.map(() => 0);
  for (const date of usage.countedDays) {
    const day = dayNumber(date);
    let lo = 0, hi = series.ranges.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const range = series.ranges[mid];
      if (day < range.start) hi = mid - 1;
      else if (day > range.end) lo = mid + 1;
      else { values[series.ownerLayers[range.owner]]++; break; }
    }
  }
  return values;
}

export function buildContributionSeries(trips: EditableTrip[], bounds: MovingWindowBounds): ContributionSeries {
  const min = dayNumber(bounds.minDate), max = dayNumber(bounds.endDate);
  const firstEntry = (trip: EditableTrip) => trip.stays.map(stay => stay.entryDate).sort()[0];
  const ordered = [...trips].sort((a, b) => compare(firstEntry(a), firstEntry(b)) || compare(a.id, b.id));
  const events = new Map<number, { owner: number; delta: number }[]>();
  function event(day: number, owner: number, delta: number) {
    const values = events.get(day) ?? [];
    values.push({ owner, delta }); events.set(day, values);
  }
  ordered.forEach((trip, owner) => {
    for (const stay of toEngineTrips([trip], bounds.endDate)) {
      const start = Math.max(min - 179, dayNumber(stay.entryDate));
      const end = Math.min(max, dayNumber(stay.exitDate));
      if (start <= end) { event(start, owner, 1); event(end + 1, owner, -1); }
    }
  });
  const ranges: OwnedRange[] = [];
  const active = new Map<number, number>();
  let previous = min - 179, hasOverlap = false;
  for (const [day, changes] of [...events].sort(([a], [b]) => a - b)) {
    if (day > previous && active.size) {
      const owner = Math.min(...active.keys());
      hasOverlap ||= active.size > 1;
      const last = ranges.at(-1);
      if (last && last.owner === owner && last.end + 1 === previous) last.end = day - 1;
      else ranges.push({ start: previous, end: day - 1, owner });
    }
    for (const change of changes) {
      const count = (active.get(change.owner) ?? 0) + change.delta;
      if (count) active.set(change.owner, count); else active.delete(change.owner);
    }
    previous = day;
  }
  const owners = [...new Set(ranges.map(range => range.owner))].sort((a, b) => a - b);
  // Keep the most recent five trips distinct; older contributions remain in a
  // named aggregate so large histories do not create hundreds of tiny layers.
  const grouped = owners.length > 6 ? [owners.slice(0, -5), ...owners.slice(-5).map(owner => [owner])] : owners.map(owner => [owner]);
  const ownerLayers: number[] = [];
  const layers = grouped.map((group, i): ContributionLayer => {
    const members = group.map(owner => ordered[owner]);
    group.forEach(owner => { ownerLayers[owner] = i; });
    return {
      id: JSON.stringify(members.map(trip => trip.id)), trips: members,
      color: members.length > 1 ? '#6e7974' : members[0].status === 'what-if' ? '#a16a13' : colors[i % colors.length],
      projected: members.some(trip => trip.ongoing)
    };
  });
  // Only the geometric turn points are needed: the inclusive rolling count is
  // linear between these dates. A trip years away does not require years of samples.
  const dates = new Set([min, max]);
  const union: { start: number; end: number }[] = [];
  for (const range of ranges) {
    for (const point of [range.start - 1, range.end, range.start + 179, range.end + 180]) {
      if (point >= min && point <= max) dates.add(point);
    }
    const last = union.at(-1);
    if (last && last.end + 1 === range.start) last.end = range.end;
    else union.push({ start: range.start, end: range.end });
  }
  const stays: SchengenStay[] = union.map(range => ({ entryDate: iso(range.start), exitDate: iso(range.end) }));
  const series: ContributionSeries = { startDate: bounds.minDate, endDate: bounds.endDate, layers, ranges, ownerLayers, points: [], hasOverlap };
  series.points = [...dates].sort((a, b) => a - b).map(day => {
    const date = iso(day);
    const usage = calculateUsageOnDate(stays, date);
    return { date, used: usage.daysUsed, values: contributionReading(series, usage) };
  });
  return series;
}
