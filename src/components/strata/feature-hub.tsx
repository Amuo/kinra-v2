import { exerciseById, programReferences } from "@/lib/exercise-catalogue";
import { useFeaturePreferences, moduleVisible, bsFeatureNames } from "./feature-preferences";
import { useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Lock,
  Globe,
  Pencil,
  Trash2,
  Download,
  Check,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { useAct, useApi, useMe, useQ } from "@/lib/api";
import {
  featureSchemas,
  parseFeature,
  publicKinds,
  type FeatureKind,
  type FeatureRecord,
} from "@/lib/feature-types";
import { today } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, ErrorState, Panel, Skeleton } from "./ui";
import { Sheet } from "./sheets";
import { SchemaFields, fieldLabel, initialValue } from "./feature-fields";
import { featureSections, featureNames, featureHints } from "./feature-config";
import { ExerciseLibrary, ProgramReferences } from "./exercise-library";

export function FeatureHub() {
  const preferences = useFeaturePreferences();
  const bs = preferences?.language === "bs";
  const [selected, setSelected] = useState<FeatureKind | "exercises" | "references" | null>(null);
  const api = useApi();
  const [exporting, setExporting] = useState(false);
  if (selected)
    return (
      <div>
        <Button variant="ghost" className="mb-4 h-11" onClick={() => setSelected(null)}>
          <ArrowLeft />
          All tools
        </Button>
        {selected === "exercises" ? (
          <ExerciseLibrary />
        ) : selected === "references" ? (
          <ProgramReferences />
        ) : (
          <FeatureWorkspace key={selected} kind={selected} />
        )}
      </div>
    );
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-volt">{bs ? "Vaši Kinra alati" : "Your Kinra toolkit"}</p>
        <h2 className="mt-2 font-display text-title-l font-bold">
          {bs ? "Više načina da se osjećate dobro." : "More ways to feel good."}
        </h2>
        <p className="mt-3 text-body text-muted-foreground">
          Build a routine that fits your life. Start with what matters to you.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Panel onClick={() => setSelected("exercises")} className="border-volt/20 bg-volt/5">
          <p className="eyebrow text-volt">Explore</p>
          <h3 className="mt-3 text-title font-bold">Exercise library</h3>
          <p className="mt-2 text-caption text-muted-foreground">Movement references</p>
          <ChevronRight className="mt-4 size-5 text-volt" />
        </Panel>
        <Panel onClick={() => setSelected("references")}>
          <p className="eyebrow">Get inspired</p>
          <h3 className="mt-3 text-title font-bold">Program references</h3>
          <p className="mt-2 text-caption text-muted-foreground">Explore archived listings</p>
          <ChevronRight className="mt-4 size-5" />
        </Panel>
      </div>
      {featureSections.map((section) => (
        <section key={section.title}>
          <h3 className="text-title font-bold">{section.title}</h3>
          <p className="mb-3 mt-1 text-caption text-muted-foreground">{section.description}</p>
          <div className="overflow-hidden rounded-card border border-border">
            {section.kinds
              .filter((kind) => moduleVisible(kind, preferences?.modules))
              .map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setSelected(kind)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 text-left text-label last:border-0 hover:bg-surface-2"
                >
                  <span>
                    {bs ? (bsFeatureNames[kind] ?? featureNames[kind]) : featureNames[kind]}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
          </div>
        </section>
      ))}
      <Button
        variant="glass"
        className="h-12 w-full"
        disabled={exporting}
        onClick={async () => {
          setExporting(true);
          try {
            const data = await api.features.exportData();
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `kinra-export-${today()}.json`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            toast.success("Export prepared");
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setExporting(false);
          }
        }}
      >
        <Download />
        {exporting ? "Preparing export…" : "Export my data"}
      </Button>
    </div>
  );
}

