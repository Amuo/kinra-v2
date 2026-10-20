export type CommunityRole = "owner" | "moderator" | "member";
export interface CommunityGroup {
  id: string;
  title: string;
  description: string;
  type: "interest" | "gym" | "club" | "challenge" | "education";
  visibility: "private" | "public";
  role: CommunityRole | null;
}
export interface GroupMember {
  userId: string;
  displayName: string | null;
  role: CommunityRole;
  joinedAt: string;
}
export interface GroupInvite {
  code: string;
  groupId: string;
  expiresAt: string;
  revokedAt: string | null;
  usedAt: string | null;
  usedBy: string | null;
}
export interface GroupInvitePreview {
  groupId: string;
  title: string;
  visibility: "private" | "public";
  expiresAt: string;
  accepted: boolean;
}
