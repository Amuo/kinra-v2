import { displayNumber } from "@/lib/i18n";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useState, type PointerEvent } from "react";
import { format } from "@/lib/i18n";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { weightPoints, type WeightRange } from "@/lib/progress";
import type { BodyMetric } from "@/lib/types";

export function WeightChart({
  metrics,
  range = "All",
}: {
  metrics: BodyMetric[];
  range?: WeightRange;
}) {
  useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const points = weightPoints(metrics, range);
  const selected = points.find((point) => point.id === selectedId) ?? points.at(-1);
  if (!selected)
    return (
      <div className="flex items-center gap-3 py-8 text-label text-muted-foreground">
        <Scale className="size-5 shrink-0" />
        <Message source="No weigh-ins in this period." />
      </div>
    );
  const lo =
    Math.floor(Math.min(...points.map((point) => Math.min(point.v, point.avg))) * 2) / 2 - 0.5;
  const hi =
    Math.ceil(Math.max(...points.map((point) => Math.max(point.v, point.avg))) * 2) / 2 + 0.5;
  const minTime = points[0]?.t ?? selected.t;
  const maxTime = points.at(-1)?.t ?? selected.t;
  const x = (time: number) =>
    maxTime === minTime ? 168 : 12 + ((time - minTime) / (maxTime - minTime)) * 312;
  const y = (value: number) => 110 - ((value - lo) / (hi - lo)) * 90;
  const raw = points.map((point) => `${x(point.t)},${y(point.v)}`).join(" ");
  const average = points.map((point) => `${x(point.t)},${y(point.avg)}`).join(" ");
  const scrub = (event: PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const target = ((event.clientX - rect.left) / rect.width) * 336;
    const nearest = points.reduce(
      (best, point) =>
        Math.abs(x(point.t) - target) < Math.abs(x(best.t) - target) ? point : best,
      selected,
    );
    setSelectedId(nearest.id);
  };
  return (
    <div aria-label={tr("Weight history")}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4" aria-live="polite">
        <div>
          <div className="eyebrow">{format(selected.t, "EEE, d MMM")}</div>
          <div className="num mt-2 text-display font-bold">
            {displayNumber(selected.v.toFixed(1))}
            <span className="ml-2 text-title text-muted-foreground">
              <Message source="kg" />
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="num text-title font-bold text-pulse">
            {displayNumber(selected.avg.toFixed(1))}
            <span className="ml-1 text-caption text-muted-foreground">
              <Message source="kg" />
            </span>
          </div>
          <div className="mt-1 text-caption text-muted-foreground">
            <Message source="7-day average" />
          </div>
        </div>
      </div>
      <div
        className="relative"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          scrub(event);
        }}
        onPointerMove={scrub}
      >
        <svg
          viewBox="0 0 336 138"
          className="h-[168px] w-full"
          role="img"
          aria-label={tr("Recorded weight and seven-day average in kilograms")}
        >
          <line x1="12" x2="324" y1="110" y2="110" stroke="var(--border)" />
          <polyline
            points={raw}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <polyline
            points={average}
            fill="none"
            stroke="var(--pulse)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line
            x1={x(selected.t)}
            x2={x(selected.t)}
            y1="8"
            y2="110"
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          {points.map((point) => (
            <circle
              key={point.id}
              cx={x(point.t)}
              cy={y(point.v)}
              r={point.id === selected.id ? 4 : 2}
              fill={point.id === selected.id ? "var(--foreground)" : "var(--muted-foreground)"}
            />
          ))}
          <circle cx={x(selected.t)} cy={y(selected.avg)} r="4" fill="var(--pulse)" />
          <text x="12" y="134" fill="var(--muted-foreground)" className="font-mono text-caption">
            {format(minTime, "d MMM")}
          </text>
          <text
            x="324"
            y="134"
            textAnchor="end"
            fill="var(--muted-foreground)"
            className="font-mono text-caption"
          >
            {format(maxTime, "d MMM")}
          </text>
        </svg>
      </div>
      <label className="mt-2 block">
        <span className="sr-only">
          <Message source="Select weigh-in" />
        </span>
        <input
          type="range"
          min={0}
          max={points.length - 1}
          step={1}
          value={points.findIndex((point) => point.id === selected.id)}
          onChange={(event) => setSelectedId(points[Number(event.target.value)]?.id ?? null)}
          aria-valuetext={tr("{p0}, {p1} kg", { p0: format(selected.t, "d MMM"), p1: selected.v })}
          className="h-11 w-full accent-pulse"
        />
      </label>
      <div className="flex items-center justify-between text-caption text-muted-foreground">
        <span>
          <Message source="{p0}weigh-ins in view" values={{ p0: points.length }} />
        </span>
        <Button
          variant="ghost"
          className="h-11 rounded-full px-3 text-caption text-pulse"
          onClick={() => setSelectedId(null)}
        >
          <Message source="Latest" />
        </Button>
      </div>
    </div>
  );
}
