import { useState } from "react";
import { Copy, Plus, Users } from "lucide-react";
import { useAct, useMe, useQ } from "@/lib/api";
import { t, useLanguage, dateTime } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import type { CommunityGroup } from "@/lib/community";
import { today, iso } from "@/lib/stats";
import { addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "./sheets";
import { ErrorState, Skeleton } from "./ui";
export function CommunityGroups() {
  useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button wrap variant="glass" className="mt-3 min-h-12 w-full" onClick={() => setOpen(true)}>
        <Users aria-hidden="true" />
        {t("Groups & community")}
      </Button>
      {open && (
        <Sheet open onOpenChange={setOpen} title={t("Groups & community")}>
          <GroupsHome />
        </Sheet>
      )}
    </>
  );
}
function GroupsHome() {
  const groups = useQ(["community-groups"], (api) => api.community.list());
  const [selected, setSelected] = useState("");
  const [create, setCreate] = useState(false);
  const [query, setQuery] = useState("");
  const group = groups.data?.find((item) => item.id === selected);
  if (group)
    return (
      <>
        <Button wrap variant="ghost" className="mb-3 min-h-11" onClick={() => setSelected("")}>
          {t("Back to groups")}
        </Button>
        <GroupDetail key={group.id} group={group} onLeave={() => setSelected("")} />
      </>
    );
  return (
    <div className="space-y-4">
      <p className="text-label text-muted-foreground">
        {t(
          "Discover public groups or accept an invitation to a private group. Group posts are shared with members.",
        )}
      </p>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="min-h-12"
        aria-label={t("Search groups")}
        placeholder={t("Search groups")}
      />
      {groups.isLoading ? (
        <Skeleton className="h-40" />
      ) : groups.error ? (
        <ErrorState onRetry={() => groups.refetch()} />
      ) : (
        <div className="space-y-3">
          {groups.data
            ?.filter((item) =>
              `${item.title} ${item.description}`
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
            )
            .map((item) => (
              <Button
                key={item.id}
                wrap
                variant="glass"
                className="h-auto min-h-20 w-full flex-col items-start gap-2 p-4 text-left"
                onClick={() => setSelected(item.id)}
              >
                <span className="font-display text-title font-semibold">{item.title}</span>
                <span className="text-caption text-muted-foreground">
                  {t(item.visibility === "private" ? "Private group" : "Public group")}
                  {item.role ? ` · ${t(item.role)}` : ""}
                </span>
              </Button>
            ))}
          {!groups.data?.length && (
            <p className="text-label text-muted-foreground">{t("No groups available yet.")}</p>
          )}
        </div>
      )}
      <details className="rounded-tile border border-border p-4">
        <summary className="cursor-pointer py-2 text-label font-semibold">
          {t("Join with an invitation")}
        </summary>
        <GroupInviteAcceptance />
      </details>
      <Button
        wrap
        variant="volt"
        className="min-h-12 w-full"
        onClick={() => setCreate((value) => !value)}
      >
        <Plus aria-hidden="true" />
        {t(create ? "Close group form" : "Create a group")}
      </Button>
      {create && <CreateGroup onSaved={() => setCreate(false)} />}
    </div>
  );
}
function CreateGroup({ onSaved }: { onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CommunityGroup["type"]>("interest");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [error, setError] = useState("");
  const save = useAct((api) =>
    api.features.save("group", { title, description, type }, { visibility }),
  );
  return (
    <form
      className="space-y-3 rounded-tile border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        save.mutate(undefined, {
          onSuccess: onSaved,
          onError: (cause) => setError(errorText(cause)),
        });
      }}
    >
      <fieldset disabled={save.isPending} className="min-w-0 space-y-3">
        <label className="block text-label">
          {t("Group name")}
          <Input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 min-h-12"
          />
        </label>
        <label className="block text-label">
          {t("Description")}
          <Textarea
            value={description}
            maxLength={10000}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
          />
        </label>
        <label className="block text-label">
          {t("Group type")}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CommunityGroup["type"])}
            className="mt-1 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
          >
            {(["interest", "gym", "club", "challenge", "education"] as const).map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-label">
          {t("Group visibility")}
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "private" | "public")}
            className="mt-1 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
          >
            <option value="private">{t("Private — invitation required")}</option>
            <option value="public">{t("Public — signed-in people can discover and join")}</option>
          </select>
        </label>
        <p className="text-caption text-muted-foreground">
          {t(
            visibility === "private"
              ? "Only members can see this group and its posts. Invite codes must be shared manually."
              : "The group name and description are visible to signed-in people. Posts created here are visible to members.",
          )}
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        wrap
        variant="volt"
        className="min-h-12 w-full"
        disabled={save.isPending}
      >
        {t(save.isPending ? "Saving…" : "Create group with this visibility")}
      </Button>
    </form>
  );
}
function GroupInviteAcceptance() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const preview = useQ(
    ["group-invite-preview", review],
    (api) => api.community.inspectInvite(review),
    !!review,
  );
  const accept = useAct((api) => api.community.redeemInvite(review));
  return (
    <div className="mt-3 space-y-3">
      <label className="block text-label">
        {t("Invitation code")}
        <Input
          value={code}
          disabled={accept.isPending}
          onChange={(e) => {
            setCode(e.target.value);
            setReview("");
            setDone(false);
          }}
          className="mt-1 min-h-12"
        />
      </label>
      <Button
        wrap
        variant="glass"
        className="min-h-11 w-full"
        disabled={!code.trim() || accept.isPending}
        onClick={() => setReview(code.trim())}
      >
        {t("Review invitation")}
      </Button>
      {review &&
        (preview.isLoading ? (
          <Skeleton className="h-24" />
        ) : preview.error ? (
          <ErrorState message={errorText(preview.error)} onRetry={() => preview.refetch()} />
        ) : (
          preview.data && (
            <div className="space-y-3 rounded-tile border border-primary/25 p-4">
              <h3 className="text-title font-semibold">{preview.data.title}</h3>
              <p className="text-label">
                {t(preview.data.visibility === "private" ? "Private group" : "Public group")}
              </p>
              <p className="text-label text-muted-foreground">
                {t(
                  "Joining makes you a member. Other members can see your name and posts; this grants no moderator permissions.",
                )}
              </p>
              <p className="text-caption text-muted-foreground">
                {t("Expires {date}", { date: dateTime(new Date(preview.data.expiresAt)) })}
              </p>
              <Button
                wrap
                variant="volt"
                className="min-h-12 w-full"
                disabled={accept.isPending || done || preview.data.accepted}
                onClick={() =>
                  accept.mutate(undefined, {
                    onSuccess: () => setDone(true),
                    onError: (cause) => setError(errorText(cause)),
                  })
                }
              >
                {t(done || preview.data.accepted ? "Invitation accepted" : "Join this group")}
              </Button>
            </div>
          )
        ))}
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
function GroupDetail({ group, onLeave }: { group: CommunityGroup; onLeave: () => void }) {
  const me = useMe().data;
  const [tab, setTab] = useState<"posts" | "members" | "invites">("posts");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{
    action: "leave" | "kick" | "moderator" | "unmoderator" | "post";
    id: string;
    name: string;
  } | null>(null);
  const admin = group.role === "owner" || group.role === "moderator";
  const posts = useQ(["features", "post"], (api) => api.features.list("post"), !!group.role);
  const members = useQ(
    ["group-members", group.id],
    (api) => api.community.members(group.id),
    !!group.role,
  );
  const join = useAct((api) => api.community.join(group.id));
  const send = useAct((api) =>
    api.features.save(
      "post",
      { body: body.trim(), category: "discussion", group_id: group.id },
      { visibility: "private" },
    ),
  );
  const moderate = useAct(async (api, target: NonNullable<typeof confirm>) => {
    if (target.action === "leave") await api.community.leave(group.id);
    else if (target.action === "kick") await api.community.kick(group.id, target.id);
    else if (target.action === "post") await api.community.removePost(group.id, target.id);
    else await api.community.setModerator(group.id, target.id, target.action === "moderator");
  });
  const label = (id: string) =>
    members.data?.find((member) => member.userId === id)?.displayName || t("Group member");
  return (
    <div className="space-y-4">
      <h2 className="font-display text-title-l font-bold">{group.title}</h2>
      <p className="text-caption text-muted-foreground">
        {t(group.visibility === "private" ? "Private group" : "Public group")}
        {group.role ? ` · ${t(group.role)}` : ""}
      </p>
      <p className="whitespace-pre-wrap break-words text-label text-muted-foreground">
        {group.description}
      </p>
      {!group.role ? (
        <>
          <p className="text-label text-muted-foreground">
            {t("Join to read member posts and take part. Your name will be visible to members.")}
          </p>
          <Button
            wrap
            variant="volt"
            className="min-h-12 w-full"
            disabled={join.isPending}
            onClick={() =>
              join.mutate(undefined, { onError: (cause) => setError(errorText(cause)) })
            }
          >
            {t("Join this group")}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("Group sections")}>
            {(
              ["posts", "members", ...(admin ? ["invites"] : [])] as (
                "posts" | "members" | "invites"
              )[]
            ).map((value) => (
              <Button
                key={value}
                wrap
                variant={tab === value ? "volt" : "secondary"}
                aria-pressed={tab === value}
                className="min-h-11 flex-1"
                onClick={() => setTab(value)}
              >
                {t(value === "posts" ? "Posts" : value === "members" ? "Members" : "Invitations")}
              </Button>
            ))}
          </div>
          {tab === "posts" && (
            <>
              <form
                className="space-y-3 rounded-tile border border-border p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  send.mutate(undefined, {
                    onSuccess: () => setBody(""),
                    onError: (cause) => setError(errorText(cause)),
                  });
                }}
              >
                <label className="block text-label font-semibold">
                  {t("Post to group members")}
                  <Textarea
                    required
                    maxLength={10000}
                    value={body}
                    disabled={send.isPending}
                    onChange={(e) => setBody(e.target.value)}
                    className="mt-2"
                  />
                </label>
                <p className="text-caption text-muted-foreground">
                  {t(
                    "Visible to this group's members. Avoid sharing someone else's private information.",
                  )}
                </p>
                <Button
                  type="submit"
                  wrap
                  variant="volt"
                  className="min-h-12 w-full"
                  disabled={send.isPending || !body.trim()}
                >
                  {t(send.isPending ? "Saving…" : "Publish to members")}
                </Button>
              </form>
              {posts.isLoading ? (
                <Skeleton className="h-32" />
              ) : posts.error ? (
                <ErrorState onRetry={() => posts.refetch()} />
              ) : (
                posts.data
                  ?.filter((post) => post.payload.group_id === group.id)
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((post) => (
                    <article key={post.id} className="rounded-tile border border-border p-4">
                      <p className="text-label font-semibold">{label(post.owner_id)}</p>
                      <time
                        dateTime={post.created_at}
                        className="mt-1 block text-caption text-muted-foreground"
                      >
                        {dateTime(new Date(post.created_at))}
                      </time>
                      <p className="mt-3 whitespace-pre-wrap break-words text-label">
                        {post.payload.body}
                      </p>
                      {(admin || post.owner_id === me?.id) && (
                        <Button
                          wrap
                          variant="ghost"
                          className="mt-3 min-h-11"
                          onClick={() =>
                            setConfirm({ action: "post", id: post.id, name: label(post.owner_id) })
                          }
                        >
                          {t("Remove post")}
                        </Button>
                      )}
                    </article>
                  ))
              )}
            </>
          )}
          {tab === "members" &&
            (members.isLoading ? (
              <Skeleton className="h-32" />
            ) : members.error ? (
              <ErrorState onRetry={() => members.refetch()} />
            ) : (
              <div className="space-y-3">
                {members.data?.map((member) => (
                  <div key={member.userId} className="rounded-tile border border-border p-4">
                    <p className="text-label font-semibold">
                      {member.displayName || t("Group member")}
                    </p>
                    <p className="mt-1 text-caption text-muted-foreground">{t(member.role)}</p>
                    {member.userId !== me?.id && member.role !== "owner" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.role === "owner" && (
                          <Button
                            wrap
                            variant="glass"
                            className="min-h-11"
                            onClick={() =>
                              setConfirm({
                                action: member.role === "moderator" ? "unmoderator" : "moderator",
                                id: member.userId,
                                name: member.displayName || t("Group member"),
                              })
                            }
                          >
                            {t(
                              member.role === "moderator"
                                ? "Review removal of moderator role"
                                : "Review moderator role",
                            )}
                          </Button>
                        )}
                        {admin && (group.role === "owner" || member.role === "member") && (
                          <Button
                            wrap
                            variant="ghost"
                            className="min-h-11"
                            onClick={() =>
                              setConfirm({
                                action: "kick",
                                id: member.userId,
                                name: member.displayName || t("Group member"),
                              })
                            }
                          >
                            {t("Remove from group")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          {tab === "invites" && admin && <GroupInvites groupId={group.id} />}
          {group.role !== "owner" && (
            <Button
              wrap
              variant="ghost"
              className="min-h-11 w-full"
              onClick={() => setConfirm({ action: "leave", id: group.id, name: group.title })}
            >
              {t("Leave group")}
            </Button>
          )}
        </>
      )}
      {confirm && (
        <div className="space-y-3 rounded-tile border border-primary/30 bg-primary/5 p-4">
          <h3 className="text-title font-semibold">{confirm.name}</h3>
          <p className="text-label">
            {t(
              confirm.action === "moderator"
                ? "Moderators can invite members, remove regular members and remove group posts. They cannot appoint other moderators."
                : confirm.action === "unmoderator"
                  ? "Remove moderator permissions? This person remains a group member."
                  : confirm.action === "kick"
                    ? "Remove this person's membership? Their personal account is unchanged."
                    : confirm.action === "post"
                      ? "Remove this post from the group? This cannot be undone here."
                      : "Leave this group? Your existing posts remain unless removed separately.",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              wrap
              variant="secondary"
              disabled={moderate.isPending}
              className="min-h-11 flex-1"
              onClick={() => setConfirm(null)}
            >
              {t("Cancel")}
            </Button>
            <Button
              wrap
              variant="volt"
              disabled={moderate.isPending}
              className="min-h-11 flex-1"
              onClick={() =>
                moderate.mutate(confirm, {
                  onSuccess: () => {
                    if (confirm.action === "leave") onLeave();
                    setConfirm(null);
                  },
                  onError: (cause) => setError(errorText(cause)),
                })
              }
            >
              {t("Confirm group action")}
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
function GroupInvites({ groupId }: { groupId: string }) {
  const invites = useQ(["group-invites", groupId], (api) => api.community.invites(groupId));
  const [expiry, setExpiry] = useState(iso(addDays(new Date(), 7)));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const create = useAct((api) =>
    api.community.createInvite(groupId, new Date(`${expiry}T23:59:00`).toISOString()),
  );
  const revoke = useAct((api, code: string) => api.community.revokeInvite(groupId, code));
  return (
    <div className="space-y-3">
      <form
        className="space-y-3 rounded-tile border border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          create.mutate(undefined, { onError: (cause) => setError(errorText(cause)) });
        }}
      >
        <label className="block text-label">
          {t("Expiry date")}
          <Input
            type="date"
            value={expiry}
            min={today()}
            required
            disabled={create.isPending}
            onChange={(e) => setExpiry(e.target.value)}
            className="mt-1 min-h-12"
          />
        </label>
        <p className="text-caption text-muted-foreground">
          {t("Expires at the end of the selected day in {timezone}.", {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          })}
        </p>
        <p className="text-label text-muted-foreground">
          {t(
            "Create a single-use member invitation. Share the code manually; Kinra does not send it or grant moderator access.",
          )}
        </p>
        <Button
          type="submit"
          wrap
          variant="volt"
          className="min-h-12 w-full"
          disabled={create.isPending}
        >
          {t("Create invitation code")}
        </Button>
      </form>
      {invites.isLoading ? (
        <Skeleton className="h-24" />
      ) : invites.error ? (
        <ErrorState onRetry={() => invites.refetch()} />
      ) : (
        invites.data?.map((invite) => (
          <div key={invite.code} className="space-y-2 rounded-tile border border-border p-4">
            <p className="text-caption">
              {t("Expires {date}", { date: dateTime(new Date(invite.expiresAt)) })}
            </p>
            <p className="text-caption text-muted-foreground">
              {t(
                invite.revokedAt
                  ? "Revoked"
                  : invite.usedAt
                    ? "Accepted"
                    : new Date(invite.expiresAt) <= new Date()
                      ? "Expired"
                      : "Available",
              )}
            </p>
            {!invite.revokedAt && !invite.usedAt && new Date(invite.expiresAt) > new Date() && (
              <>
                <code className="block break-all rounded bg-background p-3 text-label">
                  {invite.code}
                </code>
                <div className="flex flex-wrap gap-2">
                  <Button
                    wrap
                    variant="glass"
                    className="min-h-11"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(invite.code)
                        .then(() => setCopied(invite.code))
                        .catch(() =>
                          setError(t("Could not copy. Select and copy the code manually.")),
                        );
                    }}
                  >
                    <Copy aria-hidden="true" />
                    {t(copied === invite.code ? "Copied" : "Copy code")}
                  </Button>
                  <Button
                    wrap
                    variant="ghost"
                    className="min-h-11"
                    disabled={revoke.isPending}
                    onClick={() =>
                      revoke.mutate(invite.code, { onError: (cause) => setError(errorText(cause)) })
                    }
                  >
                    {t("Revoke invitation")}
                  </Button>
                </div>
              </>
            )}
          </div>
        ))
      )}
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
