import { CardioFields, CardioReadout } from "./cardio-fields";
import { cardioMetricsError } from "@/lib/cardio";
import { sessionPresentation } from "./session-presentation";
import { programExerciseName } from "@/lib/exercise-catalogue";
import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message, displayNumber, countNoun } from "@/lib/i18n";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  Reorder,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import {
  Check,
  ChevronDown,
  Delete,
  GripVertical,
  Minus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Replace,
  Search,
  Share2,
  SkipForward,
  Square,
  StickyNote,
  Timer,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Feather,
} from "lucide-react";
import { toast } from "sonner";
import { useAct, useLog, useMe } from "@/lib/api";
import type { ProgramDay, Workout } from "@/lib/types";
import { volumeText } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { IconButton, SaveButton, springPress, Tag } from "./ui";
import type { LiveSessionState, SEx, SSet } from "./shell";
import {
  autoPauseAt,
  nextGroupedSet,
  shouldRestAfterGroupedSet,
  countsForStats,
  doneCount,
  durationMin,
  elapsedMs,
  isPaused,
  markAllDone,
  pause,
  removeUnfinished,
  restLeft,
  resume,
  searchLifts,
  SET_TYPES,
  setsForSave,
  unfinishedCount,
} from "@/lib/session-state";
import {
  Barbell,
  BodyMap,
  CountUp,
  est1RM,
  haptic,
  isLighterToday,
  learnRest,
  platesFor,
  PrMoment,
  restFor,
  roundPlate,
  shareSession,
  sound,
  StrataBands,
  usePref,
} from "./session-extras";

export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [active]);
  return now;
}
export const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000 - 0.001));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
const elapsedClock = (ms: number) => clock(Math.floor(ms / 1000) * 1000);

export function history(workouts: Workout[]) {
  const last = new Map<string, { reps: number; weight: number }[]>();
  const best = new Map<string, number>();
  for (const w of workouts) {
    const by = new Map<string, { reps: number; weight: number }[]>();
    for (const s of w.sets) {
      if (s.tracking === "cardio") continue;
      if (!by.has(s.exercise)) by.set(s.exercise, []);
      by.get(s.exercise)!.push(s);
      if (s.weight > (best.get(s.exercise) ?? 0)) best.set(s.exercise, s.weight);
    }
    for (const [k, v] of by) if (!last.has(k)) last.set(k, v);
  }
  return { last, best };
}

/** Next suggested load from last time: all target reps hit → +2.5 kg, else hold. Lighter day → 90%, rounded to 2.5 kg. */
export function progression(
  prev: { reps: number; weight: number }[] | undefined,
  targetReps: number,
  lighter: boolean,
) {
  if (!prev?.length) return null;
  const top = Math.max(...prev.map((p) => p.weight));
  const hit = prev.every((p) => p.reps >= targetReps);
  const base = hit ? top + 2.5 : top;
  const kg = lighter ? roundPlate(top * 0.9) : base;
  return {
    kg,
    reps: targetReps,
    kind: lighter ? ("lighter" as const) : hit ? ("up" as const) : ("hold" as const),
  };
}

export function sessionFromTemplate(
  t: ProgramDay | undefined,
  workouts: Workout[],
  lighter = isLighterToday(),
): LiveSessionState {
  const { last } = history(workouts);
  return {
    workoutId: crypto.randomUUID(),
    title: t?.title ?? "Quick session",
    startedAt: Date.now(),
    lastActiveAt: Date.now(),
    totalPausedMs: 0,
    pauseIntervals: [],
    pausedAt: null,
    rest: null,
    lighter,
    exercises: (t?.exercises ?? []).map((e) => {
      const prev = last.get(e.name);
      const n = Math.max(1, Math.min(e.sets, 8));
      const reps = parseInt(e.reps) || prev?.[0]?.reps || 8;
      return {
        tracking: e.tracking,
        targetCardio: e.cardio ? structuredClone(e.cardio) : undefined,
        name: e.name,
        catalogue_id: e.catalogue_id,
        section: e.section,
        group: e.group,
        equipment: e.equipment,
        substitutions: e.substitutions,
        targetWeight: e.weight,
        rest_seconds: e.rest_seconds,
        rpe: e.rpe,
        tempo: e.tempo,
        notes: e.notes,
        sets: Array.from({ length: n }, (_, i) => {
          if (e.tracking === "cardio") return { kg: 0, reps: 0, done: false, cardio: {} };
          const kg = e.weight ?? prev?.[i]?.weight ?? prev?.[0]?.weight ?? 0;
          return { kg: lighter ? roundPlate(kg * 0.9) : kg, reps, done: false };
        }),
      };
    }),
  };
}

const rpeAnchors: Record<number, string> = {
  1: "Barely moving",
  2: "Very easy",
  3: "Easy",
  4: "Comfortable",
  5: "Moderate",
  6: "Could do 4 more reps",
  7: "Could do 3 more reps",
  8: "Could do 2 more reps",
  9: "Could do 1 more rep",
  10: "Max effort",
};

const cardioEffortAnchors: Record<number, string> = {
  1: "Barely moving",
  2: "Very easy",
  3: "Easy",
  4: "Comfortable",
  5: "Moderate",
  6: "Somewhat hard",
  7: "Hard",
  8: "Very hard",
  9: "Extremely hard",
  10: "Max effort",
};
/** Number that rolls to its new value. */
function Rolling({ value, format }: { value: number; format: (n: number) => string }) {
  useLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) return void (el.textContent = format(value));
    const c = animate(prev.current, value, {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = format(v)),
    });
    prev.current = value;
    return () => c.stop();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{format(value)}</span>;
}

/** Hold-to-repeat: fires once on press, then repeats after a short delay. Keyboard click fires once. */
function useRepeat(fn: () => void) {
  const f = useRef(fn);
  f.current = fn;
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (t.current) {
      clearTimeout(t.current);
      clearInterval(t.current);
    }
    t.current = null;
  };
  useEffect(() => stop, []);
  return {
    onPointerDown: () => {
      stop();
      f.current();
      t.current = setTimeout(() => (t.current = setInterval(() => f.current(), 90)), 420);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: (e: React.MouseEvent) => e.detail === 0 && f.current(),
  };
}

/** Long press; returns handlers and a ref telling the click handler to ignore the release. */
function useLongPress(fn: () => void, ms = 480) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const clear = () => t.current && clearTimeout(t.current);
  return {
    fired,
    handlers: {
      onPointerDown: () => {
        fired.current = false;
        clear();
        t.current = setTimeout(() => ((fired.current = true), haptic.medium(), fn()), ms);
      },
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}

function Stepper({
  label,
  value,
  step,
  onChange,
  unit,
  onValueTap,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (n: number) => void;
  unit: string;
  onValueTap?: () => void;
}) {
  useLanguage();
  const v = useRef(value);
  v.current = value;
  const press = (d: number) => {
    const n = Math.max(0, +(v.current + d).toFixed(2));
    v.current = n;
    onChange(n);
    haptic.light();
    sound.tick();
  };
  const dec = useRepeat(() => press(-step));
  const inc = useRepeat(() => press(step));
  return (
    <div className="min-w-0 flex-1">
      <div className="eyebrow mb-1.5 text-center">{label}</div>
      <div className="flex items-center gap-1.5">
        <motion.button
          type="button"
          whileTap={springPress}
          aria-label={tr("Decrease {p0}", { p0: label })}
          {...dec}
          className="grid size-11 shrink-0 touch-none select-none place-items-center rounded-full bg-surface-2"
        >
          <Minus className="size-5" strokeWidth={1.75} />
        </motion.button>
        <button
          type="button"
          disabled={!onValueTap}
          onClick={onValueTap}
          aria-label={
            onValueTap ? tr("{p0} {p1}, type a value", { p0: value, p1: unit || label }) : undefined
          }
          className={cn(
            "num min-h-[44px] min-w-0 flex-1 text-center text-title font-bold",
            onValueTap &&
              "rounded-[14px] underline decoration-dotted decoration-muted-foreground underline-offset-4",
          )}
        >
          {displayNumber(value)}
          {unit && (
            <span className="ml-0.5 text-caption font-medium text-muted-foreground">{unit}</span>
          )}
        </button>
        <motion.button
          type="button"
          whileTap={springPress}
          aria-label={tr("Increase {p0}", { p0: label })}
          {...inc}
          className="grid size-11 shrink-0 touch-none select-none place-items-center rounded-full bg-surface-2"
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </motion.button>
      </div>
    </div>
  );
}

/** In-session bottom card (the session is its own full-screen layer, so it hosts its own sheets). */
function BottomCard({
  open,
  onClose,
  title,
  children,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  tall?: boolean;
}) {
  useLanguage();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bc"
          className="absolute inset-0 z-30 flex flex-col justify-end bg-background/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.14 } }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            drag="y"
            dragListener={!tall}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, i) => i.offset.y > 80 && onClose()}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={cn(
              "pb-safe flex flex-col rounded-t-[22px] border-t border-border bg-popover px-5 pb-6 pt-2",
              tall ? "h-[88%]" : "max-h-[92%]",
            )}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-surface-2" />
            <h3 className="mb-4 shrink-0 font-display text-title font-bold">{title}</h3>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SheetBtn = ({
  children,
  onClick,
  tone = "plain",
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "plain" | "primary" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
}) => (
  <motion.button
    type="button"
    whileTap={disabled ? {} : springPress}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "flex min-h-14 w-full min-w-0 items-center justify-center gap-2 whitespace-normal break-words rounded-full px-4 py-3 text-center font-semibold hyphens-auto disabled:opacity-50 [&_svg]:shrink-0",
      tone === "primary"
        ? "bg-volt-gradient text-primary-foreground"
        : tone === "danger"
          ? "bg-destructive/15 text-destructive"
          : "bg-surface-2",
    )}
  >
    {icon}
    {children}
  </motion.button>
);

