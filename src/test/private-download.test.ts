import { beforeEach, describe, it, expect, vi } from "vitest";
import type { FeatureApi } from "../lib/feature-api";
import type { ExpertResource } from "../lib/resources";
import type { MessageAttachment } from "../lib/attachments";
const mocks = vi.hoisted(() => ({ read: vi.fn(), download: vi.fn(), getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: mocks.getUser } },
}));
vi.mock("../lib/backend", () => ({
  from: () => {
    const query = { select: () => query, eq: () => query, maybeSingle: mocks.read };
    return query;
  },
  bucket: () => ({ download: mocks.download }),
  featureRpc: vi.fn(),
}));
import { createLiveResources } from "../lib/resource-api";
import { createLiveAttachments } from "../lib/attachment-api";
const owner = "00000000-0000-4000-8000-000000009001";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: owner } }, error: null });
  mocks.read.mockResolvedValue({ data: { id: "readable" }, error: null });
  mocks.download.mockResolvedValue({ data: new Blob(["synthetic"]), error: null });
});
describe("private file permission revalidation", () => {
  const resource = {
    id: crypto.randomUUID(),
    payload: { storage_path: "synthetic/file.pdf" },
  } as ExpertResource;
  const attachment = {
    id: crypto.randomUUID(),
    storage_path: "synthetic/message.pdf",
  } as MessageAttachment;
  it.each(["resource", "attachment"] as const)(
    "denies a stale %s card before requesting cached bytes",
    async (kind) => {
      mocks.read.mockResolvedValue({ data: null, error: null });
      const promise =
        kind === "resource"
          ? createLiveResources(owner, {} as FeatureApi).download(resource)
          : createLiveAttachments(owner).download(attachment);
      await expect(promise).rejects.toThrow("no longer available");
      expect(mocks.download).not.toHaveBeenCalled();
    },
  );
  it.each(["resource", "attachment"] as const)(
    "forces fresh %s authorization on every allowed download",
    async (kind) => {
      const download = () =>
        kind === "resource"
          ? createLiveResources(owner, {} as FeatureApi).download(resource)
          : createLiveAttachments(owner).download(attachment);
      await download();
      await download();
      expect(mocks.read).toHaveBeenCalledTimes(2);
      const [first, second] = mocks.download.mock.calls;
      expect(first?.[1].cacheNonce).not.toBe(second?.[1].cacheNonce);
      expect(first?.[2]).toEqual({ cache: "no-store" });
    },
  );
});
