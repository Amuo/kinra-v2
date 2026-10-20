// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { availabilitySchema, membershipSchema } from "../lib/organizations";

const db = new PGlite();
const [owner, manager, staff, member, stranger, coach, secondClient] = Array.from(
  { length: 7 },
  (_, n) => `00000000-0000-4000-8000-${String(n + 101).padStart(12, "0")}`,
) as [string, string, string, string, string, string, string];
let org: string;
let privateOrg: string;
let plan: string;
async function asUser<T>(id: string | null, fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function admin<T = unknown>(
  actor: string,
  action: string,
  organizationId: string | null = org,
  data = {},
) {
  return (
    await asUser(actor, () =>
      db.query<{ result: T }>("select kinra_org_admin($1,$2,$3,$4) as result", [
        action,
        organizationId,
        JSON.stringify(data),
        actor,
      ]),
    )
  ).rows[0]!.result;
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
async function redeem(actor: string, code: string, accept = true) {
  return (
    await asUser(actor, () =>
      db.query<{ result: { accepted: boolean } }>("select kinra_org_redeem($1,$2,$3) result", [
        code,
        accept,
        actor,
      ]),
    )
  ).rows[0]!.result;
}
async function saveAvailability(actor: string, payload: unknown) {
  return asUser(actor, () =>
    db.query("select kinra_save_availability($1,$2)", [JSON.stringify(payload), actor]),
  );
}
const weekly = {
  timezone: "Europe/Sarajevo",
  published: true,
  rules: [{ weekday: 1, start: "09:00", end: "12:00", slotMinutes: 60 }],
  exceptions: [],
};
async function slots(actor: string, from = "2030-01-07", to = from) {
  return (
    await asUser(actor, () =>
      db.query<{ result: { startsAt: string; endsAt: string }[] }>(
        "select kinra_available_slots($1,$2,$3,$4) result",
        [coach, from, to, actor],
      ),
    )
  ).rows[0]!.result;
}
beforeAll(async () => {
  await db.exec(`create role authenticated;create role anon;create role service_role;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth,storage to authenticated,anon,service_role;
 create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;`);
  for (const file of readdirSync("drizzle/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
  for (const id of [owner, manager, staff, member, stranger, coach, secondClient]) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, `${id}@example.invalid`]);
    await db.query("update profiles set display_name=$1 where id=$2", [
      `Person ${id.slice(-3)}`,
      id,
    ]);
  }
  await db.query(
    "insert into user_roles(user_id,role) values($1,'solo'),($2,'solo'),($3,'solo'),($4,'client'),($5,'solo'),($6,'trainer'),($7,'client')",
    [owner, manager, staff, member, stranger, coach, secondClient],
  );
  await db.query("insert into trainer_clients(trainer_id,client_id) values($1,$2),($1,$3)", [
    coach,
    member,
    secondClient,
  ]);
  org = await feature(
    owner,
    "organization",
    { name: "Synthetic studio", city: "Sarajevo", description: "Bookkeeping only" },
    "public",
  );
  privateOrg = await feature(owner, "organization", { name: "Private studio", city: "Sarajevo" });
  plan = await feature(
    owner,
    "membership_plan",
    {
      organization_id: org,
      title: "Monthly example",
      amount: 30,
      currency: "BAM",
      period: "month",
    },
    "public",
  );
  await feature(member, "organization_member", { organization_id: org });
  await db.query("insert into workouts(user_id,title) values($1,'Private workout')", [member]);
}, 30000);
afterAll(() => db.close());

describe("organization authority and membership bookkeeping", () => {
  it("does not grant staff authority through organization workspace selection or self-joining", async () => {
    await asUser(stranger, () =>
      db.query("select kinra_set_workspace('organization',true,$1)", [stranger]),
    );
    expect(await admin(stranger, "list", null)).toEqual([]);
    expect(await admin(member, "list", null)).toEqual([]);
    await expect(
      asUser(stranger, () =>
        db.query(
          "insert into organization_staff(organization_id,user_id,role) values($1,$2,'manager')",
          [org, stranger],
        ),
      ),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(admin(stranger, "members")).rejects.toMatchObject({ code: "42501" });
    expect((await admin<unknown[]>(owner, "list", null)).length).toBe(2);
  });
  it("previews, accepts once, retries idempotently and blocks other recipients", async () => {
    const invite = await admin<{ code: string }>(owner, "createInvite", org, {
      role: "manager",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect((await redeem(manager, invite.code, false)).accepted).toBe(false);
    expect(await admin(manager, "list", null)).toEqual([]);
    expect((await redeem(manager, invite.code)).accepted).toBe(true);
    expect((await redeem(manager, invite.code)).accepted).toBe(true);
    await expect(redeem(stranger, invite.code)).rejects.toMatchObject({ code: "42501" });
    expect((await admin<{ role: string }[]>(manager, "list", null))[0]?.role).toBe("manager");
    await expect(
      admin(manager, "createInvite", org, {
        role: "staff",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(manager, () =>
        db.query("select kinra_org_redeem($1,true,$2)", [invite.code, stranger]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("enforces revocation and expiry, including against unused codes", async () => {
    const revoked = await admin<{ code: string }>(owner, "createInvite", org, {
      role: "staff",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    await admin(owner, "revokeInvite", org, { code: revoked.code });
    await expect(redeem(staff, revoked.code)).rejects.toMatchObject({ code: "42501" });
    const expired = await admin<{ code: string }>(owner, "createInvite", org, {
      role: "staff",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    await db.query(
      "update organization_invites set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where code=$1",
      [expired.code],
    );
    await expect(redeem(staff, expired.code)).rejects.toMatchObject({ code: "42501" });
    const live = await admin<{ code: string }>(owner, "createInvite", org, {
      role: "staff",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    await redeem(staff, live.code);
  });
  it("lets managers record a real joined member, hides finance from staff and grants no health access", async () => {
    const input = {
      userId: member,
      status: "active",
      startDate: "2026-10-19",
      endDate: "2026-11-19",
      planId: plan,
      paidAmount: 30,
      currency: "BAM",
      notes: "Synthetic cash receipt, no online charge",
    };
    await admin(manager, "saveMembership", org, input);
    const roster = await admin<
      { displayName: string; membership: { paidAmount: number; status: string } }[]
    >(manager, "members");
    expect(roster[0]?.displayName).toBe("Person 104");
    expect(roster[0]?.membership.paidAmount).toBe(30);
    const readonly = await admin<{ membership: { paidAmount: null; notes: string } }[]>(
      staff,
      "members",
    );
    expect(readonly[0]?.membership.paidAmount).toBeNull();
    expect(readonly[0]?.membership.notes).toBe("");
    expect(
      (await asUser(staff, () => db.query("select * from organization_membership_finance"))).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(stranger, () => db.query("select * from organization_memberships"))).rows,
    ).toHaveLength(0);
    expect(
      (await asUser(staff, () => db.query("select * from workouts where user_id=$1", [member])))
        .rows,
    ).toHaveLength(0);
    expect(
      (await asUser(staff, () => db.query("select * from profiles where id=$1", [member]))).rows,
    ).toHaveLength(0);
    await expect(
      admin(staff, "saveMembership", org, { ...input, status: "ended" }),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      admin(manager, "saveMembership", org, { ...input, userId: stranger }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      admin(manager, "saveMembership", org, { ...input, endDate: "2026-01-01" }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(admin(manager, "members", privateOrg)).rejects.toMatchObject({ code: "42501" });
    expect(
      membershipSchema.safeParse({ ...input, organizationId: org, endDate: "2026-01-01" }).success,
    ).toBe(false);
  });
  it("only lets owner change or revoke staff and never revives a used invitation", async () => {
    await expect(
      admin(manager, "setStaffRole", org, { userId: staff, role: "manager" }),
    ).rejects.toMatchObject({ code: "42501" });
    await admin(owner, "setStaffRole", org, { userId: staff, role: "manager" });
    expect((await admin<{ role: string }[]>(staff, "list", null))[0]?.role).toBe("manager");
    await admin(owner, "removeStaff", org, { userId: staff });
    await expect(admin(staff, "members")).rejects.toMatchObject({ code: "42501" });
    const invites = await admin<{ code: string; usedBy: string | null }[]>(owner, "invites");
    const used = invites.find((i) => i.usedBy === staff)!;
    await expect(redeem(staff, used.code)).rejects.toMatchObject({ code: "42501" });
  });
});

describe("privacy-safe published coach availability", () => {
  it("validates timezone, recurrence, exceptions and role with real RLS", async () => {
    await expect(saveAvailability(member, weekly)).rejects.toMatchObject({ code: "42501" });
    await expect(
      saveAvailability(coach, { ...weekly, timezone: "Wrong/Zone" }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      saveAvailability(coach, { ...weekly, rules: [...weekly.rules, ...weekly.rules] }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      saveAvailability(coach, {
        ...weekly,
        rules: [{ weekday: 1, start: "11:00", end: "10:00", slotMinutes: 60 }],
      }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      saveAvailability(coach, {
        ...weekly,
        exceptions: [{ date: "2030-02-30", unavailable: true }],
      }),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      saveAvailability(coach, { timezone: "UTC", rules: [], exceptions: [] }),
    ).rejects.toMatchObject({ code: "23514" });
    expect(
      availabilitySchema.safeParse({
        ...weekly,
        exceptions: [{ date: "2030-01-07", unavailable: false }],
      }).success,
    ).toBe(false);
    await saveAvailability(coach, weekly);
    const free = await slots(member);
    expect(free).toHaveLength(3);
    expect(new Date(free[0]!.startsAt).toISOString()).toBe("2030-01-07T08:00:00.000Z");
    await expect(
      asUser(member, () =>
        db.query("select kinra_available_slots($1,$2,$3,$4)", [
          coach,
          "2030-01-01",
          "2030-03-01",
          member,
        ]),
      ),
    ).rejects.toMatchObject({ code: "22023" });
  });
  it("reserves pending slots atomically, with no other client identity in free/busy", async () => {
    const appointment = {
      coach_id: coach,
      starts_at: "2030-01-07T08:00:00Z",
      ends_at: "2030-01-07T09:00:00Z",
      status: "requested",
    };
    const id = await feature(member, "appointment", appointment);
    await expect(feature(secondClient, "appointment", appointment)).rejects.toMatchObject({
      code: "23505",
    });
    await expect(
      feature(secondClient, "appointment", {
        ...appointment,
        starts_at: "2030-01-07T08:15:00Z",
        ends_at: "2030-01-07T09:15:00Z",
      }),
    ).rejects.toMatchObject({ code: "23514" });
    const free = await slots(secondClient);
    expect(free).toHaveLength(2);
    expect(JSON.stringify(free)).not.toContain(member);
    expect(JSON.stringify(free)).not.toContain(id);
    expect(
      (
        await asUser(secondClient, () =>
          db.query("select id from feature_records where id=$1", [id]),
        )
      ).rows,
    ).toHaveLength(0);
    await asUser(member, () =>
      db.query(
        "update feature_records set payload=jsonb_set(payload,'{status}','\"cancelled\"') where id=$1",
        [id],
      ),
    );
    expect(await slots(secondClient)).toHaveLength(3);
  });
  it("replaces date hours, closes dates and skips DST-invalid durations", async () => {
    await saveAvailability(coach, {
      ...weekly,
      exceptions: [
        { date: "2030-01-07", unavailable: false, start: "13:00", end: "14:00", slotMinutes: 30 },
      ],
    });
    const exceptional = await slots(member);
    expect(exceptional).toHaveLength(2);
    expect(new Date(exceptional[0]!.startsAt).toISOString()).toBe("2030-01-07T12:00:00.000Z");
    await saveAvailability(coach, {
      ...weekly,
      exceptions: [{ date: "2030-01-07", unavailable: true }],
    });
    expect(await slots(member)).toEqual([]);
    await saveAvailability(coach, {
      ...weekly,
      rules: [{ weekday: 0, start: "01:00", end: "04:00", slotMinutes: 60 }],
    });
    const dst = await slots(member, "2030-03-31");
    expect(dst).toHaveLength(1);
    expect(new Date(dst[0]!.startsAt).toISOString()).toBe("2030-03-31T01:00:00.000Z");
  });
  it("preserves legacy requests without published hours and permits later cancellation", async () => {
    await saveAvailability(coach, { ...weekly, published: false });
    const id = await feature(member, "appointment", {
      coach_id: coach,
      starts_at: "2030-01-08T18:15:00Z",
      ends_at: "2030-01-08T19:00:00Z",
      status: "requested",
    });
    await saveAvailability(coach, weekly);
    await asUser(coach, () => db.query("select kinra_respond_appointment($1,'confirmed')", [id]));
    await asUser(member, () => db.query("select kinra_respond_appointment($1,'cancelled')", [id]));
    await expect(
      asUser(null, () =>
        db.query("select kinra_available_slots($1,$2,$3,$4)", [
          coach,
          "2030-01-07",
          "2030-01-07",
          member,
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
});
