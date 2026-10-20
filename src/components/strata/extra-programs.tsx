import { videoStarters, localizedVideoPlan } from "@/lib/video-starters";
import { useState } from "react";
import { t, useLanguage, number, format } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { useAct, useApi, useMe, useQ } from "@/lib/api";
import { featureSchemas, type FeaturePayloads, type FeatureRecord } from "@/lib/feature-types";
import { today } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, Skeleton } from "./ui";
import { Sheet } from "./sheets";

type Kind = "supplement_plan" | "video_plan";
type Plan = FeatureRecord<Kind>;
const displayPlan = (record: Plan): Plan =>
  record.kind === "video_plan" ? localizedVideoPlan(record as FeatureRecord<"video_plan">) : record;
const contextLabels = {
  general: "General",
  gym: "Gym",
  home: "Home",
  outdoors: "Outdoors",
  hotel: "Hotel",
  morning: "Morning",
  rehabilitation: "Rehabilitation",
} as const;
const frequencyLabels = {
  daily: "Daily",
  training: "Training days",
  rest: "Rest days",
  as_needed: "As needed",
} as const;
const units = ["mg", "g", "ml", "IU", "caps", "tabs", "scoops"] as const;
const control = "mt-1 min-h-12 w-full rounded-tile border border-input bg-surface px-3";

