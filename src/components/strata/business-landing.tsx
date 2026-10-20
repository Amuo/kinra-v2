import { useId, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  CircleDot,
  Dumbbell,
  LayoutDashboard,
  MapPin,
  QrCode,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  Wallet,
  Waves,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageSelector } from "./language-selector";
import { t, useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const actionClass =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-xl px-5 py-3 text-center text-sm font-semibold leading-relaxed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
const previewSessions = [
  { time: "17:00", title: "Swimming group", place: "Pool · Lane 2", count: "8 / 12" },
  { time: "18:30", title: "Team training", place: "Football pitch", count: "16 / 22" },
];
const facilityStrip = [
  "Gyms & fitness",
  "Pool & swimming",
  "Football club",
  "MMA & combat sports",
  "Sports complex",
];
const homeBenefits = [
  "Memberships and location access",
  "QR entry and recorded attendance",
  "Classes, teams and resource bookings",
];
const facilities = [
  {
    title: "Gyms & fitness clubs",
    description: "Memberships, visits and the daily reception queue.",
    icon: Dumbbell,
  },
  {
    title: "Pools & swimming clubs",
    description: "Pool access, swimming lanes and group sessions.",
    icon: Waves,
  },
  {
    title: "Football & team sports",
    description: "Teams, pitches and a shared training schedule.",
    icon: Trophy,
  },
  {
    title: "MMA & martial arts",
    description: "Training groups, mats and class capacities.",
    icon: Swords,
  },
  {
    title: "Athletics & sports complexes",
    description: "Multiple locations and resources in one workspace.",
    icon: CircleDot,
  },
  {
    title: "Your kind of facility",
    description: "Tennis, padel, dance, yoga and more. Configure the resources you use.",
    icon: Building2,
  },
] as const;
const workflow = [
  {
    title: "Welcome the member",
    description:
      "Create a member record at reception. A Kinra account is optional until they want their own pass and bookings.",
    icon: Users,
  },
  {
    title: "Give the right access",
    description:
      "Choose a plan, dates, visit allowance and eligible locations. Pause or update access when things change.",
    icon: ShieldCheck,
  },
  {
    title: "Make entry clear",
    description:
      "Scan a short-lived QR pass or look up the member. See the access decision, record the visit and check them out.",
    icon: QrCode,
  },
  {
    title: "Keep the week organized",
    description:
      "Schedule classes and team sessions, allocate resources and manage bookings within capacity.",
    icon: CalendarDays,
  },
] as const;

function DemoButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        sessionStorage.setItem("strata-demo", "client");
        void navigate({ to: "/business/dashboard" });
      }}
      className={cn(
        actionClass,
        "border border-border bg-surface/60 hover:bg-surface-2",
        className,
      )}
    >
      {t("Try the business demo")}
      <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
    </button>
  );
}

