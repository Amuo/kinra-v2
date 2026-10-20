import { z } from "zod";

export type OrganizationRole = "owner" | "manager" | "staff";
export type StaffRole = Exclude<OrganizationRole, "owner">;
export interface OrgSummary {
  id: string;
  title: string;
  city: string;
  role: OrganizationRole;
}
export interface OrgStaff {
  organizationId: string;
  userId: string;
  displayName: string | null;
  role: StaffRole;
  createdAt: string;
}
export interface MembershipInput {
  organizationId: string;
  userId: string;
  status: "active" | "paused" | "ended";
  startDate: string;
  endDate?: string | null | undefined;
  planId?: string | null | undefined;
  paidAmount?: number | null | undefined;
  currency?: "EUR" | "USD" | "BAM" | "GBP" | null | undefined;
  notes?: string | undefined;
}
export interface OrgMember {
  organizationId: string;
  userId: string;
  displayName: string | null;
  joinedAt: string;
  membership: MembershipInput | null;
}
export interface OrgInvite {
  code: string;
  organizationId: string;
  role: StaffRole;
  expiresAt: string;
  revokedAt: string | null;
  usedAt: string | null;
  usedBy: string | null;
}
export interface InvitePreview {
  organizationId: string;
  title: string;
  role: StaffRole;
  expiresAt: string;
  accepted: boolean;
}
export interface AvailabilityRule {
  weekday: number;
  start: string;
  end: string;
  slotMinutes: number;
}
export interface AvailabilityException {
  date: string;
  unavailable: boolean;
  start?: string | undefined;
  end?: string | undefined;
  slotMinutes?: number | undefined;
}
export interface CoachAvailability {
  timezone: string;
  published: boolean;
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
}
export interface AvailableSlot {
  startsAt: string;
  endsAt: string;
}
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const slot = z
  .object({ start: time, end: time, slotMinutes: z.number().int().min(10).max(240) })
  .strict();
export const availabilitySchema = z
  .object({
    timezone: z
      .string()
      .min(1)
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }),
    published: z.boolean(),
    rules: z.array(slot.extend({ weekday: z.number().int().min(0).max(6) })).max(28),
    exceptions: z
      .array(
        z
          .object({
            date: z.string().date(),
            unavailable: z.boolean(),
            start: time.optional(),
            end: time.optional(),
            slotMinutes: z.number().int().min(10).max(240).optional(),
          })
          .strict(),
      )
      .max(100),
  })
  .strict()
  .superRefine((value, context) => {
    value.rules.forEach((rule, index) => {
      if (rule.end <= rule.start)
        context.addIssue({
          code: "custom",
          path: ["rules", index],
          message: "End time must follow start time on the same day.",
        });
      if (
        value.rules.some(
          (other, otherIndex) =>
            otherIndex < index &&
            other.weekday === rule.weekday &&
            other.start < rule.end &&
            other.end > rule.start,
        )
      )
        context.addIssue({
          code: "custom",
          path: ["rules", index],
          message: "Recurring time ranges must not overlap.",
        });
    });
    value.exceptions.forEach((exception, index) => {
      if (
        !exception.unavailable &&
        (!exception.start ||
          !exception.end ||
          !exception.slotMinutes ||
          exception.end <= exception.start)
      )
        context.addIssue({
          code: "custom",
          path: ["exceptions", index],
          message: "An available exception needs a complete time range and slot length.",
        });
    });
    if (
      new Set(value.exceptions.map((exception) => exception.date)).size !== value.exceptions.length
    )
      context.addIssue({ code: "custom", message: "Use one exception per date." });
  });
export const membershipSchema = z
  .object({
    organizationId: z.string().uuid(),
    userId: z.string().uuid(),
    status: z.enum(["active", "paused", "ended"]),
    startDate: z.string().date(),
    endDate: z.string().date().nullable().optional(),
    planId: z.string().uuid().nullable().optional(),
    paidAmount: z.number().finite().min(0).max(1000000).nullable().optional(),
    currency: z.enum(["EUR", "USD", "BAM", "GBP"]).nullable().optional(),
    notes: z.string().max(1000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate)
      context.addIssue({ code: "custom", message: "End date must follow the start date." });
    if (value.paidAmount != null && !value.currency)
      context.addIssue({ code: "custom", message: "Choose the currency for the recorded amount." });
  });
