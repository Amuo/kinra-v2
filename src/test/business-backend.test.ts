// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
const db = new PGlite();
const owner = "00000000-0000-4000-8000-000000000701",
  staff = "00000000-0000-4000-8000-000000000702",
  member = "00000000-0000-4000-8000-000000000703",
  outsider = "00000000-0000-4000-8000-000000000704";
let bid: string, other: string;
const location = crypto.randomUUID(),
  pool = crypto.randomUUID(),
  resource = crypto.randomUUID(),
  plan = crypto.randomUUID(),
  person = crypto.randomUUID(),
  second = crypto.randomUUID(),
  membership = crypto.randomUUID();
async function as<T>(actor: string | null, fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [actor ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function call<T = unknown>(
  actor: string,
  action: string,
  data: object = {},
  id: string | null = bid,
  expected = actor,
) {
  return (
    await as(actor, () =>
      db.query<{ value: T }>("select kinra_business($1,$2,$3,$4) value", [
        action,
        id,
        JSON.stringify(data),
        expected,
      ]),
    )
  ).rows[0]!.value;
}
beforeAll(async () => {
  await db.exec(`create role authenticated;create role anon;create role service_role;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth,storage to authenticated,anon,service_role;
 create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;`);
  for (const file of readdirSync("drizzle/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("drizzle/migrations/" + file, "utf8"));
  for (const id of [owner, staff, member, outsider]) {
    await db.query("insert into auth.users(id,email) values($1,$2)", [id, id + "@example.invalid"]);
    await db.query("insert into user_roles(user_id,role) values($1,'solo')", [id]);
  }
  bid = await call(
    owner,
    "setup",
    {
      name: "Synthetic multi-sport",
      sector: "sports_complex",
      timezone: "Europe/Sarajevo",
      currency: "BAM",
    },
    null,
  );
  other = await call(
    outsider,
    "setup",
    { name: "Unrelated club", sector: "football", timezone: "Europe/Belgrade", currency: "RSD" },
    null,
  );
  await db.query(
    "insert into organization_staff(organization_id,user_id,role) values($1,$2,'staff')",
    [bid, staff],
  );
}, 30000);
afterAll(() => db.close());
describe("Kinra Business authority and atomic operations", () => {
  it("creates private business, denies outsider and forged actor, and validates timezones", async () => {
    expect((await call<unknown[]>(owner, "list", {}, null)).length).toBe(1);
    await expect(call(outsider, "snapshot")).rejects.toThrow("Business access");
    await expect(call(owner, "list", {}, null, outsider)).rejects.toThrow("account changed");
    await expect(
      call(
        owner,
        "setup",
        { name: "Invalid", sector: "gym", timezone: "Wrong/Zone", currency: "BAM" },
        null,
      ),
    ).rejects.toThrow("timezone");
    expect(
      (await as(outsider, () => db.query("select * from business_profiles where id=$1", [bid])))
        .rows,
    ).toHaveLength(0);
  });
  it("manages branches/resources/plans and independent member rosters with cross-business rejection", async () => {
    for (const [id, name, capacity] of [
      [location, "Gym", 1],
      [pool, "Pool", 10],
    ] as const)
      await call(owner, "saveLocation", {
        id,
        name,
        city: "Sarajevo",
        address: "Demo",
        capacity,
        active: true,
      });
    await call(owner, "saveResource", {
      id: resource,
      locationId: pool,
      name: "Lane 1",
      kind: "lane",
      capacity: 2,
      active: true,
    });
    await call(owner, "savePlan", {
      id: plan,
      name: "Two visits",
      durationDays: 30,
      visitLimit: 2,
      priceMinor: 2000,
      locationIds: [location, pool],
      active: true,
    });
    for (const [id, name, number] of [
      [person, "Demo person", "A1"],
      [second, "Second person", "A2"],
    ])
      await call(owner, "saveMember", {
        id,
        name,
        number,
        email: "",
        phone: "",
        group: "Adults",
        status: "active",
      });
    await expect(
      call(staff, "saveMember", {
        id: crypto.randomUUID(),
        name: "No",
        number: "No",
        status: "active",
      }),
    ).rejects.toThrow("manager");
    await expect(
      call(
        outsider,
        "saveLocation",
        { id: location, name: "Overwrite", city: "", address: "", capacity: null, active: true },
        other,
      ),
    ).rejects.toThrow("another business");
    expect(
      (
        await db.query<{ name: string }>("select name from business_locations where id=$1", [
          location,
        ])
      ).rows[0]!.name,
    ).toBe("Gym");
    await expect(
      call(owner, "savePlan", {
        id: crypto.randomUUID(),
        name: "Invalid scope",
        durationDays: 2,
        visitLimit: null,
        priceMinor: 0,
        locationIds: [crypto.randomUUID()],
        active: true,
      }),
    ).rejects.toThrow("locations");
    for (const [id, memberId] of [
      [membership, person],
      [crypto.randomUUID(), second],
    ])
      await call(owner, "saveMembership", {
        id,
        memberId,
        planId: plan,
        startDate: "2020-01-01",
        endDate: "2099-12-31",
        status: "active",
      });
  });
  it("links member through reviewed opaque invitation and issues short-lived one-use QR without PII", async () => {
    const claim = await call<{ code: string }>(owner, "createClaim", { memberId: person });
    const preview = await call<{ memberName: string }>(
      member,
      "inspectClaim",
      { code: claim.code },
      null,
    );
    expect(preview.memberName).toBe("Demo person");
    await call(member, "redeemClaim", { code: claim.code }, null);
    await call(member, "redeemClaim", { code: claim.code }, null);
    await expect(call(outsider, "redeemClaim", { code: claim.code }, null)).rejects.toThrow(
      "invalid or expired",
    );
    const portal = await call<{ member: { id: string }; memberships: unknown[] }[]>(
      member,
      "myMemberships",
      {},
      null,
    );
    expect(portal[0]!.member.id).toBe(person);
    expect(portal[0]!.memberships).toHaveLength(1);
    const pass = await call<{ token: string; expiresAt: string }>(member, "issuePass", {
      memberId: person,
    });
    expect(pass.token).toMatch(/^kb1:[0-9a-f]{64}$/);
    expect(Date.parse(pass.expiresAt) - Date.now()).toBeLessThanOrEqual(91000);
    const requestId = crypto.randomUUID();
    const data = { locationId: location, token: pass.token, requestId };
    const entry = await call<{ decision: string; remainingVisits: number; visit: { id: string } }>(
      staff,
      "checkIn",
      data,
    );
    expect(entry.decision).toBe("allowed");
    expect(entry.remainingVisits).toBe(1);
    const retry = await call<{ alreadyRecorded: boolean; visit: { id: string } }>(
      staff,
      "checkIn",
      data,
    );
    expect(retry.alreadyRecorded).toBe(true);
    expect(retry.visit.id).toBe(entry.visit.id);
    await expect(call(staff, "checkIn", { ...data, locationId: pool })).rejects.toThrow(
      "Request identity conflict",
    );
    expect(
      (
        await call<{ reason: string }>(staff, "checkIn", {
          ...data,
          requestId: crypto.randomUUID(),
        })
      ).reason,
    ).toBe("pass_used");
    expect(
      (
        await call<{ decision: string }>(staff, "checkIn", {
          locationId: pool,
          memberId: person,
          requestId: crypto.randomUUID(),
        })
      ).decision,
    ).toBe("already_inside");
    expect(
      (
        await call<{ reason: string }>(staff, "checkIn", {
          locationId: location,
          memberId: second,
          requestId: crypto.randomUUID(),
        })
      ).reason,
    ).toBe("location_full");
    await call(staff, "checkOut", { visitId: entry.visit.id });
    await call(staff, "checkOut", { visitId: entry.visit.id });
  });
  it("preserves plan entitlement snapshots, visit quotas, membership periods and blocked status", async () => {
    await call(owner, "savePlan", {
      id: plan,
      name: "Now unlimited",
      durationDays: 30,
      visitLimit: null,
      priceMinor: 9000,
      locationIds: [],
      active: true,
    });
    const pass = await call<{ token: string }>(member, "issuePass", { memberId: person });
    await db.query(
      "update business_passes set expires_at=now()-interval '1 second' where token_hash=kinra_business_hash($1)",
      [pass.token],
    );
    expect(
      (
        await call<{ reason: string }>(staff, "checkIn", {
          locationId: pool,
          token: pass.token,
          requestId: crypto.randomUUID(),
        })
      ).reason,
    ).toBe("pass_expired");
    const entry = await call<{ visit: { id: string }; remainingVisits: number }>(staff, "checkIn", {
      locationId: pool,
      memberId: person,
      requestId: crypto.randomUUID(),
    });
    expect(entry.remainingVisits).toBe(0);
    await call(staff, "checkOut", { visitId: entry.visit.id });
    expect(
      (
        await call<{ reason: string }>(staff, "checkIn", {
          locationId: pool,
          memberId: person,
          requestId: crypto.randomUUID(),
        })
      ).reason,
    ).toBe("membership_unavailable");
    await call(owner, "saveMember", {
      id: second,
      name: "Second person",
      number: "A2",
      email: "",
      phone: "",
      group: "",
      status: "blocked",
    });
    expect(
      (
        await call<{ reason: string }>(staff, "checkIn", {
          locationId: pool,
          memberId: second,
          requestId: crypto.randomUUID(),
        })
      ).reason,
    ).toBe("member_blocked");
    await expect(call(staff, "issuePass", { memberId: second })).rejects.toThrow("not active");
  });
  it("keeps ledger immutable/idempotent and finance hidden from reception", async () => {
    const invoice = crypto.randomUUID(),
      payment = crypto.randomUUID();
    await call(owner, "saveInvoice", {
      id: invoice,
      memberId: person,
      label: "Membership",
      totalMinor: 2000,
      dueDate: "2030-01-01",
    });
    const payload = {
      id: payment,
      invoiceId: invoice,
      amountMinor: 1500,
      kind: "payment",
      method: "cash",
      reference: "Internal record",
    };
    await call(owner, "recordPayment", payload);
    await call(owner, "recordPayment", payload);
    await expect(
      call(owner, "recordPayment", { ...payload, id: crypto.randomUUID(), amountMinor: 501 }),
    ).rejects.toThrow("exceeds");
    await expect(call(owner, "recordPayment", { ...payload, amountMinor: 1400 })).rejects.toThrow(
      "retry",
    );
    await expect(call(owner, "voidInvoice", { invoiceId: invoice })).rejects.toThrow("Refund");
    await expect(
      call(staff, "recordPayment", { ...payload, id: crypto.randomUUID() }),
    ).rejects.toThrow("manager");
    expect((await as(staff, () => db.query("select * from business_payments"))).rows).toHaveLength(
      0,
    );
    const snapshot = await call<{
      invoices: unknown[];
      payments: unknown[];
      stats: { outstandingMinor: number | null };
    }>(staff, "snapshot");
    expect(snapshot.invoices).toHaveLength(0);
    expect(snapshot.payments).toHaveLength(0);
    expect(snapshot.stats.outstandingMinor).toBeNull();
    expect(
      (await call<{ stats: { outstandingMinor: number } }>(owner, "snapshot")).stats
        .outstandingMinor,
    ).toBe(500);
    await call(owner, "recordPayment", {
      id: crypto.randomUUID(),
      invoiceId: invoice,
      amountMinor: 1500,
      kind: "refund",
      method: "cash",
      reference: "Correction",
    });
    await call(owner, "voidInvoice", { invoiceId: invoice });
  });
  it("protects resource overlaps and booking capacities, and exports business without pass/claim secrets", async () => {
    await call(owner, "saveMember", {
      id: second,
      name: "Second person",
      number: "A2",
      email: "",
      phone: "",
      group: "",
      status: "active",
    });
    const session = crypto.randomUUID();
    const data = {
      id: session,
      locationId: pool,
      resourceId: resource,
      title: "Swim",
      activity: "Swimming",
      group: "Adults",
      startsAt: "2080-01-01T10:00:00Z",
      endsAt: "2080-01-01T11:00:00Z",
      capacity: 1,
      status: "scheduled",
    };
    await call(owner, "saveSession", data);
    await expect(call(owner, "saveSession", { ...data, id: crypto.randomUUID() })).rejects.toThrow(
      "already booked",
    );
    const book = await call<string>(staff, "bookSession", {
      sessionId: session,
      memberId: second,
      requestId: crypto.randomUUID(),
    });
    expect(
      await call(staff, "bookSession", {
        sessionId: session,
        memberId: second,
        requestId: crypto.randomUUID(),
      }),
    ).toBe(book);
    // A fresh unlimited entitlement lets us test the competing member rather than quota denial.
    await call(owner, "saveMembership", {
      id: crypto.randomUUID(),
      memberId: person,
      planId: plan,
      startDate: "2020-01-01",
      endDate: "2099-12-31",
      status: "active",
    });
    await expect(
      call(member, "bookSession", {
        sessionId: session,
        memberId: person,
        requestId: crypto.randomUUID(),
      }),
    ).rejects.toThrow("full");
    await call(staff, "cancelBooking", { bookingId: book });
    await call(owner, "saveResource", {
      id: resource,
      locationId: pool,
      name: "Lane 1",
      kind: "lane",
      capacity: 2,
      active: false,
    });
    await expect(
      call(member, "bookSession", {
        sessionId: session,
        memberId: person,
        requestId: crypto.randomUUID(),
      }),
    ).rejects.toThrow("not available");
    await call(owner, "saveResource", {
      id: resource,
      locationId: pool,
      name: "Lane 1",
      kind: "lane",
      capacity: 2,
      active: true,
    });
    const ownBooking = await call<string>(member, "bookSession", {
      sessionId: session,
      memberId: person,
      requestId: crypto.randomUUID(),
    });
    await expect(call(outsider, "cancelBooking", { bookingId: ownBooking })).rejects.toThrow(
      "Booking access",
    );
    await call(member, "cancelBooking", { bookingId: ownBooking });
    const exported = await call<{ members: unknown[]; truncated: boolean }>(owner, "export");
    expect(exported.members).toHaveLength(2);
    expect(exported.truncated).toBe(false);
    expect(JSON.stringify(exported)).not.toContain("tokenHash");
    await expect(
      as(owner, () =>
        db.query("insert into business_locations(id,business_id,name) values($1,$2,'bypass')", [
          crypto.randomUUID(),
          bid,
        ]),
      ),
    ).rejects.toThrow("permission denied");
  });
  it("revokes staff immediately and keeps facility records while unlinking an erased member account", async () => {
    await db.query("delete from organization_staff where organization_id=$1 and user_id=$2", [
      bid,
      staff,
    ]);
    await expect(call(staff, "snapshot")).rejects.toThrow("Business access");
    await expect(
      call(staff, "checkIn", {
        locationId: pool,
        memberId: person,
        requestId: crypto.randomUUID(),
      }),
    ).rejects.toThrow("Business access");
    await call(member, "issuePass", { memberId: person });
    await as(member, () => db.query("select kinra_erase_data('DELETE KINRA DATA',$1)", [member]));
    const roster = (
      await db.query<{ user_id: string | null }>(
        "select user_id from business_members where id=$1",
        [person],
      )
    ).rows;
    expect(roster).toHaveLength(1);
    expect(roster[0]!.user_id).toBeNull();
    expect(
      (await db.query("select * from business_passes where member_id=$1", [person])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from business_memberships where member_id=$1", [person])).rows
        .length,
    ).toBeGreaterThan(0);
    // Owner erasure includes owned organization and every dependent business table.
    await as(owner, () => db.query("select kinra_erase_data('DELETE KINRA DATA',$1)", [owner]));
    for (const table of [
      "profiles",
      "locations",
      "resources",
      "plans",
      "members",
      "memberships",
      "visits",
      "passes",
      "claims",
      "invoices",
      "payments",
      "sessions",
      "bookings",
      "entry_attempts",
      "audit",
    ]) {
      const key = table === "profiles" ? "id" : "business_id";
      expect(
        (
          await db.query(
            "select count(*)::int n from business_" + table + " where " + key + "=$1",
            [bid],
          )
        ).rows[0],
      ).toEqual({ n: 0 });
    }
    expect((await call<unknown[]>(outsider, "list", {}, null)).length).toBe(1);
  });
});
