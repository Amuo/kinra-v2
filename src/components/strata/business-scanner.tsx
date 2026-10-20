import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t, useLanguage } from "@/lib/i18n";

/** Camera and keyboard scanners submit the same opaque token to the API. */
export function BusinessScanner({
  onScan,
  busy,
}: {
  onScan: (token: string) => void;
  busy: boolean;
}) {
  useLanguage();
  const [token, setToken] = useState("");
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const scan = useRef(onScan);
  scan.current = onScan;
  useEffect(() => {
    if (!camera) return;
    const element = video.current;
    let cancelled = false;
    let controls: { stop: () => void } | undefined;
    void (async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        if (cancelled || !element) return;
        const next = await new BrowserQRCodeReader().decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          element,
          (result) => {
            if (!result || cancelled) return;
            cancelled = true;
            controls?.stop();
            setCamera(false);
            scan.current(result.getText());
          },
        );
        controls = next;
        if (cancelled) next.stop();
      } catch {
        if (!cancelled) {
          setError(true);
          setCamera(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      controls?.stop();
      const stream = element?.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [camera]);
  return (
    <div className="space-y-4">
      {camera && (
        <video
          ref={video}
          muted
          playsInline
          autoPlay
          aria-label={t("Entry camera preview")}
          className="aspect-video w-full rounded-2xl bg-black object-cover"
        />
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="volt"
          className="min-h-12"
          disabled={busy}
          onClick={() => {
            setError(false);
            setCamera(!camera);
          }}
        >
          <Camera aria-hidden="true" />
          {t(camera ? "Stop camera" : "Scan member QR")}
        </Button>
        <span className="self-center text-sm text-muted-foreground">
          {t("USB scanner or manual code also supported.")}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("Camera unavailable. Use a USB scanner or enter the pass code.")}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (token.trim() && !busy) {
            onScan(token.trim());
            setToken("");
          }
        }}
        className="space-y-2"
      >
        <label htmlFor="business-pass-code" className="text-sm font-medium">
          {t("Member pass code")}
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="business-pass-code"
            autoComplete="off"
            spellCheck={false}
            value={token}
            disabled={busy}
            onChange={(event) => setToken(event.target.value)}
            className="min-h-12 min-w-0 flex-1"
          />
          <Button
            type="submit"
            variant="secondary"
            className="min-h-12"
            disabled={busy || !token.trim()}
          >
            <ScanLine aria-hidden="true" />
            {t(busy ? "Checking…" : "Check entry")}
          </Button>
        </div>
      </form>
    </div>
  );
}
