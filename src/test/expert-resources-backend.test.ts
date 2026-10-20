// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseFeature, safeExternalUrl } from "../lib/feature-types";
const db = new PGlite();
const [author, reader, other] = [401, 402, 403].map(
  (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
) as [string, string, string];
let expert: string;
let privateExpert: string;
let publicResource: string;
let privateResource: string;
let hiddenResource: string;
const resourceId = "00000000-0000-4000-8000-000000000450";
const path = `${author}/${resourceId}.pdf`;
async function asUser<T>(id: string, fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function feature(actor: string, kind: string, payload: unknown, visibility = "private") {
  return (
    await asUser(actor, () =>
      db.query<{ id: string }>(
        "insert into feature_records(kind,payload,visibility) values($1,$2,$3) returning id",
        [kind, JSON.stringify(payload), visibility],
      ),
    )
  ).rows[0]!.id;
}
const resource = (expertId = expert, storagePath = path) => ({
  expert_id: expertId,
  title: "Synthetic PDF",
  description: "Original author upload",
  storage_path: storagePath,
  filename: "Example.pdf",
  mime: "application/pdf",
  bytes: 25,
});
async function upload(actor: string, storagePath = path, mime = "application/pdf", bytes = 25) {
  return asUser(actor, () =>
    db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('expert-materials',$1,$2)",
      [storagePath, JSON.stringify({ mimetype: mime, size: bytes })],
    ),
  );
}
async function readResource(actor: string, id: string) {
  return (await asUser(actor, () => db.query("select id from feature_records where id=$1", [id])))
    .rows.length;
}
async function readFile(actor: string, storagePath = path) {
  return (
    await asUser(actor, () =>
      db.query("select name from storage.objects where bucket_id='expert-materials' and name=$1", [
        storagePath,
      ]),
    )
  ).rows.length;
}
beforeAll(async () => {
  await db.exec(`create role authenticated;create role anon;create role service_role;create schema auth;create schema storage;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth,storage to authenticated,anon,service_role;
create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb default '{}');alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;`);
  for (const file of readdirSync("drizzle/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
  for (const id of [author, reader, other]) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${id}@example.invalid`]);
    await db.query("insert into user_roles(user_id,role) values($1,'solo')", [id]);
  }
  expert = await feature(
    author,
    "expert",
    {
      name: "Synthetic expert",
      headline: "Self-reported coach",
      city: "Sarajevo",
      languages: ["en"],
      specialties: [],
    },
    "public",
  );
  privateExpert = await feature(author, "expert", {
    name: "Private expert draft",
    headline: "Draft",
    city: "Sarajevo",
    languages: [],
    specialties: [],
  });
}, 30000);
afterAll(() => db.close());
describe("expert PDF resources and self-reported directory fields", () => {
  it("requires a real own-path upload with matching authoritative MIME and byte metadata", async () => {
    await expect(feature(author, "expert_resource", resource(), "public")).rejects.toMatchObject({
      code: "23514",
    });
    await expect(upload(reader, path)).rejects.toMatchObject({ code: "42501" });
    await upload(author);
    publicResource = await feature(author, "expert_resource", resource(), "public");
    await expect(feature(reader, "expert_resource", resource(), "public")).rejects.toMatchObject({
      code: "42501",
    });
    const badPath = `${author}/00000000-0000-4000-8000-000000000451.pdf`;
    await upload(author, badPath, "text/html", 25);
    await expect(
      feature(author, "expert_resource", resource(expert, badPath), "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(author, "expert_resource", { ...resource(), bytes: 26 }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    const ownPath = `${reader}/00000000-0000-4000-8000-000000000452.pdf`;
    await upload(reader, ownPath);
    await expect(
      feature(reader, "expert_resource", resource(expert, ownPath), "public"),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("requires both parent and resource publication for authenticated metadata and Storage reads", async () => {
    const privatePath = `${author}/00000000-0000-4000-8000-000000000453.pdf`;
    await upload(author, privatePath);
    privateResource = await feature(author, "expert_resource", resource(expert, privatePath));
    const hiddenPath = `${author}/00000000-0000-4000-8000-000000000454.pdf`;
    await upload(author, hiddenPath);
    hiddenResource = await feature(
      author,
      "expert_resource",
      resource(privateExpert, hiddenPath),
      "public",
    );
    expect(await readResource(reader, publicResource)).toBe(1);
    expect(await readFile(reader)).toBe(1);
    expect(await readResource(reader, privateResource)).toBe(0);
    expect(await readFile(reader, privatePath)).toBe(0);
    expect(await readResource(reader, hiddenResource)).toBe(0);
    expect(await readFile(reader, hiddenPath)).toBe(0);
    expect(await readResource(author, hiddenResource)).toBe(1);
    expect(await readFile(author, hiddenPath)).toBe(1);
    await asUser(author, () =>
      db.query("update feature_records set visibility='private' where id=$1", [expert]),
    );
    expect(await readResource(reader, publicResource)).toBe(0);
    expect(await readFile(reader)).toBe(0);
    await asUser(author, () =>
      db.query("update feature_records set visibility='public' where id=$1", [expert]),
    );
    expect(await readFile(reader)).toBe(1);
    await asUser(author, () =>
      db.query("update feature_records set visibility='private' where id=$1", [publicResource]),
    );
    expect(await readFile(reader)).toBe(0);
    await asUser(author, () =>
      db.query("update feature_records set visibility='public' where id=$1", [publicResource]),
    );
    await feature(other, "block", { user_id: author });
    expect(await readResource(other, publicResource)).toBe(0);
    expect(await readFile(other)).toBe(0);
  });
  it("keeps file identity immutable, refuses unknown/private extra fields and limits PDF size", async () => {
    await expect(
      asUser(author, () =>
        db.query(
          "update feature_records set payload=jsonb_set(payload,'{expert_id}',to_jsonb($1::text)) where id=$2",
          [privateExpert, publicResource],
        ),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(author, () =>
        db.query(
          "update feature_records set payload=jsonb_set(payload,'{storage_path}',to_jsonb($1::text)) where id=$2",
          [`${author}/00000000-0000-4000-8000-000000000455.pdf`, publicResource],
        ),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(author, "expert_resource", { ...resource(), private_patient: "extra" }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(author, "expert_resource", { ...resource(), mime: "application/msword" }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(author, "expert_resource", { ...resource(), bytes: 10485761 }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(author, "expert_resource", { ...resource(), filename: "bad\nname.pdf" }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("stores explicitly self-reported expert claims and facility details with strict safe links", async () => {
    const facility = await feature(
      author,
      "facility",
      {
        name: "Example studio",
        type: "studio",
        city: "Sarajevo",
        equipment: [],
        amenities: [],
        atmosphere: ["Quiet"],
        rules: "Use clean shoes.",
        map_url: "https://maps.example.test/place?id=1",
        tour_url: "https://video.example.test/tour",
        promotion: {
          title: "Example offer",
          url: "https://example.test/offer",
          valid_until: "2030-01-01",
        },
      },
      "public",
    );
    const richer = {
      name: "Synthetic expert",
      headline: "Self-reported experience",
      city: "Sarajevo",
      languages: ["en"],
      specialties: ["Strength"],
      experience_years: 3,
      clients_count: 25,
      sports: ["Running"],
      education: ["Self-reported course"],
      facility_ids: [facility],
    };
    await asUser(author, () =>
      db.query("update feature_records set payload=$1 where id=$2", [
        JSON.stringify(richer),
        expert,
      ]),
    );
    expect(parseFeature("expert", richer).experience_years).toBe(3);
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "https://user:password@example.test/x",
      "https://example.test/\nresource",
      "https://example.test\\@evil.test",
    ]) {
      expect(safeExternalUrl(url)).toBe(false);
      await expect(
        feature(
          author,
          "facility",
          { name: "Bad", type: "studio", city: "X", equipment: [], amenities: [], map_url: url },
          "public",
        ),
      ).rejects.toMatchObject({ code: "23514" });
    }
    await expect(
      feature(author, "expert", { ...richer, experience_years: -1 }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    const privateFacility = await feature(reader, "facility", {
      name: "Private",
      type: "studio",
      city: "X",
      equipment: [],
      amenities: [],
    });
    await expect(
      feature(author, "expert", { ...richer, facility_ids: [privateFacility] }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      feature(
        author,
        "facility",
        {
          name: "Bad",
          type: "studio",
          city: "X",
          equipment: [],
          amenities: [],
          promotion: {
            title: "Offer",
            url: "https://example.test",
            valid_until: "2030-02-30",
            extra: "no",
          },
        },
        "public",
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("revokes public file reads immediately on unlink and keeps deletion owner-scoped", async () => {
    const strangerDeletion = await asUser(reader, () =>
      db.query("delete from feature_records where id=$1 returning id", [publicResource]),
    );
    expect(strangerDeletion.rows).toHaveLength(0);
    const foreignFileDelete = await asUser(reader, () =>
      db.query(
        "delete from storage.objects where bucket_id='expert-materials' and name=$1 returning id",
        [path],
      ),
    );
    expect(foreignFileDelete.rows).toHaveLength(0);
    await asUser(author, () =>
      db.query("delete from feature_records where id=$1", [publicResource]),
    );
    expect(await readFile(reader)).toBe(0);
    expect(await readFile(author)).toBe(1);
    await asUser(author, () =>
      db.query("delete from storage.objects where bucket_id='expert-materials' and name=$1", [
        path,
      ]),
    );
    expect(await readFile(author)).toBe(0);
    const bucket = (
      await db.query<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }>(
        "select * from storage.buckets where id='expert-materials'",
      )
    ).rows[0]!;
    expect(bucket.public).toBe(false);
    expect(Number(bucket.file_size_limit)).toBe(10485760);
    expect(bucket.allowed_mime_types).toEqual(["application/pdf"]);
  });
});