export function FeatureWorkspace({
  kind,
  compact = false,
}: {
  kind: FeatureKind;
  compact?: boolean;
}) {
  const api = useApi();
  const rows = useQ(["features", kind], (a) => a.features.list(kind));
  const [editing, setEditing] = useState<FeatureRecord | "new" | null>(null);
  const [remove, setRemove] = useState<FeatureRecord | null>(null);
  const [query, setQuery] = useState("");
  const deletion = useAct((a, id: string) => a.features.remove(id));
  const records = (rows.data ?? []).filter((row) =>
    JSON.stringify(row.payload).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-volt">
            {publicKinds.includes(kind) ? "Discover & contribute" : "Your private workspace"}
          </p>
          {!compact && (
            <h2 className="mt-2 font-display text-title-l font-bold">
              {featureNames[kind] ?? fieldLabel(kind)}
            </h2>
          )}
        </div>
        {kind !== "saved" && (
          <Button variant="volt" className="h-11 shrink-0" onClick={() => setEditing("new")}>
            <Plus />
            Add
          </Button>
        )}
      </div>
      {featureHints[kind] && (
        <p className="text-label text-muted-foreground">{featureHints[kind]}</p>
      )}
      <Input
        aria-label={`Search ${featureNames[kind]}`}
        placeholder="Search records"
        className="h-12"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {rows.isLoading ? (
        <Skeleton className="h-36" />
      ) : rows.error ? (
        <ErrorState message={(rows.error as Error).message} onRetry={() => rows.refetch()} />
      ) : !records.length ? (
        <Empty
          icon={<Bookmark className="size-7" />}
          title={
            query
              ? "No matching records"
              : kind === "saved"
                ? "Your saved discoveries live here"
                : "Make room for your routine"
          }
          action={
            <Button
              variant="glass"
              onClick={() => (query ? setQuery("") : kind !== "saved" && setEditing("new"))}
            >
              {query
                ? "Clear search"
                : kind === "saved"
                  ? "Save items from the library or directory"
                  : "Add your first record"}
            </Button>
          }
        />
      ) : (
        records.map((record) => (
          <Panel key={record.id}>
            <div className="mb-3 flex items-center gap-2 text-caption text-muted-foreground">
              {record.visibility === "public" ? (
                <Globe className="size-3.5" />
              ) : (
                <Lock className="size-3.5" />
              )}
              {record.visibility === "public"
                ? "Public"
                : record.client_id
                  ? "Shared plan"
                  : "Private"}
              {record.owner_id !== api.ownerId && (
                <span>· {record.client_id ? "From your coach" : "Community contribution"}</span>
              )}
            </div>
            {kind === "saved" ? (
              <SavedDetails record={record} />
            ) : (
              <RecordDetails
                kind={record.kind}
                payload={record.payload as Record<string, unknown>}
              />
            )}
            <RecordActions record={record} />
            {record.owner_id === api.ownerId && (
              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                {kind !== "saved" && (
                  <Button variant="ghost" className="h-11" onClick={() => setEditing(record)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="ml-auto h-11 text-muted-foreground"
                  onClick={() => setRemove(record)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            )}
          </Panel>
        ))
      )}
      {editing && (
        <FeatureEditor
          kind={kind}
          record={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {remove && (
        <Sheet
          open
          onOpenChange={(o) => !o && !deletion.isPending && setRemove(null)}
          title="Delete this record?"
          sub="This removes the saved record. This action cannot be undone."
        >
          <div className="flex gap-3">
            <Button
              variant="glass"
              className="h-12 flex-1"
              disabled={deletion.isPending}
              onClick={() => setRemove(null)}
            >
              Keep record
            </Button>
            <Button
              variant="destructive"
              className="h-12 flex-1"
              disabled={deletion.isPending}
              onClick={() =>
                deletion.mutate(remove.id, {
                  onSuccess: () => {
                    setRemove(null);
                    toast.success("Record deleted");
                  },
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              Delete record
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function RecordDetails({
  payload,
  kind,
}: {
  payload: Record<string, unknown>;
  kind?: FeatureKind;
}) {
  if (kind === "goal")
    return (
      <div>
        <h3 className="text-title font-bold">{String(payload["title"])}</h3>
        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="num text-title-l font-bold">{String(payload["baseline"])}</span>
          <span className="text-muted-foreground">→</span>
          <span className="num text-title-l font-bold text-volt">{String(payload["target"])}</span>
          <span className="text-label text-muted-foreground">{String(payload["unit"])}</span>
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          Starting point → your target
          {payload["target_date"] ? ` · by ${String(payload["target_date"])}` : ""}
        </p>
        {payload["notes"] ? <p className="mt-3 text-label">{String(payload["notes"])}</p> : null}
      </div>
    );
  if (kind === "nutrition_plan") {
    const meals = payload["meals"] as {
      name: string;
      time?: string;
      foods: {
        name: string;
        quantity?: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }[];
    }[];
    return (
      <div>
        <h3 className="text-title font-bold">{String(payload["title"])}</h3>
        {payload["notes"] ? (
          <p className="mt-2 text-label text-muted-foreground">{String(payload["notes"])}</p>
        ) : null}
        <div className="mt-4 space-y-4">
          {meals.map((meal, index) => {
            const totals = meal.foods.reduce(
              (sum, food) => ({
                calories: sum.calories + food.calories,
                protein: sum.protein + food.protein,
                carbs: sum.carbs + food.carbs,
                fat: sum.fat + food.fat,
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 },
            );
            return (
              <section key={index} className="rounded-tile bg-background/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-label font-bold">{meal.name}</h4>
                  {meal.time && (
                    <span className="num text-caption text-muted-foreground">{meal.time}</span>
                  )}
                </div>
                <ul className="my-3 space-y-1">
                  {meal.foods.map((food, i) => (
                    <li key={i} className="flex justify-between gap-2 text-label">
                      <span>{food.name}</span>
                      {food.quantity && (
                        <span className="text-muted-foreground">{food.quantity}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-2 text-caption">
                  <span className="num font-semibold text-ember">{totals.calories} kcal</span>
                  <span>P {totals.protein}g</span>
                  <span>C {totals.carbs}g</span>
                  <span>F {totals.fat}g</span>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }
  if (kind === "supplement")
    return (
      <div>
        <h3 className="text-title font-bold">{String(payload["name"])}</h3>
        <p className="mt-3">
          <span className="num text-title-l font-bold text-volt">{String(payload["dose"])}</span>
          <span className="ml-2 text-body">{String(payload["unit"])}</span>
          <span className="ml-2 text-label text-muted-foreground">
            · {String(payload["frequency"]).replace(/_/g, " ")}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(payload["times"] as string[]).map((time) => (
            <span
              key={time}
              className="num rounded-full border border-border px-3 py-1.5 text-caption"
            >
              {time}
            </span>
          ))}
        </div>
        <p className="mt-3 text-caption text-muted-foreground">
          From {String(payload["start_date"])}
          {payload["end_date"] ? ` to ${String(payload["end_date"])}` : ""}
        </p>
        {payload["notes"] ? <p className="mt-2 text-label">{String(payload["notes"])}</p> : null}
      </div>
    );
  const title =
    payload["title"] ?? payload["name"] ?? payload["type"] ?? payload["date"] ?? "Saved record";
  return (
    <div className="space-y-2">
      <h3 className="break-words text-title font-bold">{String(title)}</h3>
      {Object.entries(payload)
        .filter(
          ([key, value]) =>
            !key.endsWith("_id") &&
            !key.endsWith("_snapshot") &&
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== title,
        )
        .map(([key, value]) => (
          <div key={key} className="min-w-0 text-label">
            <span className="text-muted-foreground">{fieldLabel(key)}: </span>
            <ReadableValue value={value} />
          </div>
        ))}
    </div>
  );
}
function ReadableValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") return <span>{value ? "On" : "Off"}</span>;
  if (Array.isArray(value))
    return value.length ? (
      <div className="mt-1 space-y-2">
        {value.map((v, i) => (
          <div key={i} className="rounded-lg bg-background/50 p-2">
            <ReadableValue value={v} />
          </div>
        ))}
      </div>
    ) : (
      <span>None selected</span>
    );
  if (value && typeof value === "object")
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <span className="text-muted-foreground">{fieldLabel(k)}: </span>
            <ReadableValue value={v} />
          </div>
        ))}
      </div>
    );
  return <span className="break-words whitespace-pre-wrap">{String(value ?? "—")}</span>;
}

const relations: Partial<Record<FeatureKind, Record<string, FeatureKind>>> = {
  review: { subject_id: "facility" },
  report: { subject_id: "post" },
  block: { user_id: "expert" },
  appointment: { coach_id: "expert" },
  membership_plan: { organization_id: "organization" },
  post: { group_id: "group" },
};
function FeatureEditor({
  kind,
  record,
  onClose,
}: {
  kind: FeatureKind;
  record?: FeatureRecord | undefined;
  onClose: () => void;
}) {
  const me = useMe().data;
  const defaults = initialValue(featureSchemas[kind]) as Record<string, unknown>;
  if ("date" in defaults) defaults["date"] = today();
  if ("start_date" in defaults) defaults["start_date"] = today();
  if ("updated_on" in defaults) defaults["updated_on"] = today();
  if ("timezone" in defaults)
    defaults["timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (kind === "preferences") {
    defaults["theme"] = "dark";
    defaults["modules"] = {};
  }
  if (kind === "appointment") defaults["status"] = "requested";
  const [draft, setDraft] = useState<Record<string, unknown>>(() =>
    record ? (record.payload as Record<string, unknown>) : defaults,
  );
  const [visibility, setVisibility] = useState<"private" | "public">(
    record?.visibility ?? "private",
  );
  const [clientId, setClientId] = useState(record?.client_id ?? "");
  const [error, setError] = useState("");
  const clients = useQ(
    ["clients"],
    (a) => a.clients(),
    me?.role === "trainer" && ["nutrition_plan", "supplement"].includes(kind),
  );
  const save = useAct((a) =>
    a.features.save(kind, parseFeature(kind, draft), {
      ...(record ? { id: record.id } : {}),
      visibility,
      clientId: clientId || null,
    }),
  );
  const relationFields = { ...relations[kind] };
  if (kind === "review" && draft["subject_type"] === "expert")
    relationFields["subject_id"] = "expert";
  const shape: Record<string, z.ZodTypeAny> = featureSchemas[kind].shape;
  const ordinary = z.object(
    Object.fromEntries(
      Object.entries(shape).filter(
        ([key]) => !(key in relationFields) && !(kind === "appointment" && key === "status"),
      ),
    ),
  );
  return (
    <Sheet
      open
      onOpenChange={(o) => !o && !save.isPending && onClose()}
      title={`${record ? "Edit" : "Add"} ${featureNames[kind]?.toLowerCase() ?? fieldLabel(kind)}`}
      sub={
        publicKinds.includes(kind)
          ? "Choose who can see this record before saving."
          : "Saved privately to your account."
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            parseFeature(kind, draft);
            save.mutate(undefined, {
              onSuccess: () => {
                toast.success("Record saved");
                onClose();
              },
              onError: (e) => setError(e.message),
            });
          } catch (e) {
            setError(
              e instanceof z.ZodError
                ? e.issues.map((i) => `${i.path.map(String).join(" → ")}: ${i.message}`).join(". ")
                : (e as Error).message,
            );
          }
        }}
      >
        <fieldset disabled={save.isPending} className="space-y-4">
          <SchemaFields
            schema={ordinary}
            value={draft}
            onChange={(v) => setDraft(v as Record<string, unknown>)}
          />
          {Object.entries(relationFields).map(([field, target]) => (
            <RelationField
              key={`${field}:${target}`}
              field={field}
              target={target}
              value={String(draft[field] ?? "")}
              optional={shape[field]?.isOptional() ?? false}
              onChange={(value) => setDraft({ ...draft, [field]: value || undefined })}
            />
          ))}
          {me?.role === "trainer" && ["nutrition_plan", "supplement"].includes(kind) && (
            <label className="block text-label">
              Assign to connected client
              <select
                className="mt-2 h-12 w-full rounded-tile border border-border bg-surface px-3"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Just me</option>
                {clients.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {publicKinds.includes(kind) && (
            <label className="block text-label font-semibold">
              Audience
              <select
                className="mt-2 h-12 w-full rounded-tile border border-border bg-surface px-3"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "private" | "public")}
              >
                <option value="private">Private · only me</option>
                <option value="public">Public · community</option>
              </select>
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-tile bg-destructive/10 p-3 text-label text-destructive"
            >
              {error}
            </p>
          )}
          <div className="sticky bottom-0 -mx-5 border-t border-border bg-popover px-5 py-4">
            <Button variant="volt" className="h-12 w-full" type="submit" disabled={save.isPending}>
              {save.isPending
                ? "Saving…"
                : visibility === "public"
                  ? "Save publicly"
                  : clientId
                    ? "Save shared plan"
                    : "Save privately"}
            </Button>
            <Button type="button" variant="ghost" className="mt-2 h-11 w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </fieldset>
      </form>
    </Sheet>
  );
}
function RelationField({
  field,
  target,
  value,
  optional,
  onChange,
}: {
  field: string;
  target: FeatureKind;
  value: string;
  optional?: boolean;
  onChange: (v: string) => void;
}) {
  const rows = useQ(["features", target], (a) => a.features.list(target), field !== "coach_id");
  const trainers = useQ(["trainers"], (a) => a.trainers(), field === "coach_id");
  return (
    <label className="block text-label font-semibold">
      {fieldLabel(field.replace(/_id$/, ""))}
      {optional ? " · optional" : ""}
      <select
        className="mt-2 h-12 w-full rounded-tile border border-border bg-surface px-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {rows.isLoading ? "Loading…" : `Choose ${featureNames[target]?.toLowerCase() ?? target}`}
        </option>
        {field === "coach_id" &&
          trainers.data?.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.display_name}
            </option>
          ))}
        {rows.data?.map((r) => {
          const p = r.payload as Record<string, unknown>;
          return (
            <option
              key={r.id}
              value={field === "coach_id" || field === "user_id" ? r.owner_id : r.id}
            >
              {String(p["name"] ?? p["title"] ?? p["body"] ?? "Record").slice(0, 100)}
            </option>
          );
        })}
      </select>
      {rows.error && (
        <span role="alert" className="mt-1 block text-caption text-destructive">
          Could not load choices.
        </span>
      )}
      {rows.data?.length === 0 && (
        <span className="mt-1 block text-caption text-muted-foreground">
          Add a {target.replace(/_/g, " ")} record first.
        </span>
      )}
    </label>
  );
}

function RecordActions({ record }: { record: FeatureRecord }) {
  const api = useApi();
  const [date, setDate] = useState(today());
  const action = useAct(async (a, task: string) => {
    const p = record.payload as Record<string, unknown>;

    if (task.startsWith("meal:"))
      return a.features.consumeMeal(record.id, Number(task.split(":")[1]), date);
    if (task.startsWith("dose:"))
      return a.features.save("dose", {
        supplement_id: record.id,
        date,
        time: task.slice(5),
        status: "taken",
        taken_at: new Date().toISOString(),
        name_snapshot: String(p["name"]),
        dose_snapshot: Number(p["dose"]),
        unit_snapshot: String(p["unit"]),
      });
    if (task === "medication")
      return a.features.save("medication_event", {
        medication_id: record.id,
        taken_at: new Date().toISOString(),
        status: "taken",
      });
    if (task === "habit")
      return a.features.save("habit_event", { habit_id: record.id, date, completed: true });
    if (task === "group")
      return a.features.save("group_member", { group_id: record.id }, { visibility: "public" });
    if (task === "organization")
      return a.features.save(
        "organization_member",
        { organization_id: record.id },
        { visibility: "public" },
      );
    if (task === "like")
      return a.features.save(
        "reaction",
        { subject_id: record.id, type: "like" },
        { visibility: "public" },
      );
    if (task === "save")
      return a.features.save("saved", {
        target_type: record.kind as "expert" | "facility" | "article",
        target_id: record.id,
      });
    if (task === "confirm" || task === "cancel")
      return a.features.respondAppointment(
        record.id,
        task === "confirm" ? "confirmed" : "cancelled",
      );
  });
  const perform = (task: string) =>
    action.mutate(task, {
      onSuccess: () => toast.success("Saved"),
      onError: (e) => toast.error(e.message),
    });
  const tracked = ["nutrition_plan", "supplement", "habit"].includes(record.kind);
  const eventKind =
    record.kind === "nutrition_plan"
      ? "meal_event"
      : record.kind === "supplement"
        ? "dose"
        : record.kind === "habit"
          ? "habit_event"
          : record.kind === "medication"
            ? "medication_event"
            : null;
  const events = useQ(
    ["features", "events", eventKind],
    (a) => a.features.list(eventKind!),
    !!eventKind,
  );
  const matching = (events.data ?? []).filter((r) => Object.values(r.payload).includes(record.id));
  const p = record.payload as Record<string, unknown>;
  const eventDone = (index?: number) =>
    matching.some((r) => {
      const e = r.payload as Record<string, unknown>;
      return e["date"] === date && (index === undefined || e["meal_index"] === index);
    });
  const buttons: [string, string][] = [];
  if (record.kind === "supplement")
    for (const time of p["times"] as string[])
      buttons.push([`dose:${time}`, `Record ${time} dose taken`]);
  if (record.kind === "medication") buttons.push(["medication", "Record taken now"]);
  if (record.kind === "habit")
    buttons.push(["habit", eventDone() ? "Completed for this date" : "Mark complete"]);
  if (record.visibility === "public" && ["group", "organization"].includes(record.kind))
    buttons.push([record.kind, "Join publicly"]);
  if (record.visibility === "public" && record.kind === "post")
    buttons.push(["like", "Like publicly"]);
  if (["expert", "facility", "article"].includes(record.kind))
    buttons.push(["save", "Save for later"]);
  if (record.kind === "appointment" && p["status"] === "requested" && p["coach_id"] === api.ownerId)
    buttons.push(["confirm", "Confirm request"]);
  if (record.kind === "appointment" && p["status"] !== "cancelled")
    buttons.push(["cancel", "Cancel appointment"]);
  if (!buttons.length && record.kind !== "nutrition_plan") return null;
  return (
    <div className="mt-4 space-y-3">
      {tracked && (
        <label className="block text-caption text-muted-foreground">
          Log date
          <Input
            type="date"
            className="mt-1 h-11"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      )}
      {record.kind === "nutrition_plan" &&
        (p["meals"] as { name: string }[]).map((meal, i) => (
          <Button
            key={i}
            variant="glass"
            className="h-auto min-h-11 w-full whitespace-normal"
            disabled={action.isPending || eventDone(i)}
            onClick={() => perform(`meal:${i}`)}
          >
            <Check className="size-4 shrink-0" />
            {eventDone(i) ? `Logged · ${meal.name}` : `Log consumed · ${meal.name}`}
          </Button>
        ))}
      {buttons.map(([task, label]) => (
        <Button
          key={task}
          variant="glass"
          className="h-11 w-full"
          disabled={
            action.isPending ||
            (task === "habit" && eventDone()) ||
            (task.startsWith("dose:") &&
              matching.some((r) => {
                const event = r.payload as Record<string, unknown>;
                return event["date"] === date && event["time"] === task.slice(5);
              }))
          }
          onClick={() => perform(task)}
        >
          {label}
        </Button>
      ))}
      {eventKind && (
        <details className="text-label">
          <summary className="cursor-pointer py-2 text-muted-foreground">
            Recorded history ({matching.length})
          </summary>
          {events.isLoading ? (
            <p>Loading history…</p>
          ) : events.error ? (
            <p role="alert">Could not load history.</p>
          ) : (
            matching.map((r) => (
              <div key={r.id} className="my-2 rounded-tile bg-background p-3">
                <RecordDetails payload={r.payload as Record<string, unknown>} />
                {eventKind !== "meal_event" ? (
                  <EventDelete id={r.id} />
                ) : (
                  <p className="mt-2 text-caption text-muted-foreground">
                    Manage consumed food entries in the Fuel diary.
                  </p>
                )}
              </div>
            ))
          )}
        </details>
      )}
    </div>
  );
}
function EventDelete({ id }: { id: string }) {
  const remove = useAct((a) => a.features.remove(id));
  return (
    <Button
      variant="ghost"
      className="mt-2 h-11"
      disabled={remove.isPending}
      onClick={() =>
        remove.mutate(undefined, {
          onSuccess: () => toast.success("Entry removed"),
          onError: (e) => toast.error(e.message),
        })
      }
    >
      Remove entry
    </Button>
  );
}

function SavedDetails({ record }: { record: FeatureRecord }) {
  const payload = record.payload as { target_type: string; target_id: string };
  const kind = ["expert", "facility", "article"].includes(payload.target_type)
    ? (payload.target_type as "expert" | "facility" | "article")
    : null;
  const directory = useQ(["features", kind], (api) => api.features.list(kind!), !!kind);
  const source = directory.data?.find((r) => r.id === payload.target_id)?.payload as
    Record<string, unknown> | undefined;
  const catalogue =
    payload.target_type === "exercise"
      ? exerciseById(payload.target_id)
      : programReferences.find((p) => p.id === payload.target_id);
  const name = catalogue?.name ?? source?.["name"] ?? source?.["title"];
  return (
    <div>
      <p className="eyebrow text-volt">{fieldLabel(payload.target_type)}</p>
      <h3 className="mt-2 text-title font-bold">
        {String(
          name ?? (directory.isLoading ? "Loading saved item…" : "Saved item no longer available"),
        )}
      </h3>
      {catalogue && (
        <a
          href={catalogue.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block min-h-11 text-label text-volt underline"
        >
          Open source reference
        </a>
      )}
      {source && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer text-label">View details</summary>
          <RecordDetails payload={source} />
        </details>
      )}
    </div>
  );
}
