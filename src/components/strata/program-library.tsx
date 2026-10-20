import { ExtraPrograms } from "./extra-programs";
import { filterLibrary, programFilterOptions } from "./library-display";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Dumbbell, ExternalLink, Loader2, Play, Plus, Utensils } from "lucide-react";
import { toast } from "sonner";
import { t, useLanguage } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { useAct, useQ } from "@/lib/api";
import { programTemplates, localizedTemplate, type ProgramTemplate } from "@/lib/program-templates";
import { programReferences, programExerciseName } from "@/lib/exercise-catalogue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "./ui";
import { Sheet } from "./sheets";
import { useShell } from "./shell";

export function ProgramLibrary() {
  useLanguage();
  const [tab, setTab] = useState<
    "training" | "nutrition" | "references" | "supplement_plan" | "video_plan"
  >("training");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    goal: "",
    level: "",
    equipment: "",
    weeks: "",
    saved: false,
  });
  const bookmarks = useQ(["features", "saved"], (api) => api.features.list("saved"));
  const [selected, setSelected] = useState<ProgramTemplate | null>(null);
  const templates =
    tab !== "training" && tab !== "nutrition"
      ? []
      : filterLibrary(
          tab,
          query,
          filters,
          (bookmarks.data ?? [])
            .filter((row) => row.payload.target_type === "program")
            .map((row) => row.payload.target_id),
        );
  return (
    <div className="space-y-4">
      <div className="rounded-card border border-volt/20 bg-volt/5 p-5">
        <p className="eyebrow text-volt">{t("Program library")}</p>
        <h2 className="mt-2 font-display text-title-l font-bold">{t("A clear place to start.")}</h2>
        <p className="mt-3 text-label text-muted-foreground">
          {t("Review a complete plan, start a session or save a private copy you can edit.")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("Program type")}>
        {(["training", "nutrition", "supplement_plan", "video_plan", "references"] as const).map(
          (value) => (
            <Button
              key={value}
              wrap
              variant={tab === value ? "volt" : "secondary"}
              aria-pressed={tab === value}
              className="min-h-11 flex-1"
              onClick={() => {
                setTab(value);
                setFilters((previous) => ({
                  goal: "",
                  level: "",
                  equipment: "",
                  weeks: "",
                  saved: previous.saved,
                }));
              }}
            >
              {t(
                value === "training"
                  ? "Training"
                  : value === "nutrition"
                    ? "Nutrition"
                    : value === "supplement_plan"
                      ? "Supplements"
                      : value === "video_plan"
                        ? "Video plans"
                        : "Archived references",
              )}
            </Button>
          ),
        )}
      </div>
      {tab === "supplement_plan" || tab === "video_plan" ? (
        <ExtraPrograms key={tab} kind={tab} />
      ) : (
        <>
          <Input
            aria-label={t("Search programs")}
            placeholder={t("Search programs")}
            className="h-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {tab !== "references" && (
            <details className="rounded-tile border border-border p-4">
              <summary className="cursor-pointer py-2 font-semibold">{t("Filter plans")}</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(["goal", "level", "equipment"] as const).map((key) => (
                  <label key={key} className="text-label">
                    {t(key === "goal" ? "Goal" : key === "level" ? "Level" : "Equipment")}
                    <select
                      className="mt-2 min-h-11 w-full rounded-xl border border-border bg-surface px-3"
                      value={filters[key]}
                      onChange={(event) =>
                        setFilters((value) => ({ ...value, [key]: event.target.value }))
                      }
                    >
                      <option value="">{t("All")}</option>
                      {programFilterOptions(tab, key).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="text-label">
                  {t("Maximum weeks")}
                  <Input
                    className="mt-2 min-h-11"
                    type="number"
                    min={1}
                    max={104}
                    value={filters.weeks}
                    onChange={(event) =>
                      setFilters((value) => ({ ...value, weeks: event.target.value }))
                    }
                  />
                </label>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filters.saved}
                    onChange={(event) =>
                      setFilters((value) => ({ ...value, saved: event.target.checked }))
                    }
                  />
                  {t("Saved bookmarks only")}
                </label>
                <Button
                  wrap
                  variant="ghost"
                  onClick={() =>
                    setFilters({ goal: "", level: "", equipment: "", weeks: "", saved: false })
                  }
                >
                  {t("Clear filters")}
                </Button>
              </div>
              <p className="mt-3 text-caption text-muted-foreground">
                {t(
                  "Bookmarks keep plans here. Saved private copies are available in My plans or Meal plans.",
                )}
              </p>
            </details>
          )}
          {tab === "references" ? (
            <ArchivedReferences query={query} />
          ) : (
            <>
              <p className="text-caption text-muted-foreground" role="status">
                {t("{count} plans found", { count: templates.length })}
              </p>
              {templates.map((plan) => (
                <Panel
                  key={plan.id}
                  onClick={() => setSelected(programTemplates.find((p) => p.id === plan.id)!)}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-volt/10 text-volt">
                      {plan.type === "training" ? (
                        <Dumbbell aria-hidden="true" />
                      ) : (
                        <Utensils aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words font-display text-title font-bold">
                        {plan.title}
                      </h3>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {t(plan.level)} · {t(plan.goal)}
                      </p>
                    </div>
                  </div>
                  <p className="text-label text-muted-foreground">{plan.summary}</p>
                  <PlanFacts plan={plan} />
                  <p className="text-caption text-muted-foreground">{plan.author}</p>
                </Panel>
              ))}
              {!templates.length && (
                <p className="py-5 text-label text-muted-foreground">
                  {t("No plans match your search.")}
                </p>
              )}
            </>
          )}
        </>
      )}
      {selected && (
        <ProgramDetail key={selected.id} template={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
function PlanFacts({ plan }: { plan: ProgramTemplate }) {
  return (
    <div className="flex flex-wrap gap-2 text-caption">
      {plan.type === "training" && (
        <>
          <span className="rounded-full bg-surface-2 px-3 py-2">
            {t("{count} weeks", { count: plan.weeks })}
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-2">
            {t("{count} sessions / week", { count: plan.sessionsPerWeek })}
          </span>
          <span className="rounded-full bg-surface-2 px-3 py-2">
            {t("About {count} min", { count: plan.minutes })}
          </span>
        </>
      )}
      {plan.equipment.map((item) => (
        <span key={item} className="rounded-full border border-border px-3 py-2">
          {t(item)}
        </span>
      ))}
    </div>
  );
}
function ProgramDetail({ template, onClose }: { template: ProgramTemplate; onClose: () => void }) {
  useLanguage();
  const plan = localizedTemplate(template);
  const { startSession, session, openSession } = useShell();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const bookmarks = useQ(["features", "saved"], (api) => api.features.list("saved"));
  const existingBookmark = bookmarks.data?.find(
    (row) => row.payload.target_type === "program" && row.payload.target_id === template.id,
  );
  const bookmark = useAct((api) =>
    existingBookmark
      ? api.features.remove(existingBookmark.id)
      : api.features.save("saved", { target_type: "program", target_id: template.id }),
  );
  const adopt = useAct((api, id: string) => api.adoptTemplate(id));
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={plan.title} sub={plan.summary}>
      <div className="space-y-5">
        <PlanFacts plan={plan} />
        <Button
          wrap
          variant="secondary"
          disabled={bookmark.isPending || bookmarks.isLoading}
          onClick={() => bookmark.mutate(undefined)}
        >
          {t(existingBookmark ? "Remove bookmark" : "Bookmark plan")}
        </Button>
        <p className="text-caption text-muted-foreground">
          {t("Created by {author}", { author: plan.author })}
        </p>
        <div className="rounded-tile border border-border bg-surface p-4 text-label">
          {t(
            "Use this as a starting point. Review the exercises, portions and schedule, then adapt your private copy to your needs.",
          )}
        </div>
        {plan.considerations && (
          <section className="rounded-tile border border-border p-4">
            <h3 className="text-label font-semibold">{t("Before you begin")}</h3>
            <p className="mt-2 text-label text-muted-foreground">{plan.considerations}</p>
          </section>
        )}
        {plan.progression && (
          <details className="rounded-tile border border-border p-4">
            <summary className="cursor-pointer py-2 text-label font-semibold">
              {t("How to progress")}
            </summary>
            <p className="mt-2 text-label text-muted-foreground">{plan.progression}</p>
          </details>
        )}
        {plan.type === "training" &&
          plan.days.map((day, index) => (
            <details
              key={index}
              open={index === 0}
              className="rounded-tile border border-border p-4"
            >
              <summary className="cursor-pointer py-2 font-display text-title font-semibold">
                {day.title}
              </summary>
              <ol className="mt-3 divide-y divide-border">
                {day.exercises.map((exercise, i) => (
                  <li key={i} className="py-4">
                    {exercise.section && (
                      <p className="eyebrow mb-1 text-muted-foreground">{t(exercise.section)}</p>
                    )}
                    <h4 className="text-label font-semibold">{programExerciseName(exercise)}</h4>
                    <p className="num mt-1 text-label">
                      {t("{sets} sets · {reps}", { sets: exercise.sets, reps: exercise.reps })}
                      {exercise.rest_seconds != null
                        ? ` · ${t("{seconds}s rest", { seconds: exercise.rest_seconds })}`
                        : ""}
                    </p>
                    {exercise.equipment && (
                      <p className="mt-1 text-caption text-muted-foreground">
                        {t(exercise.equipment)}
                      </p>
                    )}
                    {exercise.notes && (
                      <p className="mt-2 text-label text-muted-foreground">{exercise.notes}</p>
                    )}
                  </li>
                ))}
              </ol>
              <Button
                wrap
                variant="volt"
                className="mt-3 min-h-12 w-full"
                onClick={() => {
                  onClose();
                  if (session) openSession();
                  else startSession(template.days[index]!, { id: template.id, version: 1 });
                }}
              >
                <Play className="size-4" aria-hidden="true" />
                {t(session ? "Resume current session" : "Start this session")}
              </Button>
            </details>
          ))}
        {plan.nutrition && (
          <div className="space-y-3">
            {plan.nutrition.notes && (
              <p className="text-label text-muted-foreground">{plan.nutrition.notes}</p>
            )}
            {plan.nutrition.meals.map((meal, index) => (
              <section key={index} className="rounded-tile border border-border p-4">
                <h3 className="font-display text-title font-semibold">{meal.name}</h3>
                {meal.time && (
                  <p className="num mt-1 text-caption text-muted-foreground">{meal.time}</p>
                )}
                <ul className="mt-3 space-y-3">
                  {meal.foods.map((food, i) => (
                    <li key={i}>
                      <p className="text-label font-semibold">{food.name}</p>
                      {food.quantity && (
                        <p className="text-caption text-muted-foreground">{food.quantity}</p>
                      )}
                      <p className="num mt-1 text-caption text-muted-foreground">
                        {t("{kcal} kcal · {protein}g protein · {carbs}g carbs · {fat}g fat", {
                          kcal: food.calories,
                          protein: food.protein,
                          carbs: food.carbs,
                          fat: food.fat,
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        {plan.sources.length > 0 && (
          <details className="rounded-tile border border-border p-4">
            <summary className="cursor-pointer py-2 text-label font-semibold">
              {t("Sources and context")}
            </summary>
            <ul className="mt-2 space-y-2">
              {plan.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-label text-volt underline"
                  >
                    {source.title}
                    <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                  </a>
                  <p className="text-caption text-muted-foreground">
                    {t("Source observed {p0}", { p0: source.observedDate })}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        )}
        {error && (
          <p role="alert" className="text-label text-destructive">
            {error}
          </p>
        )}
        <Button
          wrap
          variant="glass"
          className="min-h-12 w-full"
          disabled={adopt.isPending || saved}
          onClick={() => {
            setError("");
            adopt.mutate(plan.id, {
              onSuccess: (result) => {
                setSaved(true);
                toast.success(
                  t(
                    result &&
                      typeof result === "object" &&
                      "alreadySaved" in result &&
                      result.alreadySaved
                      ? "This plan is already in your library."
                      : "Private editable copy saved.",
                  ),
                );
              },
              onError: (cause) => setError(errorText(cause)),
            });
          }}
        >
          {adopt.isPending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
          {t(adopt.isPending ? "Saving…" : saved ? "Copy saved" : "Save private copy")}
        </Button>
        {saved && (
          <Button
            wrap
            variant="volt"
            className="min-h-12 w-full"
            onClick={() => {
              onClose();
              void navigate({ to: plan.type === "training" ? "/app/train" : "/app/fuel" });
            }}
          >
            {t(plan.type === "training" ? "Open my training" : "Open my meal plans")}
          </Button>
        )}
        <p className="text-caption text-muted-foreground">
          {t("Saving a plan does not log a workout or mark a meal as eaten.")}
        </p>
      </div>
    </Sheet>
  );
}
function ArchivedReferences({ query }: { query: string }) {
  const matches = programReferences.filter((p) =>
    `${p.name} ${p.classification} ${p.author}`
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="rounded-tile bg-surface p-4 text-label text-muted-foreground">
        {t(
          "These third-party listings are historical references. Their routines are not included; the usable plans above are original Kinra templates.",
        )}
      </div>
      {matches.map((p) => (
        <Panel key={p.id}>
          <p className="eyebrow text-muted-foreground">{t("Reference only")}</p>
          <h3 className="mt-2 font-display text-title font-semibold">{p.name}</h3>
          <p className="mt-2 text-label text-muted-foreground">
            {p.classification} · {p.author}
          </p>
          <a
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-label text-volt underline"
            href={p.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("Original listing")}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </Panel>
      ))}
    </>
  );
}
