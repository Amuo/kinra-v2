import { describe, expect, it } from "vitest";
import {
  exercises,
  exerciseById,
  exerciseDisplayName,
  exerciseGuide,
  searchExercises,
  exerciseMechanics,
  exerciseLateralities,
  exercisePurposes,
} from "../lib/exercise-catalogue";
import { reviewedTechniqueGroups } from "../lib/exercise-reviewed-guides";
import { localizedTemplate, programTemplates } from "../lib/program-templates";
import { programError } from "../lib/programs";
import decisions from "../../docs/exercise-heading-decisions.json";
import additions from "../data/exercise-additions.json";
import recovery from "../data/recovery-program-templates.json";
const original = (number: number) =>
  exercises.find((e) => e.id.startsWith(`exercise-${String(number).padStart(4, "0")}-`))!;
describe("reviewed documentation integration", () => {
  it("resolves all 52 headings explicitly, retaining identities for synonyms and grouping the flat-dumbbell duplicate", () => {
    expect(decisions).toHaveLength(52);
    expect(
      decisions
        .filter((d) => d.decision === "excluded")
        .map((d) => d.heading)
        .sort(),
    ).toEqual(["Guillotine Press", "Hammer Strength Chest Press", "Machine Chest Press"].sort());
    expect(decisions.filter((d) => d.decision === "alias")).toHaveLength(18);
    expect(decisions.filter((d) => d.decision === "new variation")).toHaveLength(31);
    expect(additions).toHaveLength(30);
    expect(new Set(additions.map((e) => e.name.toLowerCase())).size).toBe(30);
    for (const d of decisions) {
      expect(d.reason.length).toBeGreaterThan(30);
      if (d.targetId) {
        expect(exerciseById(d.targetId)).toBeDefined();
        expect(searchExercises(d.heading)).toContain(exerciseById(d.targetId));
      } else expect(d.decision).toBe("excluded");
    }
    const headings = ["Dumbbell Bench Press", "FLAT DUMBBELL PRESS"];
    expect(
      new Set(decisions.filter((d) => headings.includes(d.heading)).map((d) => d.targetId)).size,
    ).toBe(1);
    expect(
      searchExercises("Barbell Bench Press").filter((e) => e.id === original(60).id),
    ).toHaveLength(1);
  });
  it("filters reviewed targets while excluding stabilizer-only muscles and nonspecific protocol targets", () => {
    const chest = searchExercises("", { muscle: "Prsa" });
    expect(chest).toContain(original(60));
    expect(chest).toContain(exerciseById("kinra-exercise-flat-dumbbell-bench-press"));
    expect(chest).toContain(original(715));
    expect(chest).not.toContain(original(3));
    expect(searchExercises("", { muscle: "Trbuh" })).toContain(original(3));
    expect(searchExercises("", { muscle: "Trbuh" })).toContain(original(714));
    expect(original(75).primaryMuscles).toContain("Gluteusi");
    expect(original(81).primaryMuscles).toContain("Kvadricepsi");
    expect(original(17).muscles).toEqual([]);
    const stabilizerExample = exercises.find((e) => e.stabilizerMuscles.length > 0)!;
    expect(searchExercises("", { muscle: stabilizerExample.stabilizerMuscles[0]! })).not.toContain(
      stabilizerExample,
    );
    for (const e of exercises) {
      expect(e.muscles).toEqual([...new Set([...e.primaryMuscles, ...e.secondaryMuscles])]);
      expect(e.stabilizerMuscles.some((m) => e.muscles.includes(m))).toBe(false);
    }
  });
  it("intersects useful mechanics, laterality and purpose filters", () => {
    expect(exerciseMechanics).toContain("isolation");
    expect(exerciseLateralities).toContain("unilateral");
    expect(exercisePurposes).toContain("recovery");
    expect(original(60).mechanics).toBe("compound");
    expect(original(392).mechanics).toBe("isolation");
    const result = searchExercises("", {
      muscle: "Prsa",
      mechanics: "compound",
      laterality: "unilateral",
      purpose: "strength",
    });
    expect(result).toContain(exerciseById("kinra-exercise-single-arm-dumbbell-bench-press"));
    expect(result).not.toContain(original(60));
    for (const e of result) {
      expect(e.primaryMuscles).toContain("Prsa");
      expect(e.laterality).toBe("unilateral");
    }
  });
  it("corrects source isolation/compound conflicts without recategorizing bodyweight or functional collections", () => {
    const cablePress = exerciseById("kinra-exercise-single-arm-cable-chest-press")!;
    expect(cablePress.category).toBe("Složene");
    expect(original(676).category).toBe("Složene");
    expect(original(114).category).toBe("Složene");
    expect(searchExercises("", { category: "Izolacijske", mechanics: "compound" })).toEqual([]);
    expect(
      searchExercises("", {
        category: "Složene",
        muscle: "Prsa",
        mechanics: "compound",
        laterality: "unilateral",
        purpose: "strength",
      }),
    ).toContain(cablePress);
    expect(original(392).category).toBe("Izolacijske");
    expect(original(638).category).toBe("Izolacijske");
    expect(original(638).mechanics).toBe("isolation");
    expect(original(74).category).toBe("Funkcionalne");
    expect(original(1).category).toBe("Pliometrijske");
  });
  it("ships distinct original localized variation guides and corrects the reversed hip rotation description", () => {
    for (const e of additions) {
      const entry = exerciseById(e.id)!;
      for (const language of ["en", "bs", "de"] as const) {
        expect(exerciseDisplayName(entry, language)).toBe(e.displayNames[language]);
        const guide = exerciseGuide(entry, language);
        expect(guide.steps[0]).toBe(e.variantInstruction[{ en: 0, bs: 1, de: 2 }[language]]);
        expect(guide.steps).toHaveLength(3);
        expect(guide.isClinical).toBe(false);
        expect(guide.mediaKind).toBe("illustration");
      }
    }
    expect(
      new Set(additions.map((e) => exerciseGuide(exerciseById(e.id)!, "en").steps[0])).size,
    ).toBe(30);
    expect(exerciseGuide(original(305), "en").steps[0]).toContain(
      "front hip in external rotation and the rear hip in internal rotation",
    );
    expect(
      exerciseGuide(exerciseById("kinra-exercise-dumbbell-floor-press")!, "en").steps[0],
    ).toContain("upper arms touch down softly");
    expect(exerciseGuide(exerciseById("kinra-exercise-push-jerk")!, "en").steps[0]).toContain(
      "receive the bar overhead",
    );
    expect(exerciseById("kinra-exercise-pause-back-squat")!.guideFamily).toBe("squat");
    for (const group of reviewedTechniqueGroups)
      for (const number of group.numbers) {
        const entry = original(number);
        expect(entry).toBeDefined();
        expect(entry.isClinical).toBe(false);
        for (const language of ["en", "bs", "de"] as const)
          expect(exerciseGuide(entry, language).setup).toContain(
            group.text[{ en: 0, bs: 1, de: 2 }[language]],
          );
      }
  });
  it("copies eight localized editable movement routines with genuine counts and no clinical or timed-rep substitution", () => {
    expect(recovery).toHaveLength(8);
    for (const row of recovery) {
      const template = programTemplates.find((p) => p.id === row.en.id)!;
      for (const language of ["en", "bs", "de"] as const) {
        const copy = localizedTemplate(template, language);
        expect(
          programError({
            name: copy.title,
            description: copy.summary,
            weeks: copy.weeks,
            days: copy.days,
          }),
        ).toBeNull();
        expect(copy).toEqual(row[language]);
        for (const exercise of copy.days.flatMap((day) => day.exercises)) {
          expect(exercise.reps).toMatch(/^\d+(?:–\d+)?$/);
          expect(exerciseById(exercise.catalogue_id!)!.isClinical).toBe(false);
          expect(exercise.notes!.length).toBeGreaterThan(80);
        }
        copy.days[0]!.exercises[0]!.sets = 9;
        expect(template.days[0]!.exercises[0]!.sets).toBe(1);
      }
    }
  });
});
