import { beforeEach, describe, expect, it, vi } from "vitest";

const backend = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: backend.getUser }, from: backend.from },
}));
import { createLiveApi } from "@/lib/api";
beforeEach(() => {
  vi.clearAllMocks();
});
describe("stale account writes", () => {
  it("rejects saves, inserts, and deletes after a different account signs in", async () => {
    const api = createLiveApi("alice");
    backend.getUser.mockResolvedValue({ data: { user: { id: "bob" } } });
    await expect(api.insert("sleep_logs", { hours: 8, quality: 4 })).rejects.toThrow(
      "account changed",
    );
    await expect(api.remove("workouts", "id")).rejects.toThrow("account changed");
    await expect(api.saveWorkout({ id: "id", title: "Private", sets: [] })).rejects.toThrow(
      "account changed",
    );
    expect(backend.from).not.toHaveBeenCalled();
  });
  it("sets explicit ownership even if a caller supplies another user ID", async () => {
    backend.getUser.mockResolvedValue({ data: { user: { id: "alice" } } });
    const insert = vi.fn().mockResolvedValue({ data: null, error: null });
    backend.from.mockReturnValue({ insert });
    await createLiveApi("alice").insert("sleep_logs", { user_id: "bob", hours: 8, quality: 4 });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "alice", hours: 8 }));
  });
});
