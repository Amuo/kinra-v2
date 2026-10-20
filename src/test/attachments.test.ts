// @vitest-environment node
import { describe, expect, it } from "vitest";
import { inspectAttachment } from "../lib/attachments";
import { validPushEndpoint } from "../lib/notifications";

describe("private file and push destinations", () => {
  it("accepts actual supported signatures and rejects renamed active content", async () => {
    await expect(
      inspectAttachment(
        new File(["%PDF-1.7\nexample"], "../private.pdf", { type: "application/pdf" }),
      ),
    ).resolves.toMatchObject({ filename: "..private.pdf", extension: "pdf" });
    await expect(
      inspectAttachment(new File(["<html>bad</html>"], "report.pdf", { type: "application/pdf" })),
    ).rejects.toThrow("contents");
    await expect(
      inspectAttachment(new File(["%PDF-1.7"], "report.png", { type: "image/png" })),
    ).rejects.toThrow("contents");
    await expect(
      inspectAttachment(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "too-big.pdf", {
          type: "application/pdf",
        }),
      ),
    ).rejects.toThrow("10 MB");
  });
  it("restricts outbound encrypted pushes to production push services", () => {
    for (const url of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://web.push.apple.com/abc",
      "https://wns2-db.notify.windows.com/abc",
    ])
      expect(validPushEndpoint(url)).toBe(true);
    for (const url of [
      "https://localhost/x",
      "https://169.254.169.254/x",
      "https://fcm.googleapis.com.evil.test/x",
      "https://evil.test@fcm.googleapis.com/x",
      "http://fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
      "https://fcm.googleapis.com\\@evil.test/x",
    ])
      expect(validPushEndpoint(url)).toBe(false);
  });
});
