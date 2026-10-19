import { TodayRoutines } from "@/components/strata/today-routines";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useMe } from "@/lib/api";
import {
  ClientOverview,
  FirstRun,
  Insights,
  PinnedCoachNote,
  StreakFlame,
  ReadinessHero,
  TodaySession,
} from "@/components/strata/client-overview";
import { Avatar, SectionTitle, springPress } from "@/components/strata/ui";
import { firstName } from "@/lib/stats";
import { useShell } from "@/components/strata/shell";
import { logKinds } from "@/components/strata/sheets";
import { cn } from "@/lib/utils";
import { CoachHome } from "@/components/strata/coach-overview";
import { useAppView } from "@/components/strata/app-view";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Today — Kinra" },
      {
        name: "description",
        content: "Your daily training, recovery and coaching overview in Kinra.",
      },
      { property: "og:title", content: "Today — Kinra" },
      {
        property: "og:description",
        content: "Your daily training, recovery and coaching overview in Kinra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Home() {
  const me = useMe().data;
  const { personal } = useAppView();
  if (!me) return null;
  return me.role === "trainer" && !personal ? (
    <CoachHome name={me.display_name} avatar={me.avatar_url} />
  ) : (
    <ClientHome id={me.id} name={me.display_name} avatar={me.avatar_url} />
  );
}

function ClientHome({
  id,
  name,
  avatar,
}: {
  id: string;
  name: string | null;
  avatar?: string | undefined;
}) {
  const { log, startSession } = useShell();
  return (
    <div>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-4 pt-2">
        <div className="min-w-0">
          <div className="eyebrow">{format(new Date(), "EEEE · d MMMM")}</div>
          <h1 className="mt-1 font-display text-title font-bold">
            {greeting()}, <span className="text-volt">{firstName(name)}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakFlame userId={id} />
          <Link to="/app/me" aria-label="Profile" className="rounded-full">
            <Avatar name={name} src={avatar} size={44} />
          </Link>
        </div>
      </header>
      <ReadinessHero userId={id} />
      <FirstRun userId={id} />
      <TodaySession userId={id} />
      <TodayRoutines />
      <PinnedCoachNote userId={id} />
      <Insights userId={id} />

      <SectionTitle>Quick log</SectionTitle>
      <div className="grid grid-cols-5 gap-2">
        {logKinds.map((l) => (
          <motion.button
            key={l.kind}
            whileTap={springPress}
            onClick={() => (l.kind === "workout" ? startSession() : log(l.kind))}
            className="tile flex min-h-[76px] flex-col items-center justify-center gap-1 px-1"
          >
            <l.icon className={cn("size-5", l.tone)} />
            <span className="text-caption font-semibold tracking-tight">{l.label}</span>
          </motion.button>
        ))}
      </div>
      <ClientOverview userId={id} />
    </div>
  );
}
