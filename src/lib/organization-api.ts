import { featureRpc } from "./backend";
import type { Json } from "@/integrations/supabase/types";
import type { FeatureApi } from "./feature-api";
import {
  availabilitySchema,
  membershipSchema,
  type AvailableSlot,
  type CoachAvailability,
  type InvitePreview,
  type MembershipInput,
  type OrgInvite,
  type OrgMember,
  type OrgStaff,
  type OrgSummary,
  type StaffRole,
} from "./organizations";

export interface OrganizationApi {
  list(): Promise<OrgSummary[]>;
  staff(organizationId: string): Promise<OrgStaff[]>;
  members(organizationId: string): Promise<OrgMember[]>;
  invites(organizationId: string): Promise<OrgInvite[]>;
  createInvite(organizationId: string, role: StaffRole, expiresAt: string): Promise<OrgInvite>;
  inspectInvite(code: string): Promise<InvitePreview>;
  redeemInvite(code: string): Promise<InvitePreview>;
  revokeInvite(organizationId: string, code: string): Promise<void>;
  removeStaff(organizationId: string, userId: string): Promise<void>;
  setStaffRole(organizationId: string, userId: string, role: StaffRole): Promise<void>;
  saveMembership(input: MembershipInput): Promise<void>;
  availability(coachId: string): Promise<CoachAvailability | null>;
  saveAvailability(input: CoachAvailability): Promise<void>;
  slots(coachId: string, fromDate: string, toDate: string): Promise<AvailableSlot[]>;
}
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;
// The shared backend keeps isolated project naming and expected-owner checks.
const rpc = featureRpc as unknown as Rpc;
export function createLiveOrganizations(ownerId: string): OrganizationApi {
  async function call<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const result = await rpc(name, { ...args, expected_owner: ownerId });
    if (result.error) throw new Error(result.error.message);
    return result.data as T;
  }
  const admin = <T>(action: string, organizationId: string | null, data: unknown = {}) =>
    call<T>("kinra_org_admin", { action, org_id: organizationId, data: json(data) });
  return {
    list: () => admin("list", null),
    staff: (id) => admin("staff", id),
    members: (id) => admin("members", id),
    invites: (id) => admin("invites", id),
    createInvite: (id, role, expiresAt) => admin("createInvite", id, { role, expiresAt }),
    inspectInvite: (code) => call("kinra_org_redeem", { invitation_code: code, accept: false }),
    redeemInvite: (code) => call("kinra_org_redeem", { invitation_code: code, accept: true }),
    revokeInvite: (id, code) => admin("revokeInvite", id, { code }),
    removeStaff: (id, userId) => admin("removeStaff", id, { userId }),
    setStaffRole: (id, userId, role) => admin("setStaffRole", id, { userId, role }),
    saveMembership: (input) => {
      const data = membershipSchema.parse(input);
      return admin("saveMembership", data.organizationId, data);
    },
    availability: (coach) => call("kinra_availability", { coach }),
    saveAvailability: (data) =>
      call("kinra_save_availability", { data: json(availabilitySchema.parse(data)) }),
    slots: (coach, fromDate, toDate) =>
      call("kinra_available_slots", { coach, from_day: fromDate, to_day: toDate }),
  };
}

