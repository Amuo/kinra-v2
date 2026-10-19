import exerciseData from "../data/exercises.json";
import programData from "../data/program-references.json";

export interface ExerciseCatalogueEntry {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  muscles: string[];
  sourceUrl: string;
  observedDate: string;
  coverage: "metadata";
  instructions: null;
  media: null;
}
export interface ProgramReference {
  id: string;
  name: string;
  classification: string;
  author: string;
  equipment: string[];
  sourceUrl: string;
  observedDate: string;
  coverage: "reference-only";
  observedItemCount: number;
}
export const exercises = exerciseData as ExerciseCatalogueEntry[];
export const programReferences = programData as ProgramReference[];
export const exerciseCategories = [...new Set(exercises.map((e) => e.category))].sort();
export const exerciseMuscles = [...new Set(exercises.flatMap((e) => e.muscles))].sort();
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/đ/g, "dj");
const index = exercises.map((exercise) => ({
  exercise,
  text: normalize(
    [exercise.name, ...exercise.aliases, exercise.category, ...exercise.muscles].join(" "),
  ),
}));
export function searchExercises(
  query: string,
  filters: { category?: string; muscle?: string } = {},
): ExerciseCatalogueEntry[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return index
    .filter(
      ({ exercise: e, text }) =>
        (!filters.category || e.category === filters.category) &&
        (!filters.muscle || e.muscles.includes(filters.muscle)) &&
        terms.every((term) => text.includes(term)),
    )
    .map(({ exercise }) => exercise);
}
export const exerciseById = (id: string) => exercises.find((e) => e.id === id);
