import type { Program, ProgramDay, ProgramExercise } from "./types";
import { exerciseById } from "./exercise-catalogue";
import { cardioMetricsError } from "./cardio";

export type ProgramDraft = Omit<Program, "id" | "trainer_id">;
export const blankExercise = (): ProgramExercise => ({ name: "", sets: 3, reps: "8" });
export const blankDay = (number: number): ProgramDay => ({
  title: `Day ${number}`,
  exercises: [blankExercise()],
});
export function searchPrograms(programs: Program[], query: string): Program[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return programs.filter((program) => {
    const text = [
      program.name,
      program.description ?? "",
      ...program.days.flatMap((day) => [
        day.title,
        ...day.exercises.map((exercise) => exercise.name),
      ]),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
export function programDraft(program?: Program): ProgramDraft {
  return program
    ? structuredClone({
        name: program.name,
        description: program.description,
        weeks: program.weeks,
        days: program.days,
      })
    : { name: "", description: "", weeks: 4, days: [blankDay(1)] };
}
export function programError(draft: ProgramDraft): string | null {
  if (!draft.name.trim() || draft.name.length > 200)
    return "Give your program a name of up to 200 characters.";
  if (!Number.isInteger(draft.weeks) || draft.weeks < 1 || draft.weeks > 104)
    return "Enter a whole number of weeks, from 1 to 104.";
  if (!draft.days.length || draft.days.length > 31) return "Add 1–31 training days.";
  for (const day of draft.days) {
    if (!day.title.trim() || !day.exercises.length)
      return "Each day needs a name and at least one exercise.";
    for (const exercise of day.exercises) {
      if (exercise.tracking !== undefined && exercise.tracking !== "cardio")
        return "Choose a valid tracking type.";
      if (exercise.tracking === "cardio") {
        const invalid = cardioMetricsError(exercise.cardio);
        if (invalid) return "Enter a valid cardio duration or distance target.";
        if (exercise.weight != null && exercise.weight !== 0)
          return "Cardio does not use a strength load.";
      } else if (exercise.cardio !== undefined)
        return "Choose cardio tracking for these measurements.";
      if (!exercise.name.trim() || !exercise.reps.trim())
        return "Give every exercise a name and rep target.";
      if (exercise.name.length > 200 || exercise.reps.length > 100)
        return "Shorten the exercise name or rep target.";
      if (exercise.catalogue_id && !exerciseById(exercise.catalogue_id))
        return "Choose a catalogue exercise or clear its reference.";
      if (exercise.section && !["warmup", "main", "cooldown"].includes(exercise.section))
        return "Choose a valid training section.";
      if (exercise.group && exercise.group.length > 100)
        return "Use a shorter circuit or superset name.";
      if (exercise.equipment && exercise.equipment.length > 500)
        return "Use a shorter equipment note.";
      if (
        exercise.substitutions &&
        (exercise.substitutions.length > 20 ||
          exercise.substitutions.some((s) => !s.trim() || s.length > 200))
      )
        return "Use up to 20 named exercise alternatives.";
      if ((exercise.tempo?.length ?? 0) > 100 || (exercise.notes?.length ?? 0) > 10000)
        return "Shorten the exercise tempo or notes.";
      if (!Number.isInteger(exercise.sets) || exercise.sets < 1 || exercise.sets > 8)
        return "Use 1–8 sets per exercise.";
      if (
        exercise.weight != null &&
        (!Number.isFinite(exercise.weight) || exercise.weight < 0 || exercise.weight > 2000)
      )
        return "Weight must be 0 kg or more. Leave blank to use previous weights.";
      if (
        exercise.rest_seconds != null &&
        (!Number.isInteger(exercise.rest_seconds) ||
          exercise.rest_seconds < 0 ||
          exercise.rest_seconds > 3600)
      )
        return "Rest must be a whole number of seconds, 0 or more.";
      if (
        exercise.rpe != null &&
        (!Number.isInteger(exercise.rpe) || exercise.rpe < 1 || exercise.rpe > 10)
      )
        return "Effort must be an RPE from 1 to 10.";
    }
  }
  return null;
}
