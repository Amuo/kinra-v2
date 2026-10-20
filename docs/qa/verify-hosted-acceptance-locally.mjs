// Local rehearsal only. This file never connects to Supabase or any network.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
try {
  await db.exec(`create role authenticated;create role anon;create role service_role;
  create schema auth;create schema storage;
  create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema public,auth,storage to authenticated,anon,service_role;
  create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb default '{}');
  alter table storage.objects enable row level security;
  grant select,insert,update,delete on storage.objects to authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;`);
  await db.exec(
    readFileSync(
      new URL("../../supabase/migrations/202610140001_kinra_v2.sql", import.meta.url),
      "utf8",
    ),
  );
  const results = await db.exec(
    readFileSync(new URL("./2026-10-19-hosted-rls-acceptance.sql", import.meta.url), "utf8"),
  );
  console.log(JSON.stringify(results.at(-1)?.rows, null, 2));
} finally {
  await db.close();
}
