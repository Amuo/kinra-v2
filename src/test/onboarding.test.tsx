import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Onboarding } from "@/components/strata/onboarding";
import {
  chooseOnboardingRole,
  initialOnboarding,
  onboardingDestination,
  resumedOnboardingStep,
  validateOnboarding,
} from "@/lib/onboarding";
import { setLanguage } from "@/lib/i18n";
import type { Me } from "@/lib/types";
const backend = vi.hoisted(() => ({
  me: { id: "owner", display_name: "", goal: null, trainer_code: null, role: null } as Me,
  draft: null as unknown,
  save: vi.fn(),
  navigate: vi.fn(),
  error: false,
  profileError: false,
  retryProfile: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => backend.navigate }));
vi.mock("@/lib/api", () => ({
  useMe: () => ({
    data: backend.profileError ? undefined : backend.me,
    error: backend.profileError,
    refetch: backend.retryProfile,
  }),
  useApi: () => ({ mode: "live", ownerId: "owner", saveOnboarding: backend.save }),
  useQ: (key: string[]) => ({
    isLoading: false,
    error: backend.error,
    data: key[0] === "onboarding" ? backend.draft : [],
    refetch: vi.fn(),
  }),
}));
function mount() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Onboarding />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  setLanguage("en", false);
  backend.me = { id: "owner", display_name: "", goal: null, trainer_code: null, role: null };
  backend.draft = null;
  backend.error = false;
  backend.profileError = false;
  backend.retryProfile.mockReset();
  backend.save.mockReset().mockResolvedValue(undefined);
  backend.navigate.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("role onboarding", () => {
  it("offers retry when the profile cannot load", () => {
    backend.profileError = true;
    mount();
    expect(
      screen.getByText("Could not load your setup. Your account is unchanged."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(backend.retryProfile).toHaveBeenCalledOnce();
  });
  it.each([
    ["My own training", "Log my first workout", "/app/train", "solo"],
    ["Training with a coach", "Connect with my coach", "/app/me", "client"],
    ["Coaching others", "Build my first program", "/app/programs", "trainer"],
  ] as const)(
    "takes %s through review before committing the account",
    async (label, first, to, role) => {
      mount();
      fireEvent.click(screen.getByRole("radio", { name: new RegExp(label) }));
      fireEvent.click(screen.getByRole("button", { name: "Save & continue" }));
      await screen.findByRole("textbox", { name: "Display name" });
      expect(backend.save.mock.calls[0]).toMatchObject([{ role }, 1, false]);
      fireEvent.change(screen.getByRole("textbox", { name: "Display name" }), {
        target: { value: "Fictional member" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save & continue" }));
      await screen.findByRole("radio", { name: new RegExp(first) });
      expect(screen.queryByRole("radio", { name: /Start my food diary/ })).toBe(
        role === "solo" ? screen.getByRole("radio", { name: /Start my food diary/ }) : null,
      );
      fireEvent.click(screen.getByRole("button", { name: "Save & continue" }));
      const finish = await screen.findByRole("button", { name: "Finish setup" });
      expect(backend.save.mock.calls.every((call) => call[2] === false)).toBe(true);
      if (role === "client")
        expect(screen.getByText(/Finishing setup does not connect a coach/)).toBeInTheDocument();
      fireEvent.click(finish);
      await waitFor(() => expect(backend.navigate).toHaveBeenCalledWith({ to, replace: true }));
      expect(backend.save).toHaveBeenLastCalledWith(
        expect.objectContaining({ role, display_name: "Fictional member" }),
        3,
        true,
      );
    },
  );
  it("restores a private draft, retains edits after a failed save and supports a language change", async () => {
    const answers = {
      ...chooseOnboardingRole(initialOnboarding(backend.me), "client"),
      display_name: "Saved draft",
    };
    backend.draft = { answers, step: 1, version: 1, completed_at: null, updated_at: "now" };
    backend.save.mockRejectedValueOnce(
      new Error("Network error. Check your connection and try again."),
    );
    mount();
    const input = screen.getByRole("textbox", { name: "Display name" });
    fireEvent.change(input, { target: { value: "Current unsaved draft" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "bs" } });
    expect(screen.getByRole("textbox", { name: "Ime za prikaz" })).toBe(input);
    fireEvent.click(screen.getByRole("button", { name: "Sačuvaj i nastavi" }));
    await screen.findByRole("alert");
    expect(input).toHaveValue("Current unsaved draft");
    expect(backend.navigate).not.toHaveBeenCalled();
  });
  it("keeps an existing account type locked and routes invalid drafts back to required details", () => {
    backend.me = { ...backend.me, role: "trainer", display_name: "Existing coach" };
    backend.draft = {
      answers: chooseOnboardingRole(initialOnboarding(backend.me), "trainer"),
      step: 0,
      completed_at: null,
    };
    mount();
    expect(screen.getByRole("radio", { name: /My own training/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Coaching others/ })).toBeChecked();
    const blank = chooseOnboardingRole(
      initialOnboarding({ ...backend.me, role: null, display_name: "" }),
      "solo",
    );
    expect(resumedOnboardingStep(blank, 3)).toBe(1);
    expect(validateOnboarding(blank, 3)).toBe("Enter a name for your profile.");
    expect(onboardingDestination({ ...blank, first_action: "clients" })).toBeNull();
  });
});
