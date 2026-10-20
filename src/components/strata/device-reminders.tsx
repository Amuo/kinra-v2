import { lazy, Suspense, useState } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { useAct, useQ } from "@/lib/api";
import { t, useLanguage } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { Button } from "@/components/ui/button";
import { Sheet } from "./sheets";
import { ErrorState, Skeleton } from "./ui";
const FeatureWorkspace = lazy(() =>
  import("./feature-hub").then((m) => ({ default: m.FeatureWorkspace })),
);
export function DeviceReminders() {
  useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button wrap variant="glass" className="mt-3 min-h-12 w-full" onClick={() => setOpen(true)}>
        <Bell aria-hidden="true" />
        {t("Device reminders")}
      </Button>
      {open && (
        <Sheet open onOpenChange={setOpen} title={t("Device reminders")}>
          <ReminderSettings />
        </Sheet>
      )}
    </>
  );
}
function ReminderSettings() {
  const status = useQ(["device-notifications"], (api) => api.notifications.status());
  const [workspace, setWorkspace] = useState<"reminder" | "notification_preferences" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const action = useAct(async (api, command: "enable" | "disable" | "test") => {
    if (command === "enable") await api.notifications.enable();
    else if (command === "disable") await api.notifications.disable();
    else await api.notifications.test();
  });
  const run = (command: "enable" | "disable" | "test") => {
    setError("");
    setMessage("");
    action.mutate(command, {
      onSuccess: () => {
        setMessage(
          t(
            command === "enable"
              ? "Reminders enabled on this device."
              : command === "disable"
                ? "Reminders disabled on this device."
                : "Test requested. Delivery may depend on your device settings and connection.",
          ),
        );
        void status.refetch();
      },
      onError: (cause) => {
        setError(errorText(cause));
        void status.refetch();
      },
    });
  };
  const state = status.data;
  return (
    <div className="space-y-4">
      <p className="text-label text-muted-foreground">
        {t(
          "Choose whether this device may receive reminders. Notifications use generic private text; scheduled reminders respect your quiet hours.",
        )}
      </p>
      {status.isLoading ? (
        <Skeleton className="h-32" />
      ) : status.error ? (
        <ErrorState onRetry={() => status.refetch()} />
      ) : (
        state && (
          <div className="space-y-3 rounded-tile border border-border bg-surface p-4">
            <p className="text-label font-semibold">
              {t(state.enabled ? "Enabled on this device" : "Not enabled on this device")}
            </p>
            {!state.configured && (
              <p className="text-label text-muted-foreground">
                {t(
                  "Device delivery is not configured here. Real push reminders are available only in the live app when the service is configured.",
                )}
              </p>
            )}
            {!state.supported && (
              <p className="text-label text-muted-foreground">
                {t("This browser does not currently support device notifications.")}
              </p>
            )}
            {state.permission === "denied" && (
              <p className="text-label text-muted-foreground">
                {t(
                  "Notifications are blocked in your browser settings. Change that permission there, then refresh this status.",
                )}
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              {t(
                "On iPhone or iPad, you may need to add Kinra to your Home Screen and open it there before enabling notifications.",
              )}
            </p>
            <Button
              wrap
              variant="volt"
              className="min-h-12 w-full"
              disabled={
                action.isPending ||
                (!state.enabled &&
                  (!state.configured || !state.supported || state.permission === "denied"))
              }
              onClick={() => run(state.enabled ? "disable" : "enable")}
            >
              {state.enabled ? <BellOff aria-hidden="true" /> : <Bell aria-hidden="true" />}
              {t(
                action.isPending
                  ? "Working…"
                  : state.enabled
                    ? "Disable on this device"
                    : "Enable on this device",
              )}
            </Button>
            <Button
              wrap
              variant="glass"
              className="min-h-12 w-full"
              disabled={action.isPending || !state.enabled}
              onClick={() => run("test")}
            >
              <Send aria-hidden="true" />
              {t("Test notification")}
            </Button>
            <Button
              wrap
              variant="ghost"
              className="min-h-11 w-full"
              disabled={action.isPending || status.isFetching}
              onClick={() => status.refetch()}
            >
              {t("Refresh device status")}
            </Button>
          </div>
        )
      )}
      {error && (
        <p role="alert" className="text-label text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-label text-muted-foreground">
          {message}
        </p>
      )}
      <p className="text-caption text-muted-foreground">
        {t(
          "Delivery is not guaranteed. Device power settings, permissions and connectivity can delay or prevent reminders.",
        )}
      </p>
      <div className="grid grid-cols-1 gap-2">
        <Button
          wrap
          variant="glass"
          className="min-h-12"
          onClick={() => setWorkspace(workspace === "reminder" ? null : "reminder")}
        >
          {t("Reminder schedules")}
        </Button>
        <Button
          wrap
          variant="glass"
          className="min-h-12"
          onClick={() =>
            setWorkspace(
              workspace === "notification_preferences" ? null : "notification_preferences",
            )
          }
        >
          {t("Quiet hours and categories")}
        </Button>
      </div>
      {workspace && (
        <section className="border-t border-border pt-4">
          <h3 className="mb-3 font-display text-title font-semibold">
            {t(workspace === "reminder" ? "Reminder schedules" : "Quiet hours and categories")}
          </h3>
          <Suspense fallback={<Skeleton className="h-32" />}>
            <FeatureWorkspace key={workspace} compact kind={workspace} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
