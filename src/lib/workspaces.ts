import { z } from "zod";
import type { Role } from "./types";
export const accountRoleSchema = z.enum([
  "solo",
  "client",
  "trainer",
  "specialist",
  "organization",
]);
export type AccountRole = z.infer<typeof accountRoleSchema>;
export const workspaceStateSchema = z.object({
  active: accountRoleSchema.nullable(),
  roles: z.array(accountRoleSchema),
  primary: z.enum(["solo", "client", "trainer"]).nullable(),
});
export type WorkspaceState = z.infer<typeof workspaceStateSchema>;
export const accountRoleLabels = {
  solo: "Solo",
  client: "Client",
  trainer: "Coach",
  specialist: "Specialist",
  organization: "Organization",
} as const;
export function coreRole(role: AccountRole): Role {
  return role === "specialist" ? "trainer" : role === "organization" ? "solo" : role;
}
