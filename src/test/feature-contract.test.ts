import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: vi.fn() } } }));
import { createDemoFeatures } from "../lib/feature-api";
import { parseFeature } from "../lib/feature-types";
import {
  exercises,
  exerciseCategories,
  exerciseMuscles,
  programReferences,
  searchExercises,
} from "../lib/exercise-catalogue";

const alice = "11000000-0000-4000-8000-000000000001";
const bob = "11000000-0000-4000-8000-000000000002";
describe("research catalogue provenance", () => {
  it("retains every research row with stable distinct identities and honest content coverage", () => {
    expect(exercises.filter((e) => e.id.startsWith("exercise-"))).toHaveLength(778);
    expect(exercises.filter((e) => e.id.startsWith("kinra-exercise-"))).toHaveLength(30);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(808);
    expect(programReferences).toHaveLength(18);
    expect(
      exercises.every(
        (e) => e.coverage === "metadata" && e.instructions === null && e.media === null,
      ),
    ).toBe(true);
    expect(
      programReferences.every((p) => p.coverage === "reference-only" && p.author && p.sourceUrl),
    ).toBe(true);
    expect(exerciseCategories).toHaveLength(12);
    expect(exerciseMuscles.length).toBeGreaterThan(5);
  });
  it("searches aliases and accent-normalized names with actual metadata filters", () => {
    expect(searchExercises("squat").length).toBeGreaterThan(1);
    const first = exercises[0]!;
    expect(
      searchExercises(first.aliases[0]!, { category: first.category, muscle: first.muscles[0]! }),
    ).toContain(first);
    expect(searchExercises("", { category: "not-a-category" })).toEqual([]);
    expect(searchExercises("definitely not an exercise")).toEqual([]);
  });
});

describe("feature input boundaries", () => {
  it("preserves date-only measurement values and rejects incompatible units or impossible dates", () => {
    const payload = { type: "waist", value: 80, unit: "cm", date: "2026-10-19" } as const;
    expect(parseFeature("measurement", payload).date).toBe("2026-10-19");
    expect(() => parseFeature("measurement", { ...payload, unit: "kg" })).toThrow("unit");
    expect(() => parseFeature("measurement", { ...payload, date: "2026-02-30" })).toThrow();
    expect(() =>
      parseFeature("measurement", { ...payload, public_patient_data: "extra" }),
    ).toThrow();
  });
  it("validates schedules, timezone and safe source links", () => {
    expect(() =>
      parseFeature("supplement", {
        name: "Test",
        dose: 1,
        unit: "caps",
        times: ["08:00", "08:00"],
        frequency: "daily",
        start_date: "2026-10-19",
      }),
    ).toThrow("distinct");
    expect(() =>
      parseFeature("preferences", {
        language: "en",
        theme: "dark",
        modules: {},
        timezone: "Not/AZone",
      }),
    ).toThrow("timezone");
    expect(() =>
      parseFeature("expert", {
        name: "Test",
        headline: "Test",
        city: "Test",
        languages: [],
        specialties: [],
        website: "javascript:alert(1)",
      }),
    ).toThrow();
    expect(() =>
      parseFeature("article", {
        title: "Test",
        category: "Test",
        body: "  ",
        sources: [],
        updated_on: "2026-10-19",
      }),
    ).toThrow();
  });
});

describe("demo uses the same feature contracts", () => {
  it("retries prescribed meal completion once, replaces skipped state and isolates accounts", async () => {
    const add = vi.fn();
    const api = createDemoFeatures(alice, add, () => false);
    const other = createDemoFeatures(bob, vi.fn(), () => false);
    const plan = await api.save("nutrition_plan", {
      title: "Contract plan",
      meals: [
        { name: "Lunch", foods: [{ name: "Food", calories: 200, protein: 10, carbs: 30, fat: 4 }] },
      ],
    });
    await api.save("meal_event", {
      plan_id: plan,
      meal_index: 0,
      date: "2026-10-19",
      status: "skipped",
    });
    await Promise.all([
      api.consumeMeal(plan, 0, "2026-10-19"),
      api.consumeMeal(plan, 0, "2026-10-19"),
    ]);
    expect(add).toHaveBeenCalledTimes(1);
    expect((await api.list("meal_event")).filter((r) => r.payload.plan_id === plan)).toHaveLength(
      1,
    );
    expect((await other.list("nutrition_plan")).find((r) => r.id === plan)).toBeUndefined();
    await expect(other.consumeMeal(plan, 0, "2026-10-19")).rejects.toThrow();
    await expect(
      api.save(
        "cycle",
        { date: "2026-10-19", flow: "none", symptoms: [] },
        { visibility: "public" },
      ),
    ).rejects.toThrow("private");
  });
  it("records scheduled dose slots independently and preserves original dose snapshots on edits", async () => {
    const api = createDemoFeatures(alice, vi.fn(), () => false);
    const payload = {
      name: "Contract supplement",
      dose: 1,
      unit: "caps",
      times: ["08:00", "20:00"],
      frequency: "daily",
      start_date: "2026-10-19",
    } as const;
    const supplement = await api.save("supplement", { ...payload, times: [...payload.times] });
    const first = {
      supplement_id: supplement,
      date: "2026-10-19",
      time: "08:00",
      status: "taken",
    } as const;
    await api.save("dose", first);
    await api.save("dose", first);
    await api.save("dose", { ...first, time: "20:00" });
    await expect(api.save("dose", { ...first, time: "09:00" })).rejects.toThrow("schedule");
    await api.save("supplement", { ...payload, times: ["09:00"], dose: 2 }, { id: supplement });
    await api.save("dose", { ...first, status: "skipped" });
    const events = (await api.list("dose")).filter((r) => r.payload.supplement_id === supplement);
    expect(events).toHaveLength(2);
    expect(events[0]!.payload.dose_snapshot).toBe(1);
  });
});
