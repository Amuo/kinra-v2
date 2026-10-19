// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("installs the production namespace alongside legacy data and enforces account isolation", async () => {
  const db = new PGlite();
  const alice = "10000000-0000-4000-8000-000000000001";
  const bob = "10000000-0000-4000-8000-000000000002";
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public,auth,storage to authenticated,anon,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to authenticated;
      create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
      create table profiles(id text primary key, legacy text);
      insert into profiles values('legacy','preserve me');
      create table workouts(id text primary key, legacy text);
      insert into workouts values('legacy','preserve me');
    `);
    await db.query("insert into auth.users(id,email) values($1,'alice@example.invalid')", [alice]);
    await db.exec(readFileSync("supabase/migrations/202610140001_kinra_v2.sql", "utf8"));
    await db.query("insert into auth.users(id,email) values($1,'bob@example.invalid')", [bob]);
    expect((await db.query("select * from profiles")).rows).toEqual([
      { id: "legacy", legacy: "preserve me" },
    ]);
    expect((await db.query("select * from workouts")).rows).toHaveLength(1);
    expect((await db.query("select * from kinra_v2_profiles")).rows).toHaveLength(2);
    await db.query("insert into kinra_v2_workouts(user_id,title) values($1,'Private')", [alice]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [bob]);
    expect((await db.query("select * from kinra_v2_workouts")).rows).toHaveLength(0);
    await expect(
      db.query("insert into kinra_v2_workouts(user_id,title) values($1,'Forged')", [alice]),
    ).rejects.toMatchObject({ code: "42501" });
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [alice]);
    expect((await db.query("select * from kinra_v2_workouts")).rows).toHaveLength(1);
    await db.exec("reset role; set role anon");
    await expect(
      db.exec("select * from kinra_v2_find_trainer_by_code('ABC123')"),
    ).rejects.toMatchObject({ code: "42501" });
    await db.exec("reset role");
    const buckets = (
      await db.query<{ id: string; public: boolean }>("select id,public from storage.buckets")
    ).rows;
    expect(buckets.map((bucket) => bucket.id).sort()).toEqual([
      "kinra-v2-profile-avatars",
      "kinra-v2-progress-photos",
    ]);
    expect(buckets.every((bucket) => !bucket.public)).toBe(true);
  } finally {
    await db.close();
  }
}, 30000);

it("upgrades an existing v2 database without rerunning installation or rewriting logs", async () => {
  const db = new PGlite();
  const owner = "20000000-0000-4000-8000-000000000001";
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public,auth,storage to authenticated,anon,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to authenticated;
      create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
    `);
    const install = readFileSync("supabase/migrations/202610140001_kinra_v2.sql", "utf8");
    const boundary = install.indexOf("-- Source: 0004_feature_schemas.sql");
    expect(boundary).toBeGreaterThan(0);
    await db.exec(install.slice(0, boundary) + "\nCOMMIT;");
    await db.query("insert into auth.users(id,email) values($1,'upgrade@example.invalid')", [
      owner,
    ]);
    await db.query(
      "insert into kinra_v2_workouts(user_id,title,sets) values($1,'Keep this historical workout',$2)",
      [owner, JSON.stringify([{ exercise: "Historical lift", reps: 8, weight: 20 }])],
    );
    const before = (await db.query("select * from kinra_v2_workouts")).rows;
    await db.exec(readFileSync("supabase/migrations/202610190001_features.sql", "utf8"));
    expect((await db.query("select * from kinra_v2_workouts")).rows).toEqual(before);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [owner]);
    await db.query("insert into kinra_v2_feature_records(kind,payload) values('measurement',$1)", [
      JSON.stringify({ type: "waist", value: 80, unit: "cm", date: "2026-10-19" }),
    ]);
    expect(
      (await db.query("select payload->>'date' as date from kinra_v2_feature_records")).rows,
    ).toEqual([{ date: "2026-10-19" }]);
  } finally {
    await db.close();
  }
}, 30000);
