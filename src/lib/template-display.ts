import { templateLocales } from "./program-templates";
import { currentLanguage, languages, type Language } from "./i18n";
import type { Program } from "./types";
import type { FeatureRecord } from "./feature-types";
import type { TemplateSource } from "./template-origins";

// Version 1 is the published original content. Future revisions must retain its
// locale snapshots; unknown versions deliberately display their stored content.
function dictionary(source: TemplateSource | undefined, language: Language) {
  if (source?.version !== 1) return null;
  const entry = templateLocales.find((item) => item.en.id === source.id);
  if (!entry) return null;
  const fields = new Map<string, Map<string, Set<string>>>();
  function add(key: string, from: unknown, to: unknown) {
    if (typeof from !== "string" || typeof to !== "string") return;
    const values = fields.get(key) ?? new Map<string, Set<string>>();
    const targets = values.get(from) ?? new Set<string>();
    targets.add(to);
    values.set(from, targets);
    fields.set(key, values);
  }
  for (const locale of languages) {
    const original = entry[locale],
      target = entry[language];
    add("name", original.title, target.title);
    add("description", original.summary, target.summary);
    add(
      "description",
      [original.summary, original.progression, original.considerations].join("\n\n"),
      [target.summary, target.progression, target.considerations].join("\n\n"),
    );
    original.days.forEach((day, i) => {
      const translated = target.days[i];
      if (!translated) return;
      add("day", day.title, translated.title);
      day.exercises.forEach((exercise, j) => {
        const to = translated.exercises[j];
        if (!to) return;
        for (const key of ["name", "notes", "equipment", "group", "tempo"] as const)
          add(`exercise:${exercise.catalogue_id}:${key}`, exercise[key], to[key]);
      });
    });
    if (original.nutrition && target.nutrition) {
      add("nutrition:title", original.nutrition.title, target.nutrition.title);
      add("nutrition:notes", original.nutrition.notes, target.nutrition.notes);
      original.nutrition.meals.forEach((meal, i) => {
        const to = target.nutrition?.meals[i];
        if (!to) return;
        add("meal:name", meal.name, to.name);
        meal.foods.forEach((food, j) => {
          const translated = to.foods[j];
          if (!translated) return;
          for (const key of ["name", "quantity"] as const)
            add(`food:${key}`, food[key], translated[key]);
        });
      });
    }
  }
  return (key: string, value: string | undefined | null) => {
    if (value == null) return value;
    const targets = fields.get(key)?.get(value);
    return targets?.size === 1 ? [...targets][0]! : value;
  };
}
/** Display only: preserve all edited strings, numeric values, IDs and stored history. */
export function localizedProgram(program: Program, language = currentLanguage()): Program {
  const translate = dictionary(program.template_source, language);
  if (!translate) return program;
  return {
    ...program,
    name: translate("name", program.name)!,
    description: translate("description", program.description) ?? null,
    days: program.days.map((day) => ({
      ...day,
      title: translate("day", day.title)!,
      exercises: day.exercises.map((exercise) => {
        const result = { ...exercise };
        for (const key of ["name", "notes", "equipment", "group", "tempo"] as const) {
          const value = translate(`exercise:${exercise.catalogue_id}:${key}`, exercise[key]);
          if (value !== undefined && value !== null) result[key] = value;
        }
        return result;
      }),
    })),
  };
}
export function localizedNutritionRecord(
  record: FeatureRecord<"nutrition_plan">,
  language = currentLanguage(),
): FeatureRecord<"nutrition_plan"> {
  const translate = dictionary(record.template_source, language);
  if (!translate) return record;
  const p = record.payload;
  return {
    ...record,
    payload: {
      ...p,
      title: translate("nutrition:title", p.title)!,
      ...(p.notes !== undefined ? { notes: translate("nutrition:notes", p.notes)! } : {}),
      meals: p.meals.map((meal) => ({
        ...meal,
        name: translate("meal:name", meal.name)!,
        foods: meal.foods.map((food) => ({
          ...food,
          name: translate("food:name", food.name)!,
          ...(food.quantity !== undefined
            ? { quantity: translate("food:quantity", food.quantity)! }
            : {}),
        })),
      })),
    },
  };
}
