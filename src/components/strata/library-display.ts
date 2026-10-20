import { exercises, exerciseDisplayName, programReferences } from "@/lib/exercise-catalogue";
import { programTemplates, localizedTemplate } from "@/lib/program-templates";
import { currentLanguage, type Language } from "@/lib/i18n";
export type ProgramFilters = {
  goal: string;
  level: string;
  equipment: string;
  weeks: string;
  saved: boolean;
};
export function filterLibrary(
  type: "training" | "nutrition",
  query: string,
  filters: ProgramFilters,
  savedIds: readonly string[],
  language: Language = currentLanguage(),
) {
  return programTemplates
    .filter(
      (plan) =>
        plan.type === type &&
        (!filters.goal || plan.goal === filters.goal) &&
        (!filters.level || plan.level === filters.level) &&
        (!filters.equipment || plan.equipment.includes(filters.equipment)) &&
        (!filters.weeks || plan.weeks <= Number(filters.weeks)) &&
        (!filters.saved || savedIds.includes(plan.id)),
    )
    .map((plan) => localizedTemplate(plan, language))
    .filter((plan) =>
      `${plan.title} ${plan.summary} ${plan.goal} ${plan.level} ${plan.equipment.join(" ")}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    );
}
export function programFilterOptions(
  type: "training" | "nutrition",
  key: "goal" | "level" | "equipment",
  language: Language = currentLanguage(),
) {
  const options = new Map<string, string>();
  for (const plan of programTemplates.filter((plan) => plan.type === type)) {
    const localized = localizedTemplate(plan, language);
    if (key === "equipment")
      plan.equipment.forEach((value, index) =>
        options.set(value, localized.equipment[index] ?? value),
      );
    else options.set(plan[key], localized[key]);
  }
  return [...options].map(([value, label]) => ({ value, label }));
}
export function savedCatalogueItem(
  type: string,
  id: string,
  language: Language = currentLanguage(),
): { name: string; sourceUrl?: string } | undefined {
  if (type === "exercise") {
    const exercise = exercises.find((item) => item.id === id);
    return exercise
      ? { name: exerciseDisplayName(exercise, language), sourceUrl: exercise.sourceUrl }
      : undefined;
  }
  if (type !== "program") return undefined;
  const template = programTemplates.find((item) => item.id === id);
  if (template) return { name: localizedTemplate(template, language).title };
  const reference = programReferences.find((item) => item.id === id);
  return reference ? { name: reference.name, sourceUrl: reference.sourceUrl } : undefined;
}
