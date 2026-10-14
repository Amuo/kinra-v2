import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Program } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProgramDetails({ program }: { program: Program }) {
  return (
    <>
      {program.description && (
        <p className="mt-3 break-words text-label text-muted-foreground">{program.description}</p>
      )}
      {program.days.map((day, i) => (
        <section key={i} className="mt-5 border-t border-border pt-4">
          <h3 className="text-label font-bold">{day.title}</h3>
          <div className="mt-3 space-y-3">
            {day.exercises.map((exercise, j) => (
              <div key={j}>
                <div className="break-words text-label font-semibold">{exercise.name}</div>
                <div className="num mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption text-muted-foreground">
                  <span>
                    {exercise.sets} × {exercise.reps}
                  </span>
                  {exercise.weight != null && (
                    <span className="text-pulse">{exercise.weight} kg</span>
                  )}
                  {exercise.rest_seconds != null && <span>{exercise.rest_seconds}s rest</span>}
                  {exercise.rpe != null && <span>RPE {exercise.rpe}/10</span>}
                  {exercise.tempo && <span>Tempo {exercise.tempo}</span>}
                </div>
                {exercise.notes && (
                  <p className="mt-1 break-words text-caption text-muted-foreground">
                    {exercise.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export function ProgramSummary({
  program,
  actions,
  eyebrow,
}: {
  program: Program;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className="min-w-0 rounded-card border border-border bg-surface p-4">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <Button
        variant="ghost"
        aria-label={`${open ? "Collapse" : "Open"} ${program.name}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="h-auto min-h-14 w-full min-w-0 justify-between gap-3 whitespace-normal p-0 text-left hover:bg-transparent"
      >
        <span className="min-w-0">
          <span className="block break-words font-display text-title font-bold">
            {program.name}
          </span>
          <span className="num mt-2 block text-caption text-muted-foreground">
            {program.weeks} weeks · {program.days.length} training days
          </span>
        </span>
        <ChevronDown
          className={cn(
            "shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </Button>
      {open && (
        <div id={id}>
          <ProgramDetails program={program} />
          {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
    </article>
  );
}
