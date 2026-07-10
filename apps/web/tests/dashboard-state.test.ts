import { describe, expect, test } from "bun:test";
import { buildDashboardState } from "../src/lib/dashboard/dashboardState";
import type { EditableTrip } from "../src/lib/trips/tripCrud";

const sampleTrips: EditableTrip[] = [
  {
    countryCode: "FR",
    entryDate: "2026-05-01",
    exitDate: "2026-05-12",
    id: "france",
    label: "France",
    status: "past",
  },
  {
    countryCode: "DE",
    entryDate: "2026-06-03",
    exitDate: "2026-06-20",
    id: "germany",
    label: "Germany",
    status: "past",
  },
  {
    countryCode: "GR",
    entryDate: "2026-08-02",
    exitDate: "2026-08-17",
    id: "greece",
    label: "Greece",
    status: "past",
  },
  {
    countryCode: "IT",
    entryDate: "2026-09-15",
    exitDate: "2026-10-13",
    id: "italy",
    label: "Italy",
    status: "booked",
  },
];

describe("dashboard money-shot state", () => {
  test("answers safe booked trip with days remaining, status, and latest safe exit", () => {
    const state = buildDashboardState(sampleTrips);

    expect(state.heroMetric).toBe("15 safe buffer days");
    expect(state.statusLabel).toBe("Italy fits");
    expect(state.statusTone).toBe("safe");
    expect(state.daysUsedLabel).toBe("75 / 90");
    expect(state.latestSafeExitLabel).toBe("Nov 9");
    expect(state.whyCopy).toContain("75 counted days");
    expect(state.whyCopy).toContain("15 days remain");
  });

  test("warns when the planned trip is exactly at the limit", () => {
    const state = buildDashboardState([
      {
        entryDate: "2026-01-01",
        exitDate: "2026-03-30",
        id: "past-89",
        label: "Prior Schengen",
        status: "past",
      },
      {
        countryCode: "IT",
        entryDate: "2026-06-29",
        exitDate: "2026-06-29",
        id: "one-day",
        label: "Italy",
        status: "booked",
      },
    ]);

    expect(state.heroMetric).toBe("0 safe buffer days");
    expect(state.statusLabel).toBe("Italy at limit");
    expect(state.statusTone).toBe("close");
    expect(state.daysUsedLabel).toBe("90 / 90");
    expect(state.latestSafeExitLabel).toBe("Sep 26");
  });

  test("surfaces over-limit state and first required action", () => {
    const state = buildDashboardState([
      {
        entryDate: "2026-01-01",
        exitDate: "2026-03-31",
        id: "past-90",
        label: "Prior Schengen",
        status: "past",
      },
      {
        countryCode: "IT",
        entryDate: "2026-06-29",
        exitDate: "2026-06-29",
        id: "over-day",
        label: "Italy",
        status: "booked",
      },
    ]);

    expect(state.heroMetric).toBe("1 day over limit");
    expect(state.statusLabel).toBe("Italy needs changes");
    expect(state.statusTone).toBe("risk");
    expect(state.daysUsedLabel).toBe("91 / 90");
    expect(state.latestSafeExitLabel).toBe("No safe stay");
    expect(state.actionCopy).toContain("shorten or move Italy");
  });

  test("surfaces the earliest unsafe commitment even when a much later trip is safe", () => {
    const state = buildDashboardState([
      {
        entryDate: "2026-01-01",
        exitDate: "2026-03-31",
        id: "past-90",
        label: "Prior Schengen",
        status: "past",
      },
      {
        countryCode: "IT",
        entryDate: "2026-06-29",
        exitDate: "2026-06-29",
        id: "unsafe-italy",
        label: "Earlier Italy booking",
        status: "booked",
      },
      {
        countryCode: "PT",
        entryDate: "2026-12-01",
        exitDate: "2026-12-05",
        id: "safe-portugal",
        label: "Later Portugal booking",
        status: "booked",
      },
    ]);

    expect(state.targetTrip?.id).toBe("unsafe-italy");
    expect(state.referenceDate).toBe("2026-06-29");
    expect(state.statusTone).toBe("risk");
    expect(state.statusLabel).toBe("Earlier Italy booking needs changes");
    expect(state.daysUsedLabel).toBe("91 / 90");
    expect(state.heroMetric).toBe("1 day over limit");
  });

  test("uses imported/saved trip data rather than fixed Italy copy", () => {
    const state = buildDashboardState([
      {
        countryCode: "PT",
        entryDate: "2026-11-01",
        exitDate: "2026-11-10",
        id: "portugal",
        label: "Portugal",
        status: "booked",
      },
    ]);

    expect(state.heroMetric).toBe("80 safe buffer days");
    expect(state.statusLabel).toBe("Portugal fits");
    expect(state.daysUsedLabel).toBe("10 / 90");
    expect(state.latestSafeExitLabel).toBe("Jan 29");
    expect(state.windowLabel).toBe("May 15-Nov 10, 2026");
  });

  test("handles empty local data with a clear empty dashboard state", () => {
    const state = buildDashboardState([]);

    expect(state.heroMetric).toBe("90 safe buffer days");
    expect(state.statusLabel).toBe("Add a trip");
    expect(state.statusTone).toBe("safe");
    expect(state.daysUsedLabel).toBe("0 / 90");
    expect(state.latestSafeExitLabel).toBe("Add dates");
    expect(state.actionCopy).toContain("Add your next Schengen trip");
  });
});
