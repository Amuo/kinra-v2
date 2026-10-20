import { MemberPass } from "@/components/strata/business-pass";
import { CommunityGroups } from "@/components/strata/community-groups";
import { DeviceReminders } from "@/components/strata/device-reminders";
import { OrganizationTools } from "@/components/strata/organization-tools";
import { AvailabilityBooking } from "@/components/strata/availability-booking";
import { AccountWorkspaces } from "@/components/strata/account-workspaces";
import { accountRoleLabels } from "@/lib/workspaces";
import { errorText } from "@/lib/i18n-errors";
import { LanguageSelector } from "@/components/strata/language-selector";
import { roleLabel, t as tr, useLanguage, Message } from "@/lib/i18n";
import { Onboarding } from "@/components/strata/onboarding";
import { PrivateMessages } from "@/components/strata/private-messages";
import { DeleteKinraData } from "@/components/strata/delete-kinra-data";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  LogOut,
  UserPlus,
  Dumbbell,
  Users,
  Camera,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAct, useApi, useMe, useQ } from "@/lib/api";
import { Avatar, PageHeader, Panel, SectionTitle } from "@/components/strata/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAppView } from "@/components/strata/app-view";
import { Textarea } from "@/components/ui/textarea";
import type { Me, Person } from "@/lib/types";
import { Sheet } from "@/components/strata/sheets";
import { ErrorState } from "@/components/strata/ui";

const FeatureHub = lazy(() =>
  import("@/components/strata/feature-hub").then((m) => ({ default: m.FeatureHub })),
);

export const Route = createFileRoute("/app/me")({
  head: () => ({
    meta: [
      { title: tr("Your profile — Kinra") },
      { name: "description", content: "Manage your Kinra profile and coach connection." },
      { property: "og:title", content: "Your profile — Kinra" },
      { property: "og:description", content: "Manage your Kinra profile and coach connection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MePage,
});

function MePage() {
  useLanguage();
  const me = useMe().data;
  const { personal, setView } = useAppView();
  const api = useApi();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [code, setCode] = useState("");
  const trainers = useQ(["trainers"], (a) => a.trainers(), me?.role !== "trainer");
  const [disconnect, setDisconnect] = useState<Person | null>(null);
  const leave = useAct((a, id: string) => a.disconnectTrainer(id));
  const join = useAct((a, c: string) => a.joinTrainer(c));

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    if (api.mode === "live") await supabase.auth.signOut();
    sessionStorage.removeItem("strata-demo");
    navigate({ to: "/", replace: true });
  };

  if (!me) return null;
  return (
    <div>
      <PageHeader
        eyebrow={me.workspace ? tr(accountRoleLabels[me.workspace]) : roleLabel(me.role)}
        title={tr("Profile")}
      />
      <Button
        wrap
        variant="outline"
        className="mb-3 min-h-12 w-full"
        onClick={() => setSetupOpen(true)}
      >
        {tr("Personalize your setup")}
      </Button>
      {setupOpen && (
        <Sheet open onOpenChange={setSetupOpen} title={tr("Your Kinra setup")}>
          <Onboarding embedded onClose={() => setSetupOpen(false)} />
        </Sheet>
      )}
      <Button variant="volt" className="mb-4 h-12 w-full" onClick={() => setToolsOpen(true)}>
        <Message source="Explore your Kinra toolkit" />
      </Button>
      {toolsOpen && (
        <Sheet
          open
          onOpenChange={setToolsOpen}
          title={tr("Explore Kinra")}
          sub={tr("Your library, routines and community.")}
        >
          <Suspense
            fallback={
              <p role="status">
                <Message source="Loading your tools…" />
              </p>
            }
          >
            <FeatureHub />
          </Suspense>
        </Sheet>
      )}
      <div className="mb-5">
        <LanguageSelector />
      </div>
      <Panel className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
        <Avatar name={me.display_name} src={me.avatar_url} size={72} />
        <div className="min-w-0">
          <div className="break-words font-display text-title font-bold">{me.display_name}</div>
          <div className="text-label capitalize text-muted-foreground">
            {me.workspace ? tr(accountRoleLabels[me.workspace]) : roleLabel(me.role)}
          </div>
          {me.bio && <p className="mt-2 break-words text-body text-muted-foreground">{me.bio}</p>}
        </div>
      </Panel>

      <div className="mt-4">
        <PrivateMessages />
      </div>
      <AccountWorkspaces />
      <MemberPass />
      <OrganizationTools />
      <AvailabilityBooking />
      <DeviceReminders />
      <CommunityGroups />
      <DeleteKinraData />
      {me.role === "trainer" && (
        <>
          <SectionTitle>
            <Message source="App view" />
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { view: "coach", label: tr("Coaching"), icon: Users },
                { view: "personal", label: tr("My health"), icon: Dumbbell },
              ] as const
            ).map((option) => (
              <Button
                key={option.view}
                variant={(option.view === "personal") === personal ? "volt" : "glass"}
                aria-pressed={(option.view === "personal") === personal}
                className="h-14 text-label"
                onClick={() => {
                  setView(option.view);
                  navigate({ to: "/app" });
                }}
              >
                <option.icon />
                {tr(option.label)}
              </Button>
            ))}
          </div>
        </>
      )}

      {me.role === "trainer" && me.trainer_code && (
        <>
          <SectionTitle>
            <Message source="Your coach code" />
          </SectionTitle>
          <Panel className="grid-lines flex items-center justify-between">
            <div className="num break-all text-title-l font-bold text-volt">{me.trainer_code}</div>
            <Button
              variant="glass"
              size="icon"
              aria-label={tr("Copy code")}
              onClick={() => {
                if (me.trainer_code) {
                  navigator.clipboard.writeText(me.trainer_code);
                  toast.success(tr("Copied"));
                }
              }}
            >
              <Copy />
            </Button>
          </Panel>
          <p className="mt-2 text-caption text-muted-foreground">
            <Message source="Clients enter this code in their profile to connect with you." />
          </p>
        </>
      )}

      {me.role !== "trainer" && (
        <>
          <SectionTitle>
            <Message source="Coach" />
          </SectionTitle>
          {trainers.error ? (
            <ErrorState onRetry={() => trainers.refetch()} />
          ) : trainers.isPending ? (
            <p role="status">
              <Message source="Loading your connections…" />
            </p>
          ) : (
            <div className="space-y-3">
              {trainers.data?.map((trainer) => (
                <Panel key={trainer.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={trainer.display_name} src={trainer.avatar_url} />
                    <div className="font-semibold">{trainer.display_name}</div>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    <Message source="Can read your training, food, sleep, journal and progress photos, and assign programs." />
                  </p>
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDisconnect(trainer)}
                  >
                    <Message source="Disconnect coach" />
                  </Button>
                </Panel>
              ))}
            </div>
          )}
          {!trainers.isPending && !trainers.error && (
            <Panel>
              <div className="mb-3 text-label text-muted-foreground">
                <Message source="Have a code from your coach?" />
              </div>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={tr("ABC123")}
                  className="num h-11 bg-surface tracking-widest"
                  maxLength={6}
                />
                <Button
                  variant="volt"
                  className="h-11"
                  disabled={code.length < 6 || join.isPending}
                  onClick={() =>
                    join.mutate(code, {
                      onSuccess: (n) => toast.success(tr("Connected with {p0}", { p0: n })),
                      onError: (e) => toast.error(errorText(e.message)),
                    })
                  }
                >
                  <UserPlus /> <Message source="Join" />
                </Button>
              </div>
            </Panel>
          )}
          <Sheet
            open={!!disconnect}
            onOpenChange={(open) => {
              if (!open && !leave.isPending) setDisconnect(null);
            }}
            title={tr("Disconnect coach?")}
            sub={tr(
              "This revokes access to your logs and private photos. Previously delivered notes and reports remain in your history.",
            )}
          >
            <Button
              variant="destructive"
              className="h-12 w-full"
              disabled={leave.isPending}
              onClick={() =>
                disconnect &&
                leave.mutate(disconnect.id, {
                  onSuccess: () => {
                    setDisconnect(null);
                    toast.success(tr("Coach disconnected"));
                  },
                  onError: (e) => toast.error(errorText(e.message)),
                })
              }
            >
              <Message source="Disconnect {p0}" values={{ p0: disconnect?.display_name }} />
            </Button>
          </Sheet>
        </>
      )}

      <SectionTitle>
        <Message source="Details" />
      </SectionTitle>
      <ProfileEditor key={me.id} me={me} />

      <Button variant="ghost" className="mt-6 w-full text-destructive" onClick={signOut}>
        <LogOut /> {api.mode === "live" ? tr("Sign out") : tr("Exit demo")}
      </Button>
    </div>
  );
}

