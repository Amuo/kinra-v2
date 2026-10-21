import templateData from "../data/program-templates.json";
import recoveryData from "../data/recovery-program-templates.json";
import foodData from "../data/template-food-references.json";
import type { FeaturePayloads } from "./feature-types";
import { currentLanguage, type Language } from "./i18n";
import type { ProgramDay } from "./types";

export interface ProgramTemplate {
  id: string;
  type: "training" | "nutrition";
  title: string;
  summary: string;
  goal: string;
  level: string;
  equipment: string[];
  weeks: number;
  days: ProgramDay[];
  nutrition?: FeaturePayloads["nutrition_plan"];
  sessionsPerWeek: number;
  minutes: number;
  author: string;
  progression: string;
  considerations: string;
  sources: { title: string; url: string; observedDate: string }[];
  /** Quantities used to derive nutrition estimates, indexed by meal and food. */
  ingredients?: { meal: number; food: number; fdcId: string; grams: number }[];
}

export interface TemplateFoodReference {
  fdcId: string;
  description: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
  url: string;
  dataset: string;
  observedDate: string;
}

/** Original Kinra examples. Archived competitor references remain reference-only. */
export const templateLocales = [...templateData, ...recoveryData] as Record<
  Language,
  ProgramTemplate
>[];
export const programTemplates: ProgramTemplate[] = templateLocales.map((item) => item.en);
export const templateFoodReferences = foodData as TemplateFoodReference[];

/** Return a fresh editable copy while keeping stable catalogue IDs and original labels. */
export function localizedTemplate(
  template: ProgramTemplate,
  language = currentLanguage(),
): ProgramTemplate {
  const entry = templateLocales.find((item) => item.en.id === template.id);
  return structuredClone(entry?.[language] ?? template);
}
