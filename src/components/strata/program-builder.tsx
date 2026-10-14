import { useRef, useState } from "react";
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

export function ProgramBuilder({
  program,
  clientId,
  onClose,
}: {
  program?: Program;
  clientId?: string;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => programDraft(program));
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
      title={program ? "Edit program" : clientId ? "Custom client program" : "New program"}
      sub={
        program
          ? "Changes apply to assigned clients' future sessions. Completed workouts stay unchanged."
          : clientId
            ? ""
            : "Build your next training block."
      }
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 size-11 rounded-full"
        aria-label="Close program editor"
        disabled={save.isPending}
        onClick={onClose}
      >
        <X />
      </Button>
      <fieldset disabled={save.isPending || !!savedId.current} className="min-w-0 space-y-4">
        <label className="block">
          <span className="mb-2 block text-label font-semibold">Program name</span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Program name"
            className="h-12 rounded-tile bg-surface text-body"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-label font-semibold">Description</span>
          <Textarea
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Focus for this block"
            className="rounded-tile bg-surface text-body"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-label font-semibold">Weeks</span>
          <Input
            aria-label="Weeks"
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
            aria-label={`Training day ${i + 1}`}
            className="border-t border-border pt-6"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-display text-title font-bold">Day {i + 1}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full text-muted-foreground"
                aria-label={`Remove day ${i + 1}`}
                onClick={() =>
                  setDraft({ ...draft, days: draft.days.filter((_, index) => index !== i) })
                }
              >
                <Trash2 />
              </Button>
            </div>
            <Input
              aria-label={`Day ${i + 1} title`}
              value={day.title}
              onChange={(e) => updateDay(i, { title: e.target.value })}
              className="mb-4 h-12 rounded-tile bg-surface text-body font-semibold"
            />
            {day.exercises.map((exercise, j) => (
              <div
                key={j}
                role="group"
                aria-label={`Day ${i + 1} exercise ${j + 1}`}
                className="mb-5 rounded-tile border border-border bg-surface/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="eyebrow">Exercise {j + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 rounded-full text-muted-foreground"
                    aria-label={`Remove exercise ${j + 1} from day ${i + 1}`}
                    onClick={() =>
                      updateDay(i, { exercises: day.exercises.filter((_, k) => k !== j) })
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <label className="block">
                  <span className="mb-2 block text-label font-semibold">Exercise</span>
                  <Input
                    value={exercise.name}
                    placeholder="Exercise name"
                    onChange={(e) => updateExercise(i, j, { name: e.target.value })}
                    className="h-12 rounded-tile bg-surface text-body"
                  />
                </label>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-2 block text-label">Sets</span>
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
                    <span className="mb-2 block text-label">Reps</span>
                    <Input
                      value={exercise.reps}
                      placeholder="8–10"
                      onChange={(e) => updateExercise(i, j, { reps: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">Weight · kg</span>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={exercise.weight ?? ""}
                      placeholder="Previous"
                      onChange={(e) => updateExercise(i, j, { weight: numeric(e.target.value) })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">Rest · seconds</span>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={exercise.rest_seconds ?? ""}
                      placeholder="Auto"
                      onChange={(e) =>
                        updateExercise(i, j, { rest_seconds: numeric(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">Effort · RPE / 10</span>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      step={1}
                      value={exercise.rpe ?? ""}
                      placeholder="Optional"
                      onChange={(e) => updateExercise(i, j, { rpe: numeric(e.target.value) })}
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-label">Tempo</span>
                    <Input
                      value={exercise.tempo ?? ""}
                      placeholder="3-1-1"
                      onChange={(e) => updateExercise(i, j, { tempo: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-label">Coach notes</span>
                  <Textarea
                    value={exercise.notes ?? ""}
                    placeholder="Cues, warm-up, or substitutions"
                    onChange={(e) => updateExercise(i, j, { notes: e.target.value })}
                    className="rounded-tile bg-surface text-body"
                  />
                </label>
              </div>
            ))}
            <Button
              variant="glass"
              className="h-11 w-full text-label"
              onClick={() => updateDay(i, { exercises: [...day.exercises, blankExercise()] })}
            >
              <Plus />
              Add exercise
            </Button>
          </section>
        ))}
        <Button
          variant="glass"
          className="h-12 w-full text-label"
          onClick={() =>
            setDraft({ ...draft, days: [...draft.days, blankDay(draft.days.length + 1)] })
          }
        >
          <Plus />
          Add day
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="mt-4 text-label text-destructive">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-border bg-popover px-5 py-4">
        <Button
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
                    ? "Program updated"
                    : clientId
                      ? "Program saved and assigned"
                      : "Program saved",
                );
                onClose();
              },
              onError: () => {
                qc.invalidateQueries({ queryKey: [mode, ownerId, "programs"] });
                setError(
                  savedId.current
                    ? "Program saved in your library, but assignment failed. Retry to assign it without creating another copy."
                    : "Couldn't save this plan. Your draft is still here; try again.",
                );
              },
            });
          }}
        >
          {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {save.isPending
            ? "Saving…"
            : program
              ? "Save changes"
              : clientId
                ? savedId.current
                  ? "Retry assignment"
                  : "Save & assign"
                : "Save program"}
        </Button>
      </div>
    </Sheet>
  );
}
