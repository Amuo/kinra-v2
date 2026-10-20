import { featureRpc } from "./backend";
import type { Json } from "@/integrations/supabase/types";
import type { FeatureApi } from "./feature-api";
import type { FeatureRecord } from "./feature-types";
import type {
  CommunityGroup,
  CommunityRole,
  GroupInvite,
  GroupInvitePreview,
  GroupMember,
} from "./community";

export interface CommunityApi {
  list(): Promise<CommunityGroup[]>;
  members(groupId: string): Promise<GroupMember[]>;
  invites(groupId: string): Promise<GroupInvite[]>;
  createInvite(groupId: string, expiresAt: string): Promise<GroupInvite>;
  inspectInvite(code: string): Promise<GroupInvitePreview>;
  redeemInvite(code: string): Promise<GroupInvitePreview>;
  revokeInvite(groupId: string, code: string): Promise<void>;
  join(groupId: string): Promise<void>;
  leave(groupId: string): Promise<void>;
  kick(groupId: string, userId: string): Promise<void>;
  setModerator(groupId: string, userId: string, enabled: boolean): Promise<void>;
  removePost(groupId: string, postId: string): Promise<void>;
}
type Rpc = (
  name: string,
  args: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;
const rpc = featureRpc as unknown as Rpc;
export function createLiveCommunity(ownerId: string): CommunityApi {
  async function call<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const result = await rpc(name, { ...args, expected_owner: ownerId });
    if (result.error) throw new Error(result.error.message);
    return result.data as T;
  }
  const admin = <T>(action: string, groupId: string | null, data: unknown = {}) =>
    call<T>("kinra_community_admin", {
      action,
      group_id: groupId,
      data: JSON.parse(JSON.stringify(data)) as Json,
    });
  return {
    list: () => admin("list", null),
    members: (id) => admin("members", id),
    invites: (id) => admin("invites", id),
    createInvite: (id, expiresAt) => admin("createInvite", id, { expiresAt }),
    inspectInvite: (code) =>
      call("kinra_community_redeem", { invitation_code: code, accept: false }),
    redeemInvite: (code) => call("kinra_community_redeem", { invitation_code: code, accept: true }),
    revokeInvite: (id, code) => admin("revokeInvite", id, { code }),
    join: (id) => admin("join", id),
    leave: (id) => admin("leave", id),
    kick: (id, userId) => admin("kick", id, { userId }),
    setModerator: (id, userId, enabled) => admin("setModerator", id, { userId, enabled }),
    removePost: (id, postId) => admin("removePost", id, { postId }),
  };
}

const groups = new Map<string, FeatureRecord<"group">>();
const memberships = new Map<string, Map<string, string>>();
const moderators = new Map<string, Set<string>>();
const invitations: GroupInvite[] = [];
const participants = new Map<string, FeatureApi>();
const removals = new Map<string, Map<string, number>>();
const invitationCreated = new Map<string, number>();
let communityRevision = 0;
const blockedChecks = new Map<string, (otherId: string) => boolean>();
export function registerDemoCommunityBlockCheck(
  ownerId: string,
  check: (otherId: string) => boolean,
) {
  blockedChecks.set(ownerId, check);
}
export const demoCommunityRemoved = (ownerId: string, groupId: string) =>
  removals.get(groupId)?.has(ownerId) ?? false;
