import { displayNumber, number, t as tr, useLanguage, Message } from "@/lib/i18n";
import { clock, useNow } from "./session";
import {
  doneCount,
  elapsedMs,
  isPaused,
  nextProgramDay,
  unfinishedCount,
} from "@/lib/session-state";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Dumbbell,
  Flame,
  Moon,
  Smile,
  MessageSquareQuote,
  Play,
  Check,
  Circle,
  Activity,
  ChevronRight,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow, countMessage } from "@/lib/i18n";
import { format } from "@/lib/i18n";
import { useLog, useQ } from "@/lib/api";
import {
  avg,
  dayOf,
  fmtK,
  fmtVolume,
  isCardio,
  lastNDays,
  macrosFor,
  readiness,
  recentSleep,
  readinessParts,
  streak,
  today,
  volume,
  volumeText,
  weekStart,
  within,
} from "@/lib/stats";
import { Bars, Panel, Ring, SectionTitle, Skeleton, Stat, Tag, springPress } from "./ui";
import { Sheet } from "./sheets";
import { useShell } from "./shell";
import type { Program, Workout } from "@/lib/types";
import { queryStatus } from "@/lib/query-status";
import { ErrorState } from "./ui";

export function useClientData(userId?: string) {
  const workouts = useLog("workouts", userId);
  const sleep = useLog("sleep_logs", userId);
  const food = useLog("nutrition_logs", userId);
  const journal = useLog("journal_entries", userId);
  const metrics = useLog("body_metrics", userId);
  return {
    workouts: workouts.data ?? [],
    sleep: sleep.data ?? [],
    food: food.data ?? [],
    journal: journal.data ?? [],
    metrics: metrics.data ?? [],
    ...queryStatus([workouts, sleep, food, journal, metrics]),
    retry: () => {
      void Promise.all([workouts, sleep, food, journal, metrics].map((query) => query.refetch()));
    },
  };
}

