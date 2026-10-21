import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PhotoSection } from "@/components/strata/photos";
import { RecoverSleep } from "@/components/strata/recover-sleep";
import { RecoverBreathing } from "@/components/strata/recover-breathing";
import { ReportView } from "@/components/strata/report-view";
import { message, setLanguage } from "@/lib/i18n";
import type { ProgressPhoto, ReportSummary } from "@/lib/types";
const fixtures = vi.hoisted(() => ({ photos: [] as ProgressPhoto[] }));
vi.mock("@/lib/api", () => ({
  useQ: () => ({ data: fixtures.photos, isLoading: false }),
  useAct: () => ({ isPending: false, mutate: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  setLanguage("en", false);
  fixtures.photos = [];
});
it.each(["bs", "de"] as const)("localizes every breathing phase label in %s", (language) => {
  setLanguage(language, false);
  render(<RecoverBreathing onClose={vi.fn()} />);
  expect(screen.getAllByText(message("Hold"))).toHaveLength(2);
  expect(screen.getAllByText(message("Inhale"))).toHaveLength(2);
  expect(screen.getByText(message("Exhale"))).toBeInTheDocument();
  expect(screen.queryByText("Inhale")).not.toBeInTheDocument();
  expect(screen.queryByText("Hold")).not.toBeInTheDocument();
});
it("separates sleep period counts and the recorded-night summary", () => {
  render(<RecoverSleep sleep={[]} onLog={vi.fn()} />);
  expect(screen.getByRole("button", { name: "7 nights" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "14 nights" })).toBeInTheDocument();
  expect(screen.getByText("Nights logged: 0 · last 14")).toBeInTheDocument();
});
it("localizes comparison modes and photo poses without changing private photo metadata", () => {
  setLanguage("de", false);
  fixtures.photos = [1, 2].map((i) => ({
    id: String(i),
    user_id: "synthetic",
    taken_on: `2026-10-${22 - i}`,
    pose: "Front",
    storage_path: "private",
    note: null,
    url: `/fixture-${i}.png`,
  }));
  const before = JSON.stringify(fixtures.photos);
  render(<PhotoSection userId="synthetic" canEdit />);
  expect(screen.getByText("Zum Vergleichen ziehen · Fotos (Vorne): 2")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Foto hinzufügen: Vorne" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: message("Side by side") }));
  expect(screen.getByText("Vergleich nebeneinander · Fotos (Vorne): 2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: message("Side") }));
  expect(screen.getByText("Noch keine Fotos: Seite")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Foto hinzufügen: Seite" })).toBeInTheDocument();
  expect(JSON.stringify(fixtures.photos)).toBe(before);
});
it("formats report numbers and comparisons while preserving authored commentary and stored values", () => {
  setLanguage("de", false);
  const report: ReportSummary = {
    periodDays: 30,
    from: "2026-09-21",
    to: "2026-10-21",
    sessions: 16,
    prevSessions: 2,
    adherence: 1,
    volume: 1000,
    volumeDeltaPct: 2.5,
    minutes: 1104,
    avgRpe: 7.5,
    avgSleep: 7.1,
    avgSleepQuality: 4,
    avgKcal: 2000,
    avgProtein: 100,
    loggedFoodDays: 14,
    weightStart: 80,
    weightEnd: 78.5,
    avgMood: 4,
    avgEnergy: 4,
    prs: [{ exercise: "My authored exercise", prev: 82.5, weight: 90 }],
    highlights: [],
    watchouts: [],
  };
  const before = JSON.stringify(report);
  render(<ReportView s={report} comment="My English coach comment" />);
  expect(screen.getByText("+14 zum vorherigen Zeitraum")).toBeInTheDocument();
  expect(screen.getByText("18,4")).toBeInTheDocument();
  expect(screen.getByText("-1,5 kg")).toBeInTheDocument();
  expect(screen.getByText("82,5 →")).toBeInTheDocument();
  expect(screen.getByText("My English coach comment")).toBeInTheDocument();
  expect(JSON.stringify(report)).toBe(before);
});
