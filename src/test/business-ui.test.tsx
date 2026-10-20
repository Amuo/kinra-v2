import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BusinessScanner } from "@/components/strata/business-scanner";
import {
  businessDate,
  businessTime,
  businessInputISO,
  businessLocalInput,
} from "@/components/strata/business-ui";
import { setLanguage, t } from "@/lib/i18n";

afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
describe("business time inputs", () => {
  it("renders every Bosnian membership month numerically without ICU month placeholders", () => {
    setLanguage("bs", false);
    for (let month = 1; month <= 12; month++) {
      const mm = String(month).padStart(2, "0");
      expect(businessDate(`2026-${mm}-21`)).toBe(`21.${mm}.2026`);
      expect(businessDate(`2026-${mm}-21`)).not.toMatch(/M\d+/);
    }
  });
  it("keeps the business timezone and calendar-day rollover in Bosnian time displays", () => {
    setLanguage("bs", false);
    expect(businessTime("2026-10-20T23:30:00Z", "Europe/Sarajevo")).toBe("21.10.2026 01:30");
    expect(businessTime("2026-10-20T23:30:00Z", "America/Los_Angeles")).toBe("20.10.2026 16:30");
  });
  it("converts Sarajevo wall time independently of the receptionist's device timezone", () => {
    expect(businessInputISO("2026-10-20T18:00", "Europe/Sarajevo")).toBe(
      "2026-10-20T16:00:00.000Z",
    );
    expect(businessLocalInput("2026-12-20T17:00:00Z", "Europe/Sarajevo")).toBe("2026-12-20T18:00");
  });
  it("rejects nonexistent spring-forward times instead of silently changing a booking", () => {
    expect(() => businessInputISO("2026-03-29T02:30", "Europe/Sarajevo")).toThrow();
  });
});
it.each(["en", "bs", "de"] as const)(
  "supports keyboard scanner submission with localized labels in %s",
  (language) => {
    setLanguage(language, false);
    const onScan = vi.fn();
    render(<BusinessScanner busy={false} onScan={onScan} />);
    const input = screen.getByLabelText(t("Member pass code"));
    fireEvent.change(input, { target: { value: "kb1:opaque-test-token" } });
    fireEvent.submit(input.closest("form")!);
    expect(onScan).toHaveBeenCalledWith("kb1:opaque-test-token");
    expect(input).toHaveValue("");
  },
);
it("prevents duplicate keyboard submission while an entry is being checked", () => {
  const onScan = vi.fn();
  render(<BusinessScanner busy onScan={onScan} />);
  expect(screen.getByLabelText("Member pass code")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
  expect(onScan).not.toHaveBeenCalled();
});
