import { useState } from "react";
import { ExternalLink, ImageOff } from "lucide-react";
import { t, useLanguage } from "@/lib/i18n";
import {
  exerciseGuide,
  exercises,
  exerciseDisplayName,
  type ExerciseCatalogueEntry,
} from "@/lib/exercise-catalogue";
function GuideImage({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="min-w-0 overflow-hidden rounded-tile border border-border bg-surface">
      {failed ? (
        <div className="flex min-h-36 flex-col items-center justify-center gap-2 p-4 text-center text-label text-muted-foreground">
          <ImageOff aria-hidden="true" />
          <p>{t("Image unavailable. Follow the written guide below.")}</p>
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="aspect-[4/3] w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
      <figcaption className="p-3 text-caption text-muted-foreground">{alt}</figcaption>
    </figure>
  );
}
export function ExerciseGuide({
  entry,
  onAlternative,
}: {
  entry: ExerciseCatalogueEntry;
  onAlternative?: (entry: ExerciseCatalogueEntry) => void;
}) {
  useLanguage();
  const guide = exerciseGuide(entry);
  const mechanicsLabels = {
    compound: "Compound movement",
    isolation: "Isolation movement",
    mobility: "Mobility",
    conditioning: "Conditioning",
    clinical: "Individual plan required",
  };
  const lateralityLabels = {
    bilateral: "Both sides together",
    unilateral: "One side at a time",
    alternating: "Alternating sides",
    "not-applicable": "",
  };
  const purposeLabels: Record<string, string> = {
    "individual-plan": "Individual plan required",
    mobility: "Mobility",
    "cool-down": "Cool-down",
    "warm-up": "Warm-up",
    conditioning: "Conditioning",
    strength: "Strength",
    recovery: "Recovery",
    power: "Power",
    stability: "Stability",
  };
  return (
    <div className="space-y-4">
      {(guide.isClinical || guide.contentStatus === "individual plan required") && (
        <p className="rounded-tile border border-border bg-surface p-4 text-label">
          {t(
            "This entry needs an individual plan. General guidance does not replace instructions from your treating professional.",
          )}
        </p>
      )}
      <section className="rounded-tile border border-volt/20 bg-volt/5 p-4">
        <h3 className="text-label font-semibold">{t("Muscle roles")}</h3>
        {entry.primaryMuscles.length +
          entry.secondaryMuscles.length +
          entry.stabilizerMuscles.length >
        0 ? (
          <dl className="mt-3 space-y-4">
            {(
              [
                ["Primary muscles", entry.primaryMuscles],
                ["Secondary muscles", entry.secondaryMuscles],
                ["Stabilizers", entry.stabilizerMuscles],
              ] as const
            ).map(([label, muscles]) =>
              muscles.length > 0 ? (
                <div key={label}>
                  <dt className="text-caption text-muted-foreground">{t(label)}</dt>
                  <dd className="mt-1 text-label leading-relaxed">
                    {muscles.map((muscle) => t(muscle)).join(" · ")}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        ) : (
          <p className="mt-2 text-label text-muted-foreground">
            {t("Muscle metadata unavailable")}
          </p>
        )}
      </section>
      <details className="rounded-tile border border-border p-4">
        <summary className="cursor-pointer py-2 text-label font-semibold">
          {t("Movement details")}
        </summary>
        <dl className="mt-3 space-y-4">
          <div>
            <dt className="text-caption text-muted-foreground">{t("Movement type")}</dt>
            <dd className="mt-1 text-label">{t(mechanicsLabels[entry.mechanics])}</dd>
          </div>
          {entry.laterality !== "not-applicable" && (
            <div>
              <dt className="text-caption text-muted-foreground">{t("Sides")}</dt>
              <dd className="mt-1 text-label">{t(lateralityLabels[entry.laterality])}</dd>
            </div>
          )}
          {entry.purpose.length > 0 && (
            <div>
              <dt className="text-caption text-muted-foreground">{t("Training purpose")}</dt>
              <dd className="mt-1 text-label">
                {entry.purpose.map((purpose) => t(purposeLabels[purpose] ?? purpose)).join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </details>
      {guide.images.length > 0 && (
        <details className="rounded-tile border border-border bg-surface p-4" open>
          <summary className="cursor-pointer py-2 text-label font-semibold">
            {t(guide.mediaKind === "illustration" ? "Movement schematic" : "Movement photographs")}
          </summary>
          {guide.mediaKind === "illustration" && (
            <p className="mt-2 text-caption text-muted-foreground">
              {t("A simplified movement illustration, not a photograph of this exact variation.")}
            </p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {guide.images.map((img) => (
              <GuideImage key={img.url} {...img} />
            ))}
          </div>
          {guide.mediaSourceName && (
            <p className="mt-3 text-caption text-muted-foreground">
              {guide.mediaSourceName}
              {guide.mediaLicense ? ` · ${guide.mediaLicense}` : ""}
            </p>
          )}
        </details>
      )}
      {(
        [
          ["Setup", guide.setup],
          ["How to move", guide.steps],
          ["Coaching cues", guide.cues],
          ["Common mistakes", guide.mistakes],
        ] as const
      ).map(
        ([title, lines], i) =>
          lines.length > 0 && (
            <details key={title} open={i < 2} className="rounded-tile border border-border p-4">
              <summary className="cursor-pointer py-2 text-label font-semibold">{t(title)}</summary>
              <ol className="mt-3 list-decimal space-y-3 pl-5 text-label leading-relaxed">
                {lines.map((line, n) => (
                  <li key={n} className="pl-1">
                    {line}
                  </li>
                ))}
              </ol>
            </details>
          ),
      )}
      {onAlternative && guide.alternatives.length > 0 && (
        <section className="rounded-tile border border-border p-4">
          <h3 className="text-label font-semibold">{t("Related alternatives")}</h3>
          <p className="mt-2 text-caption text-muted-foreground">
            {t("Review the movement and equipment before choosing an alternative.")}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {guide.alternatives.map((id) => {
              const alternative = exercises.find((item) => item.id === id);
              return alternative ? (
                <button
                  key={id}
                  type="button"
                  className="min-h-11 rounded-xl border border-border px-3 py-2 text-left text-label underline"
                  onClick={() => onAlternative(alternative)}
                >
                  {exerciseDisplayName(alternative)}
                </button>
              ) : null;
            })}
          </div>
        </section>
      )}
      {guide.videoUrl && (
        <a
          href={guide.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 items-center gap-2 text-label text-volt underline"
        >
          {t("Open demonstration video")}
          <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
        </a>
      )}
      <div className="border-t border-border pt-4 text-caption text-muted-foreground">
        <p>
          {t("Guide source")}: {guide.sourceName}
        </p>
        <a
          href={guide.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex min-h-11 items-center gap-2 underline"
        >
          {t("View guide source")}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
