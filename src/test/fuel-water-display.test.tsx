import { afterEach, beforeEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FuelWater } from "@/components/strata/fuel-water";
import { setLanguage } from "@/lib/i18n";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
it("formats litres for each locale while keeping glass counts and owner/date storage unchanged", () => {
  for (const [language, expected] of [
    ["en", "0.25"],
    ["bs", "0,25"],
    ["de", "0,25"],
  ] as const) {
    setLanguage(language, false);
    const { container, unmount } = render(
      <FuelWater date="2026-10-21" owner={`${language}-synthetic`} />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]!);
    expect(container.textContent).toContain(`${expected} `);
    expect(localStorage.getItem(`strata:water:${language}-synthetic:2026-10-21`)).toBe("1");
    expect(
      screen
        .getAllByRole("button")
        .filter((button) => button.getAttribute("aria-pressed") === "true"),
    ).toHaveLength(1);
    unmount();
  }
});
