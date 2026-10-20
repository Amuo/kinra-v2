import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ClientOverview } from "@/components/strata/client-overview";
import { setLanguage, t } from "@/lib/i18n";
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  useLog: () => ({ data: [], isPending: false, error: null, refetch: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  setLanguage("en", false);
});
it.each(["en", "bs", "de"] as const)("renders the empty weight trend hint in %s", (language) => {
  setLanguage(language, false);
  render(<ClientOverview userId="locale-test" trainerView />);
  expect(screen.getByText(t("Weigh in twice to see a trend"))).toBeInTheDocument();
  if (language !== "en")
    expect(screen.queryByText("Weigh in twice to see a trend")).not.toBeInTheDocument();
});
