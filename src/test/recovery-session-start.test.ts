import { describe, expect, it } from "vitest";
import recoveryData from "@/data/recovery-program-templates.json";
import { localizedTemplate, programTemplates } from "@/lib/program-templates";
import { sessionFromTemplate, toWorkoutRow } from "@/components/strata/session";
import { sessionPresentation } from "@/components/strata/session-presentation";
import type { Workout } from "@/lib/types";

describe("gentle movement session starts", () => {
  it("keeps all eight examples unloaded despite weighted history and lighter-day preferences", () => {
    for (const row of recoveryData) {
      const template = programTemplates.find((entry) => entry.id === row.en.id)!;
      const before = JSON.stringify(template);
      const day = template.days[0]!;
      const weightedHistory: Workout[] = [
        {
          id: "past",
          user_id: "synthetic",
          title: "Previously loaded movement",
          performed_at: "2026-10-20T12:00:00.000Z",
          duration_min: 10,
          rpe: 5,
          notes: null,
          sets: day.exercises.map((exercise) => ({
            exercise: exercise.name,
            reps: 12,
            weight: 40,
          })),
        },
      ];
      for (const lighter of [false, true]) {
        const session = sessionFromTemplate(day, weightedHistory, lighter);
        session.displaySource = { id: template.id, version: 1 };
        for (const [index, exercise] of session.exercises.entries()) {
          const prescription = day.exercises[index]!;
          expect(exercise.targetWeight).toBe(0);
          expect(exercise.sets).toEqual([
            { kg: 0, reps: Number.parseInt(prescription.reps), done: false },
          ]);
          expect(exercise.catalogue_id).toBe(prescription.catalogue_id);
          expect(exercise.rest_seconds).toBe(30);
          expect(exercise.section).toBe("cooldown");
        }
        for (const language of ["en", "bs", "de"] as const) {
          const display = sessionPresentation(session, language);
          const localized = localizedTemplate(template, language).days[0]!;
          expect(display.title).toBe(localized.title);
          display.exercises.forEach((exercise, index) =>
            expect(exercise.notes).toBe(localized.exercises[index]!.notes),
          );
        }
        session.exercises.forEach((exercise) =>
          exercise.sets.forEach((set) => {
            set.done = true;
          }),
        );
        const saved = toWorkoutRow(session, session.startedAt + 60_000);
        expect(saved.sets!.every((set) => set.weight === 0 && set.reps > 0 && !set.cardio)).toBe(
          true,
        );
      }
      expect(JSON.stringify(template)).toBe(before);
    }
  });
});
