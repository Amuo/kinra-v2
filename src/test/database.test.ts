// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

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
  });
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
