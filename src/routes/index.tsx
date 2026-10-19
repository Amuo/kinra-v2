import { LanguageSelector } from "@/components/strata/language-selector";
import { displayNumber, number, t as tr, useLanguage, Message } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Dumbbell,
  Moon,
  Utensils,
  NotebookPen,
  Users,
  ClipboardList,
  Building2,
  Stethoscope,
  Timer,
  Trophy,
  Check,
  Play,
} from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Ring } from "@/components/strata/ui";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: tr("Kinra — Training, recovery & coaching in one app") },
      {
        name: "description",
        content:
          "Log workouts, sleep, food and mood. Coaches get client dashboards, programs and feedback tools.",
      },
      { property: "og:title", content: "Kinra — Training, recovery & coaching in one app" },
      {
        property: "og:description",
        content:
          "Every layer of your health, in one place. For athletes and the coaches behind them.",
      },
    ],
  }),
  component: Landing,
});

const press = { scale: 0.97 };

function useDemo() {
  const navigate = useNavigate();
  return (as: "client" | "trainer") => {
    sessionStorage.setItem("strata-demo", as);
    navigate({ to: "/app" });
  };
}

function HeroImage({ className }: { className?: string }) {
  useLanguage();
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={cn(
        "overflow-hidden bg-[radial-gradient(60%_50%_at_50%_40%,color-mix(in_oklab,var(--volt)_22%,transparent),transparent)]",
        className,
      )}
    >
      <img
        src={hero}
        alt={tr("Athlete preparing to deadlift under green light")}
        width={864}
        height={1280}
        fetchPriority="high"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-[opacity,filter] duration-700",
          loaded ? "opacity-100 blur-0" : "opacity-40 blur-xl",
        )}
      />
    </div>
  );
}

