import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MapPin,
  ScanLine,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import { useApi, useQ } from "@/lib/api";
import { t, useLanguage } from "@/lib/i18n";
import { LanguageSelector } from "./language-selector";
import { ErrorState, Skeleton } from "./ui";
import { OrganizationTools } from "./organization-tools";
import { BusinessSetup } from "./business-management";
import { BusinessPanels } from "./business-panels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const businessNavigation = [
  { id: "overview", title: "Overview", icon: LayoutDashboard },
  { id: "reception", title: "Reception", icon: ScanLine },
  { id: "members", title: "Members", icon: Users },
  { id: "plans", title: "Membership plans", icon: CreditCard },
  { id: "locations", title: "Locations & resources", icon: MapPin },
  { id: "schedule", title: "Schedule", icon: CalendarDays },
  { id: "ledger", title: "Payment ledger", icon: Wallet },
  { id: "staff", title: "Staff & settings", icon: Settings2 },
] as const;
export type BusinessTab = (typeof businessNavigation)[number]["id"];

export function BusinessWorkspace() {
  useLanguage();
  const api = useApi();
  const organizations = useQ(["business-list"], (a) => a.business.list());
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState<BusinessTab>("overview");
  const [creating, setCreating] = useState(false);
  const org = organizations.data?.find((item) => item.id === selected) ?? organizations.data?.[0];
  const navigation = businessNavigation.filter(
    (item) => org?.role !== "staff" || !["ledger", "staff"].includes(item.id),
  );
  const active = navigation.some((item) => item.id === tab) ? tab : "overview";
  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#business-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        {t("Skip to content")}
      </a>
      <aside className="border-b border-border bg-surface/50 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-6 py-7">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Building2 aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-xl font-bold tracking-tight">Kinra</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Business
            </p>
          </div>
        </div>
        <nav
          aria-label={t("Business navigation")}
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible"
        >
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:shrink",
                active === item.id
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <item.icon aria-hidden="true" className="size-5 shrink-0" />
              <span>{t(item.title)}</span>
            </button>
          ))}
        </nav>
        <div className="hidden px-6 py-6 lg:mt-auto lg:block">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("One workspace for your people, places and daily operations.")}
          </p>
          <Link to="/app/me" className="mt-5 flex min-h-11 items-center gap-2 text-sm">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("Back to my profile")}
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 lg:px-10">
          <div className="min-w-0">
            <label
              htmlFor="business-organization"
              className="mb-1 block text-xs text-muted-foreground"
            >
              {t("Organization")}
            </label>
            <select
              id="business-organization"
              value={org?.id ?? ""}
              onChange={(event) => {
                setSelected(event.target.value);
                setTab("overview");
              }}
              className="min-h-11 max-w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold"
            >
              <option value="" disabled>
                {t("Choose an organization")}
              </option>
              {organizations.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {api.mode !== "live" && (
              <span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                {t("Local demo")}
              </span>
            )}
            {org && (
              <span className="rounded-full border border-border px-3 py-2 text-xs capitalize">
                {t(org.role)}
              </span>
            )}
            <LanguageSelector compact />
            {org && (
              <Button
                variant="secondary"
                className="min-h-11"
                onClick={() => setCreating(!creating)}
              >
                {t(creating ? "Cancel" : "Create your business")}
              </Button>
            )}
            <Link
              to="/app/me"
              className="grid size-11 place-items-center rounded-lg border border-border lg:hidden"
              aria-label={t("Back to my profile")}
            >
              <ArrowLeft aria-hidden="true" />
            </Link>
          </div>
        </header>
        <main
          id="business-main"
          className="mx-auto max-w-[1600px] space-y-7 px-5 py-7 lg:px-10 lg:py-10"
        >
          {organizations.isLoading ? (
            <Skeleton className="h-64" />
          ) : organizations.error ? (
            <ErrorState onRetry={() => organizations.refetch()} />
          ) : creating ? (
            <div className="mx-auto max-w-2xl">
              <BusinessSetup
                onDone={async (businessId) => {
                  await organizations.refetch();
                  setSelected(businessId ?? "");
                  setTab("overview");
                  setCreating(false);
                }}
              />
            </div>
          ) : org ? (
            <BusinessPanels key={org.id} org={org} tab={active} onNavigate={setTab} />
          ) : (
            <div className="mx-auto max-w-xl space-y-4 py-12">
              <h1 className="font-display text-3xl font-bold">{t("Your business starts here")}</h1>
              <p className="text-muted-foreground">
                {t(
                  "Create an organization or accept a staff invitation to open your operations workspace.",
                )}
              </p>
              <BusinessSetup
                onDone={async (businessId) => {
                  await organizations.refetch();
                  setSelected(businessId ?? "");
                }}
              />
              <OrganizationTools />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
