import { describe, expect, it } from "vitest";
import { readAuthCallback } from "@/lib/auth-callback";

describe("account email callbacks", () => {
  it("rejects expired links before an existing session can be reused", () => {
    expect(() =>
      readAuthCallback(
        new URL(
          "https://kinra.fit/auth/confirm?flow=recover#error=access_denied&error_code=otp_expired",
        ),
      ),
    ).toThrow("expired or has already been used");
  });
  it("rejects query-string provider errors", () => {
    expect(() =>
      readAuthCallback(
        new URL(
          "https://kinra.fit/auth/confirm?error=access_denied&error_description=Invalid+link",
        ),
      ),
    ).toThrow("Invalid link");
  });
  it("keeps recovery on refresh while removing credentials from the clean URL", () => {
    const callback = readAuthCallback(
      new URL(
        "https://kinra.fit/auth/confirm#type=recovery&access_token=test-token&refresh_token=test-refresh",
      ),
    );
    expect(callback.recoveryFlow).toBe(true);
    expect(callback.cleanPath).toBe("/auth/confirm?flow=recover");
    expect(readAuthCallback(new URL("https://kinra.fit" + callback.cleanPath)).recoveryFlow).toBe(
      true,
    );
  });
  it("accepts signup hashes and PKCE codes and rejects invalid token types", () => {
    expect(
      readAuthCallback(new URL("https://kinra.fit/auth/confirm?token_hash=test&type=signup")),
    ).toMatchObject({
      token: "test",
      type: "signup",
      recoveryFlow: false,
      cleanPath: "/auth/confirm",
    });
    expect(readAuthCallback(new URL("https://kinra.fit/auth/confirm?code=test-code")).code).toBe(
      "test-code",
    );
    expect(() =>
      readAuthCallback(new URL("https://kinra.fit/auth/confirm?token_hash=test&type=invalid")),
    ).toThrow("invalid");
  });
});
