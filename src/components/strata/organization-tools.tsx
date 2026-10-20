import { lazy, Suspense, useState } from "react";
import { Building2, Check, Copy, Plus } from "lucide-react";
import { useAct, useQ } from "@/lib/api";
import { t, useLanguage, dateTime } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { today, iso } from "@/lib/stats";
import { addDays } from "date-fns";
import type {
  OrgSummary,
  OrgMember,
  OrgStaff,
  MembershipInput,
  StaffRole,
} from "@/lib/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet } from "./sheets";
import { ErrorState, Skeleton } from "./ui";
const FeatureWorkspace = lazy(() =>
  import("./feature-hub").then((m) => ({ default: m.FeatureWorkspace })),
);
const permissionText = (role: string) =>
  t(
    role === "manager"
      ? "Managers can view the roster and manage memberships and payment records. They cannot appoint staff."
      : "Staff can view the roster and membership status. They cannot change memberships or view financial notes.",
  );
export function OrganizationTools() {
  useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button wrap variant="glass" className="mt-3 min-h-12 w-full" onClick={() => setOpen(true)}>
        <Building2 aria-hidden="true" />
        {t("Organization tools")}
      </Button>
      {open && (
        <Sheet open onOpenChange={setOpen} title={t("Organization tools")}>
          <OrganizationHome />
        </Sheet>
      )}
    </>
  );
}
function OrganizationHome() {
  const organizations = useQ(["organizations"], (api) => api.organizations.list());
  const [selected, setSelected] = useState("");
  const [create, setCreate] = useState(false);
  const org = organizations.data?.find((item) => item.id === selected);
  return (
    <div className="space-y-5">
      <p className="text-label text-muted-foreground">
        {t(
          "Access comes from ownership or an accepted staff invitation. Choosing an organization workspace alone grants no staff permissions.",
        )}
      </p>
      {organizations.isLoading ? (
        <Skeleton className="h-24" />
      ) : organizations.error ? (
        <ErrorState onRetry={() => organizations.refetch()} />
      ) : (
        <label className="block text-label">
          {t("Organization")}
          <select
            className="mt-2 min-h-12 w-full min-w-0 rounded-tile border border-border bg-surface px-3"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">{t("Choose an organization")}</option>
            {organizations.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} · {t(item.role)}
              </option>
            ))}
          </select>
        </label>
      )}
      {org && <OrganizationWorkbench key={org.id} org={org} />}
      <details className="rounded-tile border border-border p-4">
        <summary className="cursor-pointer py-2 text-label font-semibold">
          {t("Accept staff invitation")}
        </summary>
        <InviteAcceptance />
      </details>
      <Button
        wrap
        variant="glass"
        className="min-h-12 w-full"
        onClick={() => setCreate((value) => !value)}
      >
        <Plus aria-hidden="true" />
        {t(create ? "Close organization editor" : "Create or edit an organization")}
      </Button>
      {create && (
        <Suspense fallback={<Skeleton className="h-40" />}>
          <FeatureWorkspace compact kind="organization" />
        </Suspense>
      )}
    </div>
  );
}
function InviteAcceptance() {
  const [code, setCode] = useState("");
  const [reviewCode, setReviewCode] = useState("");
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const preview = useQ(
    ["organization-invite-preview", reviewCode],
    (api) => api.organizations.inspectInvite(reviewCode),
    !!reviewCode,
  );
  const accept = useAct((api, value: string) => api.organizations.redeemInvite(value));
  return (
    <div className="mt-3 space-y-3">
      <label className="block text-label">
        {t("Invitation code")}
        <Input
          value={code}
          disabled={accept.isPending}
          autoComplete="off"
          onChange={(e) => {
            setCode(e.target.value);
            setReviewCode("");
            setAccepted(false);
            setError("");
          }}
          className="mt-2 min-h-12"
        />
      </label>
      <Button
        wrap
        variant="glass"
        className="min-h-11 w-full"
        disabled={!code.trim() || accept.isPending}
        onClick={() => setReviewCode(code.trim())}
      >
        {t("Review invitation")}
      </Button>
      {reviewCode &&
        (preview.isLoading ? (
          <Skeleton className="h-24" />
        ) : preview.error ? (
          <ErrorState message={errorText(preview.error)} onRetry={() => preview.refetch()} />
        ) : (
          preview.data && (
            <div className="space-y-3 rounded-tile border border-primary/25 p-4">
              <h3 className="text-title font-semibold">{preview.data.title}</h3>
              <p className="text-label">{t(preview.data.role)}</p>
              <p className="text-label text-muted-foreground">
                {permissionText(preview.data.role)}
              </p>
              <p className="text-caption text-muted-foreground">
                {t("Expires {date}", { date: dateTime(new Date(preview.data.expiresAt)) })}
              </p>
              <Button
                wrap
                variant="volt"
                className="min-h-12 w-full"
                disabled={accept.isPending || accepted || preview.data.accepted}
                onClick={() =>
                  accept.mutate(reviewCode, {
                    onSuccess: () => setAccepted(true),
                    onError: (cause) => setError(errorText(cause)),
                  })
                }
              >
                {t(
                  accepted || preview.data.accepted
                    ? "Invitation accepted"
                    : "Accept these permissions",
                )}
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
function OrganizationWorkbench({ org }: { org: OrgSummary }) {
  const [tab, setTab] = useState<"members" | "staff">("members");
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-display text-title font-bold">{org.title}</h3>
        <p className="mt-1 text-caption text-muted-foreground">
          {org.city} · {t(org.role)}
        </p>
      </div>
      <div className="flex gap-2">
        {(["members", "staff"] as const).map((value) => (
          <Button
            key={value}
            wrap
            variant={tab === value ? "volt" : "secondary"}
            aria-pressed={tab === value}
            className="min-h-11 flex-1"
            onClick={() => setTab(value)}
          >
            {t(value === "members" ? "Members" : "Staff & invitations")}
          </Button>
        ))}
      </div>
      {tab === "members" ? <Members org={org} /> : <Staff org={org} />}
    </section>
  );
}
function Staff({ org }: { org: OrgSummary }) {
  const staff = useQ(["organization-staff", org.id], (api) => api.organizations.staff(org.id));
  const invites = useQ(
    ["organization-invites", org.id],
    (api) => api.organizations.invites(org.id),
    org.role === "owner",
  );
  const [role, setRole] = useState<StaffRole>("staff");
  const [expires, setExpires] = useState(iso(addDays(new Date(), 7)));
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const [changeTarget, setChangeTarget] = useState<{
    person: OrgStaff;
    role: StaffRole | "remove";
  } | null>(null);
  const [copied, setCopied] = useState("");
  const create = useAct((api) =>
    api.organizations.createInvite(org.id, role, new Date(`${expires}T23:59:00`).toISOString()),
  );
  const change = useAct((api, target: { person: OrgStaff; role: StaffRole | "remove" }) =>
    target.role === "remove"
      ? api.organizations.removeStaff(org.id, target.person.userId)
      : api.organizations.setStaffRole(org.id, target.person.userId, target.role),
  );
  const revoke = useAct((api, code: string) => api.organizations.revokeInvite(org.id, code));
  return (
    <div className="space-y-4">
      {staff.isLoading ? (
        <Skeleton className="h-24" />
      ) : staff.error ? (
        <ErrorState onRetry={() => staff.refetch()} />
      ) : (
        <div className="space-y-3">
          {staff.data?.map((person) => (
            <div key={person.userId} className="rounded-tile border border-border p-4">
              <p className="text-label font-semibold">{person.displayName || t("Staff member")}</p>
              <p className="mt-1 text-caption text-muted-foreground">{t(person.role)}</p>
              {org.role === "owner" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    wrap
                    variant="glass"
                    disabled={change.isPending}
                    className="min-h-11"
                    onClick={() =>
                      setChangeTarget({
                        person,
                        role: person.role === "staff" ? "manager" : "staff",
                      })
                    }
                  >
                    {t(person.role === "staff" ? "Review manager access" : "Review staff access")}
                  </Button>
                  <Button
                    wrap
                    variant="ghost"
                    disabled={change.isPending}
                    className="min-h-11"
                    onClick={() => setChangeTarget({ person, role: "remove" })}
                  >
                    {t("Remove staff access")}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {!staff.data?.length && (
            <p className="text-label text-muted-foreground">{t("No additional staff yet.")}</p>
          )}
        </div>
      )}
      {changeTarget && (
        <div className="space-y-3 rounded-tile border border-primary/25 p-4">
          <h4 className="text-label font-semibold">
            {changeTarget.person.displayName || t("Staff member")}
          </h4>
          <p className="text-label">
            {changeTarget.role === "remove"
              ? t(
                  "Remove this person's organization staff access? Their personal account is unchanged.",
                )
              : permissionText(changeTarget.role)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              wrap
              variant="secondary"
              disabled={change.isPending}
              onClick={() => setChangeTarget(null)}
            >
              {t("Cancel")}
            </Button>
            <Button
              wrap
              variant="volt"
              disabled={change.isPending}
              onClick={() =>
                change.mutate(changeTarget, {
                  onSuccess: () => setChangeTarget(null),
                  onError: (cause) => setError(errorText(cause)),
                })
              }
            >
              {t("Confirm access change")}
            </Button>
          </div>
        </div>
      )}
      {org.role === "owner" && (
        <>
          <form
            className="space-y-3 rounded-tile border border-border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              setReview(true);
              setError("");
            }}
          >
            <h4 className="text-title font-semibold">{t("Create staff invitation")}</h4>
            <label className="block text-label">
              {t("Staff role")}
              <select
                value={role}
                disabled={create.isPending}
                onChange={(e) => {
                  setRole(e.target.value as StaffRole);
                  setReview(false);
                }}
                className="mt-2 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
              >
                <option value="staff">{t("staff")}</option>
                <option value="manager">{t("manager")}</option>
              </select>
            </label>
            <label className="block text-label">
              {t("Expiry date")}
              <Input
                type="date"
                min={today()}
                required
                disabled={create.isPending}
                value={expires}
                onChange={(e) => {
                  setExpires(e.target.value);
                  setReview(false);
                }}
                className="mt-2 min-h-12"
              />
            </label>
            <p className="text-caption text-muted-foreground">
              {t("Expires at the end of the selected day in {timezone}.", {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              })}
            </p>
            <Button
              type="submit"
              wrap
              variant="glass"
              className="min-h-11 w-full"
              disabled={create.isPending}
            >
              {t("Review staff permissions")}
            </Button>
            {review && (
              <div className="space-y-3 border-t border-border pt-3">
                <p className="text-label">{permissionText(role)}</p>
                <p className="text-caption text-muted-foreground">
                  {t(
                    "A code is created for you to share manually. Kinra does not send this invitation.",
                  )}
                </p>
                <Button
                  type="button"
                  wrap
                  variant="volt"
                  disabled={create.isPending}
                  className="min-h-12 w-full"
                  onClick={() =>
                    create.mutate(undefined, {
                      onSuccess: () => setReview(false),
                      onError: (cause) => setError(errorText(cause)),
                    })
                  }
                >
                  {t(create.isPending ? "Saving…" : "Create invitation code")}
                </Button>
              </div>
            )}
          </form>
          {invites.isLoading ? (
            <Skeleton className="h-24" />
          ) : invites.error ? (
            <ErrorState onRetry={() => invites.refetch()} />
          ) : (
            invites.data?.map((invite) => (
              <div key={invite.code} className="space-y-2 rounded-tile border border-border p-4">
                <p className="text-label font-semibold">{t(invite.role)}</p>
                <p className="text-caption text-muted-foreground">
                  {t("Expires {date}", { date: dateTime(new Date(invite.expiresAt)) })}
                </p>
                <p className="text-caption">
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
                        {copied === invite.code ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Copy aria-hidden="true" />
                        )}
                        {t(copied === invite.code ? "Copied" : "Copy code")}
                      </Button>
                      <Button
                        wrap
                        variant="ghost"
                        className="min-h-11"
                        disabled={revoke.isPending}
                        onClick={() =>
                          revoke.mutate(invite.code, {
                            onError: (cause) => setError(errorText(cause)),
                          })
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
        </>
      )}
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
function Members({ org }: { org: OrgSummary }) {
  const members = useQ(["organization-members", org.id], (api) =>
    api.organizations.members(org.id),
  );
  const [editing, setEditing] = useState<OrgMember | null>(null);
  if (members.isLoading) return <Skeleton className="h-40" />;
  if (members.error) return <ErrorState onRetry={() => members.refetch()} />;
  return (
    <div className="space-y-3">
      <p className="text-label text-muted-foreground">
        {t(
          "Membership and payment records are bookkeeping only. Saving a paid amount does not charge a card or transfer money.",
        )}
      </p>
      {members.data?.map((member) => (
        <div key={member.userId} className="rounded-tile border border-border p-4">
          <h4 className="text-label font-semibold">{member.displayName || t("Member")}</h4>
          <p className="mt-1 text-caption text-muted-foreground">
            {member.membership ? t(member.membership.status) : t("No membership recorded")}
          </p>
          {member.membership && (
            <p className="mt-1 text-caption">
              {member.membership.startDate}
              {member.membership.endDate ? ` — ${member.membership.endDate}` : ""}
            </p>
          )}
          {org.role !== "staff" && (
            <Button
              wrap
              variant="glass"
              className="mt-3 min-h-11"
              onClick={() => setEditing(member)}
            >
              {t("Edit membership record")}
            </Button>
          )}
        </div>
      ))}
      {!members.data?.length && (
        <p className="text-label text-muted-foreground">
          {t("No members have joined this organization yet.")}
        </p>
      )}
      {editing && (
        <MembershipEditor
          key={editing.userId}
          org={org}
          member={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
function MembershipEditor({
  org,
  member,
  onClose,
}: {
  org: OrgSummary;
  member: OrgMember;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<MembershipInput>(
    member.membership ?? {
      organizationId: org.id,
      userId: member.userId,
      status: "active",
      startDate: today(),
    },
  );
  const [error, setError] = useState("");
  const plans = useQ(["features", "membership_plan"], (api) =>
    api.features.list("membership_plan"),
  );
  const save = useAct((api, value: MembershipInput) => api.organizations.saveMembership(value));
  const update = (patch: Partial<MembershipInput>) => setDraft((value) => ({ ...value, ...patch }));
  return (
    <form
      className="space-y-4 rounded-tile border border-primary/30 bg-primary/5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        save.mutate(draft, { onSuccess: onClose, onError: (cause) => setError(errorText(cause)) });
      }}
    >
      <h4 className="text-title font-semibold">{member.displayName || t("Member")}</h4>
      <fieldset disabled={save.isPending} className="min-w-0 space-y-3">
        <label className="block text-label">
          {t("Membership status")}
          <select
            value={draft.status}
            onChange={(e) => update({ status: e.target.value as MembershipInput["status"] })}
            className="mt-1 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
          >
            {(["active", "paused", "ended"] as const).map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-label">
          {t("Membership plan (optional)")}
          <select
            value={draft.planId ?? ""}
            onChange={(e) => update({ planId: e.target.value || null })}
            className="mt-1 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
          >
            <option value="">{t("None")}</option>
            {plans.data
              ?.filter((plan) => plan.payload.organization_id === org.id)
              .map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.payload.title}
                </option>
              ))}
          </select>
        </label>
        {plans.error && <ErrorState onRetry={() => plans.refetch()} />}
        {(["startDate", "endDate"] as const).map((key) => (
          <label key={key} className="block text-label">
            {t(key === "startDate" ? "Start date" : "End date (optional)")}
            <Input
              type="date"
              required={key === "startDate"}
              value={draft[key] ?? ""}
              onChange={(e) =>
                update(
                  key === "startDate"
                    ? { startDate: e.target.value }
                    : { endDate: e.target.value || null },
                )
              }
              className="mt-1 min-h-12"
            />
          </label>
        ))}
        <label className="block text-label">
          {t("Paid amount to record (optional)")}
          <Input
            type="number"
            min={0}
            max={1000000}
            step="0.01"
            value={draft.paidAmount ?? ""}
            onChange={(e) =>
              update({ paidAmount: e.target.value === "" ? null : Number(e.target.value) })
            }
            className="mt-1 min-h-12"
          />
        </label>
        <label className="block text-label">
          {t("Currency")}
          <select
            value={draft.currency ?? ""}
            required={draft.paidAmount != null}
            onChange={(e) =>
              update({
                currency: (e.target.value || null) as NonNullable<
                  MembershipInput["currency"]
                > | null,
              })
            }
            className="mt-1 min-h-12 w-full rounded-tile border border-border bg-surface px-3"
          >
            <option value="">{t("Choose currency")}</option>
            {["EUR", "USD", "BAM", "GBP"].map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <label className="block text-label">
          {t("Membership notes (optional)")}
          <Textarea
            maxLength={1000}
            value={draft.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
            className="mt-1"
          />
        </label>
      </fieldset>
      <p className="text-caption text-muted-foreground">
        {t("This saves a record only. No payment is collected.")}
      </p>
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          wrap
          variant="secondary"
          className="min-h-11 flex-1"
          disabled={save.isPending}
          onClick={onClose}
        >
          {t("Cancel")}
        </Button>
        <Button
          type="submit"
          wrap
          variant="volt"
          className="min-h-11 flex-1"
          disabled={save.isPending}
        >
          {t(save.isPending ? "Saving…" : "Save membership record")}
        </Button>
      </div>
    </form>
  );
}
