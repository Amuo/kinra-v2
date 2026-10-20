import { attachmentLimit, type MessageAttachment } from "@/lib/attachments";
import { errorText } from "@/lib/i18n-errors";
import { dateTime, t as tr, useLanguage, Message } from "@/lib/i18n";
import { useState } from "react";
import { MessageCircle, Send, Lock, Download, Paperclip, X } from "lucide-react";
import { useAct, useApi, useMe, useQ } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "./sheets";
import { Empty, ErrorState, Skeleton } from "./ui";

export function PrivateMessages({ recipientId }: { recipientId?: string }) {
  useLanguage();
  const api = useApi();
  const me = useMe().data;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(recipientId ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [error, setError] = useState("");
  const contacts = useQ(
    ["message-contacts", me?.role],
    (a) => (me?.role === "trainer" ? a.clients() : a.trainers()),
    open && !!me,
  );
  const messages = useQ(["features", "message"], (a) => a.features.list("message"), open);
  const attachments = useQ(["message-attachments"], (a) => a.attachments.list(), open);
  const target = selected || contacts.data?.[0]?.id || "";
  const contact = contacts.data?.find((person) => person.id === target);
  const draft = drafts[target] ?? "";
  const file = files[target];
  const send = useAct((a, value: { recipient_id: string; body: string; file?: File }) =>
    value.file
      ? a.attachments.send(value.recipient_id, value.body || value.file.name, value.file)
      : a.features.save("message", { recipient_id: value.recipient_id, body: value.body }),
  );
  const conversation = (messages.data ?? [])
    .filter(
      (message) =>
        (message.owner_id === api.ownerId && message.payload.recipient_id === target) ||
        (message.owner_id === target && message.payload.recipient_id === api.ownerId),
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return (
    <>
      <Button variant="glass" className="h-12 w-full" onClick={() => setOpen(true)}>
        <MessageCircle />
        <Message source="Private messages" />
      </Button>
      <Sheet
        open={open}
        onOpenChange={(value) => !send.isPending && setOpen(value)}
        title={tr("Private messages")}
        sub={tr("Only you and your connected coach or client can read this conversation.")}
      >
        <div className="space-y-4">
          {contacts.isLoading ? (
            <Skeleton className="h-12" />
          ) : contacts.error ? (
            <ErrorState message={errorText(contacts.error)} onRetry={() => contacts.refetch()} />
          ) : !contacts.data?.length ? (
            <Empty
              icon={<MessageCircle />}
              title={tr("Connect before starting a conversation")}
              body="Your active coach or client connections will appear here."
            />
          ) : (
            <>
              <label className="block text-label font-semibold">
                <Message source="Conversation" />
                <select
                  aria-label={tr("Conversation")}
                  className="mt-2 h-12 w-full rounded-tile border border-border bg-surface px-3"
                  value={target}
                  disabled={send.isPending}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    setError("");
                  }}
                >
                  <option value="" disabled>
                    <Message source="Choose a connection" />
                  </option>
                  {contacts.data.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.display_name || tr("Connected person")}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="ghost"
                className="h-11 w-full"
                disabled={messages.isFetching}
                onClick={() => {
                  void messages.refetch();
                  void attachments.refetch();
                }}
              >
                {messages.isFetching ? tr("Refreshing…") : tr("Refresh conversation")}
              </Button>
              {attachments.error && (
                <ErrorState
                  message={tr("Attachments could not load. Your messages are still available.")}
                  onRetry={() => attachments.refetch()}
                />
              )}
              {messages.isLoading ? (
                <Skeleton className="h-32" />
              ) : messages.error ? (
                <ErrorState
                  message={errorText(messages.error)}
                  onRetry={() => messages.refetch()}
                />
              ) : (
                <div
                  role="log"
                  aria-label={tr("Conversation with {p0}", {
                    p0: contact?.display_name ?? "your connection",
                  })}
                  aria-live="polite"
                  className="max-h-80 space-y-3 overflow-y-auto rounded-tile bg-background/50 p-3"
                >
                  {conversation.length ? (
                    conversation.map((message) => (
                      <article
                        key={message.id}
                        className={`rounded-tile border border-border p-3 ${message.owner_id === api.ownerId ? "ml-6 bg-volt/5" : "mr-6 bg-surface"}`}
                      >
                        <p className="text-caption font-semibold">
                          {message.owner_id === api.ownerId
                            ? me?.display_name || tr("You")
                            : contact?.display_name || tr("Your connection")}
                          <span className="ml-2 font-normal text-muted-foreground">
                            →{" "}
                            {message.owner_id === api.ownerId
                              ? contact?.display_name || tr("Your connection")
                              : tr("You")}
                          </span>
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-body">
                          {message.payload.body}
                        </p>
                        {attachments.data
                          ?.filter((attachment) => attachment.message_id === message.id)
                          .map((attachment) => (
                            <AttachmentDownload key={attachment.id} attachment={attachment} />
                          ))}
                        <time
                          dateTime={message.created_at}
                          className="mt-2 block text-caption text-muted-foreground"
                        >
                          {dateTime(new Date(message.created_at))}
                        </time>
                      </article>
                    ))
                  ) : (
                    <p className="py-5 text-center text-label text-muted-foreground">
                      <Message
                        source="Start a conversation with {p0}."
                        values={{ p0: contact?.display_name || "your connection" }}
                      />
                    </p>
                  )}
                </div>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!contact || (!draft.trim() && !file)) return;
                  setError("");
                  const recipient = target;
                  send.mutate(
                    { recipient_id: recipient, body: draft.trim(), ...(file ? { file } : {}) },
                    {
                      onSuccess: () => {
                        setDrafts((previous) => ({ ...previous, [recipient]: "" }));
                        setFiles((previous) => ({ ...previous, [recipient]: undefined }));
                      },
                      onError: (e) => setError(errorText(e)),
                    },
                  );
                }}
              >
                <label className="block text-label font-semibold">
                  <Message source="Your message" />
                  <Textarea
                    aria-label={tr("Your message")}
                    className="mt-2 min-h-28 bg-surface text-body"
                    value={draft}
                    maxLength={10000}
                    disabled={send.isPending}
                    onChange={(event) =>
                      setDrafts((previous) => ({ ...previous, [target]: event.target.value }))
                    }
                    placeholder={tr("Share a question or an update")}
                  />
                </label>
                <label className="mt-3 block rounded-tile border border-dashed border-border p-3 text-label">
                  <span className="mb-2 flex items-center gap-2 font-semibold">
                    <Paperclip className="size-4" aria-hidden="true" />
                    {tr("Attach a file (optional)")}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={send.isPending || !contact}
                    className="block min-h-11 w-full min-w-0 text-caption file:mr-2 file:min-h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:text-secondary-foreground"
                    onChange={(event) => {
                      const next = event.target.files?.[0];
                      event.target.value = "";
                      if (!next) return;
                      if (
                        !next.size ||
                        next.size > attachmentLimit ||
                        !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
                          next.type,
                        )
                      ) {
                        setError(tr("Choose a JPG, PNG, WebP or PDF up to 10 MB."));
                        return;
                      }
                      setFiles((previous) => ({ ...previous, [target]: next }));
                      setError("");
                    }}
                  />
                  <span className="mt-2 block text-caption text-muted-foreground">
                    {tr("One JPG, PNG, WebP or PDF per message, up to 10 MB.")}
                  </span>
                </label>
                {file && (
                  <div className="mt-3 flex items-start gap-3 rounded-tile border border-border bg-surface p-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-label font-semibold">{file.name}</p>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {tr("{size} MB · ready to send", {
                          size: (file.size / 1024 / 1024).toFixed(2),
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0"
                      aria-label={tr("Remove attachment")}
                      disabled={send.isPending}
                      onClick={() => setFiles((previous) => ({ ...previous, [target]: undefined }))}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                )}
                <p className="my-3 flex gap-2 text-caption text-muted-foreground">
                  <Lock className="size-4 shrink-0" />
                  <Message source="Sent messages cannot be edited. No delivery notification is promised." />
                </p>
                {error && (
                  <p role="alert" className="mb-3 text-label text-destructive">
                    <Message
                      source="{p0}Your draft is still here; you can retry."
                      values={{ p0: error }}
                    />
                  </p>
                )}
                <Button
                  type="submit"
                  variant="volt"
                  className="h-12 w-full"
                  disabled={!contact || (!draft.trim() && !file) || send.isPending}
                >
                  <Send />
                  {send.isPending
                    ? tr("Sending…")
                    : error
                      ? tr("Retry sending")
                      : tr("Send privately")}
                </Button>
              </form>
            </>
          )}
          <Button
            variant="ghost"
            className="h-11 w-full"
            disabled={send.isPending}
            onClick={() => setOpen(false)}
          >
            <Message source="Close" />
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function AttachmentDownload({ attachment }: { attachment: MessageAttachment }) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="mt-3">
      <Button
        type="button"
        wrap
        variant="glass"
        disabled={busy}
        className="min-h-12 w-full justify-start text-left"
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const blob = await api.attachments.download(attachment);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = attachment.filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (cause) {
            setError(errorText(cause));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-all">
          {busy ? tr("Downloading…") : attachment.filename}
          <span className="mt-1 block text-caption text-muted-foreground">
            {tr("{size} MB", { size: (attachment.bytes / 1024 / 1024).toFixed(2) })}
          </span>
        </span>
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
