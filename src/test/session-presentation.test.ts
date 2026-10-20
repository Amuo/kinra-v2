import { expect, it } from "vitest";
import { sessionPresentation } from "@/components/strata/session-presentation";
import { sessionFromTemplate, toWorkoutRow } from "@/components/strata/session";
import { programTemplates, localizedTemplate } from "@/lib/program-templates";
import { readSession, writeSession } from "@/lib/account-state";

it("projects changing locales without changing session identities, edits or saved workout data", () => {
  const template = programTemplates.find((p) => p.type === "training")!;
  const session = sessionFromTemplate(template.days[0], [], false);
  const payload = toWorkoutRow(session, session.startedAt + 60000);
  session.displaySource = { id: template.id, version: 1 };
  const before = JSON.stringify(session);
  for (const language of ["en", "bs", "de"] as const) {
    const display = sessionPresentation(session, language);
    expect(display.title).toBe(localizedTemplate(template, language).days[0]!.title);
    display.exercises.forEach((ex, i) => {
      expect(ex.name).toBe(session.exercises[i]!.name);
      expect(ex.sets).toBe(session.exercises[i]!.sets);
      expect(ex.notes).toBe(localizedTemplate(template, language).days[0]!.exercises[i]!.notes);
    });
  }
  expect(JSON.stringify(session)).toBe(before);
  expect(toWorkoutRow(session, session.startedAt + 60000)).toEqual(payload);
  session.title = "My custom title";
  session.exercises[0]!.notes = "My custom instruction";
  expect(sessionPresentation(session, "de").title).toBe(session.title);
  expect(sessionPresentation(session, "bs").exercises[0]!.notes).toBe(session.exercises[0]!.notes);
});

it("persists UI provenance only in drafts and supports old drafts and historical edits", () => {
  const template = programTemplates.find((p) => p.type === "training")!;
  const session = sessionFromTemplate(template.days[0], [], false);
  writeSession(localStorage, "demo", "session-projection-test", session);
  expect(
    sessionPresentation(readSession(localStorage, "demo", "session-projection-test")!, "de").title,
  ).toBe(session.title);
  session.displaySource = { id: template.id, version: 1 };
  writeSession(localStorage, "demo", "session-projection-test", session);
  const restored = readSession(localStorage, "demo", "session-projection-test")!;
  expect(restored.displaySource).toEqual(session.displaySource);
  expect(sessionPresentation(restored, "de").title).toBe(
    localizedTemplate(template, "de").days[0]!.title,
  );
  restored.editingId = "historical-workout";
  expect(sessionPresentation(restored, "de").title).toBe(restored.title);
  expect(toWorkoutRow(restored, restored.startedAt)).not.toHaveProperty("displaySource");
  writeSession(localStorage, "demo", "session-projection-test", null);
});
