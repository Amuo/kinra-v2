import { CardioReadout } from "./cardio-fields";
import { localizedProgram } from "@/lib/template-display";
import { programExerciseName } from "@/lib/exercise-catalogue";
import { t as tr } from "@/lib/i18n";
import { useLanguage, Message } from "@/lib/i18n";
import { ChevronDown, Play } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Program, ProgramDay } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProgramDetails({
  program,
  onStart,
  startLabel,
}: {
  program: Program;
  onStart?: ((day: ProgramDay) => void) | undefined;
  startLabel?: string | undefined;
}) {
  useLanguage();
  const display = localizedProgram(program);
  return (
    <>
      {display.description && (
        <p className="mt-3 break-words text-label text-muted-foreground">{display.description}</p>
      )}
      {display.days.map((day, i) => (
        <section key={i} className="mt-5 border-t border-border pt-4">
          <h3 className="text-label font-bold">{day.title}</h3>
          <div className="mt-3 space-y-3">
            {day.exercises.map((exercise, j) => (
              <div key={j}>
                <div className="break-words text-label font-semibold">
                  {programExerciseName(exercise)}
                </div>
                <div className="num mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption text-muted-foreground">
                  <span>
                    {exercise.tracking === "cardio"
                      ? tr("{count} cardio intervals", { count: exercise.sets })
                      : `${exercise.sets} × ${exercise.reps}`}
                  </span>
                  {exercise.tracking !== "cardio" && exercise.weight != null && (
                    <span className="text-pulse">
                      <Message source="{p0}kg" values={{ p0: exercise.weight }} />
                    </span>
                  )}
                  {exercise.rest_seconds != null && (
                    <span>
                      <Message source="{p0}s rest" values={{ p0: exercise.rest_seconds }} />
                    </span>
                  )}
                  {exercise.rpe != null && (
                    <span>
                      <Message source="RPE {p0}/10" values={{ p0: exercise.rpe }} />
                    </span>
                  )}
                  {exercise.tempo && (
                    <span>
                      <Message source="Tempo {p0}" values={{ p0: exercise.tempo }} />
                    </span>
                  )}
                </div>
                {exercise.tracking === "cardio" && (
                  <div className="mt-2">
                    <CardioReadout value={exercise.cardio} />
                  </div>
                )}
                {exercise.notes && (
                  <p className="mt-1 break-words text-caption text-muted-foreground">
                    {exercise.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
          {onStart && (
            <Button
              wrap
              variant="volt"
              className="mt-4 min-h-12 w-full"
              onClick={() => onStart(program.days[i]!)}
            >
              <Play className="size-4" aria-hidden="true" />
              {startLabel ?? tr("Start this session")}
            </Button>
          )}
        </section>
      ))}
    </>
  );
}

export function ProgramSummary({
  program,
  actions,
  eyebrow,
  onStart,
  startLabel,
}: {
  program: Program;
  actions?: ReactNode;
  eyebrow?: string;
  onStart?: (day: ProgramDay) => void;
  startLabel?: string;
}) {
  useLanguage();
  const display = localizedProgram(program);
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className="min-w-0 rounded-card border border-border bg-surface p-4">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <Button
        variant="ghost"
        aria-label={tr(open ? "Collapse {name}" : "Open {name}", { name: display.name })}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="h-auto min-h-14 w-full min-w-0 justify-between gap-3 whitespace-normal p-0 text-left hover:bg-transparent"
      >
        <span className="min-w-0">
          <span className="block break-words font-display text-title font-bold">
            {display.name}
          </span>
          <span className="num mt-2 block text-caption text-muted-foreground">
            <Message
              source="{p0}weeks · {p1}training days"
              values={{ p0: program.weeks, p1: program.days.length }}
            />
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
          <ProgramDetails program={program} onStart={onStart} startLabel={startLabel} />
          {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
    </article>
  );
}
