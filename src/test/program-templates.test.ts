import { describe, expect, it } from "vitest";
import { exerciseById } from "../lib/exercise-catalogue";
import { featureSchemas } from "../lib/feature-types";
import { languages, setLanguage } from "../lib/i18n";
import recoveryTemplates from "../data/recovery-program-templates.json";
import { programError } from "../lib/programs";
import {
  localizedTemplate,
  programTemplates,
  templateFoodReferences,
  templateLocales,
} from "../lib/program-templates";

describe("original Kinra program examples", () => {
  it("retains 18 training routines and adds eight gentle movement examples beside four nutrition examples", () => {
    expect(programTemplates.filter((p) => p.type === "training")).toHaveLength(26);
    expect(programTemplates.filter((p) => p.type === "nutrition")).toHaveLength(4);
    expect(new Set(programTemplates.map((p) => p.id)).size).toBe(programTemplates.length);
    const training = programTemplates.filter((p) => p.type === "training");
    expect(new Set(training.map((p) => JSON.stringify(p.days))).size).toBe(training.length);
    for (const template of training) {
      expect(template.sessionsPerWeek).toBe(template.days.length);
      expect(template.days.length).toBeGreaterThanOrEqual(
        recoveryTemplates.some((p) => p.en.id === template.id) ? 1 : 2,
      );
      expect(template.progression.length).toBeGreaterThan(80);
      for (const day of template.days) {
        expect(day.exercises.length).toBeGreaterThanOrEqual(4);
        for (const exercise of day.exercises) {
          const catalogue = exerciseById(exercise.catalogue_id!);
          expect(catalogue?.name).toBe(exercise.name);
          expect(exercise.rest_seconds).toBeGreaterThan(0);
          expect(exercise.rpe).toBeGreaterThan(0);
          expect(exercise.notes?.length).toBeGreaterThan(30);
          // The live set engine parses reps. Timed prescriptions must not masquerade as reps.
          expect(exercise.reps).toMatch(/^\d+(?:–\d+)?$/);
          expect(exercise.reps).not.toMatch(/sec|min/i);
        }
      }
    }
  });

  it("validates localized routines without changing catalogue identity", () => {
    for (const entry of templateLocales) {
      for (const language of languages) {
        const template = localizedTemplate(entry.en, language);
        expect(template).toEqual(entry[language]);
        for (const field of [
          "title",
          "summary",
          "goal",
          "level",
          "progression",
          "considerations",
        ] as const) {
          expect(template[field].trim()).not.toBe("");
          if (language !== "en") expect(template[field]).not.toBe(entry.en[field]);
        }
        expect(template.sources.length).toBeGreaterThan(0);
        expect(template.author).toBe("Kinra");
        for (const source of template.sources) {
          expect(source.url).toMatch(/^https:\/\//);
          expect(source.observedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
        if (template.type === "training") {
          expect(
            programError({
              name: template.title,
              description: template.summary,
              weeks: template.weeks,
              days: template.days,
            }),
          ).toBeNull();
          template.days.forEach((day, dayIndex) => {
            expect(day.title.trim()).not.toBe("");
            if (language !== "en") expect(day.title).not.toBe(entry.en.days[dayIndex]!.title);
            day.exercises.forEach((exercise, exerciseIndex) => {
              const original = entry.en.days[dayIndex]!.exercises[exerciseIndex]!;
              expect(exercise.catalogue_id).toBe(original.catalogue_id);
              expect(exercise.name).toBe(original.name);
              if (language !== "en") expect(exercise.notes).not.toBe(original.notes);
            });
          });
        }
      }
    }
  });

  it("returns isolated copies and follows the selected language by default", () => {
    const original = programTemplates[0]!;
    setLanguage("de", false);
    const copy = localizedTemplate(original);
    expect(copy.title).toBe(templateLocales[0]!.de.title);
    copy.days[0]!.exercises[0]!.sets = 8;
    expect(original.days[0]!.exercises[0]!.sets).not.toBe(8);
    setLanguage("en", false);
  });

  it("derives every food macro from an explicit USDA ingredient quantity", () => {
    for (const template of programTemplates.filter((p) => p.type === "nutrition")) {
      expect(template.nutrition?.calories_target).toBeUndefined();
      expect(template.nutrition?.protein_target).toBeUndefined();
      const foods = template.nutrition!.meals.flatMap((meal) => meal.foods);
      expect(template.ingredients).toHaveLength(foods.length);
      for (const ingredient of template.ingredients!) {
        const reference = templateFoodReferences.find((r) => r.fdcId === ingredient.fdcId)!;
        expect(reference).toBeDefined();
        expect(reference.dataset).toContain("USDA FoodData Central SR Legacy, April 2018");
        expect(ingredient.grams).toBeGreaterThan(0);
        const food = template.nutrition!.meals[ingredient.meal]!.foods[ingredient.food]!;
        expect(food.quantity).toContain(String(ingredient.grams));
        for (const key of ["calories", "protein", "carbs", "fat"] as const) {
          expect(Number.isFinite(reference.per100g[key])).toBe(true);
          const calculated = (reference.per100g[key] * ingredient.grams) / 100;
          expect(food[key]).toBe(
            key === "calories" ? Math.round(calculated) : Math.round(calculated * 10) / 10,
          );
        }
      }
      for (const language of languages) {
        const localized = localizedTemplate(template, language);
        expect(featureSchemas.nutrition_plan.safeParse(localized.nutrition).success).toBe(true);
        expect(localized.nutrition!.meals).toHaveLength(4);
        expect(localized.nutrition!.notes).toBe(localized.considerations);
      }
    }
  });
});
