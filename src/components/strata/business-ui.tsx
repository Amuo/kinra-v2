import { useState, type ReactNode, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t, currentLanguage, localeFor } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";

export function BusinessCard({
  title,
  children,
  action,
}: {
  title?: string | undefined;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface/35 p-5 lg:p-6">
      {title && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function BusinessField({
  label,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {t(label)}
      <Input {...props} className="min-h-11" />
    </label>
  );
}
export function BusinessSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {t(label)}
      <select
        {...props}
        className="min-h-11 min-w-0 rounded-lg border border-input bg-background px-3"
      >
        {children}
      </select>
    </label>
  );
}
export function BusinessForm({
  children,
  onSave,
  label = "Save",
  onDone,
}: {
  children: ReactNode;
  onSave: () => Promise<unknown>;
  label?: string;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await onSave();
      setSaved(true);
      onDone?.();
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        {children}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="volt" className="min-h-11" disabled={busy}>
          {t(busy ? "Saving…" : label)}
        </Button>
        {saved && (
          <p role="status" className="text-sm text-primary">
            {t("Saved")}
          </p>
        )}
      </div>
    </form>
  );
}
export function BusinessStatus({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${["active", "allowed", "scheduled", "booked"].includes(value) ? "border-primary/25 bg-primary/10 text-primary" : ["denied", "blocked", "expired"].includes(value) ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-border bg-surface-2 text-muted-foreground"}`}
    >
      {t(value)}
    </span>
  );
}
export const businessMoney = (minor: number, currency: string) =>
  new Intl.NumberFormat(localeFor[currentLanguage()], { style: "currency", currency }).format(
    minor / 100,
  );
// Some browser ICU builds return month placeholders (M10) for Bosnian medium dates.
// Numeric Gregorian parts avoid that fallback while preserving the requested timezone.
function bosnianBusinessDate(date: Date, timezone?: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    calendar: "gregory",
    numberingSystem: "latn",
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(timezone ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}),
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}${timezone ? ` ${get("hour")}:${get("minute")}` : ""}`;
}
export const businessDate = (value: string) => {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return currentLanguage() === "bs"
    ? bosnianBusinessDate(date)
    : new Intl.DateTimeFormat(localeFor[currentLanguage()], { dateStyle: "medium" }).format(date);
};
export const businessTime = (value: string, timezone: string) =>
  currentLanguage() === "bs"
    ? bosnianBusinessDate(new Date(value), timezone)
    : new Intl.DateTimeFormat(localeFor[currentLanguage()], {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timezone,
      }).format(new Date(value));
export const businessToday = (timezone?: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
export function businessLocalInput(value: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function businessInputISO(value: string, timezone: string) {
  const target = Date.parse(`${value}:00Z`);
  let timestamp = target;
  for (let i = 0; i < 4; i++) {
    const shown = Date.parse(
      `${businessLocalInput(new Date(timestamp).toISOString(), timezone)}:00Z`,
    );
    timestamp += target - shown;
  }
  if (businessLocalInput(new Date(timestamp).toISOString(), timezone) !== value)
    throw new Error(t("This local time does not exist. Choose another time."));
  return new Date(timestamp).toISOString();
}
