import { z } from "zod";

const text = z.string().trim().min(1).max(200);
const note = z.string().max(10000);
const date = z.string().date();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const id = z.string().uuid();
const positive = z.number().finite().gt(0).max(1000000);
const amount = z.number().finite().min(0).max(1000000);
const timestamp = z.string().datetime({ offset: true });
const tags = z.array(text).max(50);
const timezone = z
  .string()
  .min(1)
  .max(100)
  .refine((v) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone.");
const food = z
  .object({
    name: text,
    quantity: text.optional(),
    calories: amount.int(),
    protein: amount,
    carbs: amount,
    fat: amount,
  })
  .strict();
const days = z.array(z.number().int().min(0).max(6)).max(7);

// This is also the source for database JSON validation. Unknown properties are
// rejected rather than silently storing private fields on a public resource.
export const featureSchemas = {
  message: z
    .object({ recipient_id: z.string().min(1).max(100), body: z.string().trim().min(1).max(10000) })
    .strict(),
  preferences: z
    .object({
      language: z.enum(["en", "bs"]),
      theme: z.enum(["light", "dark", "system"]),
      modules: z.record(z.boolean()),
      timezone,
      units: z.enum(["metric", "imperial"]).optional(),
    })
    .strict(),
  nutrition_plan: z
    .object({
      title: text,
      meals: z
        .array(
          z
            .object({ name: text, time: time.optional(), foods: z.array(food).min(1).max(50) })
            .strict(),
        )
        .min(1)
        .max(20),
      notes: note.optional(),
      calories_target: amount.optional(),
      protein_target: amount.optional(),
    })
    .strict(),
  meal_event: z
    .object({
      plan_id: id,
      meal_index: z.number().int().min(0).max(19),
      date,
      status: z.enum(["consumed", "skipped"]),
      plan_snapshot: z
        .object({ name: text, foods: z.array(food).min(1).max(50) })
        .strict()
        .optional(),
    })
    .strict(),
  supplement: z
    .object({
      name: text,
      dose: positive,
      unit: z.enum(["mg", "g", "ml", "IU", "caps", "tabs", "scoops"]),
      times: z.array(time).min(1).max(24),
      frequency: z.enum(["daily", "training", "rest", "as_needed"]),
      start_date: date,
      end_date: date.optional(),
      notes: note.optional(),
      protocol: text.optional(),
    })
    .strict(),
  dose: z
    .object({
      supplement_id: id,
      date,
      time,
      status: z.enum(["taken", "skipped", "snoozed"]),
      taken_at: timestamp.optional(),
      snoozed_until: timestamp.optional(),
      name_snapshot: text.optional(),
      dose_snapshot: positive.optional(),
      unit_snapshot: text.optional(),
    })
    .strict(),
  measurement: z
    .object({
      type: z.enum([
        "weight",
        "body_fat",
        "waist",
        "hips",
        "chest",
        "arm_flexed",
        "arm_relaxed",
        "glute",
        "thigh",
        "forearm",
        "calf",
        "shoulder",
        "neck",
      ]),
      value: positive,
      unit: z.enum(["kg", "lb", "cm", "in", "%"]),
      date,
      notes: note.optional(),
    })
    .strict(),
  goal: z
    .object({
      title: text,
      metric: z.enum(["weight", "sessions", "steps", "sleep", "water", "custom"]),
      baseline: amount,
      target: amount,
      unit: text,
      target_date: date.optional(),
      notes: note.optional(),
    })
    .strict(),
  medication: z
    .object({
      name: text,
      route: text,
      dose: positive,
      unit: text,
      frequency: text,
      start_date: date,
      end_date: date.optional(),
      notes: note.optional(),
    })
    .strict(),
  medication_event: z
    .object({
      medication_id: id,
      taken_at: timestamp,
      status: z.enum(["taken", "skipped"]),
      location: text.optional(),
      notes: note.optional(),
    })
    .strict(),
  cycle: z
    .object({
      date,
      flow: z.enum(["none", "spotting", "light", "medium", "heavy"]),
      symptoms: tags,
      notes: note.optional(),
    })
    .strict(),
  habit: z.object({ title: text, weekdays: days, notes: note.optional() }).strict(),
  habit_event: z.object({ habit_id: id, date, completed: z.boolean() }).strict(),
  steps: z.object({ date, count: z.number().int().min(0).max(200000) }).strict(),
  check_in: z
    .object({
      date,
      context: z.enum(["morning", "pre_workout", "post_workout", "evening", "other"]),
      mood: z.number().int().min(1).max(5),
      energy: z.number().int().min(1).max(5),
      notes: note.optional(),
    })
    .strict(),
  expert: z
    .object({
      name: text,
      headline: text,
      city: text,
      biography: note.optional(),
      languages: tags,
      specialties: tags,
      website: z.string().url().max(2000).optional(),
      credential_claims: tags.optional(),
    })
    .strict(),
  facility: z
    .object({
      name: text,
      type: text,
      city: text,
      address: text.optional(),
      description: note.optional(),
      equipment: tags,
      amenities: tags,
      website: z.string().url().max(2000).optional(),
      opening_hours: note.optional(),
      price_tier: z.number().int().min(1).max(4).optional(),
    })
    .strict(),
  review: z
    .object({
      subject_id: id,
      subject_type: z.enum(["facility", "expert"]),
      rating: z.number().int().min(1).max(5),
      body: note.optional(),
    })
    .strict(),
  saved: z
    .object({
      target_type: z.enum(["exercise", "program", "expert", "facility", "article"]),
      target_id: text,
    })
    .strict(),
  group: z
    .object({
      title: text,
      description: note,
      type: z.enum(["interest", "gym", "club", "challenge", "education"]),
    })
    .strict(),
  group_member: z.object({ group_id: id }).strict(),
  post: z
    .object({ body: z.string().trim().min(1).max(10000), category: text, group_id: id.optional() })
    .strict(),
  reaction: z.object({ subject_id: id, type: z.enum(["like"]) }).strict(),
  article: z
    .object({
      title: text,
      category: text,
      body: z.string().trim().min(1).max(10000),
      sources: z.array(z.string().url().max(2000)).max(20),
      updated_on: date,
    })
    .strict(),
  report: z.object({ subject_id: id, reason: text, detail: note.optional() }).strict(),
  block: z.object({ user_id: id }).strict(),
  appointment: z
    .object({
      coach_id: id,
      starts_at: timestamp,
      ends_at: timestamp,
      status: z.enum(["requested", "confirmed", "cancelled"]),
      notes: note.optional(),
    })
    .strict(),
  organization: z
    .object({
      name: text,
      city: text,
      description: note.optional(),
      website: z.string().url().max(2000).optional(),
    })
    .strict(),
  organization_member: z.object({ organization_id: id }).strict(),
  membership_plan: z
    .object({
      organization_id: id,
      title: text,
      amount,
      currency: z.enum(["EUR", "USD", "BAM", "GBP"]),
      period: z.enum(["month", "year", "one_time"]),
      description: note.optional(),
    })
    .strict(),
  notification_preferences: z
    .object({ categories: z.record(z.boolean()), quiet_start: time, quiet_end: time, timezone })
    .strict(),
  reminder: z
    .object({ title: text, time, timezone, weekdays: days, enabled: z.boolean() })
    .strict(),
} as const;

export type FeatureKind = keyof typeof featureSchemas;
export type FeaturePayloads = { [K in FeatureKind]: z.infer<(typeof featureSchemas)[K]> };
export type FeatureRecord<K extends FeatureKind = FeatureKind> = {
  id: string;
  owner_id: string;
  kind: K;
  payload: FeaturePayloads[K];
  visibility: "private" | "public";
  client_id: string | null;
  created_at: string;
  updated_at: string;
};
export type FeatureSaveOptions = {
  id?: string;
  visibility?: "private" | "public";
  clientId?: string | null;
};
export const publicKinds: FeatureKind[] = [
  "expert",
  "facility",
  "review",
  "group",
  "group_member",
  "post",
  "reaction",
  "article",
  "organization",
  "organization_member",
  "membership_plan",
];
export const prescriptionKinds: FeatureKind[] = ["nutrition_plan", "supplement"];
export const featureKinds = Object.keys(featureSchemas) as FeatureKind[];

export function parseFeature<K extends FeatureKind>(kind: K, payload: unknown): FeaturePayloads[K] {
  const value = featureSchemas[kind].parse(payload) as FeaturePayloads[K];
  const v = value as Record<string, unknown>;
  if (
    typeof v["start_date"] === "string" &&
    typeof v["end_date"] === "string" &&
    v["end_date"] < v["start_date"]
  )
    throw new Error("End date must follow the start date.");
  if (
    kind === "supplement" &&
    new Set((value as FeaturePayloads["supplement"]).times).size !==
      (value as FeaturePayloads["supplement"]).times.length
  )
    throw new Error("Choose distinct dose times.");
  if (kind === "measurement") {
    const m = value as FeaturePayloads["measurement"];
    const allowed =
      m.type === "weight" ? ["kg", "lb"] : m.type === "body_fat" ? ["%"] : ["cm", "in"];
    if (!allowed.includes(m.unit)) throw new Error("The measurement unit does not match its type.");
    if (m.type === "body_fat" && m.value > 100) throw new Error("Body fat must be at most 100%.");
  }
  if (
    kind === "appointment" &&
    Date.parse(String(v["ends_at"])) <= Date.parse(String(v["starts_at"]))
  )
    throw new Error("Appointment end must follow its start.");
  for (const key of ["website"])
    if (typeof v[key] === "string" && !/^https?:\/\//i.test(v[key]))
      throw new Error("Use an HTTP or HTTPS website.");
  if (
    kind === "article" &&
    (value as FeaturePayloads["article"]).sources.some((url) => !/^https?:\/\//i.test(url))
  )
    throw new Error("Use HTTP or HTTPS source links.");
  return value;
}
