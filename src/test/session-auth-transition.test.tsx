import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LiveSession, sessionFromTemplate } from "@/components/strata/session";
const state = vi.hoisted(() => ({ me: undefined as { id: string } | undefined, log: vi.fn() }));
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  useMe: () => ({ data: state.me }),
  useLog: (...args: unknown[]) => {
    state.log(...args);
    return { data: [] };
  },
  useAct: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }),
}));
afterEach(() => {
  cleanup();
  state.me = undefined;
  vi.clearAllMocks();
});
it("unmounts a paused live session safely when sign-out clears the account", () => {
  const session = sessionFromTemplate(undefined, [], false);
  session.pausedAt = Date.now();
  const before = JSON.stringify(session);
  const setSession = vi.fn();
  const props = { session, setSession, minimized: true, setMinimized: vi.fn(), onClose: vi.fn() };
  const view = render(<LiveSession {...props} />);
  expect(state.log).not.toHaveBeenCalled();
  state.me = { id: "synthetic-owner" };
  view.rerender(<LiveSession {...props} />);
  expect(state.log).toHaveBeenCalledWith("workouts", "synthetic-owner");
  expect(screen.getByRole("button", { name: /Open live session/i })).toBeInTheDocument();
  state.me = undefined;
  expect(() => view.rerender(<LiveSession {...props} />)).not.toThrow();
  expect(screen.queryByRole("button", { name: /Open live session/i })).not.toBeInTheDocument();
  expect(setSession).not.toHaveBeenCalled();
  expect(JSON.stringify(session)).toBe(before);
});
