import { calculateUsageOnDate, addDays, parseISODate, formatISODate } from '../../packages/engine/src/index';
const date = (day: number) => formatISODate(addDays(parseISODate('2026-09-09'), day));
const trips = [
  { label: 'France', start: -160, end: -146 },
  { label: 'Italy', start: -140, end: -131 },
  { label: 'What-if stay', start: 0, end: 64 },
  { label: 'Spain', start: 80, end: 109 }
];
const frames = [false, true].map(include => Array.from({length: 132}, (_, i) => {
  const day = i - 1;
  const stays = trips.filter((_, j) => include || j !== 2).map(t => ({entryDate: date(t.start), exitDate: date(t.end)}));
  const usage = calculateUsageOnDate(stays, date(day));
  return { day, date: date(day), start: usage.windowStart, used: usage.daysUsed, over: usage.overBy };
}));
if (frames[1][0].used !== 25 || frames[1][110].used !== 95 || frames[0][110].used !== 30) throw new Error('Scenario mismatch');
const path = new URL('./moving-window.html', import.meta.url);
const template = await Bun.file(new URL('./template.html', import.meta.url)).text();
await Bun.write(path, template.replace('/*SCENARIO*/', JSON.stringify({trips, frames})));
console.log('Generated engine-backed study: 25 initially, 95 at Spain exit, 30 without the what-if stay.');
