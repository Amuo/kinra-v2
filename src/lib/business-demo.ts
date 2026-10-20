import {
  businessSchemas,
  type BusinessApi,
  type BusinessSnapshot,
  type BusinessSummary,
  type BusinessPass,
  type BusinessEntryResult,
  type BusinessMemberPortal,
} from "./business";
import type { FeatureApi } from "./feature-api";
import type { OrganizationApi } from "./organization-api";
const records = new Map<string, { owner: string; state: BusinessSnapshot }>();
const initialized = new Set<string>();
const initializing = new Map<string, Promise<void>>();
const passes = new Map<
  string,
  { businessId: string; memberId: string; expiresAt: string; used: boolean; issuer: string }
>();
const claims = new Map<
  string,
  { businessId: string; memberId: string; expiresAt: string; usedBy: string | null }
>();
const links = new Map<string, string>();
const attempts = new Map<string, { actor: string; input: string; result: BusinessEntryResult }>();
const clone = <T>(v: T): T => structuredClone(v);
const uid = () => crypto.randomUUID();
const day = (timezone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const sumPaid = (s: BusinessSnapshot, id: string) =>
  s.payments
    .filter((p) => p.invoiceId === id)
    .reduce((n, p) => n + (p.kind === "payment" ? p.amountMinor : -p.amountMinor), 0);
export function clearDemoBusiness(owner: string) {
  const removed = new Set<string>();
  for (const [id, r] of records)
    if (r.owner === owner) {
      removed.add(id);
      records.delete(id);
    }
  for (const [id, user] of links) if (user === owner) links.delete(id);
  initialized.delete(owner);
  initializing.delete(owner);
  for (const [t, p] of passes)
    if (removed.has(p.businessId) || p.issuer === owner) passes.delete(t);
  for (const [t, c] of claims)
    if (removed.has(c.businessId) || c.usedBy === owner) claims.delete(t);
  for (const [id, a] of attempts) if (a.actor === owner) attempts.delete(id);
}
export async function exportDemoBusiness(owner: string, organizations: OrganizationApi) {
  const orgs = await organizations.list();
  return {
    workbench: [...records.values()].flatMap(({ state, owner: recordOwner }) => {
      const role =
        recordOwner === owner ? "owner" : orgs.find((o) => o.id === state.business.id)?.role;
      if (!role) return [];
      const copy = clone(state);
      if (role === "staff") {
        copy.invoices = [];
        copy.payments = [];
        copy.stats.outstandingMinor = null;
        copy.stats.paidTodayMinor = null;
      }
      return [{ ...copy, business: { ...copy.business, role } }];
    }),
    memberships: [...records.values()].flatMap(({ state }) =>
      state.members
        .filter((m) => links.get(m.id) === owner)
        .map((member) => ({
          business: state.business.name,
          member: clone(member),
          memberships: clone(state.memberships.filter((m) => m.memberId === member.id)),
        })),
    ),
  };
}
export function createDemoBusiness(
  owner: string,
  features: FeatureApi,
  organizations: OrganizationApi,
): BusinessApi {
  async function setup(input: Parameters<BusinessApi["setup"]>[0]) {
    const p = businessSchemas.setup.parse(input);
    const id = p.organizationId ?? uid();
    if (records.has(id)) {
      const r = records.get(id)!;
      if (r.owner !== owner) throw Error("Business owner access required.");
      if (r.state.plans.length && r.state.business.currency !== p.currency)
        throw Error("Currency cannot change after plans have been created.");
      Object.assign(r.state.business, {
        name: p.name,
        sector: p.sector,
        timezone: p.timezone,
        currency: p.currency,
      });
      return id;
    }
    if (
      p.organizationId &&
      !(await organizations.list()).some((o) => o.id === id && o.role === "owner")
    )
      throw Error("Business owner access required.");
    await features.save("organization", { name: p.name, city: "—" }, { id, visibility: "private" });
    await organizations.list();
    const business: BusinessSummary = {
      id,
      name: p.name,
      sector: p.sector,
      timezone: p.timezone,
      currency: p.currency,
      role: "owner",
    };
    records.set(id, {
      owner,
      state: {
        business,
        locations: [],
        resources: [],
        plans: [],
        members: [],
        memberships: [],
        visits: [],
        invoices: [],
        payments: [],
        sessions: [],
        bookings: [],
        stats: {
          members: 0,
          activeMembers: 0,
          inside: 0,
          visitsToday: 0,
          expiring: 0,
          outstandingMinor: 0,
          paidTodayMinor: 0,
        },
        truncated: false,
      },
    });
    return id;
  }
  async function seed() {
    if (initialized.has(owner)) return;
    const pending = initializing.get(owner);
    if (pending) return pending;
    const work = seedNow();
    initializing.set(owner, work);
    try {
      await work;
      initialized.add(owner);
    } finally {
      initializing.delete(owner);
    }
  }
  async function seedNow() {
    try {
      const id = await setup({
        name: "Kinra Demo Sports Centre",
        sector: "sports_complex",
        timezone: "Europe/Sarajevo",
        currency: "BAM",
      });
      const s = records.get(id)!.state;
      for (const [name, city, capacity] of [
        ["Fitness & MMA", "Sarajevo", 60],
        ["Pool", "Sarajevo", 40],
        ["Football pitches", "Sarajevo", 80],
        ["Athletics track", "Sarajevo", 100],
      ] as const)
        s.locations.push({
          id: uid(),
          name,
          city,
          address: "Demo location",
          capacity,
          active: true,
        });
      s.resources.push(
        {
          id: uid(),
          locationId: s.locations[0]!.id,
          name: "Training mat",
          kind: "mat",
          capacity: 20,
          active: true,
        },
        {
          id: uid(),
          locationId: s.locations[1]!.id,
          name: "Swimming lane 1",
          kind: "lane",
          capacity: 8,
          active: true,
        },
        {
          id: uid(),
          locationId: s.locations[2]!.id,
          name: "Small-sided pitch",
          kind: "pitch",
          capacity: 14,
          active: true,
        },
      );
      s.plans.push(
        {
          id: uid(),
          name: "Monthly all-sport",
          durationDays: 30,
          visitLimit: null,
          priceMinor: 8000,
          locationIds: [],
          active: true,
        },
        {
          id: uid(),
          name: "Swimming · 10 visits",
          durationDays: 60,
          visitLimit: 10,
          priceMinor: 5000,
          locationIds: [s.locations[1]!.id],
          active: true,
        },
      );
      const date = day(s.business.timezone);
      const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      for (const [name, group, status] of [
        ["Demo Member", "Recreation", "active"],
        ["Demo Swimmer", "Swimming", "active"],
        ["Demo Footballer", "Senior team", "paused"],
      ] as const) {
        const member = {
          id: uid(),
          name,
          number: "DEMO-" + (s.members.length + 1),
          email: "",
          phone: "",
          group,
          status,
          linked: s.members.length === 0,
          createdAt: new Date().toISOString(),
        };
        s.members.push(member);
        if (member.linked) links.set(member.id, owner);
        s.memberships.push({
          id: uid(),
          memberId: member.id,
          planId: s.plans[0]!.id,
          planName: s.plans[0]!.name,
          startDate: date,
          endDate: end,
          status: "active",
          visitLimit: null,
          usedVisits: 0,
          locationIds: [],
        });
      }
      s.sessions.push(
        {
          id: uid(),
          locationId: s.locations[0]!.id,
          resourceId: s.resources[0]!.id,
          title: "MMA foundations",
          activity: "MMA",
          group: "Adults",
          startsAt: new Date(Date.now() + 3600000).toISOString(),
          endsAt: new Date(Date.now() + 7200000).toISOString(),
          capacity: 16,
          status: "scheduled",
          booked: 0,
        },
        {
          id: uid(),
          locationId: s.locations[1]!.id,
          resourceId: s.resources[1]!.id,
          title: "Swimming practice",
          activity: "Swimming",
          group: "Recreation",
          startsAt: new Date(Date.now() + 10800000).toISOString(),
          endsAt: new Date(Date.now() + 14400000).toISOString(),
          capacity: 8,
          status: "scheduled",
          booked: 0,
        },
      );
      s.invoices.push({
        id: uid(),
        memberId: s.members[0]!.id,
        label: "Monthly membership",
        totalMinor: 8000,
        paidMinor: 0,
        dueDate: date,
        status: "open",
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      initialized.delete(owner);
      throw error;
    }
  }
  async function get(id: string, manager = false) {
    await seed();
    const r = records.get(id);
    const role =
      r?.owner === owner ? "owner" : (await organizations.list()).find((o) => o.id === id)?.role;
    if (!r || !role) throw Error("Business access required.");
    if (manager && role === "staff") throw Error("Business manager access required.");
    return { s: r.state, role };
  }
  function project(s: BusinessSnapshot, role: BusinessSummary["role"]): BusinessSnapshot {
    const out = clone(s);
    const date = day(s.business.timezone);
    out.members = out.members.map((m) => ({ ...m, linked: links.has(m.id) }));
    out.memberships = out.memberships.map((m) => ({
      ...m,
      usedVisits: s.visits.filter((v) => v.membershipId === m.id).length,
    }));
    out.sessions = out.sessions.map((e) => ({
      ...e,
      booked: s.bookings.filter((b) => b.sessionId === e.id && b.status === "booked").length,
    }));
    out.invoices = out.invoices.map((i) => ({ ...i, paidMinor: sumPaid(s, i.id) }));
    out.business.role = role;
    out.stats = {
      members: s.members.length,
      activeMembers: new Set(
        s.memberships
          .filter(
            (m) =>
              m.status === "active" &&
              m.startDate <= date &&
              m.endDate >= date &&
              s.members.some((p) => p.id === m.memberId && p.status === "active"),
          )
          .map((m) => m.memberId),
      ).size,
      inside: s.visits.filter((v) => !v.exitedAt).length,
      visitsToday: s.visits.filter((v) => dayAt(v.enteredAt, s.business.timezone) === date).length,
      expiring: s.memberships.filter(
        (m) =>
          m.status === "active" &&
          m.endDate >= date &&
          m.endDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      ).length,
      outstandingMinor:
        role === "staff"
          ? null
          : out.invoices
              .filter((i) => i.status === "open")
              .reduce((n, i) => n + i.totalMinor - i.paidMinor, 0),
      paidTodayMinor:
        role === "staff"
          ? null
          : s.payments
              .filter((p) => dayAt(p.createdAt, s.business.timezone) === date)
              .reduce((n, p) => n + (p.kind === "payment" ? p.amountMinor : -p.amountMinor), 0),
    };
    if (role === "staff") {
      out.invoices = [];
      out.payments = [];
    }
    return out;
  }
  const dayAt = (date: string, tz: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  function upsert<T extends { id: string }>(rows: T[], value: T) {
    const at = rows.findIndex((v) => v.id === value.id);
    if (at < 0) rows.push(clone(value));
    else rows[at] = clone(value);
    return value.id;
  }
  const hasMember = (s: BusinessSnapshot, id: string) => {
    const m = s.members.find((m) => m.id === id);
    if (!m) throw Error("Member not found.");
    return m;
  };
  const validMembership = (
    s: BusinessSnapshot,
    memberId: string,
    locationId: string,
    date: string,
  ) =>
    s.memberships.find(
      (m) =>
        m.memberId === memberId &&
        m.status === "active" &&
        m.startDate <= date &&
        m.endDate >= date &&
        (!m.locationIds.length || m.locationIds.includes(locationId)) &&
        (m.visitLimit === null ||
          s.visits.filter((v) => v.membershipId === m.id).length < m.visitLimit),
    );
  const api: BusinessApi = {
    list: async () => {
      await seed();
      const orgs = await organizations.list();
      return [...records.values()].flatMap((r) => {
        const role =
          r.owner === owner ? "owner" : orgs.find((o) => o.id === r.state.business.id)?.role;
        return role ? [{ ...r.state.business, role }] : [];
      });
    },
    setup,
    snapshot: async (id) => {
      const { s, role } = await get(id);
      return project(s, role);
    },
    saveLocation: async (id, input) => {
      const { s } = await get(id, true);
      return upsert(s.locations, businessSchemas.location.parse(input));
    },
    saveResource: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.resource.parse(input);
      if (!s.locations.some((l) => l.id === v.locationId))
        throw Error("Choose a resource at this location.");
      return upsert(s.resources, v);
    },
    savePlan: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.plan.parse(input);
      if (v.locationIds.some((x) => !s.locations.some((l) => l.id === x)))
        throw Error("Choose locations from this business.");
      return upsert(s.plans, v);
    },
    saveMember: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.member.parse(input);
      if (s.members.some((m) => m.number === v.number && m.id !== v.id))
        throw Error("Member number already exists.");
      return upsert(s.members, {
        ...v,
        linked: links.has(v.id),
        createdAt: s.members.find((m) => m.id === v.id)?.createdAt ?? new Date().toISOString(),
      });
    },
    saveMembership: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.membership.parse(input);
      hasMember(s, v.memberId);
      const old = s.memberships.find((m) => m.id === v.id);
      if (old) {
        if (old.memberId !== v.memberId || old.planId !== v.planId)
          throw Error("Existing membership identity cannot change.");
        return upsert(s.memberships, { ...old, ...v });
      }
      const p = s.plans.find((p) => p.id === v.planId && p.active);
      if (!p) throw Error("Choose an active membership plan.");
      return upsert(s.memberships, {
        ...v,
        planName: p.name,
        visitLimit: p.visitLimit,
        locationIds: p.locationIds,
        usedVisits: 0,
      });
    },
    createClaim: async (id, memberId) => {
      const { s } = await get(id, true);
      hasMember(s, memberId);
      if (links.has(memberId)) throw Error("Choose an unlinked business member.");
      for (const [c, v] of claims) if (v.memberId === memberId) claims.delete(c);
      const code = "kc1:" + uid().replaceAll("-", "") + uid().replaceAll("-", "");
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
      claims.set(code, { businessId: id, memberId, expiresAt, usedBy: null });
      return { code, expiresAt };
    },
    inspectClaim: async (code) => {
      await seed();
      const c = claims.get(code);
      if (!c || Date.parse(c.expiresAt) <= Date.now() || (c.usedBy && c.usedBy !== owner))
        throw Error("This member invitation is invalid or expired.");
      const s = records.get(c.businessId)!.state;
      const linked = links.get(c.memberId);
      if (linked && linked !== owner) throw Error("This member invitation is already linked.");
      return {
        businessName: s.business.name,
        memberName: hasMember(s, c.memberId).name,
        alreadyLinked: linked === owner,
      };
    },
    redeemClaim: async (code) => {
      await api.inspectClaim(code);
      const c = claims.get(code)!;
      const s = records.get(c.businessId)!.state;
      if (s.members.some((m) => m.id !== c.memberId && links.get(m.id) === owner))
        throw Error("This account already has a member record here.");
      links.set(c.memberId, owner);
      c.usedBy = owner;
    },
    myMemberships: async () => {
      await seed();
      return [...records.values()].flatMap(({ state: s }) => {
        const m = s.members.find((m) => links.get(m.id) === owner && m.status !== "archived");
        if (!m) return [];
        const out = project(s, "staff");
        const { role: _, ...business } = out.business;
        return [
          {
            business,
            member: out.members.find((x) => x.id === m.id)!,
            memberships: out.memberships.filter((x) => x.memberId === m.id),
            locations: out.locations.filter((l) => l.active),
            sessions: out.sessions.filter((e) => Date.parse(e.endsAt) >= Date.now()),
            bookings: out.bookings.filter((b) => b.memberId === m.id),
          } satisfies BusinessMemberPortal,
        ];
      });
    },
    issuePass: async (id, memberId) => {
      await seed();
      const r = records.get(id);
      if (!r) throw Error("Business not found.");
      if (links.get(memberId) !== owner) await get(id);
      const m = hasMember(r.state, memberId);
      if (m.status !== "active") throw Error("This member is not active.");
      for (const [t, p] of passes) if (p.memberId === memberId) passes.delete(t);
      const token = "kb1:" + uid().replaceAll("-", "") + uid().replaceAll("-", "");
      const expiresAt = new Date(Date.now() + 90000).toISOString();
      passes.set(token, { businessId: id, memberId, expiresAt, used: false, issuer: owner });
      return {
        token,
        expiresAt,
        memberName: m.name,
        businessName: r.state.business.name,
      } satisfies BusinessPass;
    },
    checkIn: async (input) => {
      const { s } = await get(input.businessId);
      const key = JSON.stringify(input);
      const old = attempts.get(input.requestId);
      if (old) {
        if (old.actor !== owner || old.input !== key) throw Error("Request identity conflict.");
        return { ...clone(old.result), alreadyRecorded: true };
      }
      let reason = "";
      let mid = input.memberId;
      const pass = input.token ? passes.get(input.token) : null;
      if (input.token) {
        if (!pass || pass.businessId !== input.businessId) reason = "invalid_pass";
        else if (pass.used) reason = "pass_used";
        else if (Date.parse(pass.expiresAt) <= Date.now()) reason = "pass_expired";
        else {
          mid = pass.memberId;
          pass.used = true;
        }
      }
      const m = s.members.find((m) => m.id === mid);
      const location = s.locations.find((l) => l.id === input.locationId);
      if (!reason && !m) reason = "member_not_found";
      if (!reason && (!location || !location.active)) reason = "location_unavailable";
      if (!reason && m!.status !== "active") reason = "member_" + m!.status;
      let visit = s.visits.find((v) => v.memberId === mid && !v.exitedAt) ?? null;
      let membership = undefined;
      if (!reason && visit) reason = "already_inside";
      if (!reason) {
        membership = validMembership(s, m!.id, input.locationId, day(s.business.timezone));
        if (!membership) reason = "membership_unavailable";
        else if (
          location!.capacity !== null &&
          s.visits.filter((v) => !v.exitedAt && v.locationId === location!.id).length >=
            location!.capacity
        )
          reason = "location_full";
      }
      if (!reason) {
        visit = {
          id: uid(),
          memberId: m!.id,
          memberName: m!.name,
          membershipId: membership!.id,
          locationId: input.locationId,
          enteredAt: new Date().toISOString(),
          exitedAt: null,
          method: input.token ? "qr" : "manual",
        };
        s.visits.unshift(visit);
      }
      const result: BusinessEntryResult = {
        decision: !reason ? "allowed" : reason === "already_inside" ? "already_inside" : "denied",
        reason: reason || "entry_recorded",
        memberName: m?.name ?? null,
        visit: !reason || reason === "already_inside" ? clone(visit) : null,
        remainingVisits:
          membership?.visitLimit == null
            ? null
            : membership.visitLimit -
              s.visits.filter((v) => v.membershipId === membership.id).length,
        alreadyRecorded: false,
      };
      attempts.set(input.requestId, { actor: owner, input: key, result: clone(result) });
      return result;
    },
    checkOut: async (id, visitId) => {
      const { s } = await get(id);
      const v = s.visits.find((v) => v.id === visitId);
      if (!v) throw Error("Visit not found.");
      v.exitedAt ??= new Date().toISOString();
    },
    saveSession: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.session.parse(input);
      const l = s.locations.find((l) => l.id === v.locationId && l.active);
      if (!l) throw Error("Choose an active business location.");
      if (v.resourceId) {
        const r = s.resources.find(
          (r) => r.id === v.resourceId && r.locationId === l.id && r.active,
        );
        if (!r) throw Error("Choose a resource at this location.");
        if (v.capacity > r.capacity) throw Error("Session capacity exceeds the resource capacity.");
        if (
          v.status === "scheduled" &&
          s.sessions.some(
            (e) =>
              e.id !== v.id &&
              e.resourceId === v.resourceId &&
              e.status === "scheduled" &&
              e.startsAt < v.endsAt &&
              e.endsAt > v.startsAt,
          )
        )
          throw Error("This resource is already booked for that time.");
      }
      const count = s.bookings.filter((b) => b.sessionId === v.id && b.status === "booked").length;
      if (count > v.capacity) throw Error("Capacity cannot be below existing bookings.");
      if (v.status === "cancelled")
        for (const b of s.bookings) if (b.sessionId === v.id) b.status = "cancelled";
      return upsert(s.sessions, { ...v, booked: count });
    },
    bookSession: async (id, sessionId, memberId, _requestId) => {
      await seed();
      const s = records.get(id)?.state;
      if (!s) throw Error("Business not found.");
      if (links.get(memberId) !== owner) await get(id);
      const e = s.sessions.find(
        (e) =>
          e.id === sessionId && e.status === "scheduled" && Date.parse(e.startsAt) > Date.now(),
      );
      if (
        !e ||
        !s.locations.some((l) => l.id === e.locationId && l.active) ||
        (e.resourceId !== null &&
          !s.resources.some(
            (r) => r.id === e.resourceId && r.locationId === e.locationId && r.active,
          ))
      )
        throw Error("This session is not available.");
      const old = s.bookings.find((b) => b.sessionId === sessionId && b.memberId === memberId);
      if (old?.status === "booked") return old.id;
      if (
        hasMember(s, memberId).status !== "active" ||
        !validMembership(s, memberId, e.locationId, dayAt(e.startsAt, s.business.timezone))
      )
        throw Error("An active membership is required for this session.");
      if (
        s.bookings.filter((b) => b.sessionId === sessionId && b.status === "booked").length >=
        e.capacity
      )
        throw Error("This session is full.");
      const booking = {
        id: old?.id ?? uid(),
        sessionId,
        memberId,
        memberName: hasMember(s, memberId).name,
        status: "booked" as const,
        createdAt: old?.createdAt ?? new Date().toISOString(),
      };
      return upsert(s.bookings, booking);
    },
    cancelBooking: async (id, bookingId) => {
      await seed();
      const s = records.get(id)?.state;
      const b = s?.bookings.find((b) => b.id === bookingId);
      if (!s || !b) throw Error("Booking not found.");
      if (links.get(b.memberId) !== owner) await get(id);
      b.status = "cancelled";
    },
    saveInvoice: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.invoice.parse(input);
      hasMember(s, v.memberId);
      const old = s.invoices.find((i) => i.id === v.id);
      if (old) {
        if (
          old.memberId !== v.memberId ||
          old.totalMinor !== v.totalMinor ||
          old.label !== v.label ||
          old.dueDate !== v.dueDate
        )
          throw Error("Invoice records are immutable. Void and create a new record.");
        return old.id;
      }
      return upsert(s.invoices, {
        ...v,
        paidMinor: 0,
        status: "open",
        createdAt: new Date().toISOString(),
      });
    },
    voidInvoice: async (id, invoiceId) => {
      const { s } = await get(id, true);
      const i = s.invoices.find((i) => i.id === invoiceId);
      if (!i) throw Error("Invoice not found.");
      if (sumPaid(s, invoiceId) !== 0)
        throw Error("Refund recorded payments before voiding this invoice.");
      i.status = "void";
    },
    recordPayment: async (id, input) => {
      const { s } = await get(id, true);
      const v = businessSchemas.payment.parse(input);
      const old = s.payments.find((p) => p.id === v.id);
      if (old) {
        if (
          JSON.stringify({ ...old, createdAt: undefined }) !==
          JSON.stringify({ ...v, createdAt: undefined })
        )
          throw Error("Payment retry does not match the recorded payment.");
        return v.id;
      }
      const i = s.invoices.find((i) => i.id === v.invoiceId && i.status === "open");
      if (!i) throw Error("Choose an open invoice.");
      const paid = sumPaid(s, i.id);
      if (v.amountMinor > (v.kind === "payment" ? i.totalMinor - paid : paid))
        throw Error("Amount exceeds the remaining invoice or recorded payment.");
      return upsert(s.payments, { ...v, createdAt: new Date().toISOString() });
    },
    exportData: async (id) => {
      const { s, role } = await get(id);
      return { ...project(s, role), exportedAt: new Date().toISOString() };
    },
  };
  return api;
}
