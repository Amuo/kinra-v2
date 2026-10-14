import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowUpRight,
  BatteryMedium,
  ChevronDown,
  ChevronUp,
  Moon,
  NotebookPen,
  Plus,
  Wind,
} from "lucide-react";
import { useState } from "react";
import { useLog, useMe } from "@/lib/api";
import { ErrorState, PageHeader, SectionTitle, Skeleton } from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { useShell } from "@/components/strata/shell";
import { moodOptions } from "@/components/strata/sheets";
import { RecoverSleep } from "@/components/strata/recover-sleep";
import { SwipeRow, useRemoveWithUndo } from "@/components/strata/swipe-delete";
import { RecoverBreathing } from "@/components/strata/recover-breathing";

export const Route = createFileRoute("/app/recover")({
  head: () => ({
    meta: [
      { title: "Recover — Kinra" },
      {
        name: "description",
        content: "Track sleep, reflect on your day and take a breathing break with Kinra.",
      },
      { property: "og:title", content: "Recover — Kinra" },
      {
        property: "og:description",
        content: "Track sleep, reflect on your day and take a breathing break with Kinra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Recover,
});

function Recover() {
  const me = useMe().data;
  const { log } = useShell();
  const sq = useLog("sleep_logs", me?.id);
  const jq = useLog("journal_entries", me?.id);
  const sleep = sq.data ?? [];
  const journal = jq.data ?? [];
  const removeSleep = useRemoveWithUndo("sleep_logs");
  const removeEntry = useRemoveWithUndo("journal_entries");
  const [breathe, setBreathe] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const recent = journal.filter(
    (entry) => new Date(entry.created_at).getTime() >= Date.now() - 7 * 86400000,
  );
  const avgMood = recent.length
    ? recent.reduce((sum, entry) => sum + entry.mood, 0) / recent.length
    : null;
  const avgEnergy = recent.length
    ? recent.reduce((sum, entry) => sum + entry.energy, 0) / recent.length
    : null;
  if (!me) return null;

  return (
    <div className="min-w-0">
      <PageHeader eyebrow="Sleep & mind" title="Recover" />
      <div className="mb-8 grid grid-cols-2 gap-3">
        <Button
          variant="glass"
          className="h-14 rounded-tile text-label"
          onClick={() => log("sleep")}
        >
          <Moon className="text-dream" />
          Log sleep
        </Button>
        <Button
          variant="glass"
          className="h-14 rounded-tile text-label"
          onClick={() => log("journal")}
        >
          <NotebookPen className="text-pulse" />
          Check in
        </Button>
      </div>
      {sq.isLoading ? (
        <div aria-busy="true" aria-label="Loading sleep">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="mt-5 h-64" />
        </div>
      ) : sq.error ? (
        <ErrorState
          message="Your sleep entries couldn't load. They're still saved."
          onRetry={() => sq.refetch()}
        />
      ) : (
        <>
          <RecoverSleep sleep={sleep} onLog={() => log("sleep")} />
          {sleep.length > 0 && (
            <div className="mt-5">
              <div className="eyebrow mb-2">Recent nights · swipe left to delete</div>
              <div className="space-y-2">
                {sleep.slice(0, 5).map((n) => (
                  <SwipeRow
                    key={n.id}
                    label={`Sleep ${n.log_date}`}
                    onDelete={() => removeSleep(n, "Sleep entry deleted")}
                  >
                    <div className="flex min-h-[52px] items-center justify-between rounded-tile border border-border bg-surface px-4">
                      <span className="text-label font-semibold">
                        {format(new Date(`${n.log_date}T12:00`), "EEE d MMM")}
                      </span>
                      <span className="num text-label">
                        <span className="font-bold text-dream">{n.hours} h</span>
                        <span className="ml-2 text-muted-foreground">quality {n.quality}/5</span>
                      </span>
                    </div>
                  </SwipeRow>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <section aria-label="Breathing break" className="mt-6 border-b border-border pb-6">
        <Button
          variant="ghost"
          onClick={() => setBreathe(true)}
          className="h-auto min-h-24 w-full justify-start gap-4 whitespace-normal rounded-tile bg-pulse/5 p-4 text-left"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-tile border border-pulse/20 text-pulse">
            <Wind />
          </span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block text-pulse">Box breathing · 2 min</span>
            <span className="mt-2 block font-display text-title font-bold">A moment to reset.</span>
          </span>
          <ArrowUpRight className="shrink-0 text-pulse" />
        </Button>
      </section>

      <section aria-label="Journal entries">
        <SectionTitle
          action={
            <Button
              variant="ghost"
              className="h-11 rounded-full px-3 text-label text-pulse"
              onClick={() => log("journal")}
            >
              <Plus />
              Check in
            </Button>
          }
        >
          Your headspace
        </SectionTitle>
        {jq.isLoading ? (
          <div aria-busy="true" aria-label="Loading journal">
            <Skeleton className="h-20" />
            <Skeleton className="mt-3 h-24" />
          </div>
        ) : jq.error ? (
          <ErrorState
            message="Your journal couldn't load. Your words are still saved."
            onRetry={() => jq.refetch()}
          />
        ) : (
          <>
            {recent.length > 0 && (
              <div className="mb-5 grid grid-cols-2 gap-5 border-b border-border pb-5">
                <div>
                  <div className="eyebrow">Mood · last 7 days</div>
                  <div className="num mt-2 text-title font-bold text-pulse">
                    {avgMood?.toFixed(1)}
                    <span className="ml-1 text-caption text-muted-foreground">/ 5</span>
                  </div>
                </div>
                <div>
                  <div className="eyebrow">Energy · last 7 days</div>
                  <div className="num mt-2 flex items-center gap-2 text-title font-bold">
                    <BatteryMedium className="size-4 text-pulse" />
                    {avgEnergy?.toFixed(1)}
                    <span className="text-caption text-muted-foreground">/ 5</span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {journal.slice(0, showAll ? journal.length : 5).map((entry) => {
                const mood = moodOptions[entry.mood - 1] ?? moodOptions[2];
                if (!mood) return null;
                const open = expanded.includes(entry.id);
                const long =
                  (entry.body?.length ?? 0) > 180 || (entry.body?.split("\n").length ?? 0) > 3;
                return (
                  <SwipeRow
                    key={entry.id}
                    label="Check-in: swipe left to delete"
                    onDelete={() => removeEntry(entry, "Check-in deleted")}
                  >
                    <article className="rounded-tile border border-border bg-surface p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pulse/10 text-pulse">
                          <mood.icon className="size-5" aria-label={mood.label} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-label font-bold">{mood.label}</h3>
                            <time
                              dateTime={entry.created_at}
                              className="num text-caption text-muted-foreground"
                            >
                              {format(new Date(entry.created_at), "d MMM · HH:mm")}
                            </time>
                          </div>
                          <div className="mt-1 text-caption text-muted-foreground">
                            Energy {entry.energy} / 5
                          </div>
                        </div>
                      </div>
                      <p
                        className={`mt-3 whitespace-pre-wrap break-words text-body [overflow-wrap:anywhere] ${long && !open ? "line-clamp-3" : ""}`}
                      >
                        {entry.body || (
                          <span className="text-muted-foreground">A check-in, without words.</span>
                        )}
                      </p>
                      {long && (
                        <Button
                          variant="ghost"
                          className="mt-2 h-11 rounded-full px-3 text-label text-pulse"
                          aria-expanded={open}
                          onClick={() =>
                            setExpanded((ids) =>
                              open ? ids.filter((id) => id !== entry.id) : [...ids, entry.id],
                            )
                          }
                        >
                          {open ? <ChevronUp /> : <ChevronDown />}
                          {open ? "Read less" : "Read more"}
                        </Button>
                      )}
                    </article>
                  </SwipeRow>
                );
              })}
              {!journal.length && (
                <div className="py-6">
                  <div aria-hidden className="mb-4 flex h-8 items-end gap-1">
                    <span className="h-3 w-14 rounded-full bg-dream/40" />
                    <span className="h-5 w-14 rounded-full bg-pulse/40" />
                    <span className="h-8 w-14 rounded-full bg-surface-2" />
                  </div>
                  <p className="text-body text-muted-foreground">A few words. A clearer head.</p>
                  <Button
                    variant="glass"
                    className="mt-4 h-11 text-label text-pulse"
                    onClick={() => log("journal")}
                  >
                    <NotebookPen />
                    First check-in
                  </Button>
                </div>
              )}
              {journal.length > 5 && (
                <Button
                  variant="ghost"
                  className="h-12 w-full rounded-full text-label text-pulse"
                  onClick={() => setShowAll((value) => !value)}
                  aria-expanded={showAll}
                >
                  {showAll ? <ChevronUp /> : <ChevronDown />}
                  {showAll ? "Show less" : `Show all ${journal.length} check-ins`}
                </Button>
              )}
            </div>
          </>
        )}
      </section>
      {breathe && <RecoverBreathing onClose={() => setBreathe(false)} />}
    </div>
  );
}
