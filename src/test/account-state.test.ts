import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { accountKey, readSession, sessionKey, writeSession } from "@/lib/account-state";
import { sessionFromWorkout } from "@/lib/session-state";
import type { Workout } from "@/lib/types";

const workout: Workout = {
  id: "workout",
  user_id: "alice",
  title: "Private draft",
  performed_at: "2026-10-14T09:00:00Z",
  duration_min: 10,
  rpe: 7,
  notes: null,
  sets: [],
};
describe("account isolation", () => {
  it("does not restore another account's draft or legacy unowned drafts", () => {
    localStorage.clear();
    const draft = sessionFromWorkout(workout);
    writeSession(localStorage, "live", "alice", draft);
    localStorage.setItem("strata-session-live", JSON.stringify(draft));
    expect(readSession(localStorage, "live", "bob")).toBeNull();
    expect(readSession(localStorage, "demo-client", "alice")).toBeNull();
    expect(readSession(localStorage, "live", "alice")?.title).toBe("Private draft");
  });
  it("rejects a mismatched envelope, malformed JSON, and saved drafts", () => {
    writeSession(localStorage, "live", "alice", sessionFromWorkout(workout));
    localStorage.setItem(
      sessionKey("live", "bob"),
      localStorage.getItem(sessionKey("live", "alice"))!,
    );
    expect(readSession(localStorage, "live", "bob")).toBeNull();
    localStorage.setItem(sessionKey("live", "alice"), "not json");
    expect(readSession(localStorage, "live", "alice")).toBeNull();
    writeSession(localStorage, "live", "alice", {
      ...sessionFromWorkout(workout),
      savedAt: Date.now(),
    });
    expect(readSession(localStorage, "live", "alice")).toBeNull();
  });
  it("partitions cached identity and aggregates as well as individual logs", () => {
    const cache = new QueryClient();
    for (const key of ["me", "programs", "coach-agg", "workouts"]) {
      cache.setQueryData([...accountKey("live", "alice"), key], { secret: "Alice" });
      expect(cache.getQueryData([...accountKey("live", "bob"), key])).toBeUndefined();
    }
    cache.clear();
    expect(cache.getQueryCache().getAll()).toHaveLength(0);
  });
});
