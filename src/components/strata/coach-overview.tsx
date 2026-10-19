import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { format } from "@/lib/i18n";
import { ArrowUpRight, Check, ClipboardList, Users } from "lucide-react";
import { useQ } from "@/lib/api";
import { clientAttention } from "@/lib/coach";
import { dayOf, firstName, fmtVolume, lastNDays, volume, within } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, Empty, ErrorState, PageHeader, SectionTitle, Skeleton, Stat } from "./ui";
import { ClientRow } from "./client-row";

export function CoachHome({ name, avatar }: { name: string | null; avatar?: string | undefined }) {
  useLanguage();
  const agg = useQ(["coach-agg"], async (api) => {
    const clients = await api.clients();
    return Promise.all(
      clients.map(async (c) => {
        const [workouts, journal, sleep] = await Promise.all([
          api.list("workouts", c.id),
          api.list("journal_entries", c.id),
          api.list("sleep_logs", c.id),
        ]);
        return { ...c, workouts, journal, sleep };
      }),
    );
  });
  const rows = agg.data ?? [];
  const attention = rows
    .map((r) => ({ r, reasons: clientAttention(r) }))
    .filter((r) => r.reasons.length)
    .sort((a, b) => b.reasons.length - a.reasons.length);
  const all = rows.flatMap((r) => r.workouts.filter((w) => within(w.performed_at, 30)));
  const vol = fmtVolume(all.reduce((sum, w) => sum + volume(w), 0));
  const days = lastNDays(30);
  const recent = rows.filter((r) => r.workouts[0] && within(r.workouts[0].performed_at, 7));
  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow={tr("{p0} / Coach", { p0: format(new Date(), "EEE · d MMM") })}
        title={
          <>
            <Message source="Hey, {p0}" values={{ p0: firstName(name?.replace("Coach ", "")) }} />
          </>
        }
        action={
          <Button asChild variant="ghost" size="icon" className="size-11 shrink-0 rounded-full">
            <Link to="/app/me" aria-label={tr("Coach profile")}>
              <Avatar name={name} src={avatar} size={40} />
            </Link>
          </Button>
        }
      />
      {agg.isLoading ? (
        <div aria-busy="true" className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : agg.error ? (
        <ErrorState onRetry={() => agg.refetch()} />
      ) : !rows.length ? (
        <Empty
          icon={<Users className="size-7" />}
          title={tr("Your team starts here")}
          body="Share your coach code to connect your first client."
          action={
            <Button asChild variant="volt" size="xl">
              <Link to="/app/me">
                <Message source="Get my code" />
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <section aria-labelledby="attention-title">
            <div className="flex items-end justify-between gap-3 border-b border-border pb-5">
              <div>
                <div className="eyebrow mb-2">
                  <Message source="Your focus today" />
                </div>
                <h2 id="attention-title" className="font-display text-title font-bold">
                  {attention.length ? tr("Needs your attention") : tr("Your team is in rhythm")}
                </h2>
              </div>
              <div
                className={cn(
                  "num text-display font-bold",
                  attention.length ? "text-ember" : "text-volt",
                )}
              >
                {attention.length ? (
                  String(attention.length).padStart(2, "0")
                ) : (
                  <Check className="size-10" />
                )}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {attention.map(({ r, reasons }, index) => (
                <ClientRow key={r.id} r={r} index={index} reasons={reasons} kudos />
              ))}
            </div>
            {!attention.length && (
              <p className="mt-4 text-label text-muted-foreground">
                <Message source="No inactivity, low mood or low sleep flags." />
              </p>
            )}
          </section>
          <SectionTitle
            action={
              <Button
                asChild
                variant="ghost"
                className="h-11 rounded-full px-2 text-label text-volt"
              >
                <Link to="/app/clients">
                  <Message source="All clients" />
                  <ArrowUpRight />
                </Link>
              </Button>
            }
          >
            <Message source="Keep the momentum" />
          </SectionTitle>
          <div className="space-y-3">
            {recent
              .filter((r) => !attention.some((a) => a.r.id === r.id))
              .slice(0, 3)
              .map((r, i) => (
                <ClientRow key={r.id} r={r} index={i} kudos />
              ))}
          </div>
          {!recent.filter((r) => !attention.some((a) => a.r.id === r.id)).length && (
            <p className="text-label text-muted-foreground">
              <Message source="No other sessions in the last 7 days." />
            </p>
          )}
          <section
            className="mt-8 border-y border-border py-5"
            aria-label={tr("Team training over the last 30 days")}
          >
            <div className="eyebrow mb-4">
              <Message source="Team pulse · last 30 days" />
            </div>
            <div className="mb-6 grid grid-cols-3 gap-3">
              <Stat label={tr("Sessions")} value={all.length} />
              <Stat label={tr("Volume")} value={vol.value} unit={vol.unit} />
              <Stat label={tr("Active 7d")} value={`${recent.length}/${rows.length}`} />
            </div>
            <div className="space-y-3">
              {rows.map((r) => {
                const trained = new Set(r.workouts.map((w) => dayOf(w.performed_at)));
                return (
                  <Link
                    key={r.id}
                    to="/app/clients/$clientId"
                    params={{ clientId: r.id }}
                    className="flex min-h-11 items-center gap-3 rounded-tile"
                    aria-label={tr("{p0}: {p1} sessions in 30 days", {
                      p0: r.display_name,
                      p1: r.workouts.filter((w) => within(w.performed_at, 30)).length,
                    })}
                  >
                    <span className="w-12 shrink-0 truncate text-caption font-semibold text-muted-foreground">
                      {firstName(r.display_name)}
                    </span>
                    <div
                      aria-hidden
                      className="grid min-w-0 flex-1 grid-cols-[repeat(30,minmax(0,1fr))] gap-0.5"
                    >
                      {days.map((d) => (
                        <span
                          key={d}
                          className={cn(
                            "aspect-square rounded-full",
                            trained.has(d) ? "bg-pulse" : "bg-surface-2",
                          )}
                        />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="num mt-2 flex justify-between pl-15 text-caption text-muted-foreground">
              <span>{days[0] ? format(new Date(`${days[0]}T12:00`), "d MMM") : ""}</span>
              <span>
                <Message source="Today" />
              </span>
            </div>
          </section>
          <Button asChild variant="glass" className="mt-5 h-14 w-full text-label">
            <Link to="/app/programs">
              <ClipboardList />
              <Message source="Manage editable plans" />
              <ArrowUpRight />
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
