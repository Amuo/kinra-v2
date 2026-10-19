import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { lazy, Suspense, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAct, useApi } from "@/lib/api";
import { blankDay, blankExercise, programDraft, programError } from "@/lib/programs";
import type { Program, ProgramDay, ProgramExercise } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "./sheets";

const ExerciseLibrary = lazy(() =>
  import("./exercise-library").then((m) => ({ default: m.ExerciseLibrary })),
);

export function ProgramBuilder({
  program,
  clientId,
  onClose,
}: {
  program?: Program;
  clientId?: string;
  onClose: () => void;
}) {
  useLanguage();
  const [draft, setDraft] = useState(() => programDraft(program));
  const [picking, setPicking] = useState<{ day: number; exercise: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedId = useRef<string | null>(null);
  const qc = useQueryClient();
  const { mode, ownerId } = useApi();
  const save = useAct(async (api) => {
    if (program) return api.updateProgram(program.id, draft);
    if (!savedId.current) savedId.current = await api.saveProgram(draft);
    if (clientId) await api.assign(savedId.current, clientId);
  });
  const updateDay = (i: number, patch: Partial<ProgramDay>) =>
    setDraft((prev) => ({
      ...prev,
      days: prev.days.map((day, index) => (index === i ? { ...day, ...patch } : day)),
    }));
  const updateExercise = (i: number, j: number, patch: Partial<ProgramExercise>) =>
    setDraft((prev) => ({
      ...prev,
      days: prev.days.map((day, index) =>
        index === i
          ? {
              ...day,
              exercises: day.exercises.map((exercise, k) =>
                j === k ? { ...exercise, ...patch } : exercise,
              ),
            }
          : day,
      ),
    }));
  const numeric = (value: string) => (value === "" ? null : Number(value));
  const inputClass = "num h-12 rounded-tile bg-surface text-body";
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !save.isPending) onClose();
      }}
      title={
        program ? tr("Edit program") : clientId ? tr("Custom client program") : tr("New program")
      }
      sub={
        program
          ? tr(
              "Changes apply to assigned clients' future sessions. Completed workouts stay unchanged.",
            )
          : clientId
            ? ""
            : tr("Build your next training block.")
      }
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 size-11 rounded-full"
        aria-label={tr("Close program editor")}
        disabled={save.isPending}
        onClick={onClose}
      >
        <X />
      </Button>
      <fieldset disabled={save.isPending || !!savedId.current} className="min-w-0 space-y-4">
        <label className="block">
          <span className="mb-2 block text-label font-semibold">
            <Message source="Program name" />
          </span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder={tr("Program name")}
            className="h-12 rounded-tile bg-surface text-body"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-label font-semibold">
            <Message source="Description" />
          </span>
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder={tr("Focus for this block")}
            className="rounded-tile bg-surface text-body"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-label font-semibold">
            <Message source="Weeks" />
          </span>
          <Input
            aria-label={tr("Weeks")}
            type="number"
            min={1}
            step={1}
            value={draft.weeks || ""}
            onChange={(e) => setDraft({ ...draft, weeks: Number(e.target.value) })}
            className={`${inputClass} w-24 text-center`}
          />
        </label>
        {draft.days.map((day, i) => (
          <section
            key={i}
            aria-label={tr("Training day {p0}", { p0: i + 1 })}
            className="border-t border-border pt-6"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-title font-bold">
                <Message source="Day {p0}" values={{ p0: i + 1 }} />
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full text-muted-foreground"
                aria-label={tr("Remove day {p0}", { p0: i + 1 })}
                onClick={() =>
                  setDraft({ ...draft, days: draft.days.filter((_, index) => index !== i) })
                }
              >
                <Trash2 />
              </Button>
            </div>
            <Input
              aria-label={tr("Day {p0} title", { p0: i + 1 })}
              value={day.title}
              onChange={(e) => updateDay(i, { title: e.target.value })}
              className="mb-4 h-12 rounded-tile bg-surface text-body font-semibold"
            />
            {day.exercises.map((exercise, j) => (
              <div
                key={j}
                role="group"
                aria-label={tr("Day {p0} exercise {p1}", { p0: i + 1, p1: j + 1 })}
                className="mb-5 rounded-tile border border-border bg-surface/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="eyebrow">
                    <Message source="Exercise {p0}" values={{ p0: j + 1 }} />
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 rounded-full text-muted-foreground"
                    aria-label={tr("Remove exercise {p0} from day {p1}", { p0: j + 1, p1: i + 1 })}
                    onClick={() =>
                      updateDay(i, { exercises: day.exercises.filter((_, k) => k !== j) })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <label className="block">
                  <span className="mb-2 block text-label font-semibold">
                    <Message source="Exercise" />
                  </span>
                  <Input
                    value={exercise.name}
                    placeholder={tr("Exercise name")}
                    onChange={(e) => updateExercise(i, j, { name: e.target.value })}
                    className="h-12 rounded-tile bg-surface text-body"
                  />
                </label>
                <Button
                  wrap
                  variant="glass"
                  className="mt-3 h-11 w-full"
                  onClick={() => setPicking({ day: i, exercise: j })}
                >
                  <Message source="Choose from exercise library" />
                </Button>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Section" />
                    </span>
                    <select
                      className={inputClass + " w-full border border-input px-2"}
                      value={exercise.section ?? "main"}
                      onChange={(e) =>
                        updateExercise(i, j, {
                          section: e.target.value as "warmup" | "main" | "cooldown",
                        })
                      }
                    >
                      <option value="warmup">
                        <Message source="Warm-up" />
                      </option>
                      <option value="main">
                        <Message source="Main work" />
                      </option>
                      <option value="cooldown">
                        <Message source="Cool-down" />
                      </option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Group / superset" />
                    </span>
                    <Input
                      className={inputClass}
                      value={exercise.group ?? ""}
                      placeholder={tr("A, B, circuit…")}
                      onChange={(e) => updateExercise(i, j, { group: e.target.value })}
                    />
                  </label>
                  <label className="col-span-2">
                    <span className="mb-2 block text-label">
                      <Message source="Equipment" />
                    </span>
                    <Input
                      className={inputClass}
                      value={exercise.equipment ?? ""}
                      placeholder={tr("Dumbbells, bench…")}
                      onChange={(e) => updateExercise(i, j, { equipment: e.target.value })}
                    />
                  </label>
                  <label className="col-span-2">
                    <span className="mb-2 block text-label">
                      <Message source="Substitutions · one per line" />
                    </span>
                    <Textarea
                      className="bg-surface text-body"
                      value={(exercise.substitutions ?? []).join("\n")}
                      onChange={(e) =>
                        updateExercise(i, j, { substitutions: e.target.value.split("\n") })
                      }
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Sets" />
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={exercise.sets || ""}
                      onChange={(e) => updateExercise(i, j, { sets: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Reps" />
                    </span>
                    <Input
                      value={exercise.reps}
                      placeholder="8–10"
                      onChange={(e) => updateExercise(i, j, { reps: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Weight · kg" />
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={exercise.weight ?? ""}
                      placeholder={tr("Previous")}
                      onChange={(e) => updateExercise(i, j, { weight: numeric(e.target.value) })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Rest · seconds" />
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={exercise.rest_seconds ?? ""}
                      placeholder={tr("Auto")}
                      onChange={(e) =>
                        updateExercise(i, j, { rest_seconds: numeric(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Effort · RPE / 10" />
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      step={1}
                      value={exercise.rpe ?? ""}
                      placeholder={tr("Optional")}
                      onChange={(e) => updateExercise(i, j, { rpe: numeric(e.target.value) })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">
                      <Message source="Tempo" />
                    </span>
                    <Input
                      value={exercise.tempo ?? ""}
                      placeholder="3-1-1"
                      onChange={(e) => updateExercise(i, j, { tempo: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-label">
                    <Message source="Coach notes" />
                  </span>
                  <Textarea
                    value={exercise.notes ?? ""}
                    placeholder={tr("Cues, warm-up, or substitutions")}
                    onChange={(e) => updateExercise(i, j, { notes: e.target.value })}
                    className="rounded-tile bg-surface text-body"
                  />
                </label>
              </div>
            ))}
            <Button
              wrap
              variant="glass"
              className="h-11 w-full text-label"
              onClick={() => updateDay(i, { exercises: [...day.exercises, blankExercise()] })}
            >
              <Plus />
              <Message source="Add exercise" />
            </Button>
          </section>
        ))}
        <Button
          wrap
          variant="glass"
          className="h-12 w-full text-label"
          onClick={() =>
            setDraft({ ...draft, days: [...draft.days, blankDay(draft.days.length + 1)] })
          }
        >
          <Plus />
          <Message source="Add day" />
        </Button>
      </fieldset>
      {picking && (
        <Sheet open onOpenChange={(o) => !o && setPicking(null)} title={tr("Choose an exercise")}>
          <Suspense
            fallback={
              <p>
                <Message source="Loading library…" />
              </p>
            }
          >
            <ExerciseLibrary
              onPick={(entry) => {
                updateExercise(picking.day, picking.exercise, {
                  name: entry.name,
                  catalogue_id: entry.id,
                });
                setPicking(null);
              }}
            />
          </Suspense>
        </Sheet>
      )}
      {error && (
        <p role="alert" className="mt-4 text-label text-destructive">
          {errorText(error)}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-border bg-popover px-5 py-4">
        <Button
          wrap
          variant="volt"
          className="h-14 w-full text-body"
          disabled={save.isPending}
          onClick={() => {
            const validation = programError(draft);
            setError(validation);
            if (validation) return;
            save.mutate(undefined, {
              onSuccess: () => {
                toast.success(
                  program
                    ? tr("Program updated")
                    : clientId
                      ? tr("Program saved and assigned")
                      : tr("Program saved"),
                );
                onClose();
              },
              onError: () => {
                qc.invalidateQueries({ queryKey: [mode, ownerId, "programs"] });
                setError(
                  savedId.current
                    ? tr(
                        "Program saved in your library, but assignment failed. Retry to assign it without creating another copy.",
                      )
                    : tr("Couldn't save this plan. Your draft is still here; try again."),
                );
              },
            });
          }}
        >
          {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {save.isPending
            ? tr("Saving…")
            : program
              ? tr("Save changes")
              : clientId
                ? savedId.current
                  ? tr("Retry assignment")
                  : tr("Save & assign")
                : tr("Save program")}
        </Button>
      </div>
    </Sheet>
  );
}