export function ReadinessHero({
  userId,
  interactive = true,
}: {
  userId: string;
  interactive?: boolean;
}) {
  useLanguage();
  const d = useClientData(userId);
  const [open, setOpen] = useState(false);
  const [lighter, setLighter] = useLighter();
  const reduce = useReducedMotion();
  if (d.loading) return <Skeleton className="h-[164px] w-full !rounded-[20px]" />;
  if (d.error) return <ErrorState onRetry={d.retry} />;
  const score = readiness(d.sleep, d.workouts);
  const parts = readinessParts(
    d.sleep,
    d.workouts,
    d.journal.map((j) => j.mood),
  );
  const m = macrosFor(d.food, today());
  const label =
    score >= 75
      ? tr("Higher readiness estimate")
      : score >= 55
        ? tr("Steady readiness estimate")
        : tr("Lower readiness estimate");
  const hasData = recentSleep(d.sleep).length > 0;
  return (
    <>
      <Panel
        onClick={interactive ? () => setOpen(true) : undefined}
        label={tr("Readiness details")}
        className="relative overflow-hidden p-5"
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative mx-auto shrink-0">
            {hasData && !reduce && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-2 rounded-full bg-primary/20 blur-xl"
                animate={{ opacity: [0.15, 0.6, 0.15], scale: [0.92, 1.04, 0.92] }}
                transition={{
                  duration: Math.max(1.4, 5 - score / 25),
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
            <Ring value={hasData ? score / 100 : 0} size={116} stroke={10}>
              <div className="mx-auto max-w-[90px] text-center">
                <div className="num text-title-l font-bold leading-none">
                  {hasData ? score : "—"}
                </div>
                <div className="eyebrow mt-1 whitespace-normal hyphens-auto leading-tight [overflow-wrap:anywhere]">
                  <Message source="Readiness" />
                </div>
              </div>
            </Ring>
          </div>
          <div className="min-w-0 flex-1 basis-[220px]">
            <div className="whitespace-normal font-display text-title font-bold hyphens-auto [overflow-wrap:anywhere]">
              {hasData ? label : tr("Recent sleep needed")}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
              <Stat
                size="sm"
                label={tr("Sleep")}
                value={d.sleep[0] ? displayNumber((+d.sleep[0].hours).toFixed(1)) : "—"}
                unit="h"
                tone="dream"
              />
              <Stat
                size="sm"
                label={tr("Streak")}
                value={streak(d.workouts)}
                unit="days"
                tone="volt"
              />
              <Stat
                size="sm"
                label={tr("Eaten")}
                value={fmtK(m.calories)}
                unit="kcal"
                tone="ember"
              />
              <Stat size="sm" label={tr("Protein")} value={m.protein} unit="g" tone="ember" />
            </div>
          </div>
        </div>
        {interactive && (
          <div className="mt-3 text-caption text-muted-foreground">
            <Message source="Tap to see what drives your score" />
          </div>
        )}
      </Panel>
      {interactive && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title={tr("Readiness {p0}", { p0: hasData ? score : "—" })}
          sub={tr(
            "A simple estimate from recent sleep and training frequency. Mood is context, not part of the score.",
          )}
        >
          {[
            {
              icon: Moon,
              tone: "text-dream",
              name: "Sleep",
              value: hasData
                ? tr("{p0} h avg · {p1}/100", { p0: parts.sleepHours, p1: parts.sleepScore })
                : tr("No data"),
              body: "Last 3 nights. Hours count most (70%), quality the rest. 8 h is full marks.",
            },
            {
              icon: Dumbbell,
              tone: "text-volt",
              name: "Load",
              value: tr("{count} in 48 h", { count: countMessage(parts.sessions48h, "sessions") }),
              body: "Recent sessions reduce this heuristic score. It does not measure your physiological recovery.",
            },
            {
              icon: Smile,
              tone: "text-pulse",
              name: "Mood",
              value: parts.mood ? tr("{p0}/5 recently", { p0: parts.mood }) : tr("No check-ins"),
              body: "Your recent check-ins give your coach context on stress and energy.",
            },
          ].map((r) => (
            <div key={tr(r.name)} className="tile mb-2 flex gap-3 p-4">
              <r.icon className={`mt-0.5 size-5 shrink-0 ${r.tone}`} />
              <div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{r.name}</span>
                  <span className={`num text-label ${r.tone}`}>{r.value}</span>
                </div>
                <p className="mt-1 text-label text-muted-foreground">{tr(r.body)}</p>
              </div>
            </div>
          ))}
          <p className="mt-3 text-body">
            {!hasData
              ? tr(
                  "Readiness is unknown without recent sleep records. You can still choose a session based on how you feel.",
                )
              : tr(
                  "Use this estimate as one piece of context. Consider how you feel, your plan and any guidance from your coach before choosing today's effort.",
                )}
          </p>
          {hasData && score < 60 && (
            <label className="tile mt-3 flex min-h-[56px] items-center justify-between gap-3 px-4">
              <span>
                <span className="block font-semibold">
                  <Message source="Go 10% lighter today" />
                </span>
                <span className="text-caption text-muted-foreground">
                  <Message source="Suggested weights drop 10% for today only" />
                </span>
              </span>
              <Switch checked={lighter} onCheckedChange={setLighter} />
            </label>
          )}
        </Sheet>
      )}
    </>
  );
}

export function PinnedCoachNote({ userId }: { userId: string }) {
  useLanguage();
  const notes = useQ(["notes", userId], (api) => api.notes(userId));
  const n = notes.data?.find((note) => !note.sender_id || note.sender_id === note.trainer_id);
  if (!n || !within(n.created_at, 7)) return null;
  return (
    <Panel index={1} className="mt-3 flex gap-3 border-primary/30 p-4">
      <MessageSquareQuote className="size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="eyebrow mb-1">
          <Message
            source="From your coach · {when}"
            values={{ when: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) }}
          />
        </div>
        <div className="text-body">{n.body}</div>
      </div>
    </Panel>
  );
}

/** Which program day is next, and which were already done this week. */
export function programWeek(p: Program, workouts: Workout[]) {
  const ws = weekStart(new Date());
  const thisWeek = workouts.filter((w) => weekStart(w.performed_at) === ws);
  const done = p.days.map((d) => thisWeek.some((w) => w.title === d.title));
  const nextIdx = done.findIndex((x) => !x);
  return { done, nextIdx, thisWeek };
}

function SessionInProgress() {
  useLanguage();
  const { session, openSession } = useShell();
  const now = useNow();
  if (!session) return null;
  const paused = isPaused(session);
  return (
    <Panel index={2} className="mt-3 p-5">
      <div className="eyebrow">{paused ? tr("Session paused") : tr("Session in progress")}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <div className="truncate font-display text-title font-bold">{session.title}</div>
        <div className="num text-title font-bold">
          {clock(Math.floor(elapsedMs(session, now) / 1000) * 1000)}
        </div>
      </div>
      <p className="mt-1 text-label text-muted-foreground">
        <Message
          source="{p0}sets done · {p1}to go"
          values={{ p0: doneCount(session), p1: unfinishedCount(session) }}
        />
      </p>
      <motion.button
        whileTap={springPress}
        onClick={openSession}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-volt-gradient font-semibold text-primary-foreground shadow-glow"
      >
        <Play className="size-5" /> <Message source="Resume" />
      </motion.button>
    </Panel>
  );
}

export function TodaySession({ userId }: { userId: string }) {
  useLanguage();
  const { startSession, session } = useShell();
  const assignments = useQ(["assignments", userId], (api) => api.assignments(userId));
  const programs = useQ(["programs"], (api) => api.programs());
  const workouts = useLog("workouts", userId).data ?? [];
  if (session && !session.editingId) return <SessionInProgress />;
  if (assignments.isLoading || programs.isLoading)
    return <Skeleton className="mt-3 h-[176px] w-full !rounded-[20px]" />;
  const a = assignments.data?.[0];
  const p = programs.data?.find((x) => x.id === a?.program_id);
  const todays = workouts.filter((w) => dayOf(w.performed_at) === today());

  if (todays.length) {
    const nx = p ? nextProgramDay(p, programWeek(p, workouts).done, todays[0]!.performed_at) : null;
    return (
      <Panel index={2} className="mt-3 p-5">
        <div className="eyebrow flex items-center gap-1.5 text-volt">
          <Check className="size-4" /> <Message source="Trained today" />
        </div>
        <div className="mt-3 space-y-2">
          {todays.map((w) => (
            <WorkoutRow key={w.id} w={w} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-label">
            {p ? (
              nx ? (
                <>
                  <Message source="Next:" />
                  <span className="font-bold">{nx.title}</span> · {nx.weekday}
                </>
              ) : (
                "Week complete — recover well."
              )
            ) : (
              "Recover well. See you next session."
            )}
          </div>
          <button
            type="button"
            onClick={() => startSession()}
            className="min-h-[44px] rounded-full px-2 text-label font-semibold text-primary"
          >
            <Message source="Another session" />
          </button>
        </div>
      </Panel>
    );
  }

  if (!p || !a)
    return (
      <Panel index={2} className="mt-3 p-5">
        <div className="eyebrow">
          <Message source="Today's session" />
        </div>
        <div className="mt-1 font-display text-title font-bold">
          <Message source="Free training day" />
        </div>
        <p className="mt-1 text-label text-muted-foreground">
          <Message source="Start a live session and log sets as you go." />
        </p>
        <motion.button
          whileTap={springPress}
          onClick={() => startSession()}
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-volt-gradient font-semibold text-primary-foreground shadow-glow"
        >
          <Play className="size-5" /> <Message source="Start session" />
        </motion.button>
      </Panel>
    );

  const week = Math.min(
    p.weeks,
    Math.floor((Date.now() - new Date(a.start_date).getTime()) / (7 * 86400000)) + 1,
  );
  const { done, nextIdx } = programWeek(p, workouts);
  const day = p.days[nextIdx >= 0 ? nextIdx : 0]!;
  const allDone = nextIdx < 0;
  return (
    <Panel index={2} className="mt-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow truncate">
          <Message source="{p0}· Week {p1}/{p2}" values={{ p0: p.name, p1: week, p2: p.weeks }} />
        </div>
        <div
          className="flex gap-1"
          aria-label={tr("{p0} of {p1} done this week", {
            p0: done.filter(Boolean).length,
            p1: done.length,
          })}
        >
          {done.map((x, i) =>
            x ? (
              <Check key={i} className="size-4 text-volt" />
            ) : (
              <Circle key={i} className="size-4 text-muted-foreground" />
            ),
          )}
        </div>
      </div>
      <div className="mt-2 font-display text-title font-bold">
        {allDone ? tr("Week complete — bonus session?") : day.title}
      </div>
      <div className="num mt-1 text-label text-muted-foreground">
        {day.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(" · ")}
      </div>
      <motion.button
        whileTap={springPress}
        onClick={() => startSession(day)}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-volt-gradient font-semibold text-primary-foreground shadow-glow"
      >
        <Play className="size-5" /> <Message source="Start session" />
      </motion.button>
    </Panel>
  );
}

export function FirstRun({ userId }: { userId: string }) {
  useLanguage();
  const d = useClientData(userId);
  const { log, startSession } = useShell();
  const trainer = useQ(["my-trainer"], (api) => api.myTrainer());
  if (d.loading || d.error) return null;
  const steps = [
    { done: d.workouts.length > 0, label: tr("Log your first workout"), go: () => startSession() },
    { done: d.sleep.length > 0, label: tr("Log last night's sleep"), go: () => log("sleep") },
    { done: d.food.length > 0, label: tr("Log a meal"), go: () => log("food") },
    { done: d.metrics.length > 0, label: tr("Do a weigh-in"), go: () => log("metric") },
    { done: !!trainer.data, label: tr("Connect with your coach"), to: true },
  ];
  const n = steps.filter((s) => s.done).length;
  if (n >= 3) return null;
  return (
    <Panel index={1} className="mt-3 p-5">
      <div className="flex items-center justify-between">
        <div className="font-display text-title font-bold">
          <Message source="Get set up" />
        </div>
        <span className="num text-label text-muted-foreground">
          {n}/{steps.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(n / steps.length) * 100}%` }}
        />
      </div>
      <ul className="mt-3">
        {steps.map((s) => {
          const inner = (
            <>
              {s.done ? (
                <Check className="size-5 text-volt" />
              ) : (
                <Circle className="size-5 text-muted-foreground" />
              )}
              <span className={s.done ? "text-muted-foreground line-through" : ""}>
                {tr(s.label)}
              </span>
            </>
          );
          return (
            <li key={tr(s.label)}>
              {s.to ? (
                <Link to="/app/me" className="flex min-h-[44px] items-center gap-3 text-body">
                  {inner}
                </Link>
              ) : (
                <button
                  disabled={s.done}
                  onClick={s.go}
                  className="flex min-h-[44px] w-full items-center gap-3 text-left text-body"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function WorkoutRow({ w, onEdit }: { w: Workout; onEdit?: () => void }) {
  useLanguage();
  const cardio = isCardio(w);
  const v = fmtVolume(volume(w));
  const Tagname = onEdit ? "button" : "div";
  return (
    <Tagname
      {...(onEdit
        ? {
            type: "button" as const,
            onClick: onEdit,
            "aria-label": tr("Edit {p0}, {p1}", {
              p0: w.title,
              p1: format(new Date(w.performed_at), "EEE d MMM"),
            }),
          }
        : {})}
      className="panel flex w-full items-center gap-3 p-3.5 text-left"
    >
      <div className="tile grid size-11 shrink-0 place-items-center">
        {cardio ? (
          <Activity className="size-5 text-volt" />
        ) : (
          <Dumbbell className="size-5 text-volt" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{w.title}</div>
        <div className="num text-caption text-muted-foreground">
          <Message
            source="{p0}· {p1}min {p2}"
            values={{
              p0: format(new Date(w.performed_at), "EEE d MMM"),
              p1: w.duration_min ?? "–",
              p2: w.rpe ? ` · RPE ${w.rpe}` : "",
            }}
          />
        </div>
      </div>
      {cardio ? (
        <Tag tone="pulse">
          <Message source="Cardio" />
        </Tag>
      ) : (
        <div className="num text-right text-body font-bold">
          {v.value}
          <span className="ml-0.5 font-sans text-caption text-muted-foreground">{v.unit}</span>
        </div>
      )}
    </Tagname>
  );
}

export function ClientOverview({ userId, trainerView }: { userId: string; trainerView?: boolean }) {
  useLanguage();
  const d = useClientData(userId);
  if (d.error) return <ErrorState onRetry={d.retry} />;
  if (d.loading)
    return (
      <div className="mt-8 space-y-3">
        <Skeleton className="h-44 !rounded-[20px]" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 !rounded-[20px]" />
          <Skeleton className="h-32 !rounded-[20px]" />
        </div>
      </div>
    );
  const days = lastNDays(28);
  const byDay = days.map((day) => d.workouts.filter((w) => dayOf(w.performed_at) === day));
  const sessions = d.workouts.filter((w) => within(w.performed_at, 28));
  const sleep7 = d.sleep.slice(0, 7);
  const mood7 = d.journal.slice(0, 7);
  const kcal7Days = lastNDays(7);
  const kcal7 = kcal7Days.map((day) => macrosFor(d.food, day).calories);
  const w = d.metrics.filter((x) => x.weight != null);
  const weightDelta = w.length > 1 ? +(w[0]!.weight! - w.at(-1)!.weight!).toFixed(1) : null;
  const vol = fmtVolume(sessions.reduce((a, x) => a + volume(x), 0));

  return (
    <div>
      <SectionTitle>
        <Message source="Last 28 days" />
      </SectionTitle>
      <div className="panel p-4">
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Stat label={tr("Sessions")} value={sessions.length} tone="volt" />
          <Stat label={tr("Weight lifted")} value={vol.value} unit={vol.unit} />
          <Stat
            label={tr("Avg effort")}
            value={displayNumber(avg(sessions.map((x) => x.rpe ?? 0).filter(Boolean)).toFixed(1))}
            unit="/ 10"
          />
        </div>
        <Bars
          values={byDay.map((ws) =>
            ws.reduce((a, x) => a + Math.max(volume(x), (x.duration_min ?? 0) * 40), 0),
          )}
          labels={days.map((x, i) => (i % 7 === 0 ? format(new Date(x + "T12:00"), "d MMM") : ""))}
          tip={(i) => {
            const ws = byDay[i]!;
            const dt = format(new Date(days[i]! + "T12:00"), "EEE d MMM");
            return ws.length
              ? `${dt} · ${ws.map((x) => x.title).join(", ")}`
              : `${dt} · ${tr("Rest")}`;
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="panel p-4">
          <Moon className="mb-2 size-4 text-dream" />
          <Stat
            label={tr("Sleep")}
            value={sleep7.length ? displayNumber(avg(sleep7.map((x) => +x.hours)).toFixed(1)) : "—"}
            unit="h / night"
            tone="dream"
          />
          <p className="mt-2 text-label text-muted-foreground">
            <Message source="Last 7 logs" />
          </p>
          <div className="mt-4">
            <Bars
              values={[...sleep7].reverse().map((x) => +x.hours)}
              color="var(--dream)"
              height={32}
              max={10}
              tip={(i) => `${number([...sleep7].reverse()[i]!.hours)} h`}
            />
          </div>
        </div>
        <div className="panel p-4">
          <Flame className="mb-2 size-4 text-ember" />
          <Stat
            label={tr("Food")}
            value={number(Math.round(avg(kcal7)))}
            unit="kcal / day"
            tone="ember"
          />
          <p className="mt-2 text-label text-muted-foreground">
            <Message source="Last 7 days" />
          </p>
          <div className="mt-4">
            <Bars
              values={kcal7}
              color="var(--ember)"
              height={32}
              tip={(i) =>
                `${format(new Date(kcal7Days[i]! + "T12:00"), "EEE")} · ${number(kcal7[i]!)} kcal`
              }
            />
          </div>
        </div>
        <div className="panel p-4">
          <Smile className="mb-2 size-4 text-pulse" />
          <Stat
            label={tr("Mood")}
            value={mood7.length ? displayNumber(avg(mood7.map((x) => x.mood)).toFixed(1)) : "—"}
            unit="/ 5"
            tone="pulse"
          />
          <p className="mt-2 text-label text-muted-foreground">
            <Message source="Last 7 check-ins" />
          </p>
          <div className="mt-4">
            <Bars
              values={[...mood7].reverse().map((x) => x.mood)}
              color="var(--pulse)"
              height={32}
              max={5}
              tip={(i) => `${[...mood7].reverse()[i]!.mood} / 5`}
            />
          </div>
        </div>
        <div className="panel p-4">
          <Dumbbell className="mb-2 size-4 text-muted-foreground" />
          <Stat label={tr("Weight")} value={w[0]?.weight ?? "—"} unit="kg" />
          <p className="mt-2 text-label text-muted-foreground">
            <Message source="Latest weigh-in" />
          </p>
          <div className="mt-4 text-label text-muted-foreground">
            {weightDelta != null ? (
              <>
                <span className="num font-semibold text-foreground">
                  <Message
                    source="{p0}{p1}kg"
                    values={{ p0: weightDelta > 0 ? "+" : "", p1: weightDelta }}
                  />
                </span>
                <span className="mt-1 block">
                  <Message source="since first weigh-in" />
                </span>
              </>
            ) : (
              "Weigh in twice to see a trend"
            )}
          </div>
        </div>
      </div>

      <SectionTitle
        action={
          !trainerView ? (
            <Link
              to="/app/train"
              className="-mr-2 flex min-h-[44px] items-center px-2 text-label font-semibold text-primary"
            >
              <Message source="See all" />
            </Link>
          ) : undefined
        }
      >
        <Message source="Recent sessions" />
      </SectionTitle>
      <div className="space-y-2">
        {d.workouts.slice(0, trainerView ? 6 : 3).map((x) => (
          <WorkoutRow key={x.id} w={x} />
        ))}
        {!d.workouts.length && (
          <div className="tile p-4 text-label text-muted-foreground">
            <Message source="No sessions yet." />
          </div>
        )}
      </div>

      {trainerView && (
        <>
          <SectionTitle>
            <Message source="Latest journal" />
          </SectionTitle>
          <div className="space-y-2">
            {d.journal.slice(0, 4).map((j) => (
              <div key={j.id} className="panel p-4">
                <div className="num mb-1 text-caption text-muted-foreground">
                  <Message
                    source="{p0}· mood {p1}/5 · energy {p2}/5"
                    values={{
                      p0: format(new Date(j.created_at), "EEE d MMM"),
                      p1: j.mood,
                      p2: j.energy,
                    }}
                  />
                </div>
                <div className="text-body">{j.body ?? "—"}</div>
              </div>
            ))}
            {!d.journal.length && (
              <div className="tile p-4 text-label text-muted-foreground">
                <Message source="No check-ins yet." />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { volumeText };

const LIGHTER_KEY = "strata:lighter";
export function useLighter() {
  const [on, setOn] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(LIGHTER_KEY) === today(),
  );
  const set = (v: boolean) => {
    setOn(v);
    if (v) localStorage.setItem(LIGHTER_KEY, today());
    else localStorage.removeItem(LIGHTER_KEY);
    navigator.vibrate?.(10);
  };
  return [on, set] as const;
}

export function StreakFlame({ userId }: { userId: string }) {
  useLanguage();
  const d = useClientData(userId);
  const s = streak(d.workouts);
  if (!s) return null;
  const size = Math.min(26, 14 + s * 1.5);
  return (
    <div
      className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5"
      aria-label={tr("{p0} day streak", { p0: s })}
    >
      <Flame className="text-ember" style={{ width: size, height: size }} strokeWidth={1.75} />
      <span className="num text-label font-bold">
        {s}
        <span className="ml-0.5 text-caption text-muted-foreground">
          <Message source="d" />
        </span>
      </span>
    </div>
  );
}

export function Insights({ userId }: { userId: string }) {
  useLanguage();
  const d = useClientData(userId);
  if (d.loading) return null;
  const days7 = lastNDays(7),
    days14 = lastNDays(14).slice(0, 7);
  const sl = (ds: string[]) =>
    avg(d.sleep.filter((s) => ds.includes(s.log_date)).map((s) => +s.hours));
  const s7 = sl(days7),
    sPrev = sl(days14);
  const prot = avg(days7.map((x) => macrosFor(d.food, x).protein).filter(Boolean));
  const w7 = d.workouts.filter((w) => within(w.performed_at, 7)).length;
  const w14 = d.workouts.filter((w) => within(w.performed_at, 14)).length - w7;
  const out: {
    icon: typeof Moon;
    tone: string;
    text: string;
    to: "/app/recover" | "/app/fuel" | "/app/train";
  }[] = [];
  if (s7 && sPrev && Math.abs(s7 - sPrev) >= 0.3)
    out.push({
      icon: Moon,
      tone: "text-dream",
      to: "/app/recover",
      text: tr("You slept {p0} h {p1} a night this week than last.", {
        p0: Math.abs(s7 - sPrev).toFixed(1),
        p1: s7 > sPrev ? tr("more") : tr("less"),
      }),
    });
  if (w7 || w14)
    out.push({
      icon: Dumbbell,
      tone: "text-volt",
      to: "/app/train",
      text:
        w7 >= w14
          ? tr("{p0} sessions in 7 days — on pace with last week ({p1}).", { p0: w7, p1: w14 })
          : tr("{p0} sessions in 7 days, {p1} fewer than last week.", { p0: w7, p1: w14 - w7 }),
    });
  if (prot)
    out.push({
      icon: Flame,
      tone: "text-ember",
      to: "/app/fuel",
      text: tr("You're averaging {p0} g protein a day over 7 days.", { p0: Math.round(prot) }),
    });
  if (!out.length) return null;
  return (
    <>
      <SectionTitle>
        <Message source="From your data" />
      </SectionTitle>
      <div className="space-y-2">
        {out.slice(0, 3).map((x, i) => (
          <Link key={i} to={x.to} className="block">
            <Panel index={3 + i} className="flex items-center gap-3 p-4">
              <x.icon className={`size-5 shrink-0 ${x.tone}`} strokeWidth={1.75} />
              <span className="flex-1 text-label">{x.text}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Panel>
          </Link>
        ))}
      </div>
    </>
  );
}
