import { describe, it, expect } from "vitest";
import { localizedProgram, localizedNutritionRecord } from "../lib/template-display";
import { templateLocales } from "../lib/program-templates";
import type { Program } from "../lib/types";
import type { FeatureRecord } from "../lib/feature-types";
describe("saved template display languages", () => {
  it("projects every source language into every display language without changing stored plans", () => {
    for (const entry of templateLocales.filter((item) => item.en.type === "training"))
      for (const from of ["en", "bs", "de"] as const)
        for (const to of ["en", "bs", "de"] as const) {
          const source = entry[from],
            target = entry[to];
          const raw: Program = {
            id: crypto.randomUUID(),
            trainer_id: crypto.randomUUID(),
            template_source: { id: source.id, version: 1 },
            name: source.title,
            description: [source.summary, source.progression, source.considerations].join("\n\n"),
            weeks: source.weeks,
            days: structuredClone(source.days),
          };
          const before = structuredClone(raw),
            view = localizedProgram(raw, to);
          expect(view.name).toBe(target.title);
          expect(view.description).toBe(
            [target.summary, target.progression, target.considerations].join("\n\n"),
          );
          expect(localizedProgram({ ...raw, description: source.summary }, to).description).toBe(
            target.summary,
          );
          expect(view.days).toEqual(target.days);
          expect(raw).toEqual(before);
        }
  });
  it("preserves author edits, reordered/deleted exercises, numeric changes and unknown versions", () => {
    const entry = templateLocales.find((item) => item.en.type === "training")!;
    const raw: Program = {
      id: crypto.randomUUID(),
      trainer_id: crypto.randomUUID(),
      template_source: { id: entry.en.id, version: 1 },
      name: "My edited plan",
      description: null,
      weeks: 12,
      days: structuredClone(entry.en.days),
    };
    raw.days[0]!.title = "My custom day";
    raw.days[0]!.exercises.reverse();
    raw.days[0]!.exercises.pop();
    raw.days[0]!.exercises[0]!.notes = "My own note";
    raw.days[0]!.exercises[0]!.weight = 17;
    const before = structuredClone(raw),
      view = localizedProgram(raw, "de");
    expect(view.name).toBe(raw.name);
    expect(view.weeks).toBe(12);
    expect(view.days[0]!.title).toBe("My custom day");
    expect(view.days[0]!.exercises[0]!.notes).toBe("My own note");
    expect(view.days[0]!.exercises[0]!.weight).toBe(17);
    expect(raw).toEqual(before);
    expect(
      localizedProgram({ ...raw, template_source: { id: entry.en.id, version: 99 } }, "de").days,
    ).toBe(raw.days);
    const { template_source: _origin, ...custom } = raw;
    expect(localizedProgram(custom, "bs")).toBe(custom);
  });
  it("localizes nutrition labels while preserving portions/macros, edited notes and raw meal-event snapshots", () => {
    for (const entry of templateLocales.filter((item) => item.en.type === "nutrition")) {
      const record: FeatureRecord<"nutrition_plan"> = {
        id: crypto.randomUUID(),
        owner_id: crypto.randomUUID(),
        kind: "nutrition_plan",
        visibility: "private",
        client_id: null,
        created_at: "2026-10-19T12:00:00Z",
        updated_at: "2026-10-19T12:00:00Z",
        template_source: { id: entry.en.id, version: 1 },
        payload: structuredClone(entry.en.nutrition!),
      };
      const before = structuredClone(record);
      expect(localizedNutritionRecord(record, "bs").payload).toEqual(entry.bs.nutrition);
      record.payload.notes = "Personal note";
      record.payload.meals[0]!.foods[0]!.quantity = "My portion";
      record.payload.meals[0]!.foods[0]!.calories = 123;
      const view = localizedNutritionRecord(record, "de");
      expect(view.payload.notes).toBe("Personal note");
      expect(view.payload.meals[0]!.foods[0]!.quantity).toBe("My portion");
      expect(view.payload.meals[0]!.foods[0]!.calories).toBe(123);
      expect(before.payload).toEqual(entry.en.nutrition);
    }
  });
});
