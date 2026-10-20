import { OnboardingMore } from "./onboarding-more";
import { t } from "@/lib/i18n";
import { genderLabels, experienceLabels, type OnboardingAnswers } from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { MeasurementPicker } from "./measurement-picker";
export function StartingPoint({
  answers,
  update,
}: {
  answers: OnboardingAnswers;
  update: (patch: Partial<OnboardingAnswers>) => void;
}) {
  const imperial = answers.units === "imperial";
  return (
    <>
      <p className="text-label text-muted-foreground">
        {t(
          "All of this is optional. These details stay in your private setup and are not added to your diary or shared with a coach.",
        )}
      </p>
      <label className="block">
        <span className="mb-2 block text-label font-semibold">{t("Gender (optional)")}</span>
        <select
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-body"
          value={answers.gender ?? ""}
          onChange={(e) =>
            update({ gender: (e.target.value || null) as OnboardingAnswers["gender"] })
          }
        >
          <option value="">{t("Not added")}</option>
          {Object.entries(genderLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="mb-2 text-label font-semibold">{t("Units")}</legend>
        <div className="flex flex-wrap gap-2">
          {(["metric", "imperial"] as const).map((units) => (
            <Button
              type="button"
              key={units}
              wrap
              variant={answers.units === units ? "volt" : "secondary"}
              aria-pressed={answers.units === units}
              className="min-h-11 flex-1"
              onClick={() => update({ units })}
            >
              {t(units === "metric" ? "Metric (cm, kg)" : "Imperial (in, lb)")}
            </Button>
          ))}
        </div>
      </fieldset>
      <div className="space-y-3">
        <MeasurementPicker
          key={`height-${answers.units}`}
          label="Height (optional)"
          value={answers.height_cm}
          unit={imperial ? "in" : "cm"}
          min={imperial ? 31.5 : 80}
          max={imperial ? 98.4 : 250}
          step={imperial ? 0.5 : 1}
          toDisplay={(v) => (imperial ? v / 2.54 : v)}
          toCanonical={(v) => (imperial ? v * 2.54 : v)}
          onChange={(height_cm) => update({ height_cm })}
        />
        <MeasurementPicker
          key={`weight-${answers.units}`}
          label="Weight (optional)"
          value={answers.weight_kg}
          unit={imperial ? "lb" : "kg"}
          min={imperial ? 44.1 : 20}
          max={imperial ? 771.6 : 350}
          step={imperial ? 1 : 0.5}
          toDisplay={(v) => (imperial ? v / 0.45359237 : v)}
          toCanonical={(v) => (imperial ? v * 0.45359237 : v)}
          onChange={(weight_kg) => update({ weight_kg })}
        />
      </div>
      <label className="block">
        <span className="mb-2 block text-label font-semibold">
          {t("Training experience (optional)")}
        </span>
        <select
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-body"
          value={answers.experience ?? ""}
          onChange={(e) =>
            update({ experience: (e.target.value || null) as OnboardingAnswers["experience"] })
          }
        >
          <option value="">{t("Not added")}</option>
          {Object.entries(experienceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      <OnboardingMore answers={answers} update={update} />
      <p className="text-caption text-muted-foreground">
        {t("Leave any field blank and continue. You can change these details later.")}
      </p>
    </>
  );
}
