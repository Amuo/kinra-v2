import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSummary } from "@/lib/report";
import { durationMin, pause, resume } from "@/lib/session-state";
import { allPages, prepareLog } from "@/lib/log-validation";
import { queryStatus } from "@/lib/query-status";

afterEach(() => vi.useRealTimers());
describe("report calendar windows", () => {
  it("includes today's date-only records before noon and excludes the prior period boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T09:00:00"));
    const summary = buildSummary(
      {
        workouts: [],
        journal: [],
        metrics: [],
        food: [
          {
            id: "f",
            user_id: "u",
            name: "Breakfast",
            meal: "Breakfast",
            calories: 500,
            protein: 12.5,
            carbs: 50,
            fat: 20,
            log_date: "2026-10-14",
          },
        ],
        sleep: [
          { id: "s", user_id: "u", log_date: "2026-10-14", hours: 8, quality: 4 },
          { id: "old", user_id: "u", log_date: "2026-10-07", hours: 2, quality: 1 },
        ],
      },
      7,
    );
    expect(summary.loggedFoodDays).toBe(1);
    expect(summary.avgSleep).toBe(8);
    expect(summary.from).toBe("2026-10-08");
    expect(summary.to).toBe("2026-10-14");
  });
  it("waits for metrics and never treats failed source queries as complete", () => {
    const ready = { isPending: false, error: null };
    expect(queryStatus([ready, ready, ready, ready, { ...ready, isPending: true }]).loading).toBe(
      true,
    );
    expect(queryStatus([ready, { ...ready, error: new Error("Offline") }]).error).toBeInstanceOf(
      Error,
    );
  });
});
describe("duration accounting", () => {
  it("does not subtract a pause after the last completed set when capping duration", () => {
    const minute = 60000;
    const base = {
      startedAt: 0,
      totalPausedMs: 0,
      exercises: [{ name: "Squat", sets: [{ kg: 60, reps: 5, done: true, at: 10 * minute }] }],
    };
    const state = resume(pause(base, 20 * minute), 60 * minute);
    expect(durationMin(state, 120 * minute, true)).toBe(10);
    expect(durationMin(state, 120 * minute)).toBe(80);
  });
  it("subtracts only the portion of a pause before the cutoff", () => {
    const state = {
      startedAt: 0,
      totalPausedMs: 400000,
      pauseIntervals: [{ start: 100000, end: 500000 }],
      exercises: [{ name: "Squat", sets: [{ kg: 60, reps: 5, done: true, at: 600000 }] }],
    };
    expect(durationMin(state, 1200000, true)).toBe(3);
  });
});
describe("log persistence boundary", () => {
  it("retains fractional macros, rejects invalid values, and binds date defaults to local today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T23:30:00"));
    const food = { meal: "Snack", name: "Oats", calories: 185, protein: 6, carbs: 30, fat: 3.5 };
    expect(prepareLog("nutrition_logs", food)).toMatchObject({ fat: 3.5, log_date: "2026-10-14" });
    expect(() => prepareLog("sleep_logs", { hours: -1, quality: 3 })).toThrow();
    expect(() => prepareLog("body_metrics", { weight: -1 })).toThrow();
  });
  it("loads history past 500 rows with a stable final page", async () => {
    const rows = Array.from({ length: 1200 }, (_, id) => ({ id }));
    const fetch = vi.fn(async (offset: number, size: number) => rows.slice(offset, offset + size));
    expect(await allPages(fetch)).toEqual(rows);
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
