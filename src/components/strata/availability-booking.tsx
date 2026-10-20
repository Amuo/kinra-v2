import type { CoachAvailability as AvailabilityDraft } from "@/lib/organizations";
import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useAct, useMe, useQ } from "@/lib/api";
import { t, useLanguage, dateTime } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { today, iso } from "@/lib/stats";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "./sheets";
import { ErrorState, Skeleton } from "./ui";
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export function AvailabilityBooking() {
  useLanguage();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const me = useMe().data;
  return (
    <>
      <Button wrap variant="glass" className="mt-3 min-h-12 w-full" onClick={() => setOpen(true)}>
        <CalendarDays aria-hidden="true" />
        {t("Availability & booking")}
      </Button>
      {open && (
        <Sheet open onOpenChange={setOpen} title={t("Availability & booking")}>
          <div className="space-y-4">
            {me?.role === "trainer" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  wrap
                  variant={!editing ? "volt" : "secondary"}
                  aria-pressed={!editing}
                  onClick={() => setEditing(false)}
                  className="min-h-11 flex-1"
                >
                  {t("Book with my coach")}
                </Button>
                <Button
                  wrap
                  variant={editing ? "volt" : "secondary"}
                  aria-pressed={editing}
                  onClick={() => setEditing(true)}
                  className="min-h-11 flex-1"
                >
                  {t("My availability")}
                </Button>
              </div>
            )}
            {editing && me ? <AvailabilityLoader coachId={me.id} /> : <Booking />}
          </div>
        </Sheet>
      )}
    </>
  );
}
function AvailabilityLoader({ coachId }: { coachId: string }) {
  const q = useQ(["availability", coachId], (api) => api.organizations.availability(coachId));
  if (q.isLoading) return <Skeleton className="h-40" />;
  if (q.error) return <ErrorState onRetry={() => q.refetch()} />;
  return (
    <AvailabilityEditor
      initial={q.data ?? { timezone: localZone(), published: false, rules: [], exceptions: [] }}
    />
  );
}
function AvailabilityEditor({ initial }: { initial: AvailabilityDraft }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = useAct((api, value: AvailabilityDraft) => api.organizations.saveAvailability(value));
  const update = (next: AvailabilityDraft) => {
    setDraft(next);
    setSaved(false);
    setError("");
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        save.mutate(draft, {
          onSuccess: () => setSaved(true),
          onError: (cause) => setError(errorText(cause)),
        });
      }}
      className="space-y-4"
    >
      <p className="text-label text-muted-foreground">
        {t(
          "Set the times connected clients may request. Saving availability does not confirm appointments.",
        )}
      </p>
      <fieldset disabled={save.isPending} className="min-w-0 space-y-4">
        <label className="block text-label">
          {t("Time zone")}
          <Input
            value={draft.timezone}
            onChange={(e) => update({ ...draft, timezone: e.target.value })}
            required
            className="mt-2 min-h-12"
          />
          <span className="mt-1 block text-caption text-muted-foreground">
            {t("Use an IANA time zone, for example Europe/Sarajevo.")}
          </span>
        </label>
        <label className="flex min-h-12 items-center gap-3 text-label">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => update({ ...draft, published: e.target.checked })}
          />
          {t("Publish available times to connected clients")}
        </label>
        <h3 className="text-title font-semibold">{t("Weekly hours")}</h3>
        {draft.rules.map((rule, index) => (
          <div key={index} className="space-y-3 rounded-tile border border-border p-3">
            <label className="block text-label">
              {t("Day")}
              <select
                value={rule.weekday}
                onChange={(e) =>
                  update({
                    ...draft,
                    rules: draft.rules.map((r, i) =>
                      i === index ? { ...r, weekday: Number(e.target.value) } : r,
                    ),
                  })
                }
                className="mt-1 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
              >
                {weekdays.map((day, i) => (
                  <option key={day} value={i}>
                    {t(day)}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["start", "end"] as const).map((field) => (
                <label key={field} className="min-w-0 text-label">
                  {t(field === "start" ? "Start time" : "End time")}
                  <Input
                    type="time"
                    required
                    value={rule[field]}
                    onChange={(e) =>
                      update({
                        ...draft,
                        rules: draft.rules.map((r, i) =>
                          i === index ? { ...r, [field]: e.target.value } : r,
                        ),
                      })
                    }
                    className="mt-1 min-h-12 min-w-0"
                  />
                </label>
              ))}
            </div>
            <label className="block text-label">
              {t("Appointment length (minutes)")}
              <Input
                type="number"
                min={10}
                max={240}
                step={5}
                required
                value={rule.slotMinutes}
                onChange={(e) =>
                  update({
                    ...draft,
                    rules: draft.rules.map((r, i) =>
                      i === index ? { ...r, slotMinutes: Number(e.target.value) } : r,
                    ),
                  })
                }
                className="mt-1 min-h-12"
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              wrap
              className="min-h-11"
              onClick={() => update({ ...draft, rules: draft.rules.filter((_, i) => i !== index) })}
            >
              <Trash2 aria-hidden="true" />
              {t("Remove hours")}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="glass"
          wrap
          className="min-h-11 w-full"
          onClick={() =>
            update({
              ...draft,
              rules: [
                ...draft.rules,
                { weekday: 1, start: "09:00", end: "17:00", slotMinutes: 30 },
              ],
            })
          }
        >
          <Plus aria-hidden="true" />
          {t("Add weekly hours")}
        </Button>
        <h3 className="text-title font-semibold">{t("Date exceptions")}</h3>
        {draft.exceptions.map((exception, index) => (
          <div key={index} className="space-y-3 rounded-tile border border-border p-3">
            <label className="block text-label">
              {t("Date")}
              <Input
                type="date"
                required
                value={exception.date}
                onChange={(e) =>
                  update({
                    ...draft,
                    exceptions: draft.exceptions.map((x, i) =>
                      i === index ? { ...x, date: e.target.value } : x,
                    ),
                  })
                }
                className="mt-1 min-h-12"
              />
            </label>
            <label className="flex min-h-11 items-center gap-3 text-label">
              <input
                type="checkbox"
                checked={exception.unavailable}
                onChange={(e) =>
                  update({
                    ...draft,
                    exceptions: draft.exceptions.map((x, i) =>
                      i === index
                        ? {
                            date: x.date,
                            unavailable: e.target.checked,
                            ...(e.target.checked
                              ? {}
                              : { start: "09:00", end: "12:00", slotMinutes: 30 }),
                          }
                        : x,
                    ),
                  })
                }
              />
              {t("Unavailable all day")}
            </label>
            {!exception.unavailable && (
              <div className="grid grid-cols-2 gap-3">
                {(["start", "end"] as const).map((field) => (
                  <label key={field} className="min-w-0 text-label">
                    {t(field === "start" ? "Start time" : "End time")}
                    <Input
                      type="time"
                      required
                      value={exception[field] ?? ""}
                      onChange={(e) =>
                        update({
                          ...draft,
                          exceptions: draft.exceptions.map((x, i) =>
                            i === index ? { ...x, [field]: e.target.value } : x,
                          ),
                        })
                      }
                      className="mt-1 min-h-12 min-w-0"
                    />
                  </label>
                ))}
              </div>
            )}
            <label className="block text-label">
              {t("Appointment length (minutes)")}
              <Input
                type="number"
                min={10}
                max={240}
                step={5}
                disabled={exception.unavailable}
                value={exception.slotMinutes ?? 30}
                onChange={(e) =>
                  update({
                    ...draft,
                    exceptions: draft.exceptions.map((x, i) =>
                      i === index ? { ...x, slotMinutes: Number(e.target.value) } : x,
                    ),
                  })
                }
                className="mt-1 min-h-12"
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              wrap
              className="min-h-11"
              onClick={() =>
                update({ ...draft, exceptions: draft.exceptions.filter((_, i) => i !== index) })
              }
            >
              <Trash2 aria-hidden="true" />
              {t("Remove exception")}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="glass"
          wrap
          className="min-h-11 w-full"
          onClick={() =>
            update({
              ...draft,
              exceptions: [...draft.exceptions, { date: today(), unavailable: true }],
            })
          }
        >
          <Plus aria-hidden="true" />
          {t("Add date exception")}
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-label text-muted-foreground">
          {t("Availability saved.")}
        </p>
      )}
      <Button
        type="submit"
        wrap
        variant="volt"
        disabled={save.isPending}
        className="min-h-12 w-full"
      >
        {t(save.isPending ? "Saving…" : "Save availability")}
      </Button>
    </form>
  );
}
function Booking() {
  const coaches = useQ(["booking-coaches"], (api) => api.trainers());
  const [coach, setCoach] = useState("");
  const [from, setFrom] = useState(today());
  const [selected, setSelected] = useState<{ startsAt: string; endsAt: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const to = /^\d{4}-\d{2}-\d{2}$/.test(from) ? iso(addDays(new Date(`${from}T12:00`), 7)) : from;
  const slots = useQ(
    ["booking-slots", coach, from, to],
    (api) => api.organizations.slots(coach, from, to),
    !!coach && !!from,
  );
  const request = useAct(
    (
      api,
      value: {
        coach_id: string;
        starts_at: string;
        ends_at: string;
        status: "requested";
        notes: string;
      },
    ) => api.features.save("appointment", value),
  );
  if (coaches.isLoading) return <Skeleton className="h-24" />;
  if (coaches.error) return <ErrorState onRetry={() => coaches.refetch()} />;
  if (!coaches.data?.length)
    return (
      <p className="py-4 text-label text-muted-foreground">
        {t("Connect with a coach from Profile before requesting an appointment.")}
      </p>
    );
  return (
    <div className="space-y-4">
      <label className="block text-label">
        {t("Connected coach")}
        <select
          value={coach}
          disabled={request.isPending}
          onChange={(e) => {
            setCoach(e.target.value);
            setSelected(null);
            setSuccess(false);
          }}
          className="mt-2 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
        >
          <option value="">{t("Choose a coach")}</option>
          {coaches.data.map((person) => (
            <option key={person.id} value={person.id}>
              {person.display_name || t("Coach")}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-label">
        {t("Show the week starting")}
        <Input
          type="date"
          min={today()}
          value={from}
          disabled={request.isPending}
          onChange={(e) => {
            setFrom(e.target.value);
            setSelected(null);
            setSuccess(false);
          }}
          className="mt-2 min-h-12"
        />
      </label>
      <p className="text-caption text-muted-foreground">
        {t("Times shown in {timezone}", { timezone: localZone() })}
      </p>
      {coach &&
        (slots.isLoading ? (
          <Skeleton className="h-24" />
        ) : slots.error ? (
          <ErrorState onRetry={() => slots.refetch()} />
        ) : (
          <div className="space-y-2" role="group" aria-label={t("Available appointment times")}>
            {slots.data?.map((slot) => (
              <Button
                key={slot.startsAt}
                wrap
                disabled={request.isPending}
                aria-pressed={selected?.startsAt === slot.startsAt}
                variant={selected?.startsAt === slot.startsAt ? "volt" : "glass"}
                className="min-h-12 w-full justify-start text-left"
                onClick={() => {
                  setSelected(slot);
                  setSuccess(false);
                  setError("");
                }}
              >
                {dateTime(new Date(slot.startsAt))} — {dateTime(new Date(slot.endsAt))}
              </Button>
            ))}
            {!slots.data?.length && (
              <p className="text-label text-muted-foreground">
                {t("No available times in this week. Try another week or contact your coach.")}
              </p>
            )}
          </div>
        ))}
      {selected && (
        <div className="space-y-3 rounded-tile border border-primary/25 bg-primary/5 p-4">
          <h3 className="text-title font-semibold">{t("Review appointment request")}</h3>
          <p className="text-label">
            {coaches.data.find((person) => person.id === coach)?.display_name}
          </p>
          <p className="text-label">
            {dateTime(new Date(selected.startsAt))} — {dateTime(new Date(selected.endsAt))}
          </p>
          <p className="text-caption text-muted-foreground">{localZone()}</p>
          <label className="block text-label">
            {t("Note for your coach (optional)")}
            <Textarea
              value={notes}
              maxLength={10000}
              disabled={request.isPending}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
            />
          </label>
          <p className="text-label text-muted-foreground">
            {t(
              "This sends a request in Kinra. Your coach must confirm; no email or notification delivery is implied.",
            )}
          </p>
          <Button
            wrap
            variant="volt"
            disabled={request.isPending || success}
            className="min-h-12 w-full"
            onClick={() => {
              setError("");
              request.mutate(
                {
                  coach_id: coach,
                  starts_at: selected.startsAt,
                  ends_at: selected.endsAt,
                  status: "requested",
                  notes,
                },
                {
                  onSuccess: () => {
                    setSuccess(true);
                    void slots.refetch();
                  },
                  onError: (cause) => setError(errorText(cause)),
                },
              );
            }}
          >
            {t(request.isPending ? "Saving…" : success ? "Request saved" : "Request appointment")}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-label text-muted-foreground">
          {t("Appointment requested. You can review its status in Appointments.")}
        </p>
      )}
    </div>
  );
}
