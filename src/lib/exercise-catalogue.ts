import exerciseData from "../data/exercises.json";
import programData from "../data/program-references.json";
import displayNames from "../data/exercise-display-names.json";
import { currentLanguage, type Language } from "./i18n";

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
const localizedNames = displayNames as Record<string, Record<Language, string>>;
export const exerciseDisplayName = (entry: ExerciseCatalogueEntry, language = currentLanguage()) =>
  localizedNames[entry.id]?.[language] ?? entry.name;
/** Authored/custom program labels keep their exact text. Only recognized catalogue labels follow the UI locale. */
export function programExerciseName(entry: { name: string; catalogue_id?: string | undefined }) {
  const source = exercises.find((e) => e.id === entry.catalogue_id);
  if (
    !source ||
    ![source.name, ...Object.values(localizedNames[source.id] ?? {})].includes(entry.name)
  )
    return entry.name;
  return exerciseDisplayName(source);
}
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/đ/g, "dj");
const index = exercises.map((exercise) => ({
  exercise,
  text: normalize(
    [
      exercise.name,
      ...exercise.aliases,
      ...Object.values(localizedNames[exercise.id] ?? {}),
      exercise.category,
      ...exercise.muscles,
    ].join(" "),
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
