import { describe, it, expect } from "vitest";
import {
  filterLibrary,
  programFilterOptions,
  savedCatalogueItem,
} from "@/components/strata/library-display";
import { programTemplates, localizedTemplate } from "@/lib/program-templates";
import { exercises, exerciseDisplayName } from "@/lib/exercise-catalogue";
const empty = { goal: "", level: "", equipment: "", weeks: "", saved: false };
describe("localized library filters and bookmarks", () => {
  it.each(["en", "bs", "de"] as const)("keeps canonical filter identities in %s", (language) => {
    const plan = programTemplates.find((item) => item.type === "training")!;
    const result = filterLibrary(
      "training",
      "",
      { ...empty, goal: plan.goal, level: plan.level, equipment: plan.equipment[0]!, saved: true },
      [plan.id],
      language,
    );
    expect(result.map((item) => item.id)).toEqual([plan.id]);
    expect(
      programFilterOptions("training", "goal", language).find((item) => item.value === plan.goal)
        ?.label,
    ).toBe(localizedTemplate(plan, language).goal);
    expect(
      filterLibrary("training", localizedTemplate(plan, language).title, empty, [], language).some(
        (item) => item.id === plan.id,
      ),
    ).toBe(true);
    expect(savedCatalogueItem("program", plan.id, language)?.name).toBe(
      localizedTemplate(plan, language).title,
    );
    expect(savedCatalogueItem("exercise", exercises[0]!.id, language)?.name).toBe(
      exerciseDisplayName(exercises[0]!, language),
    );
  });
  it("does not fabricate a title for an unavailable bookmark", () =>
    expect(savedCatalogueItem("program", "missing")).toBeUndefined());
});
