import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { readAuthCallback } from "@/lib/auth-callback";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth_/confirm")({ ssr: false, component: ConfirmEmail });
function ConfirmEmail() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [status, setStatus] = useState("Confirming your email…");
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const confirm = async () => {
      const { recoveryFlow, token, type, code, cleanPath } = readAuthCallback(
        new URL(window.location.href),
      );
      const result = token
        ? await supabase.auth.verifyOtp({ token_hash: token, type })
        : code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.getSession();
      if (result.error) throw result.error;
      if (!result.data.session)
        throw new Error("This link is expired or has already been used. Request a new email.");
      window.history.replaceState(null, "", cleanPath);
      if (recoveryFlow) {
        setRecovery(true);
        setStatus("Choose your new password.");
      } else await navigate({ to: "/app", replace: true });
    };
    void confirm().catch((error) =>
      setStatus(error instanceof Error ? error.message : "Couldn't confirm this link."),
    );
  }, [navigate]);
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-title-l font-bold">Kinra account</h1>
      <p role="status" className="my-6">
        {status}
      </p>
      {recovery && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            const result = await supabase.auth.updateUser({ password });
            setBusy(false);
            if (result.error) setStatus(result.error.message);
            else await navigate({ to: "/app", replace: true });
          }}
        >
          <label>
            New password
            <Input
              required
              type="password"
              minLength={10}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="my-3"
            />
          </label>
          <Button disabled={busy} type="submit">
            Save password
          </Button>
        </form>
      )}
      <Button asChild variant="ghost" className="mt-6">
        <a href="/auth">Back to sign in</a>
      </Button>
    </main>
  );
}
