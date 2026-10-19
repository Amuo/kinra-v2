import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildDemoStore,
  demoPeople,
  demoTrainer,
  DEMO_CLIENT_ID,
  DEMO_TRAINER_ID,
  type DemoStore,
} from "./demo-data";
import type {
  Assignment,
  LogTable,
  LogTables,
  Me,
  Person,
  Program,
  ProgressPhoto,
  ProgressReport,
  ReportSummary,
  Role,
  TrainerNote,
  Workout,
} from "./types";
import { from, bucket, trainerByCode, featureRpc } from "./backend";
import { accountKey } from "./account-state";
import { allPages, prepareLog } from "./log-validation";
import { today } from "./stats";
import { programError } from "./programs";
import demoBefore from "@/assets/demo-before.jpg";
import demoAfter from "@/assets/demo-after.jpg";
import { buildSummary } from "./report";
import { lookupFoodBarcode } from "./barcode.functions";
import type { BarcodeFood } from "./barcode";
import { createLiveFeatures, createDemoFeatures, type FeatureApi } from "./feature-api";
import {
  onboardingAnswers,
  decodeOnboardingState,
  validateOnboarding,
  type OnboardingAnswers,
  type OnboardingState,
} from "./onboarding";

export type Mode = "live" | "demo-client" | "demo-trainer";

export interface Api {
  features: FeatureApi;
  mode: Mode;
  ownerId: string;
  me(): Promise<Me>;
  setRole(role: Role): Promise<void>;
  onboarding(): Promise<OnboardingState | null>;
  saveOnboarding(answers: OnboardingAnswers, step: number, finish: boolean): Promise<void>;
  updateProfile(p: { display_name?: string; goal?: string; bio?: string }): Promise<void>;
  setAvatar(file: File | null): Promise<void>;
  lookupBarcode(barcode: string): Promise<BarcodeFood | null>;
  list<T extends LogTable>(table: T, userId: string): Promise<LogTables[T][]>;
  insert<T extends LogTable>(table: T, row: Partial<LogTables[T]>): Promise<void>;
  remove(table: LogTable, id: string): Promise<void>;
  saveWorkout(row: Partial<Workout> & { id: string }, editing?: boolean): Promise<void>;
  clients(): Promise<Person[]>;
  person(id: string): Promise<Person | null>;
  myTrainer(): Promise<Person | null>;
  trainers(): Promise<Person[]>;
  disconnectTrainer(id: string): Promise<void>;
  joinTrainer(code: string): Promise<string>;
  programs(): Promise<Program[]>;
  saveProgram(p: Omit<Program, "id" | "trainer_id">): Promise<string>;
  updateProgram(id: string, p: Omit<Program, "id" | "trainer_id">): Promise<void>;
  assign(programId: string, clientId: string): Promise<void>;
  assignments(clientId: string): Promise<Assignment[]>;
  notes(clientId: string): Promise<TrainerNote[]>;
  addNote(clientId: string, body: string): Promise<void>;
  photos(userId: string): Promise<ProgressPhoto[]>;
  uploadPhoto(v: { file: File; pose: string; note?: string; taken_on?: string }): Promise<void>;
  removePhoto(p: ProgressPhoto): Promise<void>;
  reports(clientId: string): Promise<ProgressReport[]>;
  saveReport(v: {
    clientId: string;
    periodDays: number;
    summary: ReportSummary;
    comment: string;
  }): Promise<void>;
}

const sortKey: Record<LogTable, string> = {
  workouts: "performed_at",
  sleep_logs: "log_date",
  nutrition_logs: "log_date",
  journal_entries: "created_at",
  body_metrics: "log_date",
};

function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

async function authenticatedId(expectedId: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  if (data.user.id !== expectedId)
    throw new Error("Your account changed. Reopen this screen before saving.");
  return data.user.id;
}

async function withAvatar<T extends Person>(person: T): Promise<T> {
  if (!person.avatar_path) return person;
  const { data } = await bucket("profile-avatars").createSignedUrl(person.avatar_path, 3600);
  return { ...person, avatar_url: data?.signedUrl };
}