const demoStaff: OrgStaff[] = [];
const demoInvites: OrgInvite[] = [];
const demoMemberships: MembershipInput[] = [];
const demoOrgs = new Map<string, OrgSummary & { ownerId: string }>();
const demoAvailability = new Map<string, CoachAvailability>();
const demoFeatures = new Map<string, FeatureApi>();
export function clearDemoOrganizations(ownerId: string) {
  const owned = new Set(
    [...demoOrgs.values()].filter((org) => org.ownerId === ownerId).map((org) => org.id),
  );
  for (const id of owned) demoOrgs.delete(id);
  for (let i = demoStaff.length - 1; i >= 0; i--)
    if (owned.has(demoStaff[i]!.organizationId) || demoStaff[i]!.userId === ownerId)
      demoStaff.splice(i, 1);
  for (let i = demoMemberships.length - 1; i >= 0; i--)
    if (owned.has(demoMemberships[i]!.organizationId) || demoMemberships[i]!.userId === ownerId)
      demoMemberships.splice(i, 1);
  for (let i = demoInvites.length - 1; i >= 0; i--) {
    const invitation = demoInvites[i]!;
    if (owned.has(invitation.organizationId)) demoInvites.splice(i, 1);
    else if (invitation.usedBy === ownerId) invitation.usedBy = null;
  }
  demoAvailability.delete(ownerId);
  demoFeatures.delete(ownerId);
}
export function exportDemoOrganizations(ownerId: string) {
  return {
    organizations: [...demoOrgs.values()].flatMap((org) => {
      const role =
        org.ownerId === ownerId
          ? "owner"
          : demoStaff.find((staff) => staff.organizationId === org.id && staff.userId === ownerId)
              ?.role;
      if (!role) return [];
      return [
        {
          id: org.id,
          title: org.title,
          role,
          staff: clone(demoStaff.filter((staff) => staff.organizationId === org.id)),
          memberships: clone(
            demoMemberships.filter((member) => member.organizationId === org.id),
          ).map((member) =>
            role === "staff" ? { ...member, paidAmount: null, currency: null, notes: "" } : member,
          ),
          invitations:
            role === "owner"
              ? clone(demoInvites.filter((invitation) => invitation.organizationId === org.id))
              : [],
        },
      ];
    }),
    ownMemberships: demoMemberships
      .filter((member) => member.userId === ownerId)
      .map(({ organizationId, userId, status, startDate, endDate, planId }) => ({
        organizationId,
        userId,
        status,
        startDate,
        endDate,
        planId,
      })),
    availability: clone(demoAvailability.get(ownerId) ?? null),
  };
}
const clone = <T>(value: T): T => structuredClone(value);
const allowedRole = (role: string): role is StaffRole => role === "manager" || role === "staff";
export function createDemoOrganizations(ownerId: string, features: FeatureApi): OrganizationApi {
  demoFeatures.set(ownerId, features);
  async function list(): Promise<OrgSummary[]> {
    for (const org of await features.list("organization"))
      if (org.owner_id === ownerId)
        demoOrgs.set(org.id, {
          id: org.id,
          title: org.payload.name,
          city: org.payload.city,
          role: "owner",
          ownerId,
        });
    return [...demoOrgs.values()].flatMap((org) => {
      const role =
        org.ownerId === ownerId
          ? "owner"
          : demoStaff.find((s) => s.organizationId === org.id && s.userId === ownerId)?.role;
      return role ? [{ id: org.id, title: org.title, city: org.city, role }] : [];
    });
  }
  async function authority(id: string, minimum: "staff" | "manager" | "owner" = "staff") {
    const org = (await list()).find((o) => o.id === id);
    if (
      !org ||
      (minimum === "owner" && org.role !== "owner") ||
      (minimum === "manager" && org.role === "staff")
    )
      throw new Error("Organization access required.");
    return org.role;
  }
  async function preview(code: string, accept: boolean): Promise<InvitePreview> {
    const invitation = demoInvites.find((i) => i.code === code);
    const org = invitation && demoOrgs.get(invitation.organizationId);
    if (
      !invitation ||
      !org ||
      invitation.revokedAt ||
      Date.parse(invitation.expiresAt) <= Date.now() ||
      (invitation.usedBy && invitation.usedBy !== ownerId)
    )
      throw new Error("This invitation is unavailable or expired.");
    if (org.ownerId === ownerId) throw new Error("The owner already manages this organization.");
    const existing = demoStaff.find((s) => s.organizationId === org.id && s.userId === ownerId);
    if (invitation.usedAt && !existing) throw new Error("This invitation has already been used.");
    if (accept && !invitation.usedAt) {
      if (existing) throw new Error("You already have a staff role. Ask the owner to change it.");
      invitation.usedAt = new Date().toISOString();
      invitation.usedBy = ownerId;
      demoStaff.push({
        organizationId: org.id,
        userId: ownerId,
        role: invitation.role,
        displayName: null,
        createdAt: invitation.usedAt,
      });
    }
    return {
      organizationId: org.id,
      title: org.title,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      accepted: accept || !!invitation.usedAt,
    };
  }
  return {
    list,
    async staff(id) {
      await authority(id);
      return clone(demoStaff.filter((s) => s.organizationId === id));
    },
    async members(id) {
      const role = await authority(id);
      const rows: OrgMember[] = [];
      for (const [personId, api] of demoFeatures)
        for (const member of await api.list("organization_member"))
          if (member.owner_id === personId && member.payload.organization_id === id) {
            const membership = clone(
              demoMemberships.find((m) => m.organizationId === id && m.userId === personId) ?? null,
            );
            if (membership && role === "staff") {
              membership.paidAmount = null;
              membership.currency = null;
              membership.notes = "";
            }
            rows.push({
              organizationId: id,
              userId: personId,
              displayName: null,
              joinedAt: member.created_at,
              membership,
            });
          }
      return rows;
    },
    async invites(id) {
      await authority(id, "owner");
      return clone(demoInvites.filter((i) => i.organizationId === id));
    },
    async createInvite(id, role, expiresAt) {
      await authority(id, "owner");
      const expiry = Date.parse(expiresAt);
      if (
        !allowedRole(role) ||
        !Number.isFinite(expiry) ||
        expiry < Date.now() + 5 * 60000 ||
        expiry > Date.now() + 30 * 86400000
      )
        throw new Error("Use an expiry between five minutes and thirty days.");
      const invitation: OrgInvite = {
        code: crypto.randomUUID(),
        organizationId: id,
        role,
        expiresAt,
        revokedAt: null,
        usedAt: null,
        usedBy: null,
      };
      demoInvites.push(invitation);
      return clone(invitation);
    },
    inspectInvite: (code) => preview(code, false),
    redeemInvite: (code) => preview(code, true),
    async revokeInvite(id, code) {
      await authority(id, "owner");
      const invitation = demoInvites.find((i) => i.organizationId === id && i.code === code);
      if (!invitation) throw new Error("Invitation not found.");
      invitation.revokedAt = new Date().toISOString();
    },
    async removeStaff(id, userId) {
      await authority(id, "owner");
      const index = demoStaff.findIndex((s) => s.organizationId === id && s.userId === userId);
      if (index < 0) throw new Error("Staff member not found.");
      demoStaff.splice(index, 1);
    },
    async setStaffRole(id, userId, role) {
      await authority(id, "owner");
      const staff = demoStaff.find((s) => s.organizationId === id && s.userId === userId);
      if (!staff || !allowedRole(role)) throw new Error("Staff member not found.");
      staff.role = role;
    },
    async saveMembership(input) {
      const data = membershipSchema.parse(input);
      await authority(data.organizationId, "manager");
      const joined = await demoFeatures.get(data.userId)?.list("organization_member");
      if (
        !joined?.some(
          (m) => m.owner_id === data.userId && m.payload.organization_id === data.organizationId,
        )
      )
        throw new Error("The person must join this organization first.");
      if (
        data.planId &&
        !(await features.list("membership_plan")).some(
          (p) => p.id === data.planId && p.payload.organization_id === data.organizationId,
        )
      )
        throw new Error("Choose a plan from this organization.");
      const index = demoMemberships.findIndex(
        (m) => m.organizationId === data.organizationId && m.userId === data.userId,
      );
      if (index < 0) demoMemberships.push(clone(data));
      else demoMemberships[index] = clone(data);
    },
    async availability(coachId) {
      const data = demoAvailability.get(coachId);
      return data && (coachId === ownerId || data.published) ? clone(data) : null;
    },
    async saveAvailability(input) {
      demoAvailability.set(ownerId, availabilitySchema.parse(input));
    },
    async slots(coachId, fromDate, toDate) {
      const schedule = demoAvailability.get(coachId);
      if (!schedule?.published) return [];
      const busy = new Map<string, { startsAt: string; endsAt: string }>();
      for (const api of demoFeatures.values())
        for (const appointment of await api.list("appointment"))
          if (
            appointment.payload.coach_id === coachId &&
            appointment.payload.status !== "cancelled"
          )
            busy.set(appointment.id, {
              startsAt: appointment.payload.starts_at,
              endsAt: appointment.payload.ends_at,
            });
      return availabilitySlots(schedule, fromDate, toDate).filter(
        (s) =>
          ![...busy.values()].some(
            (b) =>
              Date.parse(b.startsAt) < Date.parse(s.endsAt) &&
              Date.parse(b.endsAt) > Date.parse(s.startsAt),
          ),
      );
    },
  };
}

