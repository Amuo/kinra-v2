import { useId } from "react";
import { t, number, useLanguage } from "@/lib/i18n";

import { cardioMetricsError, type CardioMetrics } from "@/lib/cardio";
export type CardioValues = CardioMetrics;
const cardioFields = [
  { key: "duration_seconds", label: "Duration · seconds", max: 86400 },
  { key: "distance_m", label: "Distance · metres", max: 10000000 },
  { key: "speed_kmh", label: "Speed · km/h", max: 200 },
  { key: "incline_percent", label: "Incline · %", max: 100 },
] as const;

function hasCardioValues(value?: CardioValues) {
  return !!value && cardioFields.some(({ key }) => value[key] !== undefined);
}

/** Blanks stay absent; zero is an explicitly recorded value. Never fills from a target. */
export function CardioFields({
  value,
  onChange,
  disabled = false,
}: {
  value?: CardioValues | undefined;
  onChange: (value: CardioValues) => void;
  disabled?: boolean;
}) {
  useLanguage();
  const id = useId();
  const error = value && hasCardioValues(value) ? cardioMetricsError(value, false) : null;
  return (
    <div>
      <div className="grid min-w-0 grid-cols-2 gap-3">
        {cardioFields.map(({ key, label, max }) => (
          <label key={key} className="min-w-0 text-label" htmlFor={`${id}-${key}`}>
            <span className="mb-1 block">{t(label)}</span>
            <input
              id={`${id}-${key}`}
              className="num min-h-12 w-full min-w-0 rounded-tile border border-input bg-surface px-3 text-body"
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
              type="number"
              inputMode="decimal"
              min={key === "incline_percent" ? -100 : 0}
              max={max}
              step="any"
              disabled={disabled}
              value={value?.[key] ?? ""}
              placeholder={t("Not recorded")}
              onChange={(event) => {
                const next = { ...value };
                if (event.target.value === "") delete next[key];
                else {
                  const amount = Number(event.target.value);
                  if (!Number.isFinite(amount)) return;
                  next[key] = amount;
                }
                onChange(next);
              }}
            />
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-caption text-destructive">
          {t(error)}
        </p>
      )}
    </div>
  );
}

export function CardioReadout({ value }: { value?: CardioValues | undefined }) {
  useLanguage();
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-2 text-label">
      {cardioFields
        .filter(({ key }) => value?.[key] !== undefined)
        .map(({ key, label }) => (
          <div key={key}>
            <dt className="text-caption text-muted-foreground">{t(label)}</dt>
            <dd className="num font-semibold">{number(value![key]!)}</dd>
          </div>
        ))}
      {!hasCardioValues(value) && <div className="text-muted-foreground">{t("Not recorded")}</div>}
    </dl>
  );
}