export function createLiveApi(ownerId: string): Api {
  const uid = () => authenticatedId(ownerId);
  return {
    features: createLiveFeatures(ownerId),
    mode: "live",
    ownerId,
    async me() {
      const id = await uid();
      const [p, r] = await Promise.all([
        from("profiles")
          .select("id, display_name, goal, trainer_code, bio, avatar_path")
          .eq("id", id)
          .maybeSingle(),
        from("user_roles").select("role").eq("user_id", id).maybeSingle(),
      ]);
      const prof = must(p) ?? { id, display_name: null, goal: null, trainer_code: null };
      return withAvatar({ ...prof, role: (must(r)?.role as Role) ?? null });
    },
    async setRole(role) {
      const id = await uid();
      must(await from("profiles").upsert({ id }, { onConflict: "id", ignoreDuplicates: true }));
      must(await from("user_roles").insert({ user_id: id, role }));
    },
    async onboarding() {
      const id = await uid();
      const row = must(
        await from("onboarding_state").select("*").eq("owner_id", id).maybeSingle(),
      ) as {
        answers: unknown;
        step: number;
        version: number;
        completed_at: string | null;
        updated_at: string;
      } | null;
      return row ? decodeOnboardingState(row) : null;
    },
    async saveOnboarding(answers, step, finish) {
      const id = await uid();
      const data = onboardingAnswers.parse(answers);
      if (finish) {
        const error = validateOnboarding(data, 4);
        if (error) throw new Error(error);
      }
      must(
        await featureRpc("kinra_save_onboarding", {
          data,
          stage: step,
          finish,
          expected_owner: id,
        }),
      );
    },
    async updateProfile(p) {
      const id = await uid();
      must(await from("profiles").update(p).eq("id", id));
    },
    lookupBarcode: (barcode) => lookupFoodBarcode({ data: { barcode } }),
    async setAvatar(file) {
      const id = await uid();
      const current = must(
        await from("profiles").select("avatar_path").eq("id", id).maybeSingle(),
      ) as { avatar_path: string | null } | null;
      let path: string | null = null;
      if (file) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024
        )
          throw new Error("Choose a JPG, PNG or WebP photo under 5 MB.");
        path = `${id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
        const upload = await bucket("profile-avatars").upload(path, file, {
          contentType: file.type,
        });
        if (upload.error) throw new Error(upload.error.message);
      }
      const result = await from("profiles").update({ avatar_path: path }).eq("id", id).select("id");
      if (result.error || !result.data?.length) {
        if (path) await bucket("profile-avatars").remove([path]);
        throw new Error("Couldn't update your photo. Try again.");
      }
      if (current?.avatar_path) await bucket("profile-avatars").remove([current.avatar_path]);
    },
    async list(table, userId) {
      await uid();
      return allPages(
        async (offset, size) =>
          must(
            await from(table as "workouts")
              .select("*")
              .eq("user_id", userId)
              .order(sortKey[table], { ascending: false })
              .order("id")
              .range(offset, offset + size - 1),
          ) as never[],
      );
    },
    async insert(table, row) {
      const id = await uid();
      must(await from(table).insert({ ...prepareLog(table, row), user_id: id } as never));
    },
    async remove(table, id) {
      const owner = await uid();
      const rows = must(await from(table).delete().eq("id", id).eq("user_id", owner).select("id"));
      if (!rows.length) throw new Error("This entry no longer exists or cannot be removed.");
    },
    async saveWorkout(row, editing = false) {
      const id = await uid();
      const value = { ...prepareLog("workouts", row), id: row.id, user_id: id } as never;
      const request = editing
        ? from("workouts").update(value).eq("id", row.id).eq("user_id", id)
        : from("workouts").upsert(value, { onConflict: "id" });
      const rows = must(await request.select("id"));
      if (!rows.length)
        throw new Error("This workout couldn't be saved. Your draft is still here.");
    },
    async clients() {
      const id = await uid();
      const links = must(await from("trainer_clients").select("client_id").eq("trainer_id", id));
      if (!links.length) return [];
      const people = must(
        await from("profiles")
          .select("id, display_name, goal, bio, avatar_path")
          .in(
            "id",
            links.map((l) => l.client_id),
          ),
      );
      return Promise.all(people.map(withAvatar));
    },
    async person(id) {
      await uid();
      const person = must(
        await from("profiles")
          .select("id, display_name, goal, bio, avatar_path")
          .eq("id", id)
          .maybeSingle(),
      );
      return person ? withAvatar(person) : null;
    },
    async myTrainer() {
      return (await this.trainers())[0] ?? null;
    },
    async trainers() {
      const id = await uid();
      const links = must(
        await from("trainer_clients")
          .select("trainer_id")
          .eq("client_id", id)
          .order("created_at")
          .order("id"),
      );
      if (!links.length) return [];
      const people = must(
        await from("profiles")
          .select("id, display_name, goal, bio, avatar_path")
          .in(
            "id",
            links.map((link) => link.trainer_id),
          ),
      );
      return Promise.all(
        links.flatMap((link) => {
          const person = people.find((p) => p.id === link.trainer_id);
          return person ? [withAvatar(person)] : [];
        }),
      );
    },
    async disconnectTrainer(trainerId) {
      const id = await uid();
      must(await from("trainer_clients").delete().eq("trainer_id", trainerId).eq("client_id", id));
    },
    async joinTrainer(code) {
      const id = await uid();
      const found = must(await trainerByCode(code.trim()));
      const t = found?.[0];
      if (!t) throw new Error("No coach found with that code");
      must(await from("trainer_clients").insert({ trainer_id: t.id, client_id: id }));
      return t.display_name ?? "your coach";
    },
    async programs() {
      await uid();
      return must(
        await from("programs").select("*").order("created_at", { ascending: false }),
      ) as unknown as Program[];
    },
    async saveProgram(p) {
      const owner = await uid();
      const error = programError(p);
      if (error) throw new Error(error);
      const id = crypto.randomUUID();
      must(await from("programs").insert({ ...p, id, trainer_id: owner, days: p.days as never }));
      return id;
    },
    async updateProgram(id, p) {
      const owner = await uid();
      const error = programError(p);
      if (error) throw new Error(error);
      const rows = must(
        await from("programs")
          .update({ ...p, days: p.days as never })
          .eq("id", id)
          .eq("trainer_id", owner)
          .select("id"),
      );
      if (!rows.length)
        throw new Error("This program couldn't be updated. Your saved plan is unchanged.");
    },
    async assign(programId, clientId) {
      const owner = await uid();
      must(
        await from("program_assignments").insert({
          program_id: programId,
          client_id: clientId,
          trainer_id: owner,
          start_date: today(),
        }),
      );
    },
    async assignments(clientId) {
      await uid();
      return must(
        await from("program_assignments")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      );
    },
    async notes(clientId) {
      await uid();
      return must(
        await from("trainer_notes")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      );
    },
    async addNote(clientId, body) {
      const owner = await uid();
      must(await from("trainer_notes").insert({ client_id: clientId, trainer_id: owner, body }));
    },
    async photos(userId) {
      await uid();
      const rows = must(
        await from("progress_photos")
          .select("*")
          .eq("user_id", userId)
          .order("taken_on", { ascending: false }),
      );
      if (!rows.length) return [];
      const { data: signed, error } = await bucket("progress-photos").createSignedUrls(
        rows.map((r) => r.storage_path),
        3600,
      );
      if (error) throw new Error(error.message);
      return rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? "" }));
    },
    async uploadPhoto({ file, pose, note, taken_on }) {
      const id = await uid();
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      )
        throw new Error("Choose a JPG, PNG or WebP photo under 10 MB.");
      const ext = file.type.split("/")[1];
      const path = `${id}/${crypto.randomUUID()}.${ext}`;
      const up = await bucket("progress-photos").upload(path, file, { contentType: file.type });
      if (up.error) throw new Error(up.error.message);
      try {
        must(
          await from("progress_photos").insert({
            user_id: id,
            storage_path: path,
            pose,
            note: note || null,
            taken_on: taken_on ?? today(),
          }),
        );
      } catch (error) {
        await bucket("progress-photos").remove([path]);
        throw error;
      }
    },
    async removePhoto(p) {
      const id = await uid();
      if (p.user_id !== id) throw new Error("You can only remove your own photos.");
      const removed = await bucket("progress-photos").remove([p.storage_path]);
      if (removed.error) throw new Error(removed.error.message);
      must(await from("progress_photos").delete().eq("id", p.id).eq("user_id", id));
    },
    async reports(clientId) {
      await uid();
      return must(
        await from("progress_reports")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      ) as unknown as ProgressReport[];
    },
    async saveReport({ clientId, periodDays, summary, comment }) {
      const owner = await uid();
      must(
        await from("progress_reports").insert({
          client_id: clientId,
          trainer_id: owner,
          period_days: periodDays,
          summary: summary as never,
          comment: comment || null,
        }),
      );
    },
  };
}

const dAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const demoPhotos: ProgressPhoto[] = [
  {
    id: "ph-2",
    user_id: DEMO_CLIENT_ID,
    taken_on: dAgo(2),
    pose: "Front",
    storage_path: "",
    note: "Week 5 check-in",
    url: demoAfter,
  },
  {
    id: "ph-1",
    user_id: DEMO_CLIENT_ID,
    taken_on: dAgo(34),
    pose: "Front",
    storage_path: "",
    note: "Day 1",
    url: demoBefore,
  },
];
const demoReports: ProgressReport[] = [];
const demoProfiles = new Map<string, Partial<Person>>();
const demoProfile = (p: Person): Person => ({ ...p, ...demoProfiles.get(p.id) });

let store: DemoStore | null = null;
const db = () => (store ??= buildDemoStore());
const rid = () => Math.random().toString(36).slice(2, 11);

function demoApi(mode: "demo-client" | "demo-trainer"): Api {
  const isTrainer = mode === "demo-trainer";
  const meId = isTrainer ? DEMO_TRAINER_ID : DEMO_CLIENT_ID;
  return {
    features: createDemoFeatures(
      meId,
      (foods, meal, date) => {
        for (const food of foods)
          db().nutrition_logs.push({
            id: crypto.randomUUID(),
            user_id: meId,
            log_date: date,
            meal,
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          });
      },
      (coachId, clientId) =>
        !disconnectedDemo &&
        coachId === DEMO_TRAINER_ID &&
        db().assignments.some((a) => a.client_id === clientId),
      () => {
        const data = db();
        for (const table of [
          "workouts",
          "sleep_logs",
          "nutrition_logs",
          "journal_entries",
          "body_metrics",
        ] as const) {
          for (let i = data[table].length - 1; i >= 0; i--)
            if (data[table][i]?.user_id === meId) data[table].splice(i, 1);
        }
        for (let i = demoPhotos.length - 1; i >= 0; i--)
          if (demoPhotos[i]?.user_id === meId) demoPhotos.splice(i, 1);
        for (let i = demoReports.length - 1; i >= 0; i--)
          if (demoReports[i]?.client_id === meId || demoReports[i]?.trainer_id === meId)
            demoReports.splice(i, 1);
        data.notes = data.notes.filter((n) => n.client_id !== meId && n.trainer_id !== meId);
        data.assignments = data.assignments.filter(
          (a) => a.client_id !== meId && a.trainer_id !== meId,
        );
        data.programs = data.programs.filter((p) => p.trainer_id !== meId);
        demoProfiles.delete(meId);
        demoOnboarding.delete(meId);
        disconnectedDemo = true;
      },
    ),
    mode,
    ownerId: meId,
    async me() {
      const base = isTrainer ? demoTrainer : demoPeople[0];
      if (!base) throw new Error("Demo profile unavailable");
      const p = demoProfile(base);
      return {
        ...p,
        trainer_code: isTrainer ? "RIO42X" : null,
        role: isTrainer ? "trainer" : "client",
      };
    },
    async setRole() {},
    async onboarding() {
      return demoOnboarding.get(meId) ?? null;
    },
    async saveOnboarding(answers, step, finish) {
      const data = onboardingAnswers.parse(answers);
      const role = isTrainer ? "trainer" : "client";
      if (data.role !== role)
        throw new Error("Your account type is already set. Reopen setup to continue.");
      if (finish) {
        const error = validateOnboarding(data, 4);
        if (error) throw new Error(error);
        demoProfiles.set(meId, {
          ...demoProfiles.get(meId),
          display_name: data.display_name.trim(),
          goal: data.goal.trim() || null,
        });
        const preferences = (await this.features.list("preferences"))[0];
        await this.features.save(
          "preferences",
          {
            ...(preferences?.payload ?? { modules: {}, timezone: data.timezone }),
            language: data.language,
            theme: data.theme,
            units: data.units,
          },
          preferences ? { id: preferences.id } : {},
        );
      }
      demoOnboarding.set(meId, {
        answers: data,
        version: 2,
        step: finish ? 4 : step,
        updated_at: new Date().toISOString(),
        completed_at: finish
          ? (demoOnboarding.get(meId)?.completed_at ?? new Date().toISOString())
          : null,
      });
    },
    async updateProfile(p) {
      demoProfiles.set(meId, { ...demoProfiles.get(meId), ...p });
    },
    lookupBarcode: (barcode) => lookupFoodBarcode({ data: { barcode } }),
    async setAvatar(file) {
      const previous = demoProfiles.get(meId)?.avatar_url;
      if (previous) URL.revokeObjectURL(previous);
      demoProfiles.set(meId, {
        ...demoProfiles.get(meId),
        avatar_url: file ? URL.createObjectURL(file) : undefined,
      });
    },
    async list(table, userId) {
      const k = sortKey[table] as never;
      return (db()[table] as never[])
        .filter((r: { user_id: string }) => r.user_id === userId)
        .sort((a, b) => String(b[k]).localeCompare(String(a[k]))) as never;
    },
    async insert(table, row) {
      const now = new Date().toISOString();
      (db()[table] as unknown[]).push({
        id: rid(),
        created_at: now,
        performed_at: now,
        ...prepareLog(table, row),
        user_id: meId,
      });
    },
    async remove(table, id) {
      const arr = db()[table] as { id: string }[];
      const i = arr.findIndex((r) => r.id === id && (r as { user_id?: string }).user_id === meId);
      if (i >= 0) arr.splice(i, 1);
    },
    async saveWorkout(row, editing = false) {
      const index = db().workouts.findIndex(
        (workout) => workout.id === row.id && workout.user_id === meId,
      );
      if (editing && index < 0) throw new Error("This workout no longer exists.");
      const value = {
        performed_at: new Date().toISOString(),
        duration_min: null,
        rpe: null,
        notes: null,
        ...prepareLog("workouts", row),
        user_id: meId,
        id: row.id,
      } as Workout;
      if (index < 0) db().workouts.unshift(value);
      else db().workouts[index] = value;
    },
    async clients() {
      return isTrainer ? demoPeople.map(demoProfile) : [];
    },
    async person(id) {
      const p = [...demoPeople, demoTrainer].find((x) => x.id === id);
      return p ? demoProfile(p) : null;
    },
    async myTrainer() {
      return isTrainer || disconnectedDemo ? null : demoProfile(demoTrainer);
    },
    async trainers() {
      return isTrainer || disconnectedDemo ? [] : [demoProfile(demoTrainer)];
    },
    async disconnectTrainer() {
      disconnectedDemo = true;
    },
    async joinTrainer() {
      disconnectedDemo = false;
      return demoTrainer.display_name!;
    },
    async programs() {
      if (isTrainer) return db().programs;
      const ids = db()
        .assignments.filter((a) => a.client_id === meId)
        .map((a) => a.program_id);
      return db().programs.filter((p) => ids.includes(p.id));
    },
    async saveProgram(p) {
      const id = rid();
      db().programs.unshift({ ...structuredClone(p), id, trainer_id: meId });
      return id;
    },
    async updateProgram(id, p) {
      const index = db().programs.findIndex(
        (program) => program.id === id && program.trainer_id === meId,
      );
      const current = db().programs[index];
      if (!current) throw new Error("This program couldn't be updated.");
      db().programs[index] = { ...current, ...structuredClone(p) };
    },
    async assign(programId, clientId) {
      db().assignments.unshift({
        id: rid(),
        program_id: programId,
        client_id: clientId,
        trainer_id: meId,
        start_date: new Date().toISOString().slice(0, 10),
      });
    },
    async assignments(clientId) {
      return db().assignments.filter((a) => a.client_id === clientId);
    },
    async notes(clientId) {
      return db()
        .notes.filter((n) => n.client_id === clientId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    async addNote(clientId, body) {
      db().notes.unshift({
        id: rid(),
        trainer_id: meId,
        client_id: clientId,
        body,
        shared: true,
        created_at: new Date().toISOString(),
      });
    },
    async photos(userId) {
      return demoPhotos
        .filter((p) => p.user_id === userId)
        .sort((a, b) => b.taken_on.localeCompare(a.taken_on));
    },
    async uploadPhoto({ file, pose, note, taken_on }) {
      demoPhotos.unshift({
        id: rid(),
        user_id: meId,
        taken_on: taken_on ?? dAgo(0),
        pose,
        storage_path: "",
        note: note ?? null,
        url: URL.createObjectURL(file),
      });
    },
    async removePhoto(p) {
      const i = demoPhotos.findIndex((x) => x.id === p.id);
      if (i >= 0) demoPhotos.splice(i, 1);
    },
    async reports(clientId) {
      if (!demoReports.length) {
        const d = db();
        const mine = <T extends { user_id: string }>(a: T[]) =>
          a.filter((x) => x.user_id === DEMO_CLIENT_ID);
        demoReports.push({
          id: "rep-1",
          trainer_id: DEMO_TRAINER_ID,
          client_id: DEMO_CLIENT_ID,
          period_days: 30,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          summary: buildSummary(
            {
              workouts: mine(d.workouts),
              sleep: mine(d.sleep_logs),
              food: mine(d.nutrition_logs),
              journal: mine(d.journal_entries),
              metrics: mine(d.body_metrics),
            },
            30,
          ),
          comment:
            "Huge month, Maya. Squat and deadlift both moving up, and your photos show it. Next block: prioritise sleep on Sundays and we push for the pull-up.",
        });
      }
      return demoReports.filter((r) => r.client_id === clientId);
    },
    async saveReport({ clientId, periodDays, summary, comment }) {
      demoReports.unshift({
        id: rid(),
        trainer_id: DEMO_TRAINER_ID,
        client_id: clientId,
        period_days: periodDays,
        summary,
        comment,
        created_at: new Date().toISOString(),
      });
    },
  };
}

let disconnectedDemo = false;
const demoOnboarding = new Map<string, OnboardingState>();
const ApiCtx = createContext<Api | null>(null);

export function ApiProvider({
  mode,
  ownerId,
  children,
}: {
  mode: Mode;
  ownerId: string;
  children: ReactNode;
}) {
  const api = useMemo(
    () => (mode === "live" ? createLiveApi(ownerId) : demoApi(mode)),
    [mode, ownerId],
  );
  return <ApiCtx.Provider value={api}>{children}</ApiCtx.Provider>;
}
export const useApi = () => {
  const api = useContext(ApiCtx);
  if (!api) throw new Error("ApiProvider is required");
  return api;
};

export function useMe() {
  const api = useApi();
  return useQuery({
    queryKey: [...accountKey(api.mode, api.ownerId), "me"],
    queryFn: () => api.me(),
    refetchInterval: 45 * 60_000,
  });
}
export function useLog<T extends LogTable>(table: T, userId: string | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: [...accountKey(api.mode, api.ownerId), table, userId],
    queryFn: () => api.list(table, userId!),
    enabled: !!userId,
  });
}
export function useQ<T>(key: unknown[], fn: (api: Api) => Promise<T>, enabled = true) {
  const api = useApi();
  return useQuery({
    queryKey: [...accountKey(api.mode, api.ownerId), ...key],
    queryFn: () => fn(api),
    enabled,
    refetchInterval: key[0] === "photos" || key[0] === "person" ? 45 * 60_000 : false,
  });
}
export function useAct<V>(fn: (api: Api, v: V) => Promise<unknown>) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: V) => fn(api, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKey(api.mode, api.ownerId) }),
  });
}