type Target = { e: number; s: number; field?: "kg" | "reps" };
type RowCtx = {
  cur: { e: number; s: number } | null;
  setActive: (a: { e: number; s: number }) => void;
  toggle: (e: number, s: number) => void;
  setVal: (e: number, s: number, p: Partial<SSet>) => void;
  removeSet: (e: number, s: number) => void;
  addSet: (e: number) => void;
  applyAll: (e: number, kg: number, reps: number) => void;
  openKeypad: (t: Target) => void;
  openSetMenu: (t: Target) => void;
  openExMenu: (e: number) => void;
  substitute: (e: number, name: string) => void;
  restore: (e: number) => void;
  last: Map<string, { reps: number; weight: number }[]>;
  lighter: boolean;
};

function ExerciseCard({
  ex,
  display = ex,
  e,
  c,
}: {
  ex: SEx;
  display?: SEx;
  e: number;
  c: RowCtx;
}) {
  useLanguage();
  const controls = useDragControls();
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prev = ex.tracking === "cardio" ? undefined : c.last.get(ex.name);
  const lt = prev
    ? `${prev.length} × ${prev[0]!.reps} @ ${Math.max(...prev.map((p) => p.weight))} kg`
    : null;
  const prog =
    ex.tracking === "cardio" || ex.targetWeight != null
      ? null
      : progression(prev, ex.sets[0]?.reps ?? 8, c.lighter);
  const applied =
    prog && ex.sets.filter((s) => !s.done).every((s) => s.kg === prog.kg && s.reps === prog.reps);
  return (
    <Reorder.Item
      value={ex}
      dragListener={false}
      dragControls={controls}
      className="panel mb-3 list-none overflow-hidden p-3"
      whileDrag={{ scale: 1.02, zIndex: 5 }}
      initial={false}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }
      }
    >
      <div
        className="flex select-none flex-col items-stretch gap-2 px-1 sm:flex-row sm:items-start sm:justify-between"
        onPointerDown={(ev) => {
          const pe = ev.nativeEvent;
          timer.current = setTimeout(() => (haptic.medium(), controls.start(pe)), 380);
        }}
        onPointerUp={() => timer.current && clearTimeout(timer.current)}
        onPointerLeave={() => timer.current && clearTimeout(timer.current)}
        onPointerCancel={() => timer.current && clearTimeout(timer.current)}
      >
        <div className="min-w-0 w-full sm:flex-1">
          <div
            className={cn(
              "whitespace-normal break-words font-display text-title font-bold hyphens-auto [overflow-wrap:anywhere]",
              ex.skipped && "text-muted-foreground line-through",
            )}
          >
            {programExerciseName(ex)}
          </div>
          <div className="num text-caption text-muted-foreground">
            {ex.skipped
              ? tr("Skipped — not saved")
              : lt
                ? tr("Last time: {p0}", { p0: lt })
                : ex.tracking === "cardio"
                  ? tr("Record actual time or distance, then complete each interval.")
                  : tr("First time — set your baseline")}
          </div>
        </div>
        <div className="flex shrink-0 items-center self-end sm:self-auto">
          {ex.sets.some((s) => s.pr) && (
            <Tag tone="volt">
              <Trophy className="size-3" /> <Message source="PR" />
            </Tag>
          )}
          <button
            type="button"
            aria-label={tr("{p0} options", { p0: programExerciseName(ex) })}
            onPointerDown={(ev) => ev.stopPropagation()}
            onClick={() => c.openExMenu(e)}
            className="grid size-11 place-items-center text-muted-foreground"
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label={tr("Hold to reorder {p0}", { p0: programExerciseName(ex) })}
            onPointerDown={(ev) => (ev.stopPropagation(), controls.start(ev))}
            className="grid size-11 touch-none place-items-center text-muted-foreground"
          >
            <GripVertical className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {ex.skipped ? (
        <button
          type="button"
          onClick={() => c.restore(e)}
          className="mt-1 min-h-[44px] px-1 text-label font-semibold text-primary"
        >
          <Message source="Restore exercise" />
        </button>
      ) : (
        <div className="mt-2">
          {(ex.section || display.group || display.equipment) && (
            <p className="mb-3 text-caption text-volt">
              {[
                ex.section === "warmup"
                  ? tr("Warm-up")
                  : ex.section === "cooldown"
                    ? tr("Cool-down")
                    : ex.section
                      ? tr("Main work")
                      : null,
                display.group
                  ? tr("Group {p0} · alternate exercises, rest between rounds", {
                      p0: display.group,
                    })
                  : null,
                display.equipment,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {!!ex.substitutions?.length && (
            <details className="mb-3 rounded-tile bg-surface-2 p-3">
              <summary className="cursor-pointer text-label">
                <Message source="Planned alternatives" />
              </summary>
              <p className="mt-2 text-caption text-muted-foreground">
                <Message source="Choose before logging any sets. Review the load for the new movement." />
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ex.substitutions.filter(Boolean).map((name) => (
                  <button
                    key={name}
                    type="button"
                    disabled={ex.sets.some((set) => set.done)}
                    onClick={() => c.substitute(e, name)}
                    className="min-h-11 rounded-full border border-border px-3 text-label disabled:opacity-50"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </details>
          )}
          {(ex.targetWeight != null ||
            ex.rest_seconds != null ||
            ex.rpe != null ||
            display.tempo ||
            display.notes ||
            ex.note) && (
            <div className="mb-3 border-l-2 border-pulse/40 pl-3 text-label">
              <div className="num flex flex-wrap gap-x-3 gap-y-1 text-caption text-pulse">
                {ex.tracking !== "cardio" && ex.targetWeight != null && (
                  <span>
                    <Message
                      source="Planned load {p0}kg{p1}"
                      values={{
                        p0: ex.targetWeight,
                        p1: c.lighter ? tr(" · lighter day applied") : "",
                      }}
                    />
                  </span>
                )}
                {ex.rest_seconds != null && (
                  <span>
                    <Message source="Rest {p0}s" values={{ p0: ex.rest_seconds }} />
                  </span>
                )}
                {ex.rpe != null && (
                  <span>
                    <Message source="RPE {p0}/10" values={{ p0: ex.rpe }} />
                  </span>
                )}
                {display.tempo && (
                  <span>
                    <Message source="Tempo {p0}" values={{ p0: display.tempo }} />
                  </span>
                )}
              </div>
              {display.notes && (
                <p className="mt-1 break-words text-muted-foreground">{display.notes}</p>
              )}
              {ex.note && (
                <p className="mt-1 break-words text-foreground">
                  <StickyNote className="mr-1 inline size-3.5 text-muted-foreground" />
                  {ex.note}
                </p>
              )}
            </div>
          )}
          {prog && (
            <motion.button
              type="button"
              whileTap={springPress}
              disabled={!!applied}
              onClick={() => (c.applyAll(e, prog.kg, prog.reps), haptic.light())}
              className={cn(
                "mb-2 ml-1 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-label font-semibold",
                applied
                  ? "border-transparent bg-surface-2 text-muted-foreground"
                  : "border-primary/40 text-volt",
              )}
            >
              {prog.kind === "lighter" && <Feather className="size-3.5" />}
              {applied
                ? tr("Applied: ")
                : prog.kind === "up"
                  ? tr("Try ")
                  : prog.kind === "hold"
                    ? tr("Hold ")
                    : tr("Lighter day: ")}
              <span className="num">
                <Message source="{p0}kg × {p1}" values={{ p0: prog.kg, p1: prog.reps }} />
              </span>
            </motion.button>
          )}
          {ex.tracking === "cardio" ? (
            <div className="space-y-3">
              {ex.targetCardio && (
                <div className="rounded-tile bg-pulse/10 p-3">
                  <p className="mb-2 text-label font-semibold">{tr("Planned cardio targets")}</p>
                  <CardioReadout value={ex.targetCardio} />
                  <p className="mt-2 text-caption text-muted-foreground">
                    {tr("Targets are not recorded activity.")}
                  </p>
                </div>
              )}
              {ex.sets.map((set, index) => (
                <CardioInterval
                  key={index}
                  set={set}
                  index={index}
                  onChange={(cardio) =>
                    c.setVal(e, index, {
                      cardio,
                      ...(cardioMetricsError(cardio) ? { done: false } : {}),
                    })
                  }
                  onToggle={() => c.toggle(e, index)}
                  onRemove={() => c.removeSet(e, index)}
                />
              ))}
            </div>
          ) : (
            <>
              {" "}
              <div className="hidden grid-cols-[32px_1fr_1fr_1fr_44px] items-center gap-1 px-1 pb-1 text-caption font-semibold text-muted-foreground sm:grid">
                <span>
                  <Message source="Set" />
                </span>
                <span>
                  <Message source="Previous" />
                </span>
                <span className="text-center">
                  <Message source="kg" />
                </span>
                <span className="text-center">
                  <Message source="Reps" />
                </span>
                <span className="sr-only">
                  <Message source="Done" />
                </span>
              </div>
              {ex.sets.map((s, i) => (
                <SetRow
                  key={i}
                  s={s}
                  i={i}
                  e={e}
                  p={prev?.[i]}
                  isCur={c.cur?.e === e && c.cur.s === i}
                  c={c}
                />
              ))}
            </>
          )}
          <motion.button
            type="button"
            whileTap={springPress}
            onClick={() => c.addSet(e)}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-full text-label font-semibold text-primary"
          >
            <Plus className="size-4" />{" "}
            {ex.tracking === "cardio" ? tr("Add interval") : tr("Add set")}
          </motion.button>
        </div>
      )}
    </Reorder.Item>
  );
}

function CardioInterval({
  set,
  index,
  onChange,
  onToggle,
  onRemove,
}: {
  set: SSet;
  index: number;
  onChange: (value: NonNullable<SSet["cardio"]>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  useLanguage();
  const error = cardioMetricsError(set.cardio ?? {});
  return (
    <fieldset className="min-w-0 rounded-tile border border-border p-3">
      <legend className="px-1 text-label font-semibold">
        {tr("Interval {count}", { count: index + 1 })}
      </legend>
      <CardioFields value={set.cardio} onChange={onChange} />
      {error && <p className="mt-2 text-caption text-muted-foreground">{tr(error)}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={set.done}
          disabled={!set.done && !!error}
          onClick={onToggle}
          className="min-h-12 flex-1 rounded-full bg-primary px-3 text-label font-semibold text-primary-foreground disabled:opacity-50"
        >
          {set.done ? tr("Completed · undo") : tr("Complete interval")}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={tr("Remove interval {count}", { count: index + 1 })}
          className="min-h-12 rounded-full border border-border px-3 text-label"
        >
          {tr("Remove")}
        </button>
      </div>
    </fieldset>
  );
}

function SetRow({
  s,
  i,
  e,
  p,
  isCur,
  c,
}: {
  s: SSet;
  i: number;
  e: number;
  p: { reps: number; weight: number } | undefined;
  isCur: boolean;
  c: RowCtx;
}) {
  useLanguage();
  const reduce = useReducedMotion();
  const lp = useLongPress(() => c.openSetMenu({ e, s: i }));
  const tag = SET_TYPES.find((t) => t.type === s.type)?.short;
  return (
    <div className="relative overflow-hidden rounded-[14px]">
      <div
        className="absolute inset-0 flex items-center justify-end bg-destructive/20 pr-4 text-label font-semibold text-destructive"
        aria-hidden
      >
        <Message source="Delete" />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        dragDirectionLock
        onDragEnd={(_, info) => info.offset.x < -90 && c.removeSet(e, i)}
        className="relative bg-surface"
      >
        <div
          className={cn(
            "relative grid min-h-[48px] grid-cols-[minmax(0,1fr)_44px] items-center gap-1 rounded-[14px] px-1 transition-opacity sm:grid-cols-[32px_1fr_1fr_1fr_44px]",
            isCur && !s.done && "bg-surface-2",
            s.done && !isCur && "opacity-60",
          )}
        >
          <AnimatePresence>
            {s.done && (
              <motion.div
                key="sweep"
                className={cn(
                  "absolute inset-0 origin-left rounded-[14px]",
                  s.type === "warmup" ? "bg-surface-2" : "bg-primary/15",
                )}
                initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
                animate={reduce ? { opacity: 1 } : { scaleX: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.14 } }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>
          <button
            type="button"
            {...lp.handlers}
            onClick={() => !lp.fired.current && c.setActive({ e, s: i })}
            className="num relative grid min-h-[48px] min-w-0 select-none grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1 py-2 text-left [-webkit-touch-callout:none] sm:col-span-4 sm:grid-cols-[32px_1fr_1fr_1fr] sm:py-0"
            aria-label={tr("Set {p0}{p1}: {p2} kg × {p3}. Hold for options", {
              p0: i + 1,
              p1: s.type && s.type !== "working" ? ` (${s.type})` : "",
              p2: s.kg,
              p3: s.reps,
            })}
          >
            <span className="flex flex-col items-start sm:flex-row sm:items-center">
              <span className="text-caption font-normal text-muted-foreground sm:hidden">
                {tr("Set")}
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                {tag ? (
                  <motion.span
                    key={tag}
                    layoutId={`type-${e}-${i}`}
                    initial={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 34 }}
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-caption font-bold",
                      s.type === "warmup"
                        ? "bg-surface-3 text-muted-foreground"
                        : s.type === "failure"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-ember/20 text-ember",
                    )}
                  >
                    {tag}
                  </motion.span>
                ) : (
                  <motion.span
                    key="n"
                    initial={false}
                    className={cn(
                      "text-label font-bold",
                      s.done ? "text-volt" : "text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className="order-last col-span-2 col-start-2 break-words text-caption text-muted-foreground sm:order-none sm:col-span-1 sm:col-start-auto sm:text-label">
              <span className="sm:hidden">{tr("Previous")}: </span>
              {p ? `${displayNumber(p.weight)} × ${displayNumber(p.reps)}` : "—"}
            </span>
            <span className="text-center text-body font-bold">
              {displayNumber(s.kg)}
              <span className="text-caption font-normal sm:hidden"> kg</span>
            </span>
            <span className="text-center text-body font-bold">
              <span className="font-normal sm:hidden">× </span>
              {displayNumber(s.reps)}
            </span>
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            aria-label={
              s.done ? tr("Undo set {p0}", { p0: i + 1 }) : tr("Complete set {p0}", { p0: i + 1 })
            }
            aria-pressed={s.done}
            onClick={() => c.toggle(e, i)}
            className={cn(
              "relative grid size-11 place-items-center rounded-full transition-colors",
              s.done ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                initial={s.done && !reduce ? { pathLength: 0 } : false}
                animate={{ pathLength: s.done || reduce ? 1 : 0.999 }}
                key={String(s.done)}
                transition={{ duration: 0.32, ease: "easeOut" }}
              />
            </svg>
          </motion.button>
        </div>
        {s.note && (
          <p className="px-2 pb-2 text-caption text-muted-foreground">
            <StickyNote className="mr-1 inline size-3" />
            {s.note}
          </p>
        )}
        <AnimatePresence initial={false}>
          {isCur && !s.done && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 px-1 pt-3 sm:flex-row sm:gap-3">
                <Stepper
                  label={tr("Weight")}
                  unit="kg"
                  value={s.kg}
                  step={2.5}
                  onChange={(v) => c.setVal(e, i, { kg: v })}
                  onValueTap={() => c.openKeypad({ e, s: i, field: "kg" })}
                />
                <Stepper
                  label={tr("Reps")}
                  unit=""
                  value={s.reps}
                  step={1}
                  onChange={(v) => c.setVal(e, i, { reps: v })}
                  onValueTap={() => c.openKeypad({ e, s: i, field: "reps" })}
                />
              </div>
              <div className="num pb-3 pt-2 text-center text-caption text-muted-foreground">
                <Message source="Est. 1RM" />
                <span className="font-bold text-foreground">
                  <Message source="{p0}kg" values={{ p0: est1RM(s.kg, s.reps) }} />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Keypad({
  initial,
  unit,
  onDone,
  onPlates,
}: {
  initial: number;
  unit: string;
  onDone: (n: number) => void;
  onPlates?: () => void;
}) {
  useLanguage();
  const [txt, setTxt] = useState(String(initial));
  const [fresh, setFresh] = useState(true);
  const key = (k: string) => {
    haptic.light();
    if (k === "back") return (setTxt((t) => (fresh ? "" : t.slice(0, -1))), setFresh(false));
    setTxt((t) => {
      const base = fresh ? "" : t;
      if (k === "." && (base.includes(".") || unit !== "kg")) return base;
      const n = base + k;
      return n.length > 6 ? base : n;
    });
    setFresh(false);
  };
  const val = Math.max(0, Number(txt) || 0);
  return (
    <div>
      <div className="num mb-4 text-center text-display font-bold" aria-live="polite">
        {txt || "0"}
        <span className="ml-1 text-title text-muted-foreground">{unit}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", unit === "kg" ? "." : "", "0", "back"].map(
          (k, i) =>
            k ? (
              <motion.button
                key={i}
                type="button"
                whileTap={springPress}
                onClick={() => key(k)}
                aria-label={k === "back" ? tr("Delete digit") : k}
                className="num grid h-14 place-items-center rounded-[14px] bg-surface-2 text-title font-bold"
              >
                {k === "back" ? <Delete className="size-5" /> : k}
              </motion.button>
            ) : (
              <span key={i} />
            ),
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {onPlates ? (
          <SheetBtn onClick={onPlates}>
            <Message source="Plates" />
          </SheetBtn>
        ) : (
          <span />
        )}
        <SheetBtn
          tone="primary"
          onClick={() => onDone(unit === "kg" ? Math.round(val * 4) / 4 : Math.round(val))}
        >
          <Message source="Done" />
        </SheetBtn>
      </div>
    </div>
  );
}

function ExercisePicker({
  history,
  onPick,
}: {
  history: string[];
  onPick: (name: string) => void;
}) {
  useLanguage();
  const [q, setQ] = useState("");
  const [recent] = usePrefList("strata:recent-lifts");
  const { mine, groups } = searchLifts(q, history, recent);
  const custom =
    q.trim() &&
    ![...mine, ...groups.flatMap(([, x]) => x)].some(
      (x) => x.toLowerCase() === q.trim().toLowerCase(),
    );
  const Item = (n: string) => (
    <button
      key={n}
      type="button"
      onClick={() => onPick(n)}
      className="flex min-h-[48px] w-full items-center justify-between border-b border-border text-left text-body last:border-0"
    >
      {n} <Plus className="size-4 text-muted-foreground" />
    </button>
  );
  return (
    <div>
      <div className="sticky top-0 z-10 bg-popover pb-3">
        <div className="flex h-12 items-center gap-2 rounded-[14px] border border-input bg-surface px-3">
          <Search className="size-5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("Search lifts")}
            aria-label={tr("Search exercises")}
            className="h-full min-w-0 flex-1 bg-transparent text-body outline-none"
          />
        </div>
      </div>
      {custom && (
        <SheetBtn onClick={() => onPick(q.trim())} icon={<Plus className="size-5" />}>
          <Message source="Add “{p0}”" values={{ p0: q.trim() }} />
        </SheetBtn>
      )}
      {mine.length > 0 && (
        <section className="mt-3">
          <div className="eyebrow mb-1">
            <Message source="Yours" />
          </div>
          {mine.slice(0, 12).map(Item)}
        </section>
      )}
      {groups.map(([g, xs]) => (
        <section key={g} className="mt-4">
          <div className="eyebrow mb-1">{g}</div>
          {xs.map(Item)}
        </section>
      ))}
    </div>
  );
}

function usePrefList(key: string): [string[], (v: string) => void] {
  const [v, setV] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return [];
    }
  });
  return [
    v,
    (x) => {
      const n = [x, ...v.filter((y) => y !== x)].slice(0, 8);
      setV(n);
      localStorage.setItem(key, JSON.stringify(n));
    },
  ];
}

/** Insert payload for a session. capAtLastSet: duration ends at the last completed set. */
export function toWorkoutRow(
  s: LiveSessionState,
  now: number,
  rpe = s.rpe ?? 7,
  capAtLastSet = false,
): Partial<Workout> & { id: string } {
  return {
    id: s.editingId ?? s.workoutId,
    title: s.title,
    duration_min: durationMin(s, now, capAtLastSet),
    rpe,
    sets: setsForSave(s),
    performed_at: s.performedAt ?? new Date(s.startedAt).toISOString(),
  };
}

type SheetKind =
  | null
  | "end"
  | "unfinished"
  | "discard"
  | "away"
  | "keypad"
  | "plates"
  | "setMenu"
  | "exMenu"
  | "picker"
  | "quick";
const patchEx = (s: LiveSessionState, e: number, fn: (x: SEx) => SEx): LiveSessionState => ({
  ...s,
  exercises: s.exercises.map((x, i) => (i === e ? fn(x) : x)),
});
const patchSet = (s: LiveSessionState, e: number, j: number, p: Partial<SSet>) =>
  patchEx(s, e, (x) => ({ ...x, sets: x.sets.map((y, k) => (k === j ? { ...y, ...p } : y)) }));

type LiveSessionProps = {
  session: LiveSessionState;
  setSession: (s: LiveSessionState) => void;
  minimized: boolean;
  setMinimized: (m: boolean) => void;
  onClose: () => void;
};

export function LiveSession(props: LiveSessionProps) {
  const me = useMe().data;
  // Auth cache clearing can precede the shell unmount during sign-out.
  // A separate child preserves hook order and releases timers without changing the draft.
  if (!me) return null;
  return <AuthenticatedLiveSession key={me.id} {...props} userId={me.id} />;
}

function AuthenticatedLiveSession({
  session,
  setSession,
  minimized,
  setMinimized,
  onClose,
  userId,
}: LiveSessionProps & { userId: string }) {
  useLanguage();
  const workouts = useLog("workouts", userId).data;
  const { last, best } = useMemo(
    () => history((workouts ?? []).filter((w) => w.id !== session.editingId)),
    [workouts, session.editingId],
  );
  const now = useNow();
  const reduce = useReducedMotion();
  const presentation = sessionPresentation(session);
  const activeExercises = session.exercises.filter((ex) => !ex.skipped);
  const cardioOnly =
    activeExercises.length > 0 && activeExercises.every((ex) => ex.tracking === "cardio");
  const editing = !!session.editingId;
  const paused = isPaused(session) && !editing;
  const [active, setActive] = useState<{ e: number; s: number } | null>(null);
  const [islandOpen, setIslandOpen] = useState(false);
  const [pr, setPr] = useState<{ ex: string; kg: number } | null>(null);
  const [phase, setPhase] = useState<"live" | "review" | "saved">(
    session.savedAt ? "saved" : "live",
  );
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [exMenu, setExMenu] = useState<number | null>(null);
  const [replacing, setReplacing] = useState<number | null>(null);
  const [addingCardio, setAddingCardio] = useState(false);
  const [noteFor, setNoteFor] = useState<null | "set" | "ex">(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [away, setAway] = useState(0);
  const [flash, setFlash] = useState(0);
  const [rpe, setRpe] = useState(session.rpe ?? 7);
  const [soundPref, setSoundPref] = usePref("strata:sound");
  const [, pushRecent] = usePrefList("strata:recent-lifts");
  const lastTick = useRef(0);

  const commit = (s: LiveSessionState) => setSession({ ...s, lastActiveAt: Date.now() });
  const close = () => setSheet(null);

  const save = useAct(async (api, s: LiveSessionState) => {
    await api.saveWorkout(toWorkoutRow(s, Date.now(), rpe), !!s.editingId);
  });

  /* ---- lifecycle ---- */
  const doPause = () => (commit(pause(session, Date.now())), haptic.light(), setIslandOpen(false));
  const doResume = () => {
    setSession(resume(session, Date.now()));
    setFlash((f) => f + 1);
    haptic.light();
    close();
  };

  // Auto-pause after inactivity; the pause starts at the last interaction.
  useEffect(() => {
    if (editing || phase !== "live") return;
    const at = autoPauseAt(session, now);
    if (at != null) {
      setSession(pause(session, at));
      setAway(now - at);
      setSheet("away");
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // Count any interaction as activity (throttled to keep storage writes calm).
  const touch = () => {
    if (!paused && !editing && Date.now() - (session.lastActiveAt ?? 0) > 30_000) commit(session);
  };

  // Keep the screen awake while training.
  useEffect(() => {
    if (paused || editing || phase !== "live") return;
    const wl = (
      navigator as unknown as {
        wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
      }
    ).wakeLock;
    if (!wl) return;
    let lock: { release: () => Promise<void> } | null = null;
    let off = false;
    const req = () => {
      if (document.visibilityState !== "visible") return;
      wl.request("screen")
        .then((l) => {
          if (off) void l.release();
          else lock = l;
        })
        .catch(() => {});
    };
    req();
    document.addEventListener("visibilitychange", req);
    return () => {
      off = true;
      document.removeEventListener("visibilitychange", req);
      lock?.release().catch(() => {});
    };
  }, [paused, editing, phase]);

  // Ask for notification permission once, on the first session.
  useEffect(() => {
    if (
      editing ||
      typeof Notification === "undefined" ||
      Notification.permission !== "default" ||
      localStorage.getItem("strata:notif-asked")
    )
      return;
    localStorage.setItem("strata:notif-asked", "1");
    Notification.requestPermission().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- sets ---- */
  const firstOpen = (() => {
    for (let e = 0; e < session.exercises.length; e++) {
      if (session.exercises[e]!.skipped) continue;
      const s = session.exercises[e]!.sets.findIndex((x) => !x.done);
      if (s >= 0) return { e, s };
    }
    return null;
  })();
  const cur = active ?? firstOpen;
  const setVal = (e: number, s: number, p: Partial<SSet>) => commit(patchSet(session, e, s, p));

  const rest = session.rest ?? null;
  const left = restLeft(session, now);
  const startRest = (exName: string, secs: number, base = session) => {
    const t = Date.now();
    return { ...base, rest: { end: t + secs * 1000, total: secs, start: t, ex: exName } };
  };
  const endRest = (skipped: boolean) => {
    if (rest) learnRest(rest.ex, skipped ? (Date.now() - rest.start) / 1000 : rest.total);
    commit({ ...session, rest: null });
    setIslandOpen(false);
  };
  const nudgeRest = (d: number) => {
    if (!rest) return;
    commit({
      ...session,
      rest: {
        ...rest,
        end: rest.end + d * 1000,
        total: Math.max(5, rest.total + d),
        ...(rest.left != null ? { left: Math.max(0, rest.left + d * 1000) } : {}),
      },
    });
  };

  const toggle = (e: number, s: number) => {
    const ex = session.exercises[e];
    const st = ex?.sets[s];
    if (!ex || !st) return;
    if (st.done) return setVal(e, s, { done: false, pr: false });
    if (ex.tracking === "cardio" && cardioMetricsError(st.cardio)) return;
    const warm = st.type === "warmup";
    const prevBest = Math.max(
      best.get(ex.name) ?? 0,
      ...ex.sets.filter((x, j) => j !== s && countsForStats(x)).map((x) => x.kg),
    );
    const isPr =
      ex.tracking !== "cardio" &&
      !warm &&
      st.kg > 0 &&
      st.kg > prevBest &&
      (best.get(ex.name) ?? 0) > 0;
    const next = patchSet(session, e, s, { done: true, pr: isPr, at: Date.now() });
    commit(
      paused ||
        editing ||
        (ex.tracking === "cardio" && ex.rest_seconds == null) ||
        !shouldRestAfterGroupedSet(next, e, s)
        ? { ...next, rest: null }
        : startRest(ex.name, ex.rest_seconds ?? restFor(ex.name), next),
    );
    haptic.light();
    sound.tick();
    if (isPr) setPr({ ex: ex.name, kg: st.kg });
    setActive(nextGroupedSet(next, e, s));
  };

  const withUndo = (msg: string, snapshot: LiveSessionState) =>
    toast(msg, { action: { label: tr("Undo"), onClick: () => commit(snapshot) } });
  const removeSet = (e: number, s: number) => {
    const snap = session;
    commit(patchEx(session, e, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== s) })));
    setActive(null);
    haptic.medium();
    withUndo("Set deleted", snap);
  };

  // Remind when rest ends — in the background too.
  useEffect(() => {
    if (!rest || paused || phase !== "live") return;
    const secs = Math.ceil(left / 1000);
    if (left === 0) {
      endRest(false);
      haptic.success();
      sound.chime();
      if (
        document.hidden &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(tr("Rest's up"), {
            body: tr("Next set: {p0}", { p0: rest.ex }),
            tag: "strata-rest",
          });
        } catch {
          /* some browsers only allow service-worker notifications */
        }
      }
    } else if (secs <= 3 && secs !== lastTick.current) {
      lastTick.current = secs;
      haptic.light();
      sound.tick();
    }
  }, [left, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- exercises ---- */
  const addExercise = (n: string, cardio = false) => {
    if (session.exercises.some((x) => x.name.toLowerCase() === n.toLowerCase()))
      return void toast("Already in this session");
    const p = last.get(n);
    const f = session.lighter ? 0.9 : 1;
    commit({
      ...session,
      exercises: [
        ...session.exercises,
        {
          name: n,
          ...(cardio ? { tracking: "cardio" as const } : {}),
          sets: Array.from({ length: cardio ? 1 : (p?.length ?? 3) }, (_, i) => ({
            kg: cardio ? 0 : roundPlate((p?.[i]?.weight ?? 0) * f),
            reps: cardio ? 0 : (p?.[i]?.reps ?? 8),
            ...(cardio ? { cardio: {} } : {}),
            done: false,
          })),
        },
      ],
    });
    pushRecent(n);
  };
  const exAt = exMenu != null ? session.exercises[exMenu] : undefined;
  const setAt = target ? session.exercises[target.e]?.sets[target.s] : undefined;

  /* ---- numbers ---- */
  const allDone = session.exercises
    .filter((e) => !e.skipped)
    .flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ ...s, ex: e.name })));
  const doneSets = allDone.filter((s) => countsForStats(s));
  const vol = doneSets.reduce((a, s) => a + s.kg * s.reps, 0);
  const prs = doneSets.filter((s) => s.pr);
  const nDone = doneCount(session);
  const nOpen = unfinishedCount(session);
  const elapsed = elapsedClock(elapsedMs(session, now));
  const mins = durationMin(session, session.savedAt ?? now);

  const ctx: RowCtx = {
    cur,
    setActive,
    toggle,
    setVal,
    removeSet,
    addSet: (e) =>
      commit(
        patchEx(session, e, (x) => ({
          ...x,
          sets: [
            ...x.sets,
            x.tracking === "cardio"
              ? { kg: 0, reps: 0, done: false, cardio: {} }
              : { kg: x.sets.at(-1)?.kg ?? 0, reps: x.sets.at(-1)?.reps ?? 8, done: false },
          ],
        })),
      ),
    applyAll: (e, kg, reps) =>
      commit(
        patchEx(session, e, (x) => ({
          ...x,
          sets: x.sets.map((y) => (y.done ? y : { ...y, kg, reps })),
        })),
      ),
    openKeypad: (t) => (setTarget(t), setSheet("keypad")),
    openSetMenu: (t) => (setTarget(t), setNoteFor(null), setSheet("setMenu")),
    substitute: (e, name) => {
      const original = session.exercises[e];
      if (!original || original.sets.some((set) => set.done)) return;
      if (
        session.exercises.some(
          (ex, index) => index !== e && ex.name.toLowerCase() === name.toLowerCase(),
        )
      )
        return void toast("Already in this session");
      commit(
        patchEx(session, e, (ex) => ({
          ...ex,
          name,
          catalogue_id: undefined,
          targetWeight: undefined,
          sets: ex.sets.map((set) => ({ ...set, kg: 0 })),
          substitutions: [original.name, ...(ex.substitutions ?? []).filter((n) => n !== name)],
        })),
      );
      toast("Alternative selected. Set a suitable load before starting.");
    },
    openExMenu: (e) => (setExMenu(e), setNoteFor(null), setSheet("exMenu")),
    restore: (e) => commit(patchEx(session, e, (x) => ({ ...x, skipped: false }))),
    last,
    lighter: !!session.lighter,
  };

  const finish = () => {
    if (nDone === 0) return;
    if (nOpen > 0) return setSheet("unfinished");
    close();
    setPhase("review");
  };
  const toReview = (s: LiveSessionState) => (commit(s), close(), setPhase("review"));
  const endOpen =
    sheet === "end" || sheet === "unfinished" || sheet === "discard" || sheet === "away";

  const restPill = rest && phase === "live" && (
    <motion.div
      layout
      key="island"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1, scale: left <= 3000 && !paused ? [1, 1.04, 1] : 1 }}
      exit={{ y: -40, opacity: 0, transition: { duration: 0.14 } }}
      transition={{ type: "spring", stiffness: 380, damping: 38, scale: { duration: 0.32 } }}
      className="absolute left-1/2 top-2 z-20 -translate-x-1/2 overflow-hidden rounded-full border border-border bg-popover"
      style={{ borderRadius: 999 }}
    >
      <motion.div layout className={cn("flex items-center", islandOpen ? "gap-2 p-1.5 pl-3" : "")}>
        <button
          type="button"
          onClick={() => setIslandOpen((o) => !o)}
          role="timer"
          aria-live="polite"
          aria-label={tr("Rest {p0} left{p1}. Tap to {p2}", {
            p0: clock(left),
            p1: paused ? `, ${tr("Paused")}` : "",
            p2: islandOpen ? "collapse" : "expand",
          })}
          className={cn("flex items-center gap-2", !islandOpen && "h-10 px-4")}
        >
          {paused ? (
            <Pause className="size-4 text-muted-foreground" />
          ) : (
            <Timer className={cn("size-4 text-volt", left <= 3000 && "animate-pulse")} />
          )}
          <motion.span
            layout
            className={cn(
              "num font-bold",
              islandOpen ? "text-title" : "text-label",
              paused && "text-muted-foreground",
            )}
          >
            {clock(left)}
          </motion.span>
        </button>
        {islandOpen && (
          <>
            <button
              type="button"
              onClick={() => nudgeRest(-15)}
              className="grid min-h-[40px] place-items-center rounded-full bg-surface-2 px-3 text-label font-semibold"
            >
              <Message source="−15s" />
            </button>
            <button
              type="button"
              onClick={() => nudgeRest(15)}
              className="grid min-h-[40px] place-items-center rounded-full bg-surface-2 px-3 text-label font-semibold"
            >
              <Message source="+15s" />
            </button>
            <button
              type="button"
              aria-label={tr("Skip rest")}
              onClick={() => endRest(true)}
              className="flex min-h-[40px] items-center gap-1 rounded-full bg-primary px-3 text-label font-bold text-primary-foreground"
            >
              <SkipForward className="size-4" /> <Message source="Skip" />
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );

  const pillPress = useLongPress(() => setSheet("quick"), 500);

  return (
    <>
      <AnimatePresence>
        {minimized && (
          <motion.div
            key="pill"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-x-0 bottom-[calc(164px+env(safe-area-inset-bottom))] z-40 mx-auto w-max max-w-[min(424px,calc(100%_-_24px))]"
          >
            <AnimatePresence>
              {sheet === "quick" && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                  className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 gap-2 rounded-full border border-border bg-popover p-1.5"
                  role="menu"
                  aria-label={tr("Session quick actions")}
                >
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => (paused ? doResume() : doPause(), close())}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-surface-2 px-4 text-label font-semibold"
                  >
                    {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                    {paused ? tr("Resume") : tr("Pause")}
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => (setMinimized(false), setSheet("end"))}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-destructive/15 px-4 text-label font-semibold text-destructive"
                  >
                    <Square className="size-4" /> <Message source="End" />
                  </button>
                  <button
                    type="button"
                    aria-label={tr("Close quick actions")}
                    onClick={close}
                    className="grid size-11 place-items-center rounded-full"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full p-1",
                paused ? "bg-surface-2 text-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              <motion.button
                type="button"
                whileTap={springPress}
                {...pillPress.handlers}
                onClick={() => !pillPress.fired.current && setMinimized(false)}
                aria-label={tr("Open live session, {p0} {p1}. Hold for quick actions", {
                  p0: tr(paused ? "Paused" : "Running"),
                  p1: elapsed,
                })}
                className="flex min-h-11 min-w-0 flex-1 select-none flex-wrap items-center gap-x-2.5 gap-y-1 py-2 pl-4 pr-2 text-label font-bold"
              >
                {paused ? (
                  <Pause className="size-4 shrink-0" />
                ) : (
                  <span className="relative flex size-2.5 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground/60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-primary-foreground" />
                  </span>
                )}
                {paused ? tr("Paused") : tr("Session")} <span className="num">{elapsed}</span>
                {rest && (
                  <span
                    className={cn(
                      "num rounded-full px-2 py-0.5",
                      paused ? "bg-background/40" : "bg-primary-foreground/15",
                    )}
                  >
                    <Message source="rest {p0}" values={{ p0: clock(left) }} />
                  </span>
                )}
              </motion.button>
              {!editing && (
                <button
                  type="button"
                  onClick={paused ? doResume : doPause}
                  aria-label={paused ? tr("Resume session") : tr("Pause session")}
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full",
                    paused ? "bg-primary text-primary-foreground" : "bg-primary-foreground/15",
                  )}
                >
                  {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col overflow-hidden bg-background"
            role="dialog"
            aria-label={editing ? tr("Edit workout") : tr("Live workout session")}
            onPointerDownCapture={touch}
          >
            <motion.div
              className="flex min-h-0 flex-1 flex-col"
              animate={{
                scale: endOpen && !reduce ? 0.96 : 1,
                opacity: endOpen && reduce ? 0.6 : 1,
              }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <AnimatePresence>{phase === "live" && restPill}</AnimatePresence>

              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, i) => i.offset.y > 90 && setMinimized(true)}
                className={cn(
                  "shrink-0 cursor-grab touch-none border-b border-border px-4 pb-3",
                  rest ? "pt-14" : "pt-2",
                )}
              >
                <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-surface-2" />
                <div className="flex items-center gap-2">
                  <IconButton label={tr("Minimise session")} onClick={() => setMinimized(true)}>
                    <ChevronDown className="size-5" />
                  </IconButton>
                  <div className="min-w-0 flex-1 text-center">
                    <div className="truncate text-label font-semibold text-muted-foreground">
                      {editing
                        ? tr("Editing · {p0}", { p0: presentation.title })
                        : presentation.title}
                    </div>
                    <div className="relative mx-auto w-max">
                      <motion.div
                        className="num text-title-l font-bold leading-none"
                        animate={
                          paused
                            ? reduce
                              ? { opacity: 0.5 }
                              : { opacity: [0.5, 0.25, 0.5] }
                            : { opacity: 1 }
                        }
                        transition={
                          paused && !reduce
                            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                            : { duration: 0.2 }
                        }
                        aria-label={`${paused ? tr("Paused at") : tr("Elapsed")} ${elapsed}`}
                      >
                        {editing ? tr("{p0} min", { p0: mins }) : elapsed}
                      </motion.div>
                      <AnimatePresence>
                        {flash > 0 && (
                          <motion.span
                            key={flash}
                            aria-hidden
                            className="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-[14px] bg-primary/40"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <motion.button
                    whileTap={springPress}
                    onClick={() => setSheet("end")}
                    className="min-h-[44px] rounded-full bg-primary px-4 text-label font-bold text-primary-foreground shadow-glow"
                  >
                    {editing ? tr("Save") : tr("End")}
                  </motion.button>
                </div>
                {!editing && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={paused ? doResume : doPause}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-surface-2 px-4 text-label font-semibold"
                    >
                      {paused ? <Play className="size-4" /> : <Pause className="size-4" />}{" "}
                      {paused ? tr("Resume") : tr("Pause")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        rest
                          ? setIslandOpen(true)
                          : commit(
                              startRest(
                                session.exercises[cur?.e ?? 0]?.name ?? "Rest",
                                session.exercises[cur?.e ?? 0]?.rest_seconds ??
                                  restFor(session.exercises[cur?.e ?? 0]?.name ?? "Rest"),
                              ),
                            )
                      }
                      className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-surface-2 px-4 text-label font-semibold"
                    >
                      <Timer className="size-4" /> {rest ? tr("Resting") : tr("Rest")}
                    </button>
                    <IconButton
                      label={soundPref ? tr("Turn sounds off") : tr("Turn sounds on")}
                      onClick={() => setSoundPref(!soundPref)}
                    >
                      {soundPref ? (
                        <Volume2 className="size-5" />
                      ) : (
                        <VolumeX className="size-5 text-muted-foreground" />
                      )}
                    </IconButton>
                  </div>
                )}
                {session.lighter && !editing && (
                  <div className="mt-2 flex justify-center">
                    <Tag tone="muted">
                      <Feather className="size-3" /> <Message source="Lighter day · weights −10%" />
                    </Tag>
                  </div>
                )}
                <div className="num mt-3 grid grid-cols-3 text-center text-caption text-muted-foreground">
                  <div>
                    <span className="block text-label font-bold text-foreground">
                      <Rolling value={doneSets.length} format={(n) => String(Math.round(n))} />
                    </span>
                    {countNoun(doneSets.length, "sets")}
                  </div>
                  <div>
                    <span className="block text-label font-bold text-foreground">
                      <Rolling value={vol} format={(n) => volumeText(Math.round(n))} />
                    </span>
                    <Message source="volume" />
                  </div>
                  <div>
                    <span
                      className={cn(
                        "block text-label font-bold",
                        prs.length ? "text-volt" : "text-foreground",
                      )}
                    >
                      {prs.length}
                    </span>
                    <Message source="PRs" />
                  </div>
                </div>
              </motion.div>

              <AnimatePresence initial={false}>
                {paused && (
                  <motion.div
                    key="paused"
                    initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    className="shrink-0 overflow-hidden border-b border-border bg-surface"
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="num text-title font-bold">
                          <Message
                            source="Paused · {p0}"
                            values={{ p0: elapsedClock(now - (session.pausedAt ?? now)) }}
                          />
                        </div>
                        <div className="text-caption text-muted-foreground">
                          <Message source="Timer and rest are frozen. Sets stay editable." />
                        </div>
                      </div>
                      <motion.button
                        whileTap={springPress}
                        onClick={doResume}
                        className="flex h-14 items-center gap-2 rounded-full bg-volt-gradient px-6 font-semibold text-primary-foreground"
                      >
                        <Play className="size-5" /> <Message source="Resume" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-40 pt-3">
                <Reorder.Group
                  axis="y"
                  values={session.exercises}
                  onReorder={(x) => (commit({ ...session, exercises: x }), setActive(null))}
                  className="p-0"
                >
                  <AnimatePresence initial={false}>
                    {session.exercises.map((ex, e) => (
                      <ExerciseCard
                        key={ex.name}
                        ex={ex}
                        display={presentation.exercises[e]!}
                        e={e}
                        c={ctx}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
                {session.exercises.length > 0 && (
                  <p className="mb-3 text-center text-caption text-muted-foreground">
                    <Message source="Tap a number to type it · hold a set for options · swipe left to delete" />
                  </p>
                )}
                <SheetBtn
                  onClick={() => (setAddingCardio(false), setReplacing(null), setSheet("picker"))}
                  icon={<Plus className="size-5 text-volt" />}
                >
                  <Message source="Add exercise" />
                </SheetBtn>
                <div className="mt-2">
                  <SheetBtn
                    onClick={() => (setAddingCardio(true), setReplacing(null), setSheet("picker"))}
                    icon={<Plus className="size-5 text-pulse" />}
                  >
                    {tr("Add cardio")}
                  </SheetBtn>
                </div>
                {session.exercises.length === 0 && (
                  <p className="mt-3 px-2 text-center text-label text-muted-foreground">
                    <Message source="Pick your first exercise to start logging sets." />
                  </p>
                )}
              </div>
            </motion.div>

            {/* keypad */}
            <BottomCard
              open={sheet === "keypad" && !!setAt}
              onClose={close}
              title={target?.field === "reps" ? tr("Reps") : tr("Weight")}
            >
              {setAt && target && (
                <Keypad
                  key={`${target.e}-${target.s}-${target.field}`}
                  initial={target.field === "reps" ? setAt.reps : setAt.kg}
                  unit={target.field === "reps" ? "reps" : tr("kg")}
                  onDone={(n) => (
                    setVal(target.e, target.s, target.field === "reps" ? { reps: n } : { kg: n }),
                    close()
                  )}
                  {...(target.field !== "reps" ? { onPlates: () => setSheet("plates") } : {})}
                />
              )}
            </BottomCard>

            {/* plate calculator */}
            <BottomCard
              open={sheet === "plates" && !!setAt}
              onClose={close}
              title={tr("Plate calculator")}
            >
              {setAt &&
                target &&
                (() => {
                  const { out, rest: rem } = platesFor(setAt.kg);
                  return (
                    <>
                      <Barbell kg={setAt.kg} />
                      <div className="mt-3 text-center">
                        <div className="num text-title-l font-bold">
                          {setAt.kg}
                          <span className="ml-1 text-label text-muted-foreground">
                            <Message source="kg" />
                          </span>
                        </div>
                        <p className="mt-1 text-label text-muted-foreground">
                          {setAt.kg < 20
                            ? tr("Lighter than an empty 20 kg bar.")
                            : out.length
                              ? tr("20 kg bar + {p0} kg each side", { p0: out.join(" · ") })
                              : tr("Empty 20 kg bar")}
                          {rem > 0 && tr(" · {p0} kg can't be loaded", { p0: rem })}
                        </p>
                      </div>
                      <div className="mt-4">
                        <Stepper
                          label={tr("Weight")}
                          unit="kg"
                          value={setAt.kg}
                          step={2.5}
                          onChange={(v) => setVal(target.e, target.s, { kg: v })}
                        />
                      </div>
                      <div className="mt-5">
                        <SheetBtn onClick={close}>
                          <Message source="Done" />
                        </SheetBtn>
                      </div>
                    </>
                  );
                })()}
            </BottomCard>

            {/* set menu */}
            <BottomCard
              open={sheet === "setMenu" && !!setAt}
              onClose={close}
              title={target ? tr("Set {p0}", { p0: target.s + 1 }) : tr("Set")}
            >
              {setAt && target && (
                <div className="space-y-3">
                  <div
                    className="grid grid-cols-2 gap-2"
                    role="radiogroup"
                    aria-label={tr("Set type")}
                  >
                    {SET_TYPES.map((t) => {
                      const on = (setAt.type ?? "working") === t.type;
                      return (
                        <motion.button
                          key={t.type}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          whileTap={springPress}
                          onClick={() => (
                            setVal(target.e, target.s, { type: t.type }),
                            haptic.light(),
                            close()
                          )}
                          className={cn(
                            "min-h-[52px] rounded-[14px] text-label font-semibold",
                            on ? "bg-foreground text-background" : "bg-surface-2",
                          )}
                        >
                          {tr(t.label)}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-caption text-muted-foreground">
                    <Message source="Warm-ups don't count toward volume or records and aren't saved." />
                  </p>
                  {noteFor === "set" ? (
                    <NoteEditor
                      value={noteDraft}
                      onChange={setNoteDraft}
                      onSave={() => (
                        setVal(target.e, target.s, { note: noteDraft.trim() }),
                        close()
                      )}
                    />
                  ) : (
                    <SheetBtn
                      onClick={() => (setNoteDraft(setAt.note ?? ""), setNoteFor("set"))}
                      icon={<StickyNote className="size-5" />}
                    >
                      {setAt.note ? tr("Edit note") : tr("Add note")}
                    </SheetBtn>
                  )}
                  <SheetBtn
                    tone="danger"
                    onClick={() => (removeSet(target.e, target.s), close())}
                    icon={<Trash2 className="size-5" />}
                  >
                    <Message source="Delete set" />
                  </SheetBtn>
                </div>
              )}
            </BottomCard>

            {/* exercise menu */}
            <BottomCard
              open={sheet === "exMenu" && !!exAt}
              onClose={close}
              title={exAt ? programExerciseName(exAt) : tr("Exercise")}
            >
              {exAt && exMenu != null && (
                <div className="space-y-2">
                  {noteFor === "ex" ? (
                    <NoteEditor
                      value={noteDraft}
                      onChange={setNoteDraft}
                      onSave={() => (
                        commit(patchEx(session, exMenu, (x) => ({ ...x, note: noteDraft.trim() }))),
                        close()
                      )}
                    />
                  ) : (
                    <>
                      <SheetBtn
                        onClick={() => {
                          const snap = session;
                          commit(patchEx(session, exMenu, (x) => ({ ...x, skipped: !x.skipped })));
                          close();
                          if (!exAt.skipped)
                            withUndo(
                              tr("{name} skipped", { name: programExerciseName(exAt) }),
                              snap,
                            );
                        }}
                        icon={<SkipForward className="size-5" />}
                      >
                        {exAt.skipped ? tr("Restore") : tr("Skip")}
                      </SheetBtn>
                      <SheetBtn
                        onClick={() => (setReplacing(exMenu), setSheet("picker"))}
                        icon={<Replace className="size-5" />}
                      >
                        <Message source="Replace" />
                      </SheetBtn>
                      <SheetBtn
                        onClick={() => (setNoteDraft(exAt.note ?? ""), setNoteFor("ex"))}
                        icon={<StickyNote className="size-5" />}
                      >
                        {exAt.note ? tr("Edit note") : tr("Add note")}
                      </SheetBtn>
                      <div className="pt-2">
                        <div className="eyebrow mb-2">
                          <Message source="Rest time for this exercise" />
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[60, 90, 120, 180, 240].map((r) => {
                            const on = (exAt.rest_seconds ?? restFor(exAt.name)) === r;
                            return (
                              <button
                                key={r}
                                type="button"
                                aria-pressed={on}
                                onClick={() => (
                                  commit(
                                    patchEx(session, exMenu, (x) => ({ ...x, rest_seconds: r })),
                                  ),
                                  haptic.light()
                                )}
                                className={cn(
                                  "num min-h-[48px] rounded-[14px] text-label font-bold",
                                  on ? "bg-foreground text-background" : "bg-surface-2",
                                )}
                              >
                                {r < 120 ? tr("{p0}s", { p0: r }) : tr("{p0}m", { p0: r / 60 })}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="pt-2">
                        <SheetBtn
                          tone="danger"
                          onClick={() => {
                            const snap = session;
                            commit({
                              ...session,
                              exercises: session.exercises.filter((_, i) => i !== exMenu),
                            });
                            close();
                            setActive(null);
                            haptic.medium();
                            withUndo(
                              tr("{name} removed", { name: programExerciseName(exAt) }),
                              snap,
                            );
                          }}
                          icon={<Trash2 className="size-5" />}
                        >
                          <Message source="Remove" />
                        </SheetBtn>
                      </div>
                    </>
                  )}
                </div>
              )}
            </BottomCard>

            {/* exercise picker */}
            <BottomCard
              tall
              open={sheet === "picker"}
              onClose={close}
              title={
                replacing != null
                  ? tr("Replace {p0}", { p0: session.exercises[replacing]?.name ?? "" })
                  : tr("Add exercise")
              }
            >
              <ExercisePicker
                history={[...best.keys()]}
                onPick={(n) => {
                  if (replacing != null) {
                    if (
                      session.exercises.some(
                        (x, i) => i !== replacing && x.name.toLowerCase() === n.toLowerCase(),
                      )
                    )
                      return void toast("Already in this session");
                    commit(patchEx(session, replacing, (x) => ({ ...x, name: n })));
                    pushRecent(n);
                  } else addExercise(n, addingCardio);
                  haptic.light();
                  close();
                }}
              />
            </BottomCard>

            {/* end */}
            <BottomCard
              open={sheet === "end"}
              onClose={close}
              title={editing ? tr("Save your changes?") : tr("End this session?")}
            >
              <div className="space-y-2">
                <SheetBtn
                  tone="primary"
                  disabled={nDone === 0}
                  onClick={finish}
                  icon={<Check className="size-5" />}
                >
                  {editing ? tr("Save changes") : tr("Finish & save")}
                </SheetBtn>
                {nDone === 0 && (
                  <p className="pb-1 text-center text-label text-muted-foreground">
                    <Message source="Complete at least one set to save this session." />
                  </p>
                )}
                <SheetBtn onClick={close}>
                  {editing ? tr("Keep editing") : tr("Keep training")}
                </SheetBtn>
                <SheetBtn tone="danger" onClick={() => (editing ? onClose() : setSheet("discard"))}>
                  {editing ? tr("Discard changes") : tr("Discard")}
                </SheetBtn>
              </div>
            </BottomCard>

            <BottomCard
              open={sheet === "unfinished"}
              onClose={close}
              title={tr("{p0} set{p1} not done", { p0: nOpen, p1: nOpen === 1 ? "" : "s" })}
            >
              <p className="mb-4 text-body text-muted-foreground">
                <Message source="Only completed sets are saved. What should happen to the rest?" />
              </p>
              <div className="space-y-2">
                <SheetBtn onClick={() => toReview(markAllDone(session, Date.now()))}>
                  <Message source="Mark all done" />
                </SheetBtn>
                <SheetBtn onClick={() => toReview(removeUnfinished(session))}>
                  <Message source="Remove them" />
                </SheetBtn>
                <SheetBtn onClick={close}>
                  <Message source="Go back" />
                </SheetBtn>
              </div>
            </BottomCard>

            <BottomCard
              open={sheet === "discard"}
              onClose={close}
              title={tr("Discard this session?")}
            >
              <p className="text-body text-muted-foreground">
                {nDone
                  ? tr("{p0} logged set{p1} will be lost.", {
                      p0: nDone,
                      p1: nDone === 1 ? "" : "s",
                    })
                  : tr("Nothing has been logged yet.")}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <SheetBtn onClick={close}>
                  <Message source="Keep training" />
                </SheetBtn>
                <motion.button
                  whileTap={springPress}
                  onClick={() => (haptic.error(), onClose())}
                  className="h-14 rounded-full bg-destructive font-semibold text-destructive-foreground"
                >
                  <Message source="Discard" />
                </motion.button>
              </div>
            </BottomCard>

            <BottomCard
              open={sheet === "away" && paused}
              onClose={close}
              title={tr("You were away {p0} min", { p0: Math.max(10, Math.round(away / 60000)) })}
            >
              <p className="mb-4 text-body text-muted-foreground">
                <Message source="We paused your session so the break doesn't count. Resume or end the session?" />
              </p>
              <div className="space-y-2">
                <SheetBtn tone="primary" onClick={doResume} icon={<Play className="size-5" />}>
                  <Message source="Resume" />
                </SheetBtn>
                <SheetBtn onClick={() => setSheet("end")}>
                  <Message source="End session" />
                </SheetBtn>
              </div>
            </BottomCard>

            {/* PR moment */}
            <AnimatePresence>
              {pr && <PrMoment key="pr" exercise={pr.ex} kg={pr.kg} onDone={() => setPr(null)} />}
            </AnimatePresence>

            {/* review → saved */}
            <AnimatePresence>
              {phase !== "live" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 flex flex-col overflow-y-auto bg-background px-5 pb-8 pt-4"
                >
                  {phase === "saved" && <StrataBands />}
                  <div className="flex items-center justify-between">
                    {phase === "review" ? (
                      <IconButton label={tr("Back to session")} onClick={() => setPhase("live")}>
                        <X className="size-5" />
                      </IconButton>
                    ) : (
                      <span />
                    )}
                  </div>
                  <div className="eyebrow mt-4">
                    {phase === "saved"
                      ? editing
                        ? tr("Changes saved")
                        : tr("Session saved")
                      : tr("Review")}
                  </div>
                  <h2 className="font-display text-title-l font-extrabold">{presentation.title}</h2>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {[
                      {
                        l: "Duration",
                        v:
                          phase === "saved" ? (
                            <CountUp to={mins} suffix="min" delay={0.6} />
                          ) : (
                            <span className="num">
                              {mins}
                              <span className="ml-1 text-label text-muted-foreground">
                                <Message source="min" />
                              </span>
                            </span>
                          ),
                      },
                      {
                        l: "Volume",
                        v:
                          phase === "saved" ? (
                            <CountUp
                              to={vol >= 1000 ? vol / 1000 : vol}
                              decimals={vol >= 1000 ? 1 : 0}
                              suffix={vol >= 1000 ? "t" : tr("kg")}
                              delay={0.8}
                            />
                          ) : (
                            <span className="num">{volumeText(vol)}</span>
                          ),
                      },
                      {
                        l: "Sets",
                        v:
                          phase === "saved" ? (
                            <CountUp to={doneSets.length} delay={1.0} />
                          ) : (
                            <span className="num">{doneSets.length}</span>
                          ),
                      },
                      {
                        l: "PRs",
                        v: (
                          <span className={prs.length ? "text-volt" : ""}>
                            {phase === "saved" ? (
                              <CountUp to={prs.length} delay={1.2} />
                            ) : (
                              prs.length
                            )}
                          </span>
                        ),
                      },
                    ].map((x) => (
                      <div key={x.l} className="tile p-4">
                        <div className="eyebrow">{tr(x.l)}</div>
                        <div className="mt-1 text-title-l font-bold">{x.v}</div>
                      </div>
                    ))}
                  </div>
                  {session.exercises.some(
                    (ex) => ex.tracking === "cardio" && ex.sets.some((set) => set.done),
                  ) && (
                    <section className="mt-4 space-y-3">
                      <h3 className="font-semibold">{tr("Recorded cardio")}</h3>
                      {session.exercises
                        .filter((ex) => !ex.skipped && ex.tracking === "cardio")
                        .map((ex, index) => (
                          <div key={index} className="rounded-tile border border-border p-3">
                            <p className="mb-2 font-semibold">{programExerciseName(ex)}</p>
                            {ex.sets
                              .filter((set) => set.done)
                              .map((set, i) => (
                                <div key={i} className="mt-2 border-t border-border pt-2">
                                  <CardioReadout value={set.cardio} />
                                </div>
                              ))}
                          </div>
                        ))}
                    </section>
                  )}
                  {allDone.length > doneSets.length && (
                    <p className="mt-2 text-caption text-muted-foreground">
                      <Message
                        source="{p0}warm-up set {p1}not counted or saved."
                        values={{
                          p0: allDone.length - doneSets.length,
                          p1: allDone.length - doneSets.length === 1 ? "" : "s",
                        }}
                      />
                    </p>
                  )}
                  {prs.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {prs.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-label">
                          <Trophy className="size-4 text-volt" /> {p.ex} ·{" "}
                          <span className="num font-bold text-volt">
                            <Message source="{p0}kg × {p1}" values={{ p0: p.kg, p1: p.reps }} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {phase === "saved" && (
                    <div className="tile mt-4 p-4">
                      <div className="eyebrow mb-3">
                        <Message source="Muscles worked" />
                      </div>
                      <BodyMap exercises={[...new Set(doneSets.map((s) => s.ex))]} />
                    </div>
                  )}
                  {phase === "review" && (
                    <>
                      <div className="mt-7 flex items-baseline justify-between">
                        <span className="eyebrow">
                          <Message source="How hard was it?" />
                        </span>
                        <span className="num text-label font-bold">
                          <Message source="RPE {p0}" values={{ p0: rpe }} />
                        </span>
                      </div>
                      <div
                        className="mt-2 grid grid-cols-5 gap-2"
                        role="radiogroup"
                        aria-label={tr("Session effort")}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <motion.button
                            key={n}
                            whileTap={springPress}
                            role="radio"
                            aria-checked={rpe === n}
                            onClick={() => (setRpe(n), haptic.light())}
                            className={cn(
                              "num min-h-[48px] rounded-[14px] text-body font-bold",
                              rpe === n
                                ? "bg-foreground text-background"
                                : "bg-surface text-muted-foreground",
                            )}
                          >
                            {n}
                          </motion.button>
                        ))}
                      </div>
                      <p className="mt-2 text-center text-label text-muted-foreground">
                        {tr((cardioOnly ? cardioEffortAnchors : rpeAnchors)[rpe] ?? "")}
                      </p>
                    </>
                  )}
                  <div className="mt-auto space-y-2 pt-8">
                    {phase === "review" ? (
                      <SaveButton
                        onSave={() =>
                          save
                            .mutateAsync({ ...session, rpe })
                            .catch(
                              (e) => (
                                toast.error(errorText((e as Error).message)),
                                haptic.error(),
                                Promise.reject(e)
                              ),
                            )
                        }
                        onDone={() => {
                          setSession({
                            ...session,
                            rpe,
                            savedAt: Date.now(),
                            rest: null,
                            pausedAt: session.pausedAt ?? Date.now(),
                          });
                          setPhase("saved");
                          haptic.success();
                          sound.chime();
                        }}
                      >
                        {editing ? tr("Save changes") : tr("Save session")}
                      </SaveButton>
                    ) : (
                      <>
                        <motion.button
                          whileTap={springPress}
                          onClick={async () => {
                            const r = await shareSession({
                              title: session.title,
                              duration: `${mins} min`,
                              volume: volumeText(vol),
                              sets: doneSets.length,
                              prs: prs.map((p) => ({ ex: p.ex, kg: p.kg, reps: p.reps })),
                            });
                            if (r === "downloaded")
                              toast.success(tr("Share card saved"), {
                                description: "Find it in your downloads",
                              });
                          }}
                          className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface font-semibold"
                        >
                          <Share2 className="size-5" /> <Message source="Share card" />
                        </motion.button>
                        <SheetBtn tone="primary" onClick={onClose}>
                          <Message source="Done" />
                        </SheetBtn>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NoteEditor({
  value,
  onChange,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
}) {
  useLanguage();
  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        rows={3}
        placeholder={tr("e.g. Felt the left knee, use belt next time")}
        aria-label={tr("Note")}
        className="w-full rounded-[14px] border border-input bg-surface p-3 text-body"
      />
      <SheetBtn tone="primary" onClick={onSave}>
        <Message source="Save note" />
      </SheetBtn>
    </div>
  );
}
