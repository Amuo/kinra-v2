import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Loader2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useApi, useMe, useQ } from "@/lib/api";
import { accountKey } from "@/lib/account-state";
import {
  chooseOnboardingRole,
  initialOnboarding,
  onboardingDestination,
  startingActions,
  validateOnboarding,
  resumedOnboardingStep,
  type OnboardingAnswers,
} from "@/lib/onboarding";
import { currentLanguage, roleLabel, t, useLanguage } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { cn } from "@/lib/utils";
import type { Me } from "@/lib/types";
import { StartingPoint } from "./starting-point";
import { genderLabels, experienceLabels } from "@/lib/onboarding";
import { number } from "@/lib/i18n";
import { LanguageSelector } from "./language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, SkeletonPage } from "./ui";

const roles = [
  {
    role: "solo",
    icon: Dumbbell,
    title: "My own training",
    body: "Build your routine with workouts, food and recovery tracking.",
  },
  {
    role: "client",
    icon: UserRound,
    title: "Training with a coach",
    body: "Follow assigned programs, track your days and exchange feedback.",
  },
  {
    role: "trainer",
    icon: Users,
    title: "Coaching others",
    body: "Create programs, connect clients and follow their progress.",
  },
] as const;
const steps = ["Your path", "About you", "Your starting point", "First step", "Review"];
const goalOptions = {
  solo: ["Build strength", "Improve fitness", "Build consistency"],
  client: ["Build strength", "Follow my plan", "Build consistency"],
  trainer: ["Build reusable programs", "Support client consistency", "Organize my coaching"],
};

export function Onboarding({
  onClose,
  onExit,
  embedded = false,
}: {
  onClose?: () => void;
  onExit?: () => Promise<void>;
  embedded?: boolean;
}) {
  useLanguage();
  const me = useMe();
  const draft = useQ(["onboarding"], (api) => api.onboarding());
  const preferences = useQ(["features", "preferences"], (api) => api.features.list("preferences"));
  if (me.error || draft.error || preferences.error)
    return (
      <ErrorState
        message={t("Could not load your setup. Your account is unchanged.")}
        onRetry={() => {
          void me.refetch();
          void draft.refetch();
          void preferences.refetch();
        }}
      />
    );
  if (draft.isLoading || preferences.isLoading || !me.data) return <SkeletonPage />;
  const fresh = initialOnboarding(me.data, preferences.data?.[0]?.payload);
  const saved = draft.data;
  const answers =
    saved && !saved.completed_at
      ? {
          ...fresh,
          ...saved.answers,
          units: saved.units_set === false ? fresh.units : saved.answers.units,
          role: me.data.role ?? saved.answers.role,
          language: currentLanguage(),
        }
      : {
          ...fresh,
          ...(saved
            ? {
                gender: saved.answers.gender,
                height_cm: saved.answers.height_cm,
                weight_kg: saved.answers.weight_kg,
                experience: saved.answers.experience,
              }
            : {}),
        };
  return (
    <OnboardingForm
      me={me.data}
      initial={answers}
      initialStep={saved && !saved.completed_at ? saved.step : me.data.role ? 1 : 0}
      embedded={embedded}
      hasSavedDraft={!!saved && !saved.completed_at}
      {...(onClose ? { onClose } : {})}
      {...(onExit ? { onExit } : {})}
    />
  );
}

