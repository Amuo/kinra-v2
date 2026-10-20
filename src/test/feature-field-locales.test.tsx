import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { z } from "zod";
import { SchemaFields } from "@/components/strata/feature-fields";
import { setLanguage } from "@/lib/i18n";
afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
it("renders date-only promotion expiry without introducing a time", () => {
  let result: unknown;
  render(
    <SchemaFields
      schema={z.object({ valid_until: z.string() })}
      value={{ valid_until: "2026-12-31" }}
      onChange={(value) => {
        result = value;
      }}
    />,
  );
  const input = screen.getByLabelText("Valid Until") as HTMLInputElement;
  expect(input.type).toBe("date");
  expect(input.value).toBe("2026-12-31");
  fireEvent.change(input, { target: { value: "2027-01-02" } });
  expect(result).toEqual({ valid_until: "2027-01-02" });
});
it("shows translated weekday labels while storing canonical day numbers", () => {
  setLanguage("de", false);
  let result: unknown;
  render(
    <SchemaFields
      schema={z.object({ weekdays: z.array(z.number()) })}
      value={{ weekdays: [] }}
      onChange={(value) => {
        result = value;
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Mo" }));
  expect(result).toEqual({ weekdays: [1] });
  expect(screen.queryByRole("button", { name: "Mon" })).toBeNull();
});
