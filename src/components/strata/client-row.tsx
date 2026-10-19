import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { formatDistanceToNow } from "@/lib/i18n";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, TrendingUp, TrendingDown, Minus, ThumbsUp } from "lucide-react";
import { Ring } from "./ui";
import { CoachKudos } from "./coach-kudos";
import { Button } from "@/components/ui/button";
import { COMPLIANCE_TARGET } from "@/lib/coach";
import { trend, within } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function status(pct: number) {
  if (pct >= 0.8) return { label: tr("On track"), bar: "bg-primary", text: "text-volt" };
  if (pct >= 0.5) return { label: tr("Behind"), bar: "bg-ember", text: "text-ember" };
  return { label: tr("At risk"), bar: "bg-destructive", text: "text-destructive" };
}

export function ClientRow({
  r,
  index,
  reasons = [],
  kudos = false,
}: {
  r: {
    id: string;
    display_name: string | null;
    goal: string | null;
    workouts: { performed_at: string; title?: string }[];
    journal?: { mood: number }[];
  };
  index: number;
  reasons?: string[];
  kudos?: boolean;
}) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const dragging = useRef(false);
  const reduced = useReducedMotion();
  const n = r.workouts.filter((w) => within(w.performed_at, 30)).length;
  const pct = Math.min(1, n / COMPLIANCE_TARGET);
  const st = status(pct);
  const last = r.workouts[0];
  const t = trend((r.journal ?? []).map((j) => j.mood));
  const TrendIcon = t === "up" ? TrendingUp : t === "down" ? TrendingDown : Minus;
  return (
    <div className="relative min-w-0">
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-end rounded-card bg-primary/15 pr-5 text-volt"
      >
        <ThumbsUp className="size-6" />
      </div>
      <motion.article
        drag={kudos ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.22}
        onDragStart={() => {
          dragging.current = true;
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -64) setOpen(true);
          setTimeout(() => {
            dragging.current = false;
          }, 120);
        }}
        initial={false}
        transition={{ duration: reduced ? 0 : 0.2, delay: index * 0.02 }}
        className="relative min-w-0 touch-pan-y rounded-card border border-border bg-surface p-4"
      >
        <Link
          draggable={false}
          to="/app/clients/$clientId"
          params={{ clientId: r.id }}
          onClick={(e) => {
            if (dragging.current) e.preventDefault();
          }}
          className="flex min-w-0 items-center gap-3 rounded-tile"
          aria-label={tr("View {p0}", { p0: r.display_name ?? "client" })}
        >
          <div aria-label={tr("{p0}% compliance over 30 days", { p0: Math.round(pct * 100) })}>
            <Ring
              value={pct}
              size={56}
              stroke={4}
              color={
                pct >= 0.8 ? "var(--volt)" : pct >= 0.5 ? "var(--ember)" : "var(--destructive)"
              }
            >
              <span className={cn("num text-label font-bold", st.text)}>
                {Math.round(pct * 100)}
                <span className="text-caption">%</span>
              </span>
            </Ring>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-body font-bold">{r.display_name ?? tr("Client")}</h3>
            <div className="mt-1 break-words text-caption text-muted-foreground">
              {r.goal ?? tr("No goal set")}
            </div>
            <div className={cn("mt-1 text-caption font-semibold", st.text)}>
              {tr(st.label)}{" "}
              <span className="num text-muted-foreground">
                <Message
                  source="· {p0}/{p1}sessions · 30d"
                  values={{ p0: n, p1: COMPLIANCE_TARGET }}
                />
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
        {reasons.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-border pt-3">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-caption text-ember">
                <span aria-hidden>—</span>
                {reason}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <div className="min-w-0 text-caption text-muted-foreground">
            <div>
              {last
                ? tr("Trained {when}", {
                    when: formatDistanceToNow(new Date(last.performed_at), { addSuffix: true }),
                  })
                : tr("No training yet")}
            </div>
            {!!r.journal?.length && (
              <span
                className={cn(
                  "mt-1 flex items-center gap-1",
                  t === "up" ? "text-volt" : t === "down" ? "text-ember" : "",
                )}
                aria-label={tr("Mood trend {p0}", { p0: t })}
              >
                <TrendIcon className="size-3.5" />
                <Message source="Mood {p0}" values={{ p0: t === "flat" ? "steady" : t }} />
              </span>
            )}
          </div>
          {kudos && (
            <Button
              variant="ghost"
              className="h-11 rounded-full px-3 text-label text-volt"
              aria-label={tr("Give kudos to {p0}", { p0: r.display_name ?? "client" })}
              onClick={() => setOpen(true)}
            >
              <ThumbsUp />
              <Message source="Kudos" />
            </Button>
          )}
        </div>
      </motion.article>
      {open && (
        <CoachKudos
          open
          clientId={r.id}
          name={r.display_name}
          workout={last?.title ? { title: last.title } : undefined}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
