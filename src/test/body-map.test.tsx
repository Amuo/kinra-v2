import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { exercises, exerciseDisplayName } from "@/lib/exercise-catalogue";
import { sessionMuscles } from "@/lib/body-map";
import { BodyMap } from "@/components/strata/body-map";
import { setLanguage } from "@/lib/i18n";

describe("session body map", () => {
  it("uses reviewed roles, not misleading substrings or stabilizers", () => {
    const squat = sessionMuscles(["Back Squat"]);
    expect([...squat.primary]).toEqual(["quads", "glutes"]);
    expect(squat.primary.has("biceps")).toBe(false);
    expect(squat.secondary.has("chest")).toBe(false);
    expect(squat.secondary.has("calves")).toBe(false);
    expect([...sessionMuscles(["Leg Extension — Machine"]).primary]).toEqual(["quads"]);
    const bench = sessionMuscles(["Bench Press"]);
    expect([...bench.primary]).toEqual(["chest"]);
    expect([...bench.secondary]).toEqual(["shoulders", "triceps"]);
    expect(bench.secondary.has("abs")).toBe(false);
    expect(sessionMuscles(["Custom barbell extension flow"]).unmatched).toEqual([
      "Custom barbell extension flow",
    ]);
  });
  it("matches exact names in each locale and promotes supporting muscles to primary", () => {
    const bench = exercises.find((entry) => entry.id.startsWith("exercise-0060-"))!;
    for (const language of ["en", "bs", "de"] as const) {
      expect([...sessionMuscles([exerciseDisplayName(bench, language)]).primary]).toEqual([
        "chest",
      ]);
    }
    const combined = sessionMuscles(["Bench Press", "Triceps Pushdown"]);
    expect(combined.primary.has("triceps")).toBe(true);
    expect(combined.secondary.has("triceps")).toBe(false);
  });
  it("renders delineated front/back anatomy with visible roles and a graceful unknown state", () => {
    setLanguage("en", false);
    const { container, rerender } = render(<BodyMap exercises={["Bench Press"]} />);
    expect(screen.getByRole("figure")).toHaveAccessibleName("Muscles worked");
    expect(container.querySelectorAll("svg[aria-hidden=true]")).toHaveLength(2);
    expect(container.querySelector("rect")).toBeNull();
    expect(
      container.querySelectorAll('[data-muscle="chest"][data-role="primary"]').length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('[data-muscle="triceps"][data-role="secondary"]').length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('[data-muscle="abs"][data-role="inactive"]').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Primary targets")).toBeVisible();
    expect(screen.getByText("Supporting muscles")).toBeVisible();
    rerender(<BodyMap exercises={["My custom movement"]} />);
    expect(container.querySelector('[data-role="primary"]')).toBeNull();
    expect(screen.getByText("No muscle groups identified.")).toBeVisible();
    expect(screen.getByText("Some exercises could not be matched to the catalogue.")).toBeVisible();
  });
});
