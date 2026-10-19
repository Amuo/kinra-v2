import { lazy, Suspense, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useQ } from "@/lib/api";
import { Panel, SectionTitle } from "./ui";
import { Sheet } from "./sheets";
import { moduleVisible, useFeaturePreferences } from "./feature-preferences";
import type { FeatureKind } from "@/lib/feature-types";
const FeatureWorkspace = lazy(() =>
  import("./feature-hub").then((m) => ({ default: m.FeatureWorkspace })),
);
export function TodayRoutines() {
  const preferences = useFeaturePreferences();
  const query = useQ(["features", "today-routines"], async (api) => {
    const [meals, supplements, habits] = await Promise.all([
      api.features.list("nutrition_plan"),
      api.features.list("supplement"),
      api.features.list("habit"),
    ]);
    return { meals, supplements, habits };
  });
  const [selected, setSelected] = useState<FeatureKind | null>(null);
  if (!query.data) return null;
  const routines = [
    {
      kind: "nutrition_plan" as const,
      title: "Your meal plans",
      description: `${query.data.meals.length} plans ready to review`,
      count: query.data.meals.length,
    },
    {
      kind: "supplement" as const,
      title: "Supplement schedule",
      description: `${query.data.supplements.length} schedules · record today's doses`,
      count: query.data.supplements.length,
    },
    {
      kind: "habit" as const,
      title: "Your habits",
      description: `${query.data.habits.length} habits · one step at a time`,
      count: query.data.habits.length,
    },
  ].filter((r) => r.count > 0 && moduleVisible(r.kind, preferences?.modules));
  if (!routines.length) return null;
  return (
    <section>
      <SectionTitle>Your daily routine</SectionTitle>
      <div className="space-y-2">
        {routines.map((routine) => (
          <Panel
            key={routine.kind}
            onClick={() => setSelected(routine.kind)}
            className="flex items-center justify-between gap-3"
          >
            <div>
              <h3 className="text-label font-semibold">{routine.title}</h3>
              <p className="mt-1 text-caption text-muted-foreground">{routine.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0" />
          </Panel>
        ))}
      </div>
      {selected && (
        <Sheet open onOpenChange={(open) => !open && setSelected(null)} title="Your routine">
          <Suspense fallback={<p role="status">Loading…</p>}>
            <FeatureWorkspace compact kind={selected} />
          </Suspense>
        </Sheet>
      )}
    </section>
  );
}
