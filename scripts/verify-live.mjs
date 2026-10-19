// Explicitly invoked synthetic acceptance only. Credentials and one-time links
// stay in memory. This script never operates on an existing person's account.
import { createClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "node:crypto";
import { existsSync, readFileSync, unlinkSync, mkdirSync, writeFileSync } from "node:fs";

process.loadEnvFile(".env.local");
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (url !== "https://ztbwycesqodjvseqhygh.supabase.co" || !key)
  throw new Error("Wrong verification target");
mkdirSync("audit", { recursive: true });
const inputPath = "audit/live-qa-input.json";
const nextLine = async () => {
  for (;;) {
    if (existsSync(inputPath)) {
      const value = readFileSync(inputPath, "utf8");
      unlinkSync(inputPath);
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};
const run = Date.now().toString(36);
const inbox = process.env.KINRA_QA_EMAIL_BASE;
if (!inbox || !/^[^+@]+@[^@]+$/.test(inbox))
  throw new Error("Set KINRA_QA_EMAIL_BASE to an owned mailbox for acceptance emails.");
const fresh = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const members = {};
const must = (r) => {
  if (r.error) throw new Error(`${r.error.code ?? "request"}: ${r.error.message}`);
  return r.data;
};
const table = (c) => c.from("kinra_v2_feature_records");
const check = (condition, name) => {
  if (!condition) throw new Error(`FAILED: ${name}`);
  console.log(`PASS ${name}`);
};
for (const role of ["trainer", "client"]) {
  const api = fresh();
  const password = randomBytes(24).toString("base64url") + "aA1!";
  const email = inbox.replace("@", `+kinra-qa-${run}-${role}@`);
  const data = must(
    await api.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://kinra.fit/auth/confirm",
        data: { display_name: `KINRA QA ${run} ${role}` },
      },
    }),
  );
  if (!data.user?.id) throw new Error("Signup did not create a test identity");
  members[role] = { api, password, email, id: data.user.id };
}
console.log(
  JSON.stringify({
    stage: "await-confirmation",
    run,
    members: Object.fromEntries(
      Object.entries(members).map(([role, m]) => [role, { id: m.id, email: m.email }]),
    ),
  }),
);
writeFileSync(
  "audit/live-qa-members.json",
  JSON.stringify({
    run,
    members: Object.fromEntries(
      Object.entries(members).map(([role, m]) => [role, { id: m.id, email: m.email }]),
    ),
  }),
);
const links = JSON.parse(await nextLine());
for (const [role, member] of Object.entries(members)) {
  const link = new URL(links[role]);
  if (link.origin !== url || link.pathname !== "/auth/v1/verify")
    throw new Error("Unexpected confirmation destination");
  must(
    await member.api.auth.verifyOtp({ token_hash: link.searchParams.get("token"), type: "signup" }),
  );
  must(
    await member.api.auth.signInWithPassword({ email: member.email, password: member.password }),
  );
  must(await member.api.from("kinra_v2_user_roles").insert({ user_id: member.id, role }));
}
check(true, "confirmation and password login for paired synthetic accounts");
const coach = members.trainer;
const client = members.client;
must(
  await client.api
    .from("kinra_v2_trainer_clients")
    .insert({ trainer_id: coach.id, client_id: client.id }),
);
const messageId = must(
  await client.api.rpc("kinra_v2_kinra_send_message", {
    recipient_id: coach.id,
    body: `Synthetic acceptance ${run}`,
    expected_owner: client.id,
  }),
);
check(
  must(await coach.api.from("kinra_v2_trainer_notes").select("id").eq("id", messageId)).length ===
    1,
  "client reply uses existing conversation store",
);
const medication = {
  name: "Synthetic record only",
  route: "manual",
  dose: 1,
  unit: "unit",
  frequency: "record only",
  start_date: "2026-10-19",
};
const medId = randomUUID();
must(
  await table(client.api).insert({
    id: medId,
    owner_id: client.id,
    kind: "medication",
    payload: medication,
  }),
);
check(
  must(await table(coach.api).select("id").eq("id", medId)).length === 0,
  "connected coach cannot read medication",
);
check(
  !!(
    await table(coach.api).insert({
      owner_id: client.id,
      kind: "steps",
      payload: { date: "2026-10-19", count: 1 },
    })
  ).error,
  "cross-account feature write rejected",
);
const plan = randomUUID();
must(
  await table(coach.api).insert({
    id: plan,
    owner_id: coach.id,
    kind: "nutrition_plan",
    client_id: client.id,
    payload: {
      title: `Synthetic meal ${run}`,
      meals: [
        {
          name: "QA meal",
          foods: [{ name: `QA food ${run}`, calories: 200, protein: 12.5, carbs: 20, fat: 7 }],
        },
      ],
    },
  }),
);
for (let i = 0; i < 2; i++)
  must(
    await client.api.rpc("kinra_v2_kinra_consume_meal", {
      plan_id: plan,
      meal_index: 0,
      log_date: "2026-10-19",
    }),
  );
