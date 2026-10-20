import { localizedProgram } from "@/lib/template-display";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { ClipboardList, Plus, Pencil, Search } from "lucide-react";
import { useMe, useQ } from "@/lib/api";
import { Empty, ErrorState, PageHeader, Skeleton } from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { ProgramBuilder } from "@/components/strata/program-builder";
import type { Program } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ProgramSummary } from "@/components/strata/program-summary";
import { useShell } from "@/components/strata/shell";
import { searchPrograms } from "@/lib/programs";

const ProgramReferences = lazy(() =>
  import("@/components/strata/exercise-library").then((m) => ({ default: m.ProgramReferences })),
);

export const Route = createFileRoute("/app/programs")({
  head: () => ({
    meta: [
      { title: tr("Programs — Kinra") },
      {
        name: "description",
        content: "Manage training programs and session plans for your Kinra athletes.",
      },
      { property: "og:title", content: "Programs — Kinra" },
      {
        property: "og:description",
        content: "Manage training programs and session plans for your Kinra athletes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Programs,
});

function Programs() {
  useLanguage();
  const me = useMe().data;
  const { startSession, session, openSession } = useShell();
  const [editing, setEditing] = useState<Program | "new" | null>(null);
  const [references, setReferences] = useState(false);
  const [query, setQuery] = useState("");
  const programs = useQ(["programs"], (api) => api.programs());
  const matchedIds = new Set(
    searchPrograms(
      (programs.data ?? []).map((program) => localizedProgram(program)),
      query,
    ).map((program) => program.id),
  );
  const filtered = (programs.data ?? []).filter((program) => matchedIds.has(program.id));
  return (
    <div className="min-w-0">
      <div className="[&>header]:grid-cols-1 sm:[&>header]:grid-cols-[minmax(0,1fr)_auto]">
        <PageHeader
          eyebrow={tr("Training library")}
          title={tr("Programs")}
          action={
            me ? (
              <Button
                variant="volt"
                className="h-11 justify-self-start sm:justify-self-end"
                onClick={() => setEditing("new")}
              >
                <Plus />
                <Message source="New" />
              </Button>
            ) : undefined
          }
        />
      </div>
      <Button
        variant="glass"
        wrap
        className="mb-4 h-auto min-h-12 w-full py-3"
        onClick={() => setReferences((v) => !v)}
      >
        {references ? tr("Hide program library") : tr("Browse ready-to-use plans")}
      </Button>
      {references && (
        <div className="mb-6">
          <Suspense
            fallback={
              <p>
                <Message source="Loading programs…" />
              </p>
            }
          >
            <ProgramReferences />
          </Suspense>
        </div>
      )}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
        <Input
          aria-label={tr("Search program library")}
          placeholder={tr("Search programs or exercises")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 bg-surface pl-10 text-body"
        />
      </div>
      {programs.isLoading ? (
        <div aria-busy="true">
          <Skeleton className="h-52" />
          <Skeleton className="mt-4 h-52" />
        </div>
      ) : programs.error ? (
        <ErrorState onRetry={() => programs.refetch()} />
      ) : (
        <>
          {!programs.data?.length && (
            <Empty
              icon={<ClipboardList className="size-8" />}
              title={tr("Your next block starts here")}
              action={
                me ? (
                  <Button variant="glass" className="h-12" onClick={() => setEditing("new")}>
                    <Message source="Build program" />
                  </Button>
                ) : undefined
              }
            />
          )}
          {!!programs.data?.length && (
            <p className="mb-3 text-caption text-muted-foreground">
              <Message
                source="{p0}of {p1}programs"
                values={{ p0: filtered.length, p1: programs.data.length }}
              />
            </p>
          )}
          <div className="space-y-3">
            {filtered.map((program) => (
              <ProgramSummary
                key={program.id}
                program={program}
                eyebrow={tr(program.trainer_id === me?.id ? "Own plan" : "Assigned plan")}
                onStart={(day) =>
                  session ? openSession() : startSession(day, program.template_source)
                }
                startLabel={tr(session ? "Resume current session" : "Start this session")}
                actions={
                  me && program.trainer_id === me.id ? (
                    <Button
                      variant="glass"
                      className="h-11 text-label"
                      aria-label={tr("Edit {p0}", { p0: localizedProgram(program).name })}
                      onClick={() => setEditing(program)}
                    >
                      <Pencil />
                      <Message source="Edit plan" />
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </div>
          {!!programs.data?.length && !filtered.length && (
            <Empty
              icon={<Search className="size-7" />}
              title={tr("No matching programs")}
              action={
                <Button variant="glass" onClick={() => setQuery("")}>
                  <Message source="Clear search" />
                </Button>
              }
            />
          )}
        </>
      )}
      {editing && (
        <ProgramBuilder
          {...(editing === "new" ? {} : { program: editing })}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
