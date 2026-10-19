import { describe, it, expect } from "vitest";
import { nextGroupedSet, shouldRestAfterGroupedSet, type LEx } from "../lib/session-state";

const lift = (name: string, group?: string, count = 2): LEx => ({
  name,
  group,
  sets: Array.from({ length: count }, () => ({ kg: 10, reps: 8, done: false })),
});
describe("grouped session transitions", () => {
  it("moves through a superset round, rests at its boundary and then advances the round", () => {
    const s = { exercises: [lift("A", "pair"), lift("B", "pair")] };
    s.exercises[0]!.sets[0]!.done = true;
    expect(nextGroupedSet(s, 0, 0)).toEqual({ e: 1, s: 0 });
    expect(shouldRestAfterGroupedSet(s, 0, 0)).toBe(false);
    s.exercises[1]!.sets[0]!.done = true;
    expect(nextGroupedSet(s, 1, 0)).toEqual({ e: 0, s: 1 });
    expect(shouldRestAfterGroupedSet(s, 1, 0)).toBe(true);
    expect(s.exercises[0]!.sets[1]!.done).toBe(false);
  });
  it("skips omitted exercises and missing rounds without repeating completed sets", () => {
    const s = {
      exercises: [
        lift("A", "circuit", 1),
        { ...lift("Skipped", "circuit"), skipped: true },
        lift("B", "circuit", 2),
        lift("Other", "other"),
      ],
    };
    s.exercises[0]!.sets[0]!.done = true;
    s.exercises[2]!.sets[0]!.done = true;
    expect(nextGroupedSet(s, 2, 0)).toEqual({ e: 2, s: 1 });
    s.exercises[2]!.sets[1]!.done = true;
    expect(nextGroupedSet(s, 2, 1)).toBeNull();
    expect(nextGroupedSet({ exercises: [lift("Solo")] }, 0, 0)).toBeNull();
    expect(shouldRestAfterGroupedSet({ exercises: [lift("Solo")] }, 0, 0)).toBe(true);
  });
});