/** An illustrative product view, with no account data or inert mock controls. */
function OperationsPreview({ compact = false }: { compact?: boolean }) {
  const [view, setView] = useState<"reception" | "schedule">("reception");
  const label = useId();
  return (
    <figure
      aria-labelledby={label}
      className="min-w-0 rounded-2xl border border-primary/20 bg-[#131b18] p-2 shadow-[0_24px_100px_-50px_rgba(167,243,92,0.4)] sm:rounded-3xl sm:p-3"
    >
      <figcaption
        id={label}
        className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-2 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          {t("Product preview")}
        </span>
        <span>{t("Illustrative demo data")}</span>
      </figcaption>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-background sm:rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("Demo Sports Centre")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("Main location")} · Sarajevo
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs">
            {t("Reception team")}
          </span>
        </div>
        <div className="grid sm:grid-cols-[48px_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="hidden flex-col items-center gap-6 border-r border-border py-5 text-muted-foreground sm:flex"
          >
            <LayoutDashboard className="size-4" />
            <QrCode className="size-4 text-primary" />
            <Users className="size-4" />
            <CalendarDays className="size-4" />
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-semibold">
                {t("Ready for the next arrival.")}
              </h3>
              <div
                role="group"
                aria-label={t("Preview view")}
                className="flex gap-1 rounded-lg bg-surface-2 p-1"
              >
                {(["reception", "schedule"] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={view === value}
                    onClick={() => setView(value)}
                    className={cn(
                      "min-h-10 rounded-md px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
                      view === value ? "bg-background text-primary" : "text-muted-foreground",
                    )}
                  >
                    {t(value === "reception" ? "Reception" : "Schedule")}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{t("Inside now")}</p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                  18<span className="ml-2 text-sm font-normal text-muted-foreground">/ 48</span>
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{t("Visits today")}</p>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums">42</p>
              </div>
            </div>
            {view === "reception" ? (
              <div className="rounded-xl border border-primary/25 bg-primary/[0.07] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check aria-hidden="true" className="size-4" />
                  {t("Entry recorded")}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold">{t("Demo member 024")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("Monthly membership")} · {t("active")}
                    </p>
                  </div>
                  <QrCode className="size-10 text-primary/60" aria-hidden="true" />
                </div>
                <div className="mt-4 border-t border-primary/15 pt-3 text-xs text-muted-foreground">
                  {t("Membership checked. Visit recorded.")}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {previewSessions.map((session) => (
                  <div
                    key={session.time}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
                  >
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {session.time}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{t(session.title)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t(session.place)}</p>
                    </div>
                    <span className="text-xs tabular-nums">{session.count}</span>
                  </div>
                ))}
              </div>
            )}
            {!compact && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                  {t("Role-based access")}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-3.5" />
                  {t("Location-specific access")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function BusinessLanding() {
  useLanguage();
  return (
    <div className="min-h-dvh bg-background text-foreground [overflow-wrap:anywhere]">
      <a
        href="#business-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:p-3 focus:text-primary-foreground"
      >
        {t("Skip to content")}
      </a>
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-8 lg:px-10">
        <Link
          to="/business"
          aria-label="Kinra Business"
          className="flex min-h-11 items-center gap-3"
        >
          <Logo className="h-6 sm:h-7" />
          <span className="border-l border-border pl-3 text-sm font-semibold tracking-wide">
            Business
          </span>
        </Link>
        <nav aria-label={t("Main")} className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            to="/"
            className="min-h-11 px-3 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("Personal Kinra")}
          </Link>
          <LanguageSelector compact />
          <Link
            to="/business/dashboard"
            className={cn(actionClass, "bg-primary text-primary-foreground hover:bg-primary/90")}
          >
            {t("Open workspace")}
            <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </nav>
      </header>
      <main id="business-content">
        <section className="relative isolate mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 md:pb-24 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:px-10 lg:pb-28 lg:pt-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_30%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_60%)]"
          />
          <div className="min-w-0">
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="h-px w-7 bg-primary" />
              {t("Built for the people who run the place")}
            </p>
            <h1 className="max-w-[10ch] font-display text-5xl font-bold leading-[1.04] tracking-[-0.045em] sm:text-6xl xl:text-7xl">
              {t("Keep your club moving.")}
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t(
                "Members, reception, spaces and schedules. One business workspace for the work behind every training session.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/business/dashboard"
                className={cn(
                  actionClass,
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {t("Open your business workspace")}
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
              <DemoButton />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t("Explore the demo with sample records. No account required.")}
            </p>
          </div>
          <OperationsPreview />
        </section>
        <section
          aria-label={t("Made for your facility")}
          className="border-y border-border bg-surface/30"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-6 sm:px-8 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {t("More than a gym desk")}
            </p>
            {facilityStrip.map((label) => (
              <span key={label} className="text-sm font-medium">
                {t(label)}
              </span>
            ))}
          </div>
        </section>
        <section
          id="business-workflow"
          className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="mb-10 grid gap-5 md:grid-cols-2 md:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                {t("A connected working day")}
              </p>
              <h2 className="max-w-lg font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t("From first hello to the next session.")}
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:justify-self-end">
              {t(
                "Give each daily task a clear place, while keeping the member and their access in view.",
              )}
            </p>
          </div>
          <ol className="grid gap-0 border-y border-border md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((step, index) => (
              <li
                key={step.title}
                className="relative min-w-0 border-b border-border px-1 py-7 last:border-b-0 md:px-6 xl:border-b-0 xl:border-r xl:last:border-r-0"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-muted-foreground">
                    0{index + 1}
                  </span>
                  <step.icon aria-hidden="true" className="size-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold">{t(step.title)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(step.description)}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 sm:p-8 lg:col-span-2">
              <QrCode aria-hidden="true" className="mb-6 size-8 text-primary" />
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                {t("A pass in their pocket. A clear answer at reception.")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {t(
                  "Members generate a short-lived QR pass in Kinra. Your team checks current membership and location access, with manual lookup when needed.",
                )}
              </p>
              <p className="mt-6 max-w-2xl border-t border-primary/15 pt-4 text-sm leading-relaxed text-muted-foreground">
                {t(
                  "Attendance is recorded in Kinra. Door and turnstile control needs a separate hardware integration.",
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/40 p-6 sm:p-8">
              <Wallet aria-hidden="true" className="mb-6 size-8 text-primary" />
              <h2 className="font-display text-2xl font-semibold">{t("Know what is recorded.")}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t(
                  "Keep invoices, payments and refunds together, with financial records available to owners and managers.",
                )}
              </p>
              <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                {t("Payments are recorded manually. Kinra does not charge cards or move money.")}
              </p>
            </div>
          </div>
        </section>
        <section className="border-y border-border bg-surface/25">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
            <div className="mb-10 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                {t("Made for your facility")}
              </p>
              <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t("Different sports. The same daily essentials.")}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {t(
                  "From a neighborhood club to a multi-sport complex. Choose your facility type, locations, spaces and membership rules.",
                )}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((facility) => (
                <article
                  key={facility.title}
                  className="rounded-xl border border-border bg-background/50 p-6"
                >
                  <facility.icon aria-hidden="true" className="mb-5 size-6 text-primary" />
                  <h3 className="font-display text-lg font-semibold">{t(facility.title)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(facility.description)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 lg:px-10 lg:py-24">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              {t("One Kinra. Two kinds of work.")}
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
              {t("Their training stays personal. Your operations stay organized.")}
            </h2>
          </div>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              {t(
                "Personal Kinra is for training, nutrition, recovery and coaching. Kinra Business is for the team running the facility.",
              )}
            </p>
            <p>
              {t(
                "A membership link enables passes and bookings. It does not give the facility access to private health or coaching logs.",
              )}
            </p>
            <p className="flex flex-wrap gap-3 text-sm font-semibold text-foreground">
              <span>English</span>
              <span aria-hidden="true">/</span>
              <span lang="bs">Bosanski</span>
              <span aria-hidden="true">/</span>
              <span lang="de">Deutsch</span>
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
          <div className="flex flex-col justify-between gap-8 rounded-3xl border border-primary/25 bg-primary/[0.07] p-7 sm:p-10 lg:flex-row lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                Kinra Business
              </p>
              <h2 className="max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t("See your next working day, together.")}
              </h2>
            </div>
            <div className="flex shrink-0 flex-col gap-3">
              <Link
                to="/business/dashboard"
                className={cn(
                  actionClass,
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {t("Open your business workspace")}
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
              <DemoButton />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>Kinra Business</span>
          <Link to="/" className="min-h-11 py-3 hover:text-foreground">
            {t("Back to personal Kinra")} ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}

export function BusinessHomeSection() {
  useLanguage();
  return (
    <section
      id="kinra-business"
      aria-labelledby="kinra-business-title"
      className="border-y border-border bg-surface/30"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:px-8 lg:grid-cols-2 lg:gap-14 lg:py-24">
        <div className="min-w-0">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Kinra Business
          </p>
          <h2
            id="kinra-business-title"
            className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          >
            {t("For the people behind the training.")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {t(
              "Run your gym, pool, sports club or complex with a dedicated workspace for members, reception and the weekly schedule.",
            )}
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {homeBenefits.map((label) => (
              <li key={label} className="flex items-start gap-3">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(label)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/business"
              className={cn(actionClass, "bg-primary text-primary-foreground hover:bg-primary/90")}
            >
              {t("Explore Kinra Business")}
              <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
            <DemoButton />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {t("A business workspace alongside your personal Kinra account.")}
          </p>
        </div>
        <OperationsPreview compact />
      </div>
    </section>
  );
}
