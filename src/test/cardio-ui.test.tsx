import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { LiveSession, sessionFromTemplate, toWorkoutRow } from "@/components/strata/session";
import { CardioFields } from "@/components/strata/cardio-fields";
import type { LiveSessionState } from "@/components/strata/shell";
import type { CardioMetrics } from "@/lib/cardio";
import { setLanguage, t } from "@/lib/i18n";
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  useMe: () => ({ data: { id: "cardio-test-owner" } }),
  useLog: () => ({ data: [] }),
  useAct: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }),
}));
afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
it.each(["en", "bs", "de"] as const)(
  "preserves blank, zero and signed incline with labelled %s inputs",
  (language) => {
    setLanguage(language, false);
    let last: CardioMetrics = {};
    function Harness() {
      const [value, setValue] = useState<CardioMetrics>({});
      return (
        <CardioFields
          value={value}
          onChange={(next) => {
            last = next;
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    const speed = screen.getByLabelText(t("Speed · km/h"));
    fireEvent.change(speed, { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(t("Incline · %")), { target: { value: "-2" } });
    expect(last).toEqual({ speed_kmh: 0, incline_percent: -2 });
    fireEvent.change(speed, { target: { value: "" } });
    expect(last).toEqual({ incline_percent: -2 });
    fireEvent.change(screen.getByLabelText(t("Duration · seconds")), { target: { value: "1.5" } });
    expect(screen.getByLabelText(t("Duration · seconds"))).toHaveAttribute("aria-invalid", "true");
  },
);
it("does not record targets as actuals and completes only an explicitly entered cardio interval", () => {
  const initial = sessionFromTemplate(
    {
      title: "Run",
      exercises: [
        {
          name: "Treadmill",
          sets: 1,
          reps: "",
          tracking: "cardio",
          cardio: { duration_seconds: 600, speed_kmh: 8 },
        },
      ],
    },
    [],
    false,
  );
  initial.pausedAt = Date.now();
  let latest: LiveSessionState = initial;
  function Harness() {
    const [session, setSession] = useState(initial);
    return (
      <LiveSession
        session={session}
        setSession={(next) => {
          latest = next;
          setSession(next);
        }}
        minimized={false}
        setMinimized={vi.fn()}
        onClose={vi.fn()}
      />
    );
  }
  render(<Harness />);
  expect(screen.getByLabelText("Duration · seconds")).toHaveValue(null);
  expect(screen.getByRole("button", { name: "Complete interval" })).toBeDisabled();
  expect(screen.queryByText(/Planned load/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Duration · seconds"), { target: { value: "420" } });
  fireEvent.change(screen.getByLabelText("Incline · %"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Complete interval" }));
  expect(latest.exercises[0]!.sets[0]!.done).toBe(true);
  expect(latest.exercises[0]!.sets[0]!.pr).toBe(false);
  expect(toWorkoutRow(latest, latest.startedAt + 1000).sets?.[0]).toMatchObject({
    tracking: "cardio",
    reps: 0,
    weight: 0,
    cardio: { duration_seconds: 420, incline_percent: 0 },
  });
  expect(latest.exercises[0]!.sets[0]!.cardio).not.toHaveProperty("speed_kmh");
});

it.each(["en", "bs", "de"] as const)(
  "uses general cardio effort and preserves mixed-session guidance in %s",
  (language) => {
    setLanguage(language, false);
    for (const mixed of [false, true]) {
      const session = sessionFromTemplate(undefined, [], false);
      session.exercises = [
        {
          name: "Run",
          tracking: "cardio",
          sets: [{ kg: 0, reps: 0, done: true, cardio: { duration_seconds: 300 } }],
        },
      ];
      if (mixed) session.exercises.push({ name: "Squat", sets: [{ kg: 20, reps: 8, done: true }] });
      session.pausedAt = Date.now();
      const view = render(
        <LiveSession
          session={session}
          setSession={vi.fn()}
          minimized={false}
          setMinimized={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: t("End") }));
      fireEvent.click(screen.getByRole("button", { name: t("Finish & save") }));
      expect(screen.getByText(t(mixed ? "Could do 3 more reps" : "Hard"))).toBeInTheDocument();
      expect(
        screen.queryByText(t(mixed ? "Hard" : "Could do 3 more reps")),
      ).not.toBeInTheDocument();
      view.unmount();
    }
  },
);
