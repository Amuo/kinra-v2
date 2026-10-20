import type { TemplateSource } from "@/lib/template-origins";
import type { CardioMetrics } from "@/lib/cardio";
import { createContext, useContext } from "react";
import type { ProgramDay, Workout } from "@/lib/types";
import type { RestState, SetType } from "@/lib/session-state";
import type { LogKind } from "./sheets";

export type SSet = {
  cardio?: CardioMetrics;
  kg: number;
  reps: number;
  done: boolean;
  pr?: boolean;
  type?: SetType;
  note?: string;
  at?: number;
};
export type SEx = {
  tracking?: "cardio" | undefined;
  targetCardio?: CardioMetrics | undefined;
  catalogue_id?: string | undefined;
  section?: "warmup" | "main" | "cooldown" | undefined;
  group?: string | undefined;
  equipment?: string | undefined;
  substitutions?: string[] | undefined;
  name: string;
  sets: SSet[];
  targetWeight?: number | null | undefined;
  rest_seconds?: number | null | undefined;
  rpe?: number | null | undefined;
  tempo?: string | undefined;
  notes?: string | undefined;
  skipped?: boolean;
  note?: string;
};
export type LiveSessionState = {
  /** Optional UI-only provenance, persisted in the local draft, never in workouts. */
  displaySource?: TemplateSource;
  workoutId: string;
  title: string;
  startedAt: number;
  exercises: SEx[];
  lighter?: boolean;
  pausedAt?: number | null;
  totalPausedMs?: number;
  pauseIntervals?: { start: number; end: number }[];
  lastActiveAt?: number;
  rest?: RestState | null;
  /** Review mode: update the same saved workout, keeping its original date. */
  editingId?: string;
  performedAt?: string;
  rpe?: number;
  /** Saved successfully; the celebration is showing. */
  savedAt?: number;
};

export interface ShellApi {
  log: (k: Exclude<LogKind, "workout">, opts?: { meal?: string }) => void;
  startSession: (template?: ProgramDay, displaySource?: TemplateSource) => void;
  openSession: () => void;
  editWorkout: (w: Workout) => void;
  session: LiveSessionState | null;
}

export const ShellCtx = createContext<ShellApi>({
  log: () => {},
  startSession: () => {},
  openSession: () => {},
  editWorkout: () => {},
  session: null,
});
export const useShell = () => useContext(ShellCtx);

/** Convenience: one function for every log kind; "workout" starts a live session. */
export function useLogger() {
  const s = useShell();
  return (k: LogKind, t?: ProgramDay) => (k === "workout" ? s.startSession(t) : s.log(k));
}
