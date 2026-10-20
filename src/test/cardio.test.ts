import { expect, it } from "vitest";
import { prepareLog } from "@/lib/log-validation";
import { cardioMetricsError } from "@/lib/cardio";
import { sessionFromTemplate, toWorkoutRow } from "@/components/strata/session";
import { markAllDone, sessionFromWorkout } from "@/lib/session-state";
import { readSession, writeSession } from "@/lib/account-state";
import { programError } from "@/lib/programs";

it("keeps cardio targets separate from actuals and preserves measured values through draft/save/edit", () => {
  const s = sessionFromTemplate(
    {
      title: "Mixed",
      exercises: [
        {
          name: "Treadmill",
          sets: 1,
          reps: "cardio",
          tracking: "cardio",
          cardio: { duration_seconds: 600, speed_kmh: 5, incline_percent: 0 },
        },
      ],
    },
    [],
    false,
  );
  expect(s.exercises[0]!.sets[0]!.cardio).toEqual({});
  expect(markAllDone(s, Date.now()).exercises[0]!.sets[0]!.done).toBe(false);
  const actual = { duration_seconds: 630, distance_m: 925.5, speed_kmh: 0, incline_percent: -2 };
  s.exercises[0]!.sets[0] = { kg: 0, reps: 0, done: true, cardio: actual };
  writeSession(localStorage, "demo", "cardio-test", s);
  const restored = readSession(localStorage, "demo", "cardio-test")!;
  const row = prepareLog("workouts", toWorkoutRow(restored, Date.now()));
  expect(row.sets![0]).toEqual({
    exercise: "Treadmill",
    reps: 0,
    weight: 0,
    tracking: "cardio",
    cardio: actual,
  });
  const edited = sessionFromWorkout({
    ...row,
    id: "test",
    user_id: "test",
    performed_at: new Date().toISOString(),
    title: "Mixed",
    duration_min: 11,
    rpe: 5,
    notes: null,
    sets: row.sets!,
  });
  expect(edited.exercises[0]!.tracking).toBe("cardio");
  expect(toWorkoutRow(edited, Date.now()).sets).toEqual(row.sets);
  writeSession(localStorage, "demo", "cardio-test", null);
});
it("rejects missing actuals, invalid units/ranges and incompatible strength/cardio payloads", () => {
  const base = {
    title: "Cardio",
    sets: [
      {
        exercise: "Walk",
        tracking: "cardio" as const,
        reps: 0,
        weight: 0,
        cardio: { duration_seconds: 600 },
      },
    ],
  };
  expect(() => prepareLog("workouts", base)).not.toThrow();
  for (const cardio of [
    {},
    { duration_seconds: 0 },
    { duration_seconds: 2.5 },
    { distance_m: -1 },
    { duration_seconds: 1, speed_kmh: 201 },
    { duration_seconds: 1, incline_percent: 101 },
    { duration_seconds: 1, calories: 100 },
  ])
    expect(() =>
      prepareLog("workouts", { ...base, sets: [{ ...base.sets[0]!, cardio }] }),
    ).toThrow();
  expect(() =>
    prepareLog("workouts", { ...base, sets: [{ ...base.sets[0]!, weight: 30 }] }),
  ).toThrow();
  expect(() =>
    prepareLog("workouts", {
      ...base,
      sets: [{ exercise: "Walk", reps: 0, weight: 0, cardio: { duration_seconds: 1 } }],
    }),
  ).toThrow();
  expect(cardioMetricsError({ speed_kmh: 0 })).toBeTruthy();
  expect(cardioMetricsError({ distance_m: 1, incline_percent: 0 })).toBeNull();
  expect(
    programError({
      name: "Walk",
      weeks: 2,
      description: null,
      days: [
        {
          title: "Day",
          exercises: [
            {
              name: "Walk",
              sets: 1,
              reps: "cardio",
              tracking: "cardio",
              cardio: { distance_m: 1000 },
            },
          ],
        },
      ],
    }),
  ).toBeNull();
});
