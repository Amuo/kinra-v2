import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const backend = vi.hoisted(() => ({
  records: [] as unknown[],
  api: { mode: "demo-client", ownerId: "alice", features: { list: vi.fn(), save: vi.fn() } },
}));
vi.mock("@/lib/api", () => ({
  useApi: () => backend.api,
  useQ: () => ({ isSuccess: true, data: backend.records }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: vi.fn(), updateUser: vi.fn() } },
}));
import { FeaturePreferences } from "@/components/strata/feature-preferences";
import { LanguageSelector } from "@/components/strata/language-selector";
import { setLanguage, takePendingLanguage } from "@/lib/i18n";
const preferences = {
  language: "en",
  theme: "dark",
  modules: { fuel: false, train: true },
  timezone: "Europe/Sarajevo",
  units: "imperial",
};
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  takePendingLanguage();
  setLanguage("en", false);
  backend.records = [
    { id: "preference-id", owner_id: "alice", kind: "preferences", payload: { ...preferences } },
  ];
  backend.api.ownerId = "alice";
  backend.api.features.save.mockReset().mockResolvedValue("preference-id");
});
afterEach(() => cleanup());
function Settings() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <FeaturePreferences />
      <LanguageSelector />
    </QueryClientProvider>
  );
}
describe("account language preferences", () => {
  it("saves only the language change and retains theme, modules, units and timezone", async () => {
    render(<Settings />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "de" } });
    await waitFor(() =>
      expect(backend.api.features.save).toHaveBeenCalledWith(
        "preferences",
        { ...preferences, language: "de" },
        { id: "preference-id" },
      ),
    );
    expect(localStorage.getItem("kinra:language:demo-client:alice")).toBe("de");
    expect(backend.records[0]).toMatchObject({ payload: preferences });
  });
  it("honors the explicit pre-login language instead of replacing it with the account’s earlier choice", async () => {
    setLanguage("bs");
    render(<Settings />);
    await waitFor(() =>
      expect(backend.api.features.save).toHaveBeenCalledWith(
        "preferences",
        { ...preferences, language: "bs" },
        { id: "preference-id" },
      ),
    );
    expect(screen.getByRole("combobox")).toHaveValue("bs");
    expect(sessionStorage.getItem("kinra:language:pending")).toBeNull();
  });
});
