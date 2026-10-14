import { createContext, useContext } from "react";
import type { LiveSessionState } from "@/components/strata/shell";

// Undefined means the initial auth event has not arrived yet.
export const AuthIdentityContext = createContext<string | null | undefined>(undefined);
export const useAuthIdentity = () => useContext(AuthIdentityContext);
export const accountKey = (mode: string, ownerId: string) => [mode, ownerId] as const;
export const sessionKey = (mode: string, ownerId: string) => `strata:session:v2:${mode}:${ownerId}`;

export function readSession(
  storage: Pick<Storage, "getItem">,
  mode: string,
  ownerId: string,
): LiveSessionState | null {
  try {
    const value = JSON.parse(storage.getItem(sessionKey(mode, ownerId)) ?? "null");
    if (value?.version !== 2 || value.ownerId !== ownerId || value.mode !== mode) return null;
    const state = value.session;
    if (
      !state ||
      state.savedAt ||
      !Number.isFinite(state.startedAt) ||
      typeof state.title !== "string" ||
      !Array.isArray(state.exercises)
    )
      return null;
    if (
      !state.exercises.every(
        (exercise: { name?: unknown; sets?: unknown }) =>
          typeof exercise.name === "string" &&
          Array.isArray(exercise.sets) &&
          exercise.sets.every(
            (set: { kg?: unknown; reps?: unknown; done?: unknown }) =>
              typeof set.kg === "number" &&
              Number.isFinite(set.kg) &&
              typeof set.reps === "number" &&
              Number.isFinite(set.reps) &&
              typeof set.done === "boolean",
          ),
      )
    )
      return null;
    return { ...state, workoutId: state.workoutId ?? crypto.randomUUID() };
  } catch {
    return null;
  }
}

export function writeSession(
  storage: Pick<Storage, "setItem" | "removeItem">,
  mode: string,
  ownerId: string,
  session: LiveSessionState | null,
) {
  const key = sessionKey(mode, ownerId);
  if (session) storage.setItem(key, JSON.stringify({ version: 2, ownerId, mode, session }));
  else storage.removeItem(key);
}
