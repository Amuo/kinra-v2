import { useState } from "react";
import { MessageCircle, Send, Lock } from "lucide-react";
import { useAct, useApi, useMe, useQ } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "./sheets";
import { Empty, ErrorState, Skeleton } from "./ui";

export function PrivateMessages({ recipientId }: { recipientId?: string }) {
  const api = useApi();
  const me = useMe().data;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(recipientId ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const contacts = useQ(
    ["message-contacts", me?.role],
    (a) => (me?.role === "trainer" ? a.clients() : a.trainers()),
    open && !!me,
  );
  const messages = useQ(["features", "message"], (a) => a.features.list("message"), open);
  const target = selected || contacts.data?.[0]?.id || "";
  const contact = contacts.data?.find((person) => person.id === target);
  const draft = drafts[target] ?? "";
  const send = useAct((a, value: { recipient_id: string; body: string }) =>
    a.features.save("message", value),
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
        Private messages
      </Button>
      <Sheet
        open={open}
        onOpenChange={(value) => !send.isPending && setOpen(value)}
        title="Private messages"
        sub="Only you and your connected coach or client can read this conversation."
      >
        <div className="space-y-4">
          {contacts.isLoading ? (
            <Skeleton className="h-12" />
          ) : contacts.error ? (
            <ErrorState
              message={(contacts.error as Error).message}
              onRetry={() => contacts.refetch()}
            />
          ) : !contacts.data?.length ? (
            <Empty
              icon={<MessageCircle />}
              title="Connect before starting a conversation"
              body="Your active coach or client connections will appear here."
            />
          ) : (
            <>
              <label className="block text-label font-semibold">
                Conversation
                <select
                  aria-label="Conversation"
                  className="mt-2 h-12 w-full rounded-tile border border-border bg-surface px-3"
                  value={target}
                  disabled={send.isPending}
                  onChange={(event) => {
                    setSelected(event.target.value);
                    setError("");
                  }}
                >
                  <option value="" disabled>
                    Choose a connection
                  </option>
                  {contacts.data.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.display_name || "Connected person"}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="ghost"
                className="h-11 w-full"
                disabled={messages.isFetching}
                onClick={() => messages.refetch()}
              >
                {messages.isFetching ? "Refreshing…" : "Refresh conversation"}
              </Button>
              {messages.isLoading ? (
                <Skeleton className="h-32" />
              ) : messages.error ? (
                <ErrorState
                  message={(messages.error as Error).message}
                  onRetry={() => messages.refetch()}
                />
              ) : (
                <div
                  role="log"
                  aria-label={`Conversation with ${contact?.display_name ?? "your connection"}`}
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
                            ? me?.display_name || "You"
                            : contact?.display_name || "Your connection"}
                          <span className="ml-2 font-normal text-muted-foreground">
                            →{" "}
                            {message.owner_id === api.ownerId
                              ? contact?.display_name || "Your connection"
                              : "You"}
                          </span>
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words text-body">
                          {message.payload.body}
                        </p>
                        <time
                          dateTime={message.created_at}
                          className="mt-2 block text-caption text-muted-foreground"
                        >
                          {new Date(message.created_at).toLocaleString()}
                        </time>
                      </article>
                    ))
                  ) : (
                    <p className="py-5 text-center text-label text-muted-foreground">
                      Start a conversation with {contact?.display_name || "your connection"}.
                    </p>
                  )}
                </div>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!contact || !draft.trim()) return;
                  setError("");
                  const recipient = target;
                  send.mutate(
                    { recipient_id: recipient, body: draft.trim() },
                    {
                      onSuccess: () => setDrafts((previous) => ({ ...previous, [recipient]: "" })),
                      onError: (e) => setError(e.message),
                    },
                  );
                }}
              >
                <label className="block text-label font-semibold">
                  Your message
                  <Textarea
                    aria-label="Your message"
                    className="mt-2 min-h-28 bg-surface text-body"
                    value={draft}
                    maxLength={10000}
                    disabled={send.isPending}
                    onChange={(event) =>
                      setDrafts((previous) => ({ ...previous, [target]: event.target.value }))
                    }
                    placeholder="Share a question or an update"
                  />
                </label>
                <p className="my-3 flex gap-2 text-caption text-muted-foreground">
                  <Lock className="size-4 shrink-0" />
                  Sent messages cannot be edited. No delivery notification is promised.
                </p>
                {error && (
                  <p role="alert" className="mb-3 text-label text-destructive">
                    {error} Your draft is still here; you can retry.
                  </p>
                )}
                <Button
                  type="submit"
                  variant="volt"
                  className="h-12 w-full"
                  disabled={!contact || !draft.trim() || send.isPending}
                >
                  <Send />
                  {send.isPending ? "Sending…" : error ? "Retry sending" : "Send privately"}
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
            Close
          </Button>
        </div>
      </Sheet>
    </>
  );
}
