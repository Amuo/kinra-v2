import type { FeaturePayloads, FeatureRecord } from "./feature-types";

export type ExpertResource = FeatureRecord<"expert_resource">;
export type ResourceUpload = Omit<FeaturePayloads["expert_resource"], "title" | "description"> & {
  id: string;
};
export interface ResourceApi {
  list(expertId: string): Promise<ExpertResource[]>;
  upload(expertId: string, file: File): Promise<ResourceUpload>;
  save(
    upload: ResourceUpload,
    title: string,
    description: string,
    visibility: "private" | "public",
  ): Promise<string>;
  discard(upload: ResourceUpload): Promise<void>;
  download(resource: ExpertResource): Promise<Blob>;
  remove(resource: ExpertResource): Promise<void>;
}
export const resourceLimit = 10 * 1024 * 1024;
export async function inspectResource(
  file: File,
): Promise<{ filename: string; mime: "application/pdf" }> {
  if (!file.size || file.size > resourceLimit) throw new Error("Choose a PDF up to 10 MB.");
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (file.type !== "application/pdf" || String.fromCharCode(...signature) !== "%PDF-")
    throw new Error("The file contents must match a PDF document.");
  const filename = [...file.name]
    .filter(
      (character) =>
        character.charCodeAt(0) > 31 &&
        character.charCodeAt(0) !== 127 &&
        character !== "/" &&
        character !== "\\",
    )
    .join("")
    .slice(0, 200)
    .trim();
  if (!filename) throw new Error("Choose a PDF with a filename.");
  return { filename, mime: "application/pdf" };
}
