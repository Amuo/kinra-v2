import { supabase } from "@/integrations/supabase/client";
import { from } from "./backend";
import { currentLanguage } from "./i18n";
import { notificationConfiguration, testDeviceNotification } from "./notification.functions";
import { validPushEndpoint, type NotificationApi } from "./notifications";

export function createLiveNotifications(ownerId: string): NotificationApi {
  const supported = () =>
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    window.isSecureContext;
  const auth = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || data.user?.id !== ownerId)
      throw new Error("Your account changed. Reopen this screen before saving.");
  };
  const subscription = async () =>
    (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
  return {
    async status() {
      const configuration = await notificationConfiguration();
      if (!supported())
        return {
          configured: configuration.configured,
          supported: false,
          permission: "unsupported",
          enabled: false,
        };
      await auth();
      const device = await subscription();
      const row = device
        ? await from("device_subscriptions")
            .select("id")
            .eq("owner_id", ownerId)
            .eq("endpoint", device.endpoint)
            .maybeSingle()
        : null;
      if (row?.error) throw row.error;
      return {
        configured: configuration.configured,
        supported: true,
        permission: Notification.permission,
        enabled: !!row?.data && Notification.permission === "granted",
      };
    },
    async enable() {
      if (!supported()) throw new Error("This browser does not support device notifications.");
      // Permission is requested immediately from an explicit click gesture.
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error("Allow notifications in your browser settings to enable reminders.");
      await auth();
      const configuration = await notificationConfiguration();
      if (!configuration.configured)
        throw new Error("Device notifications are not configured yet.");
      const registration = await navigator.serviceWorker.register("/kinra-sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const old = await registration.pushManager.getSubscription();
      if (old) {
        const removed = await from("device_subscriptions")
          .delete()
          .eq("owner_id", ownerId)
          .eq("endpoint", old.endpoint);
        if (removed.error) throw removed.error;
        await old.unsubscribe();
      }
      const raw = Uint8Array.from(
        atob(configuration.publicKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      const device = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: raw,
      });
      const json = device.toJSON();
      if (!validPushEndpoint(device.endpoint) || !json.keys?.["p256dh"] || !json.keys["auth"]) {
        await device.unsubscribe();
        throw new Error("This browser's push service is not supported yet.");
      }
      await auth();
      const saved = await from("device_subscriptions").insert({
        owner_id: ownerId,
        endpoint: device.endpoint,
        p256dh: json.keys["p256dh"],
        auth_key: json.keys["auth"],
        locale: currentLanguage(),
      });
      if (saved.error) {
        await device.unsubscribe();
        throw saved.error;
      }
    },
    async disable() {
      await auth();
      if (!supported()) return;
      const device = await subscription();
      if (!device) return;
      const removed = await from("device_subscriptions")
        .delete()
        .eq("owner_id", ownerId)
        .eq("endpoint", device.endpoint);
      if (removed.error) throw removed.error;
      await device.unsubscribe();
    },
    async test() {
      await auth();
      if (!supported()) throw new Error("This browser does not support device notifications.");
      const device = await subscription();
      const { data, error } = await supabase.auth.getSession();
      if (error || !device || !data.session)
        throw new Error("Enable notifications on this device first.");
      await testDeviceNotification({
        data: {
          accessToken: data.session.access_token,
          expectedOwner: ownerId,
          endpoint: device.endpoint,
        },
      });
    },
  };
}
export function createDemoNotifications(): NotificationApi {
  const unavailable = async () => {
    throw new Error("Device notifications require a live account.");
  };
  return {
    status: async () => {
      const supported =
        typeof window !== "undefined" &&
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        window.isSecureContext;
      return {
        configured: false,
        supported,
        permission: supported ? Notification.permission : "unsupported",
        enabled: false,
      };
    },
    enable: unavailable,
    disable: unavailable,
    test: unavailable,
  };
}
