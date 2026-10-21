import type { ComponentType, ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { rememberAuthDestination, readAuthDestination } from "@/lib/auth-destination";
const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  callback: null as null | ((event: string, session: unknown) => void),
  user: null as unknown,
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => state.navigate,
  Link: ({ children, to, ...rest }: { children: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: state.user } })),
      onAuthStateChange: vi.fn((cb: typeof state.callback) => {
        state.callback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: "synthetic" } } },
        error: null,
      })),
    },
  },
}));
import { Route as AuthRoute } from "@/routes/auth";
import { Route as ConfirmRoute } from "@/routes/auth_.confirm";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  sessionStorage.clear();
  state.callback = null;
  state.user = null;
  state.navigate.mockReset();
});
it("takes a successful password sign-in back to the business dashboard", async () => {
  vi.spyOn(AuthRoute, "useSearch").mockReturnValue({ next: "/business/dashboard" });
  const Component = AuthRoute.options.component as ComponentType;
  await act(async () => {
    render(<Component />);
  });
  expect(readAuthDestination(sessionStorage)).toBe("/business/dashboard");
  await act(async () => {
    state.callback?.("SIGNED_IN", { user: { id: "synthetic" } });
  });
  expect(state.navigate).toHaveBeenCalledWith({ to: "/business/dashboard", replace: true });
  expect(readAuthDestination(sessionStorage)).toBe("/app");
});
it("keeps the normal personal sign-in destination unchanged", async () => {
  vi.spyOn(AuthRoute, "useSearch").mockReturnValue({ next: undefined });
  state.user = { id: "synthetic" };
  const Component = AuthRoute.options.component as ComponentType;
  await act(async () => {
    render(<Component />);
  });
  expect(state.navigate).toHaveBeenCalledWith({ to: "/app", replace: true });
});
it("resumes a same-tab confirmed Business signup and removes the optional hint", async () => {
  rememberAuthDestination(sessionStorage, "/business/dashboard");
  const Component = ConfirmRoute.options.component as ComponentType;
  await act(async () => {
    render(<Component />);
  });
  expect(state.navigate).toHaveBeenCalledWith({ to: "/business/dashboard", replace: true });
  expect(readAuthDestination(sessionStorage)).toBe("/app");
});
it.each(["in", "up"] as const)(
  "opens explicit %s mode and preserves the Business destination when switching",
  async (mode) => {
    vi.spyOn(AuthRoute, "useSearch").mockReturnValue({ next: "/business/dashboard", mode });
    const Component = AuthRoute.options.component as ComponentType;
    await act(async () => {
      render(<Component />);
    });
    expect(
      screen.getByRole("heading", { name: mode === "in" ? "Welcome back" : "Create account" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Full name" }) !== null).toBe(mode === "up");
    fireEvent.click(
      screen.getByRole("button", {
        name: mode === "in" ? "New here? Create one" : "Already have an account? Sign in",
      }),
    );
    expect(
      screen.getByRole("heading", { name: mode === "in" ? "Create account" : "Welcome back" }),
    ).toBeInTheDocument();
    expect(readAuthDestination(sessionStorage)).toBe("/business/dashboard");
  },
);
it("accepts only named auth modes and the allowed Business destination", () => {
  const validate = AuthRoute.options.validateSearch as (search: Record<string, unknown>) => unknown;
  expect(validate({ mode: "in", next: "/business/dashboard" })).toEqual({
    mode: "in",
    next: "/business/dashboard",
  });
  expect(validate({ mode: "up", next: "https://untrusted.test" })).toEqual({
    mode: "up",
    next: undefined,
  });
  expect(validate({ mode: "unknown" })).toEqual({ mode: undefined, next: undefined });
});
