// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { FeatureKind, FeaturePayloads } from "../lib/feature-types";

const db = new PGlite();
const [coachA, coachB, client, outsider] = [1, 2, 3, 4].map(
  (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
) as [string, string, string, string];
let program: string;
const days = [{ title: "Day A", exercises: [{ name: "Squat", sets: 3, reps: "8" }] }];
async function asUser<T>(id: string | null, fn: () => Promise<T>, role = "authenticated") {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function count(table: string) {
  return Number(
    (await db.query<{ count: string }>(`select count(*) from ${table}`)).rows[0]!.count,
  );
}

async function freshAccount(role: "solo" | "client" | "trainer") {
  const id = crypto.randomUUID();
  await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${id}@example.invalid`]);
  await db.query("insert into user_roles(user_id,role) values($1,$2)", [id, role]);
  return id;
}

beforeAll(async () => {
  await db.exec(`
    create role authenticated; create role anon; create role service_role;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb default '{}');
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
  `);
  for (const file of readdirSync("drizzle/migrations")
    .filter((file) => file.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
  for (const id of [coachA, coachB, client, outsider])
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `${id.slice(-1)}@example.invalid`,
    ]);
  await db.query(
    "insert into user_roles(user_id,role) values($1,'trainer'),($2,'trainer'),($3,'client'),($4,'solo')",
    [coachA, coachB, client, outsider],
  );
  await db.query("insert into trainer_clients(trainer_id,client_id) values($1,$2),($3,$4)", [
    coachA,
    client,
    coachB,
    outsider,
  ]);
  program = (
    await db.query<{ id: string }>(
      "insert into programs(trainer_id,name,days) values($1,'Private program',$2) returning id",
      [coachA, JSON.stringify(days)],
    )
  ).rows[0]!.id;
  await db.query("insert into workouts(user_id,title) values($1,'Client workout')", [client]);
  await db.query("update profiles set avatar_path=$1 where id=$2", [
    `${coachA}/private.png`,
    coachA,
  ]);
  await db.query("insert into storage.objects(bucket_id,name) values('profile-avatars',$1)", [
    `${coachA}/private.png`,
  ]);
}, 30000);
afterAll(() => db.close());

async function feature<K extends FeatureKind>(
  owner: string,
  kind: K,
  payload: FeaturePayloads[K],
  visibility = "private",
  clientId: string | null = null,
) {
  return (
    await asUser(owner, () =>
      db.query<{ id: string }>(
        "insert into feature_records(kind,payload,visibility,client_id) values($1,$2,$3,$4) returning id",
        [kind, JSON.stringify(payload), visibility, clientId],
      ),
    )
  ).rows[0]!.id;
}

describe("feature records security and workflows", () => {
  it("delivers immutable private messages only within active coach connections", async () => {
    const message = await feature(client, "message", {
      recipient_id: coachA,
      body: "Synthetic client reply",
    });
    expect(
      (
        await asUser(coachA, () =>
          db.query("select id from feature_records where id=$1", [message]),
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await asUser(coachB, () =>
          db.query("select id from feature_records where id=$1", [message]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      feature(client, "message", { recipient_id: coachB, body: "Unconnected" }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(client, () =>
        db.query(
          "update feature_records set payload=jsonb_set(payload,'{body}','\"Edited\"') where id=$1",
          [message],
        ),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(client, "message", { recipient_id: coachA, body: "No public messages" }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("rejects public sensitive records, extra payload fields and cross-account ownership", async () => {
    const payload = { date: "2026-10-19", flow: "light", symptoms: [] } as const;
    await expect(
      feature(client, "cycle", { ...payload, symptoms: [] }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(client, () =>
        db.query("insert into feature_records(kind,payload) values('cycle',$1)", [
          JSON.stringify({ ...payload, private_patient: "extra" }),
        ]),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(client, () =>
        db.query("insert into feature_records(owner_id,kind,payload) values($1,'steps',$2)", [
          outsider,
          '{"date":"2026-10-19","count":100}',
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("persists all three languages under existing owner RLS and rejects unsupported locales", async () => {
    await db.exec("begin");
    try {
      let record: string | undefined;
      for (const language of ["en", "bs", "de"]) {
        const payload = {
          language,
          theme: "dark",
          modules: { train: true },
          timezone: "Europe/Sarajevo",
        } as FeaturePayloads["preferences"];
        if (!record) record = await feature(client, "preferences", payload);
        else
          await asUser(client, () =>
            db.query("update feature_records set payload=$1 where id=$2", [
              JSON.stringify(payload),
              record,
            ]),
          );
        const own = await asUser(client, () =>
          db.query<{ language: string }>(
            "select payload->>'language' as language from feature_records where id=$1",
            [record],
          ),
        );
        expect(own.rows[0]?.language).toBe(language);
        const other = await asUser(coachA, () =>
          db.query("select id from feature_records where id=$1", [record]),
        );
        expect(other.rows).toHaveLength(0);
      }
    } finally {
      await db.exec("rollback");
    }
    await expect(
      asUser(client, () =>
        db.query("insert into feature_records(kind,payload) values('preferences',$1)", [
          JSON.stringify({ language: "fr", theme: "dark", modules: {}, timezone: "UTC" }),
        ]),
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("validates real calendar dates, units, bounds and timezones in PostgreSQL", async () => {
    for (const [kind, payload] of [
      ["measurement", { date: "2026-02-30", type: "waist", value: 80, unit: "cm" }],
      ["measurement", { date: "2026-10-19", type: "waist", value: 80, unit: "kg" }],
      ["measurement", { date: "2026-10-19", type: "body_fat", value: 101, unit: "%" }],
      ["preferences", { language: "en", theme: "dark", modules: {}, timezone: "MadeUp/Zone" }],
      [
        "medication",
        {
          name: "Test",
          route: "record only",
          dose: -1,
          unit: "mg",
          frequency: "manual",
          start_date: "2026-10-19",
        },
      ],
    ])
      await expect(
        asUser(client, () =>
          db.query("insert into feature_records(kind,payload) values($1,$2)", [
            kind,
            JSON.stringify(payload),
          ]),
        ),
      ).rejects.toMatchObject({ code: "23514" });
  });
  it("keeps medication and cycle data inaccessible even to connected coaches", async () => {
    await feature(client, "cycle", { date: "2026-10-19", flow: "none", symptoms: [] });
    await feature(client, "medication", {
      name: "Synthetic record",
      route: "record only",
      dose: 1,
      unit: "unit",
      frequency: "as recorded",
      start_date: "2026-10-19",
    });
    expect(
      (
        await asUser(coachA, () =>
          db.query("select id from feature_records where kind in ('cycle','medication')"),
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(outsider, () =>
          db.query("select id from feature_records where kind in ('cycle','medication')"),
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("supports separate dose instances, deduplication and preserved snapshots", async () => {
    const schedule = {
      name: "Synthetic supplement",
      dose: 1,
      unit: "caps",
      times: ["08:00", "20:00"],
      frequency: "daily",
      start_date: "2026-10-19",
    } as const;
    const supplement = await feature(client, "supplement", {
      ...schedule,
      times: [...schedule.times],
    });
    const payload = {
      supplement_id: supplement,
      date: "2026-10-19",
      time: "08:00",
      status: "taken",
      taken_at: "2026-10-19T08:00:00Z",
    } as const;
    const dose = await feature(client, "dose", payload);
    await expect(feature(client, "dose", payload)).rejects.toMatchObject({ code: "23505" });
    await feature(client, "dose", { ...payload, time: "20:00" });
    await expect(feature(outsider, "dose", payload)).rejects.toMatchObject({ code: "23514" });
    await asUser(client, () =>
      db.query("update feature_records set payload=jsonb_set(payload,'{dose}','2') where id=$1", [
        supplement,
      ]),
    );
    const saved = (
      await asUser(client, () =>
        db.query<{ payload: { dose_snapshot: number } }>(
          "select payload from feature_records where id=$1",
          [dose],
        ),
      )
    ).rows[0]!;
    expect(saved.payload.dose_snapshot).toBe(1);
    await asUser(client, () =>
      db.query(
        "update feature_records set payload=jsonb_set(payload,'{status}','\"skipped\"') where id=$1",
        [dose],
      ),
    );
    expect(
      (await asUser(client, () => db.query("select id from feature_records where kind='dose'")))
        .rows,
    ).toHaveLength(2);
  });
  it("consumes a prescribed meal atomically and retries without duplicate food", async () => {
    const plan = await feature(
      coachA,
      "nutrition_plan",
      {
        title: "Synthetic meal plan",
        meals: [
          {
            name: "Lunch",
            foods: [{ name: "Synthetic food", calories: 200, protein: 12.5, carbs: 20, fat: 7 }],
          },
        ],
      },
      "private",
      client,
    );
    expect(
      (await asUser(client, () => db.query("select id from feature_records where id=$1", [plan])))
        .rows,
    ).toHaveLength(1);
    expect(
      (await asUser(outsider, () => db.query("select id from feature_records where id=$1", [plan])))
        .rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(client, () =>
          db.query("update feature_records set payload=payload where id=$1 returning id", [plan]),
        )
      ).rows,
    ).toHaveLength(0);
    await feature(client, "meal_event", {
      plan_id: plan,
      meal_index: 0,
      date: "2026-10-19",
      status: "skipped",
    });
    for (let i = 0; i < 2; i++)
      await asUser(client, () => db.query("select kinra_consume_meal($1,0,'2026-10-19')", [plan]));
    expect(
      (
        await asUser(client, () =>
          db.query("select id from nutrition_logs where name='Synthetic food'"),
        )
      ).rows,
    ).toHaveLength(1);
    const result = (
      await asUser(client, () =>
        db.query<{ payload: { status: string; plan_snapshot: unknown } }>(
          "select payload from feature_records where kind='meal_event' and payload->>'plan_id'=$1",
          [plan],
        ),
      )
    ).rows;
    expect(result).toHaveLength(1);
    expect(result[0]!.payload.status).toBe("consumed");
    expect(result[0]!.payload.plan_snapshot).toBeTruthy();
    await expect(
      asUser(outsider, () => db.query("select kinra_consume_meal($1,0,'2026-10-19')", [plan])),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      feature(client, "meal_event", {
        plan_id: plan,
        meal_index: 0,
        date: "2026-10-20",
        status: "consumed",
      }),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("publishes deliberate content and hides it after a block", async () => {
    const expert = await feature(
      coachB,
      "expert",
      {
        name: "Synthetic expert",
        headline: "Unverified profile",
        city: "Test",
        languages: ["en"],
        specialties: [],
      },
      "public",
    );
    expect(
      (await asUser(client, () => db.query("select id from feature_records where id=$1", [expert])))
        .rows,
    ).toHaveLength(1);
    await feature(client, "block", { user_id: coachB });
    expect(
      (await asUser(client, () => db.query("select id from feature_records where id=$1", [expert])))
        .rows,
    ).toHaveLength(0);
    await expect(
      feature(
        client,
        "review",
        { subject_type: "expert", subject_id: expert, rating: 5 },
        "public",
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(
        coachB,
        "review",
        { subject_type: "expert", subject_id: expert, rating: 5 },
        "public",
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("requires membership before group posting and rejects leaked private group content", async () => {
    const group = await feature(
      coachB,
      "group",
      { title: "Synthetic group", description: "Test only", type: "interest" },
      "public",
    );
    await expect(
      feature(outsider, "post", { body: "Test", category: "Training", group_id: group }, "public"),
    ).rejects.toMatchObject({ code: "42501" });
    await feature(outsider, "group_member", { group_id: group }, "public");
    await feature(
      outsider,
      "post",
      { body: "Test", category: "Training", group_id: group },
      "public",
    );
    const secret = await feature(coachB, "group", {
      title: "Private",
      description: "Test",
      type: "interest",
    });
    await expect(
      feature(
        coachB,
        "post",
        { body: "Private test", category: "Training", group_id: secret },
        "public",
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(outsider, "group_member", { group_id: secret }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("requires organization ownership to publish membership plans", async () => {
    const organization = await feature(
      coachB,
      "organization",
      { name: "Synthetic organization", city: "Test" },
      "public",
    );
    await feature(outsider, "organization_member", { organization_id: organization }, "public");
    await expect(
      feature(
        outsider,
        "membership_plan",
        {
          organization_id: organization,
          title: "Forged staff",
          amount: 1,
          currency: "EUR",
          period: "month",
        },
        "public",
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await feature(
      coachB,
      "membership_plan",
      {
        organization_id: organization,
        title: "Recorded plan",
        amount: 0,
        currency: "EUR",
        period: "month",
      },
      "public",
    );
  });
  it("allows only the connected coach to confirm and prevents overlapping appointments", async () => {
    const payload = {
      coach_id: coachA,
      starts_at: "2026-10-20T08:00:00Z",
      ends_at: "2026-10-20T09:00:00Z",
      status: "requested",
    } as const;
    const first = await feature(client, "appointment", payload);
    await expect(
      asUser(client, () => db.query("select kinra_respond_appointment($1,'confirmed')", [first])),
    ).rejects.toMatchObject({ code: "42501" });
    await asUser(coachA, () =>
      db.query("select kinra_respond_appointment($1,'confirmed')", [first]),
    );
    const second = await feature(client, "appointment", {
      ...payload,
      starts_at: "2026-10-20T08:30:00Z",
      ends_at: "2026-10-20T09:30:00Z",
    });
    await expect(
      asUser(coachA, () => db.query("select kinra_respond_appointment($1,'confirmed')", [second])),
    ).rejects.toMatchObject({ code: "23505" });
    await expect(
      asUser(outsider, () => db.query("select kinra_respond_appointment($1,'cancelled')", [first])),
    ).rejects.toMatchObject({ code: "42501" });
    await asUser(client, () =>
      db.query("select kinra_respond_appointment($1,'cancelled')", [first]),
    );
    await asUser(coachA, () =>
      db.query("select kinra_respond_appointment($1,'confirmed')", [second]),
    );
  });
});

describe("migrated database authorization", () => {
  it("keeps logs private and grants connected coach reads", async () => {
    expect(await asUser(outsider, () => count("workouts"))).toBe(0);
    expect(await asUser(coachA, () => count("workouts"))).toBe(1);
    expect(await asUser(client, () => count("workouts"))).toBe(1);
  });
  it("rejects writing or changing another user's logs", async () => {
    await expect(
      asUser(outsider, () =>
        db.query("insert into workouts(user_id,title) values($1,'Forged')", [client]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    expect(
      (
        await asUser(outsider, () =>
          db.query("update workouts set title='Forged' where user_id=$1 returning id", [client]),
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("rejects cross-coach assignments on insert and update", async () => {
    await expect(
      asUser(coachB, () =>
        db.query("insert into program_assignments(program_id,client_id) values($1,$2)", [
          program,
          outsider,
        ]),
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await asUser(coachA, () =>
      db.query("insert into program_assignments(program_id,client_id) values($1,$2)", [
        program,
        client,
      ]),
    );
    expect(await asUser(client, () => count("programs"))).toBe(1);
    expect(await asUser(outsider, () => count("programs"))).toBe(0);
    const own = (
      await db.query<{ id: string }>(
        "insert into programs(trainer_id,name,days) values($1,'Own',$2) returning id",
        [coachB, JSON.stringify(days)],
      )
    ).rows[0]!.id;
    const assignment = (
      await asUser(coachB, () =>
        db.query<{ id: string }>(
          "insert into program_assignments(program_id,client_id) values($1,$2) returning id",
          [own, outsider],
        ),
      )
    ).rows[0]!.id;
    await expect(
      asUser(coachB, () =>
        db.query("update program_assignments set program_id=$1 where id=$2", [program, assignment]),
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("cannot forge an avatar reference, but allows owner and connected parties", async () => {
    expect(await asUser(coachB, () => count("storage.objects"))).toBe(0);
    await expect(
      asUser(coachB, () =>
        db.query("update profiles set avatar_path=$1 where id=$2", [
          `${coachA}/private.png`,
          coachB,
        ]),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    expect(await asUser(coachA, () => count("storage.objects"))).toBe(1);
    expect(await asUser(client, () => count("storage.objects"))).toBe(1);
  });
  it("rejects anonymous helper RPCs and permits the authenticated code lookup", async () => {
    for (const query of ["select has_role($1,'trainer')", "select is_trainer_of($1)"])
      await expect(asUser(null, () => db.query(query, [coachA]), "anon")).rejects.toMatchObject({
        code: "42501",
      });
    await expect(
      asUser(null, () => db.query("select * from find_trainer_by_code('ABC123')"), "anon"),
    ).rejects.toMatchObject({ code: "42501" });
    expect(
      (await asUser(client, () => db.query("select * from find_trainer_by_code('invalid')"))).rows,
    ).toHaveLength(0);
  });
  it("revokes coach log access when the client disconnects", async () => {
    await asUser(client, () =>
      db.query("delete from trainer_clients where trainer_id=$1 and client_id=$2", [
        coachA,
        client,
      ]),
    );
    expect(await asUser(coachA, () => count("workouts"))).toBe(0);
    expect(await asUser(client, () => count("storage.objects"))).toBe(0);
    expect(
      (
        await asUser(coachA, () =>
          db.query("select id from feature_records where kind='message' and owner_id=$1", [client]),
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(client, () =>
          db.query("select id from feature_records where kind='nutrition_plan' and client_id=$1", [
            client,
          ]),
        )
      ).rows,
    ).toHaveLength(0);
  });
});

it("erases only the explicitly confirmed Kinra actor's data and retains the shared identity", async () => {
  const actor = "50000000-0000-4000-8000-000000000005";
  await db.query("insert into auth.users(id,email) values($1,'erase@example.invalid')", [actor]);
  await asUser(actor, () =>
    db.query("insert into workouts(title) values('Synthetic erase target')"),
  );
  await feature(actor, "steps", { date: "2026-10-19", count: 123 });
  const otherBefore = (
    await db.query("select * from workouts where user_id<>$1 order by id", [actor])
  ).rows;
  await expect(
    asUser(actor, () => db.query("select kinra_erase_data('wrong',$1)", [actor])),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(
    asUser(actor, () => db.query("select kinra_erase_data('DELETE KINRA DATA',$1)", [outsider])),
  ).rejects.toMatchObject({ code: "42501" });
  await asUser(actor, () => db.query("select kinra_erase_data('DELETE KINRA DATA',$1)", [actor]));
  expect((await db.query("select * from workouts where user_id=$1", [actor])).rows).toHaveLength(0);
  expect(
    (await db.query("select * from feature_records where owner_id=$1", [actor])).rows,
  ).toHaveLength(0);
  expect((await db.query("select * from profiles where id=$1", [actor])).rows).toHaveLength(0);
  expect((await db.query("select * from auth.users where id=$1", [actor])).rows).toHaveLength(1);
  expect(
    (await db.query("select * from workouts where user_id<>$1 order by id", [actor])).rows,
  ).toEqual(otherBefore);
});

describe("migrated data integrity", () => {
  it("saves fractional barcode macros through JSON decoding", async () => {
    await asUser(client, () =>
      db.query(
        `insert into nutrition_logs(name,protein,carbs,fat) select name,protein,carbs,fat from json_populate_record(null::nutrition_logs,$1::json)`,
        ['{"name":"Food","protein":12.5,"carbs":20.2,"fat":3.3}'],
      ),
    );
    expect(
      Number(
        (
          await asUser(client, () =>
            db.query<{ protein: number }>("select protein from nutrition_logs where name='Food'"),
          )
        ).rows[0]!.protein,
      ),
    ).toBe(12.5);
  });
  it("rejects negative sleep, invalid scores, macros, and malformed workout JSON", async () => {
    for (const query of [
      "insert into sleep_logs(hours,quality) values(-8,999)",
      "insert into journal_entries(mood,energy) values(0,6)",
      "insert into body_metrics(weight) values(-1)",
      "insert into nutrition_logs(name,calories) values('Food',-1)",
      'insert into workouts(title,sets) values(\'Bad\',\'[{"exercise":"Squat","reps":-1,"weight":50}]\')',
    ])
      await expect(asUser(client, () => db.exec(query))).rejects.toMatchObject({ code: "23514" });
  });
  it("validates program JSON and provisions private restricted buckets", async () => {
    await expect(
      asUser(coachB, () => db.exec("insert into programs(name,days) values('Bad','[]')")),
    ).rejects.toMatchObject({ code: "23514" });
    const buckets = (
      await db.query<{ id: string; public: boolean; allowed_mime_types: string[] }>(
        "select * from storage.buckets",
      )
    ).rows;
    expect(buckets).toHaveLength(4);
    expect(
      buckets.every(
        (bucket) =>
          !bucket.public &&
          (bucket.id === "expert-materials"
            ? bucket.allowed_mime_types.length === 1 &&
              bucket.allowed_mime_types[0] === "application/pdf"
            : bucket.allowed_mime_types.includes("image/jpeg")),
      ),
    ).toBe(true);
  });
  it("atomically edits a workout and keeps stable-ID retries at one row", async () => {
    const id = "00000000-0000-4000-8000-000000000099";
    for (let attempt = 0; attempt < 2; attempt++)
      await asUser(client, () =>
        db.query(
          "insert into workouts(id,title) values($1,'New') on conflict(id) do update set title=excluded.title",
          [id],
        ),
      );
    await asUser(client, () => db.query("update workouts set title='Edited' where id=$1", [id]));
    expect(
      (
        await asUser(client, () =>
          db.query<{ title: string }>("select title from workouts where id=$1", [id]),
        )
      ).rows,
    ).toEqual([{ title: "Edited" }]);
  });
});

describe("private role-specific onboarding", () => {
  const answer = (role: "solo" | "client" | "trainer") => ({
    role,
    display_name: "Synthetic setup",
    goal: "A personal goal",
    first_action: { solo: "workout", client: "connect", trainer: "program" }[role],
    theme: "light",
    language: "de",
    timezone: "UTC",
  });
  const setupId = (n: number) => `30000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  async function newMember(n: number) {
    const id = setupId(n);
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `setup-${n}@example.invalid`,
    ]);
    return id;
  }
  async function save(id: string, data: object, finish = false, stage = finish ? 3 : 1) {
    return asUser(id, () =>
      db.query("select kinra_save_onboarding($1,$2,$3,$4)", [
        JSON.stringify(data),
        stage,
        finish,
        id,
      ]),
    );
  }

  it.each(["solo", "client", "trainer"] as const)(
    "resumes private %s setup and completes exactly once without creating connections",
    async (role) => {
      const id = await newMember({ solo: 11, client: 12, trainer: 13 }[role]);
      const original = (await db.query("select display_name from profiles where id=$1", [id]))
        .rows[0];
      await save(id, answer(role));
      expect(
        (await db.query("select role from user_roles where user_id=$1", [id])).rows,
      ).toHaveLength(0);
      expect(
        (await db.query("select display_name from profiles where id=$1", [id])).rows[0],
      ).toEqual(original);
      const draft = await asUser(id, () =>
        db.query<{ answers: unknown; step: number; completed_at: string | null }>(
          "select answers,step,completed_at from onboarding_state",
        ),
      );
      expect(draft.rows).toMatchObject([{ answers: answer(role), step: 1, completed_at: null }]);
      await save(id, answer(role), true);
      const completed = (
        await db.query("select completed_at from onboarding_state where owner_id=$1", [id])
      ).rows[0];
      await save(id, answer(role), true);
      expect(
        (await db.query("select completed_at from onboarding_state where owner_id=$1", [id]))
          .rows[0],
      ).toEqual(completed);
      expect((await db.query("select role from user_roles where user_id=$1", [id])).rows).toEqual([
        { role },
      ]);
      expect(
        (await db.query("select display_name,goal from profiles where id=$1", [id])).rows,
      ).toEqual([{ display_name: "Synthetic setup", goal: "A personal goal" }]);
      expect(
        (
          await db.query(
            "select id from feature_records where kind='preferences' and owner_id=$1",
            [id],
          )
        ).rows,
      ).toHaveLength(1);
      expect(
        (await db.query("select id from trainer_clients where client_id=$1 or trainer_id=$1", [id]))
          .rows,
      ).toHaveLength(0);
    },
  );

  it("keeps drafts hidden from a connected coach and refuses actor spoofing and owner changes", async () => {
    await save(client, answer("client"));
    expect(
      (
        await asUser(coachA, () =>
          db.query("select * from onboarding_state where owner_id=$1", [client]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(client, () =>
        db.query("update onboarding_state set owner_id=$1 where owner_id=$2", [outsider, client]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(outsider, () =>
        db.query("select kinra_save_onboarding($1,1,false,$2)", [
          JSON.stringify(answer("solo")),
          client,
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(
        null,
        () =>
          db.query("select kinra_save_onboarding($1,1,false,$2)", [
            JSON.stringify(answer("solo")),
            client,
          ]),
        "anon",
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("merges appearance and locale while preserving preference IDs, units, modules and timezone", async () => {
    const id = await newMember(14);
    await db.query("insert into user_roles(user_id,role) values($1,'solo')", [id]);
    const existing = await feature(id, "preferences", {
      language: "en",
      theme: "dark",
      modules: { fuel: false, train: true },
      units: "imperial",
      timezone: "Europe/Sarajevo",
    });
    await save(id, answer("solo"), true);
    const pref = (
      await db.query<{ id: string; payload: object }>(
        "select id,payload from feature_records where owner_id=$1 and kind='preferences'",
        [id],
      )
    ).rows[0]!;
    expect(pref).toEqual({
      id: existing,
      payload: {
        language: "de",
        theme: "light",
        modules: { fuel: false, train: true },
        units: "imperial",
        timezone: "Europe/Sarajevo",
      },
    });
    await expect(save(id, answer("trainer"), true)).rejects.toMatchObject({ code: "22023" });
    expect((await db.query("select role from user_roles where user_id=$1", [id])).rows).toEqual([
      { role: "solo" },
    ]);
    await save(id, { ...answer("solo"), goal: "An unfinished edit" }, false, 2);
    expect(
      (await db.query("select completed_at,step from onboarding_state where owner_id=$1", [id]))
        .rows,
    ).toEqual([{ completed_at: null, step: 3 }]);
  });

  it("rolls back profile and role writes when the final preference write fails", async () => {
    const id = await newMember(15);
    await save(id, answer("solo"));
    const before = (await db.query("select display_name,goal from profiles where id=$1", [id]))
      .rows;
    await db.exec(
      `create function setup_test_failure() returns trigger language plpgsql as $$ begin if NEW.owner_id='${id}'::uuid then raise exception 'Synthetic late failure' using errcode='23514'; end if; return NEW; end $$; create trigger setup_test_failure before insert on feature_records for each row execute function setup_test_failure();`,
    );
    try {
      await expect(save(id, answer("solo"), true)).rejects.toMatchObject({ code: "23514" });
    } finally {
      await db.exec(
        "drop trigger setup_test_failure on feature_records; drop function setup_test_failure();",
      );
    }
    expect(
      (await db.query("select display_name,goal from profiles where id=$1", [id])).rows,
    ).toEqual(before);
    expect(
      (await db.query("select role from user_roles where user_id=$1", [id])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select completed_at,step from onboarding_state where owner_id=$1", [id]))
        .rows,
    ).toEqual([{ completed_at: null, step: 1 }]);
  });

  it("validates server-side shape and removes setup through existing V2 erasure", async () => {
    const id = await newMember(16);
    for (const malformed of [
      { ...answer("solo"), language: "fr" },
      { ...answer("solo"), first_action: "clients" },
      { ...answer("solo"), extra: true },
    ])
      await expect(save(id, malformed, true)).rejects.toMatchObject({ code: "22023" });
    await save(id, answer("solo"), true);
    await asUser(id, () => db.query("select kinra_erase_data('DELETE KINRA DATA',$1)", [id]));
    expect(
      (await db.query("select * from onboarding_state where owner_id=$1", [id])).rows,
    ).toHaveLength(0);
    expect((await db.query("select id from auth.users where id=$1", [id])).rows).toHaveLength(1);
  });
  it("saves optional facts privately, changes units deliberately and protects facts from cached clients", async () => {
    const id = await newMember(17);
    await db.query("insert into trainer_clients(trainer_id,client_id) values($1,$2)", [coachA, id]);
    const data = {
      ...answer("client"),
      gender: "non_binary",
      height_cm: 172.72,
      weight_kg: 72.5747792,
      units: "imperial",
      experience: "some",
    };
    await save(id, data, false, 2);
    expect(
      (await db.query("select version,step,answers from onboarding_state where owner_id=$1", [id]))
        .rows,
    ).toMatchObject([{ version: 2, step: 2, answers: data }]);
    expect(
      (
        await asUser(coachA, () =>
          db.query("select * from onboarding_state where owner_id=$1", [id]),
        )
      ).rows,
    ).toHaveLength(0);
    await save(id, data, true, 4);
    expect(
      (
        await db.query<{ payload: { units: string } }>(
          "select payload from feature_records where owner_id=$1 and kind='preferences'",
          [id],
        )
      ).rows[0]!.payload.units,
    ).toBe("imperial");
    expect((await db.query("select * from body_metrics where user_id=$1", [id])).rows).toHaveLength(
      0,
    );
    await save(id, { ...answer("client"), goal: "Legacy edit" }, true, 3);
    expect(
      (await db.query("select version,step,answers from onboarding_state where owner_id=$1", [id]))
        .rows,
    ).toMatchObject([{ version: 2, step: 4, answers: { ...data, goal: "Legacy edit" } }]);
    await save(
      id,
      {
        ...data,
        gender: null,
        height_cm: null,
        weight_kg: null,
        experience: null,
        units: "metric",
      },
      true,
      4,
    );
    expect(
      (await db.query("select answers from onboarding_state where owner_id=$1", [id])).rows,
    ).toMatchObject([
      { answers: { gender: null, height_cm: null, weight_kg: null, experience: null } },
    ]);
  });
  it("rejects malformed optional facts and never manufactures skipped measurements", async () => {
    const id = await newMember(18);
    const data = {
      ...answer("solo"),
      gender: null,
      height_cm: null,
      weight_kg: null,
      units: "metric",
      experience: null,
    };
    for (const patch of [
      { height_cm: 79 },
      { height_cm: 251 },
      { height_cm: "170" },
      { weight_kg: 19 },
      { weight_kg: 351 },
      { gender: "invalid" },
      { experience: 5 },
      { units: null },
    ]) {
      await expect(save(id, { ...data, ...patch }, true, 4)).rejects.toMatchObject({
        code: "22023",
      });
    }
    await save(id, data, true, 4);
    expect(
      (await db.query("select answers from onboarding_state where owner_id=$1", [id])).rows,
    ).toMatchObject([{ answers: { height_cm: null, weight_kg: null, gender: null } }]);
  });
});

describe("usable templates and account workspaces", () => {
  const member = async (n: number, role = "solo") => {
    const id = `60000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
    await db.query("insert into auth.users(id,email) values($1,$2)", [
      id,
      `templates-${n}@example.invalid`,
    ]);
    await db.query("insert into user_roles(user_id,role) values($1,$2)", [id, role]);
    return id;
  };
  async function adopt(owner: string, key: string, language = "en") {
    return (
      await asUser(owner, () =>
        db.query<{ result: { id: string; kind: string; alreadySaved: boolean } }>(
          "select kinra_adopt_template($1,$2,$3) as result",
          [key, language, owner],
        ),
      )
    ).rows[0]!.result;
  }
  it.each(["solo", "client", "trainer"])(
    "makes an editable private training copy for %s without creating assignments",
    async (role) => {
      const id = await member({ solo: 1, client: 2, trainer: 3 }[role]!, role);
      const key = (
        await db.query<{ id: string }>(
          "select id from template_catalogue where kind='training' order by id limit 1",
        )
      ).rows[0]!.id;
      const first = await adopt(id, key, "de");
      expect(first.alreadySaved).toBe(false);
      await asUser(id, () =>
        db.query("update programs set name='My edited copy' where id=$1", [first.id]),
      );
      expect(await adopt(id, key, "bs")).toEqual({ ...first, alreadySaved: true });
      expect(
        (await asUser(id, () => db.query("select name from programs where id=$1", [first.id])))
          .rows,
      ).toEqual([{ name: "My edited copy" }]);
      expect(
        (await db.query("select * from program_assignments where program_id=$1", [first.id])).rows,
      ).toHaveLength(0);
      expect(
        (await asUser(outsider, () => db.query("select * from programs where id=$1", [first.id])))
          .rows,
      ).toHaveLength(0);
      await asUser(id, () => db.query("delete from programs where id=$1", [first.id]));
      expect((await adopt(id, key)).id).not.toBe(first.id);
    },
  );
  it("keeps nutrition copies private and rejects forged adoption receipts or template edits", async () => {
    const id = await member(4, "client");
    await db.query("insert into trainer_clients(trainer_id,client_id) values($1,$2)", [coachA, id]);
    const key = (
      await db.query<{ id: string }>(
        "select id from template_catalogue where kind='nutrition' order by id limit 1",
      )
    ).rows[0]!.id;
    const first = await adopt(id, key, "bs");
    expect((await adopt(id, key)).alreadySaved).toBe(true);
    expect(
      (
        await asUser(coachA, () =>
          db.query("select * from feature_records where id=$1", [first.id]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(id, () => db.query("update template_catalogue set payload='{}'")),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(outsider, () => db.query("select kinra_adopt_template($1,'en',$2)", [key, id])),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(outsider, () =>
        db.query(
          "insert into template_adoptions(owner_id,template_id,kind,content_version,feature_id) values($1,$2,'nutrition',1,$3)",
          [outsider, key, first.id],
        ),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("switches and adds workspaces without overwriting primary role or creating connections", async () => {
    const id = await member(5, "client");
    await expect(
      asUser(id, () => db.query("select kinra_set_workspace('trainer',false,$1)", [id])),
    ).rejects.toMatchObject({ code: "42501" });
    await asUser(id, () => db.query("select kinra_set_workspace('specialist',true,$1)", [id]));
    expect(
      (
        await asUser(id, () =>
          db.query<{ v: { active: string; primary: string; roles: string[] } }>(
            "select kinra_account_workspaces($1) as v",
            [id],
          ),
        )
      ).rows[0]!.v,
    ).toEqual({ active: "specialist", primary: "client", roles: ["client", "specialist"] });
    expect(
      (await asUser(id, () => db.query("select has_role($1,'trainer') as can_coach", [id]))).rows,
    ).toEqual([{ can_coach: true }]);
    expect(
      (await asUser(id, () => db.query("select * from workouts where user_id=$1", [client]))).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from trainer_clients where trainer_id=$1 or client_id=$1", [id]))
        .rows,
    ).toHaveLength(0);
    await asUser(id, () => db.query("select kinra_set_workspace('client',false,$1)", [id]));
    expect((await db.query("select role from user_roles where user_id=$1", [id])).rows).toEqual([
      { role: "client" },
    ]);
    expect(
      (
        await asUser(outsider, () =>
          db.query("select * from account_roles where owner_id=$1", [id]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(outsider, () => db.query("select kinra_set_workspace('trainer',true,$1)", [id])),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("does not turn an organization workspace into coaching or staff privileges", async () => {
    const id = await member(6);
    await asUser(id, () => db.query("select kinra_set_workspace('organization',true,$1)", [id]));
    expect(
      (await asUser(id, () => db.query("select has_role($1,'trainer') as can_coach", [id]))).rows,
    ).toEqual([{ can_coach: false }]);
    await expect(
      asUser(null, () => db.query("select kinra_account_workspaces($1)", [id]), "anon"),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("validates the optional questionnaire without exposing its private answers", async () => {
    const id = await member(7);
    const data = {
      role: "solo",
      display_name: "Synthetic",
      goal: "",
      first_action: "workout",
      theme: "dark",
      language: "en",
      timezone: "UTC",
      gender: null,
      height_cm: null,
      weight_kg: null,
      units: "metric",
      experience: null,
      birth_date: "1990-04-12",
      activity_level: "moderate",
      city: "Synthetic city",
      limitations: "Prefer seated alternatives",
    };
    for (const patch of [
      { birth_date: "2026-02-31" },
      { birth_date: "2999-01-01" },
      { city: "a".repeat(101) },
      { limitations: "a".repeat(1001) },
      { activity_level: "unknown" },
    ])
      await expect(
        asUser(id, () =>
          db.query("select kinra_save_onboarding($1,4,true,$2)", [
            JSON.stringify({ ...data, ...patch }),
            id,
          ]),
        ),
      ).rejects.toMatchObject({ code: "22023" });
    await asUser(id, () =>
      db.query("select kinra_save_onboarding($1,4,true,$2)", [JSON.stringify(data), id]),
    );
    expect(
      (
        await asUser(outsider, () =>
          db.query("select * from onboarding_state where owner_id=$1", [id]),
        )
      ).rows,
    ).toHaveLength(0);
  });
});

describe("private attachments and real reminder dispatcher", () => {
  it("commits an attachment with its message, deduplicates retries and revokes recipient file access on disconnect", async () => {
    const sender = await freshAccount("trainer");
    const recipient = await freshAccount("client");
    const other = await freshAccount("solo");
    await db.query("insert into trainer_clients(trainer_id,client_id) values($1,$2)", [
      sender,
      recipient,
    ]);
    const path = `${sender}/${crypto.randomUUID()}.pdf`;
    await asUser(sender, () =>
      db.query(
        "insert into storage.objects(bucket_id,name,metadata) values('message-attachments',$1,$2)",
        [path, JSON.stringify({ mimetype: "application/pdf", size: 32 })],
      ),
    );
    const send = (actor: string, filePath = path) =>
      asUser(actor, () =>
        db.query<{ id: string }>(
          "select kinra_send_attachment($1,'Shared PDF',$2,'plan.pdf','application/pdf',32,$3) id",
          [recipient, filePath, actor],
        ),
      );
    const message = (await send(sender)).rows[0]!.id;
    expect((await send(sender)).rows[0]!.id).toBe(message);
    expect(
      (
        await asUser(recipient, () =>
          db.query("select * from message_attachments where message_id=$1", [message]),
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await asUser(recipient, () =>
          db.query("select * from storage.objects where name=$1", [path]),
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await asUser(other, () =>
          db.query("select * from message_attachments where message_id=$1", [message]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(send(other)).rejects.toMatchObject({ code: "42501" });
    await expect(send(sender, `${recipient}/${crypto.randomUUID()}.pdf`)).rejects.toMatchObject({
      code: "42501",
    });
    await db.query("delete from trainer_clients where trainer_id=$1 and client_id=$2", [
      sender,
      recipient,
    ]);
    expect(
      (
        await asUser(recipient, () =>
          db.query("select * from storage.objects where name=$1", [path]),
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(recipient, () =>
          db.query("select * from message_attachments where message_id=$1", [message]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(send(sender)).rejects.toMatchObject({ code: "42501" });
  });
  it("enforces owner-only devices, dispatcher capability, daily deduplication, quiet hours and expired-device cleanup", async () => {
    const owner = await freshAccount("solo");
    const other = await freshAccount("solo");
    const token = "synthetic-dispatch-test-".repeat(3);
    await db.query(
      "insert into push_dispatch_config(token_hash) values(sha256(convert_to($1,'UTF8'))) on conflict(singleton) do update set token_hash=excluded.token_hash",
      [token],
    );
    const device = (
      await asUser(owner, () =>
        db.query<{ id: string }>(
          "insert into device_subscriptions(endpoint,p256dh,auth_key,locale) values($1,$2,$3,'bs') returning id",
          [
            `https://fcm.googleapis.com/fcm/send/${crypto.randomUUID()}`,
            "a".repeat(87),
            "b".repeat(22),
          ],
        ),
      )
    ).rows[0]!.id;
    expect(
      (
        await asUser(other, () =>
          db.query("select * from device_subscriptions where id=$1", [device]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(other, () =>
        db.query(
          "insert into device_subscriptions(owner_id,endpoint,p256dh,auth_key,locale) values($1,'https://fcm.googleapis.com/forged',$2,$3,'de')",
          [owner, "a".repeat(87), "b".repeat(22)],
        ),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    const clock = (
      await db.query<{ time: string; day: number }>(
        "select to_char(now() at time zone 'UTC','HH24:MI') time,extract(dow from now() at time zone 'UTC')::int as \"day\"",
      )
    ).rows[0]!;
    await feature(owner, "reminder", {
      title: "PRIVATE MEDICATION TITLE",
      time: clock.time,
      timezone: "UTC",
      weekdays: [clock.day],
      enabled: true,
    });
    await expect(
      asUser(null, () => db.query("select kinra_push_due('forged')"), "anon"),
    ).rejects.toMatchObject({ code: "42501" });
    const due = () =>
      asUser(
        null,
        () =>
          db.query<{ jobs: { deliveryId: string; locale: string }[] }>(
            "select kinra_push_due($1) jobs",
            [token],
          ),
        "anon",
      );
    const jobs = (await due()).rows[0]!.jobs;
    expect(jobs).toHaveLength(1);
    expect(jobs[0]!.locale).toBe("bs");
    expect(JSON.stringify(jobs)).not.toContain("MEDICATION");
    expect((await due()).rows[0]!.jobs).toHaveLength(0);
    await asUser(
      null,
      () => db.query("select kinra_push_ack($1,$2,201)", [token, jobs[0]!.deliveryId]),
      "anon",
    );
    expect((await due()).rows[0]!.jobs).toHaveLength(0);
    await feature(owner, "notification_preferences", {
      categories: { reminders: true },
      quiet_start: clock.time,
      quiet_end: clock.time === "23:59" ? "00:00" : "23:59",
      timezone: "UTC",
    });
    await feature(owner, "reminder", {
      title: "Quiet reminder",
      time: clock.time,
      timezone: "UTC",
      weekdays: [clock.day],
      enabled: true,
    });
    expect((await due()).rows[0]!.jobs).toHaveLength(0);
    await asUser(owner, () =>
      db.query("delete from feature_records where kind='notification_preferences'"),
    );
    const next = (await due()).rows[0]!.jobs;
    expect(next).toHaveLength(1);
    await asUser(
      null,
      () => db.query("select kinra_push_ack($1,$2,410)", [token, next[0]!.deliveryId]),
      "anon",
    );
    expect(
      (await db.query("select * from device_subscriptions where id=$1", [device])).rows,
    ).toHaveLength(0);
    await expect(
      asUser(owner, () => db.query("select * from push_dispatch_config")),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("initial specialist and organization onboarding", () => {
  it.each([
    ["specialist", "trainer", "program"],
    ["organization", "solo", "organization"],
  ] as const)(
    "atomically completes the %s path without creating connections or staff access",
    async (workspace, role, first_action) => {
      const id = crypto.randomUUID();
      await db.query("insert into auth.users(id,email) values($1,$2)", [
        id,
        `${id}@example.invalid`,
      ]);
      const answers = {
        role,
        workspace,
        first_action,
        display_name: "Synthetic setup",
        goal: "",
        theme: "system",
        language: "de",
        timezone: "Europe/Sarajevo",
        height_cm: null,
      };
      await asUser(id, () =>
        db.query("select kinra_save_onboarding($1,4,true,$2)", [JSON.stringify(answers), id]),
      );
      const result = (
        await asUser(id, () =>
          db.query<{ state: { active: string; primary: string } }>(
            "select kinra_account_workspaces($1) state",
            [id],
          ),
        )
      ).rows[0]!.state;
      expect(result.active).toBe(workspace);
      expect(result.primary).toBe(role);
      expect(
        (await asUser(id, () => db.query("select * from organization_staff"))).rows,
      ).toHaveLength(0);
      expect((await asUser(id, () => db.query("select * from trainer_clients"))).rows).toHaveLength(
        0,
      );
      await asUser(id, () => db.query("select kinra_set_workspace('client',true,$1)", [id]));
      await asUser(id, () =>
        db.query("select kinra_save_onboarding($1,4,true,$2)", [JSON.stringify(answers), id]),
      );
      expect(
        (
          await asUser(id, () =>
            db.query<{ state: { active: string } }>("select kinra_account_workspaces($1) state", [
              id,
            ]),
          )
        ).rows[0]!.state.active,
      ).toBe("client");
      await expect(
        asUser(id, () =>
          db.query("select kinra_save_onboarding($1,4,true,$2)", [
            JSON.stringify({ ...answers, role: "client" }),
            id,
          ]),
        ),
      ).rejects.toMatchObject({ code: "22023" });
    },
  );
});

describe("notification test permission boundary", () => {
  it("cannot reset a claimed test timestamp or inspect another account's device through the claim function", async () => {
    const owner = await freshAccount("solo");
    const other = await freshAccount("solo");
    const endpoint = `https://fcm.googleapis.com/fcm/send/${crypto.randomUUID()}`;
    await asUser(owner, () =>
      db.query(
        "insert into device_subscriptions(endpoint,p256dh,auth_key,locale) values($1,$2,$3,'en')",
        [endpoint, "a".repeat(87), "b".repeat(22)],
      ),
    );
    expect(
      (
        await asUser(owner, () =>
          db.query<{ device: { endpoint: string } }>("select kinra_claim_push_test($1,$2) device", [
            endpoint,
            owner,
          ]),
        )
      ).rows[0]!.device.endpoint,
    ).toBe(endpoint);
    await expect(
      asUser(owner, () => db.query("select kinra_claim_push_test($1,$2)", [endpoint, owner])),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(owner, () =>
        db.query("update device_subscriptions set last_test_at=null where endpoint=$1", [endpoint]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(other, () => db.query("select kinra_claim_push_test($1,$2)", [endpoint, owner])),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(other, () => db.query("select kinra_claim_push_test($1,$2)", [endpoint, other])),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
