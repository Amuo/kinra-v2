import { useState } from "react";
import { format } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { Moon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sleepTimeline } from "@/lib/recover";
import { today } from "@/lib/stats";
import type { SleepLog } from "@/lib/types";

export function RecoverSleep({ sleep, onLog }: { sleep: SleepLog[]; onLog: () => void }) {
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
    <section aria-label="Sleep trend" className="border-b border-border pb-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title font-bold">Your nights</h2>
        <div
          className="flex rounded-full border border-border bg-surface p-1"
          aria-label="Sleep period"
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
              {value} nights
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div aria-live="polite">
          <div className="eyebrow">
            {selected ? format(new Date(`${selected.date}T12:00`), "EEE, d MMM") : "Sleep"}
          </div>
          <div className="num mt-2 text-display font-bold text-dream">
            {selected?.hours?.toFixed(1) ?? "—"}
            <span className="ml-2 text-title text-muted-foreground">h</span>
          </div>
          <div className="mt-2 text-label text-muted-foreground">
            {selected?.quality != null
              ? `Quality ${selected.quality.toFixed(1).replace(/\.0$/, "")} / 5${selected.entries.length > 1 ? ` · average of ${selected.entries.length} logs` : ""}`
              : "No sleep logged"}
          </div>
        </div>
        <div className="text-right">
          <div className="num text-title font-bold">
            {average?.toFixed(1) ?? "—"}
            <span className="ml-1 text-caption text-muted-foreground">h avg</span>
          </div>
          <div className="mt-2 text-caption text-muted-foreground">
            {recorded.length} nights logged · last {days}
          </div>
        </div>
      </div>
      <div className="relative mt-7" onPointerDown={selectAt} onPointerMove={selectAt}>
        <svg
          viewBox="0 -10 336 134"
          className="h-32 w-full overflow-visible"
          role="img"
          aria-label={`Sleep over the last ${days} nights, with an 8 hour goal`}
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
            8 h goal
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
              aria-label={`${format(new Date(`${day.date}T12:00`), "EEE d MMM")}: ${day.hours === null ? "no sleep logged" : `${day.hours.toFixed(1)} hours`}`}
              aria-pressed={selected?.date === day.date}
              onClick={() => setSelectedDate(day.date)}
            />
          ))}
        </div>
      </div>
      <div className="num mt-2 flex justify-between text-caption text-muted-foreground">
        <span>{format(new Date(`${timeline[0]?.date}T12:00`), "d MMM")}</span>
        <span>Today</span>
      </div>
      {!recorded.length && (
        <div className="mt-5 flex items-center gap-3 text-label text-muted-foreground">
          <Moon className="size-5 shrink-0 text-dream" />
          <span>
            {sleep.length
              ? "No nights logged in this period."
              : "Your next good night starts here."}
          </span>
          <Button
            variant="ghost"
            className="ml-auto h-11 shrink-0 rounded-full px-3 text-dream"
            onClick={onLog}
          >
            <Plus />
            Log sleep
          </Button>
        </div>
      )}
    </section>
  );
}
