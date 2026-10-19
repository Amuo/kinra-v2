import { afterEach, describe, expect, it, vi } from "vitest";
import { readiness, readinessParts, recentSleep } from "../lib/stats";
import type { SleepLog } from "../lib/types";
afterEach(() => vi.useRealTimers());
describe("readiness evidence window", () => {
  it("ignores stale and future sleep and uses the same recent evidence for score and explanation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 19, 12));
    const night = (date: string, hours: number): SleepLog => ({
      id: date,
      user_id: "u",
      log_date: date,
      hours,
      quality: 5,
    });
    const recent = night("2026-10-18", 8);
    const logs = [night("2026-11-01", 1), night("2026-09-01", 1), recent];
    expect(recentSleep(logs)).toEqual([recent]);
    expect(readiness(logs, [])).toBe(readiness([recent], []));
    expect(readinessParts(logs, [], [])).toMatchObject({ sleepHours: 8, sleepScore: 100 });
    expect(recentSleep([night("2026-09-01", 8)])).toEqual([]);
    expect(logs).toHaveLength(3);
  });
});
