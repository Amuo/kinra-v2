import { useEffect, useRef, useState } from "react";
import { ArrowRight, ScanLine, Users, TrendingUp, Clock } from "lucide-react";
import { useApi, useQ } from "@/lib/api";
import type { BusinessSummary, BusinessEntryResult, BusinessSnapshot } from "@/lib/business";
import { businessSectorLabels } from "@/lib/business";
import { t } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "./ui";
import {
  BusinessCard,
  BusinessSelect,
  BusinessStatus,
  businessMoney,
  businessTime,
} from "./business-ui";
import { BusinessScanner } from "./business-scanner";
import { BusinessManagement } from "./business-management";
import type { BusinessTab } from "./business-workspace";
const entryReasonLabels: Record<string, string> = {
  entry_recorded: "Entry recorded",
  already_inside: "This member is already checked in.",
  invalid_pass: "This pass is invalid for this business.",
  pass_used: "This pass has already been used. Generate a new pass.",
  pass_expired: "This pass has expired. Generate a fresh code.",
  member_not_found: "Member not found.",
  location_unavailable: "This location is unavailable.",
  member_paused: "This member's access is paused.",
  member_blocked: "This member's access is blocked.",
  member_archived: "This member is archived.",
  membership_unavailable:
    "No eligible membership for this location and date, or the visit limit is reached.",
  location_full: "This location has reached its recorded capacity.",
};

