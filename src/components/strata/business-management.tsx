import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { t } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import {
  businessSectorLabels,
  businessSectors,
  type BusinessSnapshot,
  type BusinessMember,
  type BusinessPlan,
  type BusinessLocation,
  type BusinessResource,
  type BusinessSession,
  type BusinessMembership,
  type BusinessSector,
} from "@/lib/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BusinessCard,
  BusinessField as Field,
  BusinessSelect as Select,
  BusinessForm as Form,
  BusinessStatus,
  businessMoney,
  businessDate,
  businessTime,
  businessToday,
  businessLocalInput,
  businessInputISO,
} from "./business-ui";
import { Staff } from "./organization-tools";
import type { BusinessTab } from "./business-workspace";
type Props = { data: BusinessSnapshot; refresh: () => Promise<void> };
export const resourceLabels = {
  pitch: "Pitch",
  court: "Court",
  lane: "Swimming lane",
  studio: "Studio",
  mat: "Training mat",
  track: "Running track",
  room: "Room",
  other: "Other resource",
};
export function BusinessManagement({ data, tab, refresh }: Props & { tab: BusinessTab }) {
  return tab === "members" ? (
    <Members data={data} refresh={refresh} />
  ) : tab === "plans" ? (
    <Plans data={data} refresh={refresh} />
  ) : tab === "locations" ? (
    <Locations data={data} refresh={refresh} />
  ) : tab === "schedule" ? (
    <Schedule data={data} refresh={refresh} />
  ) : tab === "ledger" && data.business.role !== "staff" ? (
    <Ledger data={data} refresh={refresh} />
  ) : tab === "staff" && data.business.role !== "staff" ? (
    <div className="space-y-6">
      <BusinessExport businessId={data.business.id} />
      {data.business.role === "owner" && <BusinessSetup data={data} onDone={refresh} />}
      <BusinessCard title={t("Staff & invitations")}>
        <Staff
          org={{
            id: data.business.id,
            title: data.business.name,
            city: "",
            role: data.business.role,
          }}
        />
      </BusinessCard>
    </div>
  ) : null;
}
export function BusinessSetup({
  data,
  onDone,
}: {
  data?: BusinessSnapshot;
  onDone: (businessId?: string) => Promise<void>;
}) {
  const api = useApi();
  const cache = useQueryClient();
  const [name, setName] = useState(data?.business.name ?? "");
  const [sector, setSector] = useState<BusinessSector>(data?.business.sector ?? "sports_complex");
  const [timezone, setTimezone] = useState(data?.business.timezone ?? "Europe/Sarajevo");
  const [currency, setCurrency] = useState(data?.business.currency ?? "BAM");
  return (
    <BusinessCard title={t(data ? "Business settings" : "Create your business")}>
      <Form
        onSave={async () => {
          const businessId = await api.business.setup({
            ...(data ? { organizationId: data.business.id } : {}),
            name,
            sector,
            timezone,
            currency,
          });
          await cache.invalidateQueries({
            predicate: (query) => query.queryKey.includes("business-list"),
          });
          await onDone(businessId);
        }}
      >
        <Field
          label="Business name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          label="Facility type"
          value={sector}
          onChange={(e) => setSector(e.target.value as BusinessSector)}
        >
          {businessSectors.map((s) => (
            <option key={s} value={s}>
              {t(businessSectorLabels[s])}
            </option>
          ))}
        </Select>
        <Field
          label="Time zone"
          required
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
        <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {["BAM", "EUR", "RSD", "MKD", "ALL", "RON", "BGN", "USD", "GBP"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Form>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("Business access does not grant access to personal health or coaching records.")}
      </p>
    </BusinessCard>
  );
}
function BusinessExport({ businessId }: { businessId: string }) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <BusinessCard title={t("Export business data")}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("Download the business records available to your role as JSON.")}
      </p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const data = await api.business.exportData(businessId);
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "kinra-business-export.json";
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (cause) {
            setError(errorText(cause));
          } finally {
            setBusy(false);
          }
        }}
      >
        {t(busy ? "Preparing export…" : "Export business data")}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </BusinessCard>
  );
}
function Members({ data, refresh }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const member = data.members.find((m) => m.id === selected);
  const canEdit = data.business.role !== "staff";
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <BusinessCard
        title={t("Member roster")}
        action={
          canEdit ? (
            <Button
              variant="volt"
              onClick={() => {
                setCreate(true);
                setSelected(null);
              }}
            >
              {t("Add member")}
            </Button>
          ) : undefined
        }
      >
        <label className="text-sm">
          {t("Search members")}
          <Input
            className="my-3 min-h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="divide-y divide-border">
          {data.members
            .filter((m) =>
              `${m.name} ${m.number} ${m.group}`
                .toLocaleLowerCase()
                .includes(search.toLocaleLowerCase()),
            )
            .map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelected(m.id);
                  setCreate(false);
                }}
                className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-4 text-left hover:bg-surface-2 ${selected === m.id ? "bg-primary/5" : ""}`}
              >
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.number} {m.group && `· ${m.group}`}
                  </p>
                </div>
                <BusinessStatus value={m.status} />
              </button>
            ))}
          {!data.members.length && (
            <p className="py-8 text-sm text-muted-foreground">
              {t("No members yet. Add your first member to get started.")}
            </p>
          )}
        </div>
      </BusinessCard>
      <div className="space-y-6">
        {(create || member) && canEdit ? (
          <MemberEditor
            key={member?.id ?? "new"}
            data={data}
            member={member}
            refresh={refresh}
            onCreated={(id) => {
              setSelected(id);
              setCreate(false);
            }}
          />
        ) : !member ? (
          <BusinessCard>
            <p className="py-10 text-center text-muted-foreground">
              {t("Choose a member to view their membership and access.")}
            </p>
          </BusinessCard>
        ) : null}
        {member && <Memberships data={data} member={member} refresh={refresh} />}
      </div>
    </div>
  );
}
function MemberEditor({
  data,
  member,
  refresh,
  onCreated,
}: Props & { member?: BusinessMember | undefined; onCreated: (id: string) => void }) {
  const api = useApi();
  const [value, setValue] = useState(() =>
    member
      ? {
          id: member.id,
          name: member.name,
          number: member.number,
          email: member.email,
          phone: member.phone,
          group: member.group,
          status: member.status,
        }
      : {
          id: crypto.randomUUID(),
          name: "",
          number: `M-${Date.now().toString().slice(-6)}`,
          email: "",
          phone: "",
          group: "",
          status: "active" as const,
        },
  );
  return (
    <BusinessCard title={t(member ? "Member details" : "Add member")}>
      <Form
        onSave={async () => {
          const id = await api.business.saveMember(data.business.id, value);
          await refresh();
          onCreated(id);
        }}
      >
        <Field
          label="Full name"
          required
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
        />
        <Field
          label="Member number"
          required
          value={value.number}
          onChange={(e) => setValue({ ...value, number: e.target.value })}
        />
        <Field
          label="Email"
          type="email"
          value={value.email}
          onChange={(e) => setValue({ ...value, email: e.target.value })}
        />
        <Field
          label="Phone"
          value={value.phone}
          onChange={(e) => setValue({ ...value, phone: e.target.value })}
        />
        <Field
          label="Team or group"
          value={value.group}
          onChange={(e) => setValue({ ...value, group: e.target.value })}
        />
        <Select
          label="Member status"
          value={value.status}
          onChange={(e) =>
            setValue({ ...value, status: e.target.value as BusinessMember["status"] })
          }
        >
          {["active", "paused", "blocked", "archived"].map((s) => (
            <option value={s} key={s}>
              {t(s)}
            </option>
          ))}
        </Select>
      </Form>
    </BusinessCard>
  );
}
function Memberships({ data, member, refresh }: Props & { member: BusinessMember }) {
  const api = useApi();
  const memberships = data.memberships.filter((m) => m.memberId === member.id);
  const [editing, setEditing] = useState<BusinessMembership | null>(null);
  const [adding, setAdding] = useState(false);
  const [claim, setClaim] = useState("");
  const [claimExpires, setClaimExpires] = useState("");
  const [error, setError] = useState("");
  const canEdit = data.business.role !== "staff";
  return (
    <BusinessCard title={t("Membership & app access")}>
      <p className="mb-4 font-semibold">{member.name}</p>
      {memberships.map((m) => (
        <div key={m.id} className="mb-3 space-y-2 rounded-xl border border-border p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-medium">{m.planName}</p>
            <BusinessStatus
              value={
                m.status === "active" && m.endDate < businessToday(data.business.timezone)
                  ? "expired"
                  : m.status
              }
            />
          </div>
          <p className="text-sm">
            {businessDate(m.startDate)} — {businessDate(m.endDate)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("Visits used")}: {m.usedVisits}
            {m.visitLimit !== null ? ` / ${m.visitLimit}` : ` · ${t("Unlimited visits")}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {m.locationIds.length
              ? m.locationIds
                  .map((id) => data.locations.find((l) => l.id === id)?.name)
                  .filter(Boolean)
                  .join(", ")
              : t("All locations")}
          </p>
          {canEdit && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(m);
                setAdding(true);
              }}
            >
              {t("Edit membership")}
            </Button>
          )}
        </div>
      ))}
      {canEdit && (
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
        >
          {t("Add membership")}
        </Button>
      )}
      {adding && (
        <div className="mt-5">
          <MembershipEditor
            key={editing?.id ?? "new"}
            data={data}
            memberId={member.id}
            membership={editing}
            refresh={refresh}
            onDone={() => setAdding(false)}
          />
        </div>
      )}
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm">
          {t(member.linked ? "Connected to a Kinra account" : "No Kinra account linked")}
        </p>
        {canEdit && !member.linked && (
          <Button
            variant="glass"
            className="mt-3"
            onClick={async () => {
              try {
                const result = await api.business.createClaim(data.business.id, member.id);
                setClaim(result.code);
                setClaimExpires(result.expiresAt);
              } catch (cause) {
                setError(errorText(cause));
              }
            }}
          >
            {t("Create app invitation")}
          </Button>
        )}
        {claim && (
          <div className="mt-3 rounded-xl border border-primary/30 p-4">
            <p className="text-xs text-muted-foreground">
              {t("Share this private code with this member only.")}
            </p>
            <code className="mt-2 block break-all select-all text-sm">{claim}</code>
            {claimExpires && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("Expires {date}", { date: businessTime(claimExpires, data.business.timezone) })}
              </p>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </BusinessCard>
  );
}
function MembershipEditor({
  data,
  memberId,
  membership,
  refresh,
  onDone,
}: Props & { memberId: string; membership: BusinessMembership | null; onDone: () => void }) {
  const api = useApi();
  const [value, setValue] = useState(() => {
    const plan = data.plans.find((p) => p.active);
    const start = businessToday(data.business.timezone);
    const end = new Date(`${start}T12:00:00`);
    end.setDate(end.getDate() + (plan?.durationDays ?? 1) - 1);
    return {
      id: membership?.id ?? crypto.randomUUID(),
      memberId,
      planId: membership?.planId ?? data.plans.find((p) => p.active)?.id ?? "",
      startDate: membership?.startDate ?? businessToday(data.business.timezone),
      endDate: membership?.endDate ?? end.toLocaleDateString("en-CA"),
      status: membership?.status ?? ("active" as BusinessMembership["status"]),
    };
  });
  return (
    <Form
      onDone={onDone}
      onSave={async () => {
        await api.business.saveMembership(data.business.id, value);
        await refresh();
      }}
    >
      <Select
        label="Membership plan"
        required
        disabled={!!membership}
        value={value.planId}
        onChange={(e) => {
          const plan = data.plans.find((p) => p.id === e.target.value);
          const end = new Date(`${value.startDate}T12:00:00`);
          end.setDate(end.getDate() + (plan?.durationDays ?? 1) - 1);
          setValue({ ...value, planId: e.target.value, endDate: end.toLocaleDateString("en-CA") });
        }}
      >
        <option value="">{t("Choose a plan")}</option>
        {data.plans
          .filter((p) => p.active || p.id === value.planId)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </Select>
      <Select
        label="Status"
        value={value.status}
        onChange={(e) =>
          setValue({ ...value, status: e.target.value as BusinessMembership["status"] })
        }
      >
        {["active", "paused", "ended"].map((s) => (
          <option key={s} value={s}>
            {t(s)}
          </option>
        ))}
      </Select>
      <Field
        label="Start date"
        type="date"
        required
        value={value.startDate}
        onChange={(e) => setValue({ ...value, startDate: e.target.value })}
      />
      <Field
        label="End date"
        type="date"
        min={value.startDate}
        required
        value={value.endDate}
        onChange={(e) => setValue({ ...value, endDate: e.target.value })}
      />
    </Form>
  );
}
function Plans({ data, refresh }: Props) {
  const [editing, setEditing] = useState<BusinessPlan | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <BusinessCard
        title={t("Plans for every way to train")}
        action={
          data.business.role !== "staff" ? (
            <Button
              variant="volt"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("Add plan")}
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border p-5">
              <p className="font-semibold">{plan.name}</p>
              <p className="my-4 font-display text-2xl font-bold">
                {businessMoney(plan.priceMinor, data.business.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                {plan.durationDays} {t("days")} · {plan.visitLimit ?? t("Unlimited visits")}
                {plan.visitLimit !== null ? ` ${t("visits")}` : ""}
              </p>
              <p className="mt-3 text-xs">
                {plan.locationIds.length
                  ? plan.locationIds
                      .map((id) => data.locations.find((l) => l.id === id)?.name)
                      .join(", ")
                  : t("All locations")}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <BusinessStatus value={plan.active ? "active" : "archived"} />
                {data.business.role !== "staff" && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(plan);
                      setOpen(true);
                    }}
                  >
                    {t("Edit")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </BusinessCard>
      {open && (
        <PlanEditor
          key={editing?.id ?? "new"}
          data={data}
          refresh={refresh}
          plan={editing}
          onDone={() => setOpen(false)}
        />
      )}
    </div>
  );
}
function PlanEditor({
  data,
  refresh,
  plan,
  onDone,
}: Props & { plan: BusinessPlan | null; onDone: () => void }) {
  const api = useApi();
  const [v, set] = useState<BusinessPlan>(
    () =>
      plan ?? {
        id: crypto.randomUUID(),
        name: "",
        durationDays: 30,
        visitLimit: null,
        priceMinor: 0,
        locationIds: [],
        active: true,
      },
  );
  return (
    <BusinessCard title={t("Membership plan")}>
      <Form
        onDone={onDone}
        onSave={async () => {
          await api.business.savePlan(data.business.id, v);
          await refresh();
        }}
      >
        <Field
          label="Plan name"
          required
          value={v.name}
          onChange={(e) => set({ ...v, name: e.target.value })}
        />
        <Field
          label="Duration in days"
          type="number"
          min={1}
          max={3660}
          required
          value={v.durationDays}
          onChange={(e) => set({ ...v, durationDays: Number(e.target.value) })}
        />
        <Field
          label="Price"
          type="number"
          min={0}
          step="0.01"
          required
          value={v.priceMinor / 100}
          onChange={(e) => set({ ...v, priceMinor: Math.round(Number(e.target.value) * 100) })}
        />
        <Field
          label="Visit limit (empty means unlimited)"
          type="number"
          min={1}
          value={v.visitLimit ?? ""}
          onChange={(e) =>
            set({ ...v, visitLimit: e.target.value ? Number(e.target.value) : null })
          }
        />
        <Select
          label="Status"
          value={String(v.active)}
          onChange={(e) => set({ ...v, active: e.target.value === "true" })}
        >
          <option value="true">{t("active")}</option>
          <option value="false">{t("archived")}</option>
        </Select>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">
            {t("Eligible locations (none selected means all)")}
          </legend>
          {data.locations.map((l) => (
            <label key={l.id} className="flex min-h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={v.locationIds.includes(l.id)}
                onChange={(e) =>
                  set({
                    ...v,
                    locationIds: e.target.checked
                      ? [...v.locationIds, l.id]
                      : v.locationIds.filter((id) => id !== l.id),
                  })
                }
              />
              {l.name}
            </label>
          ))}
        </fieldset>
      </Form>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("Existing memberships retain their saved plan entitlements.")}
      </p>
    </BusinessCard>
  );
}
function Locations({ data, refresh }: Props) {
  const [location, setLocation] = useState<BusinessLocation | null>(null);
  const [resource, setResource] = useState<BusinessResource | null>(null);
  const [editor, setEditor] = useState<"location" | "resource" | null>(null);
  const canEdit = data.business.role !== "staff";
  return (
    <div className="space-y-6">
      <BusinessCard
        title={t("Your locations")}
        action={
          canEdit ? (
            <Button
              variant="volt"
              onClick={() => {
                setLocation(null);
                setEditor("location");
              }}
            >
              {t("Add location")}
            </Button>
          ) : undefined
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {data.locations.map((l) => (
            <div key={l.id} className="rounded-xl border border-border p-5">
              <div className="flex justify-between gap-3">
                <h3 className="font-semibold">{l.name}</h3>
                <BusinessStatus value={l.active ? "active" : "archived"} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {[l.address, l.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-3 text-sm">
                {t("Capacity")}: {l.capacity ?? t("Not set")}
              </p>
              <div className="mt-3 space-y-2">
                {data.resources
                  .filter((r) => r.locationId === l.id)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm"
                    >
                      <span>
                        {r.name} · {t(resourceLabels[r.kind])} · {r.capacity}
                      </span>
                      {canEdit && (
                        <button
                          className="min-h-8 underline"
                          onClick={() => {
                            setResource(r);
                            setEditor("resource");
                          }}
                        >
                          {t("Edit")}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
              {canEdit && (
                <Button
                  className="mt-3"
                  variant="ghost"
                  onClick={() => {
                    setLocation(l);
                    setEditor("location");
                  }}
                >
                  {t("Edit location")}
                </Button>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <Button
            className="mt-4"
            variant="secondary"
            disabled={!data.locations.length}
            onClick={() => {
              setResource(null);
              setEditor("resource");
            }}
          >
            {t("Add resource")}
          </Button>
        )}
      </BusinessCard>
      {editor === "location" && (
        <LocationEditor
          key={location?.id ?? "new-location"}
          data={data}
          refresh={refresh}
          value={location}
          onDone={() => setEditor(null)}
        />
      )}{" "}
      {editor === "resource" && (
        <ResourceEditor
          key={resource?.id ?? "new-resource"}
          data={data}
          refresh={refresh}
          value={resource}
          onDone={() => setEditor(null)}
        />
      )}
    </div>
  );
}
function LocationEditor({
  data,
  refresh,
  value,
  onDone,
}: Props & { value: BusinessLocation | null; onDone: () => void }) {
  const api = useApi();
  const [v, set] = useState<BusinessLocation>(
    () =>
      value ?? {
        id: crypto.randomUUID(),
        name: "",
        city: "",
        address: "",
        capacity: null,
        active: true,
      },
  );
  return (
    <BusinessCard title={t("Location details")}>
      <Form
        onDone={onDone}
        onSave={async () => {
          await api.business.saveLocation(data.business.id, v);
          await refresh();
        }}
      >
        <Field
          label="Name"
          required
          value={v.name}
          onChange={(e) => set({ ...v, name: e.target.value })}
        />
        <Field label="City" value={v.city} onChange={(e) => set({ ...v, city: e.target.value })} />
        <Field
          label="Address"
          value={v.address}
          onChange={(e) => set({ ...v, address: e.target.value })}
        />
        <Field
          label="Capacity"
          type="number"
          min={1}
          value={v.capacity ?? ""}
          onChange={(e) => set({ ...v, capacity: e.target.value ? Number(e.target.value) : null })}
        />
        <Select
          label="Status"
          value={String(v.active)}
          onChange={(e) => set({ ...v, active: e.target.value === "true" })}
        >
          <option value="true">{t("active")}</option>
          <option value="false">{t("archived")}</option>
        </Select>
      </Form>
    </BusinessCard>
  );
}
function ResourceEditor({
  data,
  refresh,
  value,
  onDone,
}: Props & { value: BusinessResource | null; onDone: () => void }) {
  const api = useApi();
  const [v, set] = useState<BusinessResource>(
    () =>
      value ?? {
        id: crypto.randomUUID(),
        locationId: data.locations[0]?.id ?? "",
        name: "",
        kind: "room",
        capacity: 1,
        active: true,
      },
  );
  return (
    <BusinessCard title={t("Resource details")}>
      <Form
        onDone={onDone}
        onSave={async () => {
          await api.business.saveResource(data.business.id, v);
          await refresh();
        }}
      >
        <Field
          label="Name"
          required
          value={v.name}
          onChange={(e) => set({ ...v, name: e.target.value })}
        />
        <Select
          label="Location"
          required
          value={v.locationId}
          onChange={(e) => set({ ...v, locationId: e.target.value })}
        >
          {data.locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Select
          label="Resource type"
          value={v.kind}
          onChange={(e) => set({ ...v, kind: e.target.value as BusinessResource["kind"] })}
        >
          {Object.entries(resourceLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {t(label)}
            </option>
          ))}
        </Select>
        <Field
          label="Capacity"
          type="number"
          min={1}
          required
          value={v.capacity}
          onChange={(e) => set({ ...v, capacity: Number(e.target.value) })}
        />
        <Select
          label="Status"
          value={String(v.active)}
          onChange={(e) => set({ ...v, active: e.target.value === "true" })}
        >
          <option value="true">{t("active")}</option>
          <option value="false">{t("archived")}</option>
        </Select>
      </Form>
    </BusinessCard>
  );
}
function Schedule({ data, refresh }: Props) {
  const [editing, setEditing] = useState<BusinessSession | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  return (
    <div className="space-y-6">
      <BusinessCard
        title={t("Classes, teams & resource sessions")}
        action={
          data.business.role !== "staff" ? (
            <Button
              variant="volt"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              {t("Add session")}
            </Button>
          ) : undefined
        }
      >
        <p className="mb-4 text-xs text-muted-foreground">
          {t("Times shown in")}: {data.business.timezone}
        </p>
        <div className="divide-y divide-border">
          {data.sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {businessTime(s.startsAt, data.business.timezone)} —{" "}
                  {businessTime(s.endsAt, data.business.timezone)}
                </p>
                <p className="mt-2 text-xs">
                  {data.locations.find((l) => l.id === s.locationId)?.name} · {s.group} · {s.booked}
                  /{s.capacity}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <BusinessStatus value={s.status} />
                <Button variant="secondary" onClick={() => setSelected(s.id)}>
                  {t("Bookings")}
                </Button>
                {data.business.role !== "staff" && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(s);
                      setOpen(true);
                    }}
                  >
                    {t("Edit")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </BusinessCard>
      {open && (
        <SessionEditor
          key={editing?.id ?? "new"}
          data={data}
          refresh={refresh}
          value={editing}
          onDone={() => setOpen(false)}
        />
      )}{" "}
      {selected && <Bookings key={selected} data={data} refresh={refresh} sessionId={selected} />}
    </div>
  );
}
function SessionEditor({
  data,
  refresh,
  value,
  onDone,
}: Props & { value: BusinessSession | null; onDone: () => void }) {
  const api = useApi();
  const [v, set] = useState<Omit<BusinessSession, "booked">>(() =>
    value
      ? {
          ...value,
          startsAt: businessLocalInput(value.startsAt, data.business.timezone),
          endsAt: businessLocalInput(value.endsAt, data.business.timezone),
        }
      : {
          id: crypto.randomUUID(),
          locationId: data.locations[0]?.id ?? "",
          resourceId: null,
          title: "",
          activity: "",
          group: "",
          startsAt: businessLocalInput(new Date().toISOString(), data.business.timezone),
          endsAt: businessLocalInput(
            new Date(Date.now() + 3600000).toISOString(),
            data.business.timezone,
          ),
          capacity: 12,
          status: "scheduled" as const,
        },
  );
  return (
    <BusinessCard title={t("Session details")}>
      <p className="mb-4 text-xs text-muted-foreground">
        {t("Times shown in")}: {data.business.timezone}
      </p>
      <Form
        onDone={onDone}
        onSave={async () => {
          await api.business.saveSession(data.business.id, {
            id: v.id,
            locationId: v.locationId,
            resourceId: v.resourceId,
            title: v.title,
            activity: v.activity,
            group: v.group,
            capacity: v.capacity,
            status: v.status,
            startsAt: businessInputISO(v.startsAt, data.business.timezone),
            endsAt: businessInputISO(v.endsAt, data.business.timezone),
          });
          await refresh();
        }}
      >
        <Field
          label="Session title"
          required
          value={v.title}
          onChange={(e) => set({ ...v, title: e.target.value })}
        />
        <Field
          label="Activity"
          value={v.activity}
          onChange={(e) => set({ ...v, activity: e.target.value })}
        />
        <Field
          label="Team or group"
          value={v.group}
          onChange={(e) => set({ ...v, group: e.target.value })}
        />
        <Select
          label="Location"
          required
          value={v.locationId}
          onChange={(e) => set({ ...v, locationId: e.target.value, resourceId: null })}
        >
          {data.locations
            .filter((l) => l.active)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </Select>
        <Select
          label="Resource"
          value={v.resourceId ?? ""}
          onChange={(e) => set({ ...v, resourceId: e.target.value || null })}
        >
          <option value="">{t("No specific resource")}</option>
          {data.resources
            .filter((r) => r.locationId === v.locationId && r.active)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </Select>
        <Field
          label="Capacity"
          type="number"
          min={1}
          required
          value={v.capacity}
          onChange={(e) => set({ ...v, capacity: Number(e.target.value) })}
        />
        <Field
          label="Starts at"
          type="datetime-local"
          required
          value={v.startsAt}
          onChange={(e) => set({ ...v, startsAt: e.target.value })}
        />
        <Field
          label="Ends at"
          type="datetime-local"
          required
          value={v.endsAt}
          onChange={(e) => set({ ...v, endsAt: e.target.value })}
        />
        <Select
          label="Status"
          value={v.status}
          onChange={(e) => set({ ...v, status: e.target.value as BusinessSession["status"] })}
        >
          <option value="scheduled">{t("scheduled")}</option>
          <option value="cancelled">{t("cancelled")}</option>
        </Select>
      </Form>
    </BusinessCard>
  );
}
function Bookings({ data, refresh, sessionId }: Props & { sessionId: string }) {
  const api = useApi();
  const [member, setMember] = useState("");
  const [error, setError] = useState("");
  const session = data.sessions.find((s) => s.id === sessionId);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  return (
    <BusinessCard title={session?.title}>
      <Form
        label="Book member"
        onSave={async () => {
          await api.business.bookSession(data.business.id, sessionId, member, requestId);
          setRequestId(crypto.randomUUID());
          await refresh();
        }}
      >
        <Select label="Member" required value={member} onChange={(e) => setMember(e.target.value)}>
          <option value="">{t("Choose a member")}</option>
          {data.members
            .filter((m) => m.status === "active")
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </Select>
      </Form>
      <div className="mt-5 divide-y divide-border">
        {data.bookings
          .filter((b) => b.sessionId === sessionId && b.status === "booked")
          .map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 py-3">
              <span>{b.memberName}</span>
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await api.business.cancelBooking(data.business.id, b.id);
                    await refresh();
                  } catch (cause) {
                    setError(errorText(cause));
                  }
                }}
              >
                {t("Cancel booking")}
              </Button>
            </div>
          ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </BusinessCard>
  );
}
function Ledger({ data, refresh }: Props) {
  const api = useApi();
  const [invoiceId, setInvoiceId] = useState(() => crypto.randomUUID());
  const [member, setMember] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(businessToday(data.business.timezone));
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("Record payments received elsewhere. Kinra does not charge cards or transfer funds.")}
      </p>
      <BusinessCard
        title={t("Invoices")}
        action={
          <Button
            variant="volt"
            onClick={() => {
              if (!open) {
                setInvoiceId(crypto.randomUUID());
                setLabel("");
                setAmount("");
              }
              setOpen(!open);
            }}
          >
            {t("Add invoice")}
          </Button>
        }
      >
        {data.invoices.map((i) => (
          <div
            key={i.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4"
          >
            <div>
              <p className="font-semibold">{i.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.members.find((m) => m.id === i.memberId)?.name} · {businessDate(i.dueDate)}
              </p>
              <p className="mt-2 text-sm">
                {businessMoney(i.paidMinor, data.business.currency)} /{" "}
                {businessMoney(i.totalMinor, data.business.currency)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BusinessStatus value={i.status} />
              {i.status !== "void" && (
                <Button variant="secondary" onClick={() => setSelected(i.id)}>
                  {t("Record payment or refund")}
                </Button>
              )}
              {i.status !== "void" && i.paidMinor === 0 && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await api.business.voidInvoice(data.business.id, i.id);
                      await refresh();
                    } catch (cause) {
                      setError(errorText(cause));
                    }
                  }}
                >
                  {t("Void invoice")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </BusinessCard>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {open && (
        <BusinessCard title={t("New invoice")}>
          <Form
            onDone={() => setOpen(false)}
            onSave={async () => {
              await api.business.saveInvoice(data.business.id, {
                id: invoiceId,
                memberId: member,
                label,
                totalMinor: Math.round(Number(amount) * 100),
                dueDate: due,
              });
              await refresh();
            }}
          >
            <Select
              label="Member"
              required
              value={member}
              onChange={(e) => setMember(e.target.value)}
            >
              <option value="">{t("Choose a member")}</option>
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Field
              label="Description"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Field
              label="Amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Field
              label="Due date"
              type="date"
              required
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </Form>
        </BusinessCard>
      )}
      {selected && (
        <PaymentEditor
          key={selected}
          data={data}
          refresh={refresh}
          invoiceId={selected}
          onDone={() => setSelected("")}
        />
      )}
      <BusinessCard title={t("Payment history")}>
        {data.payments.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap justify-between gap-3 border-b border-border py-3 text-sm"
          >
            <div>
              <p>
                {t(p.kind)} · {t(p.method)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {businessTime(p.createdAt, data.business.timezone)} · {p.reference}
              </p>
            </div>
            <span className="font-semibold">
              {p.kind === "refund" ? "−" : ""}
              {businessMoney(p.amountMinor, data.business.currency)}
            </span>
          </div>
        ))}
      </BusinessCard>
    </div>
  );
}
function PaymentEditor({
  data,
  refresh,
  invoiceId,
  onDone,
}: Props & { invoiceId: string; onDone: () => void }) {
  const api = useApi();
  const [id] = useState(() => crypto.randomUUID());
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"payment" | "refund">("payment");
  const [method, setMethod] = useState<"cash" | "bank" | "external_card" | "other">("cash");
  const [reference, setReference] = useState("");
  return (
    <BusinessCard title={t("Record payment or refund")}>
      <Form
        onDone={onDone}
        onSave={async () => {
          await api.business.recordPayment(data.business.id, {
            id,
            invoiceId,
            amountMinor: Math.round(Number(amount) * 100),
            kind,
            method,
            reference,
          });
          await refresh();
        }}
      >
        <Select
          label="Record type"
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="payment">{t("payment")}</option>
          <option value="refund">{t("refund")}</option>
        </Select>
        <Field
          label="Amount"
          required
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select
          label="Payment method"
          value={method}
          onChange={(e) => setMethod(e.target.value as typeof method)}
        >
          {["cash", "bank", "external_card", "other"].map((m) => (
            <option key={m} value={m}>
              {t(m)}
            </option>
          ))}
        </Select>
        <Field label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Form>
    </BusinessCard>
  );
}
