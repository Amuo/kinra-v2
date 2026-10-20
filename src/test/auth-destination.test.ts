import { describe, expect, it } from "vitest";
import {
  authDestination,
  rememberAuthDestination,
  readAuthDestination,
  clearAuthDestination,
} from "../lib/auth-destination";
function storage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}
describe("business auth destination continuity", () => {
  it("allows only explicit internal destinations and rejects redirect URL tricks", () => {
    expect(authDestination("/business/dashboard")).toBe("/business/dashboard");
    for (const value of [
      undefined,
      null,
      "https://example.invalid",
      "//example.invalid",
      "/business/dashboard?next=evil",
      "/business/dashboard/../admin",
      "javascript:alert(1)",
      {},
      ["/business/dashboard"],
    ])
      expect(authDestination(value)).toBe("/app");
  });
  it("remembers a short-lived business callback target and clears it after use or personal login", () => {
    const s = storage(),
      now = 1000;
    rememberAuthDestination(s, "/business/dashboard", now);
    expect(readAuthDestination(s, now + 500)).toBe("/business/dashboard");
    expect(readAuthDestination(s, now + 3600000)).toBe("/app");
    clearAuthDestination(s);
    expect(readAuthDestination(s, now)).toBe("/app");
    rememberAuthDestination(s, "/business/dashboard", now);
    rememberAuthDestination(s, "/app", now);
    expect(readAuthDestination(s, now)).toBe("/app");
  });
  it("falls back safely for malformed storage, future timestamps, and blocked browser storage", () => {
    const s = storage();
    s.setItem("kinra:auth-destination", "{bad");
    expect(readAuthDestination(s)).toBe("/app");
    s.setItem(
      "kinra:auth-destination",
      JSON.stringify({ path: "//evil.invalid", expires: Date.now() + 5000 }),
    );
    expect(readAuthDestination(s)).toBe("/app");
    s.setItem(
      "kinra:auth-destination",
      JSON.stringify({ path: "/business/dashboard", expires: 1e16 }),
    );
    expect(readAuthDestination(s)).toBe("/app");
    const blocked = {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
      removeItem: () => {
        throw Error("blocked");
      },
    };
    expect(() => rememberAuthDestination(blocked, "/business/dashboard")).not.toThrow();
    expect(readAuthDestination(blocked)).toBe("/app");
    expect(() => clearAuthDestination(blocked)).not.toThrow();
  });
});
