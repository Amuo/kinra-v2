import { t as tr } from "@/lib/i18n";
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
        ? tr("No session in {p0} days", {
            p0: Math.floor((Date.now() - new Date(last.performed_at).getTime()) / 86400000),
          })
        : "No sessions logged",
    );
  const mood = avg(r.journal.slice(0, 3).map((j) => j.mood));
  if (mood && mood < 3) reasons.push(tr("Mood {p0}/5 · last 3 check-ins", { p0: mood.toFixed(1) }));
  const sleep = avg(r.sleep.slice(0, 3).map((s) => +s.hours));
  if (sleep && sleep < 6.5)
    reasons.push(tr("Sleep {p0} h · last 3 nights", { p0: sleep.toFixed(1) }));
  return reasons;
}

export function kudosDraft(name: string | null, workout?: { title: string }): string {
  const first = (name ?? "").split(" ")[0];
  return workout
    ? tr("Strong work{p0}. {p1} is in the books — keep building.", {
        p0: first ? `, ${first}` : "",
        p1: workout.title,
      })
    : tr("Keep going{p0}. Every step counts.", { p0: first ? `, ${first}` : "" });
}
