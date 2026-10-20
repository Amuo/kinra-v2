import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: vi.fn() } } }));
import { createDemoFeatures } from "../lib/feature-api";
import { createDemoCommunity } from "../lib/community-api";
const [owner, member, stranger] = [301, 302, 303].map(
  (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
) as [string, string, string];
describe("demo private-community parity", () => {
  it("keeps private posts behind accepted membership, prevents audience moves and enforces reviewed rejoin", async () => {
    const ownerFeatures = createDemoFeatures(
      owner,
      () => {},
      () => false,
    );
    const memberFeatures = createDemoFeatures(
      member,
      () => {},
      () => false,
    );
    const strangerFeatures = createDemoFeatures(
      stranger,
      () => {},
      () => false,
    );
    const a = createDemoCommunity(owner, ownerFeatures);
    const b = createDemoCommunity(member, memberFeatures);
    const c = createDemoCommunity(stranger, strangerFeatures);
    const id = await ownerFeatures.save("group", {
      title: "Demo secret",
      description: "Synthetic",
      type: "club",
    });
    await a.list();
    const post = await ownerFeatures.save("post", {
      body: "Private",
      category: "General",
      group_id: id,
    });
    expect(await strangerFeatures.list("post")).toEqual([]);
    const invitation = await a.createInvite(id, new Date(Date.now() + 86400000).toISOString());
    await b.inspectInvite(invitation.code);
    expect(await memberFeatures.list("post")).toEqual([]);
    await b.redeemInvite(invitation.code);
    expect((await memberFeatures.list("post")).map((p) => p.id)).toContain(post);
    expect((await b.list())[0]?.role).toBe("member");
    const ownPost = await memberFeatures.save("post", {
      body: "Member private",
      category: "General",
      group_id: id,
    });
    await expect(
      memberFeatures.save(
        "post",
        { body: "Moved", category: "General" },
        { id: ownPost, visibility: "public" },
      ),
    ).rejects.toThrow("audience");
    await expect(
      memberFeatures.save(
        "post",
        { body: "Leaked", category: "General", group_id: id },
        { visibility: "public" },
      ),
    ).rejects.toThrow();
    await a.kick(id, member);
    expect((await memberFeatures.list("post")).map((p) => p.id)).not.toContain(post);
    await expect(b.redeemInvite(invitation.code)).rejects.toThrow();
    const fresh = await a.createInvite(id, new Date(Date.now() + 86400000).toISOString());
    await b.redeemInvite(fresh.code);
    expect((await memberFeatures.list("post")).map((p) => p.id)).toContain(post);
    await expect(c.redeemInvite(fresh.code)).rejects.toThrow();
    await memberFeatures.save("block", { user_id: owner });
    expect((await memberFeatures.list("post")).map((p) => p.id)).not.toContain(post);
    expect(await b.list()).toEqual([]);
  });
});