export function clearDemoCommunity(ownerId: string) {
  const owned = new Set(
    [...groups.values()].filter((group) => group.owner_id === ownerId).map((group) => group.id),
  );
  for (const id of owned) {
    groups.delete(id);
    memberships.delete(id);
    moderators.delete(id);
    removals.delete(id);
  }
  for (const joined of memberships.values()) joined.delete(ownerId);
  for (const roles of moderators.values()) roles.delete(ownerId);
  for (const removed of removals.values()) removed.delete(ownerId);
  for (let i = invitations.length - 1; i >= 0; i--) {
    const invitation = invitations[i]!;
    if (owned.has(invitation.groupId)) {
      invitationCreated.delete(invitation.code);
      invitations.splice(i, 1);
    } else if (invitation.usedBy === ownerId) invitation.usedBy = null;
  }
  participants.delete(ownerId);
  blockedChecks.delete(ownerId);
}
export function exportDemoCommunity(ownerId: string) {
  const available = [...groups.values()].filter((group) => demoCommunityRole(ownerId, group.id));
  return available.map((group) => ({
    groupId: group.id,
    title: group.payload.title,
    role: demoCommunityRole(ownerId, group.id),
    members: [...(memberships.get(group.id) ?? new Map())].map(([userId, joinedAt]) => ({
      userId,
      joinedAt,
      role: demoCommunityRole(userId, group.id),
    })),
    invitations:
      demoCommunityRole(ownerId, group.id) === "owner" ||
      demoCommunityRole(ownerId, group.id) === "moderator"
        ? clone(invitations.filter((invitation) => invitation.groupId === group.id))
        : [],
  }));
}
/** Used by demo feature visibility/guards; never consulted by live authorization. */
export function demoCommunityRole(userId: string, groupId: string): CommunityRole | null {
  const group = groups.get(groupId);
  if (!group) return null;
  if (blockedChecks.get(userId)?.(group.owner_id)) return null;
  if (group.owner_id === userId) return "owner";
  if (demoCommunityRemoved(userId, groupId)) return null;
  if (!memberships.get(groupId)?.has(userId)) return null;
  return moderators.get(groupId)?.has(userId) ? "moderator" : "member";
}
const clone = <T>(value: T): T => structuredClone(value);
export function createDemoCommunity(ownerId: string, features: FeatureApi): CommunityApi {
  participants.set(ownerId, features);
  async function refresh() {
    for (const [id, api] of participants) {
      const own = (await api.list("group")).filter((g) => g.owner_id === id);
      for (const [key, value] of groups)
        if (value.owner_id === id && !own.some((g) => g.id === key)) {
          groups.delete(key);
          memberships.delete(key);
          moderators.delete(key);
        }
      own.forEach((g) => groups.set(g.id, g));
      for (const m of await api.list("group_member"))
        if (m.owner_id === id) {
          const joined = memberships.get(m.payload.group_id) ?? new Map<string, string>();
          joined.set(id, m.created_at);
          memberships.set(m.payload.group_id, joined);
        }
    }
  }
  async function requireRole(id: string, minimum: "member" | "moderator" | "owner" = "member") {
    await refresh();
    const role = demoCommunityRole(ownerId, id);
    if (
      !role ||
      (minimum === "owner" && role !== "owner") ||
      (minimum === "moderator" && role === "member")
    )
      throw new Error("Group access required.");
    return role;
  }
  async function preview(code: string, accept: boolean): Promise<GroupInvitePreview> {
    await refresh();
    const invitation = invitations.find((i) => i.code === code);
    const group = invitation && groups.get(invitation.groupId);
    if (
      !invitation ||
      !group ||
      blockedChecks.get(ownerId)?.(group.owner_id) ||
      invitation.revokedAt ||
      Date.parse(invitation.expiresAt) <= Date.now() ||
      (invitation.usedBy && invitation.usedBy !== ownerId) ||
      (removals.get(group.id)?.get(ownerId) ?? 0) >= (invitationCreated.get(code) ?? Infinity)
    )
      throw new Error("This invitation is unavailable or expired.");
    if (invitation.usedAt && !demoCommunityRole(ownerId, group.id))
      throw new Error("This invitation has already been used.");
    if (accept && !invitation.usedAt) {
      removals.get(group.id)?.delete(ownerId);
      const joined = memberships.get(group.id) ?? new Map<string, string>();
      joined.set(ownerId, new Date().toISOString());
      memberships.set(group.id, joined);
      invitation.usedAt = new Date().toISOString();
      invitation.usedBy = ownerId;
    }
    return {
      groupId: group.id,
      title: group.payload.title,
      visibility: group.visibility,
      expiresAt: invitation.expiresAt,
      accepted: accept || !!invitation.usedAt,
    };
  }
  async function removeMember(id: string, userId: string) {
    memberships.get(id)?.delete(userId);
    moderators.get(id)?.delete(userId);
    const api = participants.get(userId);
    if (api)
      for (const m of await api.list("group_member"))
        if (m.owner_id === userId && m.payload.group_id === id) await api.remove(m.id);
  }
  return {
    async list() {
      await refresh();
      return [...groups.values()]
        .filter(
          (g) =>
            !blockedChecks.get(ownerId)?.(g.owner_id) &&
            (g.visibility === "public" || demoCommunityRole(ownerId, g.id)),
        )
        .map((g) => ({
          id: g.id,
          title: g.payload.title,
          description: g.payload.description,
          type: g.payload.type,
          visibility: g.visibility,
          role: demoCommunityRole(ownerId, g.id),
        }));
    },
    async members(id) {
      await requireRole(id);
      const group = groups.get(id)!;
      const people = new Map(memberships.get(id));
      people.set(group.owner_id, group.created_at);
      return [...people].map(([userId, joinedAt]) => ({
        userId,
        joinedAt,
        displayName: null,
        role: demoCommunityRole(userId, id)!,
      }));
    },
    async invites(id) {
      await requireRole(id, "moderator");
      return clone(invitations.filter((i) => i.groupId === id));
    },
    async createInvite(id, expiresAt) {
      await requireRole(id, "moderator");
      const expiry = Date.parse(expiresAt);
      if (
        !Number.isFinite(expiry) ||
        expiry < Date.now() + 5 * 60000 ||
        expiry > Date.now() + 30 * 86400000
      )
        throw new Error("Use an expiry between five minutes and thirty days.");
      const invitation: GroupInvite = {
        code: crypto.randomUUID(),
        groupId: id,
        expiresAt,
        revokedAt: null,
        usedAt: null,
        usedBy: null,
      };
      invitationCreated.set(invitation.code, ++communityRevision);
      invitations.push(invitation);
      return clone(invitation);
    },
    inspectInvite: (code) => preview(code, false),
    redeemInvite: (code) => preview(code, true),
    async revokeInvite(id, code) {
      await requireRole(id, "moderator");
      const invite = invitations.find((i) => i.groupId === id && i.code === code);
      if (!invite) throw new Error("Invitation unavailable.");
      invite.revokedAt = new Date().toISOString();
    },
    async join(id) {
      await refresh();
      const group = groups.get(id);
      if (!group || blockedChecks.get(ownerId)?.(group.owner_id) || group.visibility !== "public")
        throw new Error("Accept an invitation to join a private group.");
      if (demoCommunityRemoved(ownerId, id))
        throw new Error("A moderator must issue a new invitation before you can rejoin.");
      if (demoCommunityRole(ownerId, id)) return;
      const joined = memberships.get(id) ?? new Map<string, string>();
      joined.set(ownerId, new Date().toISOString());
      memberships.set(id, joined);
    },
    async leave(id) {
      const role = await requireRole(id);
      if (role === "owner")
        throw new Error("The owner must delete the group instead of leaving it.");
      await removeMember(id, ownerId);
    },
    async kick(id, userId) {
      const role = await requireRole(id, "moderator");
      const target = demoCommunityRole(userId, id);
      if (
        target === "owner" ||
        userId === ownerId ||
        (role === "moderator" && target === "moderator")
      )
        throw new Error(
          "A moderator cannot remove the owner or another moderator. Use Leave for yourself.",
        );
      const removed = removals.get(id) ?? new Map<string, number>();
      removed.set(userId, ++communityRevision);
      removals.set(id, removed);
      await removeMember(id, userId);
    },
    async setModerator(id, userId, enabled) {
      await requireRole(id, "owner");
      if (!memberships.get(id)?.has(userId)) throw new Error("Choose an existing member.");
      const set = moderators.get(id) ?? new Set<string>();
      if (enabled) set.add(userId);
      else set.delete(userId);
      moderators.set(id, set);
    },
    async removePost(id, postId) {
      const role = demoCommunityRole(ownerId, id);
      for (const [personId, api] of participants)
        for (const post of await api.list("post"))
          if (post.id === postId && post.owner_id === personId && post.payload.group_id === id) {
            if (personId !== ownerId && role !== "owner" && role !== "moderator")
              throw new Error("You cannot remove this post.");
            await api.remove(postId);
            return;
          }
      throw new Error("This post is unavailable.");
    },
  };
}
