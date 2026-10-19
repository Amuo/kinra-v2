import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { LanguageSelector } from "@/components/strata/language-selector";
import {
  Message,
  countMessage,
  format,
  message,
  number,
  setLanguage,
  t,
  useLanguage,
} from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import {
  exercises,
  exerciseDisplayName,
  programExerciseName,
  searchExercises,
} from "@/lib/exercise-catalogue";
import names from "@/data/exercise-display-names.json";
import { featureSchemas } from "@/lib/feature-types";

beforeEach(() => {
  localStorage.clear();
  setLanguage("en", false);
});
afterEach(() => cleanup());
describe("language changes", () => {
  it("updates controls and complete messages without remounting or translating user drafts", () => {
    function Draft() {
      const { t } = useLanguage();
      const [draft, setDraft] = useState("Train · my own words");
      return (
        <>
          <LanguageSelector />
          <label>
            {t("Your message")}
            <input value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <p>
            <Message
              source="We sent a confirmation link to {p0}. Tap it to finish creating your account."
              values={{ p0: <strong>name@example.test</strong> }}
            />
          </p>
        </>
      );
    }
    render(<Draft />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "My saved draft 7.5" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "de" } });
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("My saved draft 7.5");
    expect(screen.getByText("Deine Nachricht")).toBeInTheDocument();
    expect(screen.getByText("name@example.test").tagName).toBe("STRONG");
    expect(localStorage.getItem("kinra:language")).toBe("de");
    expect(document.documentElement.lang).toBe("de");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "bs" } });
    expect(screen.getByText("Tvoja poruka")).toBeInTheDocument();
    expect(input).toHaveValue("My saved draft 7.5");
    act(() => setLanguage("en"));
    expect(screen.getByText("Your message")).toBeInTheDocument();
  });
  it("formats display values without converting their unit or underlying date", () => {
    setLanguage("de", false);
    expect(number(1234.5)).toBe("1.234,5");
    expect(format(new Date(2026, 9, 19, 12), "EEEE")).toBe("Montag");
    expect(t("{p0}kg", { p0: 7.5 })).toBe("7,5 kg");
    setLanguage("bs", false);
    expect(format(new Date(2026, 9, 19, 12), "EEEE")).toBe("ponedjeljak");
    expect(countMessage(1, "sets")).toBe("1 serija");
    expect(countMessage(2, "sets")).toBe("2 serije");
    expect(countMessage(5, "sets")).toBe("5 serija");
    setLanguage("de", false);
    expect(countMessage(1, "sets")).toBe("1 Satz");
    expect(countMessage(2, "sets")).toBe("2 Sätze");
  });
  it("keeps Bosnian comma decimals when a browser advertises legacy dot formatting", () => {
    setLanguage("bs", false);
    const probe = vi
      .spyOn(Intl.NumberFormat.prototype, "formatToParts")
      .mockReturnValueOnce([{ type: "decimal", value: "." }]);
    try {
      expect(number(1234.5)).toBe("1.234,5");
    } finally {
      probe.mockRestore();
    }
  });
  it("localizes known auth and validation failures and safely handles unknown errors", () => {
    setLanguage("de", false);
    expect(errorText("Invalid login credentials")).toContain("Passwort");
    expect(errorText(JSON.stringify([{ code: "too_small", minimum: 1, path: ["name"] }]))).toBe(
      "Name: Dieses Feld ist erforderlich.",
    );
    expect(errorText("Unrecognized private provider detail")).toBe(
      "Etwas ist schiefgelaufen. Versuche es erneut.",
    );
    expect(message("private workout title")).toBe("private workout title");
  });
  it("accepts exactly the three supported account language values", () => {
    for (const language of ["en", "bs", "de"])
      expect(
        featureSchemas.preferences.safeParse({
          language,
          theme: "dark",
          modules: {},
          timezone: "Europe/Sarajevo",
        }).success,
      ).toBe(true);
    expect(
      featureSchemas.preferences.safeParse({
        language: "fr",
        theme: "dark",
        modules: {},
        timezone: "UTC",
      }).success,
    ).toBe(false);
  });
  it("provides complete exercise display coverage and keeps source/custom names intact", () => {
    expect(Object.keys(names).sort()).toEqual(exercises.map((e) => e.id).sort());
    for (const e of exercises)
      for (const language of ["en", "bs", "de"] as const)
        expect(exerciseDisplayName(e, language).trim().length).toBeGreaterThan(0);
    const e = exercises[0]!;
    const original = e.name;
    setLanguage("de", false);
    expect(programExerciseName({ name: e.name, catalogue_id: e.id })).toBe(exerciseDisplayName(e));
    expect(programExerciseName({ name: "My own label", catalogue_id: e.id })).toBe("My own label");
    expect(searchExercises(exerciseDisplayName(e, "de")).some((x) => x.id === e.id)).toBe(true);
    expect(e.name).toBe(original);
  });
});