check(
  must(await client.api.from("kinra_v2_nutrition_logs").select("id").eq("name", `QA food ${run}`))
    .length === 1,
  "meal retry creates one diary entry",
);
const supplement = randomUUID();
must(
  await table(client.api).insert({
    id: supplement,
    owner_id: client.id,
    kind: "supplement",
    payload: {
      name: `QA supplement ${run}`,
      dose: 1,
      unit: "caps",
      times: ["08:00", "20:00"],
      frequency: "daily",
      start_date: "2026-10-19",
    },
  }),
);
for (const time of ["08:00", "20:00"]) {
  const id = randomUUID();
  for (let i = 0; i < 2; i++)
    must(
      await table(client.api).upsert({
        id,
        owner_id: client.id,
        kind: "dose",
        payload: {
          supplement_id: supplement,
          date: "2026-10-19",
          time,
          status: "taken",
          taken_at: new Date().toISOString(),
        },
      }),
    );
}
check(
  must(await table(client.api).select("id").eq("kind", "dose")).length === 2,
  "separate supplement slots and retry deduplication",
);
const appointment = randomUUID();
must(
  await table(client.api).insert({
    id: appointment,
    owner_id: client.id,
    kind: "appointment",
    payload: {
      coach_id: coach.id,
      starts_at: "2026-10-25T08:00:00Z",
      ends_at: "2026-10-25T09:00:00Z",
      status: "requested",
    },
  }),
);
must(
  await coach.api.rpc("kinra_v2_kinra_respond_appointment", {
    record_id: appointment,
    new_status: "confirmed",
  }),
);
check(
  must(await table(client.api).select("payload").eq("id", appointment).single()).payload.status ===
    "confirmed",
  "coach confirms client appointment",
);
must(
  await client.api.auth.resetPasswordForEmail(client.email, {
    redirectTo: "https://kinra.fit/auth/confirm",
  }),
);
console.log(JSON.stringify({ stage: "await-recovery", run, email: client.email }));
const recovery = new URL(JSON.parse(await nextLine()).recovery);
if (recovery.origin !== url || recovery.pathname !== "/auth/v1/verify")
  throw new Error("Unexpected recovery destination");
must(
  await client.api.auth.verifyOtp({
    token_hash: recovery.searchParams.get("token"),
    type: "recovery",
  }),
);
const changed = randomBytes(24).toString("base64url") + "aA1!";
must(await client.api.auth.updateUser({ password: changed }));
check(
  !!(await fresh().auth.signInWithPassword({ email: client.email, password: client.password }))
    .error,
  "old synthetic password rejected after recovery",
);
must(await client.api.auth.signInWithPassword({ email: client.email, password: changed }));
check(true, "recovered password signs in");
console.log(
  JSON.stringify({ stage: "await-cleanup", run, ids: Object.values(members).map((m) => m.id) }),
);
await nextLine();
for (const member of Object.values(members)) {
  must(
    await member.api.rpc("kinra_v2_kinra_erase_data", {
      confirmation: "DELETE KINRA DATA",
      expected_owner: member.id,
    }),
  );
  check(
    must(await table(member.api).select("id").eq("owner_id", member.id)).length === 0,
    "synthetic Kinra data erased",
  );
}
console.log(
  JSON.stringify({
    stage: "complete",
    run,
    cleanupAuthIds: Object.values(members).map((m) => m.id),
  }),
);
