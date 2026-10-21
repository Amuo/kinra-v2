import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { CoachCode } from "@/components/strata/coach-code";
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("confirms only a completed copy and keeps the exact coach code", async () => {
  let done!: () => void;
  const writeText = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        done = resolve;
      }),
  );
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  render(<CoachCode code="ABC123" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
  expect(writeText).toHaveBeenCalledWith("ABC123");
  expect(toast.success).not.toHaveBeenCalled();
  expect(screen.getByRole("button")).toBeDisabled();
  await act(async () => done());
  expect(toast.success).toHaveBeenCalledWith("Copied");
  expect(screen.getByText("ABC123")).toBeInTheDocument();
});
it.each(["denied", "unavailable"])("offers manual copying when clipboard is %s", async (cause) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value:
      cause === "denied"
        ? { writeText: vi.fn().mockRejectedValue(new Error("denied")) }
        : undefined,
  });
  render(<CoachCode code="ABC123" />);
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't copy the code. Select and copy it manually.",
    ),
  );
  expect(toast.success).not.toHaveBeenCalled();
  expect(screen.getByRole("button")).toBeEnabled();
  expect(screen.getByText("ABC123")).toHaveClass("select-text");
});
