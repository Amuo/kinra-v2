import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { validPushEndpoint } from "./notifications";

export const notificationConfiguration = createServerFn({ method: "GET" }).handler(async () => ({
  publicKey: process.env["KINRA_VAPID_PUBLIC_KEY"] ?? "",
  configured: !!(
    process.env["KINRA_VAPID_PUBLIC_KEY"] &&
    process.env["KINRA_VAPID_PRIVATE_KEY"] &&
    process.env["KINRA_PUSH_DISPATCH_SECRET"]
  ),
}));
export const testDeviceNotification = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) =>
    z
      .object({
        accessToken: z.string().min(20).max(10000),
        expectedOwner: z.string().uuid(),
        endpoint: z.string().url().max(3000),
      })
      .strict()
      .parse(value),
  )
  .handler(async ({ data }) => {
    const url = process.env["VITE_SUPABASE_URL"];
    const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    const publicKey = process.env["KINRA_VAPID_PUBLIC_KEY"];
    const privateKey = process.env["KINRA_VAPID_PRIVATE_KEY"];
    if (!url || !key || !publicKey || !privateKey)
      throw new Error("Device notifications are not configured yet.");
    const client = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const user = await client.auth.getUser(data.accessToken);
    if (user.error || user.data.user?.id !== data.expectedOwner)
      throw new Error("Your account changed. Reopen this screen before saving.");
    const table =
      process.env["VITE_KINRA_TABLE_PREFIX"] === "kinra_v2_"
        ? "kinra_v2_device_subscriptions"
        : "device_subscriptions";
    const result = await client.rpc(
      table === "kinra_v2_device_subscriptions"
        ? "kinra_v2_kinra_claim_push_test"
        : "kinra_claim_push_test",
      { subscription_endpoint: data.endpoint, expected_owner: data.expectedOwner },
    );
    if (result.error?.code === "23514")
      throw new Error("Wait one minute between notification tests, then try again.");
    if (result.error || !result.data || !validPushEndpoint(result.data["endpoint"]))
      throw new Error("Enable notifications on this device first.");
    const subscription = result.data;
    const { default: push } = await import("web-push");
    // Coalesce repeated test clicks in the browser; provider submission is not
    // a guarantee that the operating system displayed the notification.
    try {
      await push.sendNotification(
        {
          endpoint: subscription["endpoint"],
          keys: { p256dh: subscription["p256dh"], auth: subscription["auth_key"] },
        },
        JSON.stringify({ locale: subscription["locale"], id: "kinra-test" }),
        {
          TTL: 60,
          timeout: 10000,
          vapidDetails: { subject: "https://kinra.fit", publicKey, privateKey },
        },
      );
    } catch {
      throw new Error(
        "The push service could not accept this test. Try enabling this device again.",
      );
    }
    return { submitted: true };
  });
