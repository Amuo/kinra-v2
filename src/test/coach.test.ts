import { describe, expect, it } from "vitest";
import { clientAttention, COMPLIANCE_TARGET, type CoachClient } from "../lib/coach";

const base: CoachClient = {
  id: "c",
  display_name: "Client",
  goal: null,
  workouts: [],
  sleep: [],
  journal: [],
};
describe("Coach read-only projections", () => {
  it("preserves the existing 16-session compliance target", () => {
    expect(COMPLIANCE_TARGET).toBe(16);
  });
  it("preserves inactivity flags without changing source records", () => {
    const before = structuredClone(base);
    expect(clientAttention(base)).toHaveLength(1);
    expect(base).toEqual(before);
  });
  it("retains the existing low mood and sleep thresholds", () => {
    const row: CoachClient = {
      ...base,
      journal: [
        {
          id: "j",
          user_id: "c",
          created_at: new Date().toISOString(),
          mood: 2,
          energy: 3,
          body: null,
        },
      ],
      sleep: [{ id: "s", user_id: "c", log_date: "2026-10-14", hours: 6, quality: 3 }],
    };
    expect(clientAttention(row)).toHaveLength(3);
    expect(
      clientAttention({
        ...row,
        journal: [
          {
            ...row.journal[0],
            id: "j",
            user_id: "c",
            created_at: new Date().toISOString(),
            mood: 3,
            energy: 3,
            body: null,
          },
        ],
        sleep: [{ id: "s", user_id: "c", log_date: "2026-10-14", hours: 6.5, quality: 3 }],
      }),
    ).toHaveLength(1);
  });
});
