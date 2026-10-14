import { addDays, format } from "date-fns";
import type { SleepLog } from "./types";

/** Calendar-bound, read-only projection. Multiple logs remain distinct in storage. */
export function sleepTimeline(logs: readonly SleepLog[], end: string, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = format(addDays(new Date(`${end}T12:00:00`), i - days + 1), "yyyy-MM-dd");
    const entries = logs.filter((log) => log.log_date === date);
    return {
      date,
      entries,
      hours: entries.length
        ? entries.reduce((sum, log) => sum + Number(log.hours), 0) / entries.length
        : null,
      quality: entries.length
        ? entries.reduce((sum, log) => sum + log.quality, 0) / entries.length
        : null,
    };
  });
}

export const BREATH_SECONDS = 128;
export const BREATH_PHASES = ["Inhale", "Hold", "Exhale", "Hold"] as const;
export function breathFrame(elapsed: number) {
  const seconds = Math.max(0, Math.min(BREATH_SECONDS, Math.floor(elapsed)));
  const phase = Math.floor(seconds / 4) % 4;
  return {
    phase,
    name: BREATH_PHASES[phase] ?? "Inhale",
    left: 4 - (seconds % 4),
    rounds: Math.floor(seconds / 16),
    remaining: BREATH_SECONDS - seconds,
    done: seconds === BREATH_SECONDS,
  };
}
