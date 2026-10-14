import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardList, Plus, Pencil, Search } from "lucide-react";
import { useMe, useQ } from "@/lib/api";
import { Empty, ErrorState, PageHeader, Skeleton } from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { ProgramBuilder } from "@/components/strata/program-builder";
import type { Program } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ProgramSummary } from "@/components/strata/program-summary";
import { searchPrograms } from "@/lib/programs";

export const Route = createFileRoute("/app/programs")({
  head: () => ({
    meta: [
      { title: "Programs — Kinra" },
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
  const me = useMe().data;
  const [editing, setEditing] = useState<Program | "new" | null>(null);
  const [query, setQuery] = useState("");
  const programs = useQ(["programs"], (api) => api.programs());
  const filtered = searchPrograms(programs.data ?? [], query);
  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Training library"
        title="Programs"
        action={
          me?.role === "trainer" ? (
            <Button variant="volt" className="h-11" onClick={() => setEditing("new")}>
              <Plus />
              New
            </Button>
          ) : undefined
        }
      />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 size-5 text-muted-foreground" />
        <Input
          aria-label="Search program library"
          placeholder="Search programs or exercises"
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
              title="Your next block starts here"
              action={
                me?.role === "trainer" ? (
                  <Button variant="glass" className="h-12" onClick={() => setEditing("new")}>
                    Build program
                  </Button>
                ) : undefined
              }
            />
          )}
          {!!programs.data?.length && (
            <p className="mb-3 text-caption text-muted-foreground">
              {filtered.length} of {programs.data.length} programs
            </p>
          )}
          <div className="space-y-3">
            {filtered.map((program) => (
              <ProgramSummary
                key={program.id}
                program={program}
                actions={
                  me?.role === "trainer" && program.trainer_id === me.id ? (
                    <Button
                      variant="glass"
                      className="h-11 text-label"
                      aria-label={`Edit ${program.name}`}
                      onClick={() => setEditing(program)}
                    >
                      <Pencil />
                      Edit plan
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </div>
          {!!programs.data?.length && !filtered.length && (
            <Empty
              icon={<Search className="size-7" />}
              title="No matching programs"
              action={
                <Button variant="glass" onClick={() => setQuery("")}>
                  Clear search
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