function ProfileEditor({ me }: { me: Me }) {
  useLanguage();
  const [name, setName] = useState(me.display_name ?? "");
  const [goal, setGoal] = useState(me.goal ?? "");
  const [bio, setBio] = useState(me.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const save = useAct((api) =>
    api.updateProfile({ display_name: name.trim(), goal: goal.trim(), bio: bio.trim() }),
  );
  const photo = useAct((api, file: File | null) => api.setAvatar(file));
  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP photo under 5 MB.");
      return;
    }
    setError(null);
    photo.mutate(file, {
      onSuccess: () => toast.success(tr("Profile photo updated")),
      onError: (e) => setError(e.message),
    });
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        save.mutate(undefined, {
          onSuccess: () => toast.success(tr("Profile updated")),
          onError: (e) => setError(e.message),
        });
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={tr("Profile photo file")}
          className="hidden"
          onChange={(e) => {
            choosePhoto(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="glass"
          disabled={photo.isPending}
          className="h-12 text-label"
          onClick={() => fileInput.current?.click()}
        >
          {photo.isPending ? <Loader2 className="animate-spin" /> : <Camera />}
          <Message source="Change photo" />
        </Button>
        {(me.avatar_url || me.avatar_path) && (
          <Button
            type="button"
            variant="ghost"
            disabled={photo.isPending}
            className="h-12 text-label text-destructive"
            onClick={() =>
              photo.mutate(null, {
                onSuccess: () => toast.success(tr("Photo removed")),
                onError: (e) => setError(e.message),
              })
            }
          >
            <Trash2 />
            <Message source="Remove photo" />
          </Button>
        )}
      </div>
      <label className="block">
        <span className="mb-2 block text-body font-semibold">
          <Message source="Display name" />
        </span>
        <Input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 bg-surface text-body"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-body font-semibold">
          <Message source="Your main goal" />
        </span>
        <Input
          maxLength={160}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={tr("What are you working toward?")}
          className="h-12 bg-surface text-body"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-body font-semibold">
          <Message source="About you" />
        </span>
        <Textarea
          maxLength={500}
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={tr("A little about your training and interests")}
          className="bg-surface text-body"
        />
      </label>
      {error && (
        <p role="alert" className="text-body text-destructive">
          {errorText(error)}
        </p>
      )}
      <Button
        type="submit"
        variant="volt"
        disabled={!name.trim() || save.isPending || photo.isPending}
        className="h-14 w-full text-body"
      >
        {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
        <Message source="Save profile" />
      </Button>
    </form>
  );
}
