import { afterEach, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { ProgramDetails } from "@/components/strata/program-summary";
import { programTemplates, localizedTemplate } from "@/lib/program-templates";
import { setLanguage } from "@/lib/i18n";
import type { Program } from "@/lib/types";
afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
it("localizes adopted plan presentation but starts the unchanged stored day", () => {
  const source = programTemplates.find((item) => item.type === "training")!;
  const program: Program = {
    id: "plan",
    trainer_id: "owner",
    name: source.title,
    description: source.summary,
    weeks: source.weeks,
    days: structuredClone(source.days),
    template_source: { id: source.id, version: 1 },
  };
  const before = JSON.stringify(program);
  const start = vi.fn();
  setLanguage("de", false);
  render(<ProgramDetails program={program} onStart={start} startLabel="Start" />);
  expect(
    screen.getByRole("heading", { name: localizedTemplate(source, "de").days[0]!.title }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Start" })[0]!);
  expect(start).toHaveBeenCalledWith(program.days[0]);
  expect(start.mock.calls[0]![0]).toBe(program.days[0]);
  expect(JSON.stringify(program)).toBe(before);
});
