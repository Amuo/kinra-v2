import { errorText } from "@/lib/i18n-errors";
import { LanguageSelector } from "@/components/strata/language-selector";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { FeaturePreferences } from "@/components/strata/feature-preferences";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  Home,
  Dumbbell,
  Utensils,
  Moon,
  LineChart,
  Users,
  ClipboardList,
  User,
  Plus,
  X,
  LayoutDashboard,
  ArrowLeftRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ApiProvider, useAct, useLog, useMe, type Mode } from "@/lib/api";
import { LogSheets, Sheet, logKinds, type LogKind } from "@/components/strata/sheets";
import { ShellCtx, type LiveSessionState } from "@/components/strata/shell";
import { LiveSession, sessionFromTemplate, toWorkoutRow } from "@/components/strata/session";
import { doneCount, isStale, lastActivity, sessionFromWorkout } from "@/lib/session-state";
import { format } from "@/lib/i18n";
import { ErrorState, SkeletonPage, springPress } from "@/components/strata/ui";
import type { ProgramDay, Role, Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AppViewProvider, useAppView } from "@/components/strata/app-view";
import { readSession, writeSession, useAuthIdentity } from "@/lib/account-state";
import { DEMO_CLIENT_ID, DEMO_TRAINER_ID } from "@/lib/demo-data";

