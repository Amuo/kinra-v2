import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TodaySession } from "@/components/strata/client-overview";
import { setLanguage, t } from "@/lib/i18n";
const data = vi.hoisted(() => ({
  program: {
    id: "plan",
    trainer_id: "coach",
    name: "Custom plan",
    description: null,
    weeks: 2,
    days: [
      { title: "Completed custom day", exercises: [] },
      { title: "SYNTHETIC cardio prescription", exercises: [] },
    ],
  },
  workout: {
    id: "workout",
    user_id: "owner",
    title: "Completed custom day",
    performed_at: new Date().toISOString(),
    sets: [],
    duration_min: 10,
    rpe: 5,
  },
}));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  useLog: () => ({ data: [data.workout] }),
  useQ: (key: string[]) => ({
    data: key[0] === "assignments" ? [{ program_id: "plan" }] : [data.program],
    isLoading: false,
  }),
}));
afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
it.each(["en", "bs", "de"] as const)(
  "translates the next weekday in %s without translating custom day names",
  (language) => {
    setLanguage(language, false);
    render(<TodaySession userId="owner" />);
    const nextDate = new Date(data.workout.performed_at);
    nextDate.setDate(nextDate.getDate() + 2);
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][nextDate.getDay()]!;
    const title = screen.getByText("SYNTHETIC cardio prescription");
    expect(title.parentElement?.textContent).toContain(`· ${t(weekday)}`);
    expect(screen.getByText("Completed custom day")).toBeInTheDocument();
  },
);
