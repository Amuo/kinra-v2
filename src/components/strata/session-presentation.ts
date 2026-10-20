import { localizedProgram } from "@/lib/template-display";
import { currentLanguage, type Language } from "@/lib/i18n";
import type { LiveSessionState } from "./shell";
/** Read-only presentation. Raw session names, sets and completed-workout payloads never change. */
export function sessionPresentation(
  session: LiveSessionState,
  language: Language = currentLanguage(),
) {
  const source = session.displaySource;
  if (session.editingId || !source || typeof source.id !== "string" || source.version !== 1)
    return { title: session.title, exercises: session.exercises };
  const projected = localizedProgram(
    {
      id: session.workoutId,
      trainer_id: "",
      name: "",
      description: null,
      weeks: 1,
      template_source: source,
      days: [
        {
          title: session.title,
          exercises: session.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets.length,
            reps: "",
            ...(ex.catalogue_id !== undefined ? { catalogue_id: ex.catalogue_id } : {}),
            ...(ex.notes !== undefined ? { notes: ex.notes } : {}),
            ...(ex.tempo !== undefined ? { tempo: ex.tempo } : {}),
            ...(ex.equipment !== undefined ? { equipment: ex.equipment } : {}),
            ...(ex.group !== undefined ? { group: ex.group } : {}),
          })),
        },
      ],
    },
    language,
  );
  return {
    title: projected.days[0]!.title,
    exercises: session.exercises.map((ex, index) => ({
      ...ex,
      ...Object.fromEntries(
        Object.entries(projected.days[0]!.exercises[index]!).filter(([key]) =>
          ["notes", "tempo", "equipment", "group"].includes(key),
        ),
      ),
    })),
  };
}