export function ExtraPrograms({ kind }: { kind: Kind }) {
  useLanguage();
  const { ownerId } = useApi();
  const plans = useQ(["features", kind], (api) => api.features.list(kind));
  const [query, setQuery] = useState("");
  const [context, setContext] = useState("");
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const rows = (plans.data ?? []).filter(
    (row) =>
      (!context || row.payload.context === context) &&
      `${displayPlan(row).payload.title} ${displayPlan(row).payload.notes ?? ""}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <div className="space-y-4">
      <p className="text-label text-muted-foreground">
        {t(
          kind === "supplement_plan"
            ? "Create a private supplement plan from your own guidance. Review doses before activating schedules."
            : "Organize video links into a private plan. Open videos deliberately and record completion yourself.",
        )}
      </p>
      <Button wrap className="min-h-12 w-full" onClick={() => setEditing("new")}>
        {t(kind === "supplement_plan" ? "New supplement plan" : "New video plan")}
      </Button>
      <label className="block text-label">
        {t("Search programs")}
        <Input className="mt-1 h-12" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <label className="block text-label">
        {t("Context")}
        <select className={control} value={context} onChange={(e) => setContext(e.target.value)}>
          <option value="">{t("All contexts")}</option>
          {Object.entries(contextLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      {kind === "video_plan" && <VideoStarterCards />}
      {plans.isPending ? (
        <Skeleton className="h-24" />
      ) : plans.error ? (
        <ErrorState onRetry={() => void plans.refetch()} />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-card border border-border bg-surface p-4">
              <p className="eyebrow">
                {t(row.owner_id === ownerId ? "Own plan" : "Assigned plan")}
              </p>
              <h3 className="mt-2 break-words font-display text-title font-bold">
                {displayPlan(row).payload.title}
              </h3>
              <p className="mt-2 text-caption">
                {t(contextLabels[row.payload.context])} ·{" "}
                {t("{count} weeks", { count: row.payload.weeks })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button wrap variant="glass" onClick={() => setSelected(row)}>
                  {t("Review plan")}
                </Button>
                {row.owner_id === ownerId && (
                  <Button wrap variant="ghost" onClick={() => setEditing(row)}>
                    {t("Edit")}
                  </Button>
                )}
              </div>
            </article>
          ))}
          {!rows.length && (
            <p className="py-4 text-label">
              {t(
                query.trim() || context
                  ? "No plans match your search."
                  : kind === "supplement_plan"
                    ? "No supplement plans yet. Create a private plan to get started."
                    : "No private video plans yet. Save a starting point or create your own.",
              )}
            </p>
          )}
        </div>
      )}
      {editing && (
        <ExtraPlanEditor
          key={editing === "new" ? kind : editing.id}
          kind={kind}
          record={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {selected && <ExtraPlanReview record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ExtraPlanEditor({
  kind,
  record,
  onClose,
}: {
  kind: Kind;
  record: Plan | undefined;
  onClose: () => void;
}) {
  useLanguage();
  const me = useMe().data;
  const clients = useQ(["plan-clients"], (api) => api.clients(), me?.role === "trainer");
  const [saveId] = useState(() => record?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(record?.payload.title ?? "");
  const [weeks, setWeeks] = useState(record?.payload.weeks ?? 1);
  const [context, setContext] = useState<FeaturePayloads[Kind]["context"]>(
    record?.payload.context ?? "general",
  );
  const [notes, setNotes] = useState(record?.payload.notes ?? "");
  const [client, setClient] = useState(record?.client_id ?? "");
  const [supplements, setSupplements] = useState<FeaturePayloads["supplement_plan"]["supplements"]>(
    record?.kind === "supplement_plan"
      ? (record.payload as FeaturePayloads["supplement_plan"]).supplements
      : [],
  );
  const [videos, setVideos] = useState<FeaturePayloads["video_plan"]["videos"]>(
    record?.kind === "video_plan" ? (record.payload as FeaturePayloads["video_plan"]).videos : [],
  );
  const [error, setError] = useState("");
  const save = useAct(async (api) => {
    const base = { title, weeks, context, notes };
    const options = {
      id: saveId,
      visibility: "private" as const,
      clientId: client || null,
    };
    if (kind === "supplement_plan")
      await api.features.save(
        kind,
        featureSchemas.supplement_plan.parse({ ...base, supplements }),
        options,
      );
    else
      await api.features.save(
        kind,
        featureSchemas.video_plan.parse({
          ...base,
          videos,
          ...(record?.kind === "video_plan" &&
          (record.payload as FeaturePayloads["video_plan"]).starter_id
            ? { starter_id: (record.payload as FeaturePayloads["video_plan"]).starter_id }
            : {}),
        }),
        options,
      );
  });
  const updateSupplement = (i: number, patch: Partial<(typeof supplements)[number]>) =>
    setSupplements((rows) => rows.map((row, index) => (i === index ? { ...row, ...patch } : row)));
  const updateVideo = (i: number, patch: Partial<(typeof videos)[number]>) =>
    setVideos((rows) => rows.map((row, index) => (i === index ? { ...row, ...patch } : row)));
  return (
    <Sheet
      open
      onOpenChange={(open) => !open && !save.isPending && onClose()}
      title={t(kind === "supplement_plan" ? "Supplement plan" : "Video plan")}
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const parsed =
            kind === "supplement_plan"
              ? featureSchemas.supplement_plan.safeParse({
                  title,
                  weeks,
                  context,
                  notes,
                  supplements,
                })
              : featureSchemas.video_plan.safeParse({ title, weeks, context, notes, videos });
          if (!parsed.success) {
            setError(t("Review the plan fields and add at least one complete item."));
            return;
          }
          try {
            await save.mutateAsync(undefined);
            onClose();
          } catch (cause) {
            setError(errorText(cause));
          }
        }}
      >
        <fieldset disabled={save.isPending} className="space-y-4">
          <p className="text-caption text-muted-foreground">
            {t(
              "Private by default. Assigning shares this plan only with the selected connected client.",
            )}
          </p>
          <label className="block text-label">
            {t("Title")}
            <Input
              className="mt-1 h-12"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-label">
              {t("Weeks")}
              <Input
                type="number"
                className="mt-1 h-12"
                min={1}
                max={104}
                required
                value={weeks}
                onChange={(e) => setWeeks(+e.target.value)}
              />
            </label>
            <label className="text-label">
              {t("Context")}
              <select
                className={control}
                value={context}
                onChange={(e) => setContext(e.target.value as typeof context)}
              >
                {Object.entries(contextLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {me?.role === "trainer" && (
            <label className="block text-label">
              {t("Assign to client")}
              <select
                className={control}
                value={client}
                onChange={(e) => setClient(e.target.value)}
              >
                <option value="">{t("Only me")}</option>
                {clients.data?.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.display_name ?? t("Client")}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-label">
            {t("Notes")}
            <Textarea
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={10000}
            />
          </label>
          {kind === "supplement_plan" ? (
            <>
              <p className="text-label text-muted-foreground">
                {t(
                  "Use doses from your own qualified guidance. Kinra does not recommend supplements or calculate doses.",
                )}
              </p>
              {supplements.map((item, i) => (
                <fieldset key={item.id} className="space-y-3 rounded-card border border-border p-3">
                  <legend className="px-1 font-semibold">
                    {t("Supplement {count}", { count: i + 1 })}
                  </legend>
                  <label className="block text-label">
                    {t("Name")}
                    <Input
                      required
                      className="mt-1 h-12"
                      value={item.name}
                      onChange={(e) => updateSupplement(i, { name: e.target.value })}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-label">
                      {t("Dose")}
                      <Input
                        required
                        type="number"
                        min={0.000001}
                        step="any"
                        className="mt-1 h-12"
                        value={item.dose || ""}
                        onChange={(e) => updateSupplement(i, { dose: +e.target.value })}
                      />
                    </label>
                    <label className="text-label">
                      {t("Unit")}
                      <select
                        className={control}
                        value={item.unit}
                        onChange={(e) =>
                          updateSupplement(i, { unit: e.target.value as typeof item.unit })
                        }
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {t(unit)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block text-label">
                    {t("Frequency")}
                    <select
                      className={control}
                      value={item.frequency}
                      onChange={(e) =>
                        updateSupplement(i, { frequency: e.target.value as typeof item.frequency })
                      }
                    >
                      {Object.entries(frequencyLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-label">
                    {t("Scheduled times · separate with commas")}
                    <Input
                      required
                      className="mt-1 h-12"
                      placeholder="08:00, 18:00"
                      value={item.times.join(",")}
                      onChange={(e) =>
                        updateSupplement(i, {
                          times: e.target.value.split(",").map((time) => time.trim()),
                        })
                      }
                    />
                  </label>
                  <label className="block text-label">
                    {t("Notes")}
                    <Textarea
                      className="mt-1"
                      value={item.notes ?? ""}
                      onChange={(e) => updateSupplement(i, { notes: e.target.value })}
                    />
                  </label>
                  <Button
                    type="button"
                    wrap
                    variant="ghost"
                    onClick={() =>
                      setSupplements((rows) => rows.filter((row) => row.id !== item.id))
                    }
                  >
                    {t("Remove")}
                  </Button>
                </fieldset>
              ))}
              <Button
                type="button"
                wrap
                variant="glass"
                disabled={supplements.length >= 20}
                onClick={() =>
                  setSupplements((rows) => [
                    ...rows,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      dose: 0,
                      unit: "mg",
                      times: [],
                      frequency: "daily",
                    },
                  ])
                }
              >
                {t("Add supplement")}
              </Button>
            </>
          ) : (
            <>
              {videos.map((item, i) => (
                <fieldset key={item.id} className="space-y-3 rounded-card border border-border p-3">
                  <legend className="px-1 font-semibold">
                    {t("Video {count}", { count: i + 1 })}
                  </legend>
                  <label className="block text-label">
                    {t("Title")}
                    <Input
                      required
                      className="mt-1 h-12"
                      value={item.title}
                      onChange={(e) => updateVideo(i, { title: e.target.value })}
                    />
                  </label>
                  <label className="block text-label">
                    {t("Video link · HTTPS")}
                    <Input
                      required
                      type="url"
                      pattern="https://.*"
                      className="mt-1 h-12"
                      value={item.url}
                      onChange={(e) => updateVideo(i, { url: e.target.value })}
                    />
                  </label>
                  <label className="block text-label">
                    {t("Duration · seconds")}
                    <Input
                      type="number"
                      min={1}
                      max={86400}
                      className="mt-1 h-12"
                      value={item.duration_seconds ?? ""}
                      onChange={(e) =>
                        setVideos((rows) =>
                          rows.map((row, index) => {
                            if (index !== i) return row;
                            const { duration_seconds: _duration, ...rest } = row;
                            return e.target.value === ""
                              ? rest
                              : { ...rest, duration_seconds: +e.target.value };
                          }),
                        )
                      }
                    />
                  </label>
                  <label className="block text-label">
                    {t("Notes")}
                    <Textarea
                      className="mt-1"
                      value={item.notes ?? ""}
                      onChange={(e) => updateVideo(i, { notes: e.target.value })}
                    />
                  </label>
                  <Button
                    type="button"
                    wrap
                    variant="ghost"
                    onClick={() => setVideos((rows) => rows.filter((row) => row.id !== item.id))}
                  >
                    {t("Remove")}
                  </Button>
                </fieldset>
              ))}
              <Button
                type="button"
                wrap
                variant="glass"
                disabled={videos.length >= 50}
                onClick={() =>
                  setVideos((rows) => [...rows, { id: crypto.randomUUID(), title: "", url: "" }])
                }
              >
                {t("Add video")}
              </Button>
            </>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-label text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" wrap className="min-h-12 w-full" disabled={save.isPending}>
          {t(save.isPending ? "Saving…" : "Save private plan")}
        </Button>
      </form>
    </Sheet>
  );
}

function ExtraPlanReview({
  record: initialRecord,
  onClose,
}: {
  record: Plan;
  onClose: () => void;
}) {
  useLanguage();
  const [record, setRecord] = useState(initialRecord);
  const [reloading, setReloading] = useState(false);
  const reviewPlans = useQ(
    ["features", record.kind],
    (api) => api.features.list(record.kind),
    false,
  );
  const display = displayPlan(record);
  const { ownerId } = useApi();
  const canUse = record.client_id ? record.client_id === ownerId : record.owner_id === ownerId;
  const [date, setDate] = useState(today());
  const [error, setError] = useState("");
  const [activated, setActivated] = useState(false);
  const events = useQ(
    ["features", "video_event"],
    (api) => api.features.list("video_event"),
    record.kind === "video_plan",
  );
  const activate = useAct((api) =>
    api.features.activateSupplementPlan(record.id, date, record.updated_at),
  );
  const mark = useAct((api, { id, status }: { id: string; status: "completed" | "skipped" }) =>
    api.features.save("video_event", { plan_id: record.id, video_id: id, date, status }),
  );
  const supplement =
    record.kind === "supplement_plan"
      ? (record.payload as FeaturePayloads["supplement_plan"])
      : null;
  const video =
    record.kind === "video_plan" ? (display.payload as FeaturePayloads["video_plan"]) : null;
  return (
    <Sheet
      open
      onOpenChange={(open) =>
        !open && !activate.isPending && !mark.isPending && !reloading && onClose()
      }
      title={display.payload.title}
    >
      <div className="space-y-4">
        <p className="text-label">{display.payload.notes}</p>
        {!canUse && (
          <p className="rounded-tile bg-surface-2 p-3 text-label">
            {t(
              "Only the assigned client can activate schedules or record completion for this plan.",
            )}
          </p>
        )}
        <label className="block text-label">
          {t(supplement ? "Start date" : "Activity date")}
          <Input
            type="date"
            className="mt-1 h-12"
            required
            disabled={!canUse || activate.isPending || mark.isPending}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setActivated(false);
            }}
          />
        </label>
        {supplement && (
          <>
            <p className="text-label text-muted-foreground">
              {t(
                "Review every dose and time. Activation creates schedules in Supplements; it does not record any dose as taken.",
              )}
              <span className="mt-2 block">
                {t(
                  "Activation copies this schedule. Later plan edits do not change activated schedules or past doses. The same start date reuses the original activation; choose a new date for another copy.",
                )}
              </span>
            </p>
            {supplement.supplements.map((item) => (
              <article key={item.id} className="rounded-tile border border-border p-3">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="num mt-2">
                  {number(item.dose)} {t(item.unit)} · {t(frequencyLabels[item.frequency])}
                </p>
                <p className="mt-2 text-label">{item.times.join(" · ")}</p>
                <p className="mt-2 text-label text-muted-foreground">{item.notes}</p>
              </article>
            ))}
            <Button
              wrap
              className="min-h-12 w-full"
              disabled={!canUse || !date || activate.isPending || reloading || activated}
              onClick={async () => {
                setError("");
                try {
                  await activate.mutateAsync(undefined);
                  setActivated(true);
                } catch (cause) {
                  setError(errorText(cause));
                }
              }}
            >
              {t(activated ? "Schedules activated" : "Activate reviewed schedules")}
            </Button>
            {activated && (
              <p role="status" className="text-label">
                {t("Open Supplements to record doses and manage your schedules.")}
              </p>
            )}
          </>
        )}
        {video && (
          <>
            <p className="text-label text-muted-foreground">
              {t(
                "Videos open on their original website. Completion is your own record; Kinra does not track playback.",
              )}
            </p>
            {events.error && <ErrorState onRetry={() => void events.refetch()} />}{" "}
            {video.videos.map((item) => {
              const event = events.data?.find(
                (row) =>
                  row.payload.plan_id === record.id &&
                  row.payload.video_id === item.id &&
                  row.payload.date === date,
              );
              return (
                <article key={item.id} className="space-y-3 rounded-tile border border-border p-3">
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.duration_seconds != null && (
                    <p className="text-caption">
                      {t("{count} seconds", { count: item.duration_seconds })}
                    </p>
                  )}
                  <p className="text-label text-muted-foreground">{item.notes}</p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center font-semibold text-primary underline"
                  >
                    {t("Open video")}
                  </a>
                  {event && (
                    <p role="status" className="text-label">
                      {t(event.payload.status === "completed" ? "Completed" : "Skipped")}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(["completed", "skipped"] as const).map((status) => (
                      <Button
                        key={status}
                        wrap
                        variant="glass"
                        disabled={
                          !canUse ||
                          !date ||
                          mark.isPending ||
                          events.isPending ||
                          !!events.error ||
                          event?.payload.status === status
                        }
                        onClick={async () => {
                          setError("");
                          try {
                            await mark.mutateAsync({ id: item.id, status });
                          } catch (cause) {
                            setError(errorText(cause));
                          }
                        }}
                      >
                        {t(status === "completed" ? "Mark complete" : "Mark skipped")}
                      </Button>
                    ))}
                  </div>
                </article>
              );
            })}
          </>
        )}
        {video && !!events.data?.filter((row) => row.payload.plan_id === record.id).length && (
          <details className="rounded-tile border border-border p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">
              {t("Activity history")}
            </summary>
            <ul className="mt-2 space-y-2">
              {events.data
                .filter((row) => row.payload.plan_id === record.id)
                .sort((a, b) => b.payload.date.localeCompare(a.payload.date))
                .map((row) => (
                  <li key={row.id} className="text-label">
                    <time dateTime={row.payload.date}>
                      {format(new Date(row.payload.date + "T12:00"), "d MMM yyyy")}
                    </time>{" "}
                    ·{" "}
                    {row.payload.title_snapshot ??
                      video.videos.find((item) => item.id === row.payload.video_id)?.title ??
                      t("Video")}{" "}
                    · {t(row.payload.status === "completed" ? "Completed" : "Skipped")}
                  </li>
                ))}
            </ul>
          </details>
        )}
        {error && supplement && (
          <Button
            wrap
            variant="glass"
            disabled={reloading || activate.isPending}
            onClick={async () => {
              setReloading(true);
              try {
                const result = await reviewPlans.refetch();
                if (result.error) throw result.error;
                const fresh = result.data?.find((row) => row.id === record.id);
                if (!fresh) throw new Error("This plan is no longer available.");
                setRecord(fresh);
                setActivated(false);
                setError("");
              } catch (cause) {
                setError(errorText(cause));
              } finally {
                setReloading(false);
              }
            }}
          >
            {t(reloading ? "Loading…" : "Reload and review plan")}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-label text-destructive">
            {error}
          </p>
        )}
      </div>
    </Sheet>
  );
}

function VideoStarterCards() {
  useLanguage();
  return (
    <details className="rounded-card border border-pulse/30 bg-pulse/5 p-4" open>
      <summary className="min-h-11 cursor-pointer py-2 font-semibold">
        {t("Video starting points")}
      </summary>
      <div className="mt-3 space-y-3">
        {videoStarters().map((starter) => (
          <VideoStarterCard key={starter.id} starter={starter} />
        ))}
      </div>
    </details>
  );
}
function VideoStarterCard({ starter }: { starter: ReturnType<typeof videoStarters>[number] }) {
  const [saveId] = useState(() => crypto.randomUUID());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const save = useAct((api) =>
    api.features.save("video_plan", starter.payload, { id: saveId, visibility: "private" }),
  );
  return (
    <article className="space-y-3 rounded-tile border border-border bg-surface p-3">
      <h3 className="font-semibold">{starter.title}</h3>
      <p className="text-label">{starter.summary}</p>
      <p className="text-caption text-muted-foreground">
        {t("Media language: {language}", { language: t(starter.mediaLanguage) })} ·{" "}
        {starter.sourceName}
      </p>
      <a
        href={starter.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center text-label text-primary underline"
      >
        {t("Review source videos")}
      </a>
      <Button
        wrap
        className="min-h-12 w-full"
        disabled={save.isPending || saved}
        onClick={async () => {
          setError("");
          try {
            await save.mutateAsync(undefined);
            setSaved(true);
          } catch (cause) {
            setError(errorText(cause));
          }
        }}
      >
        {t(saved ? "Private copy saved" : "Save private copy")}
      </Button>
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
    </article>
  );
}