const DEMO_KEY = "strata-demo";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const demo = sessionStorage.getItem(DEMO_KEY);
    if (demo === "client" || demo === "trainer")
      return {
        mode: `demo-${demo}` as Mode,
        ownerId: demo === "client" ? DEMO_CLIENT_ID : DEMO_TRAINER_ID,
      };
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { mode: "live" as Mode, ownerId: data.user.id };
  },
  head: () => ({ meta: [{ title: "Kinra" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  useLanguage();
  const { mode, ownerId } = Route.useRouteContext();
  const identity = useAuthIdentity();
  if (mode === "live" && identity !== ownerId) return <SkeletonPage />;
  return (
    <MotionConfig reducedMotion="user">
      <ApiProvider key={`${mode}:${ownerId}`} mode={mode} ownerId={ownerId}>
        <AppViewProvider>
          <div className="app-backdrop min-h-dvh">
            <Shell mode={mode} />
          </div>
        </AppViewProvider>
      </ApiProvider>
    </MotionConfig>
  );
}

function Shell({ mode }: { mode: Mode }) {
  useLanguage();
  const { ownerId } = Route.useRouteContext();
  const me = useMe();
  const { personal } = useAppView();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [kind, setKind] = useState<LogKind | null>(null);
  const [meal, setMeal] = useState<string | undefined>();
  const [hub, setHub] = useState(false);
  const [session, setSessionState] = useState<LiveSessionState | null>(() =>
    readSession(localStorage, mode, ownerId),
  );
  const [minimized, setMinimized] = useState(() => !!session);
  const [conflict, setConflict] = useState<LiveSessionState | null>(null);
  const [stale, setStale] = useState(
    () => !!session && !session.editingId && isStale(session, Date.now()),
  );
  const workouts = useLog("workouts", me.data?.id).data ?? [];
  const saveRow = useAct((api, row: Partial<Workout> & { id: string }) => api.saveWorkout(row));

  const setSession = (s: LiveSessionState | null) => {
    setSessionState(s);
    try {
      writeSession(localStorage, mode, ownerId, s);
    } catch {
      toast.error(
        tr("Your browser couldn't keep a recovery copy. Keep this tab open until you save."),
      );
    }
  };

  if (me.isLoading)
    return (
      <div className="mx-auto max-w-md px-5 pt-10">
        <SkeletonPage />
      </div>
    );
  if (me.error)
    return (
      <div className="mx-auto max-w-md px-5 pt-16">
        <ErrorState message={(me.error as Error).message} onRetry={() => me.refetch()} />
      </div>
    );
  if (!me.data?.role) return <Onboarding />;

  const role = me.data.role;
  const api = {
    session,
    log: (k: Exclude<LogKind, "workout">, o?: { meal?: string }) => {
      setMeal(o?.meal);
      setKind(k);
      setHub(false);
    },
    startSession: (t?: ProgramDay) => {
      setHub(false);
      const next = sessionFromTemplate(t, workouts);
      if (session) return setConflict(next);
      setSession(next);
      setMinimized(false);
    },
    editWorkout: (w: Workout) => {
      const next: LiveSessionState = sessionFromWorkout(w);
      if (session) return setConflict(next);
      setSession(next);
      setMinimized(false);
    },
    openSession: () => setMinimized(false),
  };
  const saveCurrent = async (cap: boolean) => {
    if (!session || doneCount(session) === 0) return;
    await saveRow.mutateAsync(toWorkoutRow(session, Date.now(), session.rpe ?? 7, cap));
  };
  const replaceWith = async (next: LiveSessionState, keep: boolean) => {
    try {
      if (keep) await saveCurrent(false);
      if (keep && session && doneCount(session) > 0) toast.success(tr("Previous session saved"));
      setConflict(null);
      setSession(next);
      setMinimized(false);
    } catch (e) {
      toast.error(errorText((e as Error).message));
    }
  };
  const staleSets = session ? doneCount(session) : 0;

  return (
    <ShellCtx.Provider value={api}>
      <FeaturePreferences />
      <div className="relative mx-auto min-h-dvh max-w-md bg-background md:border-x md:border-border">
        {mode !== "live" && <DemoPill role={role} />}
        <main className="px-5 pb-36 pt-4">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
        <TabBar role={personal ? "solo" : role} onPlus={() => setHub(true)} />
        <AnimatePresence>
          {hub && (
            <LogHub
              onClose={() => setHub(false)}
              onPick={(k) => (k === "workout" ? api.startSession() : api.log(k))}
            />
          )}
        </AnimatePresence>
        <LogSheets key={`${kind}-${meal}`} kind={kind} meal={meal} onClose={() => setKind(null)} />
        <Sheet
          open={!!conflict}
          onOpenChange={(o) => !o && setConflict(null)}
          title={tr("A session is already open")}
          sub={
            session
              ? tr("{p0} · {p1} sets logged", { p0: session.title, p1: doneCount(session) })
              : ""
          }
        >
          <div className="space-y-2">
            <Button
              wrap
              className="h-14 w-full rounded-full"
              variant="volt"
              onClick={() => (setConflict(null), setMinimized(false))}
            >
              <Message source="Resume current" />
            </Button>
            {session && doneCount(session) > 0 && !session.editingId && (
              <Button
                wrap
                className="h-14 w-full rounded-full"
                variant="secondary"
                disabled={saveRow.isPending}
                onClick={() => conflict && replaceWith(conflict, true)}
              >
                <Message source="Save current & start new" />
              </Button>
            )}
            <Button
              wrap
              className="h-14 w-full rounded-full text-destructive"
              variant="secondary"
              onClick={() => conflict && replaceWith(conflict, false)}
            >
              <Message source="Discard current & start new" />
            </Button>
          </div>
        </Sheet>
        <Sheet
          open={stale && !!session}
          onOpenChange={(o) => !o && setStale(false)}
          title={tr("Unfinished session")}
          sub={
            session
              ? tr("{p0} from {p1} · {p2} set{p3}", {
                  p0: session.title,
                  p1: format(lastActivity(session), "EEEE HH:mm"),
                  p2: staleSets,
                  p3: staleSets === 1 ? "" : "s",
                })
              : ""
          }
        >
          <div className="space-y-2">
            <Button
              wrap
              className="h-14 w-full rounded-full"
              variant="volt"
              onClick={() => (setStale(false), setMinimized(false))}
            >
              <Message source="Resume" />
            </Button>
            <Button
              wrap
              className="h-14 w-full rounded-full"
              variant="secondary"
              disabled={staleSets === 0 || saveRow.isPending}
              onClick={async () => {
                try {
                  await saveCurrent(true);
                  setStale(false);
                  setSession(null);
                  toast.success(tr("Session saved"), {
                    description: "Duration ends at your last completed set.",
                  });
                } catch (e) {
                  toast.error(errorText((e as Error).message));
                }
              }}
            >
              <Message source="Save as is" />
            </Button>
            <Button
              wrap
              className="h-14 w-full rounded-full text-destructive"
              variant="secondary"
              onClick={() => (setStale(false), setSession(null), setMinimized(false))}
            >
              <Message source="Discard" />
            </Button>
          </div>
        </Sheet>
        {session && (
          <LiveSession
            session={session}
            setSession={setSession}
            minimized={minimized}
            setMinimized={setMinimized}
            onClose={() => (setSession(null), setMinimized(false))}
          />
        )}
      </div>
    </ShellCtx.Provider>
  );
}

function DemoPill({ role }: { role: Role }) {
  useLanguage();
  const navigate = useNavigate();
  const router = useRouter();
  const switchRole = async () => {
    sessionStorage.setItem(DEMO_KEY, role === "trainer" ? "client" : "trainer");
    await router.invalidate();
    navigate({ to: "/app" });
  };
  return (
    <div className="sticky top-0 z-40 flex justify-center pt-2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-popover/90 py-1 pl-3 pr-1 text-caption font-semibold backdrop-blur">
        <span className="flex items-center gap-1.5 text-volt">
          <span className="size-1.5 rounded-full bg-primary" />{" "}
          <Message
            source="Demo · {p0}"
            values={{ p0: tr(role === "trainer" ? "Coach" : "Client") }}
          />
        </span>
        <button
          onClick={switchRole}
          className="flex min-h-[32px] items-center gap-1 rounded-full px-2.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftRight className="size-3.5" /> <Message source="Switch role" />
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem(DEMO_KEY);
            navigate({ to: "/" });
          }}
          className="min-h-[32px] rounded-full bg-surface-2 px-3 text-foreground"
        >
          <Message source="Exit" />
        </button>
      </div>
    </div>
  );
}

type Tab = { to: string; label: string; icon: typeof Home; exact?: boolean };
const clientTabs: Tab[] = [
  { to: "/app", label: "Today", icon: Home, exact: true },
  { to: "/app/train", label: "Train", icon: Dumbbell },
  { to: "/app/fuel", label: "Fuel", icon: Utensils },
  { to: "/app/recover", label: "Recover", icon: Moon },
  { to: "/app/progress", label: "Progress", icon: LineChart },
];
const coachTabs: Tab[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/clients", label: "Clients", icon: Users },
  { to: "/app/programs", label: "Programs", icon: ClipboardList },
  { to: "/app/me", label: "Profile", icon: User },
];

function TabBar({ role, onPlus }: { role: Role; onPlus: () => void }) {
  useLanguage();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tabs = role === "trainer" ? coachTabs : clientTabs;
  const isActive = (t: Tab) =>
    t.exact ? path === t.to || path === t.to + "/" : path.startsWith(t.to);
  const Item = (t: Tab) => (
    <Link
      key={t.to}
      to={t.to}
      aria-label={tr(t.label)}
      className="relative flex min-h-[56px] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 px-0.5 py-2"
    >
      {isActive(t) && (
        <motion.div
          layoutId="tab-dot"
          className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
        />
      )}
      <t.icon
        className={cn(
          "size-[22px] transition-colors",
          isActive(t) ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span
        className={cn(
          "max-w-full whitespace-normal break-words hyphens-auto text-center text-caption font-semibold [overflow-wrap:anywhere]",
          isActive(t) ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {tr(t.label)}
      </span>
    </Link>
  );
  return (
    <nav
      aria-label={tr("Main")}
      className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-background/90 px-1 backdrop-blur-xl md:border-x"
    >
      <div className="flex items-center">
        {role === "trainer" ? (
          tabs.map(Item)
        ) : (
          <>
            {tabs.slice(0, 2).map(Item)}
            <motion.button
              whileTap={springPress}
              onClick={onPlus}
              aria-label={tr("Log something")}
              className="mx-1 -mt-6 grid size-14 shrink-0 place-items-center rounded-full bg-volt-gradient text-primary-foreground shadow-glow"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </motion.button>
            {tabs.slice(2).map(Item)}
          </>
        )}
      </div>
    </nav>
  );
}

function LogHub({ onClose, onPick }: { onClose: () => void; onPick: (k: LogKind) => void }) {
  useLanguage();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col justify-end bg-background/85 p-5 pb-28 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-label={tr("Log")}
    >
      <div className="eyebrow mb-3">
        <Message source="What are you logging?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {logKinds.map((l, i) => (
          <motion.button
            key={l.kind}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: Math.min(i, 3) * 0.035,
              type: "spring",
              stiffness: 420,
              damping: 30,
            }}
            whileTap={springPress}
            onClick={(e) => {
              e.stopPropagation();
              onPick(l.kind);
            }}
            className={cn(
              "panel flex min-h-[64px] items-center gap-3 p-4 text-left",
              i === 0 && "col-span-2",
            )}
          >
            <l.icon className={cn("size-6", l.tone)} />
            <div>
              <div className="font-display text-title font-bold">
                {i === 0 ? tr("Start workout") : l.label}
              </div>
              {i === 0 && (
                <div className="text-caption text-muted-foreground">
                  <Message source="Live session with rest timer" />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
      <motion.button
        whileTap={springPress}
        onClick={onClose}
        aria-label={tr("Close")}
        className="mx-auto mt-6 grid size-14 place-items-center rounded-full bg-surface-2"
      >
        <X />
      </motion.button>
    </motion.div>
  );
}

function Onboarding() {
  useLanguage();
  const [role, setRole] = useState<Role | null>(null);
  const save = useAct((api, r: Role) => api.setRole(r));
  const opts: { role: Role; title: string; body: string }[] = [
    { role: "solo", title: "Solo", body: "Track training, food, sleep and mood on your own." },
    { role: "client", title: "Client", body: "Work with a coach. Get programs and feedback." },
    { role: "trainer", title: "Coach", body: "Coach clients, build programs, see everything." },
  ];
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background px-5 py-10">
      <div className="mb-5 flex justify-end">
        <LanguageSelector compact />
      </div>
      <div className="eyebrow">
        <Message source="Welcome to Kinra" />
      </div>
      <h1 className="mt-2 font-display text-title-l font-black [font-stretch:115%]">
        <Message source="How will you use it?" />
      </h1>
      <div className="mt-8 space-y-3" role="radiogroup">
        {opts.map((o) => (
          <motion.button
            key={o.role}
            whileTap={springPress}
            role="radio"
            aria-checked={role === o.role}
            onClick={() => setRole(o.role)}
            className={cn(
              "panel w-full p-5 text-left transition-shadow",
              role === o.role && "ring-2 ring-primary",
            )}
          >
            <div className="font-display text-title font-bold">{tr(o.title)}</div>
            <div className="mt-1 text-label text-muted-foreground">{tr(o.body)}</div>
          </motion.button>
        ))}
        <div className="panel p-5 opacity-60">
          <div className="font-display text-title font-bold">
            <Message source="Gym · Doctor · Nutritionist" />
          </div>
          <div className="mt-1 text-label text-muted-foreground">
            <Message source="Coming soon." />
          </div>
        </div>
      </div>
      <motion.button
        whileTap={springPress}
        className="mt-auto min-h-14 w-full whitespace-normal break-words rounded-full bg-volt-gradient px-4 py-3 text-center font-semibold hyphens-auto text-primary-foreground disabled:opacity-50"
        disabled={!role || save.isPending}
        onClick={() =>
          role && save.mutate(role, { onError: (e) => toast.error(errorText(e.message)) })
        }
      >
        <Message source="Continue" />
      </motion.button>
    </div>
  );
}