/** Local preview mirrors server recurrence rules; server remains authoritative. */
export function availabilitySlots(
  schedule: CoachAvailability,
  fromDate: string,
  toDate: string,
  now = Date.now(),
): AvailableSlot[] {
  const config = availabilitySchema.parse(schedule);
  const first = Date.parse(`${fromDate}T00:00:00Z`);
  const last = Date.parse(`${toDate}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fromDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(toDate) ||
    !Number.isFinite(first) ||
    !Number.isFinite(last) ||
    last < first ||
    last - first > 31 * 86400000
  )
    throw new Error("Choose a date range of at most 32 days.");
  if (!config.published) return [];
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const wall = (instant: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(instant).map((p) => [p.type, p.value]),
    );
    return Date.UTC(
      +parts["year"]!,
      +parts["month"]! - 1,
      +parts["day"]!,
      +parts["hour"]!,
      +parts["minute"]!,
      +parts["second"]!,
    );
  };
  const instant = (local: number) => {
    let candidate = local;
    for (let i = 0; i < 4; i++) candidate += local - wall(candidate);
    return wall(candidate) === local ? candidate : null;
  };
  const slots: AvailableSlot[] = [];
  for (let day = first; day <= last; day += 86400000) {
    const date = new Date(day).toISOString().slice(0, 10);
    const exception = config.exceptions.find((e) => e.date === date);
    const rules = exception
      ? exception.unavailable
        ? []
        : [exception]
      : config.rules.filter((r) => r.weekday === new Date(day).getUTCDay());
    for (const rule of rules) {
      if (!rule.start || !rule.end || !rule.slotMinutes) continue;
      const minute = (value: string) => +value.slice(0, 2) * 60 + +value.slice(3);
      for (
        let start = minute(rule.start);
        start + rule.slotMinutes <= minute(rule.end);
        start += rule.slotMinutes
      ) {
        const begins = instant(day + start * 60000);
        const ends = instant(day + (start + rule.slotMinutes) * 60000);
        if (
          begins != null &&
          ends != null &&
          begins > now &&
          ends - begins === rule.slotMinutes * 60000
        )
          slots.push({
            startsAt: new Date(begins).toISOString(),
            endsAt: new Date(ends).toISOString(),
          });
      }
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
