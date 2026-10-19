import { from, bucket, featureRpc } from "./backend";
import { supabase } from "@/integrations/supabase/client";
import { allPages } from "./log-validation";
import {
  featureKinds,
  parseFeature,
  publicKinds,
  prescriptionKinds,
  type FeatureKind,
  type FeaturePayloads,
  type FeatureRecord,
  type FeatureSaveOptions,
} from "./feature-types";
import type { Json } from "@/integrations/supabase/types";

export interface FeatureApi {
  eraseData(confirmation: string): Promise<void>;
  list<K extends FeatureKind>(kind: K): Promise<FeatureRecord<K>[]>;
  save<K extends FeatureKind>(
    kind: K,
    payload: FeaturePayloads[K],
    options?: FeatureSaveOptions,
  ): Promise<string>;
  remove(id: string): Promise<void>;
  consumeMeal(planId: string, mealIndex: number, date: string): Promise<void>;
  respondAppointment(id: string, status: "confirmed" | "cancelled"): Promise<void>;
  exportData(): Promise<object>;
}
const must = <T>(r: { data: T | null; error: { message: string; code?: string } | null }): T => {
  if (r.error)
    throw new Error(
      ["42P01", "PGRST205", "PGRST202"].includes(r.error.code ?? "")
        ? "This feature needs the Kinra feature migration. Your input has been preserved; please try again after setup."
        : r.error.message,
    );
  return r.data as T;
};
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;
const checkOptions = (kind: FeatureKind, options: FeatureSaveOptions) => {
  if (options.visibility === "public" && !publicKinds.includes(kind))
    throw new Error("This record is private.");
  if (options.clientId && !prescriptionKinds.includes(kind))
    throw new Error("Only nutrition and supplement plans can be assigned to a client.");
};
const singleton = new Set<FeatureKind>(["preferences", "notification_preferences"]);
function eventKey(kind: FeatureKind, p: Record<string, unknown>): string | null {
  if (singleton.has(kind)) return kind;
  const fields: Partial<Record<FeatureKind, string[]>> = {
    meal_event: ["plan_id", "meal_index", "date"],
    dose: ["supplement_id", "date", "time"],
    habit_event: ["habit_id", "date"],
    steps: ["date"],
    saved: ["target_type", "target_id"],
    group_member: ["group_id"],
    organization_member: ["organization_id"],
    reaction: ["subject_id", "type"],
    block: ["user_id"],
    review: ["subject_type", "subject_id"],
  };
  return fields[kind] ? [kind, ...fields[kind]!.map((k) => p[k])].join("|") : null;
}
async function stableId(owner: string, key: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${owner}|${key}`)),
  ).slice(0, 16);
  bytes[6] = (bytes[6]! & 15) | 80;
  bytes[8] = (bytes[8]! & 63) | 128;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function createLiveFeatures(ownerId: string): FeatureApi {
  const auth = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== ownerId)
      throw new Error("Your account changed. Reopen this screen before saving.");
  };
  return {
    async eraseData(confirmation) {
      await auth();
      if (confirmation !== "DELETE KINRA DATA")
        throw new Error("Type DELETE KINRA DATA to confirm.");
      // Storage removal happens through the Storage API, never by deleting
      // metadata rows and leaving inaccessible binaries in the backing store.
      const photos = await allPages(async (offset, size) =>
        must(
          await from("progress_photos")
            .select("storage_path")
            .eq("user_id", ownerId)
            .order("id")
            .range(offset, offset + size - 1),
        ),
      );
      const profile = must(
        await from("profiles").select("avatar_path").eq("id", ownerId).maybeSingle(),
      ) as { avatar_path: string | null } | null;
      const paths = photos.map((p) => p.storage_path);
      for (let offset = 0; offset < paths.length; offset += 100) {
        const result = await bucket("progress-photos").remove(paths.slice(offset, offset + 100));
        if (result.error)
          throw new Error("Photo cleanup failed. Your profile is still here; retry deletion.");
      }
      if (profile?.avatar_path) {
        const result = await bucket("profile-avatars").remove([profile.avatar_path]);
        if (result.error) throw new Error("Avatar cleanup failed. Retry deletion.");
      }
      must(await featureRpc("kinra_erase_data", { confirmation, expected_owner: ownerId }));
      const current = await supabase.auth.getUser();
      if (current.data.user?.id === ownerId) await supabase.auth.signOut({ scope: "local" });
    },
    async list(kind) {
      await auth();
      if (kind === "message") {
        const rows = await allPages(async (offset, size) =>
          must(
            await from("trainer_notes")
              .select("*")
              .eq("shared", true)
              .or(`trainer_id.eq.${ownerId},client_id.eq.${ownerId}`)
              .order("created_at", { ascending: false })
              .order("id")
              .range(offset, offset + size - 1),
          ),
        );
        return rows.map((r) => {
          const sender = (r as typeof r & { sender_id?: string | null }).sender_id ?? r.trainer_id;
          return {
            id: r.id,
            owner_id: sender,
            kind: "message",
            payload: {
              recipient_id: sender === r.trainer_id ? r.client_id : r.trainer_id,
              body: r.body,
            },
            visibility: "private",
            client_id: null,
            created_at: r.created_at,
            updated_at: r.created_at,
          };
        }) as FeatureRecord<typeof kind>[];
      }
      return allPages(async (offset, size) =>
        must(
          await from("feature_records")
            .select("*")
            .eq("kind", kind)
            .order("created_at", { ascending: false })
            .order("id")
            .range(offset, offset + size - 1),
        ),
      ) as unknown as Promise<FeatureRecord<typeof kind>[]>;
    },
    async save(kind, input, options = {}) {
      await auth();
      checkOptions(kind, options);
      const payload = parseFeature(kind, input);
      if (kind === "message") {
        if (options.id) throw new Error("Sent messages cannot be edited.");
        const message = payload as FeaturePayloads["message"];
        return must(
          await featureRpc("kinra_send_message", { ...message, expected_owner: ownerId }),
        ) as unknown as string;
      }
      const key = eventKey(kind, payload as Record<string, unknown>);
      const id = options.id ?? (key ? await stableId(ownerId, key) : crypto.randomUUID());
      const rows = must(
        await from("feature_records")
          .upsert(
            {
              id,
              owner_id: ownerId,
              kind,
              payload: json(payload),
              visibility: options.visibility ?? "private",
              client_id: options.clientId ?? null,
            },
            { onConflict: "id" },
          )
          .select("id"),
      );
      if (!rows?.length)
        throw new Error("This record could not be saved. Keep your draft and retry.");
      return id;
    },
    async remove(id) {
      await auth();
      const rows = must(
        await from("feature_records").delete().eq("id", id).eq("owner_id", ownerId).select("id"),
      );
      if (!rows?.length) throw new Error("This record no longer exists or cannot be removed.");
    },
    async consumeMeal(planId, mealIndex, date) {
      await auth();
      parseFeature("meal_event", {
        plan_id: planId,
        meal_index: mealIndex,
        date,
        status: "consumed",
      });
      must(
        await featureRpc("kinra_consume_meal", {
          plan_id: planId,
          meal_index: mealIndex,
          log_date: date,
        }),
      );
    },
    async respondAppointment(id, status) {
      await auth();
      if (!["confirmed", "cancelled"].includes(status))
        throw new Error("Choose confirm or cancel.");
      must(await featureRpc("kinra_respond_appointment", { record_id: id, new_status: status }));
    },
    async exportData() {
      await auth();
      const records = await allPages(async (offset, size) =>
        must(
          await from("feature_records")
            .select("*")
            .or(`owner_id.eq.${ownerId},client_id.eq.${ownerId}`)
            .order("id")
            .range(offset, offset + size - 1),
        ),
      );
      const logs: Record<string, unknown> = {};
      for (const table of [
        "workouts",
        "sleep_logs",
        "nutrition_logs",
        "journal_entries",
        "body_metrics",
        "progress_photos",
      ] as const)
        logs[table] = await allPages(async (offset, size) =>
          must(
            await from(table)
              .select("*")
              .eq("user_id", ownerId)
              .order("id")
              .range(offset, offset + size - 1),
          ),
        );
      logs["profile"] = must(await from("profiles").select("*").eq("id", ownerId).maybeSingle());
      logs["programs"] = must(await from("programs").select("*").eq("trainer_id", ownerId));
      for (const table of [
        "trainer_clients",
        "program_assignments",
        "trainer_notes",
        "progress_reports",
      ] as const) {
        logs[table] = await allPages(async (offset, size) =>
          must(
            await from(table)
              .select("*")
              .or(`trainer_id.eq.${ownerId},client_id.eq.${ownerId}`)
              .order("id")
              .range(offset, offset + size - 1),
          ),
        );
      }
      logs["role"] = must(
        await from("user_roles").select("role").eq("user_id", ownerId).maybeSingle(),
      );
      return {
        version: 1,
        exported_at: new Date().toISOString(),
        owner_id: ownerId,
        features: records,
        ...logs,
      };
    },
  };
}

const demoRecords: FeatureRecord[] = [];
// Demo storage is process-local and keyed by owner. It never writes live data.
export function createDemoFeatures(
  ownerId: string,
  addFood: (
    foods: FeaturePayloads["nutrition_plan"]["meals"][number]["foods"],
    meal: string,
    date: string,
  ) => void,
  isConnected: (coachId: string, clientId: string) => boolean,
  onErase: () => void = () => {},
): FeatureApi {
  const blocked = (other: string) =>
    demoRecords.some(
      (r) =>
        r.kind === "block" &&
        ((r.owner_id === ownerId && (r.payload as FeaturePayloads["block"]).user_id === other) ||
          (r.owner_id === other && (r.payload as FeaturePayloads["block"]).user_id === ownerId)),
    );
  const visible = (r: FeatureRecord) => {
    if (r.owner_id === ownerId) return true;
    if (
      r.kind === "message" &&
      (r.payload as FeaturePayloads["message"]).recipient_id === ownerId &&
      (isConnected(r.owner_id, ownerId) || isConnected(ownerId, r.owner_id))
    )
      return true;
    if (
      r.kind === "appointment" &&
      (r.payload as FeaturePayloads["appointment"]).coach_id === ownerId
    )
      return true;
    if (r.client_id === ownerId && isConnected(r.owner_id, ownerId)) return true;
    if (r.visibility !== "public" || r.client_id || blocked(r.owner_id)) return false;
    if (r.kind === "post" && (r.payload as FeaturePayloads["post"]).group_id) {
      const group = demoRecords.find(
        (g) => g.id === (r.payload as FeaturePayloads["post"]).group_id && g.kind === "group",
      );
      return (
        !!group &&
        !blocked(group.owner_id) &&
        (group.visibility === "public" ||
          group.owner_id === ownerId ||
          demoRecords.some(
            (m) =>
              m.kind === "group_member" &&
              m.owner_id === ownerId &&
              (m.payload as FeaturePayloads["group_member"]).group_id === group.id,
          ))
      );
    }
    return true;
  };
  return {
    async eraseData(confirmation) {
      if (confirmation !== "DELETE KINRA DATA")
        throw new Error("Type DELETE KINRA DATA to confirm.");
      for (let i = demoRecords.length - 1; i >= 0; i--) {
        const row = demoRecords[i]!;
        if (
          row.owner_id === ownerId ||
          row.client_id === ownerId ||
          (row.kind === "message" &&
            (row.payload as FeaturePayloads["message"]).recipient_id === ownerId)
        )
          demoRecords.splice(i, 1);
      }
      onErase();
    },
    async list(kind) {
      return structuredClone(
        demoRecords.filter((r) => r.kind === kind && visible(r)),
      ) as FeatureRecord<typeof kind>[];
    },
    async save(kind, input, options = {}) {
      checkOptions(kind, options);
      let payload = parseFeature(kind, input);
      if (options.clientId && !isConnected(ownerId, options.clientId))
        throw new Error("Connect with this client first.");
      const key = eventKey(kind, payload as Record<string, unknown>);
      const id = options.id ?? (key ? await stableId(ownerId, key) : crypto.randomUUID());
      const current = demoRecords.find((r) => r.id === id);
      if (current && (current.owner_id !== ownerId || current.kind !== kind))
        throw new Error("You cannot change this record.");
      if (
        key &&
        demoRecords.some(
          (r) =>
            r.id !== id &&
            r.owner_id === ownerId &&
            r.kind === kind &&
            eventKey(kind, r.payload as Record<string, unknown>) === key,
        )
      )
        throw new Error("This event is already recorded.");
      const p = payload as Record<string, unknown>;
      if (kind === "message") {
        const recipient = String(p["recipient_id"]);
        if (current) throw new Error("Sent messages cannot be edited.");
        if (
          recipient === ownerId ||
          (!isConnected(ownerId, recipient) && !isConnected(recipient, ownerId))
        )
          throw new Error("Choose a connected coach or client.");
      }
      const relation: Partial<Record<FeatureKind, [string, FeatureKind]>> = {
        dose: ["supplement_id", "supplement"],
        medication_event: ["medication_id", "medication"],
        habit_event: ["habit_id", "habit"],
        meal_event: ["plan_id", "nutrition_plan"],
      };
      const link = relation[kind];
      if (link) {
        if (current && eventKey(kind, current.payload as Record<string, unknown>) !== key)
          throw new Error("Event identity is immutable.");
        const parent = demoRecords.find((r) => r.id === p[link[0]] && r.kind === link[1]);
        if (
          !current &&
          (!parent ||
            !(
              (parent.owner_id === ownerId && !parent.client_id) ||
              (parent.client_id === ownerId && isConnected(parent.owner_id, ownerId))
            ))
        )
          throw new Error("Referenced plan unavailable.");
        if (kind === "dose") {
          const schedule = parent?.payload as FeaturePayloads["supplement"] | undefined;
          const dose = payload as FeaturePayloads["dose"];
          if (
            !current &&
            (!schedule?.times.includes(dose.time) ||
              dose.date < schedule.start_date ||
              (schedule.end_date && dose.date > schedule.end_date))
          )
            throw new Error("Dose is outside the schedule.");
          const prior = current?.payload as FeaturePayloads["dose"] | undefined;
          payload = {
            ...payload,
            name_snapshot: prior?.name_snapshot ?? schedule?.name,
            dose_snapshot: prior?.dose_snapshot ?? schedule?.dose,
            unit_snapshot: prior?.unit_snapshot ?? schedule?.unit,
          };
        }
      }
      if (["review", "reaction", "report"].includes(kind)) {
        const target = demoRecords.find((r) => r.id === p["subject_id"] && visible(r));
        if (
          !target ||
          (kind === "review" &&
            (target.kind !== p["subject_type"] ||
              target.owner_id === ownerId ||
              target.visibility !== "public")) ||
          (kind === "reaction" && !["post", "article"].includes(target.kind))
        )
          throw new Error("Content is not available for this action.");
      }
      if (kind === "group_member" || (kind === "post" && p["group_id"])) {
        const group = demoRecords.find((r) => r.id === p["group_id"] && r.kind === "group");
        if (
          !group ||
          blocked(group.owner_id) ||
          (kind === "group_member" &&
            group.visibility !== "public" &&
            group.owner_id !== ownerId) ||
          (kind === "post" &&
            group.owner_id !== ownerId &&
            !demoRecords.some(
              (r) =>
                r.kind === "group_member" &&
                r.owner_id === ownerId &&
                (r.payload as FeaturePayloads["group_member"]).group_id === group.id,
            )) ||
          (group.visibility === "private" && options.visibility === "public")
        )
          throw new Error("Group membership or audience does not permit this action.");
      }
      if (kind === "organization_member" || kind === "membership_plan") {
        const organization = demoRecords.find(
          (r) => r.id === p["organization_id"] && r.kind === "organization" && visible(r),
        );
        if (
          !organization ||
          (kind === "membership_plan" && organization.owner_id !== ownerId) ||
          (kind === "organization_member" &&
            organization.visibility !== "public" &&
            organization.owner_id !== ownerId)
        )
          throw new Error("Organization access required.");
      }
      if (kind === "meal_event" && (payload as FeaturePayloads["meal_event"]).status === "consumed")
        throw new Error("Use the meal completion action.");
      if (
        kind === "appointment" &&
        (payload as FeaturePayloads["appointment"]).status !== "requested"
      )
        throw new Error("Use appointment confirm or cancel.");
      const row = {
        id,
        kind,
        payload,
        owner_id: ownerId,
        visibility: options.visibility ?? "private",
        client_id: options.clientId ?? null,
        created_at: current?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as FeatureRecord;
      const at = demoRecords.findIndex((r) => r.id === id);
      if (at >= 0) demoRecords[at] = row;
      else demoRecords.unshift(row);
      return id;
    },
    async remove(id) {
      const i = demoRecords.findIndex((r) => r.id === id && r.owner_id === ownerId);
      if (i < 0) throw new Error("This record cannot be removed.");
      if (
        demoRecords[i]?.kind === "meal_event" &&
        (demoRecords[i]!.payload as FeaturePayloads["meal_event"]).status === "consumed"
      )
        throw new Error("Edit consumed food in the diary.");
      demoRecords.splice(i, 1);
    },
    async consumeMeal(planId, mealIndex, date) {
      parseFeature("meal_event", {
        plan_id: planId,
        meal_index: mealIndex,
        date,
        status: "consumed",
      });
      const plan = demoRecords.find(
        (r) => r.id === planId && r.kind === "nutrition_plan" && visible(r),
      );
      if (!plan || (plan.client_id && plan.client_id !== ownerId))
        throw new Error("Meal plan unavailable.");
      const meal = (plan.payload as FeaturePayloads["nutrition_plan"]).meals[mealIndex];
      if (!meal) throw new Error("Meal not found.");
      const id = await stableId(ownerId, `meal_event|${planId}|${mealIndex}|${date}`);
      const previous = demoRecords.find((r) => r.id === id);
      if ((previous?.payload as FeaturePayloads["meal_event"] | undefined)?.status === "consumed")
        return;
      addFood(structuredClone(meal.foods), meal.name, date);
      if (previous) demoRecords.splice(demoRecords.indexOf(previous), 1);
      demoRecords.push({
        id,
        owner_id: ownerId,
        kind: "meal_event",
        payload: {
          plan_id: planId,
          meal_index: mealIndex,
          date,
          status: "consumed",
          plan_snapshot: { name: meal.name, foods: structuredClone(meal.foods) },
        },
        visibility: "private",
        client_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    async respondAppointment(id, status) {
      const r = demoRecords.find((r) => r.id === id && r.kind === "appointment");
      const p = r?.payload as FeaturePayloads["appointment"] | undefined;
      if (
        !r ||
        !p ||
        (p.coach_id !== ownerId && !(r.owner_id === ownerId && status === "cancelled"))
      )
        throw new Error("You cannot change this appointment.");
      if (
        status === "confirmed" &&
        demoRecords.some(
          (other) =>
            other.id !== id &&
            other.kind === "appointment" &&
            (other.payload as FeaturePayloads["appointment"]).status === "confirmed" &&
            (other.payload as FeaturePayloads["appointment"]).coach_id === p.coach_id &&
            Date.parse((other.payload as FeaturePayloads["appointment"]).starts_at) <
              Date.parse(p.ends_at) &&
            Date.parse((other.payload as FeaturePayloads["appointment"]).ends_at) >
              Date.parse(p.starts_at),
        )
      )
        throw new Error("This time is already booked.");
      p.status = status;
      r.updated_at = new Date().toISOString();
    },
    async exportData() {
      return {
        version: 1,
        demo: true,
        owner_id: ownerId,
        features: structuredClone(demoRecords.filter((r) => r.owner_id === ownerId)),
        kinds: featureKinds,
      };
    },
  };
}
