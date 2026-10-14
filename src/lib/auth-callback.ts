import type { EmailOtpType } from "@supabase/supabase-js";

export function readAuthCallback(url: URL) {
  const params = url.searchParams;
  const hash = new URLSearchParams(url.hash.slice(1));
  const error = params.get("error") ?? hash.get("error");
  const errorCode = params.get("error_code") ?? hash.get("error_code");
  if (error || errorCode) {
    if (errorCode === "otp_expired")
      throw new Error("This link is expired or has already been used. Request a new email.");
    throw new Error(
      params.get("error_description") ??
        hash.get("error_description") ??
        "Couldn't confirm this link.",
    );
  }
  const recoveryFlow =
    params.get("flow") === "recover" ||
    params.get("type") === "recovery" ||
    hash.get("type") === "recovery";
  const type = params.get("type") ?? (recoveryFlow ? "recovery" : "email");
  if (!["signup", "email", "magiclink", "invite", "recovery", "email_change"].includes(type))
    throw new Error("This confirmation link is invalid.");
  return {
    recoveryFlow,
    token: params.get("token_hash"),
    type: type as EmailOtpType,
    code: params.get("code"),
    cleanPath: recoveryFlow ? "/auth/confirm?flow=recover" : "/auth/confirm",
  };
}
