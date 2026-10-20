import { t } from "@/lib/i18n";
import { today } from "@/lib/stats";
import type { OnboardingAnswers } from "@/lib/onboarding";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export const activityLabels = {
  low: "Mostly seated",
  moderate: "A mix of sitting and moving",
  high: "Moving much of the day",
} as const;
const descriptions = {
  low: "Most of your day involves sitting or resting.",
  moderate: "Your day includes some walking, standing or other movement.",
  high: "Your daily routine involves frequent walking, physical work or movement.",
} as const;
export function OnboardingMore({
  answers,
  update,
}: {
  answers: OnboardingAnswers;
  update: (patch: Partial<OnboardingAnswers>) => void;
}) {
  return (
    <details className="rounded-tile border border-border p-4">
      <summary className="cursor-pointer py-2 text-label font-semibold">
        {t("More about you (optional)")}
      </summary>
      <div className="mt-4 space-y-5">
        <p className="text-label text-muted-foreground">
          {t(
            "Share only what you want to keep in your private setup. These answers are not automatically shared with a coach.",
          )}
        </p>
        <label className="block">
          <span className="mb-2 block text-label font-semibold">
            {t("Date of birth (optional)")}
          </span>
          <Input
            type="date"
            max={today()}
            value={answers.birth_date ?? ""}
            onChange={(event) => update({ birth_date: event.target.value || null })}
            className="min-h-12 w-full min-w-0 bg-surface"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-label font-semibold">
            {t("Daily activity (optional)")}
          </span>
          <select
            className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-label"
            value={answers.activity_level ?? ""}
            onChange={(event) =>
              update({
                activity_level: (event.target.value || null) as OnboardingAnswers["activity_level"],
              })
            }
          >
            <option value="">{t("Not added")}</option>
            {Object.entries(activityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
          {answers.activity_level && (
            <span className="mt-2 block text-caption text-muted-foreground">
              {t(descriptions[answers.activity_level])}
            </span>
          )}
        </label>
        <label className="block">
          <span className="mb-2 block text-label font-semibold">{t("City (optional)")}</span>
          <Input
            value={answers.city}
            maxLength={100}
            autoComplete="address-level2"
            onChange={(event) => update({ city: event.target.value })}
            className="min-h-12 bg-surface"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-label font-semibold">
            {t("Movement considerations (optional)")}
          </span>
          <span className="mb-2 block text-caption text-muted-foreground">
            {t(
              "You can note preferred adaptations, access needs or movements you want to avoid. No diagnosis or medical history is needed.",
            )}
          </span>
          <Textarea
            value={answers.limitations}
            maxLength={1000}
            rows={4}
            onChange={(event) => update({ limitations: event.target.value })}
            className="bg-surface"
          />
        </label>
      </div>
    </details>
  );
}
