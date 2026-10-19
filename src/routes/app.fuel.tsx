import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  ArrowUpRight,
  Check,
  Loader2,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAct, useApi, useLog, useMe } from "@/lib/api";
import { ErrorState, PageHeader, Ring, SectionTitle, Skeleton } from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FoodSheet, Sheet } from "@/components/strata/sheets";
import { FuelWater } from "@/components/strata/fuel-water";
import { FUEL_TARGET as TARGET, MEALS, copyFood, recentFoods, type FoodDraft } from "@/lib/fuel";
import { iso, macrosFor, today } from "@/lib/stats";
import type { FoodLog } from "@/lib/types";

const FeatureWorkspace = lazy(() =>
  import("@/components/strata/feature-hub").then((m) => ({ default: m.FeatureWorkspace })),
);

export const Route = createFileRoute("/app/fuel")({
  head: () => ({
    meta: [
      { title: "Fuel — Kinra" },
      { name: "description", content: "Track meals, daily nutrition and hydration in Kinra." },
      { property: "og:title", content: "Fuel — Kinra" },
      {
        property: "og:description",
        content: "Track meals, daily nutrition and hydration in Kinra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Fuel,
});

function FoodRow({ f }: { f: FoodLog }) {
  const del = useAct((api, id: string) => api.remove("nutrition_logs", id));
  const undo = useAct((api, row: FoodLog) =>
    api.insert("nutrition_logs", copyFood(row, row.log_date)),
  );
  const remove = () => {
    if (del.isPending) return;
    del.mutate(f.id, {
      onSuccess: () =>
        toast(`Removed ${f.name}`, {
          action: {
            label: "Undo",
            onClick: () =>
              undo.mutate(f, {
                onError: () => toast.error("Couldn't restore this food. Try again."),
              }),
          },
        }),
      onError: () => toast.error("Couldn't remove this food. Your entry is still saved."),
    });
  };
  return (
    <div className="relative overflow-hidden rounded-tile">
      <div className="absolute inset-0 flex items-center justify-end bg-destructive/20 pr-5 text-destructive">
        <Trash2 className="size-5" />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0 }}
        onDragEnd={(_, i) => {
          if (i.offset.x < -100) remove();
        }}
        className="relative flex min-h-20 touch-pan-y items-center justify-between gap-2 rounded-tile border border-border bg-surface px-3 py-3"
      >
        <div className="min-w-0 flex-1">
          <div className="break-words text-body font-semibold">{f.name}</div>
          <div className="num mt-1 text-caption text-muted-foreground">
            {f.protein} g P · {f.carbs} g C · {f.fat} g F
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="num text-label font-bold">{f.calories}</div>
          <div className="text-caption text-muted-foreground">kcal</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-full text-muted-foreground"
          aria-label={`Delete ${f.name}`}
          disabled={del.isPending}
          onClick={remove}
        >
          <Trash2 />
        </Button>
      </motion.div>
    </div>
  );
}

function Fuel() {
  const [workspace, setWorkspace] = useState<"nutrition_plan" | "supplement" | null>(null);
  const me = useMe().data;
  const api = useApi();
  const q = useLog("nutrition_logs", me?.id);
  const food = q.data ?? [];
  const [date, setDate] = useState(today());
  const [entry, setEntry] = useState<{ meal: string; food?: FoodDraft } | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const completed = useRef(new Set<string>());
  const m = macrosFor(food, date);
  const items = food.filter((f) => f.log_date === date);
  const previousDate = iso(addDays(new Date(date + "T12:00"), -1));
  const previous = food.filter((f) => f.log_date === previousDate);
  const suggestions = recentFoods(food, date);
  const shift = (n: number) => setDate(iso(addDays(new Date(date + "T12:00"), n)));
  const left = TARGET.calories - m.calories;
  const repeat = useAct(async (api) => {
    let added = 0;
    try {
      for (const row of previous.filter((f) => selected.includes(f.id))) {
        if (completed.current.has(row.id)) continue;
        await api.insert("nutrition_logs", copyFood(row, date));
        completed.current.add(row.id);
        added++;
      }
    } finally {
      if (added) await q.refetch();
    }
  });
  const openRepeat = () => {
    setSelected(previous.map((f) => f.id));
    completed.current.clear();
    setRepeatError(null);
    setRepeatOpen(true);
  };
  if (!me) return null;

  return (
    <div className="min-w-0">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button variant="glass" className="h-11" onClick={() => setWorkspace("nutrition_plan")}>
          Meal plans
        </Button>
        <Button variant="glass" className="h-11" onClick={() => setWorkspace("supplement")}>
          Supplements
        </Button>
      </div>
      {workspace && (
        <Sheet
          open
          onOpenChange={(o) => !o && setWorkspace(null)}
          title={workspace === "nutrition_plan" ? "Meal plans" : "Supplements"}
        >
          <Suspense fallback={<p>Loading workspace…</p>}>
            <FeatureWorkspace compact kind={workspace} />
          </Suspense>
        </Sheet>
      )}
      <PageHeader eyebrow="Nourish your day" title="Fuel" />
      <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-full"
          aria-label="Previous day"
          onClick={() => shift(-1)}
        >
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <div className="font-display text-title font-bold">
            {date === today() ? "Today" : format(new Date(date + "T12:00"), "EEE, d MMM")}
          </div>
          <div className="num mt-1 text-caption text-muted-foreground">
            {format(new Date(date + "T12:00"), "d MMM yyyy")}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-full"
          aria-label="Next day"
          disabled={date === today()}
          onClick={() => shift(1)}
        >
          <ChevronRight />
        </Button>
      </div>
      {q.isLoading ? (
        <div aria-busy="true" aria-label="Loading nutrition">
          <Skeleton className="h-44" />
          {MEALS.map((meal) => (
            <div key={meal}>
              <Skeleton className="mt-8 h-5 w-32" />
              <Skeleton className="mt-3 h-20" />
            </div>
          ))}
        </div>
      ) : q.error ? (
        <ErrorState
          message="Your nutrition entries couldn't load. They're still saved."
          onRetry={() => q.refetch()}
        />
      ) : (
        <>
          <section aria-label="Daily nutrition" className="border-b border-border pb-6">
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Ring value={m.calories / TARGET.calories} size={140} stroke={9} color="var(--ember)">
                <div>
                  <div className="num text-title-l font-bold">{Math.abs(left)}</div>
                  <div className="mt-1 text-caption text-muted-foreground">
                    {left >= 0 ? "kcal remaining" : "kcal above target"}
                  </div>
                </div>
              </Ring>
              <div className="min-w-36 flex-1 space-y-4">
                {(
                  [
                    ["Protein", m.protein, TARGET.protein, "bg-ember-1"],
                    ["Carbs", m.carbs, TARGET.carbs, "bg-ember-2"],
                    ["Fat", m.fat, TARGET.fat, "bg-ember-3"],
                  ] as const
                ).map(([label, value, target, tone]) => (
                  <div key={label}>
                    <div className="flex flex-wrap justify-between gap-x-2 text-label">
                      <span className="font-semibold">{label}</span>
                      <span className="num text-caption text-muted-foreground">
                        {target >= value ? `${target - value} g left` : `${value - target} g above`}
                      </span>
                    </div>
                    <div
                      className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2"
                      role="progressbar"
                      aria-label={`${label}: ${value} of ${target} grams`}
                      aria-valuenow={Math.min(value, target)}
                      aria-valuemin={0}
                      aria-valuemax={target}
                    >
                      <motion.div
                        className={`absolute inset-0 origin-left rounded-full ${tone}`}
                        initial={false}
                        animate={{ scaleX: Math.max(0, Math.min(1, value / target)) }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="num mt-5 text-center text-caption text-muted-foreground">
              {m.calories} / {TARGET.calories} kcal · daily target
            </div>
          </section>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="eyebrow">Your meals</span>
            <Button
              variant="glass"
              className="h-11 px-4 text-label"
              disabled={!previous.length}
              onClick={openRepeat}
            >
              <Copy />
              {date === today() ? "Repeat yesterday" : "Repeat previous day"}
            </Button>
          </div>
          {MEALS.map((meal) => {
            const list = items.filter((i) => i.meal === meal);
            const kcal = list.reduce((sum, row) => sum + row.calories, 0);
            return (
              <section key={meal} aria-label={`${meal} entries`}>
                <SectionTitle
                  action={
                    <Button
                      variant="ghost"
                      className="h-11 rounded-full px-3 text-label text-ember"
                      aria-label={`Add to ${meal}`}
                      onClick={() => setEntry({ meal })}
                    >
                      <Plus /> Add
                    </Button>
                  }
                >
                  {meal}
                </SectionTitle>
                <div className="num -mt-2 mb-3 text-caption text-muted-foreground">
                  {kcal} kcal · {list.length} {list.length === 1 ? "entry" : "entries"}
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {list.map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                      >
                        <FoodRow f={f} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {!list.length && (
                    <div className="flex items-center gap-3 border-b border-dashed border-border py-4 text-label text-muted-foreground">
                      <Utensils className="size-4 shrink-0 text-ember/70" />
                      Nothing logged yet.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
          {suggestions.length > 0 && (
            <section aria-label="Recent food suggestions">
              <SectionTitle>From your recent meals</SectionTitle>
              <div className="space-y-2">
                {suggestions.map((f) => (
                  <Button
                    variant="ghost"
                    key={f.id}
                    onClick={() => setEntry({ meal: f.meal, food: copyFood(f, date) })}
                    aria-label={`Log ${f.name} again`}
                    className="h-auto min-h-20 w-full justify-between gap-3 whitespace-normal rounded-tile border border-border bg-surface p-4 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-label font-semibold">{f.name}</div>
                      <div className="num mt-1 text-caption text-muted-foreground">
                        {f.calories} kcal · {f.protein} g protein
                      </div>
                    </div>
                    <ArrowUpRight className="text-ember" />
                  </Button>
                ))}
              </div>
            </section>
          )}
          <FuelWater
            key={`${api.mode}:${me.id}:${date}`}
            date={date}
            owner={`${api.mode}:${me.id}`}
          />
        </>
      )}
      {entry && (
        <FoodSheet
          open
          date={date}
          meal={entry.meal}
          {...(entry.food ? { initialFood: entry.food } : {})}
          onOpenChange={(open) => {
            if (!open) setEntry(null);
          }}
        />
      )}
      <Sheet
        open={repeatOpen}
        onOpenChange={(open) => {
          if (!repeat.isPending) setRepeatOpen(open);
        }}
        title="Repeat meals"
        sub={`From ${format(new Date(previousDate + "T12:00"), "d MMM")} to ${format(new Date(date + "T12:00"), "d MMM")}`}
      >
        <p className="mb-4 text-label text-muted-foreground">
          Selected entries are added as new meals. Your existing entries stay unchanged.
        </p>
        <div className="space-y-2">
          {previous.map((f) => (
            <label
              key={f.id}
              className="flex min-h-16 items-center gap-3 rounded-tile border border-border bg-surface p-3"
            >
              <Checkbox
                disabled={repeat.isPending || completed.current.has(f.id)}
                checked={selected.includes(f.id)}
                onCheckedChange={(checked) =>
                  setSelected((prev) =>
                    checked ? [...prev, f.id] : prev.filter((id) => id !== f.id),
                  )
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block text-label font-semibold">{f.name}</span>
                <span className="num text-caption text-muted-foreground">
                  {f.meal} · {f.calories} kcal
                </span>
              </span>
              {completed.current.has(f.id) && <Check className="size-4 text-ember" />}
            </label>
          ))}
        </div>
        {repeatError && (
          <p role="alert" className="mt-4 text-label text-destructive">
            {repeatError}
          </p>
        )}
        <Button
          className="mt-5 h-14 w-full rounded-full text-body"
          variant="glass"
          disabled={!selected.length || repeat.isPending}
          onClick={() => {
            setRepeatError(null);
            repeat.mutate(undefined, {
              onSuccess: () => {
                setRepeatOpen(false);
                toast.success("Meals added. Original entries unchanged.");
              },
              onError: () =>
                setRepeatError(
                  "Some entries couldn't be added. Retry to add only the remaining meals.",
                ),
            });
          }}
        >
          {repeat.isPending ? <Loader2 className="animate-spin" /> : <Copy />}
          {repeat.isPending
            ? "Adding meals…"
            : repeatError
              ? "Retry remaining meals"
              : `Add ${selected.length} ${selected.length === 1 ? "entry" : "entries"}`}
        </Button>
      </Sheet>
    </div>
  );
}
