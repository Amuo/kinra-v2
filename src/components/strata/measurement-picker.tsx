import { useCallback, useId, useRef, useState } from "react";
import { t, number } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "./sheets";

/** A reviewed measurement draft. Display-unit changes never write canonical values. */
export function MeasurementPicker({
  label,
  value,
  unit,
  min,
  max,
  step,
  toDisplay,
  toCanonical,
  onChange,
}: {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  step: number;
  toDisplay: (value: number) => number;
  toCanonical: (value: number) => number;
  onChange: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="glass"
        wrap
        className="h-auto min-h-16 w-full justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(true)}
      >
        <span>{t(label)}</span>
        <span className="num font-semibold">
          {value === null
            ? t("Not added")
            : `${number(toDisplay(value), { maximumFractionDigits: 1 })} ${unit}`}
        </span>
      </Button>
      {open && (
        <MeasurementDraft
          label={label}
          value={value}
          unit={unit}
          min={min}
          max={max}
          step={step}
          toDisplay={toDisplay}
          toCanonical={toCanonical}
          onCancel={() => setOpen(false)}
          onSave={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
function MeasurementDraft({
  label,
  value,
  unit,
  min,
  max,
  step,
  toDisplay,
  toCanonical,
  onCancel,
  onSave,
}: {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  step: number;
  toDisplay: (value: number) => number;
  toCanonical: (value: number) => number;
  onCancel: () => void;
  onSave: (value: number | null) => void;
}) {
  const fieldId = useId();
  const decimal = (text: string) =>
    /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text.trim()) ? Number(text.trim().replace(",", ".")) : NaN;
  const count = Math.floor((max - min) / step) + 1;
  const nearest = (n: number) => Math.max(0, Math.min(count - 1, Math.round((n - min) / step)));
  const [index, setIndex] = useState(nearest(value === null ? (min + max) / 2 : toDisplay(value)));
  const [input, setInput] = useState(
    value === null ? "" : String(Number(toDisplay(value).toFixed(3))),
  );
  const [dirty, setDirty] = useState(false);
  const wheel = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);
  const initialIndex = useRef(index);
  const mountWheel = useCallback((node: HTMLDivElement | null) => {
    wheel.current = node;
    if (node) node.scrollTop = initialIndex.current * 44;
  }, []);
  const choose = (next: number) => {
    const i = Math.max(0, Math.min(count - 1, next));
    setIndex(i);
    setInput(String(Number((min + i * step).toFixed(2))));
    setDirty(true);
    interacting.current = false;
    wheel.current?.scrollTo({ top: i * 44, behavior: "auto" });
  };
  const parsed = decimal(input);
  const valid =
    (!dirty && value !== null) ||
    (input.trim() !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max);
  const invalid = input.trim() !== "" && !valid;
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onCancel()}
      title={t(label)}
      sub={t("Optional. Scroll to choose or type a value. Nothing changes until you confirm.")}
    >
      {value === null && !dirty && (
        <p className="mb-2 text-center text-caption text-muted-foreground">{t("Not added")}</p>
      )}
      <div className="relative mx-auto max-w-xs">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-[88px] h-11 rounded-xl border border-primary/40 bg-primary/10"
        />
        <div
          ref={mountWheel}
          role="spinbutton"
          tabIndex={0}
          aria-label={`${t(label)} (${unit})`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valid ? parsed : undefined}
          aria-valuetext={valid ? `${number(parsed)} ${unit}` : t("Not added")}
          className="relative h-[220px] touch-pan-y snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl py-[88px] outline-offset-2 [scrollbar-width:none]"
          onPointerDown={() => {
            interacting.current = true;
          }}
          onWheel={() => {
            interacting.current = true;
          }}
          onScroll={() => {
            if (!interacting.current || !wheel.current) return;
            const i = nearest(min + (wheel.current.scrollTop / 44) * step);
            if (i === index) return;
            setIndex(i);
            setInput(String(Number((min + i * step).toFixed(2))));
            setDirty(true);
          }}
          onKeyDown={(event) => {
            const next =
              event.key === "ArrowDown"
                ? index + 1
                : event.key === "ArrowUp"
                  ? index - 1
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? count - 1
                      : null;
            if (next !== null) {
              event.preventDefault();
              choose(next);
            }
          }}
        >
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              onClick={() => choose(i)}
              className="flex h-11 snap-center items-center justify-center num text-title font-semibold"
              style={{
                opacity: Math.max(0.15, 1 - Math.abs(i - index) * 0.32),
                transform: `perspective(300px) rotateX(${Math.max(-55, Math.min(55, (i - index) * 18))}deg)`,
              }}
            >
              {number(min + i * step, { maximumFractionDigits: 1 })}{" "}
              <span className="ml-2 text-label text-muted-foreground">{unit}</span>
            </div>
          ))}
        </div>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-label">
          {t("Enter value")} ({unit})
        </span>
        <Input
          inputMode="decimal"
          aria-invalid={invalid}
          aria-describedby={`${fieldId}-range${invalid ? ` ${fieldId}-error` : ""}`}
          value={input}
          onChange={(e) => {
            const text = e.target.value;
            setInput(text);
            setDirty(true);
            const next = decimal(text);
            interacting.current = false;
            if (Number.isFinite(next) && next >= min && next <= max) {
              const i = nearest(next);
              setIndex(i);
              wheel.current?.scrollTo({ top: i * 44, behavior: "auto" });
            }
          }}
          className="min-h-12"
        />
      </label>
      <p id={`${fieldId}-range`} className="mt-2 text-caption text-muted-foreground">
        {t("Range: {min}–{max} {unit}", { min: number(min), max: number(max), unit })}
      </p>
      {invalid && (
        <p id={`${fieldId}-error`} role="alert" className="mt-2 text-label text-destructive">
          {t("Enter a value between {min} and {max} {unit}.", {
            min: number(min),
            max: number(max),
            unit,
          })}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          wrap
          variant="secondary"
          className="min-h-11 flex-1"
          onClick={onCancel}
        >
          {t("Cancel")}
        </Button>
        <Button
          type="button"
          wrap
          className="min-h-11 flex-1"
          disabled={!valid || (!dirty && value === null)}
          onClick={() => onSave(dirty ? toCanonical(parsed) : value)}
        >
          {t("Use value")}
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        wrap
        className="mt-2 min-h-11 w-full"
        onClick={() => onSave(null)}
      >
        {t("Leave blank")}
      </Button>
    </Sheet>
  );
}
