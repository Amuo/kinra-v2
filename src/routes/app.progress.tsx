import { Sheet } from "@/components/strata/sheets";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Scale,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useLog, useMe, useQ } from "@/lib/api";
import { ErrorState, PageHeader, SectionTitle, Skeleton, Stat } from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { dayOf, fmtVolume, iso, today, volume, weekStart } from "@/lib/stats";
import { useShell } from "@/components/strata/shell";
import { PhotoSection, usePhotos } from "@/components/strata/photos";
import { ReportView } from "@/components/strata/report-view";
import { WeightChart } from "@/components/strata/progress-weight";
import { SwipeRow, useRemoveWithUndo } from "@/components/strata/swipe-delete";
import { progressMilestones, weeklyRecap, type WeightRange } from "@/lib/progress";

const FeatureWorkspace = lazy(() =>
  import("@/components/strata/feature-hub").then((m) => ({ default: m.FeatureWorkspace })),
);

export const Route = createFileRoute("/app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Kinra" },
      {
        name: "description",
        content:
          "Review your body metrics, consistency, private photos and trainer reports in Kinra.",
      },
      { property: "og:title", content: "Progress — Kinra" },
      {
        property: "og:description",
        content:
          "Review your body metrics, consistency, private photos and trainer reports in Kinra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

const DOW = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
export function CalendarHeatmap({ counts }: { counts: Map<string, number> }) {
  const start = new Date(weekStart(new Date()) + "T12:00");
  start.setDate(start.getDate() - 7 * 11);
  const t = today();
  const weeks = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const x = new Date(start);
      x.setDate(x.getDate() + w * 7 + d);
      return iso(x);
    }),
  );
  const color = (n: number) =>
    n >= 2
      ? "var(--volt)"
      : n === 1
        ? "color-mix(in oklab, var(--volt) 55%, var(--surface-2))"
        : "var(--surface-2)";
  return (
    <div>
      <div className="grid grid-cols-[28px_repeat(12,minmax(0,1fr))] gap-1">
        <span />
        {weeks.map((w, i) => {
          const m = format(new Date(w[0] + "T12:00"), "MMM");
          const prev = i ? format(new Date(weeks[i - 1]?.[0] + "T12:00"), "MMM") : "";
          return (
            <span key={i} className="min-w-0 overflow-visible text-caption text-muted-foreground">
              {m !== prev ? m : ""}
            </span>
          );
        })}
        {DOW.map((dl, d) => (
          <div key={d} className="contents">
            <span className="text-caption leading-none text-muted-foreground">{dl}</span>
            {weeks.map((w, i) => {
              const day = w[d];
              if (!day) return null;
              const n = counts.get(day) ?? 0;
              return (
                <span
                  key={i}
                  title={`${day}: ${n} session${n === 1 ? "" : "s"}`}
                  className="aspect-square rounded-[4px]"
                  style={{
                    background: day > t ? "transparent" : color(n),
                    outline: day === t ? "1.5px solid var(--foreground)" : undefined,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-caption text-muted-foreground">
        Less
        {[0, 1, 2].map((n) => (
          <span key={n} className="size-3 rounded-[3px]" style={{ background: color(n) }} />
        ))}
        More
      </div>
    </div>
  );
}

function Progress() {
  const [workspace, setWorkspace] = useState<"measurement" | "goal" | null>(null);
  const me = useMe().data;
  const { log } = useShell();
  const mq = useLog("body_metrics", me?.id);
  const removeMetric = useRemoveWithUndo("body_metrics");
  const wq = useLog("workouts", me?.id);
  const sq = useLog("sleep_logs", me?.id);
  const [range, setRange] = useState<WeightRange>("3M");
  const [story, setStory] = useState(0);
  const [recapOpen, setRecapOpen] = useState(false);
  const metrics = mq.data ?? [];
  const workouts = wq.data ?? [];
  const recap = weeklyRecap(workouts, sq.data ?? [], today());
  const counts = new Map<string, number>();
  for (const workout of workouts)
    counts.set(dayOf(workout.performed_at), (counts.get(dayOf(workout.performed_at)) ?? 0) + 1);
  const total = fmtVolume(workouts.reduce((sum, workout) => sum + volume(workout), 0));
  const stories = [
    {
      label: "You showed up",
      value: recap.sessions,
      unit: "sessions",
      detail: `${recap.minutes} minutes of training`,
      tone: "text-volt",
    },
    {
      label: "Work that adds up",
      value: fmtVolume(recap.volume).value,
      unit: fmtVolume(recap.volume).unit,
      detail: "Total weight moved this week",
      tone: "text-pulse",
    },
    {
      label: "Room to recover",
      value: recap.sleep ?? "—",
      unit: "h / night",
      detail: recap.sleep === null ? "No sleep logged this week" : "Average logged sleep this week",
      tone: "text-dream",
    },
  ];
  const current = stories[story] ?? stories[0];
  if (!me || !current) return null;
  return (
    <div className="min-w-0">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button variant="glass" className="h-11" onClick={() => setWorkspace("measurement")}>
          Measurements
        </Button>
        <Button variant="glass" className="h-11" onClick={() => setWorkspace("goal")}>
          Goals
        </Button>
      </div>
      {workspace && (
        <Sheet
          open
          onOpenChange={(o) => !o && setWorkspace(null)}
          title={workspace === "measurement" ? "Measurements" : "Goals"}
        >
          <Suspense fallback={<p>Loading workspace…</p>}>
            <FeatureWorkspace compact kind={workspace} />
          </Suspense>
        </Sheet>
      )}
      <PageHeader
        eyebrow="The bigger picture"
        title="Progress"
        action={
          <Button
            variant="glass"
            size="icon"
            className="size-11 shrink-0"
            aria-label="Weigh-in"
            title="Weigh-in"
            onClick={() => log("metric")}
          >
            <Scale />
          </Button>
        }
      />
      <section aria-label="Bodyweight trend" className="border-b border-border pb-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-title font-bold">Bodyweight</h2>
          <span className="text-caption text-muted-foreground">kg</span>
        </div>
        <div className="mb-5 flex rounded-full border border-border bg-surface p-1">
          {(["1M", "3M", "All"] as const).map((value) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={`h-11 flex-1 rounded-full text-label ${range === value ? "bg-pulse/15 text-pulse" : "text-muted-foreground"}`}
            >
              {value}
            </Button>
          ))}
        </div>
        {mq.isLoading ? (
          <Skeleton className="h-64" />
        ) : mq.error ? (
          <ErrorState
            message="Your weight history couldn't load. Your records are still saved."
            onRetry={() => mq.refetch()}
          />
        ) : (
          <>
            <WeightChart metrics={metrics} range={range} />
            {metrics.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="eyebrow mb-2">Recent weigh-ins · swipe left to delete</div>
                <div className="space-y-2">
                  {metrics.slice(0, 4).map((m) => (
                    <SwipeRow
                      key={m.id}
                      label={`Weigh-in ${m.log_date}`}
                      onDelete={() => removeMetric(m, "Weigh-in deleted")}
                    >
                      <div className="flex min-h-[52px] items-center justify-between rounded-tile border border-border bg-surface px-4">
                        <span className="text-label font-semibold">
                          {format(new Date(`${m.log_date}T12:00`), "EEE d MMM")}
                        </span>
                        <span className="num text-label font-bold">
                          {m.weight ?? "—"} kg
                          {m.body_fat != null && (
                            <span className="ml-2 font-normal text-muted-foreground">
                              {m.body_fat}%
                            </span>
                          )}
                        </span>
                      </div>
                    </SwipeRow>
                  ))}
                </div>
              </div>
            )}
            {metrics.some((metric) => metric.body_fat != null) && (
              <div className="mt-3 border-t border-border pt-3">
                <Stat
                  label="Latest body fat"
                  value={metrics.find((metric) => metric.body_fat != null)?.body_fat}
                  unit="%"
                  size="sm"
                />
              </div>
            )}
          </>
        )}
      </section>
      <section aria-label="Weekly recap" className="mt-6 border-b border-border pb-6">
        <Button
          variant="ghost"
          className="h-auto min-h-20 w-full justify-between whitespace-normal rounded-tile bg-surface p-4 text-left"
          onClick={() => {
            setStory(0);
            setRecapOpen((open) => !open);
          }}
          aria-expanded={recapOpen}
        >
          <span>
            <span className="eyebrow block">
              Last 7 days · {format(new Date(recap.start + "T12:00"), "d MMM")} –{" "}
              {format(new Date(recap.end + "T12:00"), "d MMM")}
            </span>
            <span className="mt-2 block font-display text-title font-bold">Your weekly recap</span>
          </span>
          <ArrowUpRight className="text-pulse" />
        </Button>
        {recapOpen && (
          <div className="pt-5">
            {wq.isLoading || sq.isLoading ? (
              <Skeleton className="h-44" />
            ) : wq.error || sq.error ? (
              <ErrorState
                onRetry={() => {
                  wq.refetch();
                  sq.refetch();
                }}
              />
            ) : (
              <>
                <div className="mb-5 flex gap-2">
                  {stories.map((_, i) => (
                    <Button
                      variant="ghost"
                      key={i}
                      className={`h-11 flex-1 rounded-full ${story === i ? "bg-pulse/15 text-pulse" : "bg-surface text-muted-foreground"}`}
                      aria-label={`Recap slide ${i + 1}`}
                      aria-pressed={story === i}
                      onClick={() => setStory(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <div className="min-h-40" aria-live="polite">
                  <div className="text-label font-semibold">{current.label}</div>
                  <div className={`num mt-4 text-display font-bold ${current.tone}`}>
                    {current.value}
                    <span className="ml-2 text-label text-muted-foreground">{current.unit}</span>
                  </div>
                  <p className="mt-3 text-label text-muted-foreground">{current.detail}</p>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    className="h-11 rounded-full text-label"
                    disabled={story === 0}
                    onClick={() => setStory((s) => s - 1)}
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-11 rounded-full text-label text-pulse"
                    onClick={() => (story === 2 ? setRecapOpen(false) : setStory((s) => s + 1))}
                  >
                    {story === 2 ? "Done" : "Next"}
                    <ChevronRight />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </section>
      <SectionTitle>Consistency · 12 weeks</SectionTitle>
      {wq.isLoading ? (
        <Skeleton className="h-52" />
      ) : wq.error ? (
        <ErrorState onRetry={() => wq.refetch()} />
      ) : (
        <section aria-label="Training consistency" className="border-b border-border pb-6">
          <CalendarHeatmap counts={counts} />
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Sessions" value={workouts.length} size="sm" />
            <Stat label="Weight moved" value={total.value} unit={total.unit} size="sm" />
            <Stat
              label="Training"
              value={Math.round(
                workouts.reduce((sum, workout) => sum + (workout.duration_min ?? 0), 0) / 60,
              )}
              unit="h"
              size="sm"
            />
          </div>
        </section>
      )}
      {!wq.error && !mq.error && !wq.isLoading && !mq.isLoading && (
        <section aria-label="Milestones">
          <SectionTitle>Milestones</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {progressMilestones(workouts, metrics).map((badge) => (
              <div key={badge.name} className="rounded-tile border border-border bg-surface p-4">
                <span
                  className={`mb-3 grid size-11 place-items-center rounded-full ${badge.earned ? "bg-pulse/10 text-pulse" : "bg-surface-2 text-muted-foreground"}`}
                >
                  {badge.earned ? <Trophy className="size-5" /> : <Lock className="size-5" />}
                </span>
                <h3 className="text-label font-bold">{badge.name}</h3>
                <p className="mt-2 text-caption text-muted-foreground">{badge.detail}</p>
                <span className="mt-2 block text-caption text-muted-foreground">
                  {badge.earned ? "Earned" : "Ahead of you"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      <SectionTitle>Progress photos</SectionTitle>
      <PhotoSection userId={me.id} canEdit />
      <CoachReports userId={me.id} />
    </div>
  );
}

function CoachReports({ userId }: { userId: string }) {
  const reports = useQ(["reports", userId], (api) => api.reports(userId));
  const coach = useQ(["my-trainer"], (api) => api.myTrainer());
  const photos = usePhotos(userId);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section aria-label="Trainer reports">
      <SectionTitle>From your coach</SectionTitle>
      {reports.isLoading ? (
        <Skeleton className="h-20" />
      ) : reports.error ? (
        <ErrorState
          message="Your reports couldn't load. They're still saved."
          onRetry={() => reports.refetch()}
        />
      ) : reports.data?.length ? (
        <div className="space-y-3">
          {reports.data.map((report) => (
            <div key={report.id}>
              <Button
                variant="ghost"
                className="h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-tile border border-border bg-surface p-4 text-left"
                aria-label={`${report.period_days}-day report`}
                aria-expanded={open === report.id}
                onClick={() => setOpen(open === report.id ? null : report.id)}
              >
                <FileText className="shrink-0 text-pulse" />
                <span className="min-w-0 flex-1">
                  <span className="block text-label font-bold">
                    {report.period_days}-day report
                  </span>
                  <span className="num mt-1 block text-caption text-muted-foreground">
                    {format(new Date(report.created_at), "d MMM yyyy")} ·{" "}
                    {Math.round(report.summary.adherence * 100)}% adherence
                  </span>
                </span>
                <ChevronDown className={open === report.id ? "rotate-180" : ""} />
              </Button>
              {open === report.id && (
                <div className="mt-3">
                  <ReportView
                    s={report.summary}
                    comment={report.comment}
                    coach={coach.data?.display_name}
                    photos={photos.data ?? []}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border py-5 text-label text-muted-foreground">
          Your coach's next report will be here.
        </p>
      )}
    </section>
  );
}
