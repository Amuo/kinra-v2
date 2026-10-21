import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { t, useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Panel } from "./ui";

export function CoachCode({ code }: { code: string }) {
  useLanguage();
  const [copying, setCopying] = useState(false);
  return (
    <Panel className="grid-lines flex items-center justify-between gap-3">
      <div className="num min-w-0 select-text break-all text-title-l font-bold text-volt">
        {code}
      </div>
      <Button
        variant="glass"
        size="icon"
        className="size-11 shrink-0"
        disabled={copying}
        aria-label={t("Copy code")}
        onClick={async () => {
          setCopying(true);
          try {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
            await navigator.clipboard.writeText(code);
            toast.success(t("Copied"));
          } catch {
            toast.error(t("Couldn't copy the code. Select and copy it manually."));
          } finally {
            setCopying(false);
          }
        }}
      >
        <Copy />
      </Button>
    </Panel>
  );
}
