import { displayNumber } from "@/lib/i18n";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useState } from "react";
import { format } from "@/lib/i18n";
import { motion, useReducedMotion } from "motion/react";
import { Moon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sleepTimeline } from "@/lib/recover";
import { today } from "@/lib/stats";
import type { SleepLog } from "@/lib/types";

export function RecoverSleep({ sleep, onLog }: { sleep: SleepLog[]; onLog: () => void }) {
  useLanguage();
  const [days, setDays] = useState(14);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const timeline = sleepTimeline(sleep, today(), days);
  const selected =
    timeline.find((day) => day.date === selectedDate) ??
    [...timeline].reverse().find((day) => day.hours !== null) ??
    timeline[timeline.length - 1];
  const recorded = timeline.filter((day) => day.hours !== null);
  const average = recorded.length
    ? recorded.reduce((sum, day) => sum + (day.hours ?? 0), 0) / recorded.length
    : null;
  const max = Math.max(10, ...timeline.map((day) => day.hours ?? 0));
  const selectAt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.max(
      0,
      Math.min(days - 1, Math.floor(((event.clientX - box.left) / box.width) * days)),
    );
    setSelectedDate(timeline[index]?.date ?? null);
  };
  return (
    <section aria-label={tr("Sleep trend")} className="border-b border-border pb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title font-bold">
          <Message source="Your nights" />
        </h2>
        <div
          className="flex rounded-full border border-border bg-surface p-1"
          aria-label={tr("Sleep period")}
        >
          {[7, 14].map((value) => (
            <Button
              variant="ghost"
              key={value}
              aria-pressed={days === value}
              onClick={() => {
                setDays(value);
                setSelectedDate(null);
              }}
              className={`h-11 rounded-full px-4 text-label ${days === value ? "bg-dream/15 text-dream" : "text-muted-foreground"}`}
            >
              <Message source="{p0} nights" values={{ p0: value }} />
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div aria-live="polite">
          <div className="eyebrow">
            {selected ? format(new Date(`${selected.date}T12:00`), "EEE, d MMM") : tr("Sleep")}
          </div>
          <div className="num mt-2 text-display font-bold text-dream">
            {displayNumber(selected?.hours?.toFixed(1) ?? "—")}
            <span className="ml-2 text-title text-muted-foreground">
              <Message source="h" />
            </span>
          </div>
          <div className="mt-2 text-label text-muted-foreground">
            {selected?.quality != null
              ? tr("Quality {p0} / 5{p1}", {
                  p0: selected.quality.toFixed(1).replace(/\.0$/, ""),
                  p1:
                    selected.entries.length > 1
                      ? tr(" · average of {p0} logs", { p0: selected.entries.length })
                      : "",
                })
              : tr("No sleep logged")}
          </div>
        </div>
        <div className="text-right">
          <div className="num text-title font-bold">
            {displayNumber(average?.toFixed(1) ?? "—")}
            <span className="ml-1 text-caption text-muted-foreground">
              <Message source="h avg" />
            </span>
          </div>
          <div className="mt-2 text-caption text-muted-foreground">
            <Message
              source="Nights logged: {p0} · last {p1}"
              values={{ p0: recorded.length, p1: days }}
            />
          </div>
        </div>
      </div>
      <div className="relative mt-7" onPointerDown={selectAt} onPointerMove={selectAt}>
        <svg
          viewBox="0 -10 336 134"
          className="h-32 w-full overflow-visible"
          role="img"
          aria-label={tr("Sleep over the last {p0} nights, with an 8 hour goal", { p0: days })}
        >
          <line x1="0" x2="336" y1="112" y2="112" stroke="var(--border)" />
          <rect
            x="0"
            y={112 - (8.5 / max) * 100}
            width="336"
            height={(1 / max) * 100}
            fill="var(--dream)"
            opacity="0.08"
          />
          <line
            x1="0"
            x2="336"
            y1={112 - (8 / max) * 100}
            y2={112 - (8 / max) * 100}
            stroke="var(--dream)"
            strokeDasharray="3 4"
            opacity="0.5"
          />
          <text
            x="336"
            y={104 - (8 / max) * 100}
            textAnchor="end"
            fill="var(--muted-foreground)"
            className="font-mono text-caption"
          >
            <Message source="8 h goal" />
          </text>
          {timeline.map((day, i) => (
            <motion.rect
              key={day.date}
              x={(i * 336) / days + 3}
              y={112 - ((day.hours ?? 0) / max) * 100}
              width={336 / days - 6}
              height={day.hours === null ? 2 : (day.hours / max) * 100}
              rx="3"
              fill={day.hours === null ? "var(--surface-2)" : "var(--dream)"}
              initial={false}
              animate={{ opacity: selected?.date === day.date ? 1 : 0.45 }}
              transition={{ duration: reduce ? 0 : 0.12 }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex">
          {timeline.map((day) => (
            <Button
              variant="ghost"
              key={day.date}
              className="h-full min-w-0 flex-1 rounded-none p-0 hover:bg-dream/10"
              aria-label={`${format(new Date(`${day.date}T12:00`), "EEE d MMM")}: ${day.hours === null ? tr("no sleep logged") : tr("{p0} hours", { p0: day.hours })}`}
              aria-pressed={selected?.date === day.date}
              onClick={() => setSelectedDate(day.date)}
            />
          ))}
        </div>
      </div>
      <div className="num mt-2 flex justify-between text-caption text-muted-foreground">
        <span>{format(new Date(`${timeline[0]?.date}T12:00`), "d MMM")}</span>
        <span>
          <Message source="Today" />
        </span>
      </div>
      {!recorded.length && (
        <div className="mt-5 flex items-center gap-3 text-label text-muted-foreground">
          <Moon className="size-5 shrink-0 text-dream" />
          <span>
            {sleep.length
              ? tr("No nights logged in this period.")
              : tr("Your next good night starts here.")}
          </span>
          <Button
            variant="ghost"
            className="ml-auto h-11 shrink-0 rounded-full px-3 text-dream"
            onClick={onLog}
          >
            <Plus />
            <Message source="Log sleep" />
          </Button>
        </div>
      )}
    </section>
  );
}
