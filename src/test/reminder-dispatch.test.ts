// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { dispatchReminders } from "../lib/reminder-dispatch.server";

afterEach(() => vi.unstubAllEnvs());
describe("reminder dispatcher boundary", () => {
  it("returns 401 for missing, forged and equal-character-length Unicode credentials", async () => {
    vi.stubEnv("KINRA_PUSH_DISPATCH_SECRET", "a".repeat(48));
    for (const authorization of ["", `Bearer ${"b".repeat(48)}`, `Bearer ${"é".repeat(48)}`]) {
      const response = await dispatchReminders(
        new Request("https://kinra.fit/api/reminders", {
          method: "POST",
          headers: { authorization },
        }),
      );
      expect(response.status).toBe(401);
    }
  });
});
