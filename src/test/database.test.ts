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

beforeAll(async () => {
  await db.exec(`
    create role authenticated; create role anon; create role service_role;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
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
    ).rejects.toMatchObject({ code: "23514" });
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
      await db.query<{ public: boolean; allowed_mime_types: string[] }>(
        "select * from storage.buckets",
      )
    ).rows;
    expect(buckets).toHaveLength(2);
    expect(
      buckets.every((bucket) => !bucket.public && bucket.allowed_mime_types.includes("image/jpeg")),
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
