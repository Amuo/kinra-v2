import { exercises, exerciseDisplayName } from "./exercise-catalogue";

export const bodyMuscleLabels = {
  chest: "Prsa",
  shoulders: "Ramena",
  biceps: "Bicepsi",
  triceps: "Tricepsi",
  forearms: "Podlaktice",
  abs: "Trbuh",
  quads: "Kvadricepsi",
  back: "Leđa",
  lats: "Širi leđni",
  traps: "Trapezi",
  erectors: "Donja leđa (erektori)",
  glutes: "Gluteusi",
  hamstrings: "Zadnja loža",
  calves: "Listovi",
  adductors: "Aduktori kuka",
  abductors: "Abduktori kuka",
  shins: "Prednji tibijalis",
} as const;
export type BodyMuscle = keyof typeof bodyMuscleLabels;
const muscleKeys = new Map<string, BodyMuscle>(
  Object.entries(bodyMuscleLabels).map(([key, label]) => [label, key as BodyMuscle]),
);
const normalize = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const names = new Map<string, (typeof exercises)[number][]>();
for (const exercise of exercises) {
  const labels = new Set([
    exercise.name,
    ...exercise.aliases,
    ...(["en", "bs", "de"] as const).map((language) => exerciseDisplayName(exercise, language)),
  ]);
  for (const label of labels) {
    const key = normalize(label);
    const entries = names.get(key) ?? [];
    if (!entries.includes(exercise)) entries.push(exercise);
    names.set(key, entries);
  }
}
const mapped = (labels: string[]) =>
  labels.flatMap((label) => {
    const key = muscleKeys.get(label);
    return key ? [key] : [];
  });

/** Exact catalogue names/aliases only. Stabilizers and unrecognized custom labels are not inferred. */
export function sessionMuscles(exerciseNames: string[]) {
  const primary = new Set<BodyMuscle>();
  const secondary = new Set<BodyMuscle>();
  const unmatched: string[] = [];
  for (const name of new Set(exerciseNames)) {
    const matches = names.get(normalize(name));
    // A shared alias with differing muscle roles cannot identify the exercise reliably.
    const signatures = new Set(
      matches?.map((entry) =>
        JSON.stringify([[...entry.primaryMuscles].sort(), [...entry.secondaryMuscles].sort()]),
      ),
    );
    if (!matches?.length || signatures.size !== 1) {
      unmatched.push(name);
      continue;
    }
    const entry = matches[0]!;
    mapped(entry.primaryMuscles).forEach((muscle) => primary.add(muscle));
    mapped(entry.secondaryMuscles).forEach((muscle) => secondary.add(muscle));
  }
  primary.forEach((muscle) => secondary.delete(muscle));
  return { primary, secondary, unmatched };
}
