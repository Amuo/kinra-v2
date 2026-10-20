import { z } from "zod";
export const businessSectors = [
  "gym",
  "pool",
  "football",
  "combat_sports",
  "sports_complex",
  "athletics",
  "basketball",
  "handball",
  "volleyball",
  "tennis",
  "padel",
  "dance",
  "yoga_pilates",
  "gymnastics",
  "climbing",
  "water_sports",
  "winter_sports",
  "wellness",
  "other",
] as const;
export type BusinessSector = (typeof businessSectors)[number];
export const businessSectorLabels: Record<BusinessSector, string> = {
  gym: "Gym & fitness",
  pool: "Pool & swimming",
  football: "Football club",
  combat_sports: "MMA & combat sports",
  sports_complex: "Sports complex",
  athletics: "Athletics facility",
  basketball: "Basketball club",
  handball: "Handball club",
  volleyball: "Volleyball club",
  tennis: "Tennis club",
  padel: "Padel centre",
  dance: "Dance studio",
  yoga_pilates: "Yoga & Pilates",
  gymnastics: "Gymnastics club",
  climbing: "Climbing centre",
  water_sports: "Water sports club",
  winter_sports: "Winter sports centre",
  wellness: "Wellness centre",
  other: "Other sports facility",
};
export type BusinessRole = "owner" | "manager" | "staff";
export interface BusinessSummary {
  id: string;
  name: string;
  sector: BusinessSector;
  timezone: string;
  currency: string;
  role: BusinessRole;
}
export interface BusinessLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity: number | null;
  active: boolean;
}
export interface BusinessResource {
  id: string;
  locationId: string;
  name: string;
  kind: "pitch" | "court" | "lane" | "studio" | "mat" | "track" | "room" | "other";
  capacity: number;
  active: boolean;
}
export interface BusinessPlan {
  id: string;
  name: string;
  durationDays: number;
  visitLimit: number | null;
  priceMinor: number;
  locationIds: string[];
  active: boolean;
}
export interface BusinessMember {
  id: string;
  name: string;
  number: string;
  email: string;
  phone: string;
  group: string;
  status: "active" | "paused" | "blocked" | "archived";
  linked: boolean;
  createdAt: string;
}
export interface BusinessMembership {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: "active" | "paused" | "ended";
  visitLimit: number | null;
  usedVisits: number;
  locationIds: string[];
}
export interface BusinessVisit {
  id: string;
  memberId: string;
  memberName: string;
  membershipId: string;
  locationId: string;
  enteredAt: string;
  exitedAt: string | null;
  method: "qr" | "manual";
}
export interface BusinessInvoice {
  id: string;
  memberId: string;
  label: string;
  totalMinor: number;
  paidMinor: number;
  dueDate: string;
  status: "open" | "void";
  createdAt: string;
}
export interface BusinessPayment {
  id: string;
  invoiceId: string;
  amountMinor: number;
  kind: "payment" | "refund";
  method: "cash" | "bank" | "external_card" | "other";
  reference: string;
  createdAt: string;
}
export interface BusinessSession {
  id: string;
  locationId: string;
  resourceId: string | null;
  title: string;
  activity: string;
  group: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: "scheduled" | "cancelled";
  booked: number;
}
export interface BusinessBooking {
  id: string;
  sessionId: string;
  memberId: string;
  memberName: string;
  status: "booked" | "cancelled";
  createdAt: string;
}
export interface BusinessSnapshot {
  business: BusinessSummary;
  locations: BusinessLocation[];
  resources: BusinessResource[];
  plans: BusinessPlan[];
  members: BusinessMember[];
  memberships: BusinessMembership[];
  visits: BusinessVisit[];
  invoices: BusinessInvoice[];
  payments: BusinessPayment[];
  sessions: BusinessSession[];
  bookings: BusinessBooking[];
  stats: {
    members: number;
    activeMembers: number;
    inside: number;
    visitsToday: number;
    expiring: number;
    outstandingMinor: number | null;
    paidTodayMinor: number | null;
  };
  truncated: boolean;
}
export interface BusinessPass {
  token: string;
  expiresAt: string;
  memberName: string;
  businessName: string;
}
export interface BusinessMemberPortal {
  business: Omit<BusinessSummary, "role">;
  member: BusinessMember;
  memberships: BusinessMembership[];
  locations: BusinessLocation[];
  sessions: BusinessSession[];
  bookings: BusinessBooking[];
}
export interface BusinessEntryResult {
  decision: "allowed" | "denied" | "already_inside";
  reason: string;
  memberName: string | null;
  visit: BusinessVisit | null;
  remainingVisits: number | null;
  alreadyRecorded: boolean;
}
export interface BusinessClaimPreview {
  businessName: string;
  memberName: string;
  alreadyLinked: boolean;
}
export interface BusinessApi {
  list(): Promise<BusinessSummary[]>;
  setup(input: {
    organizationId?: string;
    name: string;
    sector: BusinessSector;
    timezone: string;
    currency: string;
  }): Promise<string>;
  snapshot(businessId: string): Promise<BusinessSnapshot>;
  saveLocation(businessId: string, input: BusinessLocation): Promise<string>;
  saveResource(businessId: string, input: BusinessResource): Promise<string>;
  savePlan(businessId: string, input: BusinessPlan): Promise<string>;
  saveMember(
    businessId: string,
    input: Omit<BusinessMember, "linked" | "createdAt">,
  ): Promise<string>;
  saveMembership(
    businessId: string,
    input: Pick<
      BusinessMembership,
      "id" | "memberId" | "planId" | "startDate" | "endDate" | "status"
    >,
  ): Promise<string>;
  createClaim(businessId: string, memberId: string): Promise<{ code: string; expiresAt: string }>;
  inspectClaim(code: string): Promise<BusinessClaimPreview>;
  redeemClaim(code: string): Promise<void>;
  myMemberships(): Promise<BusinessMemberPortal[]>;
  issuePass(businessId: string, memberId: string): Promise<BusinessPass>;
  checkIn(input: {
    businessId: string;
    locationId: string;
    requestId: string;
    token?: string;
    memberId?: string;
  }): Promise<BusinessEntryResult>;
  checkOut(businessId: string, visitId: string): Promise<void>;
  saveSession(businessId: string, input: Omit<BusinessSession, "booked">): Promise<string>;
  bookSession(
    businessId: string,
    sessionId: string,
    memberId: string,
    requestId: string,
  ): Promise<string>;
  cancelBooking(businessId: string, bookingId: string): Promise<void>;
  saveInvoice(
    businessId: string,
    input: Pick<BusinessInvoice, "id" | "memberId" | "label" | "totalMinor" | "dueDate">,
  ): Promise<string>;
  voidInvoice(businessId: string, invoiceId: string): Promise<void>;
  recordPayment(businessId: string, input: Omit<BusinessPayment, "createdAt">): Promise<string>;
  exportData(businessId: string): Promise<object>;
}
const id = z.string().uuid();
const name = z.string().trim().min(1).max(120);
const date = z.string().date();
export const businessSchemas = {
  setup: z
    .object({
      organizationId: id.optional(),
      name,
      sector: z.enum(businessSectors),
      timezone: z
        .string()
        .min(1)
        .max(100)
        .refine((v) => {
          try {
            new Intl.DateTimeFormat("en", { timeZone: v });
            return true;
          } catch {
            return false;
          }
        }),
      currency: z.enum(["BAM", "EUR", "RSD", "MKD", "ALL", "RON", "BGN", "USD", "GBP"]),
    })
    .strict(),
  location: z
    .object({
      id,
      name,
      city: z.string().trim().max(120),
      address: z.string().trim().max(300),
      capacity: z.number().int().min(1).max(100000).nullable(),
      active: z.boolean(),
    })
    .strict(),
  resource: z
    .object({
      id,
      locationId: id,
      name,
      kind: z.enum(["pitch", "court", "lane", "studio", "mat", "track", "room", "other"]),
      capacity: z.number().int().min(1).max(100000),
      active: z.boolean(),
    })
    .strict(),
  plan: z
    .object({
      id,
      name,
      durationDays: z.number().int().min(1).max(3660),
      visitLimit: z.number().int().min(1).max(100000).nullable(),
      priceMinor: z.number().int().min(0).max(100000000),
      locationIds: z.array(id).max(100),
      active: z.boolean(),
    })
    .strict(),
  member: z
    .object({
      id,
      name,
      number: z.string().trim().min(1).max(40),
      email: z.union([z.literal(""), z.string().email().max(254)]),
      phone: z.string().trim().max(60),
      group: z.string().trim().max(100),
      status: z.enum(["active", "paused", "blocked", "archived"]),
    })
    .strict(),
  membership: z
    .object({
      id,
      memberId: id,
      planId: id,
      startDate: date,
      endDate: date,
      status: z.enum(["active", "paused", "ended"]),
    })
    .strict()
    .refine((v) => v.endDate >= v.startDate, "End date must follow start date."),
  session: z
    .object({
      id,
      locationId: id,
      resourceId: id.nullable(),
      title: name,
      activity: z.string().trim().max(100),
      group: z.string().trim().max(100),
      startsAt: z.string().datetime({ offset: true }),
      endsAt: z.string().datetime({ offset: true }),
      capacity: z.number().int().min(1).max(100000),
      status: z.enum(["scheduled", "cancelled"]),
    })
    .strict()
    .refine(
      (v) => Date.parse(v.endsAt) > Date.parse(v.startsAt),
      "End time must follow start time.",
    ),
  invoice: z
    .object({
      id,
      memberId: id,
      label: name,
      totalMinor: z.number().int().min(1).max(100000000),
      dueDate: date,
    })
    .strict(),
  payment: z
    .object({
      id,
      invoiceId: id,
      amountMinor: z.number().int().min(1).max(100000000),
      kind: z.enum(["payment", "refund"]),
      method: z.enum(["cash", "bank", "external_card", "other"]),
      reference: z.string().trim().max(200),
    })
    .strict(),
};
