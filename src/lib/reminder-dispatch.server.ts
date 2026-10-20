import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import push from "web-push";
import { validPushEndpoint } from "./notifications";

interface Delivery {
  deliveryId: string;
  locale: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
}
export async function dispatchReminders(request: Request): Promise<Response> {
  const token = process.env["KINRA_PUSH_DISPATCH_SECRET"];
  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${token}`;
  const suppliedBytes = Buffer.from(authorization);
  const expectedBytes = Buffer.from(expected);
  if (
    !token ||
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  )
    return new Response("Unauthorized", { status: 401 });
  const publicKey = process.env["KINRA_VAPID_PUBLIC_KEY"];
  const privateKey = process.env["KINRA_VAPID_PRIVATE_KEY"];
  const url = process.env["VITE_SUPABASE_URL"];
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!publicKey || !privateKey || !url || !key)
    return new Response("Not configured", { status: 503 });
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const prefix = process.env["VITE_KINRA_TABLE_PREFIX"] === "kinra_v2_" ? "kinra_v2_" : "";
  const { data, error } = await client.rpc(`${prefix}kinra_push_due`, { token });
  if (error || !Array.isArray(data)) {
    console.error("reminder-dispatch-claim-failed", error?.code);
    return new Response("Retry later", { status: 503 });
  }
  let submitted = 0;
  // Small batches avoid unbounded provider requests and expose no private titles.
  for (let offset = 0; offset < data.length; offset += 10) {
    await Promise.all(
      (data as Delivery[]).slice(offset, offset + 10).map(async (delivery) => {
        let code = 400;
        if (validPushEndpoint(delivery.subscription.endpoint)) {
          try {
            const result = await push.sendNotification(
              delivery.subscription,
              JSON.stringify({ locale: delivery.locale, id: delivery.deliveryId }),
              {
                TTL: 60,
                timeout: 10000,
                vapidDetails: { subject: "https://kinra.fit", publicKey, privateKey },
              },
            );
            code = result.statusCode;
            submitted++;
          } catch (error) {
            code = Number((error as { statusCode?: number }).statusCode ?? 503);
          }
        }
        const ack = await client.rpc(`${prefix}kinra_push_ack`, {
          token,
          delivery: delivery.deliveryId,
          code,
        });
        if (ack.error) console.error("reminder-dispatch-ack-failed", ack.error.code);
      }),
    );
  }
  return Response.json(
    { claimed: data.length, submitted },
    { headers: { "Cache-Control": "no-store" } },
  );
}
