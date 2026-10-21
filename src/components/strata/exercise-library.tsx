import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { Bookmark, ChevronLeft, Dumbbell, Search, ExternalLink } from "lucide-react";
import {
  exercises,
  exerciseDisplayName,
  exerciseCategories,
  exerciseMuscles,
  searchExercises,
  exerciseEquipment,
  exerciseDifficulties,
  exerciseMovements,
  exerciseMechanics,
  exerciseLateralities,
  exercisePurposes,
} from "@/lib/exercise-catalogue";
import { useAct, useQ } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Empty } from "./ui";
import { Sheet } from "./sheets";
import { ExerciseGuide } from "./exercise-guide";
export { ProgramLibrary, ProgramLibrary as ProgramReferences } from "./program-library";
import { toast } from "sonner";

type Exercise = (typeof exercises)[number];
const filterLabels: Record<string, string> = {
  compound: "Compound movement",
  isolation: "Isolation movement",
  mobility: "Mobility",
  conditioning: "Conditioning",
  clinical: "Individual plan required",
  bilateral: "Both sides together",
  unilateral: "One side at a time",
  alternating: "Alternating sides",
  "not-applicable": "Not applicable",
  "individual-plan": "Individual plan required",
  "cool-down": "Cool-down",
  "warm-up": "Warm-up",
  strength: "Strength",
  recovery: "Recovery",
  power: "Power",
  stability: "Stability",
};
export function ExerciseLibrary({ onPick }: { onPick?: (exercise: Exercise) => void }) {
  useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [movement, setMovement] = useState("");
  const [mechanics, setMechanics] = useState("");
  const [laterality, setLaterality] = useState("");
  const [purpose, setPurpose] = useState("");
  const [limit, setLimit] = useState(30);
  const advancedFilters = [equipment, difficulty, movement, mechanics, laterality, purpose].filter(
    Boolean,
  );
  const activeFilters = [category, muscle, ...advancedFilters].filter(Boolean);
  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setMuscle("");
    setEquipment("");
    setDifficulty("");
    setMovement("");
    setMechanics("");
    setLaterality("");
    setPurpose("");
    setLimit(30);
  };
  const [selected, setSelected] = useState<Exercise | null>(null);
  const matches = useMemo(
    () =>
      searchExercises(query, {
        ...(category ? { category } : {}),
        ...(muscle ? { muscle } : {}),
        ...(equipment ? { equipment } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(movement ? { movement } : {}),
        ...(mechanics ? { mechanics } : {}),
        ...(laterality ? { laterality } : {}),
        ...(purpose ? { purpose } : {}),
      }),
    [query, category, muscle, equipment, difficulty, movement, mechanics, laterality, purpose],
  );
  const saved = useQ(["features", "saved"], (api) => api.features.list("saved"));
  const bookmark = useAct((api, entry: Exercise) =>
    api.features.save("saved", { target_type: "exercise", target_id: entry.id }),
  );
  const unsave = useAct((api, id: string) => api.features.remove(id));
  const selectedSaved = saved.data?.find(
    (r) => r.payload.target_type === "exercise" && r.payload.target_id === selected?.id,
  );
  return (
    <div className="space-y-4">
      <div className="rounded-card border border-volt/20 bg-volt/5 p-5">
        <p className="eyebrow text-volt">
          <Message source="Movement library" />
        </p>
        <h2 className="mt-2 font-display text-title-l font-bold">
          <Message source="Find your next move." />
        </h2>
        <p className="mt-3 text-label text-muted-foreground">
          <Message
            source="{p0} exercise references. Explore by movement, muscle or name."
            values={{ p0: exercises.length }}
          />
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
        <Input
          aria-label={tr("Search exercises")}
          placeholder={tr("Search exercises or aliases")}
          className="h-12 pl-10"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(30);
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-caption">
          <Message source="Category" />
          <select
            className="mt-1 h-12 w-full rounded-tile border border-border bg-surface px-2"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setLimit(30);
            }}
          >
            <option value="">
              <Message source="All categories" />
            </option>
            {exerciseCategories.map((c) => (
              <option key={c} value={c}>
                {tr(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-caption">
          <Message source="Target muscle" />
          <select
            className="mt-1 h-12 w-full rounded-tile border border-border bg-surface px-2"
            value={muscle}
            onChange={(e) => {
              setMuscle(e.target.value);
              setLimit(30);
            }}
          >
            <option value="">
              <Message source="All muscles" />
            </option>
            {exerciseMuscles.map((m) => (
              <option key={m} value={m}>
                {tr(m)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-caption text-muted-foreground">
        {tr("Muscle filters include primary and secondary muscles.")}
      </p>
      <details className="rounded-tile border border-border p-3">
        <summary className="cursor-pointer py-2 text-label font-semibold">
          {tr("More filters")}
          {advancedFilters.length > 0 ? ` (${advancedFilters.length})` : ""}
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            [
              ["Equipment", equipment, setEquipment, exerciseEquipment],
              ["Difficulty", difficulty, setDifficulty, exerciseDifficulties],
              ["Movement", movement, setMovement, exerciseMovements],
              ["Movement type", mechanics, setMechanics, exerciseMechanics],
              ["Sides", laterality, setLaterality, exerciseLateralities],
              ["Training purpose", purpose, setPurpose, exercisePurposes],
            ] as const
          ).map(([label, value, change, options]) => (
            <label key={label} className="min-w-0 text-caption">
              {tr(label)}
              <select
                className="mt-1 min-h-12 w-full min-w-0 rounded-tile border border-border bg-surface px-2"
                value={value}
                onChange={(e) => {
                  change(e.target.value);
                  setLimit(30);
                }}
              >
                <option value="">{tr("All")}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {tr(filterLabels[option] ?? option)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </details>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-muted-foreground" role="status">
          <Message source="{p0} exercises found" values={{ p0: matches.length }} />
        </p>
        {(query || activeFilters.length > 0) && (
          <Button variant="ghost" wrap className="min-h-11" onClick={resetFilters}>
            <Message source="Reset filters" />
          </Button>
        )}
      </div>
      {activeFilters.length > 0 && (
        <p className="rounded-tile bg-surface px-3 py-2 text-caption text-muted-foreground">
          {activeFilters.map((filter) => tr(filterLabels[filter] ?? filter)).join(" · ")}
        </p>
      )}
      <div className="space-y-2">
        {matches.slice(0, limit).map((exercise) => (
          <Panel
            key={exercise.id}
            onClick={() => setSelected(exercise)}
            className="flex items-center gap-3"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-tile bg-volt/10 text-volt">
              <Dumbbell className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-label font-semibold">{exerciseDisplayName(exercise)}</h3>
              <p className="mt-1 text-caption text-muted-foreground">
                {tr(exercise.category)} · {exercise.equipment.map((item) => tr(item)).join(", ")}
              </p>
              <p className="mt-2 text-caption">
                {exercise.primaryMuscles.length > 0
                  ? tr("Main target: {muscles}", {
                      muscles: exercise.primaryMuscles.map((m) => tr(m)).join(", "),
                    })
                  : tr("Muscle not documented")}
              </p>
            </div>
          </Panel>
        ))}
      </div>
      {!matches.length && (
        <Empty
          icon={<Search />}
          title={tr("No matching movements")}
          action={
            <Button variant="glass" onClick={resetFilters}>
              <Message source="Reset filters" />
            </Button>
          }
        />
      )}
      {matches.length > limit && (
        <Button
          variant="glass"
          wrap
          className="h-auto min-h-12 w-full py-3"
          onClick={() => setLimit((n) => n + 30)}
        >
          <Message source="Show 30 more" />
        </Button>
      )}
      {selected && (
        <Sheet
          open
          onOpenChange={(open) => !open && setSelected(null)}
          title={exerciseDisplayName(selected)}
          sub={tr(selected.category)}
        >
          <div className="space-y-5">
            {selected.aliases.length > 0 && (
              <p className="text-label text-muted-foreground">
                <Message
                  source="Also listed as {p0}"
                  values={{ p0: selected.aliases.join(", ") }}
                />
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-caption">
              {[...selected.equipment, selected.difficulty, selected.movement].map((tag) => (
                <span key={tag} className="rounded-full border border-border bg-surface px-3 py-2">
                  {tr(tag)}
                </span>
              ))}
            </div>
            <ExerciseGuide key={selected.id} entry={selected} onAlternative={setSelected} />
            <a
              className="flex min-h-11 items-center gap-2 text-label text-volt underline"
              href={selected.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Message source="View original reference" />
              <ExternalLink className="size-4" />
            </a>
            <p className="text-caption text-muted-foreground">
              <Message source="Source observed {p0}" values={{ p0: selected.observedDate }} />
            </p>
            <Button
              variant="glass"
              wrap
              className="h-auto min-h-12 w-full py-3"
              disabled={bookmark.isPending || unsave.isPending || saved.isLoading || !!saved.error}
              onClick={() => {
                const action = selectedSaved
                  ? unsave.mutateAsync(selectedSaved.id)
                  : bookmark.mutateAsync(selected);
                action
                  .then(() =>
                    toast.success(selectedSaved ? tr("Removed from saved") : tr("Exercise saved")),
                  )
                  .catch((e: Error) => toast.error(errorText(e.message)));
              }}
            >
              <Bookmark />
              {selectedSaved ? tr("Remove saved exercise") : tr("Save exercise")}
            </Button>
            {onPick && (
              <Button
                variant="volt"
                wrap
                className="h-auto min-h-12 w-full py-3"
                onClick={() => {
                  onPick(selected);
                  setSelected(null);
                }}
              >
                <Message source="Use this exercise" />
              </Button>
            )}
            <Button variant="ghost" className="h-11 w-full" onClick={() => setSelected(null)}>
              <ChevronLeft />
              <Message source="Back to library" />
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
