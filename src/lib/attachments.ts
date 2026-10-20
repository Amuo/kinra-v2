export interface MessageAttachment {
  id: string;
  message_id: string;
  owner_id: string;
  recipient_id: string;
  storage_path: string;
  filename: string;
  mime: string;
  bytes: number;
  created_at: string;
}
export interface AttachmentApi {
  list(): Promise<MessageAttachment[]>;
  send(recipientId: string, body: string, file: File): Promise<string>;
  download(attachment: MessageAttachment): Promise<Blob>;
}
export const attachmentLimit = 10 * 1024 * 1024;
export async function inspectAttachment(file: File) {
  if (!file.size || file.size > attachmentLimit)
    throw new Error("Choose a JPG, PNG, WebP or PDF up to 10 MB.");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  const kind =
    bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? ["image/jpeg", "jpg"]
      : bytes[0] === 137 &&
          ascii(1, 3) === "PNG" &&
          bytes[4] === 13 &&
          bytes[5] === 10 &&
          bytes[6] === 26 &&
          bytes[7] === 10
        ? ["image/png", "png"]
        : ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP"
          ? ["image/webp", "webp"]
          : ascii(0, 5) === "%PDF-"
            ? ["application/pdf", "pdf"]
            : null;
  if (!kind || file.type !== kind[0])
    throw new Error("The file contents do not match a supported file type.");
  const filename = [...file.name]
    .filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127 && c !== "/" && c !== "\\")
    .join("")
    .slice(0, 200)
    .trim();
  if (!filename) throw new Error("Choose a file with a name.");
  return { mime: kind[0]!, extension: kind[1]!, filename };
}
