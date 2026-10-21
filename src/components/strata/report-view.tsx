import { t as tr, useLanguage, Message, displayNumber } from "@/lib/i18n";
import { format } from "@/lib/i18n";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  TriangleAlert,
  Trophy,
  MessageSquareQuote,
} from "lucide-react";
import type { ProgressPhoto, ReportSummary } from "@/lib/types";
import { fmtK, fmtVolume } from "@/lib/stats";
import { Panel, Ring, Stat } from "./ui";
import { CompareSlider } from "./photos";

export function ReportView({
  s,
  comment,
  coach,
  photos,
}: {
  s: ReportSummary;
  comment?: string | null;
  coach?: string | null | undefined;
  photos?: ProgressPhoto[];
}) {
  useLanguage();
  const wDelta =
    s.weightStart != null && s.weightEnd != null ? +(s.weightEnd - s.weightStart).toFixed(1) : null;
  const sessDelta = s.sessions - s.prevSessions;
  const front =
    photos?.filter((p) => p.pose === "Front" && p.taken_on >= s.from && p.taken_on <= s.to) ?? [];
  const allFront = photos?.filter((p) => p.pose === "Front" && p.taken_on <= s.to) ?? [];
  const before = allFront.at(-1);
  const after = front[0];

  return (
    <div className="space-y-3">
      <Panel className="relative overflow-hidden">
        <div className="eyebrow">
          <Message
            source="{p0}-day report · {p1}– {p2}"
            values={{
              p0: s.periodDays,
              p1: format(new Date(s.from + "T12:00"), "d MMM"),
              p2: format(new Date(s.to + "T12:00"), "d MMM"),
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <Ring value={s.adherence} size={96} stroke={9}>
            <div>
              <div className="num text-2xl font-bold">{Math.round(s.adherence * 100)}%</div>
              <div className="eyebrow">
                <Message source="Adherence" />
              </div>
            </div>
          </Ring>
          <div className="grid min-w-40 flex-1 grid-cols-2 gap-3">
            <div>
              <Stat label={tr("Sessions")} value={s.sessions} tone="volt" />
              <Delta v={sessDelta} suffix={` ${tr("vs previous period")}`} />
            </div>
            <div>
              <Stat
                label={tr("Volume")}
                value={fmtVolume(s.volume).value}
                unit={fmtVolume(s.volume).unit}
              />
              {s.volumeDeltaPct != null && <Delta v={s.volumeDeltaPct} suffix="%" />}
            </div>
            <Stat label={tr("Hours")} value={displayNumber((s.minutes / 60).toFixed(1))} />
            <Stat label={tr("Avg RPE")} value={s.avgRpe || "—"} />
          </div>
        </div>
      </Panel>

      {comment && (
        <Panel className="flex gap-3 border-primary/30">
          <MessageSquareQuote className="size-5 shrink-0 text-primary" />
          <div>
            <div className="text-label leading-relaxed">{comment}</div>
            {coach && (
              <div className="mt-1.5 text-caption font-semibold text-muted-foreground">
                — {coach}
              </div>
            )}
          </div>
        </Panel>
      )}

      {before && after && before.id !== after.id && (
        <Panel className="p-2">
          <CompareSlider before={before} after={after} />
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <Stat label={tr("Avg sleep")} value={s.avgSleep || "—"} unit="h" tone="dream" />
          <div className="num mt-1 text-caption text-muted-foreground">
            <Message source="quality {p0}/5" values={{ p0: s.avgSleepQuality || "—" }} />
          </div>
        </Panel>
        <Panel>
          <Stat label={tr("Bodyweight")} value={s.weightEnd ?? "—"} unit="kg" />
          {wDelta != null && <Delta v={wDelta} suffix=" kg" neutral />}
        </Panel>
        <Panel>
          <Stat label={tr("Avg kcal")} value={s.avgKcal ? fmtK(s.avgKcal) : "—"} tone="ember" />
          <div className="num mt-1 text-caption text-muted-foreground">
            <Message
              source="{p0}g protein · {p1}days logged"
              values={{ p0: s.avgProtein, p1: s.loggedFoodDays }}
            />
          </div>
        </Panel>
        <Panel>
          <Stat label={tr("Mood")} value={s.avgMood || "—"} unit="/5" tone="pulse" />
          <div className="num mt-1 text-caption text-muted-foreground">
            <Message source="energy {p0}/5" values={{ p0: s.avgEnergy || "—" }} />
          </div>
        </Panel>
      </div>

      {s.prs.length > 0 && (
        <Panel>
          <div className="eyebrow mb-2 flex items-center gap-1.5">
            <Trophy className="size-3.5 text-volt" /> <Message source="New records" />
          </div>
          {s.prs.map((p) => (
            <div
              key={p.exercise}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"
            >
              <span className="text-label">{p.exercise}</span>
              <span className="num text-label">
                <span className="text-muted-foreground">{displayNumber(p.prev || "—")} →</span>{" "}
                <b className="text-volt">
                  <Message source="{p0}kg" values={{ p0: p.weight }} />
                </b>
              </span>
            </div>
          ))}
        </Panel>
      )}

      {(s.highlights.length > 0 || s.watchouts.length > 0) && (
        <Panel className="space-y-2">
          {s.highlights.map((h) => (
            <div key={h} className="flex gap-2 text-label">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-volt" />
              {h}
            </div>
          ))}
          {s.watchouts.map((h) => (
            <div key={h} className="flex gap-2 text-label">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember" />
              {h}
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

function Delta({ v, suffix, neutral }: { v: number; suffix: string; neutral?: boolean }) {
  useLanguage();
  const up = v > 0;
  const cls = neutral
    ? "text-muted-foreground"
    : up
      ? "text-volt"
      : v < 0
        ? "text-ember"
        : "text-muted-foreground";
  return (
    <div className={`num mt-0.5 flex items-start gap-1 text-caption ${cls}`}>
      {up ? (
        <ArrowUpRight className="mt-0.5 size-3 shrink-0" />
      ) : v < 0 ? (
        <ArrowDownRight className="mt-0.5 size-3 shrink-0" />
      ) : null}
      <span className="min-w-0 break-words">
        {up ? "+" : ""}
        {displayNumber(v)}
        {suffix}
      </span>
    </div>
  );
}
