// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const db = new PGlite();
const [owner, moderator, member, outsider, otherModerator] = Array.from(
  { length: 5 },
  (_, n) => `00000000-0000-4000-8000-${String(n + 201).padStart(12, "0")}`,
) as [string, string, string, string, string];
let secret: string;
let publicGroup: string;
let ownerPost: string;
let memberPost: string;
async function asUser<T>(id: string | null, work: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  try {
    return await work();
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
async function admin<T = unknown>(
  actor: string,
  action: string,
  groupId: string | null = secret,
  data = {},
) {
  return (
    await asUser(actor, () =>
      db.query<{ result: T }>("select kinra_community_admin($1,$2,$3,$4) result", [
        action,
        groupId,
        JSON.stringify(data),
        actor,
      ]),
    )
  ).rows[0]!.result;
}
async function invite(actor = owner, groupId = secret) {
  return admin<{ code: string }>(actor, "createInvite", groupId, {
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  });
}
async function redeem(actor: string, code: string, accept = true) {
  return (
    await asUser(actor, () =>
      db.query<{ result: { accepted: boolean; title: string } }>(
        "select kinra_community_redeem($1,$2,$3) result",
        [code, accept, actor],
      ),
    )
  ).rows[0]!.result;
}
async function visible(actor: string, id: string) {
  return (await asUser(actor, () => db.query("select id from feature_records where id=$1", [id])))
    .rows.length;
}
beforeAll(async () => {
  await db.exec(`create role authenticated;create role anon;create role service_role;create schema auth;create schema storage;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth,storage to authenticated,anon,service_role;
create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;`);
  for (const file of readdirSync("drizzle/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
  for (const id of [owner, moderator, member, outsider, otherModerator]) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${id}@example.invalid`]);
    await db.query("insert into user_roles(user_id,role) values($1,'solo')", [id]);
    await db.query("update profiles set display_name=$1 where id=$2", [
      `Group person ${id.slice(-3)}`,
      id,
    ]);
  }
  secret = await feature(owner, "group", {
    title: "Synthetic private group",
    description: "Private content",
    type: "club",
  });
  publicGroup = await feature(
    owner,
    "group",
    { title: "Synthetic public group", description: "Public discovery", type: "interest" },
    "public",
  );
  ownerPost = await feature(owner, "post", {
    body: "Private owner post",
    category: "General",
    group_id: secret,
  });
  await db.query("insert into workouts(user_id,title) values($1,'Private exercise history')", [
    member,
  ]);
}, 30000);
afterAll(() => db.close());

describe("private communities and moderation", () => {
  it("keeps private discovery and content hidden and disallows direct private membership writes", async () => {
    expect(await visible(outsider, secret)).toBe(0);
    expect(await visible(outsider, ownerPost)).toBe(0);
    expect((await admin<{ id: string }[]>(outsider, "list", null)).map((g) => g.id)).toEqual([
      publicGroup,
    ]);
    await expect(admin(outsider, "join")).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(outsider, () =>
        db.query("insert into community_members(group_id,user_id) values($1,$2)", [
          secret,
          outsider,
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(feature(outsider, "group_member", { group_id: secret })).rejects.toMatchObject({
      code: "23514",
    });
    await expect(
      feature(
        outsider,
        "post",
        { body: "Not a member", category: "General", group_id: publicGroup },
        "public",
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("previews manual codes and accepts once with account, expiry and revocation checks", async () => {
    const invitation = await invite();
    expect((await redeem(member, invitation.code, false)).title).toBe("Synthetic private group");
    expect(await visible(member, secret)).toBe(0);
    expect((await redeem(member, invitation.code)).accepted).toBe(true);
    expect((await redeem(member, invitation.code)).accepted).toBe(true);
    await expect(redeem(outsider, invitation.code)).rejects.toMatchObject({ code: "42501" });
    expect(await visible(member, secret)).toBe(1);
    expect(await visible(member, ownerPost)).toBe(1);
    const revoked = await invite();
    await admin(owner, "revokeInvite", secret, { code: revoked.code });
    await expect(redeem(outsider, revoked.code)).rejects.toMatchObject({ code: "42501" });
    const expired = await invite();
    await db.query(
      "update community_invites set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where code=$1",
      [expired.code],
    );
    await expect(redeem(outsider, expired.code)).rejects.toMatchObject({ code: "42501" });
    const usable = await invite();
    await expect(
      asUser(null, () =>
        db.query("select kinra_community_redeem($1,true,$2)", [usable.code, member]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(member, () =>
        db.query("select kinra_community_redeem($1,true,$2)", [usable.code, outsider]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("allows member-only private posts and reactions without exposing health/profile records", async () => {
    memberPost = await feature(member, "post", {
      body: "Private member post",
      category: "General",
      group_id: secret,
    });
    expect(await visible(owner, memberPost)).toBe(1);
    expect(await visible(outsider, memberPost)).toBe(0);
    await feature(member, "reaction", { subject_id: ownerPost, type: "like" });
    await expect(
      feature(member, "post", { body: "Leak", category: "General", group_id: secret }, "public"),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(member, () =>
        db.query(
          "update feature_records set payload=payload-'group_id',visibility='public' where id=$1",
          [memberPost],
        ),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      asUser(member, () =>
        db.query(
          "update feature_records set payload=jsonb_set(payload,'{group_id}',to_jsonb($1::text)) where id=$2",
          [publicGroup, memberPost],
        ),
      ),
    ).rejects.toMatchObject({ code: "23514" });
    const members = await admin<{ userId: string; displayName: string }[]>(member, "members");
    expect(members.some((m) => m.userId === owner)).toBe(true);
    expect(members.find((m) => m.userId === member)?.displayName).toBe("Group person 203");
    expect(
      (await asUser(owner, () => db.query("select * from workouts where user_id=$1", [member])))
        .rows,
    ).toHaveLength(0);
    expect(
      (await asUser(owner, () => db.query("select * from profiles where id=$1", [member]))).rows,
    ).toHaveLength(0);
  });
  it("makes public self join idempotent and keeps private posts member-only even in public groups", async () => {
    await admin(member, "join", publicGroup);
    await admin(member, "join", publicGroup);
    const privatePost = await feature(owner, "post", {
      body: "Public group, members only",
      category: "General",
      group_id: publicGroup,
    });
    expect(await visible(member, privatePost)).toBe(1);
    expect(await visible(outsider, privatePost)).toBe(0);
    await admin(member, "leave", publicGroup);
    expect(await visible(member, privatePost)).toBe(0);
    await feature(member, "group_member", { group_id: publicGroup }, "public");
    expect(await visible(member, privatePost)).toBe(1);
  });
  it("only lets owner grant moderators and prevents moderator removal of peers or owner", async () => {
    await redeem(moderator, (await invite()).code);
    await redeem(otherModerator, (await invite()).code);
    await admin(owner, "setModerator", secret, { userId: moderator, enabled: true });
    await admin(owner, "setModerator", secret, { userId: otherModerator, enabled: true });
    await expect(
      admin(member, "setModerator", secret, { userId: member, enabled: true }),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(member, () =>
        db.query("insert into community_moderators(group_id,user_id) values($1,$2)", [
          secret,
          member,
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(admin(moderator, "kick", secret, { userId: owner })).rejects.toMatchObject({
      code: "42501",
    });
    await expect(
      admin(moderator, "kick", secret, { userId: otherModerator }),
    ).rejects.toMatchObject({ code: "42501" });
    const role = (await admin<{ id: string; role: string }[]>(moderator, "list", null)).find(
      (g) => g.id === secret,
    )?.role;
    expect(role).toBe("moderator");
    await expect(
      admin(moderator, "setModerator", secret, { userId: member, enabled: true }),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("lets moderators remove posts, revokes kicked access and rejects old invitations and direct rejoin bypasses", async () => {
    await expect(admin(member, "removePost", secret, { postId: ownerPost })).rejects.toMatchObject({
      code: "42501",
    });
    await admin(moderator, "removePost", secret, { postId: memberPost });
    expect(await visible(member, memberPost)).toBe(0);
    const beforeRemoval = await invite();
    await admin(moderator, "kick", secret, { userId: member });
    expect(await visible(member, secret)).toBe(0);
    expect(await visible(member, ownerPost)).toBe(0);
    await expect(redeem(member, beforeRemoval.code)).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(member, () =>
        db.query("insert into community_members(group_id,user_id) values($1,$2)", [secret, member]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(feature(member, "group_member", { group_id: secret })).rejects.toMatchObject({
      code: "42501",
    });
    const fresh = await invite(moderator);
    await redeem(member, fresh.code);
    expect(await visible(member, ownerPost)).toBe(1);
    await admin(owner, "kick", publicGroup, { userId: member });
    await expect(admin(member, "join", publicGroup)).rejects.toMatchObject({ code: "42501" });
    await expect(
      feature(member, "group_member", { group_id: publicGroup }, "public"),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("lets a moderator leave, removes their role and honors blocks with immediate shared-access revocation", async () => {
    await admin(moderator, "leave");
    expect(await visible(moderator, ownerPost)).toBe(0);
    await expect(
      admin(moderator, "createInvite", secret, {
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(admin(owner, "leave")).rejects.toMatchObject({ code: "22023" });
    await feature(member, "block", { user_id: owner });
    expect(await visible(member, ownerPost)).toBe(0);
    expect((await admin<{ id: string }[]>(member, "list", null)).some((g) => g.id === secret)).toBe(
      false,
    );
    const newCode = await invite();
    await expect(redeem(member, newCode.code)).rejects.toMatchObject({ code: "42501" });
  });
});
