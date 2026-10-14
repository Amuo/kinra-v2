import { avg, within } from "./stats";
import type { JournalEntry, Person, SleepLog, Workout } from "./types";

export type CoachClient = Person & {
  workouts: Workout[];
  journal: JournalEntry[];
  sleep: SleepLog[];
};
export const COMPLIANCE_TARGET = 16;

/** Presentation-only: retain the existing 30-day target and alert thresholds. */
export function clientAttention(r: CoachClient): string[] {
  const reasons: string[] = [];
  const last = r.workouts[0];
  if (!last || !within(last.performed_at, 5))
    reasons.push(
      last
        ? `No session in ${Math.floor((Date.now() - new Date(last.performed_at).getTime()) / 86400000)} days`
        : "No sessions logged",
    );
  const mood = avg(r.journal.slice(0, 3).map((j) => j.mood));
  if (mood && mood < 3) reasons.push(`Mood ${mood.toFixed(1)}/5 · last 3 check-ins`);
  const sleep = avg(r.sleep.slice(0, 3).map((s) => +s.hours));
  if (sleep && sleep < 6.5) reasons.push(`Sleep ${sleep.toFixed(1)} h · last 3 nights`);
  return reasons;
}

export function kudosDraft(name: string | null, workout?: { title: string }): string {
  const first = (name ?? "").split(" ")[0];
  return workout
    ? `Strong work${first ? `, ${first}` : ""}. ${workout.title} is in the books — keep building.`
    : `Keep going${first ? `, ${first}` : ""}. Every step counts.`;
}
