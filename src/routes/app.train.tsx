import { programExerciseName } from "@/lib/exercise-catalogue";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Play,
  Trophy,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { useLog, useMe, useQ } from "@/lib/api";
import {
  Empty,
  ErrorState,
  PageHeader,
  SectionTitle,
  Skeleton,
  Tag,
  TextAction,
} from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { WorkoutRow, programWeek } from "@/components/strata/client-overview";
import { ExerciseTrend } from "@/components/strata/train-detail";
import { Sheet } from "@/components/strata/sheets";
import { useShell } from "@/components/strata/shell";
import { SwipeRow, useRemoveWithUndo } from "@/components/strata/swipe-delete";
import { volume, volumeText, weekStart } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/types";

const ExerciseLibrary = lazy(() =>
  import("@/components/strata/exercise-library").then((m) => ({ default: m.ExerciseLibrary })),
);

export const Route = createFileRoute("/app/train")({
  head: () => ({
    meta: [
      { title: tr("Train — Programs & personal records | Kinra") },
      {
        name: "description",
        content: "Your next program session, strength records and weekly workout history in Kinra.",
      },
      { property: "og:title", content: "Train — Programs & personal records | Kinra" },
      {
        property: "og:description",
        content: "Follow your program and track your strength, one session at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Train,
});

function Train() {
  useLanguage();
  const me = useMe().data;
  const { startSession, editWorkout } = useShell();
  const removeWorkout = useRemoveWithUndo("workouts");
  const wq = useLog("workouts", me?.id);
  const workouts = wq.data ?? [];
  const assignments = useQ(["assignments", me?.id], (api) => api.assignments(me?.id ?? ""));
  const programs = useQ(["programs"], (api) => api.programs());
  const program = programs.data?.find((p) => p.id === assignments.data?.[0]?.program_id);
  const [weeksShown, setWeeksShown] = useState(3);
  const [library, setLibrary] = useState(false);
  const [pr, setPr] = useState<string | null>(null);
  const [weekOverrides, setWeekOverrides] = useState<Record<string, boolean>>({});
  const [activeDay, setActiveDay] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);
  const { done, nextIdx } = program ? programWeek(program, workouts) : { done: [], nextIdx: -1 };
  useEffect(() => {
    const index = Math.max(0, nextIdx);
    setActiveDay(index);
    const child = carousel.current?.children[index] as HTMLElement | undefined;
    if (child && carousel.current)
      carousel.current.scrollTo({
        left: child.offsetLeft - carousel.current.offsetLeft - 20,
        behavior: "instant",
      });
  }, [program?.id, nextIdx]);

  const prs = new Map<string, number>();
  for (const w of workouts)
    for (const s of w.sets)
      if (s.weight > (prs.get(s.exercise) ?? 0)) prs.set(s.exercise, s.weight);
  const topPrs = [...prs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const groups = new Map<string, Workout[]>();
  for (const w of [...workouts].sort((a, b) => b.performed_at.localeCompare(a.performed_at))) {
    const key = weekStart(w.performed_at);
    const group = groups.get(key) ?? [];
    group.push(w);
    groups.set(key, group);
  }
  const weeks = [...groups.entries()];
  const thisWeek = weekStart(new Date());
  const loading = wq.isLoading || assignments.isLoading || programs.isLoading;
  const error = wq.error || assignments.error || programs.error;
  const scrollDay = (index: number) => {
    const child = carousel.current?.children[index] as HTMLElement | undefined;
    if (!child || !carousel.current) return;
    carousel.current.scrollTo({
      left: child.offsetLeft - carousel.current.offsetLeft - 20,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <div className="min-w-0">
      <Button variant="glass" className="mb-4 h-12 w-full" onClick={() => setLibrary(true)}>
        <Message source="Browse exercise library" />
      </Button>
      <Button asChild variant="glass" wrap className="mb-4 min-h-12 w-full">
        <Link to="/app/programs">{tr("My plans and program library")}</Link>
      </Button>
      {library && (
        <Sheet open onOpenChange={setLibrary} title={tr("Exercise library")}>
          <Suspense
            fallback={
              <p>
                <Message source="Loading movements…" />
              </p>
            }
          >
            <ExerciseLibrary />
          </Suspense>
        </Sheet>
      )}
      <PageHeader
        eyebrow={tr("Build your strength")}
        title={tr("Train")}
        action={
          <Button variant="glass" className="h-11 px-4 text-label" onClick={() => startSession()}>
            <Play /> <Message source="Freestyle" />
          </Button>
        }
      />
      {loading ? (
        <div aria-busy="true" aria-label={tr("Loading training")}>
          <Skeleton className="mb-3 h-5 w-40" />
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="mt-8 h-5 w-32" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-28" />
            ))}
          </div>
          <Skeleton className="mt-8 h-16" />
        </div>
      ) : error ? (
        <ErrorState
          onRetry={() => {
            wq.refetch();
            assignments.refetch();
            programs.refetch();
          }}
        />
      ) : (
        <>
          {program ? (
            <section aria-label={tr("Your program")}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="eyebrow mb-1">
                    <Message source="Your program" />
                  </div>
                  <h2 className="font-display text-title font-bold">{program.name}</h2>
                </div>
                <span className="num shrink-0 text-caption text-muted-foreground">
                  <Message
                    source="{p0}/{p1}this week"
                    values={{ p0: done.filter(Boolean).length, p1: program.days.length }}
                  />
                </span>
              </div>
              <div
                ref={carousel}
                onScroll={(event) => {
                  const el = event.currentTarget;
                  const first = el.children[0] as HTMLElement | undefined;
                  if (first) setActiveDay(Math.round(el.scrollLeft / (first.offsetWidth + 12)));
                }}
                className="relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 no-scrollbar"
              >
                {program.days.map((day, i) => (
                  <article
                    key={`${program.id}-${i}`}
                    className={cn(
                      "w-[88%] shrink-0 snap-start rounded-card border bg-surface p-4",
                      i === nextIdx ? "border-primary/35" : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="eyebrow">
                        <Message source="Day {p0}" values={{ p0: i + 1 }} />
                      </span>
                      {done[i] ? (
                        <Tag tone="volt">
                          <Check className="size-3" /> <Message source="Done" />
                        </Tag>
                      ) : i === nextIdx ? (
                        <Tag tone="volt">
                          <Message source="Next up" />
                        </Tag>
                      ) : (
                        <Tag>
                          <Message source="Upcoming" />
                        </Tag>
                      )}
                    </div>
                    <h3 className="mt-3 font-display text-title font-bold">{day.title}</h3>
                    <div className="num mt-2 text-caption text-muted-foreground">
                      <Message
                        source="{p0}exercises · {p1}sets"
                        values={{
                          p0: day.exercises.length,
                          p1: day.exercises.reduce((sum, ex) => sum + ex.sets, 0),
                        }}
                      />
                    </div>
                    <ul className="mt-4 divide-y divide-border">
                      {day.exercises.map((ex, n) => (
                        <li
                          key={`${programExerciseName(ex)}-${n}`}
                          className="flex items-center gap-3 py-3 text-label"
                        >
                          <span className="num text-caption text-muted-foreground">
                            {String(n + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1 font-semibold">{ex.name}</span>
                          <span className="num shrink-0 text-caption text-muted-foreground">
                            {ex.sets} × {ex.reps}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={i === nextIdx ? "volt" : "glass"}
                      size="xl"
                      className="mt-4 w-full text-label"
                      onClick={() => startSession(day)}
                    >
                      <Play />
                      {done[i] ? tr("Train again") : tr("Start session")}
                    </Button>
                  </article>
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="num text-caption text-muted-foreground">
                  <Message
                    source="Day {p0}of {p1}"
                    values={{ p0: activeDay + 1, p1: program.days.length }}
                  />
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tr("Previous program day")}
                    disabled={activeDay === 0}
                    onClick={() => scrollDay(activeDay - 1)}
                    className="size-11 rounded-full"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tr("Next program day")}
                    disabled={activeDay >= program.days.length - 1}
                    onClick={() => scrollDay(activeDay + 1)}
                    className="size-11 rounded-full"
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <Empty
              icon={<Dumbbell className="size-7" />}
              title={tr("Your next session starts here")}
              body={tr("Browse your own plans or start a freestyle session.")}
              action={
                <Button variant="volt" size="xl" onClick={() => startSession()}>
                  <Play /> <Message source="Start session" />
                </Button>
              }
            />
          )}
          {topPrs.length > 0 && (
            <section aria-label={tr("Personal records")}>
              <SectionTitle
                action={
                  <span className="text-caption text-muted-foreground">
                    <Message source="Best logged sets" />
                  </span>
                }
              >
                <Message source="Personal records" />
              </SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                {topPrs.map(([name, weight]) => (
                  <Button
                    key={name}
                    variant="ghost"
                    onClick={() => setPr(name)}
                    aria-label={tr("{p0}, best logged weight {p1} kilograms. View strength trend", {
                      p0: name,
                      p1: weight,
                    })}
                    className="tile h-auto min-h-32 min-w-0 flex-col items-start justify-between gap-2 whitespace-normal p-3 text-left"
                  >
                    <div className="flex w-full items-center justify-between">
                      <Trophy className="text-volt" />
                      <ArrowUpRight className="text-muted-foreground" />
                    </div>
                    <div className="num text-title font-bold">
                      {weight}
                      <span className="ml-1 text-caption font-normal text-muted-foreground">
                        <Message source="kg" />
                      </span>
                    </div>
                    <span className="line-clamp-2 text-caption font-semibold text-muted-foreground">
                      {name}
                    </span>
                  </Button>
                ))}
              </div>
            </section>
          )}
          <section aria-label={tr("Workout history")}>
            <SectionTitle
              action={
                <span className="num text-caption text-muted-foreground">
                  <Message source="{p0}total sessions" values={{ p0: workouts.length }} />
                </span>
              }
            >
              <Message source="History" />
            </SectionTitle>
            {!workouts.length ? (
              <Empty
                icon={<Dumbbell className="size-7" />}
                title={tr("A fresh start")}
                body="Your completed sessions will appear here."
              />
            ) : (
              <div className="space-y-3">
                {weeks.slice(0, weeksShown).map(([week, sessions], index) => {
                  const open = weekOverrides[week] ?? index === 0;
                  const label =
                    week === thisWeek
                      ? tr("This week")
                      : tr("Week of {p0}", { p0: format(new Date(week + "T12:00"), "d MMM") });
                  const id = `history-${week}`;
                  return (
                    <div key={week} className="border-b border-border pb-3 last:border-0">
                      <Button
                        variant="ghost"
                        aria-expanded={open}
                        aria-controls={id}
                        onClick={() => setWeekOverrides((prev) => ({ ...prev, [week]: !open }))}
                        className="h-auto min-h-16 w-full justify-between rounded-tile px-1 py-3 text-left"
                      >
                        <div>
                          <div className="text-label font-bold">{label}</div>
                          <div className="num mt-2 text-caption text-muted-foreground">
                            <Message
                              source="{p0}session{p1}· {p2}"
                              values={{
                                p0: sessions.length,
                                p1: sessions.length === 1 ? "" : "s",
                                p2: volumeText(
                                  sessions.reduce((sum, workout) => sum + volume(workout), 0),
                                ),
                              }}
                            />
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "text-muted-foreground transition-transform motion-reduce:transition-none",
                            open && "rotate-180",
                          )}
                        />
                      </Button>
                      <div id={id} hidden={!open} className="space-y-2 pt-2">
                        {sessions.map((workout) => (
                          <SwipeRow
                            key={workout.id}
                            label={tr("{p0}: swipe left to delete", { p0: workout.title })}
                            onDelete={() => removeWorkout(workout, "Workout deleted")}
                          >
                            <WorkoutRow w={workout} onEdit={() => editWorkout(workout)} />
                          </SwipeRow>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {weeks.length > weeksShown && (
                  <div className="flex justify-center">
                    <TextAction onClick={() => setWeeksShown((count) => count + 3)}>
                      <Message source="Show earlier weeks" />
                    </TextAction>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
      <Sheet
        open={pr !== null}
        onOpenChange={(open) => {
          if (!open) setPr(null);
        }}
        title={pr ?? ""}
        sub={tr("Strength over time")}
      >
        {pr && <ExerciseTrend name={pr} workouts={workouts} />}
      </Sheet>
    </div>
  );
}
