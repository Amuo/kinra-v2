import { motion, AnimatePresence } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { Check, Loader2, RotateCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/stats";

/* ---------- motion: intro plays once per session ---------- */
let introDone = false;
if (typeof window !== "undefined") setTimeout(() => (introDone = true), 1800);
/** True only during the first app paint; later mounts render final state. */
export function useIntro() {
  return useRef(!introDone).current;
}
export const EASE = [0.22, 1, 0.36, 1] as const;
export const springPress = { scale: 0.97 };

export function Ring({
  value,
  size = 120,
  stroke = 10,
  color = "var(--volt)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const intro = useIntro();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--surface-2)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={intro ? { strokeDashoffset: c } : false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: intro ? 1.1 : 0.4, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Panel({
  className,
  children,
  index = 0,
  onClick,
  label,
}: {
  className?: string;
  children: ReactNode;
  index?: number;
  delay?: number;
  onClick?: (() => void) | undefined;
  label?: string | undefined;
}) {
  const intro = useIntro();
  const stagger = intro && index < 4;
  const common = {
    initial: stagger ? { opacity: 0, y: 8 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: stagger ? index * 0.04 : 0, ease: EASE },
    className: cn("panel block w-full p-4 text-left", className),
  } as const;
  if (onClick)
    return (
      <motion.button
        type="button"
        aria-label={label}
        whileTap={springPress}
        onClick={onClick}
        {...common}
      >
        {children}
      </motion.button>
    );
  return <motion.div {...common}>{children}</motion.div>;
}

export function Stat({
  label,
  value,
  unit,
  tone = "foreground",
  size = "md",
}: {
  label: string;
  value: ReactNode;
  unit?: string | undefined;
  tone?: "foreground" | "volt" | "pulse" | "ember" | "dream";
  size?: "sm" | "md" | "lg";
}) {
  const toneCls = {
    foreground: "text-foreground",
    volt: "text-volt",
    pulse: "text-pulse",
    ember: "text-ember",
    dream: "text-dream",
  }[tone];
  const sz = { sm: "text-title", md: "text-[1.5rem]", lg: "text-title-l" }[size];
  return (
    <div className="min-w-0">
      <div className="text-label font-semibold text-muted-foreground">{label}</div>
      <div
        className={cn(
          "num mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-1 font-bold leading-tight",
          sz,
          toneCls,
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 font-sans text-caption font-semibold text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pb-5 pt-2">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-title-l font-extrabold [font-stretch:112%]">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 grid min-h-[28px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="min-w-0 text-body font-bold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

export function TextAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={springPress}
      onClick={onClick}
      className="-mr-2 min-h-[44px] rounded-full px-2 text-label font-semibold text-primary"
    >
      {children}
    </motion.button>
  );
}

/** Bar chart with tap-to-inspect tooltip. */
export function Bars({
  values,
  max,
  color = "var(--volt)",
  height = 56,
  labels,
  tip,
  goal,
}: {
  values: number[];
  max?: number;
  color?: string;
  height?: number;
  labels?: string[];
  tip?: (i: number) => string;
  goal?: { value: number; label: string };
}) {
  const intro = useIntro();
  const [sel, setSel] = useState<number | null>(null);
  const m = max ?? Math.max(1, ...values, goal?.value ?? 0);
  return (
    <div className="relative">
      <AnimatePresence>
        {sel != null && tip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none mb-3 rounded-tile border border-border bg-surface-2 px-3 py-2 text-label font-semibold text-foreground"
            role="status"
          >
            {tip(sel)}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative flex items-end gap-[3px]" style={{ height }}>
        {goal && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
            style={{ bottom: (goal.value / m) * height }}
          >
            <span className="num absolute -top-4 right-0 text-caption text-muted-foreground">
              {goal.label}
            </span>
          </div>
        )}
        {values.map((v, i) => (
          <button
            type="button"
            key={i}
            aria-label={tip ? tip(i) : `${v}`}
            onClick={() => setSel(sel === i ? null : i)}
            className="flex h-full flex-1 items-end focus-visible:outline-offset-0"
          >
            <motion.span
              className="block w-full rounded-[3px]"
              style={{
                background: v ? color : "var(--surface-2)",
                opacity: sel == null || sel === i ? 1 : 0.4,
              }}
              initial={intro ? { height: 2 } : false}
              animate={{ height: Math.max(3, (v / m) * height) }}
              transition={{
                duration: intro ? 0.6 : 0.25,
                delay: intro ? Math.min(i, 20) * 0.01 : 0,
                ease: EASE,
              }}
            />
          </button>
        ))}
      </div>
      {labels && (
        <div className="mt-3 flex justify-between gap-2">
          {labels.filter(Boolean).map((l, i) => (
            <div key={i} className="num text-caption text-muted-foreground">
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name?: string | null | undefined;
  src?: string | undefined;
  size?: number;
  className?: string | undefined;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 font-display font-bold text-volt ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(13, size * 0.36) }}
    >
      {src && failed !== src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(src)}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel grid-lines flex flex-col items-center px-6 py-10 text-center">
      {icon && (
        <div className="mb-3 grid size-14 place-items-center rounded-full bg-primary/10 text-volt">
          {icon}
        </div>
      )}
      <div className="font-display text-title font-bold">{title}</div>
      {body && <p className="mt-1.5 max-w-xs text-label text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-8 text-center">
      <div className="font-display text-title font-bold">Couldn't load this</div>
      <p className="mt-1 text-label text-muted-foreground">
        {message ?? "Check your connection and try again."}
      </p>
      {onRetry && (
        <motion.button
          whileTap={springPress}
          onClick={onRetry}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-surface-2 px-5 text-label font-semibold"
        >
          <RotateCw className="size-4" /> Retry
        </motion.button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-[14px]", className)} aria-hidden />;
}
export function SkeletonPage() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="mb-3 h-40 w-full !rounded-[20px]" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 !rounded-[20px]" />
        <Skeleton className="h-28 !rounded-[20px]" />
      </div>
      <Skeleton className="mt-3 h-16 w-full !rounded-[20px]" />
      <Skeleton className="mt-2 h-16 w-full !rounded-[20px]" />
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={springPress}
      aria-pressed={!!active}
      {...(onClick ? { onClick } : {})}
      className={cn(
        "min-h-[44px] shrink-0 rounded-full border px-4 text-label font-semibold transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/** Segmented control: equal-width, never scrolls. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex rounded-full border border-border bg-surface p-1", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className="relative min-h-[40px] flex-1 rounded-full px-1 text-label font-semibold"
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join("")}`}
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
            />
          )}
          <span
            className={cn(
              "relative",
              value === o.value ? "text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {o.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export type ScaleOption = { icon: LucideIcon; label: string };
/** 1–5 picker using icons + a word label for the selection. */
export function IconScale({
  value,
  onChange,
  options,
  tone = "text-volt",
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  options: ScaleOption[];
  tone?: string;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        <span className={cn("text-label font-semibold", tone)}>{options[value - 1]?.label}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
        {options.map((o, i) => (
          <motion.button
            type="button"
            role="radio"
            aria-checked={value === i + 1}
            aria-label={o.label}
            key={o.label}
            whileTap={springPress}
            onClick={() => onChange(i + 1)}
            className={cn(
              "grid min-h-[52px] place-items-center rounded-[14px] border transition-colors",
              value === i + 1
                ? cn("border-current bg-current/10", tone)
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            <o.icon className="size-6" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/** Primary save button that morphs into a check before calling onDone. */
export function SaveButton({
  children,
  onSave,
  onDone,
  disabled,
  className,
}: {
  children: ReactNode;
  onSave: () => Promise<unknown>;
  onDone?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [st, setSt] = useState<"idle" | "busy" | "done">("idle");
  return (
    <motion.button
      type="button"
      whileTap={st === "idle" ? springPress : {}}
      disabled={disabled || st !== "idle"}
      onClick={async () => {
        setSt("busy");
        try {
          await onSave();
          setSt("done");
          setTimeout(() => onDone?.(), 550);
        } catch {
          setSt("idle");
        }
      }}
      className={cn(
        "relative mx-auto flex h-14 items-center justify-center overflow-hidden rounded-full bg-volt-gradient font-semibold text-primary-foreground transition-[width,opacity] duration-300 disabled:opacity-60",
        st === "done" ? "w-14 !opacity-100" : "w-full",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {st === "done" ? (
          <motion.span
            key="d"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Check className="size-6" strokeWidth={3} />
          </motion.span>
        ) : st === "busy" ? (
          <motion.span key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader2 className="size-5 animate-spin" />
          </motion.span>
        ) : (
          <motion.span key="i" className="flex items-center gap-2 text-body">
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  className,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={springPress}
      onClick={onClick}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-foreground",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

export function Tag({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "volt" | "ember" | "pulse" | "dream" | "danger";
}) {
  const cls = {
    muted: "bg-surface-2 text-muted-foreground",
    volt: "bg-primary/15 text-volt",
    ember: "bg-ember/15 text-ember",
    pulse: "bg-pulse/15 text-pulse",
    dream: "bg-dream/15 text-dream",
    danger: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold",
        cls,
      )}
    >
      {children}
    </span>
  );
}