/** Static preview of the Today screen for the device frame. */
function TodayMock() {
  useLanguage();
  return (
    <div className="flex h-full flex-col gap-3 bg-background px-4 pt-10 text-left">
      <div>
        <div className="eyebrow">
          <Message source="Wednesday · 14 October" />
        </div>
        <div className="mt-1 font-display text-title font-bold">
          <Message source="Good morning," />
          <span className="text-volt">
            <Message source="Maya" />
          </span>
        </div>
      </div>
      <div className="panel flex flex-col items-center gap-4 p-4">
        <Ring value={0.82} size={92} stroke={9}>
          <div>
            <div className="num text-title font-bold">82</div>
            <div className="eyebrow">
              <Message source="Ready" />
            </div>
          </div>
        </Ring>
        <div className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-2">
          {[
            ["Sleep", "7.8", "h", "text-dream"],
            ["Streak", "6", "d", "text-volt"],
            ["Eaten", "1.2k", "kcal", "text-ember"],
            ["Protein", "84", "g", "text-ember"],
          ].map(([l, v, u, t]) => (
            <div key={l} className="min-w-0">
              <div className="eyebrow whitespace-normal hyphens-auto [overflow-wrap:anywhere]">
                {tr(l ?? "")}
              </div>
              <div
                className={`num flex min-w-0 flex-wrap items-baseline gap-x-1 text-title font-bold leading-tight ${t}`}
              >
                {v === "1.2k"
                  ? `${number(1.2, { minimumFractionDigits: 1 })}k`
                  : displayNumber(v ?? "")}
                <span className="font-sans text-caption text-muted-foreground">{u}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-4">
        <div className="eyebrow">
          <Message source="Foundations · Week 3/6" />
        </div>
        <div className="mt-1 font-display text-title font-bold">
          <Message source="Day B · Hinge focus" />
        </div>
        <div className="num mt-1 text-caption text-muted-foreground">
          <Message source="Deadlift 4×4 · Overhead Press 4×6" />
        </div>
        <div className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-volt-gradient text-label font-semibold text-primary-foreground">
          <Play className="size-4" /> <Message source="Start session" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          [Dumbbell, "text-volt"],
          [Utensils, "text-ember"],
          [Moon, "text-dream"],
          [NotebookPen, "text-pulse"],
        ].map(([I, t], i) => {
          const Icon = I as typeof Dumbbell;
          return (
            <div key={i} className="tile grid h-14 place-items-center">
              <Icon className={`size-5 ${t}`} />
            </div>
          );
        })}
      </div>
      <div className="panel p-4">
        <div className="eyebrow mb-3">
          <Message source="Last 28 days" />
        </div>
        <div className="flex h-16 items-end gap-[3px]">
          {[4, 0, 6, 3, 0, 7, 0, 5, 6, 0, 4, 8, 0, 0, 6, 5, 0, 7, 4, 0, 8, 6, 0, 5, 7, 0, 6, 8].map(
            (v, i) => (
              <span
                key={i}
                className="flex-1 rounded-[3px]"
                style={{
                  height: `${Math.max(6, v * 12)}%`,
                  background: v ? "var(--volt)" : "var(--surface-2)",
                }}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  useLanguage();
  return (
    <div className="relative mx-auto aspect-[9/19] w-[320px] rounded-[48px] border border-border bg-surface p-2.5 shadow-glow">
      <div className="absolute left-1/2 top-4 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-background" />
      <div className="h-full overflow-hidden rounded-[38px]">{children}</div>
    </div>
  );
}

const features = [
  { icon: Dumbbell, label: "Workouts", tone: "text-volt" },
  { icon: Utensils, label: "Nutrition", tone: "text-ember" },
  { icon: Moon, label: "Sleep", tone: "text-dream" },
  { icon: NotebookPen, label: "Journal", tone: "text-pulse" },
];

function Landing() {
  useLanguage();
  const demo = useDemo();
  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* ---------- mobile hero ---------- */}
      <section className="relative h-[88dvh] min-h-[600px] md:hidden">
        <HeroImage className="absolute inset-0" />
        <div className="bg-fade absolute inset-0" />
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
          <Logo />
          <LanguageSelector compact />
          <Link to="/auth" className="flex min-h-[44px] items-center px-2 text-label font-semibold">
            <Message source="Sign in" />
          </Link>
        </header>
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6">
          <div className="eyebrow mb-3 !text-volt">
            <Message source="Health · Fitness · Recovery" />
          </div>
          <h1 className="font-display text-display font-black uppercase leading-[0.9] [font-stretch:120%]">
            <Message source="Every layer" />
            <br />
            <Message source="of you." />
          </h1>
          <p className="mt-4 max-w-xs text-body text-muted-foreground">
            <Message source="Training, food, sleep and mind in one place — with your coach right there." />
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <motion.div whileTap={press}>
              <Link
                to="/auth"
                className="flex min-h-14 min-w-0 items-center justify-center gap-2 rounded-full px-4 py-3 text-center bg-volt-gradient font-semibold text-primary-foreground shadow-glow"
              >
                <Message source="Start free" />
                <ArrowRight className="size-5" />
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={press}
                onClick={() => demo("client")}
                className="min-h-14 min-w-0 whitespace-normal break-words rounded-full border border-border bg-surface-2/70 px-3 py-3 font-semibold hyphens-auto backdrop-blur"
              >
                <Message source="Demo · Client" />
              </motion.button>
              <motion.button
                whileTap={press}
                onClick={() => demo("trainer")}
                className="min-h-14 min-w-0 whitespace-normal break-words rounded-full border border-border bg-surface-2/70 px-3 py-3 font-semibold hyphens-auto backdrop-blur"
              >
                <Message source="Demo · Coach" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- desktop hero ---------- */}
      <section className="app-backdrop relative hidden md:block">
        <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-8 py-6">
          <Logo />
          <nav className="flex min-w-0 flex-wrap items-center gap-2">
            <LanguageSelector compact />
            <Link
              to="/auth"
              className="flex min-h-[44px] items-center px-4 text-label font-semibold text-muted-foreground hover:text-foreground"
            >
              <Message source="Sign in" />
            </Link>
            <Link
              to="/auth"
              className="flex min-h-[44px] items-center rounded-full bg-primary px-5 text-label font-bold text-primary-foreground"
            >
              <Message source="Start free" />
            </Link>
          </nav>
        </header>
        <div className="mx-auto grid max-w-6xl grid-cols-[1.1fr_1fr] items-center gap-12 px-8 pb-24 pt-10">
          <div>
            <div className="eyebrow mb-4 !text-volt">
              <Message source="Health · Fitness · Recovery · Coaching" />
            </div>
            <h1 className="font-display text-[4.5rem] font-black uppercase leading-[0.88] [font-stretch:120%] lg:text-[5.5rem]">
              <Message source="Every layer" />
              <br />
              <Message source="of you." />
            </h1>
            <p className="mt-6 max-w-md text-title font-normal text-muted-foreground">
              <Message source="Live workout sessions, sleep, food and mood in one app — with your coach seeing what matters." />
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.div whileTap={press}>
                <Link
                  to="/auth"
                  className="flex h-14 items-center gap-2 rounded-full bg-volt-gradient px-8 font-semibold text-primary-foreground shadow-glow"
                >
                  <Message source="Start free" />
                  <ArrowRight className="size-5" />
                </Link>
              </motion.div>
              <motion.button
                whileTap={press}
                onClick={() => demo("client")}
                className="h-14 rounded-full border border-border bg-surface px-8 font-semibold"
              >
                <Message source="Try the live demo" />
              </motion.button>
            </div>
            <button
              onClick={() => demo("trainer")}
              className="mt-4 min-h-[44px] text-label text-muted-foreground underline-offset-4 hover:underline"
            >
              <Message source="Are you a coach? See the coach demo →" />
            </button>
          </div>
          <div className="relative">
            <HeroImage className="absolute -inset-x-10 -inset-y-16 rounded-[40px] opacity-40 [mask-image:radial-gradient(closest-side,black,transparent)]" />
            <div className="relative">
              <Phone>
                <TodayMock />
              </Phone>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- features ---------- */}
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-3 md:gap-6 md:px-8 md:py-16">
        <section className="px-5 py-12 md:panel md:p-8">
          <Timer className="mb-4 hidden size-7 text-volt md:block" />
          <div className="eyebrow mb-2">
            <Message source="Session" />
          </div>
          <h2 className="font-display text-title-l font-extrabold [font-stretch:110%]">
            <Message source="Live sessions that feel like a coach." />
          </h2>
          <ul className="mt-5 space-y-3 text-body text-muted-foreground">
            <li className="flex gap-3">
              <Check className="mt-0.5 size-5 shrink-0 text-volt" />{" "}
              <Message source="Last-time weights pre-filled" />
            </li>
            <li className="flex gap-3">
              <Check className="mt-0.5 size-5 shrink-0 text-volt" />{" "}
              <Message source="Auto rest timer on every set" />
            </li>
            <li className="flex gap-3">
              <Trophy className="mt-0.5 size-5 shrink-0 text-volt" />{" "}
              <Message source="Instant PR detection" />
            </li>
          </ul>
          <div className="mt-6 grid grid-cols-4 gap-2 md:hidden">
            {features.map((f) => (
              <div key={tr(f.label)} className="tile flex flex-col items-center gap-2 p-3">
                <f.icon className={`size-6 ${f.tone}`} />
                <span className="text-caption font-semibold">{tr(f.label)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="border-y border-border px-5 py-12 md:panel md:border md:p-8">
          <div className="eyebrow mb-2">
            <Message source="Readiness" />
          </div>
          <h2 className="font-display text-title-l font-extrabold [font-stretch:110%]">
            <Message source="Know how hard to push." />
          </h2>
          <div className="mt-6 flex items-center gap-5">
            <Ring value={0.82} size={96} stroke={9}>
              <span className="num text-title font-bold">82</span>
            </Ring>
            <p className="text-body text-muted-foreground">
              <Message source="Sleep, training load and mood fused into one daily score." />
            </p>
          </div>
        </section>
        <section className="grid-lines px-5 py-12 md:panel md:p-8">
          <div className="eyebrow mb-2">
            <Message source="Coach" />
          </div>
          <h2 className="font-display text-title-l font-extrabold [font-stretch:110%]">
            <Message source="Every client at a glance." />
          </h2>
          <ul className="mt-5 space-y-3">
            {[
              [Users, "30-day compliance for every client"],
              [ClipboardList, "Build programs once, assign in a tap"],
              [NotebookPen, "Reports and notes land on their home screen"],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof Users;
              return (
                <li key={i} className="flex items-start gap-3 text-body">
                  <I className="mt-0.5 size-5 shrink-0 text-volt" /> {tr(t as string)}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <div className="eyebrow mb-3">
          <Message source="Coming soon" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="panel p-4 md:p-6">
            <Building2 className="mb-2 size-5 text-pulse" />
            <div className="font-semibold">
              <Message source="Gyms & facilities" />
            </div>
            <div className="text-caption text-muted-foreground">
              <Message source="Member check-ins & tracking" />
            </div>
          </div>
          <div className="panel p-4 md:p-6">
            <Stethoscope className="mb-2 size-5 text-dream" />
            <div className="font-semibold">
              <Message source="Doctors & dietitians" />
            </div>
            <div className="text-caption text-muted-foreground">
              <Message source="Labs and care plans" />
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 md:flex-row md:justify-center">
          <Link
            to="/auth"
            className="flex h-14 items-center justify-center rounded-full bg-volt-gradient px-8 font-semibold text-primary-foreground"
          >
            <Message source="Start free" />
          </Link>
          <button
            onClick={() => demo("client")}
            className="h-14 rounded-full border border-border px-8 font-semibold"
          >
            <Message source="Try the live demo" />
          </button>
        </div>
      </section>
    </div>
  );
}
