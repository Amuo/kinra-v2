import { supabase } from "@/integrations/supabase/client";
import { bucket, from, featureRpc } from "./backend";
import { inspectAttachment, type AttachmentApi, type MessageAttachment } from "./attachments";

export function createLiveAttachments(ownerId: string): AttachmentApi {
  const auth = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== ownerId)
      throw new Error("Your account changed. Reopen this screen before saving.");
  };
  // Retain the path when a response is lost so retries remain idempotent.
  const pending = new WeakMap<File, { path: string; recipient: string; body: string }>();
  return {
    async list() {
      await auth();
      const { data, error } = await from("message_attachments")
        .select("*")
        .order("created_at")
        .limit(1000);
      if (error) throw error;
      return data as MessageAttachment[];
    },
    async send(recipient, body, file) {
      await auth();
      const inspected = await inspectAttachment(file);
      const text = body.trim() || inspected.filename;
      let upload = pending.get(file);
      if (upload && (upload.recipient !== recipient || upload.body !== text))
        throw new Error(
          "Retry the original attachment before changing the conversation or message.",
        );
      if (!upload) {
        const path = `${ownerId}/${crypto.randomUUID()}.${inspected.extension}`;
        const result = await bucket("message-attachments").upload(path, file, {
          contentType: inspected.mime,
          upsert: false,
        });
        if (result.error) throw result.error;
        upload = { path, recipient, body: text };
        pending.set(file, upload);
      }
      await auth();
      const { data, error } = await featureRpc("kinra_send_attachment", {
        recipient,
        body: text,
        path: upload.path,
        filename: inspected.filename,
        mime: inspected.mime,
        bytes: file.size,
        expected_owner: ownerId,
      });
      if (error) throw error;
      pending.delete(file);
      return data;
    },
    async download(attachment) {
      await auth();
      const { data, error } = await bucket("message-attachments").download(attachment.storage_path);
      if (error) throw error;
      return data;
    },
  };
}
export function createDemoAttachments(
  ownerId: string,
  send: (recipient: string, body: string) => Promise<string>,
): AttachmentApi {
  const rows: MessageAttachment[] = [];
  const files = new Map<string, Blob>();
  return {
    async list() {
      return structuredClone(rows);
    },
    async send(recipient, body, file) {
      const inspected = await inspectAttachment(file);
      const message = await send(recipient, body.trim() || inspected.filename);
      const id = crypto.randomUUID();
      rows.push({
        id,
        message_id: message,
        owner_id: ownerId,
        recipient_id: recipient,
        storage_path: id,
        filename: inspected.filename,
        mime: inspected.mime,
        bytes: file.size,
        created_at: new Date().toISOString(),
      });
      files.set(id, file);
      return message;
    },
    async download(attachment) {
      const file = files.get(attachment.id);
      if (!file) throw new Error("This file is no longer available.");
      return file;
    },
  };
}
