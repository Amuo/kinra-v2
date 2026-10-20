import { supabase } from "@/integrations/supabase/client";
import { bucket, from } from "./backend";
import type { FeatureApi } from "./feature-api";
import { parseFeature } from "./feature-types";
import {
  inspectResource,
  type ExpertResource,
  type ResourceApi,
  type ResourceUpload,
} from "./resources";

function payload(upload: ResourceUpload, title: string, description: string) {
  const { id: _id, ...metadata } = upload;
  return parseFeature("expert_resource", { ...metadata, title, description });
}
function ownPath(ownerId: string, upload: { storage_path: string }) {
  if (!new RegExp(`^${ownerId}/[0-9a-f-]{36}\\.pdf$`).test(upload.storage_path))
    throw new Error("This resource does not belong to your account.");
}
export function createLiveResources(ownerId: string, features: FeatureApi): ResourceApi {
  const pending = new WeakMap<File, ResourceUpload>();
  const auth = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== ownerId)
      throw new Error("Your account changed. Reopen this screen before saving.");
  };
  const ownExpert = async (expertId: string) => {
    const result = await from("feature_records")
      .select("id")
      .eq("id", expertId)
      .eq("kind", "expert")
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new Error("Choose your own expert profile first.");
  };
  return {
    async list(expertId) {
      await auth();
      return (await features.list("expert_resource")).filter(
        (resource) => resource.payload.expert_id === expertId,
      );
    },
    async upload(expertId, file) {
      await auth();
      await ownExpert(expertId);
      const inspected = await inspectResource(file);
      let upload = pending.get(file);
      if (upload && upload.expert_id !== expertId)
        throw new Error(
          "Finish or discard the original upload before choosing another expert profile.",
        );
      if (!upload) {
        const id = crypto.randomUUID();
        upload = {
          id,
          expert_id: expertId,
          storage_path: `${ownerId}/${id}.pdf`,
          filename: inspected.filename,
          mime: inspected.mime,
          bytes: file.size,
        };
        pending.set(file, upload);
      }
      const saved = await bucket("expert-materials").upload(upload.storage_path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (saved.error) {
        // A lost successful response can produce a conflict on retry. Verify the
        // private existing object instead of overwriting an immutable upload.
        if (String(saved.error.statusCode) !== "409") throw saved.error;
        const existing = await bucket("expert-materials").download(upload.storage_path);
        if (existing.error) throw existing.error;
        if (
          existing.data.size !== file.size ||
          String.fromCharCode(...new Uint8Array(await existing.data.slice(0, 5).arrayBuffer())) !==
            "%PDF-"
        )
          throw new Error("The existing upload could not be verified. Discard it and try again.");
      }
      return structuredClone(upload);
    },
    async save(upload, title, description, visibility) {
      await auth();
      ownPath(ownerId, upload);
      await ownExpert(upload.expert_id);
      return features.save("expert_resource", payload(upload, title, description), {
        id: upload.id,
        visibility,
      });
    },
    async discard(upload) {
      await auth();
      ownPath(ownerId, upload);
      const current = await from("feature_records")
        .select("id")
        .eq("id", upload.id)
        .eq("owner_id", ownerId)
        .eq("kind", "expert_resource")
        .maybeSingle();
      if (current.error) throw current.error;
      if (current.data) throw new Error("Remove the saved resource before deleting its file.");
      const result = await bucket("expert-materials").remove([upload.storage_path]);
      if (result.error) throw result.error;
    },
    async download(resource) {
      await auth();
      const { data, error } = await bucket("expert-materials").download(
        resource.payload.storage_path,
      );
      if (error) throw error;
      return data;
    },
    async remove(resource) {
      await auth();
      if (resource.owner_id !== ownerId) throw new Error("Only the resource owner can remove it.");
      ownPath(ownerId, resource.payload);
      // Unlink first so a failed file cleanup leaves an owner-only orphan. Both
      // steps are idempotent, so the same reviewed removal can be retried.
      const removed = await from("feature_records")
        .delete()
        .eq("id", resource.id)
        .eq("owner_id", ownerId)
        .eq("kind", "expert_resource");
      if (removed.error) throw removed.error;
      const file = await bucket("expert-materials").remove([resource.payload.storage_path]);
      if (file.error)
        throw new Error("The resource was unlinked. Retry removal to finish private file cleanup.");
    },
  };
}
const demoFiles = new Map<string, Blob>();
export function demoResourceMatches(
  ownerId: string,
  upload: { storage_path: string; bytes: number; mime: string },
) {
  const file = demoFiles.get(upload.storage_path);
  return (
    upload.storage_path.startsWith(`${ownerId}/`) &&
    !!file &&
    file.size === upload.bytes &&
    file.type === upload.mime &&
    upload.mime === "application/pdf"
  );
}
export function clearDemoResources(ownerId: string) {
  for (const path of demoFiles.keys()) if (path.startsWith(`${ownerId}/`)) demoFiles.delete(path);
}
export function createDemoResources(ownerId: string, features: FeatureApi): ResourceApi {
  const ownExpert = async (expertId: string) => {
    if (
      !(await features.list("expert")).some(
        (expert) => expert.id === expertId && expert.owner_id === ownerId,
      )
    )
      throw new Error("Choose your own expert profile first.");
  };
  return {
    async list(expertId) {
      return (await features.list("expert_resource")).filter(
        (resource) => resource.payload.expert_id === expertId,
      );
    },
    async upload(expertId, file) {
      await ownExpert(expertId);
      const inspected = await inspectResource(file);
      const id = crypto.randomUUID();
      const upload: ResourceUpload = {
        id,
        expert_id: expertId,
        storage_path: `${ownerId}/${id}.pdf`,
        filename: inspected.filename,
        mime: inspected.mime,
        bytes: file.size,
      };
      demoFiles.set(upload.storage_path, file);
      return upload;
    },
    async save(upload, title, description, visibility) {
      ownPath(ownerId, upload);
      await ownExpert(upload.expert_id);
      if (!demoFiles.has(upload.storage_path)) throw new Error("Upload the PDF first.");
      return features.save("expert_resource", payload(upload, title, description), {
        id: upload.id,
        visibility,
      });
    },
    async discard(upload) {
      ownPath(ownerId, upload);
      if ((await features.list("expert_resource")).some((resource) => resource.id === upload.id))
        throw new Error("Remove the saved resource before deleting its file.");
      demoFiles.delete(upload.storage_path);
    },
    async download(resource) {
      if (!(await features.list("expert_resource")).some((row) => row.id === resource.id))
        throw new Error("This resource is unavailable.");
      const file = demoFiles.get(resource.payload.storage_path);
      if (!file) throw new Error("This file is no longer available.");
      return file;
    },
    async remove(resource) {
      if (resource.owner_id !== ownerId) throw new Error("Only the resource owner can remove it.");
      ownPath(ownerId, resource.payload);
      if ((await features.list("expert_resource")).some((row) => row.id === resource.id))
        await features.remove(resource.id);
      demoFiles.delete(resource.payload.storage_path);
    },
  };
}
