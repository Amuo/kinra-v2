import {
  authDestination,
  rememberAuthDestination,
  clearAuthDestination,
} from "@/lib/auth-destination";
import { errorText } from "@/lib/i18n-errors";
import { currentLanguage } from "@/lib/i18n";
import { LanguageSelector } from "@/components/strata/language-selector";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { next?: "/business/dashboard" | undefined; mode?: "in" | "up" | undefined } => ({
    next: search["next"] === "/business/dashboard" ? ("/business/dashboard" as const) : undefined,
    mode: search["mode"] === "in" || search["mode"] === "up" ? search["mode"] : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: tr("Sign in — Kinra") },
      { name: "description", content: "Sign in or create your Kinra account." },
      { property: "og:title", content: "Sign in — Kinra" },
      { property: "og:description", content: "Sign in or create your Kinra account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  return (
    <AuthForm
      key={search.mode ?? "up"}
      initialMode={search.mode ?? "up"}
      destination={authDestination(search.next)}
    />
  );
}

function AuthForm({
  initialMode,
  destination,
}: {
  initialMode: "in" | "up";
  destination: ReturnType<typeof authDestination>;
}) {
  const { t: tr } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const googleEnabled = import.meta.env["VITE_GOOGLE_AUTH_ENABLED"] === "true";

  useEffect(() => {
    sessionStorage.removeItem("strata-demo");
    rememberAuthDestination(sessionStorage, destination);
    const finish = () => {
      clearAuthDestination(sessionStorage);
      void navigate({ to: destination, replace: true });
    };
    supabase.auth.getUser().then(({ data }) => data.user && finish());
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) finish();
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, destination]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/confirm",
            data: { display_name: name, kinra_language: currentLanguage() },
          },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(errorText((err as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/confirm" },
    });
    if (r.error) toast.error(errorText(r.error.message));
  };

  return (
    <div className="grid-lines mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <Link to="/" className="w-fit" aria-label={tr("Kinra home")}>
        <Logo />
      </Link>
      <div className="my-4 flex justify-end">
        <LanguageSelector compact />
      </div>
      <div className="mt-auto">
        {sent ? (
          <div className="panel p-6">
            <h1 className="font-display text-3xl font-extrabold">
              <Message source="Check your inbox" />
            </h1>
            <p className="mt-2 text-label text-muted-foreground">
              <Message
                source="We sent a confirmation link to {p0}. Tap it to finish creating your account."
                values={{ p0: email }}
              />
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl font-black leading-none [font-stretch:115%]">
              {mode === "up" ? tr("Create account") : tr("Welcome back")}
            </h1>
            <p className="mt-2 text-label text-muted-foreground">
              {mode === "up" ? tr("Pick your role right after.") : tr("Sign in to continue.")}
            </p>
            {googleEnabled && (
              <>
                <Button wrap variant="glass" size="xl" className="mt-6 w-full" onClick={google}>
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.74 14.56 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51z"
                    />
                  </svg>
                  <Message source="Continue with Google" />
                </Button>
                <div className="my-5 flex items-center gap-3 text-caption text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <Message source="or" />
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
            <form onSubmit={submit} className="space-y-3">
              {mode === "up" && (
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label={tr("Full name")}
                  placeholder={tr("Full name")}
                  className="h-12 bg-surface"
                />
              )}
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label={tr("Email")}
                placeholder={tr("Email")}
                className="h-12 bg-surface"
              />
              <Input
                required
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                minLength={mode === "up" ? 10 : 1}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label={tr("Password")}
                placeholder={tr("Password")}
                className="h-12 bg-surface"
              />
              <label className="flex min-h-11 items-center gap-3 text-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
                {tr("Show password")}
              </label>
              <Button wrap variant="volt" size="xl" className="w-full" disabled={busy}>
                {mode === "up" ? tr("Create account") : tr("Sign in")}
              </Button>
            </form>
            <button
              type="button"
              className="mt-4 w-full text-label text-muted-foreground"
              onClick={async () => {
                if (!email.trim()) {
                  toast.error(tr("Enter your email first."));
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                  redirectTo: window.location.origin + "/auth/confirm?flow=recover",
                });
                if (error) toast.error(errorText(error.message));
                else toast.success(tr("Check your inbox for a password reset link."));
              }}
            >
              <Message source="Forgot password?" />
            </button>
            <button
              className="mt-4 w-full text-center text-label text-muted-foreground"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? tr("Already have an account? ") : tr("New here? ")}
              <span className="font-semibold text-primary">
                {mode === "up" ? tr("Sign in") : tr("Create one")}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