export function BusinessPanels({
  org,
  tab,
  onNavigate,
}: {
  org: BusinessSummary;
  tab: BusinessTab;
  onNavigate: (tab: BusinessTab) => void;
}) {
  const snapshot = useQ(["business-snapshot", org.id], (api) => api.business.snapshot(org.id));
  const refetch = snapshot.refetch;
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refetch();
    }, 15_000);
    return () => clearInterval(timer);
  }, [refetch]);
  if (snapshot.isLoading) return <Skeleton className="h-80" />;
  if (snapshot.error)
    return <ErrorState message={errorText(snapshot.error)} onRetry={() => snapshot.refetch()} />;
  if (!snapshot.data) return null;
  const data = snapshot.data;
  const refresh = async () => {
    await snapshot.refetch();
  };
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            {t(businessSectorLabels[data.business.sector])}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
            {tab === "overview"
              ? data.business.name
              : t(
                  (
                    {
                      reception: "Reception",
                      members: "Members",
                      plans: "Membership plans",
                      locations: "Locations & resources",
                      schedule: "Schedule",
                      ledger: "Payment ledger",
                      staff: "Staff & settings",
                    } as const
                  )[tab],
                )}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Your team. Your space. A clearer working day.")}
          </p>
        </div>
        {tab !== "reception" && (
          <Button variant="volt" className="min-h-12" onClick={() => onNavigate("reception")}>
            <ScanLine aria-hidden="true" />
            {t("Open reception")}
          </Button>
        )}
      </div>
      {data.truncated && (
        <p role="status" className="rounded-xl border border-border p-4 text-sm">
          {t(
            "This view contains a limited recent set of records. Summary counts include all records.",
          )}
        </p>
      )}
      {tab === "overview" ? (
        <Overview data={data} onNavigate={onNavigate} />
      ) : tab === "reception" ? (
        <Reception key={org.id} data={data} refresh={refresh} />
      ) : (
        <BusinessManagement data={data} tab={tab} refresh={refresh} />
      )}
    </>
  );
}
function Overview({
  data,
  onNavigate,
}: {
  data: BusinessSnapshot;
  onNavigate: (tab: BusinessTab) => void;
}) {
  const metrics = [
    { title: t("Active members"), value: data.stats.activeMembers, icon: Users },
    { title: t("Inside now"), value: data.stats.inside, icon: ScanLine },
    { title: t("Visits today"), value: data.stats.visitsToday, icon: TrendingUp },
    { title: t("Expiring memberships"), value: data.stats.expiring, icon: Clock },
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <BusinessCard key={metric.title}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <metric.icon aria-hidden="true" className="size-5 text-primary" />
            </div>
            <p className="mt-5 font-display text-4xl font-bold tabular-nums">{metric.value}</p>
          </BusinessCard>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <BusinessCard
          title={t("Reception at a glance")}
          action={
            <Button variant="ghost" onClick={() => onNavigate("reception")}>
              {t("View reception")}
              <ArrowRight aria-hidden="true" />
            </Button>
          }
        >
          <VisitList data={data} />
          <p className="mt-4 text-xs text-muted-foreground">
            {t("Occupancy reflects recorded check-ins and check-outs.")}
          </p>
        </BusinessCard>
        <BusinessCard title={t("Coming up")}>
          {data.sessions
            .filter((s) => s.status === "scheduled" && new Date(s.endsAt) > new Date())
            .slice(0, 5)
            .map((session) => (
              <div
                className="border-b border-border py-4 first:pt-0 last:border-0"
                key={session.id}
              >
                <p className="font-medium">{session.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {businessTime(session.startsAt, data.business.timezone)}
                </p>
                <p className="mt-2 text-xs">
                  {session.booked} / {session.capacity} ·{" "}
                  {data.locations.find((l) => l.id === session.locationId)?.name}
                </p>
              </div>
            ))}
          {!data.sessions.length && (
            <p className="text-sm text-muted-foreground">{t("No sessions scheduled yet.")}</p>
          )}
        </BusinessCard>
      </div>
      {data.business.role !== "staff" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <BusinessCard title={t("Outstanding balance")}>
            <p className="font-display text-3xl font-bold">
              {businessMoney(data.stats.outstandingMinor ?? 0, data.business.currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("Recorded invoices, not a connected bank balance.")}
            </p>
          </BusinessCard>
          <BusinessCard title={t("Recorded today")}>
            <p className="font-display text-3xl font-bold">
              {businessMoney(data.stats.paidTodayMinor ?? 0, data.business.currency)}
            </p>
          </BusinessCard>
        </div>
      )}
    </>
  );
}
function Reception({ data, refresh }: { data: BusinessSnapshot; refresh: () => Promise<void> }) {
  const api = useApi();
  const [location, setLocation] = useState(data.locations.find((l) => l.active)?.id ?? "");
  const [member, setMember] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BusinessEntryResult | null>(null);
  const [error, setError] = useState("");
  const request = useRef<{ key: string; id: string } | null>(null);
  async function enter(input: { token?: string; memberId?: string }) {
    if (busy || !location) return;
    const key = JSON.stringify({ location, ...input });
    if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() };
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const receipt = await api.business.checkIn({
        businessId: data.business.id,
        locationId: location,
        requestId: request.current.id,
        ...input,
      });
      setResult(receipt);
      request.current = null;
      await refresh();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
      <div className="space-y-6">
        <BusinessCard title={t("Check a member in")}>
          <div className="mb-5">
            <BusinessSelect
              label="Location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setResult(null);
              }}
            >
              <option value="">{t("Choose a location")}</option>
              {data.locations
                .filter((l) => l.active)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </BusinessSelect>
          </div>
          {location ? (
            <BusinessScanner busy={busy} onScan={(token) => void enter({ token })} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Add an active location before checking members in.")}
            </p>
          )}
          <div className="mt-6 border-t border-border pt-5">
            <BusinessSelect
              label="Manual member lookup"
              value={member}
              onChange={(e) => setMember(e.target.value)}
            >
              <option value="">{t("Choose a member")}</option>
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.number} · {m.name}
                </option>
              ))}
            </BusinessSelect>
            <Button
              className="mt-3 min-h-11"
              variant="secondary"
              disabled={!member || !location || busy}
              onClick={() => void enter({ memberId: member })}
            >
              {t("Record manual entry")}
            </Button>
          </div>
        </BusinessCard>
        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-destructive">
            {error}
          </p>
        )}
        {result && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-2xl border p-6 ${result.decision === "allowed" ? "border-primary/40 bg-primary/10" : "border-border bg-surface-2"}`}
          >
            <BusinessStatus value={result.decision} />
            <p className="mt-3 text-2xl font-semibold">{result.memberName ?? t("Entry result")}</p>
            <p className="mt-2">
              {t(entryReasonLabels[result.reason] ?? "Entry could not be verified.")}
            </p>
            {result.remainingVisits !== null && (
              <p className="mt-2 text-sm">
                {t("Visits remaining")}: {result.remainingVisits}
              </p>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {t(
            "This records attendance. Physical door access requires a separate hardware integration.",
          )}
        </p>
      </div>
      <BusinessCard title={t("Inside now")}>
        <VisitList
          data={data}
          location={location}
          onExit={async (id) => {
            try {
              await api.business.checkOut(data.business.id, id);
              await refresh();
            } catch (cause) {
              setError(errorText(cause));
            }
          }}
        />
      </BusinessCard>
    </div>
  );
}
function VisitList({
  data,
  location,
  onExit,
}: {
  data: BusinessSnapshot;
  location?: string;
  onExit?: (id: string) => Promise<void>;
}) {
  const visits = data.visits.filter((v) => !v.exitedAt && (!location || v.locationId === location));
  const [pending, setPending] = useState("");
  return (
    <div className="divide-y divide-border">
      {visits.map((visit) => (
        <div key={visit.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="font-medium">{visit.memberName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {businessTime(visit.enteredAt, data.business.timezone)} ·{" "}
              {data.locations.find((l) => l.id === visit.locationId)?.name}
            </p>
          </div>
          {onExit && (
            <Button
              variant="secondary"
              disabled={!!pending}
              onClick={async () => {
                setPending(visit.id);
                try {
                  await onExit(visit.id);
                } finally {
                  setPending("");
                }
              }}
            >
              {t("Check out")}
            </Button>
          )}
        </div>
      ))}
      {!visits.length && (
        <p className="py-6 text-sm text-muted-foreground">
          {t("No recorded visits inside right now.")}
        </p>
      )}
    </div>
  );
}
