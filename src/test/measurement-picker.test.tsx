import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MeasurementPicker } from "@/components/strata/measurement-picker";
import { StartingPoint } from "@/components/strata/starting-point";
import { initialOnboarding, type OnboardingAnswers } from "@/lib/onboarding";
import { setLanguage } from "@/lib/i18n";
vi.mock("@/components/strata/sheets", () => ({
  Sheet: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));
beforeEach(() => {
  setLanguage("en", false);
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
});
afterEach(cleanup);
const identity = (v: number) => v;
function picker(value: number | null = null, onChange = vi.fn()) {
  render(
    <MeasurementPicker
      label="Height (optional)"
      value={value}
      unit="cm"
      min={80}
      max={250}
      step={1}
      toDisplay={identity}
      toCanonical={identity}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Height \(optional\)/ }));
  return onChange;
}
describe("reviewed measurement wheels", () => {
  it("does not accept an unselected default or programmatic initial scroll, and supports keyboard choice", () => {
    const save = picker();
    const wheel = screen.getByRole("spinbutton");
    expect(screen.getByRole("button", { name: "Use value" })).toBeDisabled();
    fireEvent.scroll(wheel, { target: { scrollTop: 44 * 80 } });
    expect(screen.getByRole("button", { name: "Use value" })).toBeDisabled();
    fireEvent.keyDown(wheel, { key: "End" });
    expect(wheel).toHaveAttribute("aria-valuenow", "250");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Use value" }));
    expect(save).toHaveBeenCalledExactlyOnceWith(249);
  });
  it("keeps canceled edits and deliberately blank choices separate", () => {
    const save = picker(173);
    fireEvent.change(screen.getByRole("textbox", { name: /Enter value/ }), {
      target: { value: "180" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Height \(optional\)/ }));
    expect(screen.getByRole("textbox", { name: /Enter value/ })).toHaveValue("173");
    fireEvent.click(screen.getByRole("button", { name: "Leave blank" }));
    expect(save).toHaveBeenCalledExactlyOnceWith(null);
  });
  it("preserves exact canonical values until an edit and accepts comma decimals with range validation", () => {
    const save = vi.fn(),
      original = 72.5747792;
    render(
      <MeasurementPicker
        label="Weight (optional)"
        value={original}
        unit="lb"
        min={44.1}
        max={771.6}
        step={1}
        toDisplay={(v) => v / 0.45359237}
        toCanonical={(v) => v * 0.45359237}
        onChange={save}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Weight \(optional\)/ }));
    fireEvent.click(screen.getByRole("button", { name: "Use value" }));
    expect(save).toHaveBeenLastCalledWith(original);
    fireEvent.click(screen.getByRole("button", { name: /Weight \(optional\)/ }));
    const input = screen.getByRole("textbox", { name: /Enter value/ });
    for (const value of ["900", "0xb4", "Infinity"]) {
      fireEvent.change(input, { target: { value } });
      expect(screen.getByRole("button", { name: "Use value" })).toBeDisabled();
    }
    fireEvent.change(input, { target: { value: "161,5" } });
    fireEvent.click(screen.getByRole("button", { name: "Use value" }));
    expect(save).toHaveBeenLastCalledWith(161.5 * 0.45359237);
  });
  it("keeps canonical values unchanged when units switch", () => {
    function Harness() {
      const [answers, setAnswers] = useState<OnboardingAnswers>({
        ...initialOnboarding({
          id: "synthetic",
          display_name: "",
          goal: null,
          trainer_code: null,
          role: "solo",
        }),
        height_cm: 172.72,
        weight_kg: 72.5747792,
      });
      return (
        <>
          <StartingPoint
            answers={answers}
            update={(patch) => setAnswers((old) => ({ ...old, ...patch }))}
          />
          <output data-testid="canonical">{JSON.stringify(answers)}</output>
        </>
      );
    }
    render(<Harness />);
    for (const name of ["Imperial (in, lb)", "Metric (cm, kg)", "Imperial (in, lb)"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(JSON.parse(screen.getByTestId("canonical").textContent!)).toMatchObject({
        height_cm: 172.72,
        weight_kg: 72.5747792,
      });
    }
  });
});
