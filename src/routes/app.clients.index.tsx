import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Users } from "lucide-react";
import { useQ } from "@/lib/api";
import { Empty, ErrorState, PageHeader, Skeleton } from "@/components/strata/ui";
import { Input } from "@/components/ui/input";
import { ClientRow } from "@/components/strata/client-row";
import { clientAttention } from "@/lib/coach";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/strata/ui";

export const Route = createFileRoute("/app/clients/")({
  head: () => ({
    meta: [
      { title: "Clients — Kinra" },
      {
        name: "description",
        content: "Review your connected athletes and their recent activity in Kinra.",
      },
      { property: "og:title", content: "Clients — Kinra" },
      {
        property: "og:description",
        content: "Review your connected athletes and their recent activity in Kinra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clients,
});

function Clients() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const data = useQ(["coach-agg"], async (api) => {
    const cs = await api.clients();
    return Promise.all(
      cs.map(async (c) => {
        const [workouts, journal, sleep] = await Promise.all([
          api.list("workouts", c.id),
          api.list("journal_entries", c.id),
          api.list("sleep_logs", c.id),
        ]);
        return { ...c, workouts, journal, sleep };
      }),
    );
  });
  const rows = (data.data ?? [])
    .map((r) => ({ r, reasons: clientAttention(r) }))
    .sort(
      (a, b) =>
        b.reasons.length - a.reasons.length ||
        (a.r.display_name ?? "").localeCompare(b.r.display_name ?? ""),
    );
  const list = rows.filter(
    ({ r, reasons }) =>
      (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()) &&
      (filter === "all" || reasons.length),
  );
  return (
    <div>
      <PageHeader eyebrow={`${data.data?.length ?? 0} athletes`} title="Clients" />
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients"
          aria-label="Search clients"
          className="h-12 rounded-full bg-surface pl-11 text-body"
        />
      </div>
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All · ${rows.length}` },
          {
            value: "attention",
            label: `Attention · ${rows.filter((r) => r.reasons.length).length}`,
          },
        ]}
        className="mb-4"
      />
      {data.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 !rounded-[20px]" />
          ))}
        </div>
      ) : data.error ? (
        <ErrorState onRetry={() => data.refetch()} />
      ) : !data.data?.length ? (
        <Empty
          icon={<Users className="size-7" />}
          title="No clients yet"
          body="Share your coach code to connect your first client."
          action={
            <Button variant="volt" asChild className="h-12">
              <Link to="/app/me">Get my code</Link>
            </Button>
          }
        />
      ) : !list.length ? (
        <div className="py-8 text-center">
          <p className="text-label text-muted-foreground">
            {q ? `No clients match “${q}”.` : "No clients need attention."}
          </p>
          <Button
            variant="ghost"
            className="mt-3 h-11 rounded-full"
            onClick={() => {
              setQ("");
              setFilter("all");
            }}
          >
            Show all clients
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(({ r, reasons }, i) => (
            <ClientRow key={r.id} r={r} index={i} reasons={reasons} kudos />
          ))}
        </div>
      )}
    </div>
  );
}