function OnboardingForm({
  me,
  initial,
  initialStep,
  embedded,
  onClose,
  onExit,
  hasSavedDraft,
}: {
  me: Me;
  initial: OnboardingAnswers;
  initialStep: number;
  embedded: boolean;
  onClose?: () => void;
  onExit?: () => Promise<void>;
  hasSavedDraft: boolean;
}) {
  useLanguage();
  const api = useApi();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState(initial);
  const [step, setStep] = useState(resumedOnboardingStep(initial, initialStep));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(hasSavedDraft);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const role = answers.role;
  const destination = onboardingDestination(answers);
  const update = (patch: Partial<OnboardingAnswers>) => {
    setAnswers((value) => ({ ...value, ...patch }));
    setSaved(false);
    setError("");
  };
  async function advance(next: number, finish = false) {
    if (busy) return;
    const issue = next > step || finish ? validateOnboarding(answers, step) : null;
    if (issue) {
      setError(t(issue));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = { ...answers, language: currentLanguage() };
      await api.saveOnboarding(payload, next, finish);
      if (finish) {
        await qc.invalidateQueries({ queryKey: accountKey(api.mode, api.ownerId) });
        onClose?.();
        if (destination) await navigate({ to: destination.to, replace: !me.role });
      } else {
        setStep(next);
        setSaved(true);
      }
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  const title =
    step === 0
      ? "What brings you to Kinra?"
      : step === 1
        ? role === "trainer"
          ? "Introduce your coaching."
          : role === "client"
            ? "Make coaching personal."
            : "Start with what matters to you."
        : step === 2
          ? "Your starting point"
          : step === 3
            ? "Choose a useful first step."
            : "Your setup, at a glance.";
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md bg-background px-5 py-6",
        !embedded && "min-h-dvh py-8",
      )}
    >
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow text-volt">{t("Welcome to Kinra")}</p>
        <LanguageSelector compact />
      </div>
      <ol aria-label={t("Setup progress")} className="mb-7 grid grid-cols-5 gap-2">
        {steps.map((label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined} className="min-w-0">
            <div
              className={cn(
                "mb-2 h-1.5 rounded-full",
                index <= step ? "bg-primary" : "bg-surface-2",
              )}
            />
            <span
              className={cn(
                "block break-words text-caption hyphens-auto",
                index === step ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {t(label)}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-2 text-caption text-muted-foreground">
        {t("Step {current} of {total}", { current: step + 1, total: 5 })}
      </p>
      <h1
        ref={heading}
        tabIndex={-1}
        className="font-display text-title-l font-bold leading-tight outline-none [overflow-wrap:anywhere]"
      >
        {t(title)}
      </h1>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          void advance(Math.min(step + 1, 4), step === 4);
        }}
      >
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          {step === 0 && (
            <>
              <p className="text-label text-muted-foreground">
                {t("Choose the path that fits your main reason for being here.")}
              </p>
              <div role="radiogroup" aria-label={t("Account type")} className="space-y-3">
                {roles.map((option) => (
                  <label
                    key={option.role}
                    className={cn(
                      "panel flex cursor-pointer items-start gap-3 p-4",
                      role === option.role && "ring-2 ring-primary",
                      me.role && me.role !== option.role && "opacity-45",
                    )}
                  >
                    <input
                      className="mt-1 size-4 shrink-0 accent-[var(--volt)]"
                      type="radio"
                      name="account-role"
                      value={option.role}
                      checked={role === option.role}
                      disabled={!!me.role && me.role !== option.role}
                      onChange={() => {
                        setAnswers(chooseOnboardingRole(answers, option.role));
                        setSaved(false);
                        setError("");
                      }}
                    />
                    <option.icon
                      className="mt-0.5 size-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 hyphens-auto [overflow-wrap:anywhere]">
                      <span className="block font-display text-title font-bold">
                        {t(option.title)}
                      </span>
                      <span className="mt-1 block text-label text-muted-foreground">
                        {t(option.body)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-caption text-muted-foreground">
                {t(
                  me.role
                    ? "Your account type is already set. You can update the rest of your setup."
                    : "Your account type is set when you finish. Coaches also have personal tracking.",
                )}
              </p>
            </>
          )}
          {step === 1 && role && (
            <>
              <p className="text-label text-muted-foreground">
                {t(
                  role === "trainer"
                    ? "Use the name clients will recognize. Your coaching priority is optional."
                    : "Choose the name you want to use. Add a goal if it helps; you can change it later.",
                )}
              </p>
              <label className="block">
                <span className="mb-2 block text-label font-semibold">{t("Display name")}</span>
                <Input
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={answers.display_name}
                  onChange={(event) => update({ display_name: event.target.value })}
                  className="min-h-12 bg-surface"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-label font-semibold">
                  {t(role === "trainer" ? "Coaching priority (optional)" : "Your goal (optional)")}
                </span>
                <Input
                  maxLength={160}
                  value={answers.goal}
                  onChange={(event) => update({ goal: event.target.value })}
                  className="min-h-12 bg-surface"
                />
              </label>
              <div className="flex flex-wrap gap-2" aria-label={t("Goal ideas")}>
                {goalOptions[role].map((label) => (
                  <Button
                    key={label}
                    type="button"
                    wrap
                    variant="secondary"
                    aria-pressed={answers.goal === t(label)}
                    className={cn(
                      "min-h-11 h-auto text-left",
                      answers.goal === t(label) && "ring-2 ring-primary",
                    )}
                    onClick={() => update({ goal: t(label) })}
                  >
                    {t(label)}
                  </Button>
                ))}
              </div>
              <p className="text-caption text-muted-foreground">
                {t("No body measurements or health history are needed to get started.")}
              </p>
            </>
          )}
          {step === 2 && <StartingPoint answers={answers} update={update} />}
          {step === 3 && role && (
            <>
              <p className="text-label text-muted-foreground">
                {t(
                  "We will take you there after setup. You can explore the other tools whenever you like.",
                )}
              </p>
              <div role="radiogroup" aria-label={t("First step")} className="space-y-3">
                {startingActions[role].map((action) => (
                  <label
                    key={action.id}
                    className={cn(
                      "panel flex cursor-pointer items-start gap-3 p-4",
                      answers.first_action === action.id && "ring-2 ring-primary",
                    )}
                  >
                    <input
                      type="radio"
                      name="first-action"
                      className="mt-1 size-4 shrink-0 accent-[var(--volt)]"
                      value={action.id}
                      checked={answers.first_action === action.id}
                      onChange={() => update({ first_action: action.id })}
                    />
                    <span className="min-w-0 hyphens-auto [overflow-wrap:anywhere]">
                      <span className="block text-label font-semibold">{t(action.title)}</span>
                      <span className="mt-1 block text-label text-muted-foreground">
                        {t(action.body)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <p className="mb-2 text-label font-semibold">{t("Appearance")}</p>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="radiogroup"
                  aria-label={t("Appearance")}
                >
                  {(["system", "dark", "light"] as const).map((theme) => (
                    <label
                      key={theme}
                      className={cn(
                        "panel flex min-h-12 cursor-pointer flex-wrap items-center justify-center gap-2 p-2 text-label",
                        answers.theme === theme && "ring-2 ring-primary",
                      )}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={theme}
                        checked={answers.theme === theme}
                        onChange={() => update({ theme })}
                        className="accent-[var(--volt)]"
                      />
                      {t(theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light")}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-caption text-muted-foreground">
                  {t("Your appearance choice applies when you finish setup.")}
                </p>
              </div>
            </>
          )}
          {step === 4 && role && destination && (
            <>
              <dl className="panel divide-y divide-border px-4">
                {[
                  ["Account type", roleLabel(role)],
                  ["Display name", answers.display_name.trim()],
                  [
                    role === "trainer" ? "Coaching priority" : "Goal",
                    answers.goal.trim() || t("Add later"),
                  ],
                  [
                    "Gender (optional)",
                    answers.gender ? t(genderLabels[answers.gender]) : t("Not added"),
                  ],
                  [
                    "Height (optional)",
                    answers.height_cm === null
                      ? t("Not added")
                      : `${number(answers.units === "imperial" ? answers.height_cm / 2.54 : answers.height_cm, { maximumFractionDigits: 1 })} ${answers.units === "imperial" ? "in" : "cm"}`,
                  ],
                  [
                    "Weight (optional)",
                    answers.weight_kg === null
                      ? t("Not added")
                      : `${number(answers.units === "imperial" ? answers.weight_kg / 0.45359237 : answers.weight_kg, { maximumFractionDigits: 1 })} ${answers.units === "imperial" ? "lb" : "kg"}`,
                  ],
                  [
                    "Training experience (optional)",
                    answers.experience ? t(experienceLabels[answers.experience]) : t("Not added"),
                  ],
                  ["First step", t(destination.title)],
                  [
                    "Appearance",
                    t(
                      answers.theme === "system"
                        ? "System"
                        : answers.theme === "dark"
                          ? "Dark"
                          : "Light",
                    ),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="py-3">
                    <dt className="text-caption text-muted-foreground">{t(label!)}</dt>
                    <dd className="mt-1 break-words text-label font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="tile flex gap-3 p-4">
                <ShieldCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-label text-muted-foreground">
                  {t(
                    role === "client"
                      ? "Finishing setup does not connect a coach. If you choose to connect from Profile, your coach can read training, food, sleep, journal entries and progress photos, and assign programs. You can disconnect there."
                      : role === "trainer"
                        ? "Clients choose whether to connect using your code. Creating an account does not give you access to anyone's records."
                        : "Your tracking is private to your account. If you later connect a coach from Profile, review the access details there first.",
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <p className="eyebrow text-primary">{t("Up next")}</p>
                <p className="mt-1 text-label font-semibold">{t(destination.title)}</p>
                <p className="mt-1 text-label text-muted-foreground">{t(destination.body)}</p>
              </div>
            </>
          )}
        </fieldset>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/40 p-3 text-label text-destructive"
          >
            {error}
          </p>
        )}
        <p role="status" className="mt-5 flex items-start gap-2 text-caption text-muted-foreground">
          {saved && <Check aria-hidden="true" className="size-4 shrink-0" />}
          {t(
            saved
              ? "Progress saved privately to your account."
              : "Your progress saves privately when you continue. Changes on this step have not been saved yet.",
          )}
        </p>
        <div className="mt-5 flex items-stretch gap-3 pb-4">
          {step > 0 && (
            <Button
              type="button"
              wrap
              variant="secondary"
              disabled={busy}
              onClick={() => void advance(step - 1)}
              className="min-h-13"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              {t("Back")}
            </Button>
          )}
          <Button
            type="submit"
            wrap
            variant="volt"
            disabled={busy || (step === 0 && !role)}
            className="min-h-13 min-w-0 flex-1"
          >
            {busy ? (
              <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" />
            ) : step === 4 ? (
              <Check aria-hidden="true" className="size-4 shrink-0" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
            )}
            {t(busy ? "Saving…" : step === 4 ? "Finish setup" : "Save & continue")}
          </Button>
        </div>
        {onClose && (
          <Button
            type="button"
            wrap
            variant="ghost"
            disabled={busy}
            className="w-full"
            onClick={onClose}
          >
            {t("Close setup")}
          </Button>
        )}
        {onExit && (
          <Button
            type="button"
            wrap
            variant="ghost"
            disabled={busy}
            className="w-full"
            onClick={async () => {
              setBusy(true);
              try {
                await onExit();
              } catch (cause) {
                setError(errorText(cause));
                setBusy(false);
              }
            }}
          >
            {t("Sign out")}
          </Button>
        )}
      </form>
    </div>
  );
}
