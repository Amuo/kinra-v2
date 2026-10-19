import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { PrivateMessages } from "@/components/strata/private-messages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "@/lib/i18n";
import { ArrowLeft, Send, Pencil, ThumbsUp, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAct, useQ } from "@/lib/api";
import { ClientOverview, ReadinessHero, useClientData } from "@/components/strata/client-overview";
import {
  Avatar,
  Chip,
  Panel,
  SectionTitle,
  Segmented,
  ErrorState,
  Skeleton,
} from "@/components/strata/ui";
import { CoachKudos } from "@/components/strata/coach-kudos";
import { ProgramBuilder } from "@/components/strata/program-builder";
import type { Program } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WeightChart } from "@/components/strata/progress-weight";
import { PhotoSection, usePhotos } from "@/components/strata/photos";
import { ReportView } from "@/components/strata/report-view";
import { buildSummary } from "@/lib/report";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProgramSummary } from "@/components/strata/program-summary";
import { searchPrograms } from "@/lib/programs";

export const Route = createFileRoute("/app/clients/$clientId")({
  head: () => ({
    meta: [
      { title: tr("Client progress — Kinra") },
      {
        name: "description",
        content: "Review an athlete’s training, recovery, program and private progress in Kinra.",
      },
      { property: "og:title", content: "Client progress — Kinra" },
      {
        property: "og:description",
        content: "Review an athlete’s training, recovery, program and private progress in Kinra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  useLanguage();
  const { clientId } = Route.useParams();
  const [tab, setTab] = useState<"overview" | "report" | "photos" | "program" | "notes">(
    "overview",
  );
  const person = useQ(["person", clientId], (api) => api.person(clientId));
  const d = useClientData(clientId);
  const [kudos, setKudos] = useState(false);

  if (person.isLoading)
    return (
      <div aria-busy="true">
        <Skeleton className="h-24" />
        <Skeleton className="mt-4 h-64" />
      </div>
    );
  if (person.error) return <ErrorState onRetry={() => person.refetch()} />;
  if (!person.data)
    return (
      <div>
        <h1 className="text-title">
          <Message source="Client unavailable" />
        </h1>
        <Button asChild variant="glass" className="mt-4 h-12">
          <Link to="/app/clients">
            <Message source="Back to clients" />
          </Link>
        </Button>
      </div>
    );

  return (
    <div>
      <Link
        to="/app/clients"
        className="-ml-2 mb-2 inline-flex min-h-[44px] items-center gap-1 rounded-full px-2 text-label text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> <Message source="Clients" />
      </Link>
      <div className="mb-4 flex items-center gap-4">
        <Avatar name={person.data?.display_name} src={person.data.avatar_url} size={60} />
        <div className="min-w-0">
          <div className="eyebrow mb-1">
            <Message source="Client progress" />
          </div>
          <h1 className="break-words font-display text-title-l font-extrabold">
            {person.data.display_name ?? tr("Client")}
          </h1>
          <div className="mt-1 break-words text-label text-muted-foreground">
            {person.data.goal ?? tr("No goal set")}
          </div>
        </div>
      </div>
      <Button variant="glass" className="mb-4 h-11 text-label" onClick={() => setKudos(true)}>
        <ThumbsUp />
        <Message source="Give kudos" />
      </Button>
      {kudos && (
        <CoachKudos
          open
          clientId={clientId}
          name={person.data.display_name}
          workout={d.workouts[0]}
          onClose={() => setKudos(false)}
        />
      )}
      <div className="sticky top-0 z-20 -mx-5 mb-4 bg-background/90 px-5 py-2 backdrop-blur">
        <div className="my-4">
          <PrivateMessages recipientId={clientId} />
        </div>
        <Segmented
          className="grid grid-cols-3 gap-1 rounded-[14px]"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: tr("Overview") },
            { value: "report", label: tr("Report") },
            { value: "photos", label: tr("Photos") },
            { value: "program", label: tr("Plan") },
            { value: "notes", label: tr("Notes") },
          ]}
        />
      </div>

      {tab === "overview" && (
        <>
          <ReadinessHero userId={clientId} interactive={false} />
          {d.metrics.filter((m) => m.weight != null).length > 1 && (
            <>
              <SectionTitle>
                <Message source="Bodyweight" />
              </SectionTitle>
              <div className="panel p-4">
                <WeightChart metrics={d.metrics} />
              </div>
            </>
          )}
          <ClientOverview userId={clientId} trainerView />
        </>
      )}
      {tab === "report" && <ReportTab clientId={clientId} />}
      {tab === "photos" && <PhotoSection userId={clientId} canEdit={false} />}
      {tab === "program" && <ProgramTab clientId={clientId} />}
      {tab === "notes" && <NotesTab clientId={clientId} />}
    </div>
  );
}

function ProgramTab({ clientId }: { clientId: string }) {
  useLanguage();
  const [editing, setEditing] = useState<Program | "new" | null>(null);
  const [query, setQuery] = useState("");
  const programs = useQ(["programs"], (api) => api.programs());
  const assignments = useQ(["assignments", clientId], (api) => api.assignments(clientId));
  const assign = useAct((api, pid: string) => api.assign(pid, clientId));
  const current = programs.data?.find((p) => p.id === assignments.data?.[0]?.program_id);
  const start = assignments.data?.[0]?.start_date;
  if (programs.isLoading || assignments.isLoading) return <Skeleton className="h-44" />;
  if (programs.error || assignments.error)
    return (
      <ErrorState
        onRetry={() => {
          programs.refetch();
          assignments.refetch();
        }}
      />
    );
  return (
    <div>
      <Button
        variant="volt"
        className="mb-4 h-12 w-full text-label"
        onClick={() => setEditing("new")}
      >
        <Plus />
        <Message source="Create custom program" />
      </Button>
      {current ? (
        <>
          <ProgramSummary
            key={current.id}
            program={current}
            eyebrow={tr("Current program")}
            actions={
              <Button
                variant="glass"
                className="h-11 text-label"
                onClick={() => setEditing(current)}
              >
                <Pencil />
                <Message source="Edit plan" />
              </Button>
            }
          />
          {start && (
            <p className="num mt-2 text-caption text-muted-foreground">
              <Message
                source="Started {p0}"
                values={{ p0: format(new Date(start + "T12:00"), "d MMM") }}
              />
            </p>
          )}
        </>
      ) : (
        <div className="text-label text-muted-foreground">
          <Message source="No program assigned yet." />
        </div>
      )}
      <SectionTitle>
        <Message source="Program library" />
      </SectionTitle>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
        <Input
          aria-label={tr("Search programs to assign")}
          placeholder={tr("Search programs or exercises")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 bg-surface pl-10 text-body"
        />
      </div>
      <div className="space-y-2">
        {searchPrograms(programs.data ?? [], query).map((p) => (
          <ProgramSummary
            key={p.id}
            program={p}
            actions={
              <Button
                size="sm"
                variant={current?.id === p.id ? "secondary" : "volt"}
                disabled={current?.id === p.id || assign.isPending}
                onClick={() =>
                  assign.mutate(p.id, {
                    onSuccess: () => toast.success(tr("Assigned {p0}", { p0: p.name })),
                    onError: (e) => toast.error(errorText(e.message)),
                  })
                }
              >
                {current?.id === p.id ? tr("Active") : tr("Assign")}
              </Button>
            }
          />
        ))}
        {!!programs.data?.length && !searchPrograms(programs.data, query).length && (
          <p className="text-label text-muted-foreground">
            <Message source="No matching programs." />
          </p>
        )}
        {!programs.data?.length && (
          <Link to="/app/programs" className="text-label font-semibold text-primary">
            <Message source="Create your first program →" />
          </Link>
        )}
      </div>
      {editing && (
        <ProgramBuilder
          {...(editing === "new" ? { clientId } : { program: editing })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function NotesTab({ clientId }: { clientId: string }) {
  useLanguage();
  const [body, setBody] = useState("");
  const notes = useQ(["notes", clientId], (api) => api.notes(clientId));
  const add = useAct((api, b: string) => api.addNote(clientId, b));
  const list = [...(notes.data ?? [])].reverse();
  const send = () =>
    body.trim() &&
    add.mutate(body.trim(), {
      onSuccess: () => (setBody(""), toast.success(tr("Sent to client"))),
      onError: (e) => toast.error(errorText(e.message)),
    });
  return (
    <div>
      <p className="mb-4 text-center text-caption text-muted-foreground">
        <Message source="Notes appear on your client's Today screen." />
      </p>
      <div className="space-y-3">
        {list.map((n) => (
          <div key={n.id} className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-primary px-4 py-2.5 text-body text-primary-foreground">
              {n.body}
            </div>
            <div className="num mt-1 text-caption text-muted-foreground">
              {format(new Date(n.created_at), "d MMM · HH:mm")}
            </div>
          </div>
        ))}
        {!list.length && !notes.isLoading && (
          <div className="tile p-4 text-center text-label text-muted-foreground">
            <Message source="No notes yet. Say hi." />
          </div>
        )}
      </div>
      <div className="sticky bottom-[96px] mt-5 flex items-end gap-2 rounded-[24px] border border-border bg-popover p-1.5">
        <Textarea
          rows={1}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={tr("Message your client…")}
          aria-label={tr("Note to client")}
          className="min-h-[44px] flex-1 resize-none border-0 bg-transparent text-body focus-visible:ring-0"
        />
        <Button
          disabled={!body.trim() || add.isPending}
          onClick={send}
          aria-label={tr("Send note")}
          size="icon"
          className="size-11 shrink-0 rounded-full"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ReportTab({ clientId }: { clientId: string }) {
  useLanguage();
  const [period, setPeriod] = useState(30);
  const [comment, setComment] = useState("");
  const d = useClientData(clientId);
  const photos = usePhotos(clientId);
  const reports = useQ(["reports", clientId], (api) => api.reports(clientId));
  const send = useAct((api, v: { summary: ReturnType<typeof buildSummary> }) =>
    api.saveReport({ clientId, periodDays: period, summary: v.summary, comment }),
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const summary = buildSummary(d, period);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {[7, 30, 90].map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            <Message source="{p0}days" values={{ p0: p }} />
          </Chip>
        ))}
      </div>
      {d.error ? (
        <ErrorState onRetry={d.retry} />
      ) : d.loading ? (
        <div className="text-label text-muted-foreground">
          <Message source="Crunching numbers…" />
        </div>
      ) : (
        <ReportView s={summary} photos={photos.data ?? []} />
      )}
      <SectionTitle>
        <Message source="Your message" />
      </SectionTitle>
      <Panel className="p-3">
        <Textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={tr("Summarise the block, celebrate wins, set the next focus…")}
          className="border-0 bg-transparent"
        />
      </Panel>
      <Button
        variant="volt"
        size="xl"
        className="mt-3 w-full"
        disabled={send.isPending || d.loading || !!d.error}
        onClick={() =>
          send.mutate(
            { summary },
            {
              onSuccess: () => (setComment(""), toast.success(tr("Report sent to client"))),
              onError: (e) => toast.error(errorText(e.message)),
            },
          )
        }
      >
        <Send /> <Message source="Send report" />
      </Button>

      {!!reports.data?.length && (
        <>
          <SectionTitle>
            <Message source="Sent reports" />
          </SectionTitle>
          <div className="space-y-2">
            {reports.data.map((r) => (
              <div key={r.id}>
                <Panel
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="flex items-center gap-3 p-3.5"
                >
                  <FileText className="size-5 text-volt" />
                  <div className="flex-1">
                    <div className="font-semibold">
                      <Message source="{p0}-day report" values={{ p0: r.period_days }} />
                    </div>
                    <div className="num text-caption text-muted-foreground">
                      {format(new Date(r.created_at), "d MMM yyyy · HH:mm")}
                    </div>
                  </div>
                </Panel>
                {openId === r.id && (
                  <div className="mt-2">
                    <ReportView s={r.summary} comment={r.comment} photos={photos.data ?? []} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
