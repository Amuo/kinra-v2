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
  programReferences,
} from "@/lib/exercise-catalogue";
import { useAct, useQ } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Empty } from "./ui";
import { Sheet } from "./sheets";
import { toast } from "sonner";

type Exercise = (typeof exercises)[number];
export function ExerciseLibrary({ onPick }: { onPick?: (exercise: Exercise) => void }) {
  useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [muscle, setMuscle] = useState("");
  const [limit, setLimit] = useState(30);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const matches = useMemo(
    () =>
      searchExercises(query, { ...(category ? { category } : {}), ...(muscle ? { muscle } : {}) }),
    [query, category, muscle],
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
            source="{p0}exercise references. Explore by movement, muscle or name."
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
      <div className="grid grid-cols-2 gap-2">
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
          <Message source="Muscle" />
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
      <p className="text-caption text-muted-foreground" role="status">
        <Message source="{p0}exercises found" values={{ p0: matches.length }} />
      </p>
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
                {tr(exercise.category)} ·{" "}
                {exercise.muscles.map((m) => tr(m)).join(", ") || tr("Muscle not documented")}
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
            <Button
              variant="glass"
              onClick={() => {
                setQuery("");
                setCategory("");
                setMuscle("");
              }}
            >
              <Message source="Reset filters" />
            </Button>
          }
        />
      )}
      {matches.length > limit && (
        <Button variant="glass" className="h-12 w-full" onClick={() => setLimit((n) => n + 30)}>
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
            <p className="text-body">
              {selected.muscles.join(" · ") || tr("Muscle metadata unavailable")}
            </p>
            {selected.aliases.length > 0 && (
              <p className="text-label text-muted-foreground">
                <Message
                  source="Also listed as {p0}"
                  values={{ p0: selected.aliases.join(", ") }}
                />
              </p>
            )}
            <div className="rounded-tile bg-surface p-4 text-label text-muted-foreground">
              <Message source="This archive contains exercise metadata. Instructions, demonstrations and technique guidance were not included." />
            </div>
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
              className="h-12 w-full"
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
                className="h-12 w-full"
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

export function ProgramReferences() {
  useLanguage();
  const [query, setQuery] = useState("");
  const matches = programReferences.filter((p) =>
    `${p.name} ${p.classification} ${p.author} ${p.equipment.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-3">
      <div className="rounded-tile bg-surface p-4">
        <h3 className="text-title font-semibold">
          <Message source="Program inspiration" />
        </h3>
        <p className="mt-2 text-label text-muted-foreground">
          <Message
            source="{p0}archived listings. These are references; authored routines are unavailable and cannot be imported."
            values={{ p0: programReferences.length }}
          />
        </p>
      </div>
      <Input
        aria-label={tr("Search reference programs")}
        className="h-12"
        placeholder={tr("Search program references")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.map((p) => (
        <Panel key={p.id}>
          <p className="eyebrow text-volt">
            <Message source="Reference only" />
          </p>
          <h3 className="mt-2 text-title font-semibold">{p.name}</h3>
          <p className="mt-2 text-label text-muted-foreground">
            {p.classification} · {p.author}
          </p>
          <p className="mt-2 text-caption">
            {p.equipment.join(" · ") || tr("Equipment not documented")}
          </p>
          <a
            className="mt-3 flex min-h-11 items-center gap-2 text-label text-volt underline"
            href={p.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Message source="Original listing" />
            <ExternalLink className="size-4" />
          </a>
        </Panel>
      ))}
      {!matches.length && (
        <p role="status" className="py-6 text-label text-muted-foreground">
          <Message source="No references match your search." />
        </p>
      )}
    </div>
  );
}
